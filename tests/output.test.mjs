import {test} from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {readPage,blocks,tags,attr} from './output/_shared.mjs';
import {check as checkNavigation,inspectNavigation,inspectPrimaryPage} from './output/nav/check.mjs';
import {check as checkInformation,inspectInformation,inspectFeed} from './output/info/check.mjs';
import {check as checkMetadata,inspectMetadata,inspectWithoutMetadata} from './output/meta/check.mjs';

const output=path.resolve(process.env.SWAW_CHECK_BUILD||'public');
test('all three static domains inspect the current multilingual production build',async()=>{
  assert.equal((await checkNavigation(output)).pages,33);
  assert.equal((await checkInformation(output)).pages,18);
  assert.equal((await checkMetadata(output)).pages,8);
});
test('navigation detects missing roots, wrong labels and mismatched social metadata',async()=>{
  const html=await readPage(output,'/zh/da/');
  assert.throws(()=>inspectNavigation(html.replace('data-root-href=/zh/pr/','data-removed-root=/zh/pr/'),'/zh','/zh/da/'),/Root entries occur only/);
  assert.throws(()=>inspectNavigation(html.replaceAll('发现 - 全部','错误名称'),'/zh','/zh/da/'),/Localized primary entry labels/);
  const og=tags(html,'meta').find(tag=>attr(tag,'property')==='og:title');assert.ok(og);
  assert.throws(()=>inspectPrimaryPage(html.replace(og,'<meta property=og:title content=Wrong>'),'/zh',2),/og:title/);
});

test('home navigation follows its visibility setting without hiding missing navigation elsewhere',async()=>{
  const home=await readPage(output,'/zh/');
  const homeNav=blocks(home,'nav',tag=>/\sdata-root-navigation(?:\s|=|>)/.test(tag))[0];assert.ok(homeNav);
  const hidden=home.replace(homeNav.html,'').replace(/data-home-navigation=(?:"true"|true)/,'data-home-navigation=false');
  assert.equal(attr(tags(hidden,'body')[0],'data-home-navigation'),'false');
  assert.deepEqual(inspectNavigation(hidden,'/zh','/zh/'),[]);
  const visible=await readPage(output,'/');
  const nav=blocks(visible,'nav',tag=>/\sdata-root-navigation(?:\s|=|>)/.test(tag))[0];assert.ok(nav);
  assert.throws(()=>inspectNavigation(visible.replace(nav.html,''),'','/'),/Root navigation must occur once/);
  assert.throws(()=>inspectNavigation(hidden.replace('</body>',nav.html+'</body>'),'/zh','/zh/'),/Hidden home navigation must not render a root list/);
  assert.throws(()=>inspectNavigation(hidden.replace('</body>','<a data-root-href="/zh/" href="/zh/">Home</a></body>'),'/zh','/zh/'),/Hidden home navigation must not render root entries/);
  assert.throws(()=>inspectNavigation(hidden,'/zh','/zh/pr/'),/Root navigation must occur once/);
});
test('information detects broken source links, filing text, tab isolation and feed leakage',async()=>{
  const overview=await readPage(output,'/zh/powered-by/');
  assert.throws(()=>inspectInformation(overview.replace('PWA 缓存信息：','错误标题'),'powered-by'),/PWA appendix/);
  assert.throws(()=>inspectInformation(overview.replace('更多诊断信息',''),'powered-by'),/Diagnostic summary has a label/);
  assert.throws(()=>inspectInformation(overview.replace('id=prefetch-debug-controls','id=missing-debug-controls'),'powered-by'),/Inline prefetch controls/);
  assert.throws(()=>inspectInformation(overview.replace('id=prefetch-debug-payload','id=missing-debug-payload'),'powered-by'),/Diagnostic state payload/);
  assert.throws(()=>inspectInformation(overview.replace('https://github.com/SwawHQ/banyan','https://github.com/SwawHQ/missing'),'powered-by'),/Banyan source link/);
  assert.throws(()=>inspectInformation(overview.replace('https://gohugo.io/news/','https://gohugo.io/broken/'),'powered-by'),/Hugo news link/);
  assert.throws(()=>inspectInformation(overview.replace('href=/zh/offline/','href=/offline/'),'powered-by'),/Offline page link follows the current language/);
  assert.throws(()=>inspectInformation(overview.replace('noopener noreferrer','noopener'),'powered-by'),/isolate their new tabs/);
  assert.throws(()=>inspectInformation(overview.replace('target=_blank','target=_self'),'powered-by'),/open a new tab/);
  const subscriptions=await readPage(output,'/zh/rss/');
  assert.throws(()=>inspectInformation(subscriptions.replace('category1/category2/index.xml','category1/category2/wrong.xml'),'rss','/zh/index.xml'),/Subscription URL example/);
  assert.throws(()=>inspectInformation(subscriptions.replace('</pre>','</pre><a href="/zh/d/index.xml" target="_blank" rel="noopener noreferrer">Category feed</a>'),'rss','/zh/index.xml'),/links only to the all-articles feed/);
  const filing=await readPage(output,'/zh/icp/');
  assert.throws(()=>inspectInformation(filing.replaceAll('粤ICP备2024338434号','wrong filing'),'icp'),/Filing number/);
  for(const page of ['about','powered-by','my'])
    assert.throws(()=>inspectFeed('<rss><item><link>https://swaw.com/zh/'+page+'/</link></item></rss>'),/excluded from feed/);
  inspectFeed('<rss><item><link>https://swaw.com/zh/p/guide/</link><description>&lt;a href="/zh/about/"&gt;About&lt;/a&gt;</description></item></rss>');
});
test('metadata detects missing sample dates, wrong directory reference and a wrong aside label',async()=>{
  const html=await readPage(output,'/zh/p/swaw-kit-git/');
  const dateRow=blocks(html,'div',tag=>attr(tag,'class').split(/\s+/).includes('document-meta__row')).find(row=>tags(row.inner,'time').length);
  assert.ok(dateRow);
  assert.throws(()=>inspectMetadata(html.replace(dateRow.html,''),'/zh'),/sample article declares/);
  assert.throws(()=>inspectMetadata(html.replaceAll('/zh/pb/','/zh/d/wrong/'),'/zh'),/physical directory is Playbooks/);
  assert.throws(()=>inspectMetadata(html.replaceAll('目录与信息','Chapters'),'/zh'),/Article aside accessible label/);
  const toggle=tags(html,'button').find(tag=>attr(tag,'id')==='document-aside-toggle');assert.ok(toggle);
  assert.throws(()=>inspectMetadata(html.replace(toggle,toggle.replace('aria-label','data-removed-label')),'/zh'),/Article aside accessible label/);
});

test('metadata-disabled pages reject unexpected metadata, chapters and aside controls',async()=>{
  const about=await readPage(output,'/zh/about/');
  for(const element of ['<div class="document-meta"></div>','<nav class="document-toc"></nav>',
    '<aside id="document-aside"></aside>','<button id="document-aside-toggle"></button>','<button id="document-aside-close"></button>'])
    assert.throws(()=>inspectWithoutMetadata(about.replace('</body>',element+'</body>')),/Metadata-disabled pages/);
});
test('static entry reports a missing build with a failing exit code',()=>{
  const result=spawnSync(process.execPath,['tests/output/nav/entry.mjs',path.join(output,'missing-build')],{encoding:'utf8'});
  assert.ifError(result.error);assert.equal(result.status,1);assert.match(result.stderr,/ENOENT/);
});
