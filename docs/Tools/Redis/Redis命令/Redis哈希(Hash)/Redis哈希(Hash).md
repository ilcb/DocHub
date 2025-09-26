---
title: Redis 哈希(Hash)
description: "Redis 哈希(Hash)"
slug: "/tools/redis/ds-hash"
hide_table_of_contents: false
keywords: ["Redis"]
tags: ["Redis"]
date: 2017-08-01
categories: ["Redis"]
---
## 1. 简介
Redis 中的 Hash 是一个 String 类型的 field-value（键值对）(类似于 Map)的映射表，特别适合用于存储对象，后续操作的时候，你可以直接修改这个对象中的某些字段的值。每个哈希可以存储多达 2^32 - 1 个键值对。

## 2. 基本命令

| 命令                         | 描述                     | 示例                                  |
| ---------------------------- | ------------------------ | ------------------------------------- |
| `HSET key field value`       | 设置哈希字段的值         | `HSET book:1001 name 'Java 设计模式'` |
| `HGET key field`             | 获取哈希字段的值         | `HGET book:1001 name`                 |
| `HEXISTS key field`          | 检查哈希字段是否存在     | `HEXISTS book:1001 name`              |
| `HDEL key field [field ...]` | 删除哈希字段             | `HEL book:1001 name`                  |
| `HLEN key`                   | 获取哈希字段数量         | `HLEN book:1001`                      |
| `HKEYS key`                  | 获取所有哈希字段值       | `HKEYS book:1001`                     |
| `HVALS key`                  | 从指定位置开始覆写字符串 | `HVALS book:1001`                     |
| `HGETALL key`                | 获取所有字段和值         | `HGETALL book:1001`                   |

### 2.1 示例



## 3. 批量操作命令

Redis 支持批量操作多个字符串，提高操作效率：

| 命令                                      | 描述                             | 示例                                                |
| :---------------------------------------- | :------------------------------- | :-------------------------------------------------- |
| `HMSET key field value [field value ...]` | 批量设置多个键值对               | `HMSET book:1001 name 'Java设计模式' isbn saay-001` |
| `HMGET key field [field ...]`             | 批量获取多个键的值               | `HMGET book:1001 name isbn`                         |
| `HSETNX key field value`                  | 批量设置（仅当所有键都不存在时） | `HSETNX book:1001 price 55.0`                       |

### 3.1 示例



## 4. 数值操作命令

当哈希字段存储数值时，可以进行原子性的数值操作：

| 命令                               | 描述                   | 说明                                            |
| :--------------------------------- | :--------------------- | :---------------------------------------------- |
| `HINCRBY key field increment`      | 将字段值增加指定整数   | `HINCRBY book:1001 sale_count 1`                |
| `HINCRBYFLOAT key field increment` | 将字段值增加指定浮点数 | `HINCRBYFLOAT book:1001 total_sale_amount 55.5` |

### 4.1 示例





## 5. 遍历

Redis 提供了安全的字段遍历命令：

| 命令                                             | 描述         | 示例                               |
| :----------------------------------------------- | :----------- | :--------------------------------- |
| `HSCAN key cursor [MATCH pattern] [COUNT count]` | 迭代哈希字段 | `HSCAN book:1001 0 MATCH "*Java*"` |

### 5.1 示例



## 6. 实际应用场景

### 6.1 用户信息存储

使用哈希存储用户的详细信息



### 6.2 购物车管理

使用哈希存储用户的购物车信息：



### 6.3 网站统计

使用哈希存储网站的各种统计数据



## 7. 性能优化建议

- **批量操作** : 使用 `HMSET/HMGET` 减少网络往返次数
- **字段数量**: 单个哈希的字段数量不宜过多（建议小于 1000）
- **内存优化**: Redis 对小哈希有特殊的内存优化
- **避免大字段**: 单个字段值不宜过大
- **使用 HSCAN**: 遍历大哈希时使用 `HSCAN` 而不是 `HGETALL`
- **合理设计**: 根据访问模式设计哈希结构



## 8. 哈希 vs 字符串

#### 存储对象的两种方式对比

```bash
# 方式1：使用字符串存储JSON
SET user:1001 "{\"name\":\"张三\",\"age\":25,\"city\":\"北京\"}"
# 优点：简单直接
# 缺点：更新单个字段需要序列化/反序列化整个对象

# 方式2：使用哈希存储
HMSET user:1001 name "张三" age 25 city "北京"
# 优点：可以单独操作字段，内存效率高
# 缺点：不能设置单个字段的过期时间
```