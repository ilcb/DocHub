---
title: 安装 Docker Compose
description: "Docker Compose 离线安装教程（独立二进制 / Docker CLI 插件）"
slug: "/cloud-native/docker/compose-install"
hide_table_of_contents: false
keywords: ["Docker", "Docker Compose", "离线安装", "docker-compose"]
tags: ["Docker", "Docker Compose", "CloudNative"]
date: 2026-10-26
categories: ["Docker"]
---

# 安装 Docker Compose（离线）

Docker Compose 用于定义和运行多容器应用，本目录下各中间件（MySQL、Redis、Kafka 等）均采用 `docker compose` 部署。

对于无法访问外网的离线环境，需要在一台有网机器上提前下载 docker-compose 二进制，再拷贝到目标服务器完成安装。

> Docker Compose v2 是使用 Go 语言编译的单一静态二进制文件，不依赖 Python 运行环境，拷贝到服务器即可运行，非常适合离线安装。

## 1. 安装准备

### 1.1 环境要求

- Linux x86_64 架构服务器（其他架构请下载对应版本）
- 已安装 Docker（可参照《安装 Docker》一文；Docker 25 及以上建议安装为 CLI 插件，见第 3 节）
- 一台可访问外网的机器（仅用于下载，下载完成后离线服务器全程无需联网）

### 1.2 下载安装包

下载地址如下：

[docker/compose releases](https://github.com/docker/compose/releases)

这里我们选择安装最新版本 `v5.6.1`，下载 `docker-compose-linux-x86_64`：

```bash
curl -SL "https://github.com/docker/compose/releases/download/v5.6.1/docker-compose-linux-x86_64" -o docker-compose
```

> 若需下载指定版本，将 URL 中的 `v5.6.1` 替换为目标版本号即可；不同平台/架构对应不同文件名，如 `docker-compose-darwin-x86_64`（macOS）、`docker-compose-windows-x86_64.exe`（Windows）、arm64 等。

### 1.3 校验文件完整性（可选）

同时下载 `checksums.txt`，比对 sha256：

```bash
curl -SL "https://github.com/docker/compose/releases/download/v5.6.1/checksums.txt" -o checksums.txt
sha256sum docker-compose
grep "docker-compose-linux-x86_64" checksums.txt
```

### 1.4 上传到离线服务器

将下载的 docker-compose 通过 U 盘、scp 等方式传输到服务器任意目录（如 /opt/compose/）：

```bash
scp docker-compose root@<服务器IP>:/opt/compose/
```

## 2. 分步安装法

### 2.1 复制文件到 /usr/local/bin

将 docker-compose 复制到 /usr/local/bin：

```bash
cp docker-compose /usr/local/bin/docker-compose
```

### 2.2 添加可执行权限

```bash
chmod +x /usr/local/bin/docker-compose
```

### 2.3 查看版本

```bash
docker-compose -v
```

看到版本号如 `Docker Compose version v5.6.1` 即安装成功。

## 3. 安装为 Docker CLI 插件（Docker 25+ 推荐）

Docker 25 起官方推荐使用 `docker compose`（子命令形式）替代独立的 `docker-compose` 命令，本目录各中间件文档均采用 `docker compose` 部署。

### 3.1 复制到 cli-plugins 目录

```bash
mkdir -p /usr/local/lib/docker/cli-plugins
cp docker-compose /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
```

### 3.2 验证

```bash
docker compose version
```

> 同一份二进制既可以放在 `/usr/local/bin` 作为独立命令使用，也可以放在 `cli-plugins` 作为插件使用，两者共存互不影响。若服务器上同时部署 Harbor 等旧软件，其安装脚本会调用 `docker-compose` 独立命令，建议两种方式都配置。

## 4. 一键安装法

### 4.1 制作 install.sh

在与 docker-compose 同目录下创建 install.sh，将以下内容复制进去，保存退出：

```bash
#!/bin/sh
echo '安装 docker-compose 到 /usr/local/bin'
cp docker-compose /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

echo '安装为 docker cli 插件'
mkdir -p /usr/local/lib/docker/cli-plugins
cp docker-compose /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

echo '查看版本'
docker-compose -v
docker compose version
echo 'docker-compose 安装成功'
```

### 4.2 制作 uninstall.sh

```bash
#!/bin/sh
echo '删除独立命令'
rm -f /usr/local/bin/docker-compose
echo '删除 cli 插件'
rm -f /usr/local/lib/docker/cli-plugins/docker-compose
echo '卸载成功'
```

### 4.3 执行安装

```bash
chmod +x install.sh uninstall.sh
sh install.sh
```

## 5. 验证部署

编写一个简单的 compose 文件测试部署：

```yaml
services:
  web:
    image: nginx:1.27
    container_name: compose-test
    ports:
      - "8080:80"
```

```bash
docker compose up -d
docker compose ps
curl http://localhost:8080
docker compose down
```

> 离线环境下 compose 只负责编排，镜像仍需提前在有网机器上 `docker save` 导出、在离线服务器 `docker load` 导入，具体可参照本目录各中间件的构建文档。

## 6. 常见问题

### 6.1 提示 command not found

`/usr/local/bin` 不在 PATH 中。执行 `export PATH=$PATH:/usr/local/bin`，或安装到 `/usr/bin`：

```bash
cp docker-compose /usr/bin/docker-compose
chmod +x /usr/bin/docker-compose
```

### 6.2 提示 exec format error

二进制架构与服务器不一致（如在 aarch64 服务器上安装了 x86_64 版本）。需下载对应架构版本，文件名含 `arm64` 或 `aarch64` 的包可在 [docker/compose releases](https://github.com/docker/compose/releases) 查看。

### 6.3 与旧版 pip 安装的 docker-compose 冲突

旧环境可能通过 `pip install docker-compose` 安装了 v1（Python 版），`docker-compose -v` 显示为 `docker-compose version 1.x`。可先卸载：

```bash
pip uninstall docker-compose
```

再按本文步骤安装 v2 二进制，或直接使用 `docker compose` 子命令。

### 6.4 未安装插件时 docker compose 报错

`docker compose` 子命令由 Docker CLI 插件机制加载，安装第 3 节插件即可；未安装时执行 `docker compose` 会提示：

```txt
docker: 'compose' is not a docker command.
```
