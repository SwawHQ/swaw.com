# swaw.com 站点检查

本站检查保留品牌、备案、账号、固定导航项和文章样本。通用行为复用
`.agents/skills/swaw-banyan/`，站点根不需要 npm 依赖。
下文 `swban` 指 `.agents/skills/swaw-banyan/swban.cmd`；从本站根目录调用。

本站使用 `go.mod` 固定的 Banyan Module。从本站根目录构建，
验收产物、缓存和报告使用系统临时目录。已有 `public/` 不作为本次验收结果。

构建和通用检查：

```text
swban server --port 5120                     #本地预览
swban build --destination <build>            #生产构建和搜索索引
swban check/browser/site <build>                          #通用浏览器巡检
swban check/delivery <build>                              #交付配置与产物
swban check/csp <build>                                   #CSP 与内联脚本哈希
```

本站静态检查：

```text
swban base/node tests/output/nav/entry.mjs <build>   #导航顺序、文案、图标与元数据
swban base/node tests/output/info/entry.mjs <build>  #品牌、备案、账号、外链与各语言 RSS
swban base/node tests/output/meta/entry.mjs <build>  #样本日期、目录引用、资源图标与侧栏
```

省略构建目录时读取 `public/`；入口支持 `--help`。

本站浏览器检查：

```text
swban base/node tests/browser/entry.mjs <build>                         #静态检查与主场景
swban base/node tests/browser/entry.mjs <build> --suite smoke           #快速检查
swban base/node tests/browser/entry.mjs <build> --suite webkit          #WebKit 布局与滚动
swban base/node tests/browser/entry.mjs <build> --headed --trace        #显示浏览器并保存追踪
swban base/node tests/browser/entry.mjs --suite main --list             #列出场景
swban base/node tests/browser/entry.mjs <build> --only info-links       #指定场景
swban base/node tests/browser/entry.mjs <old> --suite updates --next <new>  #SW 程序更新
swban base/node tests/browser/entry.mjs <on> --suite disable --next <off>   #停用与清理 SW
swban base/node tests/browser/entry.mjs --help                          #参数与默认值
```

`--suite` 支持 main、smoke、security、prefetch、updates、disable、design 和 webkit。
main 先运行三个本站静态检查；缺少构建对时，更新场景记为跳过。
updates 要求两个启用 SW、且 `sw.js` 不同的构建，检查等待期间的导航与自然激活。
disable 要求启用版和 `assets/site/delivery.toml` 中 `sw.mode="disable"` 的构建。
内容版本更新另用 `swban check/browser/pwa/content <old> --next <new>`；两份构建的
`sw.js` 必须相同，`sw-version.json` 必须不同。

`--out` 指定报告父目录，默认系统临时目录。报告含 JSON、失败截图及请求的追踪；
验收后清理本任务报告。用 `swban base/browser/ensure` 或
`swban base/browser/ensure.webkit` 准备浏览器。

测试按职责组织：

- `output/{nav,info,meta}/`：本站内容和配置预期；HTML 提取与通用断言复用 Skill。
- `browser/`：本站路径与场景组合；服务器、浏览器和报告复用 Skill。
- `browser/design.mjs`：截图与布局数据，供人工观察。
- `*.test.mjs`：检查代码自身的故障用例及网址迁移约束。

首页、我的、搜索排在可见根栏目之前，三个语言版本使用相同权重。搜索按各语言的首页 RSS 收录，正式构建同时生成 Pagefind 索引。
可见根栏目按 `pr`、`pb`、`da` 排序，名称均带“全部”后缀。`d` 通过自身的
`build.list: never` 隐藏根导航入口，保留页面渲染和文章元信息链接，不向正文继承。
产品与实战分别放在 `content/pr/` 和
`content/pb/`，暂不设子分类；发现只在 `content/d/` 收录三篇观察与思考文章。
旧 `/g/` 栏目从未发布，三种语言均不生成旧栏目页或跳转；正文 `/p/.../` 地址不变。
`pr`、`pb`、`d` 使用 `page-collection-directory`，`da` 使用
`page-collection-directory-all` 聚合 `/d`。以后需要跨目录收录时使用 `_map.toml`。
`content-routing.test.mjs` 验证平铺栏目归属、隐藏目录的可访问性及现有正文网址与别名。
导航来源和排序使用网址片段；文章本身的发布网址由 `url` 字段固定。首页使用 `page-collection-wall-all` 汇总 `/pb`，图片墙配置为 `size.width/height`、`details`、`scroll`；保留的首页艺术包位于 `content/_res/home-art/`；离线页位于 `content/_res/offline/`，保留已有发布网址。预取诊断通过短代码内嵌在 `content/powered-by/` 的折叠区，原 `/powered-by.debug/` 页面移除且不保留重定向。

检查代码自身的故障用例：

```powershell
$env:SWAW_CHECK_BUILD = '<临时构建的绝对路径>'
swban base/node --test tests/output.test.mjs tests/content-routing.test.mjs
swban base/node --test tests/browser-entry.test.mjs
Remove-Item Env:SWAW_CHECK_BUILD
```

未设置 `SWAW_CHECK_BUILD` 时读取 `public/`。故障用例在内存或隔离临时副本中修改产物，
不修改生产内容。浏览器入口测试需要 Chromium 与 WebKit。
