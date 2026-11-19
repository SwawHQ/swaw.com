import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {readPages,pageState} from '../.agents/skills/swaw-banyan/tasks/_shared/html/read.mjs';
import {extractStartTags,extractTagAttribute as attr} from '../.agents/skills/swaw-banyan/tasks/_shared/html/markup.mjs';
import {parseYaml} from '../.agents/skills/swaw-banyan/tasks/_shared/parsers.mjs';
import {inspectPrimaryPage} from './output/nav/check.mjs';
import {extractBlocks} from '../.agents/skills/swaw-banyan/tasks/_shared/html/blocks.mjs';

const routes=JSON.parse(await fs.readFile(new URL('./fixtures/page-urls.json',import.meta.url),'utf8'));
const output=path.resolve(process.env.SWAW_CHECK_BUILD||'public');
const htmlFile=route=>path.posix.join(route.replace(/^\//,''),'index.html');

test('frozen routes have distinct sources, paths and aliases',async()=>{
  assert.ok(routes.length,'The published-address baseline must not be empty.');
  assert.equal(new Set(routes.map(route=>route.source)).size,routes.length,'Duplicate source in the address baseline.');
  const primary=new Set(routes.map(route=>route.path));
  assert.equal(primary.size,routes.length,'Duplicate published path in the address baseline.');
  const aliases=new Set();
  for(const route of routes){
    assert.ok(['en','zh','zh-tw'].includes(route.language),route.source+': unknown language.');
    await fs.access(new URL('../content/'+route.source,import.meta.url));
    for(const alias of route.aliases){
      assert.ok(!primary.has(alias),alias+': alias collides with a published page.');
      assert.ok(!aliases.has(alias),alias+': duplicate alias.');
      aliases.add(alias);
    }
  }
});

test('content URLs and aliases keep their frozen published addresses',async t=>{
  const {pages}=await readPages(output);
  const states=pages.map(pageState);
  const files=new Map(states.map(page=>[page.relativePath.replaceAll('\\','/'),page]));
  const canonical=new Map();
  for(const page of states){
    if(page.isRedirect||!page.canonicalHref)continue;
    assert.ok(!canonical.has(page.canonicalHref),page.relativePath+': canonical URL also belongs to '+canonical.get(page.canonicalHref));
    canonical.set(page.canonicalHref,page.relativePath);
  }
  for(const route of routes){
    const page=files.get(htmlFile(route.path));
    if(route.draft){
      assert.equal(page,undefined,route.source+': a draft must not publish HTML.');
      continue;
    }
    const expected=new URL(route.path,'https://swaw.com/').href;
    assert.ok(page,route.source+': missing published page '+route.path);
    assert.equal(page.isRedirect,false,route.source+': the primary address must render its page.');
    assert.equal(page.canonicalHref,expected,route.source+': published address changed.');
    for(const alias of route.aliases){
      const redirect=files.get(htmlFile(alias));
      assert.ok(redirect,route.source+': missing alias '+alias);
      assert.equal(redirect.isRedirect,true,alias+': expected a redirect page.');
      assert.equal(redirect.canonicalHref,expected,alias+': canonical target changed.');
      const refresh=extractStartTags(redirect.text,'meta').find(tag=>attr(tag,'http-equiv').toLowerCase()==='refresh');
      const target=attr(refresh||'','content').replace(/^\s*0\s*;\s*url\s*=\s*/i,'').trim();
      assert.equal(target,expected,alias+': redirect target changed.');
    }
  }
  t.diagnostic(routes.filter(route=>!route.draft).length+' published pages, '+routes.filter(route=>route.draft).length+' drafts and '+routes.flatMap(route=>route.aliases).length+' aliases checked.');
});

test('site sections use natural multilingual routes without retired roots or an aggregate feed',async()=>{
  const {pages}=await readPages(output);
  const published=pages.map(page=>page.relativePath.replaceAll('\\','/'));
  await assert.rejects(fs.access(new URL('../content/d/banyan/',import.meta.url)),error=>error.code==='ENOENT','Banyan documentation belongs to the Banyan repository.');
  for(const prefix of ['','/zh','/zh-tw']) {
    for(const [index,section] of ['pr','pb','da','d'].entries()) {
      const route=prefix+'/'+section+'/',relative=htmlFile(route);
      const html=await fs.readFile(path.join(output,relative),'utf8');
      inspectPrimaryPage(html,prefix,index);
      const source=await fs.readFile(new URL('../content/'+section+'/_index'+(prefix?'.'+prefix.slice(1):'')+'.md',import.meta.url),'utf8');
      const config=parseYaml(source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1]||'');
      assert.ok(config,'Section front matter: '+route);
      assert.equal(config.url,undefined,'Section URLs come from their content directories: '+route);
      assert.equal(config.layout,section==='da'?'page-collection-directory-all':'page-collection-directory','Authored collection layout: '+route);
      if(section==='d')assert.equal(config.build?.list,'never','Discovery remains rendered but is omitted from root navigation.');
      if(section!=='da')assert.equal(config.params?.aggregate,undefined,'Ordinary directories have no aggregate source.');
      if(section==='da') {
        assert.equal(config.params?.aggregate,'/d','Discover - All aggregates the new Discover directory.');
        assert.deepEqual(config.outputs,['HTML'],'The aggregate explicitly retains its HTML-only output.');
        assert.equal(extractStartTags(html,'link').filter(tag=>attr(tag,'type')==='application/rss+xml').length,0,'Discover - All remains HTML-only.');
        await assert.rejects(fs.access(path.join(output,route.slice(1),'index.xml')),error=>error.code==='ENOENT','The section conversion must not add RSS.');
      }
    }
    for(const retired of ['g','discover','all','tools','tools-all','t','t-all','d-all','pr-all','pr/free','pr/paid','pr/first-party','pr/third-party','d/ai','d/tooling','d/products','d/wsl','d/banyan','powered-by.debug']) {
      const oldDirectory=(prefix+'/'+retired+'/').replace(/^\//,'');
      assert.ok(published.every(file=>!file.startsWith(oldDirectory)),'Retired content routes must not render or redirect: '+oldDirectory);
    }
  }
});

test('flat collections retain discovery articles behind a hidden root entry',async()=>{
  const directLinks=async route=>{
    const html=await fs.readFile(path.join(output,htmlFile(route)),'utf8');
    const main=extractBlocks(html,'main')[0].inner;
    return extractStartTags(main,'a').filter(tag=>/\bdata-list-entry(?:\s|=|>)/.test(tag))
      .map(tag=>new URL(attr(tag,'href'),'https://swaw.com/').pathname).sort();
  };
  for(const prefix of ['','/zh','/zh-tw']) {
    const language=prefix?prefix.slice(1):'en';
    for(const [section,source] of [['pr','pr/'],['pb','pb/'],['da','d/'],['d','d/']]) {
      const expected=routes.filter(route=>route.language===language&&!route.draft&&route.source.startsWith(source)).map(route=>route.path).sort();
      assert.deepEqual(await directLinks(prefix+'/'+section+'/'),expected,'Article membership: '+prefix+'/'+section+'/');
    }
  }
});


test('WSL feature commands retain DISM options when collection routes change',async()=>{
  for(const suffix of ['','.zh','.zh-tw']) {
    const source='content/pb/wsl-guide/index'+suffix+'.md';
    const text=await fs.readFile(new URL('../'+source,import.meta.url),'utf8');
    const commands=text.match(/^dism\.exe \/online \/enable-feature [^\r\n]+/gm)||[];
    assert.equal(commands.length,2,source+': both Windows feature commands must remain present.');
    for(const command of commands)assert.match(command,/ \/all \/norestart$/,source+': /all is a DISM option, not a collection route.');
  }
});
