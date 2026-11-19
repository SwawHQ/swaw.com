import assert from 'node:assert/strict';
import {check} from '../../.agents/skills/swaw-banyan/tasks/check/browser/canvas/open/check.mjs';

export const touchOpeningScenario={
    id:'canvas-mobile-append-column',
    kind:'single',
    serviceWorkers:'block',
    viewport:{width:390,height:900},
    isMobile:true,
    hasTouch:true,
    title:'Opening a Product After a Real Touch Drag',
    async run(args) {
        const cases=[];
        for(const [from,drag] of [['/zh/pr/#sorts=name-desc',160],['/zh/pr/',320]]) {
            const result=await check({...args,options:{from,page:'/zh/p/xvenv/',widths:'390',touch:true,drag}});
            if(from.includes('#'))assert.equal(new URLSearchParams(new URL(result.cases[0].target,args.baseUrl).hash.slice(1)).get('sorts'),'name-desc');
            cases.push(result);
        }
        return {cases};
    }
};
