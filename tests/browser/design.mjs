import path from 'node:path';
import {gotoAndWait} from '../../.agents/skills/swaw-banyan/tasks/check/browser/_shared/page.mjs';
import {waitForBrowse} from '../../.agents/skills/swaw-banyan/tasks/check/browser/_shared/viewport.mjs';

const ARTICLE_PAGE_PATH = process.env.BANYAN_BROWSER_ARTICLE_PATH || '/about/';
const DESIGN_AUDIT_VIEWPORTS = [
    {
        id: 'mobile',
        title: 'Mobile',
        viewport: { width: 390, height: 844 }
    },
    {
        id: 'medium',
        title: 'Medium',
        viewport: { width: 1024, height: 960 }
    },
    {
        id: 'wide',
        title: 'Wide',
        viewport: { width: 1440, height: 1100 }
    }
];
const DESIGN_AUDIT_PAGES = [
    {
        id: 'home',
        path: '/',
        title: 'Home',
        waitForSelector: '[data-root-navigation]'
    },
    {
        id: 'tools',
        path: '/pr/',
        title: 'Products',
        waitForSelector: '[data-sortable]'
    },
    {
        id: 'article',
        path: ARTICLE_PAGE_PATH,
        title: 'Article',
        waitForSelector: '.article'
    }
];



async function settleDesignAuditPage(page) {
    await waitForBrowse(page).catch(() => { });
    await page.evaluate(() => new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
    }));
}

async function readDesignAuditMetrics(page, viewportId) {
    return page.evaluate((activeViewportId) => {
        const rect = (selector) => {
            const node = document.querySelector(selector);
            if (!(node instanceof HTMLElement)) return null;
            const box = node.getBoundingClientRect();
            return {
                height: box.height,
                width: box.width,
                x: box.x,
                y: box.y
            };
        };
        const navLabels = Array.from(document.querySelectorAll('[data-root-navigation] a'))
            .map((node) => (node.textContent || '').trim())
            .filter(Boolean)
            .slice(0, 16);
        return {
            documentHeight: document.documentElement.scrollHeight,
            hasRailContext: (() => {
                const node = document.querySelector('[data-root-navigation]');
                return node instanceof HTMLElement && getComputedStyle(node).display !== 'none';
            })(),
            main: rect('.slot-main'),
            page: rect('.page'),
            pathname: location.pathname,
            rail: rect('.page-rail'),
            shell: rect('.page-shell'),
            title: document.title,
            navigation: rect('[data-root-navigation]'),
            navigationLabels: navLabels,
            viewportId: activeViewportId,
            visibleBreadcrumb: (() => {
                const node = document.querySelector('.breadcrumb-navigation');
                if (!(node instanceof HTMLElement)) return false;
                const style = getComputedStyle(node);
                return style.display !== 'none'
                    && style.visibility !== 'hidden'
                    && node.getClientRects().length > 0;
            })()
        };
    }, viewportId);
}

function createDesignAuditScenario(pageConfig, viewportConfig) {
    return {
        id: `design-audit-${pageConfig.id}-${viewportConfig.id}`,
        kind: 'single',
        title: `Design Audit ${pageConfig.title} (${viewportConfig.title})`,
        viewport: viewportConfig.viewport,
        async run({ artifactDir, baseUrl, page }) {
            await gotoAndWait(page, `${baseUrl}${pageConfig.path}`);
            await page.waitForSelector(pageConfig.waitForSelector);
            await settleDesignAuditPage(page);

            const screenshotPath = path.join(artifactDir, 'capture.png');
            await page.screenshot({
                fullPage: true,
                path: screenshotPath
            });

            return {
                artifacts: {
                    screenshot: screenshotPath
                },
                details: await readDesignAuditMetrics(page, viewportConfig.id),
                message: `Captured ${pageConfig.id} at ${viewportConfig.id}.`
            };
        }
    };
}

export const designAuditScenarios = DESIGN_AUDIT_PAGES.flatMap((pageConfig) => (
    DESIGN_AUDIT_VIEWPORTS.map((viewportConfig) => createDesignAuditScenario(pageConfig, viewportConfig))
));
