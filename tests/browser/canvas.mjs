import {check as checkTouch} from '../../.agents/skills/swaw-banyan/tasks/check/browser/canvas/touch/check.mjs';
import {check as checkOpen} from '../../.agents/skills/swaw-banyan/tasks/check/browser/canvas/open/check.mjs';
import {check as checkFirstPaint} from '../../.agents/skills/swaw-banyan/tasks/check/browser/canvas/first-paint/check.mjs';
import {touchOpeningScenario} from './canvas-touch-open.mjs';
import {check as checkScroll} from '../../.agents/skills/swaw-banyan/tasks/check/browser/canvas/scroll/check.mjs';
import {check as checkScrollbar} from '../../.agents/skills/swaw-banyan/tasks/check/browser/canvas/scrollbar/check.mjs';
import {check as checkHistory} from '../../.agents/skills/swaw-banyan/tasks/check/browser/canvas/history/check.mjs';
import {check as checkAnchors} from '../../.agents/skills/swaw-banyan/tasks/check/browser/nav/anchors/check.mjs';
import {check as checkKeyboard} from '../../.agents/skills/swaw-banyan/tasks/check/browser/nav/keyboard/check.mjs';
import assert from 'node:assert/strict';
import {documentAsideScenarios} from './document-aside.mjs';
import {openAside} from '../../.agents/skills/swaw-banyan/tasks/check/browser/aside/_shared/page.mjs';
import {check as checkAsideLayout} from '../../.agents/skills/swaw-banyan/tasks/check/browser/aside/layout/check.mjs';
import {check as checkPrint} from '../../.agents/skills/swaw-banyan/tasks/check/browser/aside/print/check.mjs';
import {check as checkCanvasLayout} from '../../.agents/skills/swaw-banyan/tasks/check/browser/canvas/layout/check.mjs';
import path from 'node:path';
import {gotoAndWait} from '../../.agents/skills/swaw-banyan/tasks/check/browser/_shared/page.mjs';
import {waitForBrowse} from '../../.agents/skills/swaw-banyan/tasks/check/browser/_shared/viewport.mjs';

