import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {parseDirectory} from '../../.agents/skills/swaw-banyan/tasks/_shared/cli.mjs';
import {decodeHtmlAttribute,extractStartTags,extractTagAttribute} from '../../.agents/skills/swaw-banyan/tasks/_shared/html/markup.mjs';
import {extractBlocks,stripRawText} from '../../.agents/skills/swaw-banyan/tasks/_shared/html/blocks.mjs';

export {extractTagAttribute as attr};
export {extractBlocks as blocks};
export const prefixes=['','/zh','/zh-tw'];
export const has=(tag,name)=>new RegExp('\\s'+name+'(?=\\s|=|/?>)','i').test(tag);
export const hasClass=(tag,name)=>extractTagAttribute(tag,'class').split(/\s+/).includes(name);
export const text=html=>decodeHtmlAttribute(html.replace(/<[^>]*>/g,'')).replace(/\s+/g,' ').trim();
export const tags=(html,name)=>extractStartTags(stripRawText(html),name);
export function one(items,label) {
  assert.equal(items.length,1,label+' must occur once.');
  return items[0];
}
export const classBlocks=(html,tag,cls)=>extractBlocks(html,tag,open=>hasClass(open,cls));
export const hrefs=html=>tags(html,'a').map(tag=>extractTagAttribute(tag,'href'));
export const icon=html=>extractTagAttribute(tags(html,'use')[0]??'','href');
export const favicon=html=>extractTagAttribute(one(tags(html,'link').filter(tag=>extractTagAttribute(tag,'rel')==='icon'&&extractTagAttribute(tag,'type')==='image/svg+xml'),'SVG favicon'),'href');
export const prose=html=>one(classBlocks(html,'div','prose'),'Prose').inner;
export const readPage=(directory,route)=>fs.readFile(path.join(directory,route.replace(/^\//,'')||'.','index.html'),'utf8');

export async function run(label,description,check) {
  try {
    const directory=parseDirectory(process.argv.slice(2));
    if(directory===null){console.log('swban base/node tests/output/'+label+'/entry.mjs [dir]  # '+description+'; default: public');return;}
    const result=await check(path.resolve(directory));
    console.log(label+': '+result.pages+' pages checked');
  } catch(error){console.error(label+': '+error.message);process.exitCode=1;}
}
