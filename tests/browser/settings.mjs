import assert from 'node:assert/strict';
import {check as checkURL} from '../../.agents/skills/swaw-banyan/tasks/check/browser/settings/url/check.mjs';
import {check as checkHistory} from '../../.agents/skills/swaw-banyan/tasks/check/browser/settings/history/check.mjs';

const pages=['/zh/my/','/zh/appearance/','/zh/powered-by/','/zh/language/'];
export const settingsScenarios=[
  {
    id:'settings-query-preservation',kind:'single',serviceWorkers:'block',
    title:'Settings Preserve Unused URL and History Data',
    async run(args) {
      const results=[];
      for(const page of pages)results.push(await checkURL({...args,options:{page}}));
      return {pages:results};
    }
  },
  {
    id:'preference-return-live-navigation-state',kind:'single',serviceWorkers:'block',
    title:'Settings Chains, Native Tabs and No-History Returns',
    async run(args) {
      const collection=await checkHistory({...args,options:{from:'/zh/da/#sorts=name-asc&anchor=reading-position',pages}});
      assert.equal(await args.page.locator('[data-sort-field="name"][data-sort-active="true"]').count(),1,'Swaw collection must keep the requested name sort.');
      const article=await checkHistory({...args,options:{from:'/zh/p/coskill-trustworthy-collaboration/#from=da&sorts=name-asc&anchor=reading-position',pages}});
      assert.equal(await args.page.locator('[data-root-href="/zh/da/"].is-current').count(),1,'Swaw article returns keep the declared All source.');
      return {collection,article};
    }
  }
];
