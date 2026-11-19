import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const root=fileURLToPath(new URL('../',import.meta.url));
const entry=path.join(root,'tests/browser/entry.mjs');
const output=path.resolve(root,process.env.SWAW_CHECK_BUILD||'public');
const parent=fs.realpathSync(os.tmpdir());
let work,defaultReport;
function cli(args=[],cwd=work) {
  const result=spawnSync(process.execPath,[entry,...args],{cwd,encoding:'utf8',timeout:60000});
  assert.ifError(result.error);return result;
}
function report(result) {
  const file=result.stdout.match(/JSON report: (.+)/)?.[1].trim();assert.ok(file,result.stdout+result.stderr);
  return JSON.parse(fs.readFileSync(file,'utf8'));
}
before(()=>{
  assert.ok(fs.existsSync(path.join(output,'index.html')),'Supply a site build through SWAW_CHECK_BUILD.');
  fs.mkdirSync(parent,{recursive:true});work=fs.mkdtempSync(path.join(parent,'browser-entry-tests-'));
});
after(()=>{
  if(defaultReport){assert.equal(path.dirname(fs.realpathSync.native(defaultReport)),fs.realpathSync.native(os.tmpdir()));assert.ok(path.basename(defaultReport).startsWith('browser-smoke-'));fs.rmSync(defaultReport,{recursive:true,force:true});}
  if(work){assert.equal(path.dirname(work),parent);fs.rmSync(work,{recursive:true,force:true});}
});

test('help and scenario discovery need no build and create no reports',()=>{
  const help=cli(['--help']);assert.equal(help.status,0,help.stderr);assert.match(help.stdout,/--next <dir>/);
  for(const suite of ['main','smoke','security','prefetch','updates','disable','design','webkit']) {
    const listed=cli(['--suite',suite,'--list']);assert.equal(listed.status,0,listed.stderr);assert.ok(listed.stdout.trim());
    if(['updates','disable'].includes(suite))assert.match(listed.stdout,/requires --next/);
  }
  assert.deepEqual(fs.readdirSync(work),[]);
});

test('invalid selection fails before builds, browser launch or report creation',()=>{
  for(const [args,message] of [
    [['--suite','missing'],/Unknown suite/],
    [['--suite','smoke','--only','missing'],/Unknown scenario/],
    [['--suite','smoke','--only','home-shell-smoke,home-shell-smoke'],/distinct/],
    [['--suite','updates'],/require --next/],
    [['--suite','disable'],/require --next/],
    [['--suite','smoke','--next','missing'],/requires a suite/],
    [['--timeout','0'],/positive integer/],
    [['--unknown'],/Unknown or repeated option/]
  ]) {const result=cli(args);assert.equal(result.status,1,result.stdout);assert.match(result.stderr,message);}
  assert.deepEqual(fs.readdirSync(work),[]);
});

test('default public ignores newer temporary builds and retains Chromium traces',{timeout:60000},()=>{
  fs.symlinkSync(output,path.join(work,'public'),'junction');
  const newer=path.join(work,'temp_workspace/public/newer');fs.mkdirSync(newer,{recursive:true});
  fs.writeFileSync(path.join(newer,'index.html'),'<title>Wrong build</title>');
  const result=cli(['--suite','smoke','--trace']),checked=report(result);
  defaultReport=checked.outputDir;
  assert.equal(result.status,0,result.stdout+result.stderr);
  assert.equal(checked.browser,'chromium');assert.ok(checked.browserVersion);
  assert.equal(path.dirname(fs.realpathSync.native(defaultReport)),fs.realpathSync.native(os.tmpdir()));
  assert.equal(checked.primaryBuildDir,fs.realpathSync(output));assert.equal(checked.totals.passed,3);assert.equal(checked.totals.failed,0);
  for(const scenario of checked.scenarios)assert.ok(fs.statSync(scenario.artifacts.trace).size>0);
});

test('same next build and reports inside builds are rejected before writes',()=>{
  const same=cli([output,'--suite','updates','--next',output]);
  assert.equal(same.status,1);assert.match(same.stderr,/different build/);
  const destination=path.join(output,'never-create-browser-report');
  const inside=cli([output,'--suite','smoke','--out',destination]);
  assert.equal(inside.status,1);assert.match(inside.stderr,/outside the published build/);
  assert.equal(fs.existsSync(destination),false);
});

test('WebKit selection runs its existing first-paint scenario and records the engine',{timeout:60000},()=>{
  const result=cli([output,'--suite','webkit','--only','canvas-first-frame-slow-runtime','--out',path.join(work,'webkit-reports')]);
  assert.equal(result.status,0,result.stdout+result.stderr);
  const checked=report(result);assert.equal(checked.browser,'webkit');assert.ok(checked.browserVersion);
  assert.equal(checked.scenarios.length,1);assert.equal(checked.totals.passed,1);
  for(const state of checked.scenarios[0].details.cases)assert.deepEqual(state.final.directoryMetadata,state.first.directoryMetadata);
});

test('main runs site static checks and reports the selected browser failure',{timeout:60000},()=>{
  const broken=path.join(work,'broken');fs.cpSync(output,broken,{recursive:true});
  fs.appendFileSync(path.join(broken,'index.html'),'<script src="/entry-test-missing.js"></script>');
  const result=cli([broken,'--only','home-shell-smoke','--out',path.join(work,'failure-reports')]);
  assert.equal(result.status,1,result.stdout+result.stderr);
  assert.match(result.stdout,/\[STATIC\] nav:/);assert.match(result.stdout,/\[STATIC\] info:/);assert.match(result.stdout,/\[STATIC\] meta:/);
  const checked=report(result);assert.equal(checked.totals.failed,1);assert.equal(checked.scenarios.length,1);
  assert.ok(fs.statSync(checked.scenarios[0].artifacts.screenshot).size>0);
});
