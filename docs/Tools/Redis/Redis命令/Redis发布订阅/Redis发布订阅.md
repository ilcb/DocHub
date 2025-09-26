---
title: Redis 发布订阅
description: "Redis 发布订阅"
slug: "/tools/redis/ds-pubsub"
hide_table_of_contents: false
keywords: ["Redis"]
tags: ["Redis"]
date: 2017-08-01
categories: ["Redis"]
---

## Redis 发布订阅(pub/sub)
 Redis 发布订阅(pub/sub)是一种消息通信模式：发送者(pub)发送消息，订阅者(sub)接收消息。
 Redis 客户端可以订阅任意数量的频道。
​下图展示了频道 channel1 ， 以及订阅这个频道的三个客户端 —— client2 、 client5 和 client1 之间的关系：
​![pubsub1](img/pubsub1.png)
​当有新消息通过 PUBLISH 命令发送给频道 channel1 时， 这个消息就会被发送给订阅它的三个客户端：
​![pubsub2](img/pubsub2.png)

## 1.基本命令

| `SUBSCRIBE`    | `SUBSCRIBE channel [channel ...]`             | 订阅一个或多个频道 | 订阅确认信息         |
| -------------- | --------------------------------------------- | ------------------ | -------------------- |
| `UNSUBSCRIBE`  | `UNSUBSCRIBE [channel [channel ...]]`         | 取消订阅频道       | 取消订阅确认         |
| `PUBLISH`      | `PUBLISH channel message`                     | 向频道发布消息     | 接收消息的订阅者数量 |
| `PSUBSCRIBE`   | `PSUBSCRIBE pattern [pattern ...]`            | 订阅匹配模式的频道 | 订阅确认信息         |
| `PUNSUBSCRIBE` | `PUNSUBSCRIBE [pattern [pattern ...]]`        | 取消模式订阅       | 取消订阅确认         |
| `PUBSUB`       | `PUBSUB subcommand [argument [argument ...]]` | 查看发布订阅状态   | 状态信息             |

### 1.1 示例

```bash
127.0.0.1:6379> subscribe redisChat
Reading messages... (press Ctrl-C to quit)
1) "subscribe"
2) "redisChat"
3) (integer) 1
```
重新开启个 redis 客户端，然后在同一个频道 redisChat 发布两次消息，订阅者就能接收到消息：
```bash
127.0.0.1:6379> publish redisChat 'Redis is a great caching tools'
(integer) 1
127.0.0.1:6379> publish redisChat 'learn redis'
(integer) 1
```
订阅者的客户端收到消息：
```bash
1) "message"
2) "redisChat"
3) "Redis is a great caching tools"
1) "message"
2) "redisChat"
3) "learn redis"
```
## 2. 状态查询命令

查看发布订阅系统的状态信息：

| 命令                      | 描述                   | 示例                        |
| :------------------------ | :--------------------- | :-------------------------- |
| `PUBSUB CHANNELS`         | 列出当前活跃的频道     | `PUBSUB CHANNELS`           |
| `PUBSUB CHANNELS pattern` | 列出匹配模式的活跃频道 | `PUBSUB CHANNELS news:*`    |
| `PUBSUB NUMSUB`           | 查看频道的订阅者数量   | `PUBSUB NUMSUB news sports` |
| `PUBSUB NUMPAT`           | 查看模式订阅的总数     | `PUBSUB NUMPAT`             |

