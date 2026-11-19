import assert from 'node:assert/strict';
import {extractCanonicalHref} from '../../../.agents/skills/swaw-banyan/tasks/_shared/html/markup.mjs';
import {prefixes,readPage,attr,has,hasClass,tags,blocks,classBlocks,one,text,icon,favicon} from '../_shared.mjs';

const roots=['','my','search','pr','pb','da','language','appearance','rss','powered-by','wechat','github','icp','about'];
const primaryRoots=['pr','pb','da','d'];
const labels={
  '':['Products - All','Playbooks - All','Discover - All','Discover - Topics'],
  '/zh':['产品 - 全部','实战 - 全部','发现 - 全部','发现 - 分类'],
  '/zh-tw':['產品 - 全部','實戰 - 全部','發現 - 全部','發現 - 分類']
};
const icons={search:'#icon-search',language:'#icon-language',appearance:'#icon-theme',my:'#icon-my',wechat:'#icon-wechat',github:'#icon-github',rss:'#icon-rss','powered-by':'#icon-code'};
const discoveryDescriptions={
  '':['Explore changes and possibilities in technology, human-AI collaboration, and work.','Browse all posts in one list.','Browse posts by topic.'],
  '/zh':['探索技术、人机协作与工作方式的变化和可能。','以完整列表浏览全部内容。','按主题分类浏览内容。'],
  '/zh-tw':['探索技術、人機協作與工作方式的變化和可能。','以完整列表瀏覽全部內容。','按主題分類瀏覽內容。']
};
const title=html=>text(one(blocks(html,'title'),'Browser title').inner);
const meta=(html,key)=>attr(one(tags(html,'meta').filter(tag=>[attr(tag,'name'),attr(tag,'property')].includes(key)),key),'content');

export function inspectNavigation(html,prefix,selected) {
  const navigation=blocks(html,'nav',tag=>has(tag,'data-root-navigation'));
  const body=one(tags(html,'body'),'Page body');
  if(selected===prefix+'/'&&attr(body,'data-home-navigation')==='false') {
    assert.equal(navigation.length,0,'Hidden home navigation must not render a root list.');
    assert.equal(tags(html,'a').filter(tag=>has(tag,'data-root-href')).length,0,'Hidden home navigation must not render root entries.');
    return [];
  }
  const nav=one(navigation,'Root navigation');
  assert.equal(attr(nav.open,'aria-label'),'Swaw','Root navigation uses the homepage site name.');
  const entries=blocks(nav.inner,'a',tag=>has(tag,'data-root-href'));
  const expected=roots.map(root=>prefix+'/'+(root?root+'/':''));
  assert.equal(tags(html,'a').filter(tag=>has(tag,'data-root-href')).length,roots.length,'Root entries occur only in the root list.');
  assert.ok(entries.every(entry=>attr(entry.open,'data-item-field')==='name'),'Each root entry owns a name field.');
  assert.deepEqual(entries.map(entry=>attr(entry.open,'data-root-href')),expected,'Root navigation order');
  assert.deepEqual(entries.map(entry=>attr(entry.open,'href')),expected,'Ordinary root URLs');
  const selection=expected.includes(selected)?[selected]:[];
  assert.deepEqual(entries.filter(entry=>attr(entry.open,'aria-current')==='page').map(entry=>attr(entry.open,'href')),selection,'SSR root selection');
  assert.deepEqual(entries.filter(entry=>hasClass(entry.open,'is-current')).map(entry=>attr(entry.open,'href')),selection,'SSR selected style');
  assert.deepEqual(primaryRoots.filter(root=>roots.includes(root)).map(root=>entries[roots.indexOf(root)]).map(entry=>text(one(classBlocks(entry.inner,'span','item-title'),'Entry title').inner)),labels[prefix].slice(0,3),'Localized primary entry labels');
  for(const entry of entries){
    assert.equal(attr(entry.open,'target'),'','Root entries use the current tab.');
    assert.equal(has(entry.open,'data-settings-link'),false,'Root entries have no settings rewrite marker.');
    one(classBlocks(entry.inner,'span','item-title'),'Entry title');
  }
  for(const [name,expectedIcon] of Object.entries(icons))assert.equal(icon(entries[roots.indexOf(name)].inner),expectedIcon,name+' icon');
  assert.equal(attr(one(tags(entries[0].inner,'img'),'Home icon'),'src'),favicon(html),'Home uses the site favicon.');
  assert.equal(text(one(classBlocks(entries[0].inner,'span','item-title'),'Home title').inner),'Swaw');
  const filing=entries[roots.indexOf('icp')];
  assert.equal(text(one(classBlocks(filing.inner,'span','icon--text'),'Filing icon').inner),'粤');
  assert.equal(tags(filing.inner,'img').length,0);
  assert.equal(text(one(classBlocks(filing.inner,'span','item-title'),'Filing title').inner),'ICP备2024338434号');
  const about=entries[roots.indexOf('about')];
  assert.equal(text(one(classBlocks(about.inner,'span','icon--text'),'About icon').inner),'©');
  assert.equal(text(one(classBlocks(about.inner,'span','item-title'),'About title').inner),({'':'About','/zh':'关于','/zh-tw':'關於'})[prefix]);
  assert.equal(tags(html,'footer').length+classBlocks(html,'div','slot-footer').length,0,'No footer duplicate.');
  assert.doesNotMatch(html,/<[^>]+(?:data-nav-utility-kind|data-site-version-menu|data-slot=["']?primary_nav)\b/,'Retired navigation controls');
  return entries;
}

export function inspectPrimaryPage(html,prefix,index) {
  const label=labels[prefix][index];
  assert.equal(title(html),label+' - Swaw','Primary browser title');
  for(const key of ['og:title','twitter:title'])assert.equal(meta(html,key),label,key);
  const description=meta(html,'description');assert.ok(description,'Primary description');
  if(index===2||index===3) {
    const [scope,all,topics]=discoveryDescriptions[prefix];
    assert.equal(description,scope+(prefix?'':' ')+(index===2?all:topics),'Discovery scope and browsing description');
  }
  for(const key of ['og:description','twitter:description'])assert.equal(meta(html,key),description,key);
  assert.equal(new URL(extractCanonicalHref(html)).pathname,prefix+'/'+primaryRoots[index]+'/','Primary canonical path');
}

export async function check(directory) {
  let pages=0;
  for(const prefix of prefixes) {
    let brand;
    for(const root of ['','pr','pb','da','d','about','powered-by','rss','wechat','github','icp']) {
      const route=prefix+'/'+(root?root+'/':'');
      const html=await readPage(directory,route);
      const entries=inspectNavigation(html,prefix,route);
      if(entries.length) {
        const currentBrand=text(one(classBlocks(entries[0].inner,'span','item-title'),'Brand').inner);
        if(brand===undefined)brand=currentBrand;else assert.equal(currentBrand,brand,'Brand remains stable across pages.');
      }
      const index=primaryRoots.indexOf(root);if(index>=0)inspectPrimaryPage(html,prefix,index);
      pages++;
    }
  }
  return {pages};
}
