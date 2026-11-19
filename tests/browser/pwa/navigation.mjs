import assert from 'node:assert/strict';
import {check as checkLifecycle} from '../../../.agents/skills/swaw-banyan/tasks/check/browser/pwa/lifecycle/check.mjs';
import {check as checkNative} from '../../../.agents/skills/swaw-banyan/tasks/check/browser/pwa/native/check.mjs';

function updateArgs(args,from) {
  assert.ok(args.upgradePair?.fromDir&&args.upgradePair?.toDir,'SW checks require two builds with different sw.js programs.');
  return {...args,options:{dir:args.upgradePair.fromDir,next:args.upgradePair.toDir,page:'/zh/powered-by/',from}};
}
export const updatesNavigationScenarios = [
  ...[{name:'home',href:'/zh/'},{name:'collection',href:'/zh/da/#sorts=name-asc'}].map(({name,href})=>({
    id:'sw-update-lifecycle-'+name,kind:'upgrade',title:'Program Update Waits for Controlled Pages to Close ('+name+')',
    run:args=>checkLifecycle(updateArgs(args,href))
  })),
  {id:'sw-update-native-navigation',kind:'upgrade',title:'Refresh, History, New Tabs and Ordinary Links Preserve Waiting Updates',
    run:args=>checkNative(updateArgs(args,'/zh/about/'))}
];
