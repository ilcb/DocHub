---
title: Redis 列表(List)
description: "Redis 列表(List)"
slug: "/tools/redis/ds-list"
hide_table_of_contents: false
keywords: ["Redis"]
tags: ["Redis"]
date: 2017-08-01
categories: ["Redis"]
---
## 1. 简介
Redis 列表是简单的字符串列表，按照插入顺序排序。你可以添加一个元素到列表的头部（左边）或者尾部（右边）。列表最多可存储 2^32 - 1 个元素。

## 2. 基本命令

| 命令                              | 描述                           | 示例                                        |
| --------------------------------- | ------------------------------ | ------------------------------------------- |
| `LPUSH key element [element ...]` | 从左端（头部）插入元素         | `LPUSH book_list Java设计模式 Java并发编程` |
| `RPUSH key element [element ...]` | 从右端（尾部）插入元素         | `RPUSH book_list Python程序设计`            |
| `LPUSHX key value`                | 将一个值插入到已存在的列表头部 | `LPUSHX book_list "Python Cookbook"`        |
| `RPUSHX key value`                | 为已存在的列表添加值           | `RPUSHX book_list "C++语言程序设计"`        |
| `LPOP key`                        | 从左端（头部）弹出元素         | `LPOP book_list`                            |
| `RPOP key`                        | 从右端（尾部）弹出元素         | `RPOP book_list`                            |
| `LLEN key`                        | 获取列表长度                   | `LLEN book_list`                            |
| `LINDEX key index`                | 获取指定索引的元素             | `LINDEX book_list 1                         |
| `LSET key index element`          | 设置指定索引的元素值           | `LSET book_list 1 "数据库程序设计"`         |

### 2.1 示例



## 3. 阻塞操作命令

当列表为空时，阻塞等待新元素的命令：

| 命令                                    | 描述                                                         | 示例                                  |
| :-------------------------------------- | :----------------------------------------------------------- | :------------------------------------ |
| `BLPOP key [key ...] timeout`           | 阻塞式左端弹出， 如果列表没有元素会阻塞列表直到等待超时或发现可弹出元素为止 | `BLPOP book_list 1000`                |
| `BRPOP key [key ...] timeout`           | 阻塞式右端弹出， 如果列表没有元素会阻塞列表直到等待超时或发现可弹出元素为止 | `BRPOP book_list 1000`                |
| `BRPOPLPUSH source destination timeout` | 阻塞式弹出并推入另一个列表，将弹出的元素插入到另外一个列表中并返回它； <br/>如果列表没有元素会阻塞列表直到等待超时或发现可弹出元素为止。 | `BRPOPLPUSH book_list book_list1 500` |

### 3.1 示例



## 4. 范围操作命令

当哈希字段存储数值时，可以进行原子性的数值操作：

| 命令                                     | 描述                                                         | 说明                                    |
| :--------------------------------------- | :----------------------------------------------------------- | :-------------------------------------- |
| `LRANGE key start stop`                  | 获取指定范围的元素                                           | `LRANGE book_list 0 2`                  |
| `LTRIM key start stop`                   | 对一个列表进行修剪(trim)，<br/>让列表只保留指定区间内的元素，不在指定区间之内的元素都将被删除 | `LRANGE book_list 0 1`                  |
| `LINSERT key BEFORE|AFTER pivot element` | 在指定元素前/后插入                                          | `LINSERT book_list BEFORE 1 "数据结构"` |
| `LREM key count element`                 | 删除指定数量的元素                                           | `LREM book_list 1 "数据结构"`           |

### 4.1 示例





## 5. 列表间操作

在不同列表之间移动元素：

| 命令                           | 描述                                                     | 示例                             |
| :----------------------------- | :------------------------------------------------------- | :------------------------------- |
| `RPOPLPUSH source destination` | 移除列表的最后一个元素，并将该元素添加到另一个列表并返回 | `RPOPLPUSH book_list book_list1` |

### 5.1 示例



## 6. 实际应用场景

### 6.1 消息队列

使用列表实现简单的消息队列系统：

```bash
# 生产者发送消息
LPUSH order_queue "{\"id\": 1, \"buyer\": \"张三\", \"price\": \"100\"}"
LPUSH order_queue "{\"id\": 1, \"buyer\": \"李四\", \"price\": \"500\"}"

# 消费者处理消息
# 阻塞等待消息
BRPOP order_queue 30               

# 可靠队列（结单队列）
BRPOPLPUSH order_queue completed_queue 30

# 处理完成后
LREM completed_queue 1 "completed"

# 失败重试
RPOPLPUSH processing_queue refund_queue
```



### 6.2 最新动态

存储用户的最新动态或文章列表：

```bash
# 发布新动态
LPUSH user:1001:timeline "{\"id\": 101, \"content\": \"今天天气不错\", \"time\": 1609459200}"
LPUSH user:1001:timeline "{\"id\": 102, \"content\": \"学习Redis\", \"time\": 1609462800}"

# 获取最新10条动态
LRANGE user:1001:timeline 0 9

# 限制动态数量（只保留最新100条）
LTRIM user:1001:timeline 0 99

# 获取特定动态
LINDEX user:1001:timeline 0         # 最新动态
LINDEX user:1001:timeline -1        # 最早动态
```

### 6.3 任务调度

实现任务调度和处理流程：

```bash
# 任务提交
LPUSH task:pending "{\"id\": 1, \"type\": \"image_process\", \"file\": \"image1.jpg\"}"
LPUSH task:pending "{\"id\": 2, \"type\": \"video_encode\", \"file\": \"video1.mp4\"}"

# 工作进程获取任务
BRPOPLPUSH task:pending task:processing 30

# 任务完成
RPOPLPUSH task:processing task:completed

# 任务失败
RPOPLPUSH task:processing task:failed

# 重试失败任务
RPOPLPUSH task:failed task:pending

# 监控队列状态
LLEN task:pending                    # 待处理任务数
LLEN task:processing                 # 处理中任务数
LLEN task:completed                  # 已完成任务数
LLEN task:failed                     # 失败任务数
```



## 7. 性能优化建议

- **避免大列表**: 单个列表元素数量不宜过多（建议小于 10 万）
- **使用阻塞操作**: 在队列场景中使用 BLPOP/BRPOP 避免轮询
- **批量操作**: 使用 LPUSH/RPUSH 的多元素版本减少网络往返
- **合理使用索引**: 避免频繁使用 LINDEX 访问中间元素
- **定期清理**: 使用 LTRIM 限制列表大小
- **选择合适的端**: 根据业务需求选择从左端还是右端操作



## 8. 列表 vs 其他数据类型

#### 数据类型选择建议

- **List vs Set**: List 允许重复元素且有序，Set 不允许重复且无序
- **List vs Sorted Set**: List 按插入顺序排序，Sorted Set 按分数排序
- **List vs Stream**: Stream 更适合复杂的消息队列场景
- **使用 List 的场景**: 消息队列、最新动态、简单排行榜、任务调度