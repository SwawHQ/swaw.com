---
title: 發現 - 分類
description: "探索技術、人機協作與工作方式的變化和可能。按主題分類瀏覽內容。"
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
