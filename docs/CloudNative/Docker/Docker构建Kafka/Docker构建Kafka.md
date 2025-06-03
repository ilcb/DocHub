---
title: Docker 构建 Kafka
description: "Docker 构建 Kafka"
slug: "/cloud-native/docker/build-kafka"
hide_table_of_contents: false
keywords: ["Docker", "Kafka"]
tags: ["Docker", "Kafka", "CloudNative"]
date: 2017-08-01
categories: ["Docker"]
---
## Docker 构建 Kafka

## 1.查询 ZooKeeper 镜像

``````bash
docker search kafka
``````

![查询镜像](img/查询镜像.jpg)

## 2.拉取镜像

```bash
docker pull bitnami/kafka
```

## 3.启动 zookeeper

```bash
docker run -d \
           --name zookeeper \
           --privileged=true \
           --restart=always \
           -p 2181:2181 \
           -v /data/docker/zookeeper/data:/data \
           -v /data/docker/zookeeper/conf:/conf \
           -v /data/docker/zookeeper/logs:/datalog \
           zookeeper
```

4.启动 kafka

```bash
docker run -d \
           --name kafka \
           -p 9092:9092 \
           --restart=always \
           -e KAFKA_BROKER_ID=0 \
           -e KAFKA_ZOOKEEPER_CONNECT=docker.for.mac.host.internal:2181/kafka \
           -e KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://docker.for.mac.host.internal:9092 \
           -e KAFKA_LISTENERS=PLAINTEXT://0.0.0.0:9092 \
           -e ALLOW_PLAINTEXT_LISTENER=yes \
           bitnami/kafka
```
### 参数解析

> -d: 指定容器后台运行
>
> –name kafka: 指定容器别名
>
> -p: 参数指定端口号
>
> -e: 设置 docker 容器内环境变量
>
> > 在 kafka 集群中，每个 kafka 都有一个 BROKER_ID 来区分自己
> - KAFKA_BROKER_ID=0
> > 配置 zookeeper 管理 kafka 的路径
> - `KAFKA_ZOOKEEPER_CONNECT={host-ip}:{zookeeper-port}/kafka`
>
> > 把 kafka 的地址端口注册给 zookeeper
>
> - `KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://{host-ip}:9092`
> > 允许使用 PLAINTEXT 侦听器
> - ALLOW_PLAINTEXT_LISTENER

## 4.验证容器状态

### 启动 kafka 生产者

```bash
$ docker exec -it kafka bash
I have no name!@439a150128f5:/$ cd /opt/bitnami/kafka/bin/
I have no name!@439a150128f5:/opt/bitnami/kafka/bin$ ./kafka-console-producer.sh --broker-list localhost:9092 --topic first-topic
```

### 启动 kafka 消费者

```bash
docker exec -it kafka bash
I have no name!@439a150128f5:/$ cd /opt/bitnami/kafka/bin/
I have no name!@439a150128f5:/opt/bitnami/kafka/bin$ ./kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic first-topic --from-beginning
```

### 生产者发布消息

```bash
 docker exec -it kafka bash
I have no name!@439a150128f5:/$ cd /opt/bitnami/kafka/bin/
I have no name!@439a150128f5:/opt/bitnami/kafka/bin$ ./kafka-console-producer.sh --broker-list localhost:9092 --topic first-topic
>First Message!
```

### 消费者接受消息

```bash
docker exec -it kafka bash
I have no name!@439a150128f5:/$ cd /opt/bitnami/kafka/bin/
I have no name!@439a150128f5:/opt/bitnami/kafka/bin$ ./kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic first-topic --from-beginning
[2023-04-01 08:38:41,612] WARN [Consumer clientId=console-consumer, groupId=console-consumer-47284] Error while fetching metadata with correlation id 2 : {first-topic=LEADER_NOT_AVAILABLE} (org.apache.kafka.clients.NetworkClient)
[2023-04-01 08:38:41,743] WARN [Consumer clientId=console-consumer, groupId=console-consumer-47284] Error while fetching metadata with correlation id 4 : {first-topic=LEADER_NOT_AVAILABLE} (org.apache.kafka.clients.NetworkClient)
[2023-04-01 08:38:41,920] WARN [Consumer clientId=console-consumer, groupId=console-consumer-47284] Error while fetching metadata with correlation id 6 : {first-topic=LEADER_NOT_AVAILABLE} (org.apache.kafka.clients.NetworkClient)
[2023-04-01 08:38:42,044] WARN [Consumer clientId=console-consumer, groupId=console-consumer-47284] Error while fetching metadata with correlation id 8 : {first-topic=LEADER_NOT_AVAILABLE} (org.apache.kafka.clients.NetworkClient)
[2023-04-01 08:38:42,213] WARN [Consumer clientId=console-consumer, groupId=console-consumer-47284] Error while fetching metadata with correlation id 10 : {first-topic=LEADER_NOT_AVAILABLE} (org.apache.kafka.clients.NetworkClient)
First Message!
```

