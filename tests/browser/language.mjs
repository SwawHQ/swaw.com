import assert from 'node:assert/strict';
import {check as checkChoices} from '../../.agents/skills/swaw-banyan/tasks/check/browser/language/choices/check.mjs';
import {check as checkReturn} from '../../.agents/skills/swaw-banyan/tasks/check/browser/language/return/check.mjs';

export const languageScenarios=[
  {
    id:'language-page-static',kind:'single',serviceWorkers:'block',title:'Language Settings Have Native Accessible Choices',
    async run(args) {
      const result=await checkChoices({...args,options:{page:'/language/'}});
      assert.deepEqual(result.initial.choices.map(choice=>[choice.code,choice.icon,choice.href]),[
        ['en','EN','/language/'],['zh','简','/zh/language/'],['zh-tw','繁','/zh-tw/language/']
      ],'Swaw language order, text markers and settings routes are consumer requirements.');
      assert.ok(result.initial.missingMessage,'Swaw settings must provide missing-translation copy.');
      return result;
    }
  },
  {
    id:'language-return-translation',kind:'single',serviceWorkers:'block',title:'Article and Collection Returns Preserve Translation and Navigation State',
    async run(args) {
      const article=await checkReturn({...args,options:{from:'/p/xvenv/#sorts=name-asc&anchor=details',page:'/language/',to:'zh'}});
      assert.equal(article.returned,'/zh/p/xvenv/#sorts=name-asc&anchor=details');
      assert.equal(await args.page.locator('[data-root-href="/zh/pr/"].is-current').count(),1,'Translated product article must select the products root.');
      const collection=await checkReturn({...args,options:{from:'/zh/da/#sorts=name-asc',page:'/zh/language/',to:'en'}});
      assert.equal(collection.returned,'/da/#sorts=name-asc');
      assert.equal(await args.page.locator('[data-sort-field="name"][data-sort-active="true"]').count(),1,'Swaw collection must retain the requested name sort.');
      return {article,collection};
    }
  },
  {
    id:'language-return',kind:'single',serviceWorkers:'block',title:'Selecting the Source Language Keeps the Article History',
    run:args=>checkReturn({...args,options:{from:'/zh/p/xvenv/#sorts=name-asc&anchor=details',page:'/zh/language/',to:'zh'}})
  }
];
