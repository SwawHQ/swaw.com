import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {extractCanonicalHref} from '../../../.agents/skills/swaw-banyan/tasks/_shared/html/markup.mjs';
import {inspectDocumentControls} from '../../../.agents/skills/swaw-banyan/tasks/check/html/scripts/controls.mjs';
import {prefixes,readPage,attr,has,tags,blocks,classBlocks,one,text,hrefs,prose,favicon} from '../_shared.mjs';

export function inspectInformation(html,name,feedHref) {
  assert.deepEqual(inspectDocumentControls(html),[],'Shared document control checks');
  const body=prose(html),links=blocks(body,'a'),images=tags(body,'img');
  const linksTo=href=>links.filter(link=>attr(link.open,'href')===href);
  for(const link of links.filter(link=>attr(link.open,'target')==='_blank'||(name!=='about'&&/^https?:\/\//.test(attr(link.open,'href')))||(name==='rss'&&attr(link.open,'href').endsWith('.xml')))) {
    assert.equal(attr(link.open,'target'),'_blank','Information external links open a new tab: '+name+' '+attr(link.open,'href'));
    const rel=attr(link.open,'rel').split(/\s+/);
    assert.ok(rel.includes('noopener')&&rel.includes('noreferrer'),'Information external links isolate their new tabs.');
  }
  if(name==='powered-by') {
    assert.equal(text(one(blocks(body,'h1'),'Heading').inner),'Powered by');
    const headings=blocks(body,'h3');
    assert.equal(headings.length,7,'PWA appendix and six diagnostic sections');
    assert.match(text(headings[0].inner),/PWA/,'PWA appendix');
    const diagnostics=one(blocks(body,'details'),'Inline diagnostics');
    assert.equal(has(diagnostics.open,'open'),false,'Diagnostics start collapsed.');
    assert.ok(text(one(blocks(diagnostics.inner,'summary'),'Diagnostic summary').inner),'Diagnostic summary has a label.');
    one(blocks(diagnostics.inner,'form',tag=>attr(tag,'id')==='prefetch-debug-controls'),'Inline prefetch controls');
    for(const key of ['support','env','actions','runtime','payload'])
      one(blocks(diagnostics.inner,'pre',tag=>attr(tag,'id')==='prefetch-debug-'+key),'Diagnostic state '+key);
    assert.deepEqual(tags(diagnostics.inner,'a').filter(tag=>has(tag,'data-prefetch-test-link')).map(tag=>attr(tag,'data-prefetch-test-link')),
      ['collection','article'],'Diagnostic links use published content.');
    assert.equal(has(one(tags(html,'body'),'Document body'),'data-prefetch-debug'),true,'Diagnostic shortcodes enable their page runtime.');
    assert.equal(linksTo('https://github.com/SwawHQ/banyan').length,1,'Banyan source link');
    assert.equal(linksTo('https://gohugo.io/news/').length,1,'Hugo news link');
    const offline=one(blocks(body,'span',tag=>has(tag,'data-site-offline-page')),'Offline page entry');
    const offlineLink=one(blocks(offline.inner,'a'),'Offline page link');
    assert.equal(attr(offlineLink.open,'href'),new URL(extractCanonicalHref(html)).pathname.replace(/powered-by\/$/,'offline/'),'Offline page link follows the current language.');
    assert.equal(text(offlineLink.inner),attr(offlineLink.open,'href'),'Offline page shows its actual URL.');
    assert.equal(tags(body,'div').filter(tag=>has(tag,'data-sortable')).length,0,'Overview has no sort control.');
    one(blocks(body,'span',tag=>has(tag,'data-site-status-panel')),'Inline update panel');
    assert.equal(tags(body,'button').filter(tag=>has(tag,'data-site-sw-action')).length,1,'This site enables the update check action.');
    assert.equal(tags(html,'a').filter(tag=>/\/powered-by(?:\/pwa\/|\.debug\/)/.test(attr(tag,'href'))).length,0,'No separate diagnostic subpage.');
    assert.equal(tags(html,'time').filter(tag=>has(tag,'data-site-build-version')).length,1,'Build time appears once.');
    const symbol=one(blocks(html,'symbol',tag=>attr(tag,'id')==='icon-code'),'Code symbol');
    assert.equal(tags(symbol.inner,'path').length,1);
  } else if(name==='icp') {
    const emblem=one(images,'Filing emblem');
    assert.match(attr(emblem,'src'),/^\/media\/content\/icp\/0\.[a-f0-9]{64}\.webp$/);
    assert.match(text(body),/粤ICP备2024338434号/,'Filing number');
    const filing=linksTo('https://beian.miit.gov.cn/');assert.equal(filing.length,2,'Filing links');
    assert.equal(filing.filter(link=>text(link.inner)==='粤ICP备2024338434号').length,1,'Visible filing number');
  } else if(name==='github') {
    assert.deepEqual([...new Set(hrefs(body))],['https://github.com/SwawHQ'],'Published GitHub account');
    assert.equal(images.length,1,'Organization avatar');
    assert.equal(tags(body,'table').length,0);
    const accountLinks=linksTo('https://github.com/SwawHQ');assert.equal(accountLinks.length,2,'Organization links');
    assert.equal(text(one(accountLinks.filter(link=>tags(link.inner,'img').length===0),'Organization text link').inner),'GitHub.com/SwawHQ');
    const avatar=one(accountLinks.flatMap(link=>tags(link.inner,'img')),'Organization avatar');
    assert.equal(attr(avatar,'height'),'64','Organization avatar height');
    assert.equal(attr(avatar,'src'),favicon(html),'Organization avatar uses the favicon.');
  } else if(name==='wechat')assert.equal(images.length,2,'WeChat QR images');
  else if(name==='rss') {
    assert.deepEqual(blocks(body,'h2').map(heading=>attr(heading.open,'id')),['all-articles','by-section'],'Subscription sections');
    const link=one(linksTo(feedHref),'Language feed link');
    const base=extractCanonicalHref(html);
    assert.equal(new URL(text(link.inner),base).pathname,new URL(feedHref,base).pathname,'Visible subscription URL');
    assert.equal(links.filter(link=>attr(link.open,'href').endsWith('.xml')).length,1,'RSS page links only to the all-articles feed.');
    const example=one(blocks(body,'pre'),'Subscription URL example');
    const root=new URL('../',base).href;
    for(const suffix of ['','#...','?...','index.xml'])
      assert.ok(text(example.inner).includes(root+'category1/category2/'+suffix),'Subscription URL example uses the current language root.');
  } else if(name==='about') {
    assert.deepEqual(hrefs(body),['mailto:hello@swaw.com','https://x.com/iddibi'],'About contact links');
    assert.match(text(body),/Stay Whole at Work/,'About brand slogan');
  }
  const crumbs=blocks(html,'nav',tag=>attr(tag,'data-slot')==='breadcrumb');
  assert.equal(crumbs.flatMap(crumb=>tags(crumb.inner,'a')).filter(tag=>attr(tag,'class').split(/\s+/).includes('item-control')).length,0,'Information pages have no directory column.');
}

const feedURLs=xml=>blocks(xml,'item').map(item=>text(one(blocks(item.inner,'link'),'RSS article link').inner));

export function inspectFeed(xml) {
  assert.match(xml,/<rss\b/);assert.match(xml,/<item>/);
  for(const link of feedURLs(xml)) {
    assert.doesNotMatch(new URL(link,'https://swaw.com/').pathname,/^\/(?:zh\/|zh-tw\/)?(?:about|wechat|rss|github|icp|powered-by|my)\//,'Information pages are excluded from feed articles.');
  }
}

export async function check(directory) {
  let pages=0;
  for(const prefix of prefixes) {
    const home=await readPage(directory,prefix+'/');
    const feed=attr(one(tags(home,'link').filter(tag=>attr(tag,'rel')==='alternate'&&attr(tag,'type')==='application/rss+xml'),'Language RSS output'),'href');
    const feedPath=decodeURIComponent(new URL(feed,extractCanonicalHref(home)).pathname).replace(/^\//,'');
    assert.ok(feedPath&&!feedPath.split('/').includes('..'),'Feed must refer to a published path.');
    const feedXML=await fs.readFile(path.join(directory,feedPath),'utf8');
    inspectFeed(feedXML);
    for(const name of ['powered-by','icp','about','wechat','github','rss']) {
      const html=await readPage(directory,prefix+'/'+name+'/');
      inspectInformation(html,name,feed);pages++;
    }
    await readPage(directory,prefix+'/offline/');
  }
  await assert.rejects(fs.access(path.join(directory,'icp/0.webp')),error=>error.code==='ENOENT','ICP source image must only publish through the fingerprinted media pipeline.');
  return {pages};
}
