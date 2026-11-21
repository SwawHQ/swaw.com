import {checkOpening} from '../../.agents/skills/swaw-banyan/tasks/check/browser/canvas/open/check.mjs';
import {readRootState,assertRootSelection,checkRootSelection} from '../../.agents/skills/swaw-banyan/tasks/check/browser/nav/_shared/root.mjs';
import {check as checkCanvasLayout} from '../../.agents/skills/swaw-banyan/tasks/check/browser/canvas/layout/check.mjs';
import assert from 'node:assert/strict';
import {check as checkCsp} from '../../.agents/skills/swaw-banyan/tasks/check/browser/csp/check.mjs';
import {inspectSecurityHeaders} from '../../.agents/skills/swaw-banyan/tasks/check/http/security/headers.mjs';
import {check as checkLanguageUpdate} from '../../.agents/skills/swaw-banyan/tasks/check/browser/pwa/language/check.mjs';
import {languageScenarios} from './language.mjs';
import {collectionScenarios,collectionBehaviorScenario} from './collection.mjs';
import {breadcrumbScenarios,breadcrumbCollectionPath} from './breadcrumb.mjs';
import {check as checkFirstPaint} from '../../.agents/skills/swaw-banyan/tasks/check/browser/canvas/first-paint/check.mjs';
import {paletteScenarios} from './palette.mjs';
import {check as checkProse} from '../../.agents/skills/swaw-banyan/tasks/check/browser/prose/layout/check.mjs';
import {updatesNavigationScenarios} from './pwa/navigation.mjs';
import path from 'node:path';

import {gotoAndWait} from '../../.agents/skills/swaw-banyan/tasks/check/browser/_shared/page.mjs';
import {waitForBrowse} from '../../.agents/skills/swaw-banyan/tasks/check/browser/_shared/viewport.mjs';
import { preferenceAndUpdateScenarios } from './preference-and-updates.mjs';
import { canvasScenarios } from './canvas.mjs';
import {openAside} from '../../.agents/skills/swaw-banyan/tasks/check/browser/aside/_shared/page.mjs';

const WIDE_VIEWPORT = { width: 1600, height: 1100 };
const BREADCRUMB_FIRST_FRAME_VIEWPORT = { width: 1280, height: 960 };
const BREADCRUMB_FIRST_FRAME_PATH = process.env.BANYAN_BROWSER_BREADCRUMB_FIRST_FRAME_PATH
    || '/p/loop-engineering-digital-life-origin/';
const BREADCRUMB_FIRST_FRAME_FROM = process.env.BANYAN_BROWSER_BREADCRUMB_FIRST_FRAME_FROM
    || '/da/';

