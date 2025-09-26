---
title: Redis 集合(Set)
description: "Redis 集合(Set)"
slug: "/tools/redis/ds-set"
hide_table_of_contents: false
keywords: ["Redis"]
tags: ["Redis"]
date: 2017-08-01
categories: ["Redis"]
---
## 1. 简介
Redis 集合是字符串的无序集合，集合中的元素是唯一的，不允许重复。集合支持多种集合运算，如交集、并集、差集等。集合最多可以包含 2^32 - 1 个元素。

存储的元素无序、唯一且支持集合运算。

## 2. 基本命令

| 命令                            | 描述                                  | 示例                                |
| ------------------------------- | ------------------------------------- | ----------------------------------- |
| `SADD key member [member ...]`  | 向集合添加一个或多个成员              | `SADD language "chinese" "english"` |
| `SREM key memeber [member ...]` | 移除集合中一个或多个成员              | `SREM language "chinese"`           |
| `SISMEMBER key member`          | 判断 member 元素是否是集合 key 的成员 | `SISMEMBER language "english"`      |
| `SMEMBERS key`                  | 返回集合中的所有成员                  | `SMEMBERS language`                 |
| `SCARD key`                     | 获取集合的成员数                      | `SCARD language`                    |
| `SPOP key [count]`              | 移除并返回集合中的一个随机元素        | `SPOP language`                     |
| `SRANDMEMBER key [count]`       | 随机获取元素（不删除）                | `SRANDOMMEMBER language`            |

### 2.1 示例



## 3. 集合运算命令

当列表为空时，阻塞等待新元素的命令：

| 命令                                    | 描述                                          | 示例                                  |
| :-------------------------------------- | :-------------------------------------------- | :------------------------------------ |
| `SINTER key [key ...]`                  | 返回给定所有集合的交集                        | `SINTER myset1 myset2`                |
| `SINTERSTORE destination key [key ...]` | 返回给定所有集合的交集并存储在 destination 中 | `SINTERSTORE inter_set myset1 myset2` |
| `SUNION key [key ...]`                  | 返回所有给定集合的并集                        | `SUNION myset1 myset2`                |
| `SUNIONSTORE destination key [key ...]` | 所有给定集合的并集存储在 destination 集合中   | `SUNIONSTORE union_set myset1 myset2` |
| `SDIFF key [key ...]`                   | 返回第一个集合与其他集合之间的差异            | `SDIFF myset1 myset2`                 |
| `SDIFFSTORE destination key [key ...]`  | 返回给定所有集合的差集并存储在 destination 中 | `SDIFFSTORE diff_set myset1 myset2`   |

### 3.1 示例



### 4. 集合间移动

在不同集合之间移动元素：

| 命令                              | 描述                                                | 示例                            |
| :-------------------------------- | :-------------------------------------------------- | :------------------------------ |
| `SMOVE source destination member` | 将 member 元素从 source 集合移动到 destination 集合 | `SMOVE myset1 myset2 "element"` |

### 4.1 示例



## 5. 集合遍历操作

安全遍历大集合的命令：

| 命令                                             | 描述             | 示例                               |
| :----------------------------------------------- | :--------------- | :--------------------------------- |
| `SSCAN key cursor [MATCH pattern] [COUNT count]` | 迭代集合中的元素 | `SSCAN language 0 MATCH "english"` |

### 5.1 示例



## 6. 实际应用场景

### 6.1 标签系统

使用集合管理文章、用户的标签

```bash
# 文章标签
SADD article:1001:tags "Redis" "数据库" "缓存" "NoSQL"
SADD article:1002:tags "Python" "编程" "Web开发"
SADD article:1003:tags "Redis" "Python" "教程"

# 用户兴趣标签
SADD user:1001:interests "Redis" "Python" "机器学习"
SADD user:1002:interests "Java" "Spring" "微服务"

# 查找共同标签
SINTER article:1001:tags user:1001:interests
# 返回: ["Redis", "Python"] (用户感兴趣的文章标签)

# 推荐相关文章（有共同标签的文章）
SINTER article:1001:tags article:1003:tags
# 返回: ["Redis"] (两篇文章的共同标签)

# 获取所有标签
SUNION article:1001:tags article:1002:tags article:1003:tags
# 返回: 所有文章的标签集合
```



### 6.2 好友关系

使用集合管理用户的好友关系

