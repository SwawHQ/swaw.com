import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {selectSuite} from './suites.mjs';
import {parseArguments} from '../../.agents/skills/swaw-banyan/tasks/_shared/arguments.mjs';
import {runScenarioSuite} from '../../.agents/skills/swaw-banyan/tasks/check/browser/_shared/suite.mjs';
import {assertReportOutsideBuilds} from '../../.agents/skills/swaw-banyan/tasks/check/browser/_shared/artifacts.mjs';
import {check as checkNavigation} from '../output/nav/check.mjs';
import {check as checkInformation} from '../output/info/check.mjs';
import {check as checkMetadata} from '../output/meta/check.mjs';
import {command,help} from './options.mjs';

function buildDirectory(value) {
  const directory=path.resolve(value);
  if(!fs.statSync(path.join(directory,'index.html'),{throwIfNoEntry:false})?.isFile())
    throw new Error('Build has no index.html: '+directory);
  return fs.realpathSync(directory);
}

export function selection(options) {
  const suite=selectSuite(options.suite,options.only||[]);
  const hasUpdates=suite.scenarios.some(scenario=>scenario.kind==='upgrade');
  if((suite.requireNext||options.only&&hasUpdates)&&!options.next)throw new Error('Selected update scenarios require --next <dir>.');
  if(options.next&&!hasUpdates)throw new Error('--next requires a suite containing update scenarios.');
  const primaryBuildDir=buildDirectory(options.dir);
  const next=options.next?buildDirectory(options.next):null;
  if(next===primaryBuildDir)throw new Error('--next must select a different build.');
  return {...suite,primaryBuildDir,upgradePair:next?{fromDir:primaryBuildDir,toDir:next}:null};
}

export async function run(args=process.argv.slice(2)) {
  const spec=command(),options=parseArguments(spec,args);
  if(options===null){console.log(help());return;}
  if(options.list){
    for(const scenario of selectSuite(options.suite,options.only||[]).scenarios)
      console.log(scenario.id+'  # '+scenario.title+(scenario.kind==='upgrade'?' [requires --next]':''));
    return;
  }
  const selected=selection(options);
  const output=path.resolve(options.out||os.tmpdir());
  await assertReportOutsideBuilds(output,[selected.primaryBuildDir,...(selected.upgradePair?[selected.upgradePair.toDir]:[])]);
  if(selected.staticChecks)for(const [name,check] of [['nav',checkNavigation],['info',checkInformation],['meta',checkMetadata]]) {
    const result=await check(selected.primaryBuildDir);console.log('[STATIC] '+name+': '+result.pages+' pages checked');
  }
  const browserType=selected.load();
  fs.mkdirSync(output,{recursive:true});
  const outputDir=fs.mkdtempSync(path.join(output,'browser-'+options.suite+'-'));
  console.log('Primary build: '+selected.primaryBuildDir);
  if(selected.upgradePair)console.log('Next build: '+selected.upgradePair.toDir);
  return runScenarioSuite({scenarios:selected.scenarios,primaryBuildDir:selected.primaryBuildDir,upgradePair:selected.upgradePair,
    outputDir,browserType,headless:!options.headed,trace:options.trace,timeout:options.timeout,modeName:options.suite});
}
