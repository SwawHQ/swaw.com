# Swaw Site Content Inventory

Current as of 2026-09-09.

Root navigation, site information, update pages, and product-view paths reflect
the flattened content model. Article URLs are preserved; retired site, PWA, and
product-category URLs have permanent redirects.

This document tracks root-site content ownership and readiness. Banyan theme
behavior lives under `themes/banyan/`; this file is for swaw.com business
content, site identity, and editorial cleanup decisions.

## Ownership Rule

- Root `content/` is production site content, not a fixture warehouse.
- Root `content/fragments/` is swaw.com-owned copy and navigation wiring.
- Theme defaults and reusable behavior belong in `themes/banyan/`.
- Test, demo, and starter material should not live in root production content.

## Site Shell And Identity

| Area | Paths | Status | Notes |
| --- | --- | --- | --- |
| Home | `content/_index*.md` | Keep | Site landing copy and ordinary root entry. |
| About | `content/about/index*.md` | Keep | Root entry for site identity; public `/about/` URLs preserved. |
| Updates | `content/updates/`, `themes/banyan/content/updates/` | Keep | Root entry with real check and changelog children; changelog keeps public `/changelog/`. |
| WeChat | `content/wechat/index*.md` | Keep | Root contact handoff page; public `/wechat/` URLs preserved. |
| GitHub | `content/github/index*.md` | Keep | Root page for the SwawHQ organization. |
| RSS | `content/rss/index*.md` | Keep | Root page that resolves the current-language feed. |
| ICP | `content/icp/index*.md` | Keep | Site-owned legal root page. |
| Site metadata | `content/fragments/site-meta/` | Keep | SEO, source links, and site metadata. |

## Information Architecture

| Area | Paths | Status | Notes |
| --- | --- | --- | --- |
| Tags taxonomy | `content/tags/` | Keep | Site-owned topic taxonomy. |
| Product section | `content/d/products/` | Keep | Product articles remain here; each product has one content bundle. |
| Product views | `themes/banyan/content/products/`, `themes/banyan/content/all-products/` | Keep | Theme-provided taxonomy and deduplicated all-products views. Retired `/product-categories/` paths redirect. |
| Article views | `themes/banyan/content/all/`, `themes/banyan/content/d/` | Keep | All-article view plus hidden directory exploration root. |
| WSL section | `content/d/wsl/` | Keep | WSL knowledge cluster. |

## Core Content Assets

| Asset | Paths | Current Shape | Next Editorial Decision |
| --- | --- | --- | --- |
| Xvenv | `content/d/products/xvenv/` | Full Simplified Chinese page; English and Traditional Chinese are gateway pages. | Decide whether Xvenv needs full non-Chinese pages before adding another product page. |
| WSL Practical Guide | `content/d/wsl/guide/` | Full Simplified Chinese guide; English and Traditional Chinese are gateway pages. | Keep as reference asset; translate only if non-Chinese traffic becomes a priority. |
| WSL automation script | `content/d/wsl/automng/` | Simplified Chinese primary page; English and Traditional Chinese are gateway pages. | Keep near WSL guide; clarify whether it is a product, tool note, or appendix. |
| Win + R custom commands | `content/d/win-run-custom-command-path/` | Simplified Chinese primary page; English and Traditional Chinese are gateway pages. | Keep as tooling article; consider whether it should belong under a Windows cluster. |
| SSH reverse proxy bridge | `content/d/ssh-reverse-port-forward-proxy/` | Simplified Chinese primary page; English and Traditional Chinese are gateway pages. | Keep as deployment troubleshooting reference. |
| AI-era human existence | `content/d/ai-era-human-existence/` | Full three-language thought piece. | Keep as thought-leadership content; do not mix with tooling/product cleanup decisions. |

## Gateway Page Policy

Gateway pages are acceptable when a full translation is not available, as long as
they are explicit and do not pretend to be complete translations.

Current gateway pattern:

- A short localized title and description.
- A clear note that the full article is currently available in Simplified
  Chinese.
- A direct link to the Simplified Chinese page.
- `build.list: never` when the gateway should not compete as a full list item.

## Cleanup Completed

- Removed `content/d/test/index.md` on 2026-06-11. It contained mixed Xvenv
  draft text, placeholder copy, and Markdown/Doocs sample content.
- Verified that `content/d/test/` and `/p/test/index.html` no longer exist after
  the production build.

## Next Content Moves

1. Decide whether gateway pages are a deliberate long-term policy or a temporary
   bridge for high-value pages only.
2. Pick one core growth surface: Xvenv product polish, WSL reference authority,
   or Windows tooling cluster.
3. Avoid adding new content clusters until the chosen growth surface has a clear
   primary page and supporting pages.
