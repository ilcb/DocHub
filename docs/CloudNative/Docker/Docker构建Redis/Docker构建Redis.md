---
title: Docker 构建 Redis
description: "Docker 构建 Redis（docker-compose 部署版本）"
slug: "/cloud-native/docker/build-redis"
hide_table_of_contents: false
keywords: ["Docker"]
tags: ["Docker", "CloudNative"]
date: 2017-08-01
categories: ["Docker"]
---
## Docker 构建 Redis（docker-compose 部署版本）

Redis 是一款开源的内存键值存储数据库。本文按 docker-compose 方式部署 Redis 单节点，镜像、端口、密码、容器名、数据目录等全部集中在 `.env` 中管理。

## 1. 宿主目录

| 宿主目录 | 用途 | 容器内用户 |
|---------|------|-----------|
| `/data/runtime/docker/redis/data` | 持久化数据（AOF / RDB） | uid 999 |
| `/data/runtime/docker/redis/conf` | 配置文件（redis.conf） | 只读 |

> 数据目录：`.env` 中 `REDIS_DATA_DIR` 留空则回退使用 Docker 命名卷 `redis-data`；**配置目录 `REDIS_CONF_DIR` 为必填**，需先按第 2 节复制配置。

## 2. 创建宿主目录并设置权限

bind mount 首次使用需先建目录并授权（容器内 redis 用户 uid 999）：

```bash
# 1) 配置目录：首次部署把部署包 conf/ 复制到宿主根，之后直接修改宿主目录下的配置
mkdir -p /data/runtime/docker/redis/conf
cp -r ./conf/. /data/runtime/docker/redis/conf/

# 2) 数据目录
mkdir -p /data/runtime/docker/redis/data
chown -R 999:999 /data/runtime/docker/redis
```

## 3. 编制 .env

在本目录创建 `.env` 文件（内容如下，按需修改）：

```bash
# ---------- Redis 环境变量（集中管理） ----------
# 镜像版本
REDIS_IMAGE=redis:7.2-alpine
# 容器名
REDIS_CONTAINER_NAME=redis
# 端口 / 密码
REDIS_PORT=6379
REDIS_PASSWORD=redis123456
# 宿主机数据目录（统一约定 /data/runtime/docker/<服务>）；留空则回退到命名卷 redis-data
REDIS_DATA_DIR=/data/runtime/docker/redis/data
REDIS_CONF_DIR=/data/runtime/docker/redis/conf
TZ=Asia/Shanghai
```

## 4. .env 变量说明

| 变量 | 说明 | 示例 |
|------|------|------|
| `REDIS_IMAGE` | 镜像版本 | `redis:7.2-alpine` |
| `REDIS_CONTAINER_NAME` | 容器名 | `redis` |
| `REDIS_PORT` | 宿主机端口 | `6379` |
| `REDIS_PASSWORD` | 访问密码 | `redis123456` |
| `REDIS_DATA_DIR` | 数据目录，留空回退命名卷 | `/data/runtime/docker/redis/data` |
| `REDIS_CONF_DIR` | 配置目录（必填，先复制 conf/） | `/data/runtime/docker/redis/conf` |
| `TZ` | 时区 | `Asia/Shanghai` |

## 5. docker-compose.yml

在本目录创建 `docker-compose.yml`：

```yaml
services:
  redis:
    image: ${REDIS_IMAGE}
    container_name: ${REDIS_CONTAINER_NAME}
    restart: unless-stopped
    command: >
      redis-server /etc/redis/redis.conf
      --port ${REDIS_PORT}
      --requirepass ${REDIS_PASSWORD}
    ports:
      - "${REDIS_PORT}:${REDIS_PORT}"
    volumes:
      - ${REDIS_DATA_DIR:-redis-data}:/data
      - ${REDIS_CONF_DIR}/redis.conf:/etc/redis/redis.conf
    healthcheck:
      test: ["CMD", "redis-cli", "-p", "${REDIS_PORT}", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 10

volumes:
  redis-data:
```

> 首次部署需先按第 2 节把 `conf/` 复制到宿主目录，否则挂载路径不存在会启动失败。

## 6. 启动

```bash
cd Docker构建Redis
docker compose up -d
docker compose ps
docker compose logs -f redis
docker compose down        # 停止并移除容器（命名卷数据保留）
docker compose down -v     # 连数据卷一起清空
```

## 7. 验证

```bash
# 确认容器运行
docker ps -a | grep redis

# 进入容器验证读写
docker exec -it redis redis-cli -p 6379 -a redis123456
127.0.0.1:6379> set key value
OK
127.0.0.1:6379> get key
"value"
```
