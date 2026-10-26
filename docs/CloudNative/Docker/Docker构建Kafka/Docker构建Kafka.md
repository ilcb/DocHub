---
title: Docker 构建 Kafka
description: "Docker 构建 Kafka（docker-compose 部署版本）"
slug: "/cloud-native/docker/build-kafka"
hide_table_of_contents: false
keywords: ["Docker", "Kafka"]
tags: ["Docker", "Kafka", "CloudNative"]
date: 2017-08-01
categories: ["Docker"]
---
## Docker 构建 Kafka（docker-compose 部署版本）

Kafka 是分布式事件流平台。本文按 docker-compose 方式部署 **KRaft 单节点**（bitnami/kafka，broker 与 controller 一体，**不再依赖 ZooKeeper**），镜像、端口、目录、容器名等全部集中在 `.env` 中管理。

> 如仍需 ZooKeeper 版本，可参照「Docker构建ZooKeeper」。

## 1. 宿主目录

| 宿主目录 | 用途 | 容器内用户 |
|---------|------|-----------|
| `/data/runtime/docker/kafka/data` | Kafka 数据与日志 | uid 1001 |

> 若将 `.env` 中 `KAFKA_DATA_DIR` 留空，则回退使用 Docker 命名卷 `kafka-data`，无需创建宿主目录。

## 2. 创建宿主目录并设置权限

bind mount 首次使用需先建目录并授权（bitnami/kafka 容器内用户 uid 1001）：

```bash
mkdir -p /data/runtime/docker/kafka/data
chown -R 1001:1001 /data/runtime/docker/kafka
```

## 3. 编制 .env

在本目录创建 `.env` 文件（内容如下，按需修改）：

```bash
# ---------- Kafka（KRaft 单节点）环境变量（集中管理） ----------
# 测试环境用 localhost 对外暴露；若客户端在其它机器上跑，改成本机可达 IP。
KAFKA_IMAGE=bitnami/kafka:3.4.0
KAFKA_ADVERTISED_HOST=localhost
KAFKA_PORT=9092
# KRaft controller 监听端口（容器内部使用，不映射宿主机，勿与 PLAINTEXT 混用）
KAFKA_CONTROLLER_PORT=9093
KAFKA_CONTAINER_NAME=kafka
# 宿主机数据目录（统一约定 /data/runtime/docker/<服务>）；留空则回退到命名卷 kafka-data
KAFKA_DATA_DIR=/data/runtime/docker/kafka/data
TZ=Asia/Shanghai
```

## 4. .env 变量说明

| 变量 | 说明 | 示例 |
|------|------|------|
| `KAFKA_IMAGE` | 镜像版本 | `bitnami/kafka:3.4.0` |
| `KAFKA_ADVERTISED_HOST` | 对外通告地址（客户端连接用，跨机需改本机 IP） | `localhost` |
| `KAFKA_PORT` | 客户端端口 | `9092` |
| `KAFKA_CONTROLLER_PORT` | KRaft controller 监听端口（容器内部使用，不映射宿主机） | `9093` |
| `KAFKA_CONTAINER_NAME` | 容器名 | `kafka` |
| `KAFKA_DATA_DIR` | 数据目录，留空回退命名卷 | `/data/runtime/docker/kafka/data` |
| `TZ` | 时区 | `Asia/Shanghai` |

## 5. docker-compose.yml

在本目录创建 `docker-compose.yml`：

```yaml
services:
  kafka:
    image: ${KAFKA_IMAGE}
    container_name: ${KAFKA_CONTAINER_NAME}
    restart: unless-stopped
    ports:
      # 仅 PLAINTEXT（客户端）对外暴露；CONTROLLER 为 KRaft 内部协议，不映射宿主机，
      # 避免 9093 与其它教程（如 Prometheus 套件的 Alertmanager）冲突
      - "${KAFKA_PORT}:9092"
    environment:
      # KRaft 单节点：同时充当 controller 和 broker
      KAFKA_CFG_NODE_ID: 1
      KAFKA_CFG_PROCESS_ROLES: controller,broker
      KAFKA_CFG_LISTENERS: CONTROLLER://:${KAFKA_CONTROLLER_PORT},PLAINTEXT://:9092
      # 对外通告地址，供客户端连接；跨机时改 .env 里 KAFKA_ADVERTISED_HOST
      KAFKA_CFG_ADVERTISED_LISTENERS: PLAINTEXT://${KAFKA_ADVERTISED_HOST}:${KAFKA_PORT}
      KAFKA_CFG_CONTROLLER_LISTENER_NAMES: CONTROLLER
      KAFKA_CFG_CONTROLLER_QUORUM_VOTERS: 1@localhost:${KAFKA_CONTROLLER_PORT}
      KAFKA_CFG_LISTENER_SECURITY_PROTOCOL_MAP: CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT
      KAFKA_CFG_INTER_BROKER_LISTENER_NAME: PLAINTEXT
      KAFKA_KRAFT_CLUSTER_ID: "MkU3OEVBNTcwNTJENDM2Qk"
      KAFKA_CFG_AUTO_CREATE_TOPICS_ENABLE: "true"
      KAFKA_CFG_NUM_PARTITIONS: 3
      KAFKA_CFG_DEFAULT_REPLICATION_FACTOR: 1
      ALLOW_PLAINTEXT_LISTENER: "yes"
      TZ: ${TZ}
    volumes:
      - ${KAFKA_DATA_DIR:-kafka-data}:/bitnami/kafka

volumes:
  kafka-data:
```

## 6. 启动

```bash
cd Docker构建Kafka
docker compose up -d
docker compose ps
docker compose logs -f kafka
docker compose down        # 停止并移除容器（命名卷数据保留）
docker compose down -v     # 连数据卷一起清空
```

## 7. 验证

### 启动生产者

```bash
docker exec -it kafka bash
cd /opt/bitnami/kafka/bin/
./kafka-console-producer.sh --broker-list localhost:9092 --topic first-topic
>First Message!
```

### 启动消费者

```bash
docker exec -it kafka bash
cd /opt/bitnami/kafka/bin/
./kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic first-topic --from-beginning
# 能收到生产者的消息即验证通过
```
