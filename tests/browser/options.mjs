import {browserCommand} from '../../.agents/skills/swaw-banyan/tasks/check/browser/_shared/options.mjs';
import {suites} from './suites.mjs';

export function command() {
  const spec=browserCommand('base/node tests/browser/entry.mjs',[
    {name:'suite',value:'name',default:'main',description:Object.keys(suites).join(', '),parse:value=>{
      if(!Object.hasOwn(suites,value))throw new Error('Unknown suite: '+value+'. Choose '+Object.keys(suites).join(', ')+'.');
      return value;
    }},
    {name:'only',value:'ids',description:'Comma-separated scenario IDs from this suite; use --list to discover them',parse:value=>{
      const ids=value.split(',');
      if(ids.some(id=>!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id))||new Set(ids).size!==ids.length)
        throw new Error('--only must contain distinct, comma-separated scenario IDs.');
      return ids;
    }},
    {name:'next',value:'dir',description:'Explicit next build; required for updates and disable suites'},
    {name:'list',default:false,description:'List selected scenario IDs without reading builds or opening a browser'}
  ]);
  spec.options.find(option=>option.name==='out').description='Report parent directory; default: system temporary directory';
  spec.options.find(option=>option.name==='trace').description='Save a Playwright trace for each scenario';
  spec.examples=[
    'base/node tests/browser/entry.mjs ./public',
    'base/node tests/browser/entry.mjs ./preview --suite smoke --headed --trace',
    'base/node tests/browser/entry.mjs --suite webkit --list',
    'base/node tests/browser/entry.mjs ./old --suite updates --next ./new',
    'base/node tests/browser/entry.mjs ./enabled --suite disable --next ./disabled'
  ];
  return spec;
}

export function help() {
  return [
    'swban base/node tests/browser/entry.mjs [dir]  #Run swaw.com checks; default: public',
    '  --suite <name>   #'+Object.keys(suites).join(', '),
    '  --only <ids>     #Run the listed comma-separated scenario IDs',
    '  --next <dir>     #Next build for program-update or disable checks',
    '  --list           #List scenarios without reading a build',
    '  --headed         #Show the browser',
    '  --trace          #Save a browser trace for each scenario',
    '  --out <dir>      #Report parent; default: system temporary directory',
    '  --timeout <ms>   #Browser operation timeout; default: 15000'
  ].join('\n');
}
