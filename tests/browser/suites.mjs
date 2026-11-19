import {scenarios,securityScenarios,upgradeScenarios} from './scenarios.mjs';
import {designAuditScenarios} from './design.mjs';
import {speculationScenarios} from './prefetch.mjs';
import {swDisableScenarios} from './pwa/disable.mjs';
import {canvasScenarios} from './canvas.mjs';
import {loadChromium,loadWebkit} from '../../.agents/skills/swaw-banyan/tasks/_shared/browser/runtime.mjs';
import {check as checkContrast} from '../../.agents/skills/swaw-banyan/tasks/check/browser/palette/contrast/check.mjs';

function selected(items,ids) {
  const unknown=ids.filter(id=>!items.some(item=>item.id===id));
  if(unknown.length)throw new Error('Unknown scenario(s): '+unknown.join(', '));
  return items.filter(item=>ids.includes(item.id));
}

const webkitScenarios=[
  {id:'palette-text-contrast',kind:'single',serviceWorkers:'block',title:'Prose and Code Text Contrast',
    run:args=>checkContrast({...args,options:{page:'/zh/about/',min:4.5}})},
  ...selected(canvasScenarios,[
    'canvas-source-navigation','canvas-append-column','canvas-document-aside',
    'document-aside-navigation','document-aside-mobile-toggle','document-aside-desktop-toggle',
    'canvas-first-frame-slow-runtime','canvas-history-scroll-restoration',
    'canvas-mobile-native-scrollbar','canvas-desktop-auto-scrollbar',
    'canvas-column-scroll-ownership','canvas-anchors'
  ]).map(scenario=>({...scenario,isMobile:scenario.isMobile||scenario.id==='canvas-source-navigation'}))
];

export const suites={
  main:{scenarios,load:loadChromium,staticChecks:true},
  smoke:{scenarios:selected(scenarios,['home-shell-smoke','breadcrumb-collection-wide-stability','breadcrumb-directory-wide-stability']),load:loadChromium},
  security:{scenarios:securityScenarios,load:loadChromium},
  prefetch:{scenarios:speculationScenarios,load:loadChromium},
  updates:{scenarios:upgradeScenarios,load:loadChromium,requireNext:true},
  disable:{scenarios:swDisableScenarios,load:loadChromium,requireNext:true},
  design:{scenarios:designAuditScenarios,load:loadChromium},
  webkit:{scenarios:webkitScenarios,load:loadWebkit}
};

export function selectSuite(name,ids=[]) {
  const suite=suites[name];
  if(!Object.hasOwn(suites,name))throw new Error('Unknown suite: '+name+'. Choose '+Object.keys(suites).join(', ')+'.');
  return {...suite,scenarios:ids.length?selected(suite.scenarios,ids):suite.scenarios};
}
