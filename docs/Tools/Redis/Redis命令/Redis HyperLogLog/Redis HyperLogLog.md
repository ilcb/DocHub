---
title: Redis HyperLogLog
description: "Redis HyperLogLog"
slug: "/tools/redis/ds-hyperloglog"
hide_table_of_contents: false
keywords: ["Redis"]
tags: ["Redis"]
date: 2017-08-01
categories: ["Redis"]
---

## HyperLogLog

HyperLogLog 是一种概率性数据结构，用于估算集合的基数（不重复元素的数量）。它的最大优势是在输入元素的数量或者体积非常大时，计算基数所需的空间总是固定的、并且是很小的。在 Redis 中，每个 HyperLogLog 键只需要花费 12KB 内存，就可以计算接近 2^64 个不同元素的基数。

## 1. 基本命令

| 命令      | 语法                                        | 描述                   | 时间复杂度 |
| :-------- | :------------------------------------------ | :--------------------- | :--------- |
| `PFADD`   | `PFADD key element [element ...]`           | 添加元素到 HyperLogLog | O(1)       |
| `PFCOUNT` | `PFCOUNT key [key ...]`                     | 返回基数估算值         | O(1)       |
| `PFMERGE` | `PFMERGE destkey sourcekey [sourcekey ...]` | 合并多个 HyperLogLog   | O(N)       |

 ### 1.1 示例

```bash
127.0.0.1:6379> pfadd runonbkey 'redis'
(integer) 1
127.0.0.1:6379> pfadd runonbkey 'mongodb'
(integer) 1
127.0.0.1:6379> pfadd runonbkey 'mysql'
(integer) 1
127.0.0.1:6379> pfcount runonbkey
(integer) 3
```

## 2. 使用场景

### 2.1 网站访客统计

```bash
# 每日独立访客统计
PFADD uv:2024-01-15 user123
PFADD uv:2024-01-15 user456
PFADD uv:2024-01-15 user789

# 获取当日独立访客数
PFCOUNT uv:2024-01-15

# 周独立访客统计
PFMERGE uv:week:2024-w3 \
  uv:2024-01-15 \
  uv:2024-01-16 \
  uv:2024-01-17 \
  uv:2024-01-18 \
  uv:2024-01-19 \
  uv:2024-01-20 \
  uv:2024-01-21

PFCOUNT uv:week:2024-w3
```

### 2.2 商品浏览去重统计

```bash
# 商品浏览用户统计
PFADD product:123:viewers user1001
PFADD product:123:viewers user1002
PFADD product:123:viewers user1003

# 获取商品独立浏览用户数
PFCOUNT product:123:viewers

# 分类商品浏览统计
PFMERGE category:electronics:viewers \
  product:123:viewers \
  product:124:viewers \
  product:125:viewers

# 获取分类独立浏览用户数
PFCOUNT category:electronics:viewers
```

### 2.3 APP 活跃用户统计

```bash
# 每日活跃用户统计
PFADD dau:2024-01-15 user_a
PFADD dau:2024-01-15 user_b
PFADD dau:2024-01-15 user_c

# 获取日活跃用户数
PFCOUNT dau:2024-01-15

# 月活跃用户统计
for day in {01..31}; do
    PFMERGE mau:2024-01 dau:2024-01-$day
done

# 获取月活跃用户数
PFCOUNT mau:2024-01
```

### 2.4 搜索关键词去重统计

```bash
# 搜索关键词统计
PFADD search:keywords "redis tutorial"
PFADD search:keywords "database optimization"
PFADD search:keywords "cache strategy"

# 获取独立搜索关键词数量
PFCOUNT search:keywords

# 用户搜索行为统计
PFADD user:search:behavior user123
PFADD user:search:behavior user456

# 获取有搜索行为的独立用户数
PFCOUNT user:search:behavior
```

### 2.5  IP 地址去重统计

```bash
# IP 访问统计
PFADD ip:access:2024-01-15 "192.168.1.100"
PFADD ip:access:2024-01-15 "10.0.0.50"
PFADD ip:access:2024-01-15 "172.16.0.200"

# 获取独立 IP 访问数
PFCOUNT ip:access:2024-01-15

# 地区 IP 统计
PFADD ip:region:beijing "192.168.1.100"
PFADD ip:region:shanghai "10.0.0.50"

# 获取各地区独立 IP 数
PFCOUNT ip:region:beijing
PFCOUNT ip:region:shanghai
```