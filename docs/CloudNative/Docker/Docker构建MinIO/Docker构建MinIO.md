---
title: Docker 构建 MinIO
description: "Docker 构建 MinIO（docker-compose 部署版本）"
slug: "/cloud-native/docker/build-minio"
hide_table_of_contents: false
keywords: ["Docker"]
tags: ["Docker", "CloudNative"]
date: 2017-08-01
categories: ["Docker"]
---

## Docker 构建 MinIO（docker-compose 部署版本）

MinIO 是世界上最快的对象存储服务器，在标准硬件上，读写速度分别为 183GB/s 和 171GB/s。对象存储可以作为主要存储层，用于 Spark、Presto、TensorFlow、H2O.ai 以及替代产品等各种工作负载，用于 Hadoop HDFS。

MinIO 是一种高性能的分布式对象存储系统，它是软件定义的，可在行业标准硬件上运行，并且在 Apache 2.0 许可下，百分百开放源代码。

文档地址：https://docs.min.io/cn/

本文按 docker-compose 方式部署 MinIO 单节点，镜像、端口、账号、目录等全部集中在 `.env` 中管理。

## 1. 宿主目录

| 宿主目录 | 用途 | 容器内用户 |
|---------|------|-----------|
| `/data/runtime/docker/minio/data` | 对象存储数据 | root（compose 已设 `user: root`） |

> 若将 `.env` 中 `MINIO_DATA_DIR` 留空，则回退使用 Docker 命名卷 `minio-data`，无需创建宿主目录。

## 2. 创建宿主目录并设置权限

bind mount 首次使用需先建目录（容器以 root 运行，无需授权）：

```bash
mkdir -p /data/runtime/docker/minio/data
```

## 3. 编制 .env

在本目录创建 `.env` 文件（内容如下，按需修改）：

```bash
# ---------- MinIO 环境变量（集中管理） ----------
MINIO_IMAGE=minio/minio:RELEASE.2025-04-22T22-12-26Z
MINIO_CONTAINER_NAME=minio
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
MINIO_API_PORT=9000
MINIO_CONSOLE_PORT=9001
TZ=Asia/Shanghai
# 宿主机数据目录（统一约定 /data/runtime/docker/<服务>）；留空则回退到命名卷 minio-data
MINIO_DATA_DIR=/data/runtime/docker/minio/data
```

## 4. .env 变量说明

| 变量 | 说明 | 示例 |
|------|------|------|
| `MINIO_IMAGE` | 镜像版本 | `minio/minio:RELEASE.2025-04-22T22-12-26Z` |
| `MINIO_CONTAINER_NAME` | 容器名 | `minio` |
| `MINIO_API_PORT` | API 端口 | `9000` |
| `MINIO_CONSOLE_PORT` | 控制台端口 | `9001` |
| `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` | 管理员账号密码 | `minioadmin` / `minioadmin` |
| `MINIO_DATA_DIR` | 数据目录，留空回退命名卷 | `/data/runtime/docker/minio/data` |
| `TZ` | 时区 | `Asia/Shanghai` |

## 5. docker-compose.yml

在本目录创建 `docker-compose.yml`：

```yaml
services:
  minio:
    image: ${MINIO_IMAGE}
    container_name: ${MINIO_CONTAINER_NAME}
    restart: unless-stopped
    user: root
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
      TZ: ${TZ}
    ports:
      - "${MINIO_API_PORT}:9000"
      - "${MINIO_CONSOLE_PORT}:9001"
    command: server /data --console-address ":9001"
    volumes:
      - ${MINIO_DATA_DIR:-minio-data}:/data
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
    healthcheck:
      test: ["CMD", "curl", "-f", "http://127.0.0.1:9000/minio/health/live"]
      interval: 10s
      timeout: 5s
      retries: 10

volumes:
  minio-data:
```

## 6. 启动

```bash
cd Docker构建MinIO
docker compose up -d
docker compose ps
docker compose logs -f minio
docker compose down        # 停止并移除容器（命名卷数据保留）
docker compose down -v     # 连数据卷一起清空
```

## 7. 访问

- 控制台：`http://<服务器IP>:9001`，输入 `.env` 中的账号密码登录
- S3 API：`http://<服务器IP>:9000`
