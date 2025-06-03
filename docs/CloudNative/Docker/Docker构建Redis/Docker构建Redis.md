---
title: Docker 构建 Redis
description: "Docker 构建 Redis"
slug: "/cloud-native/docker/build-redis"
hide_table_of_contents: false
keywords: ["Docker"]
tags: ["Docker", "CloudNative"]
date: 2017-08-01
categories: ["Docker"]
---
## Docker 构建 Redis

## 1.查询 postgresql 镜像

``````bash
docker search redis
``````

![查询镜像](img/查询镜像.jpg)

## 2.拉取镜像

```bash
docker pull redis:latest
```

## 3.挂载配置文件
```bash
mkdir -p /data/docker/redis/{data,conf}
```

将 redis 的配置文件进行挂载，以配置文件方式启动 redis 容器。(挂载：即将宿主的文件和容器内部目录相关联，相互绑定，在宿主机内修改文件的话也随之修改容器内部文件）

- 挂载 redis 的配置文件

- 挂载 redis 的持久化文件

本人的配置文件是放在

redis.conf 文件位置： `/data/docker/redis/conf/redis.conf`

redis 的 data 文件位置 ： `/data/docker/redis/data`

## 3.启动容器

```bash
docker run -itd \
           --name redis \
           --restart=always \
           --log-opt max-size=100m --log-opt max-file=2 \
           -p 6379:6379 \
           -v /data/docker/redis/conf/redis.conf:/etc/redis/redis.conf \
           -v /data/docker/redis/data:/data \
           -d redis redis-server /etc/redis/redis.conf \
           --appendonly yes
```
### 参数解析

> -itd
>
> + i：以交互模式运行容器，通常与 -t 同时使用；
>
> + t：为容器重新分配一个伪输入终端，通常与 -i 同时使用；
>
> + d：表示后台启动 redis；–name 给容器命名
>
> --restart=always: 开机启动，失败也会一直重启；
> –log-opt max-size=100m: 意味着一个容器日志大小上限是 100M;
> –log-opt max-file=2: 意味着一个容器有 2 个日志，分别是 id+.json、id+1.json;
> -p 6379:6379: 将宿主机 6379 端口与容器内 6379 端口进行映射，冒号之前为物理机端口
> -v 将宿主机目录或文件与容器内目录或文件进行挂载映射；
> –appendonly yes: 开启 redis 持久化；
> –requirepass password: 设置密码，并且将密码设置为高强度复杂；
> redis-server /etc/redis/redis.conf 以配置文件启动 redis，加载容器内的 conf 文件；

## 4.查看运行容器状态

```bash
docker ps -a | grep redis
```

![启动状态](img/启动状态.jpg)

## 5.确认 Redis 命令

### 启动 Redis 客户端

```bash
docker exec -it redis redis-cli
select 1
set key value
get key
```

![确认redis命令执行](img/确认redis命令执行.jpg)
