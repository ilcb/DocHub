---
title: Docker 构建 MySQL
description: "Docker 构建 MySQL（docker-compose 部署版本）"
slug: "/cloud-native/docker/build-mysql"
hide_table_of_contents: false
keywords: ["Docker", "MySQL"]
tags: ["Docker", "MySQL", "CloudNative"]
date: 2017-08-01
categories: ["Docker"]
---
## Docker 构建 MySQL（docker-compose 部署版本）

MySQL 是最流行的开源关系型数据库。本文按 docker-compose 方式部署 MySQL 单节点，镜像、端口、密码、容器名、数据目录等全部集中在 `.env` 中管理。

## 1. 宿主目录

| 宿主目录 | 用途 | 容器内用户 |
|---------|------|-----------|
| `/data/runtime/docker/mysql/data` | 数据库数据文件 | uid 999 |
| `/data/runtime/docker/mysql/logs` | MySQL 运行日志 | uid 999 |
| `/data/runtime/docker/mysql/conf` | 配置文件（my.cnf） | 只读 |

> 数据目录：`.env` 中 `MYSQL_DATA_DIR` / `MYSQL_LOG_DIR` 留空则回退使用 Docker 命名卷；**配置目录 `MYSQL_CONF_DIR` 为必填**，需先按第 2 节复制配置。

## 2. 创建宿主目录并设置权限

bind mount 首次使用需先建目录并授权（容器内 mysql 用户 uid 999）：

```bash
# 1) 配置目录：首次部署把部署包 conf/ 复制到宿主根，之后直接修改宿主目录下的配置
mkdir -p /data/runtime/docker/mysql/conf
cp -r ./conf/. /data/runtime/docker/mysql/conf/

# 2) 数据 / 日志目录
mkdir -p /data/runtime/docker/mysql/{data,logs}
chown -R 999:999 /data/runtime/docker/mysql
```

## 3. 编制 .env

在本目录创建 `.env` 文件（内容如下，按需修改）：

```bash
# ---------- MySQL 环境变量（集中管理） ----------
MYSQL_IMAGE=mysql:8.0.36
MYSQL_CONTAINER_NAME=mysql
MYSQL_ROOT_PASSWORD=root1234
MYSQL_DATABASE=myapp
MYSQL_USER=myapp
MYSQL_PASSWORD=myapp123
MYSQL_PORT=3306
# 宿主机数据目录（统一约定 /data/runtime/docker/<服务>）；留空则回退到命名卷
MYSQL_DATA_DIR=/data/runtime/docker/mysql/data
MYSQL_LOG_DIR=/data/runtime/docker/mysql/logs
MYSQL_CONF_DIR=/data/runtime/docker/mysql/conf
TZ=Asia/Shanghai
```

## 4. .env 变量说明

| 变量 | 说明 | 示例 |
|------|------|------|
| `MYSQL_IMAGE` | 镜像版本 | `mysql:8.0.36` |
| `MYSQL_CONTAINER_NAME` | 容器名 | `mysql` |
| `MYSQL_PORT` | 宿主机端口 | `3306` |
| `MYSQL_ROOT_PASSWORD` | root 密码 | `root1234` |
| `MYSQL_DATABASE` / `MYSQL_USER` / `MYSQL_PASSWORD` | 初始化库与业务账号 | `myapp` / `myapp` / `myapp123` |
| `MYSQL_DATA_DIR` / `MYSQL_LOG_DIR` | 数据 / 日志目录，留空回退命名卷 | `/data/runtime/docker/mysql/...` |
| `MYSQL_CONF_DIR` | 配置目录（必填，先复制 conf/） | `/data/runtime/docker/mysql/conf` |
| `TZ` | 时区 | `Asia/Shanghai` |

## 5. docker-compose.yml

在本目录创建 `docker-compose.yml`：

```yaml
services:
  mysql:
    image: ${MYSQL_IMAGE}
    container_name: ${MYSQL_CONTAINER_NAME}
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE}
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
      TZ: ${TZ}
    ports:
      - "${MYSQL_PORT}:3306"
    volumes:
      - ${MYSQL_DATA_DIR:-mysql-data}:/var/lib/mysql
      - ${MYSQL_CONF_DIR}/my.cnf:/etc/mysql/conf.d/my.cnf
      - ${MYSQL_LOG_DIR:-mysql-log}:/var/log/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-p${MYSQL_ROOT_PASSWORD}"]
      interval: 10s
      timeout: 5s
      retries: 10

volumes:
  mysql-data:
  mysql-log:
```

## 6. 启动

```bash
cd Docker构建MySQL
docker compose up -d
docker compose ps
docker compose logs -f mysql
docker compose down        # 停止并移除容器（命名卷数据保留）
docker compose down -v     # 连数据卷一起清空
```

## 7. 验证

```bash
docker exec -it mysql /bin/bash
mysql -h localhost -u root -p
# 输入 root 密码，确认连接成功
```
