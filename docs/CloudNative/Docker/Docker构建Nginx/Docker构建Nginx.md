---
title: Docker 构建 Nginx
description: "Docker 构建 Nginx（docker-compose 部署版本）"
slug: "/cloud-native/docker/build-ngnix"
hide_table_of_contents: false
keywords: ["Docker"]
tags: ["Docker", "CloudNative"]
date: 2017-08-01
categories: ["Docker"]
---
## Docker 构建 Nginx（docker-compose 部署版本）

Nginx 是高性能的反向代理 / 负载均衡中间件。本文按 docker-compose 方式部署 Nginx，配置统一放在宿主目录 `NGINX_CONF_DIR`（默认 `/data/runtime/docker/nginx/conf`，含 `nginx.conf` 主配置 + `conf.d/` 子配置），镜像、端口、目录、容器名等全部集中在 `.env` 中管理。

> 容器内的文件修改在容器重启后会丢失，所以将配置文件、日志、静态页面映射到宿主机，见下方 volumes 配置。

## 1. 宿主目录

| 宿主目录 | 用途 | 容器内用户 |
|---------|------|-----------|
| `/data/runtime/docker/nginx/html` | 静态网站目录 | 只读即可 |
| `/data/runtime/docker/nginx/logs` | 访问 / 错误日志 | uid 101（worker 写日志） |
| `/data/runtime/docker/nginx/conf` | 配置文件（nginx.conf、conf.d/） | 只读 |

> 数据目录：`.env` 中 `NGINX_HTML_DIR` / `NGINX_LOGS_DIR` 留空则回退使用 Docker 命名卷；**配置目录 `NGINX_CONF_DIR` 为必填**，需先按第 2 节复制配置。

## 2. 创建宿主目录并设置权限

bind mount 首次使用需先建目录（html 只读即可，logs 授权 nginx worker uid 101 写日志）：

```bash
# 1) 配置目录：首次部署把部署包 conf/ 复制到宿主根，之后直接修改宿主目录下的配置
mkdir -p /data/runtime/docker/nginx/conf
cp -r ./conf/. /data/runtime/docker/nginx/conf/

# 2) 网站 / 日志目录
mkdir -p /data/runtime/docker/nginx/{html,logs}
chown -R 101:101 /data/runtime/docker/nginx/logs
```

## 3. 编制 .env

在本目录创建 `.env` 文件（内容如下，按需修改）：

```bash
# ---------- Nginx 环境变量（集中管理） ----------

# ===== 镜像配置 =====
NGINX_IMAGE=nginx:1.26.3
NGINX_CONTAINER_NAME=nginx

# ===== 宿主机端口映射（宿主机:容器）=====
NGINX_HTTP_PORT=80
NGINX_HTTPS_PORT=443

# ===== 宿主机目录（统一约定 /data/runtime/docker/<服务>）=====
NGINX_HTML_DIR=/data/runtime/docker/nginx/html     # 静态网站目录
NGINX_LOGS_DIR=/data/runtime/docker/nginx/logs     # 日志
NGINX_CONF_DIR=/data/runtime/docker/nginx/conf     # 配置（nginx.conf、conf.d）
```

## 4. .env 变量说明

| 变量 | 说明 | 示例 |
|------|------|------|
| `NGINX_IMAGE` | 镜像版本 | `nginx:1.26.3` |
| `NGINX_CONTAINER_NAME` | 容器名 | `nginx` |
| `NGINX_HTTP_PORT` | HTTP 端口 | `80` |
| `NGINX_HTTPS_PORT` | HTTPS 端口 | `443` |
| `NGINX_HTML_DIR` | 静态网站目录 | `/data/runtime/docker/nginx/html` |
| `NGINX_LOGS_DIR` | 日志目录 | `/data/runtime/docker/nginx/logs` |
| `NGINX_CONF_DIR` | 配置目录（必填，先复制 conf/） | `/data/runtime/docker/nginx/conf` |

## 5. docker-compose.yml

在本目录创建 `docker-compose.yml`：

```yaml
services:
  nginx:
    image: ${NGINX_IMAGE}
    container_name: ${NGINX_CONTAINER_NAME}
    restart: unless-stopped
    ports:
      - "${NGINX_HTTP_PORT}:80"
      - "${NGINX_HTTPS_PORT}:443"
    volumes:
      - ${NGINX_CONF_DIR}/nginx.conf:/etc/nginx/nginx.conf
      - ${NGINX_CONF_DIR}/conf.d:/etc/nginx/conf.d
      - ${NGINX_HTML_DIR:-nginx-html}:/usr/share/nginx/html
      - ${NGINX_LOGS_DIR:-nginx-logs}:/var/log/nginx
      - /etc/localtime:/etc/localtime:ro
      - /etc/timezone:/etc/timezone:ro
    networks:
      - nginx-network

volumes:
  nginx-html:
  nginx-logs:

networks:
  nginx-network:
    driver: bridge
```

## 6. 启动

```bash
cd Docker构建Nginx
docker compose up -d
docker compose ps
docker compose logs -f nginx
docker compose down
```

## 7. 验证

```bash
# 确认运行状态
docker ps -a | grep nginx

# 本机访问
curl http://localhost:80
# 或浏览器打开 http://<服务器IP>:80
```
