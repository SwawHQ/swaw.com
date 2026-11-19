---
title: 发现 - 分类
description: "探索技术、人机协作与工作方式的变化和可能。按主题分类浏览内容。"
weight: 60
layout: page-collection-directory
build:
  list: never

params:
  slots: [breadcrumb]

cascade:
  - target: {kind: page}
    layout: page-article-rss
    params:
      slots: [breadcrumb, meta]
  - target: {kind: section}
    layout: page-collection-directory
    params:
      slots: [breadcrumb]
---
