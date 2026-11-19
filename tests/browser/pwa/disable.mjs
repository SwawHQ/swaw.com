import {check} from '../../../.agents/skills/swaw-banyan/tasks/check/browser/pwa/disable/check.mjs';

export const swDisableScenarios = [
    {id:'sw-disable-cleanup',kind:'upgrade',title:'Service Worker Enable To Disable Cleanup',
        viewport:{width:1280,height:960},serviceWorkers:'allow',
        run:args=>check({...args,options:{dir:args.upgradePair?.fromDir,next:args.upgradePair?.toDir,page:'/'}})}
];
