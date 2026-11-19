import {check as checkToggle} from '../../.agents/skills/swaw-banyan/tasks/check/browser/aside/toggle/check.mjs';
import {check as checkChapters} from '../../.agents/skills/swaw-banyan/tasks/check/browser/aside/chapters/check.mjs';
import {check as checkStyle} from '../../.agents/skills/swaw-banyan/tasks/check/browser/aside/style/check.mjs';
import {check as checkPrint} from '../../.agents/skills/swaw-banyan/tasks/check/browser/aside/print/check.mjs';
import assert from 'node:assert/strict';
import {gotoAndWait} from '../../.agents/skills/swaw-banyan/tasks/check/browser/_shared/page.mjs';

export const documentAsideScenarios = [{
    id: 'document-aside-navigation',
    kind: 'single',
    viewport: {width:390,height:800},
    serviceWorkers: 'block',
    title: 'Document Chapters, Aside Styles and Print',
    async run(args) {
        const page='/zh/p/swaw-kit-git/';
        const chapters=await checkChapters({...args,options:{page,widths:'390,1024,1800'}});
        await args.page.locator('#document-aside-close').click();
        const style=await checkStyle({...args,options:{page,widths:'390,1800'}});
        const print=await checkPrint({...args,options:{page}});
        for(const prefix of ['','/zh','/zh-tw']) {
            await gotoAndWait(args.page,args.baseUrl+prefix+'/about/');
            assert.equal(await args.page.locator('.document-meta, .document-toc, #document-aside, #document-aside-toggle').count(),0,'About disables metadata and the document aside: '+prefix);
        }
        return {chapters,style,print};
    }
}, ...[true,false].map(touch=>({
    id: touch ? 'document-aside-mobile-toggle' : 'document-aside-desktop-toggle',
    kind: 'single',
    serviceWorkers: 'block',
    isMobile: touch,
    hasTouch: touch,
    title: 'Aside Disclosure Preserves the Reading Column and Its Scroll Position',
    run: args=>checkToggle({...args,options:{page:'/zh/p/ssh-remote-kit-windows/',widths:touch?'320,390,430':'768,1800',touch}})
}))];
