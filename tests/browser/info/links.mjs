import assert from 'node:assert/strict';
import {check as checkTabs} from '../../../.agents/skills/swaw-banyan/tasks/check/browser/nav/tabs/check.mjs';
import {check as checkRoots} from '../../../.agents/skills/swaw-banyan/tasks/check/browser/nav/roots/check.mjs';

export const informationLinkScenario={
  id:'info-links',kind:'single',serviceWorkers:'block',
  title:'Information Links, New Tabs and Native History',
  async run(args) {
    const roots=[],tabs=[];
    for(const prefix of ['','/zh','/zh-tw']) {
      roots.push(await checkRoots({...args,options:{from:prefix+'/powered-by/',pages:['icp','about','wechat','github','rss'].map(name=>prefix+'/'+name+'/')}}));
      for(const name of ['powered-by','icp','github','rss']) {
        const result=await checkTabs({...args,options:{page:prefix+'/'+name+'/',selector:'.slot-main .prose a[target="_blank"]:visible'}});
        if(name==='powered-by')assert.equal(result.links.filter(link=>link.href==='https://github.com/SwawHQ/banyan').length,1,'Banyan source link.');
        tabs.push(result);
      }
    }
    const pages=roots.reduce((count,result)=>count+result.cases.length,0);
    assert.equal(pages,15,'This site has five information root targets in three languages.');
    return {pages,roots,tabs};
  }
};
