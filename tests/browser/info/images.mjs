import assert from 'node:assert/strict';
import path from 'node:path';
import {check as checkImages} from '../../../.agents/skills/swaw-banyan/tasks/check/browser/img/load/check.mjs';

export const informationImageScenario={
  id:'info-images',kind:'single',serviceWorkers:'block',viewport:{width:1024,height:700},
  title:'Information Image Loading, Colors and Geometry',
  async run({page,baseUrl,artifactDir}) {
    const results=[];
    for(const prefix of ['','/zh','/zh-tw']) {
      const icon=await checkImages({page,baseUrl,options:{page:prefix+'/powered-by/',selector:'[data-root-href="'+prefix+'/"] img.icon--image'}});
      assert.equal(icon.images.length,1,'The Home entry has one image icon.');
      assert.deepEqual({width:icon.images[0].width,height:icon.images[0].height},{width:15,height:15},'Home icon geometry');
      results.push(icon);
      for(const name of ['icp','wechat','github']) {
        const result=await checkImages({page,baseUrl,options:{page:prefix+'/'+name+'/',selector:'.slot-main .prose img'}});results.push(result);
        if(name==='github') {
          assert.equal(result.images.length,1,'GitHub has one organization avatar.');
          const image=result.images[0];
          assert.equal(image.link,'https://github.com/SwawHQ');
          assert.deepEqual({width:image.width,naturalRatio:image.naturalWidth/image.naturalHeight},{width:64,naturalRatio:1},'Organization avatar geometry');
          assert.equal(await page.locator('.slot-main .prose a[href="https://github.com/SwawHQ"] img').evaluate(node=>getComputedStyle(node).filter),'none','The shared favicon keeps its original colors.');
        }
        if(prefix==='/zh')await page.screenshot({path:path.join(artifactDir,'root-'+name+'.png')});
      }
    }
    return {languages:3,results};
  }
};
