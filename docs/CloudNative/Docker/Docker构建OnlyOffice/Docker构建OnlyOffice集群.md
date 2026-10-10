---
title: Docker 构建 OnlyOffice 集群
description: "Docker 构建 OnlyOffice 集群（docker-compose 部署版本）"
slug: "/cloud-native/docker/build-onlyoffice-cluster"
hide_table_of_contents: false
keywords: ["Docker"]
tags: ["Docker", "CloudNative"]
date: 2017-08-01
categories: ["Docker"]
---

# Docker 构建 OnlyOffice 集群（docker-compose 部署版本）

# 1. 选型

因为项目需要，需要在内网的环境下部署一套 office 的在线编辑软件。综合对比了几种主流解决方案，onlyoffice 比较合适：

| 解决方案 | 在线预览 | 在线编辑 | 本地依赖 | 内网使用 | 私有化部署 | 免费使用 |
| -------- | -------- | -------- | -------- | -------- | ---------- | -------- |
| onlyoffice | √ | √ | 无 | √ | √ | √ 最大 20 连接数 |
| collabora | √ | √ | 无 | √ | √ | √ 最大 20 连接数 |
| MS Office Online | √ | √ | 无 | √ | √ | 预览免费编辑需购买 |
| google Doc | √ | √ | 无 | × | × | √ |
| 永中 Office | √ | × | 无 | × | × | √ |
| pageOffice | √ | √ | Office 软件 | √ | √ | × |

OnlyOffice 项目信息：
- API 文档：https://api.onlyoffice.com/editors/basic
- 项目地址：https://github.com/ONLYOFFICE/Docker-DocumentServer
- 官方示例：https://api.onlyoffice.com/zh/editors/basic

本文按 docker-compose 方式部署 **PostgreSQL + 3 个 OnlyOffice 实例（8091-8093）+ Nginx 负载均衡（80）** 的伪集群，镜像、端口、目录、容器名等全部集中在 `.env` 中管理。

# 2. 宿主目录

| 宿主目录 | 用途 | 容器内用户 |
|---------|------|-----------|
| `/data/runtime/docker/onlyoffice/postgres` | PostgreSQL 数据（三个实例共用） | uid 999 |
| `/data/runtime/docker/onlyoffice/DocumentServer` | OnlyOffice 文档数据 / 日志 / 缓存 | root（compose 已设 privileged） |
| `/data/runtime/docker/onlyoffice/conf` | 配置文件（nginx/office.conf） | 只读 |

> 数据目录：`.env` 中 `ONLYOFFICE_DB_DIR` / `ONLYOFFICE_DATA_DIR` 留空则回退使用 Docker 命名卷；**配置目录 `ONLYOFFICE_CONF_DIR` 为必填**，需先按第 3 节复制配置。

# 3. 创建宿主目录并设置权限

bind mount 首次使用需先建目录（postgres 授权 uid 999；onlyoffice 以 root 运行无需授权）：

```bash
# 1) 配置目录：首次部署把部署包 conf/ 复制到宿主根，之后直接修改宿主目录下的配置
mkdir -p /data/runtime/docker/onlyoffice/conf
cp -r ./conf/. /data/runtime/docker/onlyoffice/conf/

# 2) 数据目录
mkdir -p /data/runtime/docker/onlyoffice/{postgres,DocumentServer}
chown -R 999:999 /data/runtime/docker/onlyoffice/postgres
```

# 4. 编制 .env

在本目录创建 `.env` 文件（内容如下，按需修改）：

```bash
# ---------- OnlyOffice 伪集群环境变量（集中管理） ----------
# 官方镜像；如按文档第 10 节重新构建了自定义镜像（开启 WOPI / 换 logo），
# 把这里改为自定义镜像名，例如 exfoide/onlyoffice:7.3.3
ONLYOFFICE_IMAGE=onlyoffice/documentserver:7.3.3
POSTGRES_IMAGE=postgres:16.3
NGINX_IMAGE=nginx:1.26.3

# 负载均衡入口端口（Nginx）
ONLYOFFICE_LB_PORT=80

# 宿主机数据目录（统一约定 /data/runtime/docker/<服务>）；留空则回退到命名卷
ONLYOFFICE_DB_DIR=/data/runtime/docker/onlyoffice/postgres
ONLYOFFICE_DATA_DIR=/data/runtime/docker/onlyoffice/DocumentServer
ONLYOFFICE_CONF_DIR=/data/runtime/docker/onlyoffice/conf
TZ=Asia/Shanghai
```

