import assert from 'node:assert/strict';
import {check as checkReturn} from '../../.agents/skills/swaw-banyan/tasks/check/browser/language/return/check.mjs';
import {check as checkBFCache} from '../../.agents/skills/swaw-banyan/tasks/check/browser/language/bfcache/check.mjs';
import {launchOptions} from '../../.agents/skills/swaw-banyan/tasks/check/browser/language/bfcache/options.mjs';

export const languageReturnScenarios=[
  {
    id:'language-return-boundaries',kind:'single',serviceWorkers:'block',
    title:'Missing Translation Offers the English Home Page',
    async run(args) {
      // This check handles both cancel and accept on the missing-translation dialog.
      const page=await args.context.newPage();
      let result;
      try { result=await checkReturn({...args,page,options:{from:'/zh/p/swaw-kit-rdp-client/',page:'/zh/language/',to:'en'}}); }
      finally { await page.close(); }
      assert.equal(result.missingTranslation,true,'The RDP article only publishes its Chinese version.');
      assert.equal(result.returned,'/');
      return result;
    }
  },
  {
    id:'language-return-bfcache',kind:'single',serviceWorkers:'block',
    title:'Back and Forward Restore the Original and Translated Pages',
    launchOptions,
    run:args=>checkBFCache({...args,options:{from:'/p/coskill-trustworthy-collaboration/#from=da&sorts=name-asc',page:'/language/',to:'zh',next:'zh-tw'}})
  }
];
