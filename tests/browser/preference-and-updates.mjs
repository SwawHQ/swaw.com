import {check as checkUpdates} from '../../.agents/skills/swaw-banyan/tasks/check/browser/pwa/check/check.mjs';
import {check as checkAppearance} from '../../.agents/skills/swaw-banyan/tasks/check/browser/appearance/check.mjs';
import assert from 'node:assert/strict';
import {gotoAndWait} from '../../.agents/skills/swaw-banyan/tasks/check/browser/_shared/page.mjs';
import {waitForBrowse} from '../../.agents/skills/swaw-banyan/tasks/check/browser/_shared/viewport.mjs';
import { languageReturnScenarios } from './language-return.mjs';
import {informationLinkScenario} from './info/links.mjs';
import {informationImageScenario} from './info/images.mjs';
import {updatePanelScenario} from './pwa/panel.mjs';
import {settingsScenarios} from './settings.mjs';

export const preferenceAndUpdateScenarios = [
    ...languageReturnScenarios,
    ...settingsScenarios,
    informationLinkScenario,
    informationImageScenario,
    updatePanelScenario,
    {
        id: 'appearance-preference',
        kind: 'single',
        serviceWorkers: 'block',
        title: 'Appearance Page and Global Preference',
        async run(args) {
            const {page,baseUrl} = args;
            const result = await checkAppearance({...args,options:{page:'/zh/appearance/',from:'/zh/da/#sorts=name-asc'}});
            // This site's colored Home logo is a consumer-owned requirement.
            for (const scheme of ['light','dark']) {
                await page.emulateMedia({colorScheme:scheme});
                for (const mode of ['light','dark','auto']) {
                    await gotoAndWait(page,baseUrl+'/zh/appearance/');
                    await page.locator('.slot-main [data-theme-choice="'+mode+'"]').click();
                    await page.waitForFunction(theme=>document.documentElement.dataset.theme===theme,mode==='auto'?scheme:mode);
                    const icon = page.locator('[data-root-href="/zh/"] img.icon--image');
                    assert.equal(await icon.evaluate(image=>getComputedStyle(image).filter),'none','The site Home logo keeps its colors.');
                }
            }
            return result;
        }
    },
    {id:'sw-update-check',kind:'upgrade',title:'Manual Checks and Hidden Controls Keep Updates Waiting',
        async run(args) {
            const result=await checkUpdates({...args,options:{dir:args.upgradePair?.fromDir,next:args.upgradePair?.toDir,page:'/zh/powered-by/',from:'/zh/about/'}});
            assert.equal(await args.page.locator('[data-root-href="/zh/powered-by/"].is-current').count(),1);
            await waitForBrowse(args.page);
            assert.equal(await args.page.locator('[data-slot=breadcrumb] .item-control').count(),0,'The site overview has no child navigation.');
            return result;
        }
    }
];
