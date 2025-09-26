---
title: Redis 键(Key)
description: "Redis 键(Key)"
slug: "/tools/redis/key"
hide_table_of_contents: false
keywords: ["Redis"]
tags: ["Redis"]
date: 2017-08-01
categories: ["Redis"]
---
## 1. 简介
在 Redis 中，键（Key）是访问数据的唯一标识符。

## 2. 基本命令

###  键的基本操作

Redis 提供了丰富的键操作命令：

| 命令                  | 描述                                          | 示例                       |
| :-------------------- | :-------------------------------------------- | :------------------------- |
| `EXISTS key`          | 检查键是否存在                                | `EXISTS user:1001`         |
| `TYPE key`            | 返回键的数据类型                              | `TYPE user:1001`           |
| `DEL key [key ...]`   | 删除一个或多个键                              | `DEL user:1001 user:1002`  |
| `DUMP key`            | 序列化给定 key ，并返回被序列化的值           | `DUMP user:1001`           |
| `RENAME key newkey`   | 重命名键                                      | `RENAME oldname newname`   |
| `RENAMENX key newkey` | 仅当 newkey 不存在时，将 key 改名为 newkey    | `RENAMENX oldname newname` |
| `KEYS pattern`        | 查找匹配模式的键                              | `KEYS user:*`              |
| `SCAN cursor`         | 迭代数据库中的键                              | `SCAN 0 MATCH user:*`      |
| `MOVE key db`         | 将当前数据库的 key 移动到给定的数据库 db 当中 | `MOVE song 1`              |
| `RANDOMKEY`           | 从当前数据库中随机返回一个 key                |                            |

### 2.1 示例



## 3. 键的过期时间

Redis 支持为键设置过期时间，这对于缓存和临时数据非常有用：

| 命令                       | 描述                         | 示例                         |
| :------------------------- | :--------------------------- | :--------------------------- |
| `EXPIRE key seconds`       | 设置键的过期时间（秒）       | `EXPIRE session:abc123 3600` |
| `EXPIREAT key timestamp`   | 设置键在指定时间戳过期       | `EXPIREAT key 1609459200`    |
| `PEXPIRE key milliseconds` | 设置键的过期时间（毫秒）     | `PEXPIRE key 60000`          |
| `TTL key`                  | 查看键的剩余生存时间（秒）   | `TTL session:abc123`         |
| `PTTL key`                 | 查看键的剩余生存时间（毫秒） | `PTTL session:abc123`        |
| `PERSIST key`              | 移除键的过期时间             | `PERSIST session:abc123`     |

#### 3.1 示例

```bash
# 设置会话过期时间为1小时
SET session:user123 "session_data"
EXPIRE session:user123 3600

# 检查剩余时间
TTL session:user123

# 设置缓存过期时间为30分钟
SET cache:article:1001 "article_content"
EXPIRE cache:article:1001 1800
```

## 4. 键的查找和遍历

Redis 提供了多种方式来查找和遍历键

| 命令                                        | 描述                                 | 示例                           |
| :------------------------------------------ | :----------------------------------- | :----------------------------- |
| `KEYS pattern`                              | 查找所有符合给定模式( pattern)的 key | `KEYS user:*`                  |
| `SCAN cursor [MATCH pattern] [COUNT count]` | 迭代数据库中的数据库键               | `SCAN 0 MATCH user:* COUNT 10` |

### 4.1 KEYS 命令

`KEYS` 命令支持模式匹配：

- `*` - 匹配任意数量的字符
- `?` - 匹配单个字符
- `[abc]` - 匹配方括号内的任意字符
- `[a-z]` - 匹配指定范围内的字符

#### 4.1.1 示例

```bash
# 查找所有用户相关的键
KEYS user:*

# 查找所有缓存键
KEYS cache:*

# 查找特定模式的键
KEYS user:100?
KEYS sessio
```

### 4.2 SCAN 命令

`SCAN` 命令提供了非阻塞的键遍历方式：

#### 4.2.1 示例

```bash
# 开始扫描
SCAN 0

# 带模式匹配的扫描
SCAN 0 MATCH user:*

# 限制返回数量
SCAN 0 MATCH user:* COUNT 10

# 继续扫描（使用返回的游标）
SCAN 17 MATCH user
```

## 5. 键空间统计

Redis 提供了一些命令来获取键空间的统计信息：

| 命令            | 描述                   | 示例            |
| :-------------- | :--------------------- | :-------------- |
| `DBSIZE`        | 返回当前数据库的键数量 | `DBSIZE`        |
| `INFO keyspace` | 显示键空间统计信息     | `INFO keyspace` |
| `RANDOMKEY`     | 随机返回一个键         | `RANDOMKEY`     |

## 6. 实际应用场景

### 6.1 用户会话管理

```bash
# 创建用户会话
SET session:abc123 "{\"user_id\": 1001, \"login_time\": 1609459200}"
EXPIRE session:abc123 7200  # 2小时过期

# 检查会话是否存在
EXISTS session:abc123

# 延长会话时间
EXPIRE session:abc123 7200

# 删除会话
DEL session:abc123
```

### 6.2 缓存管理

```bash
# 设置文章缓存
SET cache:article:1001 "article content"
EXPIRE cache:article:1001 3600  # 1小时过期

# 批量删除缓存
KEYS cache:article:*
DEL cache:article:1001 cache:article:1002

# 清理过期缓存（使用SCAN避免阻塞）
SCAN 0 MATCH cache:* COUNT 100
```