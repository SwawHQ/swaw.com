---
title: 搜尋
layout: page-search
weight: 25
outputs: [HTML]
params:
  icon: search
  robots: noindex, follow
  slots: []
  index:
    source: rss
    selector: ".article .prose"
  labels:
    prompt: "輸入關鍵字，搜尋目前語言的內容。"
    loading: "搜尋中…"
    count: "找到 {count} 筆結果"
    empty: "找不到結果。"
    error: "搜尋暫時無法使用，請重試或重新整理頁面。"
    more: "更多結果"
    no_script: "請啟用 JavaScript 後搜尋。"
---
