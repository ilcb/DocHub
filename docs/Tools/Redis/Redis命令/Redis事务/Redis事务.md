---
title: Redis 事务
description: "Redis 事务"
slug: "/tools/redis/ds-transaction"
hide_table_of_contents: false
keywords: ["Redis"]
tags: ["Redis"]
date: 2017-08-01
categories: ["Redis"]
---

## Redis 事务
Redis 事务可以一次执行多个命令， 并且带有以下两个重要的保证：
事务是一个单独的隔离操作：事务中的所有命令都会序列化、按顺序地执行。事务在执行的过程中，不会被其他客户端发送来的命令请求所打断。
事务是一个原子操作：事务中的命令要么全部被执行，要么全部都不执行。虽然 Redis 事务不完全符合传统数据库的 ACID 特性，但它提供了一定程度的原子性保证。
一个事务从开始到执行会经历以下三个阶段：

1. 开始事务。

2. 命令入队。

3. 执行事务。

### 1. 事务基本命令

| 命令      | 语法                  | 描述                       | 返回值           |
| :-------- | :-------------------- | :------------------------- | :--------------- |
| `MULTI`   | `MULTI`               | 开启事务，后续命令进入队列 | OK               |
| `EXEC`    | `EXEC`                | 执行事务中的所有命令       | 命令执行结果数组 |
| `DISCARD` | `DISCARD`             | 取消事务，清空命令队列     | OK               |
| `WATCH`   | `WATCH key [key ...]` | 监视键，实现乐观锁         | OK               |
| `UNWATCH` | `UNWATCH`             | 取消监视所有键             | OK               |

### 1.1 示例

```bash
redis 127.0.0.1:6379> MULTI
OK
redis 127.0.0.1:6379> SET book-name "Mastering C++ in 21 days"
QUEUED
redis 127.0.0.1:6379> GET book-name
QUEUED
redis 127.0.0.1:6379> SADD tag "C++" "Programming" "Mastering Series"
QUEUED
redis 127.0.0.1:6379> SMEMBERS tag
QUEUED
redis 127.0.0.1:6379> EXEC
1) OK
2) "Mastering C++ in 21 days"
3) (integer) 3
4) 1) "Mastering Series"
2) "C++"
3) "Programming"
```
