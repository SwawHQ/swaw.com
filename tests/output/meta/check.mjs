import assert from 'node:assert/strict';
import {inspectDocumentMetadata} from '../../../.agents/skills/swaw-banyan/tasks/check/html/metadata/document.mjs';
import {inspectDocumentControls} from '../../../.agents/skills/swaw-banyan/tasks/check/html/scripts/controls.mjs';
import {prefixes,readPage,attr,has,tags,blocks,classBlocks,one,text,hrefs} from '../_shared.mjs';

export function inspectMetadata(html,prefix) {
  assert.deepEqual(inspectDocumentMetadata(html),[],'Shared document metadata checks');
  assert.deepEqual(inspectDocumentControls(html),[],'Shared document control checks');
  const meta=one(classBlocks(html,'div','document-meta'),'Document metadata');
  assert.equal(tags(meta.inner,'time').length,2,'The sample article declares updated and published dates.');
  const directories=classBlocks(meta.inner,'nav','document-meta__row--breadcrumb');
  const physical=one(directories.filter(row=>!has(row.open,'data-directory-reference')),'Sample directory path');
  assert.ok(hrefs(physical.inner).includes(prefix+'/pb/'),'Sample physical directory is Playbooks');
  const references=directories.filter(row=>has(row.open,'data-directory-reference'));
  assert.equal(references.length,0,'The guide has no redundant directory references.');
  const resources=one(classBlocks(meta.inner,'nav','document-meta__row--resources'),'Resource links');
  const icons=tags(resources.inner,'use').map(tag=>attr(tag,'href'));
  assert.ok(icons.includes('#icon-github'),'GitHub resource icon');
  if(prefix==='/zh')assert.ok(icons.includes('#icon-wechat'),'WeChat resource icon');
  const toc=one(classBlocks(html,'nav','document-toc'),'Chapter list');
  assert.ok(tags(toc.inner,'a').length>10,'The metadata fixture has a long chapter list.');
  const close=one(blocks(html,'button',tag=>attr(tag,'id')==='document-aside-close'),'Aside close control');
  assert.equal(text(close.inner),prefix?'收起':'Hide','Localized close label');
  if(prefix==='/zh') {
    const toggle=one(blocks(html,'button',tag=>attr(tag,'id')==='document-aside-toggle'),'Article aside toggle');
    assert.equal(attr(toggle.open,'aria-label'),'目录与信息','Article aside accessible label');
  }
}

export function inspectWithoutMetadata(html) {
  assert.equal(classBlocks(html,'div','document-meta').length,0,'Metadata-disabled pages must not render metadata.');
  assert.equal(classBlocks(html,'nav','document-toc').length,0,'Metadata-disabled pages must not render chapters.');
  for(const id of ['document-aside','document-aside-toggle','document-aside-close'])
    assert.equal(tags(html).filter(tag=>attr(tag,'id')===id).length,0,'Metadata-disabled pages must not render '+id+'.');
  assert.deepEqual(inspectDocumentControls(html),[],'Shared document control checks');
}

export async function check(directory) {
  let pages=0;
  for(const prefix of prefixes){inspectMetadata(await readPage(directory,prefix+'/p/swaw-kit-git/'),prefix);pages++;}
  for(const name of ['icp','language','da','offline','about']){inspectWithoutMetadata(await readPage(directory,'/zh/'+name+'/'));pages++;}
  return {pages};
}
