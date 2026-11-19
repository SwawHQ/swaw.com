---
title: RSS 訂閱
description: 使用 RSS 閱讀器訂閱文章更新。
date: 2026-09-08
url: rss/
layout: page-article-norss
weight: 90

params:
  icon: rss
  slots: [breadcrumb]
---

將訂閱網址新增到 RSS 閱讀器，即可接收文章更新。

## 全部文章 {#all-articles}

{{< rss-link >}}

## 分類訂閱 {#by-section}

對**分類**或**子分類**列表頁面，移除網址中的 `?`、`#` 及其後的內容（若有），加上 `index.xml`，即為訂閱網址。範例（假設存在 `category1/category2/` 分類路徑）：

```text
分類頁面：{{< site-root >}}category1/category2/
分類頁面：{{< site-root >}}category1/category2/#...
分類頁面：{{< site-root >}}category1/category2/?...
訂閱網址：{{< site-root >}}category1/category2/index.xml
```

> 單篇文章頁面不提供 RSS 訂閱網址。\
> 父分類的訂閱也包含其子分類中的文章。\
> 站長可能關閉某些分類的 RSS 訂閱。
