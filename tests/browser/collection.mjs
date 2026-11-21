import assert from 'node:assert/strict';
import {check as checkLayout} from '../../.agents/skills/swaw-banyan/tasks/check/browser/collection/layout/check.mjs';
import {check as checkStyle} from '../../.agents/skills/swaw-banyan/tasks/check/browser/collection/style/check.mjs';
import {check as checkSort} from '../../.agents/skills/swaw-banyan/tasks/check/browser/nav/sort/check.mjs';
import {breadcrumbArticlePath} from './breadcrumb.mjs';

const nameColumnCases=[
  {id:'section-wide',page:'/zh/d/',width:1600},
  {id:'all-wide',page:'/zh/da/',width:1600},
  {id:'section-medium',page:'/zh/d/',width:1024},
  {id:'section-mobile',page:'/zh/d/',width:390,horizontalCanvas:true},
  {id:'products-wide',page:'/zh/pr/',width:1600},
  {id:'playbooks-wide',page:'/zh/pb/',width:1600}
];
function sourceArticle(baseUrl) {
  const url=new URL(breadcrumbArticlePath,baseUrl);url.hash='from=da';return url.pathname+url.hash;
}

export const collectionScenarios=[
  {
    id:'grid-list-name-column-contract',kind:'single',serviceWorkers:'block',title:'Name Columns Share Navigation Width Across Collection Types',
    async run(args) {
      const cases=[];
      for(const target of nameColumnCases) {
        const result=await checkLayout({...args,options:{page:target.page,widths:String(target.width)}});
        if(target.horizontalCanvas)assert.ok(result.cases[0].main.documentScrollWidth>result.cases[0].main.documentWidth,
          'Swaw mobile directory fixture must extend the document canvas.');
        cases.push({id:target.id,...result});
      }
      return {cases};
    }
  },
  {
    id:'collection-list-visual-alignment-contract',kind:'single',serviceWorkers:'block',title:'Main and Source Lists Share Header and Row Geometry',
    run:args=>checkLayout({...args,options:{page:'/zh/da/',article:sourceArticle(args.baseUrl),widths:'1600'}})
  },
  {
    id:'collection-interaction-theme-contract',kind:'single',serviceWorkers:'block',title:'Collection Links and Buttons Share Selection, Hover and Focus Styles',
    run:args=>checkStyle({...args,options:{page:sourceArticle(args.baseUrl),collection:'/zh/da/',choices:'/zh/appearance/',widths:'1600'}})
  },
  {
    id:'collection-composite-sort-direction',kind:'single',serviceWorkers:'block',title:'Collection Date and Name Tuple Sorting',
    run:args=>checkSort({...args,options:{page:process.env.BANYAN_BROWSER_COMPOSITE_SORT_PATH||'/zh/da/'}})
  }
];

export const collectionBehaviorScenario = {
  id:'collection-behavior-without-style-classes',kind:'single',serviceWorkers:'block',title:'Sorting and Entry Navigation Are Independent of Style Classes',
  run:args=>checkSort({...args,options:{page:'/zh/da/#sorts=name-asc'}})
};
