---
title: Docker 构建 MinIO
description: "Docker 构建 MinIO"
slug: "/cloud-native/docker/build-minio"
hide_table_of_contents: false
keywords: ["Docker"]
tags: ["Docker", "CloudNative"]
date: 2017-08-01
categories: ["Docker"]
---

## Docker 构建 MinIO

### 简介

MinIO 是世界上最快的对象存储服务器，在标准硬件上，读写速度分贝为 183GB/s 和 171GB/s，对象存储可以作为主要存储层，用于 Spark，Presto，TensorFlow，H20.ai 以及替代产品等各种工作负载用于 Hadoop HDFS

MinIO 是一种高性能的分布式对象存储系统，它是软件定义的，可在行业标准硬件上运行，并且在 Apache 2.0 许可下，百分百开放源代码。

文档地址：https://docs.min.io/cn/

### 安装

#### 下载镜像

```bash
docker search minio/minio
docker pull minio/minio
```

#### 挂载数据及配置

```bash
mkdir -p /data/docker/minio/{config,data}
```

#### 启动容器

```bash
docker run -p 9000:9000 -p 9090:9090 \
     --net=host \
     --name minio \
     -d --restart=always \
     -e "MINIO_ACCESS_KEY=minioadmin" \
     -e "MINIO_SECRET_KEY=minioadmin" \
     -v /data/docker/minio/data:/data \
     -v /data/docker/minio/config:/root/.minio \
     minio/minio server \
     /data --console-address ":9090" -address ":9000"
```

> –net=host    这是网络设置，表示容器将使用主机的网络栈，这样就不需要在容器内部配置网络
> -d --restart=always    这是运行容器的其他选项，-d 使容器在后台运行，–restart=always 表示容器总是会在退出后自动重启
