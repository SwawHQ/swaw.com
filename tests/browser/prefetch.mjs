import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {parseToml} from '../../.agents/skills/swaw-banyan/tasks/_shared/parsers.mjs';
import {check as checkRules} from '../../.agents/skills/swaw-banyan/tasks/check/browser/prefetch/rules/check.mjs';
import {check as checkOverlap} from '../../.agents/skills/swaw-banyan/tasks/check/browser/prefetch/overlap/check.mjs';
import {check as checkDebug} from '../../.agents/skills/swaw-banyan/tasks/check/browser/prefetch/debug/check.mjs';

async function rulesAndOverlap(args,page) {
  const config=await fs.readFile(new URL('../../assets/site/delivery.toml',import.meta.url),'utf8');
  const enabled=parseToml(config).prefetch.enabled;
  assert.equal(typeof enabled,'boolean','delivery.toml must define prefetch.enabled as a boolean.');
  const rules=await checkRules({...args,options:{page,expect:enabled?'inline':'off'}});
  if(!enabled)return {rules};
  const overlap=await checkOverlap({...args,options:{page}});return {rules,overlap};
}

export const speculationScenarios=[
  {id:'speculation-rules-all',kind:'single',title:'Inline Speculation Rules: All',serviceWorkers:'allow',
    run:args=>rulesAndOverlap(args,'/da/')},
  {id:'speculation-rules-breadcrumb',kind:'single',title:'Inline Speculation Rules: Directory Path',serviceWorkers:'allow',
    run:args=>rulesAndOverlap(args,process.env.BANYAN_SPECULATION_BREADCRUMB_PATH||'/d/')},
  {id:'speculation-rules-prefetchdebug',kind:'single',title:'Inline Powered by Diagnostics in Every Language',serviceWorkers:'allow',
    async run(args){
      const results=[];
      for(const prefix of ['','/zh','/zh-tw']) {
        const page=prefix+'/powered-by/',outcome=await rulesAndOverlap(args,page);
        const debug=await checkDebug({...args,options:{page}}),details=args.page.locator('.prose details');
        assert.equal(await details.count(),1,'Diagnostics use one disclosure.');
        assert.equal(await details.getAttribute('open'),null,'Diagnostics start collapsed.');
        await details.locator('summary').click();
        assert.equal(await details.locator('#prefetch-debug-backend').isVisible(),true,'Expanding diagnostics reveals the backend control.');
        await details.locator('summary').click();
        assert.equal(await details.getAttribute('open'),null,'Diagnostics can collapse again.');
        results.push({...outcome,debug});
      }
      return {results};
    }}
];