# 5. .env 变量说明

| 变量 | 说明 | 示例 |
|------|------|------|
| `ONLYOFFICE_IMAGE` | OnlyOffice 镜像（官方或自定义重建镜像） | `onlyoffice/documentserver:7.3.3` |
| `POSTGRES_IMAGE` / `NGINX_IMAGE` | 依赖组件镜像 | `postgres:16.3` / `nginx:1.26.3` |
| `ONLYOFFICE_LB_PORT` | Nginx 负载均衡入口端口 | `80` |
| `ONLYOFFICE_DB_DIR` / `ONLYOFFICE_DATA_DIR` | 数据目录，留空回退命名卷 | `/data/runtime/docker/onlyoffice/...` |
| `ONLYOFFICE_CONF_DIR` | 配置目录（必填，先复制 conf/） | `/data/runtime/docker/onlyoffice/conf` |
| `TZ` | 时区 | `Asia/Shanghai` |

# 6. docker-compose.yml

在本目录创建 `docker-compose.yml`：

```yaml
x-onlyoffice: &onlyoffice
  image: ${ONLYOFFICE_IMAGE}
  restart: always
  stdin_open: true
  stop_grace_period: 60s
  privileged: true
  environment:
    DB_TYPE: postgres
    DB_HOST: postgres
    DB_PORT: 5432
    DB_NAME: onlyoffice
    DB_USER: onlyoffice
    DB_PASS: onlyoffice
    JWT_ENABLED: "false"
  depends_on:
    - postgres

services:
  postgres:
    image: ${POSTGRES_IMAGE}
    container_name: onlyoffice-postgres
    restart: always
    environment:
      POSTGRES_USER: onlyoffice
      POSTGRES_PASSWORD: onlyoffice
      POSTGRES_DB: onlyoffice
      TZ: ${TZ}
    volumes:
      - ${ONLYOFFICE_DB_DIR:-oo-postgres-data}:/var/lib/postgresql/data

  onlyoffice-8091:
    <<: *onlyoffice
    container_name: onlyoffice-8091
    ports: ["8091:80"]
    volumes:
      - ${ONLYOFFICE_DATA_DIR:-oo-data}/logs:/var/log/onlyoffice
      - ${ONLYOFFICE_DATA_DIR:-oo-data}/data:/var/www/onlyoffice/Data
      - ${ONLYOFFICE_DATA_DIR:-oo-data}/lib:/var/lib/onlyoffice
      - ${ONLYOFFICE_DATA_DIR:-oo-data}/db:/var/lib/postgresql
      - ${ONLYOFFICE_DATA_DIR:-oo-data}/cache/files:/var/lib/onlyoffice/documentserver/App_Data/cache/files
      - /usr/share/fonts

  onlyoffice-8092:
    <<: *onlyoffice
    container_name: onlyoffice-8092
    ports: ["8092:80"]
    volumes:
      - ${ONLYOFFICE_DATA_DIR:-oo-data}/logs:/var/log/onlyoffice
      - ${ONLYOFFICE_DATA_DIR:-oo-data}/data:/var/www/onlyoffice/Data
      - ${ONLYOFFICE_DATA_DIR:-oo-data}/lib:/var/lib/onlyoffice
      - ${ONLYOFFICE_DATA_DIR:-oo-data}/db:/var/lib/postgresql
      - ${ONLYOFFICE_DATA_DIR:-oo-data}/cache/files:/var/lib/onlyoffice/documentserver/App_Data/cache/files
      - /usr/share/fonts

  onlyoffice-8093:
    <<: *onlyoffice
    container_name: onlyoffice-8093
    ports: ["8093:80"]
    volumes:
      - ${ONLYOFFICE_DATA_DIR:-oo-data}/logs:/var/log/onlyoffice
      - ${ONLYOFFICE_DATA_DIR:-oo-data}/data:/var/www/onlyoffice/Data
      - ${ONLYOFFICE_DATA_DIR:-oo-data}/lib:/var/lib/onlyoffice
      - ${ONLYOFFICE_DATA_DIR:-oo-data}/db:/var/lib/postgresql
      - ${ONLYOFFICE_DATA_DIR:-oo-data}/cache/files:/var/lib/onlyoffice/documentserver/App_Data/cache/files
      - /usr/share/fonts

  nginx:
    image: ${NGINX_IMAGE}
    container_name: onlyoffice-nginx
    restart: always
    ports:
      - "${ONLYOFFICE_LB_PORT}:80"
    volumes:
      - ${ONLYOFFICE_CONF_DIR}/nginx/office.conf:/etc/nginx/conf.d/office.conf:ro
    depends_on:
      - onlyoffice-8091
      - onlyoffice-8092
      - onlyoffice-8093
```

