import assert from 'node:assert/strict';
import {check as checkReturn} from '../../.agents/skills/swaw-banyan/tasks/check/browser/language/return/check.mjs';
import {check as checkBFCache} from '../../.agents/skills/swaw-banyan/tasks/check/browser/language/bfcache/check.mjs';
import {launchOptions} from '../../.agents/skills/swaw-banyan/tasks/check/browser/language/bfcache/options.mjs';

export const languageReturnScenarios=[
  {
    id:'language-return-boundaries',kind:'single',serviceWorkers:'block',
    title:'Missing Translation Return Preserves the Published Chinese Article',
    async run(args) {
      const result=await checkReturn({...args,options:{from:'/zh/p/swaw-kit-rdp-client/',page:'/zh/language/',to:'en'}});
      assert.equal(result.missingTranslation,true,'The RDP article only publishes its Chinese version.');
      assert.equal(result.returned,'/zh/p/swaw-kit-rdp-client/');
      assert.ok(result.notices.every(notice=>/English/.test(notice.text)),'Swaw missing-translation copy identifies English.');
      return result;
    }
  },
  {
    id:'language-return-bfcache',kind:'single',serviceWorkers:'block',
    title:'Selected Language Applies to Real BFCache Restorations',
    launchOptions,
    run:args=>checkBFCache({...args,options:{from:'/p/coskill-trustworthy-collaboration/#from=da&sorts=name-asc',page:'/language/',to:'zh',next:'zh-tw'}})
  }
];
