---
title: Redis 字符串(String)
description: "Redis 字符串(String)"
slug: "/tools/redis/ds-string"
hide_table_of_contents: false
keywords: ["Redis"]
tags: ["Redis"]
date: 2017-08-01
categories: ["Redis"]
---
## 1. 简介
字符串是 Redis 最基本的数据类型，也是最常用的类型。Redis 的字符串是二进制安全的，可以存储任何数据，包括图片、序列化对象等。一个字符串值最大可以是 512MB。



## 2. 基本命令

| 命令                        | 描述                     | 说明                                                         |
| --------------------------- | ------------------------ | ------------------------------------------------------------ |
| `SET key value`             | 设置字符串值             | 如果 key 已经存储其他值， SET 就覆写旧值，且无视类型         |
| `GET key`                   | 获取字符串值             | 如果 key 不存在，返回 nil 。如果 key 储存的值不是字符串类型，返回一个错误 |
| `GETSET key value`          | 设置新值并返回旧值       | 当 key 没有旧值时，即 key 不存在时，返回 nil <br/>当 key 存在但不是字符串类型时，返回一个错误 |
| `STRLEN key`                | 获取字符串长度           | 当 key 不存在时，返回 0                                      |
| `APPEND key value`          | 追加字符串到末尾         | 如果 key 已经存在并且是一个字符串， APPEND 命令将 value 追加到 key 原来的值的末尾。<br/>如果 key 不存在， APPEND 就简单地将给定 key 设为 value ，就像执行 SET key value 一样。 |
| `GETRANGE key start end`    | 获取字符串子串           | 符串的截取范围为 [start, end]                                |
| `SETRANGE key offset value` | 从指定位置开始覆写字符串 |                                                              |

### 2.1 示例

```bash
127.0.0.1:6379> set key "value"
OK
127.0.0.1:6379> get key
"value"

127.0.0.1:6379> set key "aaa"
OK
127.0.0.1:6379> get key
"aaa"

# get不存在的key
127.0.0.1:6379> get name
(nil)

127.0.0.1:6379> getset key "new-value"
"aaa"
127.0.0.1:6379> get key
"new-value"

127.0.0.1:6379> strlen key
(integer) 9

127.0.0.1:6379> append key " aaa"
(integer) 13

127.0.0.1:6379> getrange key 10 13
"aaa"

127.0.0.1:6379> setrange key 0 "BBB"
(integer) 13
127.0.0.1:6379> get key
"BBB-value aaa"
```



## 3. 数值操作命令

当字符串存储的是数字时，Redis 提供了原子性的数值操作。

如果 key 不存在，那么 key 的值会先被初始化为 0 ，然后再执行 INCR 操作。如果值包含错误的类型，或字符串类型的值不能表示为数字，那么返回一个错误。

| 命令                        | 描述                 | 说明                                                         |
| :-------------------------- | :------------------- | :----------------------------------------------------------- |
| `INCR key`                  | 将数值递增 1          |                                                              |
| `INCRBY key increment`      | 将数值增加指定值     | 如果 key 不存在，那么 key 的值会先被初始化为 0 ，然后再执行 INCRBY 命令。<br/>如果值包含错误的类型，或字符串类型的值不能表示为数字，那么返回一个错误。 |
| `INCRBYFLOAT key increment` | 将数值增加指定浮点数 | 如果 key 不存在，那么 INCRBYFLOAT 会先将 key 的值设为 0 ，再执行加法操作。<br/>如果值包含错误的类型，或字符串类型的值不能表示为数字，那么返回一个错误。 |
| `DECR key`                  | 将数值递减 1          | 如果 key 不存在，那么 key 的值会先被初始化为 0 ，然后再执行 DECR 操作。<br/>如果值包含错误的类型，或字符串类型的值不能表示为数字，那么返回一个错误。 |
| `DECRBY key decrement`      | 将数值减少指定值     | 如果 key 不存在，那么 key 的值会先被初始化为 0 ，然后再执行 DECRBY 操作。<br/>如果值包含错误的类型，或字符串类型的值不能表示为数字，那么返回一个错误。 |

### 3.1 示例

```bash
127.0.0.1:6379> incr page
(integer) 1
127.0.0.1:6379> get page
"1"

127.0.0.1:6379> incrby page 5
(integer) 6
127.0.0.1:6379> get page
"6"

127.0.0.1:6379> incrbyfloat page 0.1
"6.1"
127.0.0.1:6379> decr page
(error) ERR value is not an integer or out of range

127.0.0.1:6379> set page 10
OK
127.0.0.1:6379> get page
"10"

127.0.0.1:6379> decr page
(integer) 9

127.0.0.1:6379> decrby page 5
(integer) 4
```



## 4. 批量操作命令

Redis 支持批量操作多个字符串，提高操作效率：

| 命令                               | 描述                             | 示例                     |
| :--------------------------------- | :------------------------------- | :----------------------- |
| `MSET key value [key value ...]`   | 批量设置多个键值对               | `MSET k1 v1 k2 v2 k3 v3` |
| `MGET key [key ...]`               | 批量获取多个键的值               | `MGET k1 k2 k3`          |
| `MSETNX key value [key value ...]` | 批量设置（仅当所有键都不存在时） | `MSETNX k4 v4 k5 v5`     |

### 4.1 示例

```bash
127.0.0.1:6379> mset key1 'hello' key2 'world'
OK
127.0.0.1:6379> get key1
"hello"
127.0.0.1:6379> get key2
"world"
127.0.0.1:6379> mget key1 key2
1) "hello"
2) "world"

127.0.0.1:6379> msetnx rmdbs 'mysql' nosql 'mongodb' key-value-store 'redis'
(integer) 1
127.0.0.1:6379> mget rmdbs nosql key-value-store
1) "mysql"
2) "mongodb"
3) "redis"
127.0.0.1:6379> msetnx rmdbs 'sqlite' language 'java'
(integer) 0

```



## 5. 条件设置命令

Redis 提供了带条件的设置命令，常用于实现分布式锁。

| 命令                                                   | 描述                         | 示例                                         |
| :----------------------------------------------------- | :--------------------------- | :------------------------------------------- |
| `SETNX key value`                                      | 仅当键不存在时设置           | 设置成功，返回 1 。 <br/>设置失败，返回 0 。  |
| `SETEX key seconds value`                              | 设置值并指定过期时间         | 如果 key 已经存在， SETEX 命令将会替换旧的值 |
| `PSETEX key milliseconds value`                        | 设置值并指定过期时间（毫秒） | `PSETEX cache:key 60000 "data"`              |
| `SET key value [EX seconds] [PX milliseconds] [NX|XX]` | 设置值（支持多种选项）       | `SET lock:key "value" EX 30 NX`              |

### 5.1 示例

```plain
# 分布式锁实现
SET lock:order:1001 "locked" EX 30 NX
# 如果返回OK，表示获取锁成功
# 如果返回nil，表示锁已被其他进程持有

# 会话管理
SETEX session:user123 3600 "{\"user_id\": 123, \"role\": \"admin\"}"

# 缓存设置
SET cache:article:1001 "article_content" EX 1800  # 30分钟过期
```