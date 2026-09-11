---
date: "2026-08-10T00:00:00+08:00"
draft: false
title: "「工具」AI Agent 远程控制 Windows"
linkTitle: "Codex 管理远程 Windows"
slug: "swaw-kit-rdp-client"
description: "Swaw Kit RDP Client 把一个 Windows RDP 账号做成 Codex 可调用、可验证的本地入口；配合 SSH，它为聊天式远程运维提供清楚的账号与会话边界。"
tags:
 - tooling/devtools/windows
---

AI 能很快写出一条远程命令；难的不是“把命令写出来”，而是让下一次的你、或 Codex，知道该对哪台 Windows 的哪个账号执行、执行前该检查什么、执行后如何确认结果。

例如，你对 Codex 说：“看看办公室 Windows 上有没有人在用管理员会话；如果需要我处理界面问题，再打开正确的远程桌面。”这句话不应迫使 Agent 猜 IP、账号、RDP 文件或是否会撞上另一套保存的凭据。

Swaw Kit RDP Client 的工作，就是把这个上下文收敛成一个稳定命令：

```text
rdp-office-admin
  = 一份 RDP 属性
  + 一个账号专用的连接别名
  + 可选的 SSH 会话管理通道
```

它不替代 Windows 自带的 `mstsc.exe`，也不宣称 Agent 已能自主看懂和点击任意远程桌面。它先解决更基础、也更容易被忽略的事情：让 Agent 有一条名称清楚、边界明确、能检查前置条件的远程 Windows 通道。

## 一、聊天式远程运维，需要两条通道

真正适合 Agent 的远程运维，通常不是把所有工作塞进 RDP：

```text
你 ↔ Codex
      ├─ SSH：检查状态、执行命令、回传结果
      └─ RDP / Shadow：定位具体桌面会话，处理需要图形界面的例外
```

配套的 SSH 入口负责命令执行；本工具负责 RDP 账号、桌面会话和可视化接管。这样，常规检查不必打开桌面，只有浏览器、Windows 专属 IDE、安装程序或已有用户会话确实需要界面时，才进入 RDP。

这也解释了为什么它不是一个“批量远程控制 Windows”的噱头。批量检查和配置更适合 SSH、WinRM 等非交互通道；RDP 是 Agent 发现命令世界不够用时，交给人处理的最后一公里。

## 二、它可以用于什么

### 1. 远程开发或构建机器

一台放在办公室、家里或机房的 Windows，经常承载 Windows 专属 SDK、签名工具、浏览器调试环境或构建任务。让 Agent 先通过 SSH 检查磁盘、进程和构建结果；需要打开图形工具时，再调用对应 RDP 入口。你不必记住“这台机器该用哪个管理员账号”。

### 2. 无人值守 Windows 的日常维护

远程机器可能平时只需检查服务、日志或会话；遇到黑屏、卡住的安装器、需要确认的桌面提示，才切换到 RDP 或 Shadow。入口把这些操作限定在一个已命名账号，而不是临时把密码、IP 和一串参数交给 Agent。

### 3. 对既有用户会话进行协助

若配置了独立 SSH 入口，工具可先列出会话，再精确连接指定会话，或用 Shadow 协助已有桌面。涉及远端 Shadow 设置的操作有 `doctor`、状态检查、`--dry-run` 与 `restore`；应先观察再修改。

## 三、三步建立一个 Agent 可调用的 RDP 入口

```cmd
git clone https://github.com/swawai/swaw-kit
cd swaw-kit
copy Favorites\template.rdp1.cmd rdp-office-admin.cmd
```

编辑 `rdp-office-admin.cmd` 时，真正需要理解的只有几处：

- `RDP_HOST_ALIAS`：给这个「主机 + 账号」起一个稳定别名，例如 `office-administrator.rdp.home.arpa`。同一真实主机上的不同账号，必须使用不同别名。
- 嵌入在文件中的 RDP 属性：填写真实的 `full address`、`username`，再按需选择窗口尺寸、剪贴板、磁盘重定向等。
- `RDP_PEER_SSH_ENTRY`：可选的、独立配置的 SSH 入口；需要查询会话、Shadow 或调用对端 PsExec 时才填写。
- `RDP_OUTPUT_PATH`：留空就把生成的 `.rdp` 放在当前 Windows 用户的桌面。

若填写了别名，并且 `full address` 是实际 IP 地址，首次配置后运行：

```cmd
.\rdp-office-admin.cmd .hosts install --uac
.\rdp-office-admin.cmd
```

前一条命令会在系统 `hosts` 中建立带归属标记的映射；后一条命令生成或复用 `.rdp`，再交给系统远程桌面客户端打开。生成文件中的目标改为账号专用别名，Windows 因而把它视为独立的凭据目标。

## 四、为什么不让 Agent 临时写一个脚本

临时脚本当然能启动 `mstsc`，但它通常没有回答四个问题：目标账号是谁？该地址是否会与其他凭据冲突？修改了什么？失败后怎么确认或回退？

本入口把这些约束写进了可读文件中：`.rdp` 默认不覆盖；`hosts` 映射可查看、修复和清理；生成文件可安装当前用户专用签名；SSH 相关的会话与 Shadow 操作有状态检查。它让“能执行”变成“值得托管给 Agent 执行”。

这正是 AI Coding 时代仍值得保留工具的原因：生成命令越来越便宜，可靠的操作边界、验证方式和恢复路径并不会自动出现。

## 五、边界要先说清

这个工具不会替你开放 3389 端口、绕过 Windows 登录策略，或替代 VPN、RD Gateway 等网络入口。当前它也不会让 Codex 自动观察和点击远程桌面；要实现完整的 GUI Agent，仍需要独立的屏幕访问、视觉控制和权限审计层。

它的职责更小也更可靠：把「一个 Windows RDP 账号」建模成可命名、可调用、可验证的资源。对于需要人机协作的远程 Windows，这正是值得先打牢的一层。

如果你也用 SSH 管理 Windows 或 VPS，可以配合阅读 [把每台 VPS 变成本地命令](/zh/p/ssh-remote-kit-windows/)；项目代码见 [swaw-kit](https://github.com/swawai/swaw-kit)。完整命令列表随入口运行 `.help` 查看。
