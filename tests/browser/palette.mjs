import {check as checkContrast} from '../../.agents/skills/swaw-banyan/tasks/check/browser/palette/contrast/check.mjs';
import {check as checkRoles} from '../../.agents/skills/swaw-banyan/tasks/check/browser/palette/roles/check.mjs';

export const paletteScenarios = [
  {id:'palette-text-contrast',kind:'single',serviceWorkers:'block',title:'Prose and Code Text Contrast',run:args=>checkContrast({...args,options:{page:'/zh/about/',min:4.5}})},
  {id:'palette-neutral-customization',kind:'single',serviceWorkers:'block',title:'Derived Neutral Palette Roles',run:args=>checkRoles({...args,options:{page:'/zh/about/'}})}
];
