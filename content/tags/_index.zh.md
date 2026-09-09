---
root_nav: true
title: 标签
linkTitle: 文章 - 分类
weight: 20
browser_title: "文章主题与标签"
description: "按主题浏览文章，涵盖 AI、开发工具、Windows 与 WSL。"
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
