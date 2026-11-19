# Swaw Site Content Inventory

Updated on 2026-11-09; editorial decisions retained from 2026-09-15.

Root navigation, site information, update pages, and product-view paths reflect
ordinary content directories and _map.toml references. Every existing article keeps its explicit URL. Retired site, PWA,
and product-category URLs are retired without redirects.

This document tracks root-site content ownership and readiness. Banyan theme
behavior is provided by `github.com/SwawHQ/banyan/module`; this file is for swaw.com business
content, site identity, and editorial cleanup decisions.

The site uses the released Banyan Module pinned in `go.mod`. Theme implementation stays in the Banyan repository.

## Ownership Rule

- Root `content/` is production site content, not a fixture warehouse.
- Root `hugo.toml` owns build and language configuration. Each language home owns its site name and default description; root pages own navigation declarations.
- Theme defaults and reusable behavior belong to the upstream Banyan Module.
- Test, demo, and starter material should not live in root production content.

## Site Shell And Identity

| Area | Paths | Status | Notes |
| --- | --- | --- | --- |
| Home | `content/_index*.md` | Keep | Site landing copy and ordinary root entry. |
| About | `content/about/index*.md` | Keep | Root entry for site identity; public `/about/` URLs preserved. |
| Powered by | `content/powered-by/` | Keep | Technology overview, source links, build metadata, inline PWA status and checks, and prefetch diagnostics in a collapsible section. The former `/powered-by.debug/` page is removed without a redirect. Banyan documentation and release notes are maintained in the Banyan repository. |
| WeChat | `content/wechat/index*.md` | Keep | Root contact handoff page; public `/wechat/` URLs preserved. |
| GitHub | `content/github/index*.md` | Keep | Root page for the SwawHQ organization. |
| RSS | `content/rss/index*.md` | Keep | Site page that resolves the current-language feed. |
| ICP | `content/icp/index*.md` | Keep | Site-owned legal root page. |
| Site metadata | `content/_index*.md`, `hugo.toml` | Keep | Each language home's `title` supplies the site name and its `description` supplies default SEO/social descriptions and the LLMS intro. `hugo.toml` keeps `params.content_source` for article source links. |

## Information Architecture

| Area | Paths | Status | Notes |
| --- | --- | --- | --- |
| Products | `content/pr/` | Keep | Products - All / 产品 - 全部 / 產品 - 全部. Flat `page-collection-directory`, currently one Xvenv bundle; no price or origin subcategories. |
| Playbooks | `content/pb/` | Keep | Playbooks - All / 实战 - 全部 / 實戰 - 全部. Flat `page-collection-directory` containing nine playbooks; no subcategories. The unpublished `/g/` section URLs are not retained or redirected in any language; article URLs remain unchanged. |
| Discover directory | `content/d/` | Hidden root entry | Discover - Topics / 发现 - 分类 / 發現 - 分類. Its own `build.list: never` omits it from root navigation; HTML, article metadata links and all three directly contained essays remain available. No topic subdirectories yet. |
| Discover view | `content/da/` | Keep | Discover - All / 发现 - 全部 / 發現 - 全部. `page-collection-directory-all` aggregates `/d/` only; products and playbooks have their own entries. |
| Article URLs | Every regular page | Keep | The url field fixes the published path. Moving a source bundle must not change its published URL; update _map.toml paths after a source move. |
| Retired collections | `/d-all/`, `/pr-all/`, `/d/ai/`, product filters and the former tooling/WSL tree | Removed | Visible root order is `/pr/`, `/pb/`, `/da/`; `/d/` remains accessible. Retired collection URLs have no redirects; article URLs and existing aliases remain unchanged. |

## Core Content Assets

| Asset | Paths |
| --- | --- |
| Xvenv | `content/pr/xvenv/` |
| WSL Practical Guide | `content/pb/wsl-guide/` |
| WSL automation script | `content/pb/swaw-kit-wsl/` |
| Win + R custom commands | `content/pb/win-run-custom-command-path/` |
| SSH reverse proxy bridge | `content/pb/ssh-reverse-port-forward-proxy/` |
| AI-era human existence | `content/d/ai-era-human-existence/` |

## Cleanup Completed

- Removed `content/d/test/index.md` on 2026-06-11. It contained mixed Xvenv
  draft text, placeholder copy, and Markdown/Doocs sample content.
- Verified that `content/d/test/` and `/p/test/index.html` no longer exist after
  the production build.