# 7. Nginx 负载配置（`${ONLYOFFICE_CONF_DIR}/nginx/office.conf`）

```nginx
upstream office {
  hash $remote_addr consistent;
  server onlyoffice-8091:80;
  server onlyoffice-8092:80;
  server onlyoffice-8093:80;
}

server {
    listen       80;
    server_name  localhost;

    location / {
        proxy_pass http://office;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $http_host;
        proxy_set_header X-Nginx-Proxy true;

        # WebSocket 配置
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        add_header X-Route-Ip $upstream_addr;
        add_header X-Route-Status $upstream_status;
    }
}
```

# 8. 启动集群

```bash
cd Docker构建OnlyOffice
docker compose up -d       # 启动 PostgreSQL + 3 个 OnlyOffice 实例 + Nginx
docker compose ps
docker compose logs -f
docker compose down        # 停止并移除容器（命名卷数据保留）
docker compose down -v     # 连数据卷一起清空
```

本方案启动 3 个 onlyoffice 实例：`onlyoffice-8091`、`onlyoffice-8092`、`onlyoffice-8093`，由 Nginx（端口 80）负载均衡。

# 9. 验证

浏览器访问 `http://<服务器IP>:80`，能正常打开 OnlyOffice 欢迎页即部署成功；多次刷新可见 `X-Route-Ip` 响应头在 8091/8092/8093 间轮换。

# 10. 重制 OnlyOffice 镜像（可选）

官方镜像默认不支持 WOPI 协议，且编辑器 logo 为 `ONLYOFFICE`。如需改造：

1. 编写 `Dockerfile`（基于 `onlyoffice/documentserver`，替换 logo、覆盖 `local.json` 开启 wopi）：
   - `local.json` 中新增：

```json
"wopi": { "enable": true },
"ipfilter": {
  "rules": [ { "address": "*", "allowed": true } ],
  "useforrequest": true,
  "errorcode": 403
}
```

2. 构建自定义镜像：`docker build --no-cache -f ./Dockerfile -t exfoide/onlyoffice:7.3.3 .`
3. 把 `.env` 中 `ONLYOFFICE_IMAGE` 改为自定义镜像名后重新 `docker compose up -d`

# 11. OnlyOffice 集成 WOPI 协议（摘要）

WOPI（Web Application Open Platform Interface）让宿主系统（WOPI Host）通过 REST API 与 OnlyOffice 客户端交换文件，交互流程：

1. 浏览器请求 WOPI Host 页面，Host 返回带 `access_token` 的编辑器地址
2. 编辑器（Client）携带 token 调用 Host 接口获取文件信息（CheckFileInfo）、文件内容（GetFile）
3. 用户编辑完成后编辑器调用 PutFile 保存，Lock/UnLock/RefreshLock 控制并发编辑

角色划分：
- **Web Office 编辑器**：浏览器中渲染的 OnlyOffice 前端
- **WOPI 服务器（Host）**：实现 [WOPI REST API](https://api.onlyoffice.com/zh/editors/wopi/restapi) 的文件管理系统
- **WOPI 客户端（Client）**：提供 Office 查看/编辑能力的平台（即本方案部署的 OnlyOffice）

官方文档：https://api.onlyoffice.com/zh/editors/wopi/
