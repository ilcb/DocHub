---
title: Redis Stream
description: "Redis Stream"
slug: "/tools/redis/stream"
hide_table_of_contents: false
keywords: ["Redis"]
tags: ["Redis"]
date: 2017-08-01
categories: ["Redis"]
---

Redis Stream 是 Redis 5.0 引入的新数据结构，专门用于处理流数据。它结合了消息队列和时间序列数据的特点，提供了强大的流处理能力，支持消费者组、消息确认、持久化等高级功能。

## 1. 命令

| 命令            | 功能           | 示例                                               |
| :-------------- | :------------- | :------------------------------------------------- |
| `XADD`          | 添加消息       | `XADD stream * field value`                        |
| `XREAD`         | 读取消息       | `XREAD STREAMS stream 0`                           |
| `XGROUP CREATE` | 创建消费者组   | `XGROUP CREATE stream group 0`                     |
| `XREADGROUP`    | 消费者组读取   | `XREADGROUP GROUP group consumer STREAMS stream >` |
| `XACK`          | 确认消息       | `XACK stream group id`                             |
| `XLEN`          | 获取流长度     | `XLEN stream`                                      |
| `XRANGE`        | 范围查询       | `XRANGE stream - +`                                |
| `XTRIM`         | 修剪流         | `XTRIM stream MAXLEN 1000`                         |
| `XPENDING`      | 查看待确认消息 | `XPENDING stream group`                            |
| `XINFO`         | 查看流信息     | `XINFO STREAM stream`                              |

### 1.1 添加消息

使用 XADD 命令向流中添加消息：

```bash
\# 添加消息（自动生成ID） 
XADD mystream * name "张三" age 25 city "北京" 
# 指定消息ID 
XADD mystream 1609459200000-0 name "李四" age 30 city "上海" 
# 添加多个字段 
XADD mystream * user_id 1001 action "login" timestamp 1609459200 ip "192.168.1.100" 
# 限制流的最大长度 
XADD mystream MAXLEN 1000 * event "purchase" amount 99.99
```

消息 ID 格式：

- **时间戳-序列号**：如 1609459200000-0
- *****：自动生成 ID
- **毫秒时间戳**：确保消息的时间顺序
- **序列号**：同一毫秒内的消息序号

### 1.2 读取消息

使用 XREAD 命令读取流中的消息：

```bash
\# 从头开始读取所有消息 
XREAD STREAMS mystream 0 
# 读取指定ID之后的消息 
XREAD STREAMS mystream 1609459200000-0 
# 阻塞读取新消息 
XREAD BLOCK 0 STREAMS mystream 
$ # 设置阻塞超时时间（毫秒）
XREAD BLOCK 5000 STREAMS mystream $ 
# 限制读取数量 
XREAD COUNT 10 STREAMS mystream 0 
# 同时读取多个流 
XREAD STREAMS stream1 stream2 0 0
```

特殊 ID 说明：

- **0**：从流的开始读取
- **$**：只读取新添加的消息
- **>**：在消费者组中表示未被消费的消息

### 1.3 消费者组

Redis Stream 支持消费者组模式，实现负载均衡和消息确认：

```bash
\# 创建消费者组 
XGROUP CREATE mystream mygroup 0 MKSTREAM 
# 从最新消息开始创建组 
XGROUP CREATE mystream mygroup $ 
# 消费者读取消息 
XREADGROUP GROUP mygroup consumer1 COUNT 1 STREAMS mystream > 
# 确认消息处理完成 
XACK mystream mygroup 1609459200000-0 
# 查看消费者组信息 
XINFO GROUPS mystream 
# 查看消费者信息 
XINFO CONSUMERS mystream mygroup 
# 查看待确认消息 
XPENDING mystream mygroup
```

### 1.4 查询和管理

Stream 提供了丰富的查询和管理命令：

```bash
# 查看流信息 
XINFO STREAM mystream 
# 获取流长度 
XLEN mystream 
# 范围查询 
XRANGE mystream - + XRANGE mystream 1609459200000 1609459300000
# 反向范围查询 
XREVRANGE mystream + - COUNT 10 
# 删除消息 
XDEL mystream 1609459200000-0 
# 修剪流（删除旧消息） 
XTRIM mystream MAXLEN 1000 XTRIM mystream MAXLEN ~ 1000 
```

### 1.5 异常处理

处理消费过程中的异常情况：

```bash
\# 查看待确认消息详情 
XPENDING mystream mygroup - + 10 consumer1 
# 转移超时消息给其他消费者 
XCLAIM mystream mygroup consumer2 60000 1609459200000-0 
# 自动转移超时消息 
XAUTOCLAIM mystream mygroup consumer2 60000 0 
# 删除消费者 
XGROUP DELCONSUMER mystream mygroup consumer1 
# 删除消费者组 
XGROUP DESTROY mystream mygroup
```

## 2. 实际应用场景

Redis Stream 在实际项目中的应用：

- **事件溯源**：记录系统中的所有事件
- **消息队列**：异步任务处理
- **日志收集**：实时日志流处理
- **监控数据**：时间序列数据存储
- **用户行为追踪**：记录用户操作轨迹

```bash
# 用户行为追踪示例 
# 记录用户行为 
XADD user_actions * user_id 1001 action "page_view" page "/home" timestamp 1609459200 XADD user_actions * user_id 1001 action "click" element "buy_button" timestamp 1609459210 XADD user_actions * user_id 1001 action "purchase" product_id 2001 amount 99.99 timestamp 1609459220 
# 创建分析消费者组 
XGROUP CREATE user_actions analytics_group 0 MKSTREAM 
# 分析消费者读取数据
XREADGROUP GROUP analytics_group analyzer1 COUNT 10 STREAMS user_actions > 
# 确认处理完成 
XACK user_actions analytics_group 1609459200000-0 1609459210000-0
```
