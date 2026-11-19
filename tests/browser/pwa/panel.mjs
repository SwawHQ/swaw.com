import path from 'node:path';
import {check} from '../../../.agents/skills/swaw-banyan/tasks/check/browser/pwa/panel/check.mjs';

export const updatePanelScenario={
  id:'pwa-panel-history',kind:'single',serviceWorkers:'block',viewport:{width:1024,height:700},
  title:'Update Panel Rendering Across Reload and History',
  async run(args) {
    const results=[];
    for(const prefix of ['','/zh','/zh-tw']) {
      results.push(await check({...args,options:{page:prefix+'/powered-by/',from:prefix+'/about/',widths:'390,1024'}}));
      if(prefix==='/zh') {
        await args.page.screenshot({path:path.join(args.artifactDir,'panel-desktop.png')});
        await args.page.setViewportSize({width:390,height:844});
        await args.page.locator('[data-site-status-panel]').scrollIntoViewIfNeeded();
        await args.page.screenshot({path:path.join(args.artifactDir,'panel-mobile.png')});
      }
    }
    return {languages:results.length,results};
  }
};