export const securityScenarios = [
    {id:'security-csp-enforce-home',kind:'single',title:'Security: CSP Enforce Home',run:checkCsp},
    {
        id: 'security-csp-enforce-breadcrumb-wide',
        kind: 'single',
        title: 'Security: CSP Enforce Breadcrumb Wide',
        viewport: WIDE_VIEWPORT,
        async run(args) {
            const result=await checkCsp({...args,options:{page:breadcrumbCollectionPath}});
            assert.deepEqual(inspectSecurityHeaders(result.headers),[],'Generated response must retain adjacent security headers.');
            assert.ok(result.csp.split(';').some(value=>/^\s*script-src\s/.test(value)&&value.split(/\s+/).includes("'report-sample'")),'CSP must retain report-sample.');
            return result;
        }
    }
];
export const scenarios = [
    ...breadcrumbScenarios,
    ...collectionScenarios,
    ...languageScenarios,
    ...paletteScenarios,
    collectionBehaviorScenario,
    {id:'prose-scope-and-hover-contract',kind:'single',serviceWorkers:'block',title:'Prose Links, Lists, Quotes and Tables Keep Their Own Layout',run:args=>checkProse({...args,options:{page:'/zh/about/'}})},
    ...updatesNavigationScenarios,
    {id:'home-shell-smoke',kind:'single',title:'Navigation-only Home',async run({page,baseUrl}) {
        const errors=[];
        page.on('pageerror',error=>errors.push(error.message));
        page.on('response',response=>{
            if(['script','stylesheet'].includes(response.request().resourceType()) && response.status()>=400) errors.push(response.url());
        });
        page.on('requestfailed',request=>{
            if(['script','stylesheet'].includes(request.resourceType())) errors.push(request.url());
        });
        for(const prefix of ['', '/zh', '/zh-tw']) {
            const response=await page.goto(baseUrl+prefix+'/',{waitUntil:'load'});
            assert.ok(response.ok());
            assert.ok((await page.title()).trim());
            assert.ok(await page.locator('[data-root-navigation]').isVisible());
            assert.equal(await page.locator('.reading-group').count(),0);
        }
        assert.deepEqual(errors,[]);
        return {languages:3};
    }},
    {id:'search-localized-results',kind:'single',serviceWorkers:'block',title:'Search Results Stay in the Selected Language',
        async run({page,baseUrl}) {
            for(const prefix of ['', '/zh', '/zh-tw']) {
                await gotoAndWait(page,baseUrl+prefix+'/');
                await page.locator('[data-root-href="'+prefix+'/search/"]').click();
                const input=page.locator('[data-search-input]');
                await input.fill('Git');
                const results=page.locator('.search-result a');
                await results.first().waitFor({state:'visible'});
                const paths=await results.evaluateAll(links=>links.map(link=>link.pathname));
                assert.ok(paths.every(result=>result.startsWith(prefix+'/p/')), 'Search uses the current language RSS articles.');
                await input.fill('zzzxnonexistentterm');
                await results.first().waitFor({state:'hidden'});
            }
            return {languages:3};
        }
    },
    ...canvasScenarios,
    ...preferenceAndUpdateScenarios,
    {
        id: 'root-navigation-layout',
        kind: 'single',
        title: 'Root Navigation Visibility Across Viewports',
        serviceWorkers: 'block',
        viewport: WIDE_VIEWPORT,
        async run(args) {
            const layouts=[];
            for(const viewport of [{width:390,height:844},{width:1024,height:960},WIDE_VIEWPORT]) {
                const result=await checkCanvasLayout({...args,options:{page:'/zh/da/',widths:String(viewport.width),height:viewport.height}});
                layouts.push(...result.cases);
            }
            assert.ok(layouts.every(state=>state.rootCount===layouts[0].rootCount),'Resizing must retain the same root entries.');
            return {layouts};
        }
    },
    {
        id: 'root-navigation-entry-ownership',
        kind: 'single',
        title: 'Root Selection from Valid Sources and Content Ancestry',
        serviceWorkers: 'block',
        viewport: WIDE_VIEWPORT,
        timeoutMs: 60000,
        async run({ page, baseUrl }) {
            const directStates=[];
            let roots;
            const assertSelection=async expected=>{
                await waitForBrowse(page);
                return checkRootSelection(page,expected,roots);
            };
            const directCases = [
                ['/zh/p/xvenv/', '/zh/pr/'],
                ['/zh/p/xvenv/#from=pr/not-a-source', '/zh/pr/'],
                ['/zh/p/xvenv/#from=pr', '/zh/pr/'],
                ['/zh/p/swaw-kit-git/', '/zh/pb/'],
                ['/zh/p/coskill-trustworthy-collaboration/', null],
                ['/zh/pr/', '/zh/pr/'],
                ['/zh/pb/', '/zh/pb/'],
                ['/zh/da/', '/zh/da/'],
                ['/zh/d/', null],
                ['/zh/about/', '/zh/about/'],
                ['/zh/powered-by/', '/zh/powered-by/'],
                ['/zh/wechat/', '/zh/wechat/'],
                ['/zh/github/', '/zh/github/'],
                ['/zh/rss/', '/zh/rss/'],
                ['/zh/icp/', '/zh/icp/'],
                ['/zh/language/?return=%2Fzh%2Fda%2F', '/zh/language/'],
                ['/zh/appearance/?return=%2Fzh%2Fda%2F', '/zh/appearance/'],
                ['/zh/my/?return=%2Fzh%2Fda%2F', '/zh/my/'],
                ['/zh/powered-by/?return=%2Fzh%2Fda%2F', '/zh/powered-by/']
            ];
            for(const [target,root] of directCases) {
                if(target==='/zh/p/xvenv/#from=pr') {
                    await gotoAndWait(page,baseUrl+target);
                    directStates.push({target,root:await assertSelection(root)});
                    continue;
                }
                const result=await checkFirstPaint({page,baseUrl,options:{page:target,widths:'1600',root:root||''}});
                const state=result.cases[0];
                roots??=state.first.root.roots;
                await assertSelection(root);
                directStates.push({target,...state});
            }
            await gotoAndWait(page,baseUrl+'/zh/');
            assert.equal(await page.locator('body').getAttribute('data-home-navigation'),'true');
            await assertSelection('/zh/');
            const articlePath = '/zh/p/coskill-trustworthy-collaboration/';
            await gotoAndWait(page, baseUrl + articlePath);
            const sources = await page.evaluate(() => Object.keys(JSON.parse(document.documentElement.dataset.navigation).columns));
            const sourceCases = ['/da/', '/d/'].map(logicalPath => (
                sources.includes(logicalPath)?{logicalPath,rootHref:logicalPath==='/d/'?null:'/zh/da/'}:null
            ));
            assert.ok(sourceCases.every(Boolean),'The discovery article exposes both all and topic sources: '+JSON.stringify({sources}));
            for (const source of sourceCases) {
                const target = new URL(articlePath, baseUrl);
                target.hash='from='+encodeURIComponent(source.logicalPath.replace(/^\/|\/$/g, ''));
                await gotoAndWait(page, target.href);
                await assertSelection(roots.includes(source.rootHref) ? source.rootHref : null);
                await page.reload();
                await assertSelection(roots.includes(source.rootHref) ? source.rootHref : null);
            }
            await page.goBack();
            await assertSelection(sourceCases[0].rootHref);
            await page.goForward();
            await assertSelection(sourceCases[1].rootHref);

            const firstPaintCases = [
                ['/zh/p/coskill-trustworthy-collaboration/#from=da', '/zh/da/'],
                ['/zh/p/coskill-trustworthy-collaboration/#from=%2Fda%2F', '/zh/da/'],
                ['/zh/p/xvenv/', '/zh/pr/'],
                ['/zh/p/xvenv/#from=pr/not-a-source', '/zh/pr/'],
                ['/zh/p/xvenv/#from=d/not-a-source', '/zh/pr/'],
                ['/zh/language/?return=' + encodeURIComponent('/zh/p/xvenv/'), '/zh/language/']
            ];
            const firstPaintStates = [];
            for(const [target,expectedRoot] of firstPaintCases) {
                const result=await checkFirstPaint({page,baseUrl,options:{page:target,widths:'1600',root:expectedRoot||''}});
                await assertSelection(expectedRoot);
                firstPaintStates.push({target,...result.cases[0]});
            }
            return {directStates,firstPaintStates,sources:sourceCases.map(source=>source.logicalPath)};
        }
    },
    {
        id:'root-navigation-directory-exploration',kind:'single',serviceWorkers:'block',
        title:'Article Metadata Keeps Its Physical Product Directory',viewport:{width:1024,height:700},
        async run({page,baseUrl,artifactDir}) {
            const cases=[];
            for(const prefix of ['','/zh','/zh-tw']) {
                const article=prefix+'/p/xvenv/',collection=prefix+'/pr/';
                await gotoAndWait(page,baseUrl+article);await openAside(page);
                await page.locator('.document-meta a[href='+JSON.stringify(collection)+']').click();
                await waitForBrowse(page);
                assert.equal(new URL(page.url()).pathname,collection,'Article metadata opens the authored directory.');
                const roots=await readRootState(page);assertRootSelection(roots,prefix+'/pr/');
                assert.ok(roots.roots.includes(prefix+'/pr/'),'Products has one root entry.');
                await page.locator('.slot-main [data-sort-field="name"]').click();
                await page.waitForURL(url=>new URLSearchParams(url.hash.slice(1)).get('sorts')==='name-asc');await waitForBrowse(page);
                await page.locator('.slot-main .item-control[href^='+JSON.stringify(article+'#')+']').scrollIntoViewIfNeeded();
                const result=await checkOpening({page,options:{page:article}});
                assert.equal(result.source.rootHref,prefix+'/pr/','The product belongs to Products.');
                cases.push({prefix,...result});
                if(prefix==='/zh')await page.screenshot({path:path.join(artifactDir,'product-article.png')});
            }
            for(const entry of ['da','d']) {
                await gotoAndWait(page,baseUrl+'/zh/'+entry+'/');
                await page.screenshot({path:path.join(artifactDir,'articles-'+entry+'.png')});
            }
            return {cases};
        }
    },
    {
        id:'hidden-discovery-metadata-entry',kind:'single',serviceWorkers:'block',
        title:'Hidden Discovery Directory Remains Reachable from Article Metadata',
        async run({page,baseUrl}) {
            const cases=[];
            for(const prefix of ['','/zh','/zh-tw']) {
                const article=prefix+'/p/coskill-trustworthy-collaboration/',directory=prefix+'/d/';
                await gotoAndWait(page,baseUrl+article);await waitForBrowse(page);await openAside(page);
                assert.equal(await page.locator('[data-root-href='+JSON.stringify(directory)+']').count(),0,'Discovery directory is absent from root navigation.');
                await page.locator('.document-meta a[href='+JSON.stringify(directory)+']').click();await waitForBrowse(page);
                assert.equal(new URL(page.url()).pathname,directory,'Metadata opens the retained directory page.');
                assert.equal(await page.locator('.slot-main [data-list-entry]').count(),3,'The retained directory directly lists all three essays.');
                const result=await checkOpening({page,options:{page:article}});
                assert.equal(result.source.root,'','The hidden directory must not select another root entry.');
                cases.push(result);
            }
            return {cases};
        }
    },
    {
        id:'primary-collection-entry-lineage',kind:'single',serviceWorkers:'block',
        title:'Flat Products and Playbooks Stay Separate from Discovery',viewport:WIDE_VIEWPORT,
        async run({page,baseUrl}) {
            const results=[];
            for(const [collectionPath,article,root] of [
                ['/pr/','/p/xvenv/','/pr/'],
                ['/pb/','/p/swaw-kit-git/','/pb/'],
                ['/da/','/p/coskill-trustworthy-collaboration/','/da/'],
                ['/d/','/p/coskill-trustworthy-collaboration/','/d/']
            ]) {
                await gotoAndWait(page,baseUrl+collectionPath+'#sorts=name-desc');await waitForBrowse(page);
                const rows=await page.locator('.slot-main [data-list-item]').evaluateAll(items=>items.map(item=>item.dataset.kind));
                assert.ok(rows.length&&rows.every(kind=>kind==='page'),'Article lists have no subcategories.');
                const result=await checkOpening({page,options:{page:article}});
                assert.equal(result.source.rootHref,root,'Each article retains its chosen collection root.');
                results.push(result);
            }
            return {results};
        }
    },
    {
        id: 'breadcrumb-wide-first-frame-stability',
        kind: 'single',
        serviceWorkers: 'block',
        title: 'Source Selection Preserves Article Directory Metadata',
        viewport: BREADCRUMB_FIRST_FRAME_VIEWPORT,
        async run(args) {
            const {page,baseUrl}=args;
            const defaultUrl=new URL(BREADCRUMB_FIRST_FRAME_PATH,baseUrl);
            await gotoAndWait(page,defaultUrl.href);await waitForBrowse(page);
            const defaultColumnCount=await page.locator('[data-slot="breadcrumb"] [data-breadcrumb-column]:visible').count();
            const sourceUrl=new URL(defaultUrl);sourceUrl.hash='from='+encodeURIComponent(BREADCRUMB_FIRST_FRAME_FROM);
            const result=await checkFirstPaint({...args,options:{page:sourceUrl.pathname+sourceUrl.search+sourceUrl.hash,widths:String(BREADCRUMB_FIRST_FRAME_VIEWPORT.width)}});
            assert.equal(defaultColumnCount,1,'The physical discovery directory is flat.');
            assert.equal(result.cases[0].final.columns.length,1,'The all-discoveries source remains flat.');
            assert.equal(result.cases[0].final.breadcrumbContent[0].href,'/da/','The alternate source uses the visible all-discoveries entry.');
            return {defaultColumnCount,...result};
        }
    },
    {id:'sw-update-language-page-static',kind:'upgrade',title:'Language Links While Site Update Waits',
        async run(args) {
            const result=await checkLanguageUpdate({...args,options:{dir:args.upgradePair?.fromDir,next:args.upgradePair?.toDir,page:'/language/',to:'zh'}});
            assert.equal(result.before.length,3,'This site publishes three language choices: '+JSON.stringify(result.before));
            assert.equal(new URL(result.target).pathname,'/zh/language/','The site choice must open the Chinese language page: '+JSON.stringify(result));
            return result;
        }
    }
];

export const upgradeScenarios = scenarios.filter((scenario) => scenario.kind === 'upgrade');
