import assert from 'node:assert/strict';
import {check as checkSort} from '../../.agents/skills/swaw-banyan/tasks/check/browser/breadcrumb/sort/check.mjs';
import {check as checkSource} from '../../.agents/skills/swaw-banyan/tasks/check/browser/breadcrumb/source/check.mjs';
import {check as checkHeader} from '../../.agents/skills/swaw-banyan/tasks/check/browser/breadcrumb/header/check.mjs';
import {check as checkLayout} from '../../.agents/skills/swaw-banyan/tasks/check/browser/canvas/layout/check.mjs';
import {check as checkFirstPaint} from '../../.agents/skills/swaw-banyan/tasks/check/browser/canvas/first-paint/check.mjs';
import {openPage} from '../../.agents/skills/swaw-banyan/tasks/check/browser/breadcrumb/_shared/page.mjs';

export const breadcrumbArticlePath=process.env.BANYAN_BROWSER_BREADCRUMB_COLUMN_SORT_PATH||'/zh/p/coskill-trustworthy-collaboration/';
export const breadcrumbCollectionPath=process.env.BANYAN_BROWSER_BREADCRUMB_COLLECTION_PATH||'/d/';
const directoryPath=process.env.BANYAN_BROWSER_BREADCRUMB_DIRECTORY_PATH||'/zh/p/coskill-trustworthy-collaboration/';
const directoryColumn=process.env.BANYAN_BROWSER_BREADCRUMB_DIRECTORY_COLLECTION_HREF||'/zh/d/';
const widePath=process.env.BANYAN_BROWSER_BREADCRUMB_WIDE_CANVAS_PATH||'/zh/p/coskill-trustworthy-collaboration/';
const wideFrom=process.env.BANYAN_BROWSER_BREADCRUMB_WIDE_CANVAS_FROM||'/d';
const local=url=>url.pathname+url.search+url.hash;

export const breadcrumbScenarios=[
  {
    id:'breadcrumb-collection-wide-stability',kind:'single',serviceWorkers:'block',title:'Collection Columns Stay Stable During Startup',
    run:args=>checkFirstPaint({...args,options:{page:breadcrumbCollectionPath,widths:'390,1600'}})
  },
  {
    id:'breadcrumb-directory-wide-stability',kind:'single',serviceWorkers:'block',title:'Directory Rows and Header Spacing Stay Stable During Startup',
    async run(args) {
      const result=await checkFirstPaint({...args,options:{page:directoryPath,widths:'390,1600'}});
      for(const state of result.cases)assert.ok(state.final.breadcrumbContent.some(column=>column.href===directoryColumn&&column.rows.length),
        'Swaw directory fixture must expose its expected sortable parent column.');
      return result;
    }
  },
  {
    id:'breadcrumb-wide-horizontal-canvas',kind:'single',serviceWorkers:'block',title:'Discovery Paths Use Fixed Columns and One Document Scroller',
    async run(args) {
      const url=new URL(widePath,args.baseUrl);url.hash='from='+encodeURIComponent(wideFrom);
      const result=await checkLayout({...args,options:{page:local(url),widths:'390,1280'}});
      const expected=await args.page.evaluate(()=>15*parseFloat(getComputedStyle(document.documentElement).fontSize));
      for(const state of result.cases) {
        assert.equal(state.columns.length,1,'Discovery articles have one flat source column.');
        assert.ok(Math.abs(state.declared.column-expected)<=1,'Swaw navigation columns must keep the configured 15rem width.');
      }
      return result;
    }
  },
  {
    id:'breadcrumb-header-sort-visibility',kind:'single',serviceWorkers:'block',title:'Column Labels Preserve Visible Sort Controls',
    async run(args) {
      const cases=[];
      for(const prefix of ['', '/zh', '/zh-tw'])cases.push(await checkHeader({...args,options:{page:prefix+'/p/coskill-trustworthy-collaboration/',widths:'390,1600'}}));
      return {cases};
    }
  },
  {
    id:'canvas-path-sort-reuses-dom',kind:'single',serviceWorkers:'block',title:'Sorting Reuses Server-rendered Path Rows, Headers and Links',
    run:args=>checkSort({...args,options:{page:'/p/swaw-kit-git/#sorts=date-desc',column:'/pb/'}})
  },
  {
    id:'canvas-path-entry-lineage',kind:'single',serviceWorkers:'block',title:'Path Column Article Links Keep Their Source Before and After Rendering',
    async run(args) {
      const cases=[];
      for(const lang of ['','zh/','zh-tw/']) {
        for(const [route,from,queries] of [
          ['p/loop-engineering-digital-life-origin/','da',['#from=da','#from=da&sorts=date-asc']],
          ['p/loop-engineering-digital-life-origin/','d',['']]
        ])for(const query of queries) {
          const result=await checkSource({...args,options:{page:`/${lang}${route}${query}`,column:`/${lang}${from}/`,article:`/${lang}p/coskill-trustworthy-collaboration/`}});
          const expected=from==='d'?null:from;
          assert.equal(new URLSearchParams(new URL(result.raw).hash.slice(1)).get('from'),expected,'Swaw links omit the default source and retain an alternate directory source.');
          assert.equal(new URLSearchParams(new URL(result.target).hash.slice(1)).get('from'),expected);cases.push(result);
        }
      }
      return {cases};
    }
  },
  {
    id:'breadcrumb-column-sort-toggle',kind:'single',serviceWorkers:'block',title:'Breadcrumb Column Sort Toggle',
    async run(args) {
      const {page,baseUrl}=args,url=new URL('/zh/p/swaw-kit-git/',baseUrl);url.hash='from=pb';
      await page.setViewportSize({width:1280,height:960});await openPage(page,url.href);
      const anatomy=await page.evaluate(()=>{
        const panel=document.querySelector('[data-slot=breadcrumb] .item-list--breadcrumb-column'),rows=[...panel.querySelectorAll('[data-list-entry]')];
        return {field:panel.querySelector('.breadcrumb-sort-label')?.textContent.trim(),indicator:panel.querySelector('[data-sort-indicator]')?.textContent.trim(),
          label:panel.getAttribute('aria-label'),icons:panel.querySelectorAll('.item-icon svg.icon').length,rows:rows.length,
          embedded:document.querySelectorAll('[data-breadcrumb-collection-source]').length,
          wrapped:rows.filter(row=>row.getBoundingClientRect().height>parseFloat(getComputedStyle(row).lineHeight)+.1).length};
      });
      assert.ok(anatomy.field&&anatomy.label);assert.equal(anatomy.indicator,'↓');assert.ok(anatomy.rows>0);
      assert.equal(anatomy.icons,anatomy.rows);assert.equal(anatomy.embedded,0);assert.equal(anatomy.wrapped,0);
      const result=await checkSort({...args,options:{page:local(url)}}),after=new URL(result.cases[0].url);
      assert.equal(new URLSearchParams(after.hash.slice(1)).get('from'),'pb');assert.equal(new URLSearchParams(after.hash.slice(1)).get('sort'),null);assert.equal(new URLSearchParams(after.hash.slice(1)).get('sorts'),'date-asc');
      return {anatomy,...result};
    }
  }
];