const articlePath = '/zh/p/wsl-guide/';
const viewports = [390, 1024, 1440].map(width => ({ width, height: 900 }));
export const canvasScenarios = [
    ...documentAsideScenarios,
    {
        id: 'canvas-source-navigation',
        kind: 'single',
        serviceWorkers: 'block',
        viewport: {width:390,height:900},
        hasTouch: true,
        title: 'Opening Articles from Different Source Paths',
        async run(args) {
            const cases=[];
            for(const [from,page] of [
                ['/zh/d/','/zh/p/coskill-trustworthy-collaboration/'],
                ['/zh/pb/','/zh/p/wsl-guide/']
            ])cases.push(await checkOpen({...args,options:{from,page,widths:'390',touch:true}}));
            return {cases};
        }
    },
    ...[false, true].map(mobile => ({
        id: mobile ? 'canvas-mobile-native-scrollbar' : 'canvas-desktop-auto-scrollbar',
        kind: 'single',
        serviceWorkers: 'block',
        viewport: { width: mobile ? 390 : 1440, height: 900 },
        isMobile: mobile,
        hasTouch: mobile,
        title: 'Resizing and Scrolling Preserve Column Width and the Metadata Gap',
        run: args => checkScrollbar({...args,options:{page:'/zh/p/coskill-trustworthy-collaboration/#from=da',widths:mobile?'390,768':'1800,1440,1024',touch:mobile}})
    })),
    {
        id: 'canvas-document-aside',
        kind: 'single',
        serviceWorkers: 'block',
        title: 'Document Metadata Occupies an Independent Right Column',
        async run(args) {
            const cases=[];
            for(const prefix of ['', '/zh', '/zh-tw']) {
                const result=await checkAsideLayout({...args,options:{page:prefix+'/p/xvenv/',widths:'390,1024,1600'}});
                assert.equal(await args.page.locator('[data-directory-reference]').count(),0,'The product has one physical home and no redundant references.');
                cases.push({prefix,...result});
            }
            for(const width of [390,1600]) {
                await args.page.setViewportSize({width,height:900});
                await gotoAndWait(args.page,args.baseUrl+'/zh/p/coskill-trustworthy-collaboration/#from=da');
                await waitForBrowse(args.page);await openAside(args.page);
                if(width===390)await args.page.locator('#document-aside').scrollIntoViewIfNeeded();
                await args.page.screenshot({path:path.join(args.artifactDir,'aside-'+width+'.png')});
            }
            const printed=await checkPrint({...args,options:{page:'/zh/p/coskill-trustworthy-collaboration/#from=da'}});
            return {cases,printed};
        }
    },
    {
        id: 'canvas-column-scroll-ownership',
        kind: 'single',
        serviceWorkers: 'block',
        title: 'The Document Pans Horizontally and Each Column Scrolls Vertically',
        async run(args) {
            const article=await checkScroll({...args,options:{page:'/zh/p/ssh-remote-kit-windows/',widths:'390,500,1440'}});
            for(const state of article.cases) {
                assert.ok(state.metadata&&state.readingY>0,'The selected swaw.com article must contain metadata and enough reading content.');
            }
            const collections=[];
            for(const route of ['da','d','pr','pb'])collections.push(await checkScroll({...args,options:{page:'/zh/'+route+'/',widths:'390,500,1440'}}));
            return {article,collections};
        }
    },
    {
        id: 'canvas-append-column',
        kind: 'single',
        serviceWorkers: 'block',
        title: 'Opening Products from Sorted and Unsorted Collections',
        async run(args) {
            const {page,baseUrl}=args,cases=[];
            for(const width of [390,1024,1440])for(const sorted of [false,true]) {
                const from='/zh/pr/'+(sorted?'#sorts=name-desc':'');
                const result=await checkOpen({...args,options:{from,page:'/zh/p/xvenv/',widths:String(width)}});
                if(sorted)assert.equal(new URLSearchParams(new URL(result.cases[0].target,baseUrl).hash.slice(1)).get('sorts'),'name-desc','Product navigation retains the selected name sort.');
                cases.push({sorted,...result});
            }
            return {cases};
        }
    },
    touchOpeningScenario,
    {
        id:'canvas-mobile-touch-navigation',kind:'single',serviceWorkers:'block',
        viewport:viewports[0],isMobile:true,hasTouch:true,
        title:'Mobile Viewport and Real Touch Drag Between Reading and Root Entries',
        run:args=>checkTouch({...args,options:{page:'/zh/p/wsl-guide/',next:'/zh/appearance/'}})
    },
    {
        id: 'canvas-shared-layout-all-widths',
        kind: 'single',
        serviceWorkers: 'block',
        title: 'One Horizontal Column Layout at 390, 1024 and 1440 Pixels',
        async run(args) {
            const cases=[];
            for(const [name,page] of [['article',articlePath],['collection','/zh/da/'],['system','/zh/powered-by/']]) {
                const result=await checkCanvasLayout({...args,options:{page,widths:'390,1024,1440'}});
                for(const state of result.cases) {
                    assert.equal(state.rootCount,13,'The hidden discovery directory leaves thirteen visible root entries.');
                    assert.ok(Math.abs(state.nav.width-225)<=1,'swaw.com uses 225-pixel navigation columns.');
                    if(state.prose)assert.ok(state.prose.width>=Math.min(350,state.viewport-32),'The site reading column must retain its minimum width.');
                    if(name==='article')assert.equal(state.columns.length,1,'Playbooks use one flat source column.');
                }
                assert.equal(await args.page.locator('.breadcrumb-item-menu,.breadcrumb-menu-panel,.breadcrumb-menu-trigger').count(),0,'Retired breadcrumb controls must remain absent.');
                cases.push({name,...result});
            }
            return {cases};
        }
    },
    {
        id: 'canvas-history-scroll-restoration',
        kind: 'single',
        serviceWorkers: 'block',
        isMobile: true,
        hasTouch: true,
        viewport: { width: 390, height: 300 },
        title: 'History Navigation Preserves the Native Horizontal Canvas Position',
        async run(args) {
            const result=await checkHistory({...args,options:{page:'/zh/p/ssh-remote-kit-windows/',next:'/zh/p/swaw-kit-git/'}});
            assert.equal(await args.page.evaluate(()=>!!history.state?.banyanColumnScroll
                ||Object.keys(sessionStorage).some(key=>key.startsWith('banyan:column-scroll:'))),false,
                'Retired swaw.com column-position records must stay absent.');
            return result;
        }
    },
    {
        id: 'canvas-anchors',
        kind: 'single',
        serviceWorkers: 'block',
        viewport: viewports[0],
        title: 'Native Anchors and Skip Link',
        run: args => checkAnchors({...args, options: {page: articlePath}})
    },
    {
        id: 'canvas-keyboard-order',
        kind: 'single',
        serviceWorkers: 'block',
        viewport: viewports[0],
        title: 'Column Keyboard Order',
        run: args => checkKeyboard({...args, options: {page: '/zh/powered-by/'}})
    },
    {
        id: 'canvas-first-frame-slow-runtime',
        kind: 'single',
        serviceWorkers: 'block',
        title: 'Reserved Source Columns Remain Stable Before Scripts Run',
        run: args=>checkFirstPaint({...args,options:{page:articlePath,widths:'390,1440'}})

    }
];