```bash
# 用户好友列表
SADD user:1001:friends "user1002" "user1003" "user1004" "user1005"
SADD user:1002:friends "user1001" "user1003" "user1006" "user1007"
SADD user:1003:friends "user1001" "user1002" "user1008"

# 查找共同好友
SINTER user:1001:friends user:1002:friends
# 返回: ["user1003"] (共同好友)

# 推荐好友（朋友的朋友，但不是自己的朋友）
SUNION user:1002:friends user:1003:friends  # 朋友的朋友
SDIFF result user:1001:friends              # 排除已有好友
SREM result "user1001"                      # 排除自己

# 检查是否为好友
SISMEMBER user:1001:friends "user1002"     # 返回: 1 (是好友)

# 添加/删除好友
SADD user:1001:friends "user1009"          # 添加好友
SREM user:1001:friends "user1004"          # 删除好友
```

### 6.3 抽奖系统

使用集合实现抽奖和去重功能：

```bash
# 参与抽奖的用户
SADD lottery:2024:participants "user1001" "user1002" "user1003" "user1004" "user1005"

# 随机抽取中奖者
SRANDMEMBER lottery:2024:participants 3    # 随机选择3个中奖者（可重复）
SPOP lottery:2024:participants 3           # 随机弹出3个中奖者（不重复）

# 查看剩余参与者
SCARD lottery:2024:participants            # 剩余参与者数量
SMEMBERS lottery:2024:participants         # 剩余参与者列表

# 防止重复参与
SADD lottery:2024:participants "user1006" # 添加新参与者
SADD lottery:2024:participants "user1001" # 重复参与者不会被添加

# 已中奖用户（防止重复中奖）
SADD lottery:2024:winners "user1001" "user1003"
SDIFF lottery:2024:participants lottery:2024:winners  # 未中奖的参与者
```

### 6.4 搜索过滤

使用集合实现多条件搜索过滤：

```bash
# 商品分类
SADD category:electronics "product1001" "product1002" "product1003"
SADD category:books "product2001" "product2002" "product1003"
SADD category:clothing "product3001" "product3002"

# 商品品牌
SADD brand:apple "product1001" "product1002"
SADD brand:samsung "product1003" "product1004"
SADD brand:nike "product3001" "product3002"

# 价格区间
SADD price:100-500 "product1001" "product2001" "product3001"
SADD price:500-1000 "product1002" "product1003"
SADD price:1000+ "product1004" "product2002"

# 多条件搜索：电子产品 AND 苹果品牌 AND 500-1000价格区间
SINTER category:electronics brand:apple price:500-1000
# 返回: ["product1002"] (满足所有条件的商品)

# 或条件搜索：苹果品牌 OR 三星品牌
SUNION brand:apple brand:samsung
# 返回: 苹果或三星的所有商品
```

### 6.5 数据去重

使用集合进行数据去重处理：

```bash
# 网站访问者去重
SADD daily:visitors:2024-01-15 "192.168.1.1" "192.168.1.2" "192.168.1.1"
SCARD daily:visitors:2024-01-15            # 返回: 2 (去重后的访问者数量)

# 邮件订阅者去重
SADD newsletter:subscribers "user1@example.com" "user2@example.com" "user1@example.com"
SMEMBERS newsletter:subscribers             # 返回: 去重后的邮件列表

# 文章阅读者去重
SADD article:1001:readers "user1001" "user1002" "user1001"
SCARD article:1001:readers                 # 返回: 2 (去重后的阅读者数量)

# 合并多天的访问者
SUNIONSTORE weekly:visitors:2024-w3 \
    daily:visitors:2024-01-15 \
    daily:visitors:2024-01-16 \
    daily:visitors:2024-01-17
SCARD weekly:visitors:2024-w3              # 一周内的唯一访问者数量
```

## 7. 性能优化建议

- **避免大集合**: 单个集合元素数量不宜过多（建议小于 10 万）
- **使用`SSCAN`**: 遍历大集合时使用`SSCAN`而不是`SMEMBERS`
- **合理使用运算**: 集合运算的时间复杂度较高，注意性能
- **批量操作**: 使用`SADD`的多元素版本减少网络往返
- **选择合适场景**: 需要去重和集合运算时使用 Set
- **内存优化**: Redis 对小集合有特殊的内存优化



## 8. 集合 vs 其他数据类型

#### 数据类型选择建议

- **Set vs List**: Set 不允许重复且无序，List 允许重复且有序
- **Set vs Hash**: Set 存储单一值，Hash 存储键值对
- **Set vs Sorted Set**: Set 无序，Sorted Set 按分数有序
- **使用 Set 的场景**: 标签系统、好友关系、去重、抽奖、搜索过滤