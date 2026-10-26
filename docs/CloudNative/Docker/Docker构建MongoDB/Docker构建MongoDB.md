---
title: Docker 构建 MongoDB
description: "Docker 构建 MongoDB（docker-compose 部署版本）"
slug: "/cloud-native/docker/build-mongo"
hide_table_of_contents: false
keywords: ["Docker", "MongoDB"]
tags: ["Docker", "MongoDB", "CloudNative"]
date: 2017-08-01
categories: ["Docker"]
---
## Docker 构建 MongoDB（docker-compose 部署版本）

MongoDB 是一款开源的非关系型文档数据库。本文按 docker-compose 方式部署 MongoDB 单节点（开启鉴权），镜像、端口、账号、容器名、数据目录等全部集中在 `.env` 中管理。

## 1. 宿主目录

| 宿主目录 | 用途 | 容器内用户 |
|---------|------|-----------|
| `/data/runtime/docker/mongodb/data` | 数据文件 | uid 999 |
| `/data/runtime/docker/mongodb/config` | 配置数据库 | uid 999 |

> 若将 `.env` 中 `MONGO_DATA_DIR` / `MONGO_CONFIG_DIR` 留空，则回退使用 Docker 命名卷 `mongo-data` / `mongo-config`，无需创建宿主目录。

## 2. 创建宿主目录并设置权限

bind mount 首次使用需先建目录并授权（容器内 mongodb 用户 uid 999）：

```bash
mkdir -p /data/runtime/docker/mongodb/{data,config}
chown -R 999:999 /data/runtime/docker/mongodb
```

## 3. 编制 .env

在本目录创建 `.env` 文件（内容如下，按需修改）：

```bash
# ---------- MongoDB 环境变量（集中管理） ----------
MONGO_IMAGE=mongo:7.0.2
MONGO_ROOT_USER=admin
MONGO_ROOT_PASSWORD=root_password
MONGO_PORT=27017
MONGO_CONTAINER_NAME=mongodb
# 宿主机数据目录（统一约定 /data/runtime/docker/<服务>）；留空则回退到命名卷
MONGO_DATA_DIR=/data/runtime/docker/mongodb/data
MONGO_CONFIG_DIR=/data/runtime/docker/mongodb/config
TZ=Asia/Shanghai
```

## 4. .env 变量说明

| 变量 | 说明 | 示例 |
|------|------|------|
| `MONGO_IMAGE` | 镜像版本 | `mongo:7.0.2` |
| `MONGO_CONTAINER_NAME` | 容器名 | `mongodb` |
| `MONGO_PORT` | 宿主机端口 | `27017` |
| `MONGO_ROOT_USER` / `MONGO_ROOT_PASSWORD` | 管理员账号密码 | `admin` / `root_password` |
| `MONGO_DATA_DIR` / `MONGO_CONFIG_DIR` | 数据 / 配置目录，留空回退命名卷 | `/data/runtime/docker/mongodb/...` |
| `TZ` | 时区 | `Asia/Shanghai` |

## 5. docker-compose.yml

在本目录创建 `docker-compose.yml`：

```yaml
services:
  mongodb:
    image: ${MONGO_IMAGE}
    container_name: ${MONGO_CONTAINER_NAME}
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_ROOT_USER}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
      MONGO_INITDB_DATABASE: admin
      TZ: ${TZ}
    ports:
      - "${MONGO_PORT}:27017"
    command:
      - "--auth"
      - "--bind_ip_all"
    volumes:
      - ${MONGO_DATA_DIR:-mongo-data}:/data/db
      - ${MONGO_CONFIG_DIR:-mongo-config}:/data/configdb
    healthcheck:
      test: ["CMD", "mongosh", "--quiet", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 10

volumes:
  mongo-data:
  mongo-config:
```

## 6. 启动

```bash
cd Docker构建MongoDB
docker compose up -d
docker compose ps
docker compose logs -f mongodb
docker compose down        # 停止并移除容器（命名卷数据保留）
docker compose down -v     # 连数据卷一起清空
```

## 7. 验证

```bash
# root 用户进入 MongoDB 验证
docker exec -it mongodb mongosh -u admin -p root_password --authenticationDatabase admin
```

### 创建业务用户

```bash
use admin
db.createUser({
  user: 'admin',
  pwd: 'admin123456',
  roles: [
    { role: "userAdminAnyDatabase", db: "admin" },
    { role: "readWriteAnyDatabase", db: "admin" },
    { role: "dbAdminAnyDatabase", db: "admin" },
    { role: "clusterAdmin", db: "admin" }
  ]
});
```

### 验证用户创建

```bash
docker exec -it mongodb mongosh -u admin -p admin123456 --authenticationDatabase admin
```
