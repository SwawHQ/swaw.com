---
root_nav: true
title: 標籤
linkTitle: 文章 - 分類
weight: 20
browser_title: "文章主題與標籤"
description: "按主題瀏覽文章，涵蓋 AI、開發工具、Windows 與 WSL。"
layout: article-list
list: directory
slots:
  breadcrumb: true
cascade:
  - target:
      kind: term
    layout: article-list
    slots:
      breadcrumb: true
banyan_taxonomy:
  mode: tree
  article_weight: 30
  normalize: lower
  article_mode: deepest_by_root
  term_rel: tag
  unassigned_term: untagged
  unassigned_label: --untagged--
---
