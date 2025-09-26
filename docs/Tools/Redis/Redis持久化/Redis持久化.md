---
title: Redis 持久化
description: "Redis 持久化"
slug: "/tools/redis/persistence"
hide_table_of_contents: false
keywords: ["Redis"]
tags: ["Redis"]
date: 2017-08-01
categories: ["Redis"]
---
## 1. 简介
Redis 是内存数据库，数据存储在内存中，服务器重启后数据会丢失。为了保证数据安全，Redis 提供了多种持久化机制，将内存中的数据保存到磁盘上。



## 2. RDB 快照持久化

RDB（Redis Database）是 Redis 默认的持久化方式，它将某个时间点的数据集快照保存到磁盘上。

> #### RDB 工作原理
>
> **内存数据** → **fork 子进程** → **生成 RDB 文件** → **替换旧文件**
>
> 特点：二进制格式、文件小、恢复快



「优势：」

在使用 RDB 备份时，Redis 父进程实现持久化工作只需要派生一个将完成所有其余工作的子进程即可，这样父进程不需要执行磁盘 I/O 或类似操作，从而最大限度提高 Redis 性能。

RDB 主要用于大规模的数据恢复、需要定时备份、对数据完整性和一致性要求不高的情况下。

「劣势：」

当 Redis 突然停止工作后，未进行快照备份的数据会导致丢失；

内存数据的全量同步，如果数据量太大会导致 I/O 严重影响服务器性能；

RDB 依赖于主进程的 fork，在更大的数据集中，这可能会导致服务请求的瞬间延迟，fork 的时候内存中的数据被克隆一份，导致 2 倍的膨胀性。

### 2.1 RDB 配置参数

| 配置项           | 描述         | 示例                                 |
| ---------------- | ------------ | ------------------------------------ |
| `save`           | 自动保存条件 | `save 900 1` (900 秒内至少 1 个 key 变化) |
| `dbfilename`     | RDB 文件名    | `dbfilename dump.rdb`                |
| `dir`            | 文件保存目录 | `dir /var/lib/redis`                 |
| `rdbcompression` | 是否压缩     | `rdbcompression yes`                 |
| `rdbchecksum`    | 是否校验     | `rdbchecksum yes`                    |

### 2.1 RDB 配置示例

```bash
# redis.conf 配置
# 自动保存策略
save 900 1      # 900秒内至少1个key发生变化
save 300 10     # 300秒内至少10个key发生变化
save 60 10000   # 60秒内至少10000个key发生变化

# RDB文件配置
dbfilename dump.rdb
dir /var/lib/redis/
rdbcompression yes
rdbchecksum yes

# 当RDB保存失败时停止写入
stop-writes-on-bgsave-error yes
```

### 2.3 手动触发 RDB

```bash
# 阻塞式保存（会阻塞Redis服务）
SAVE

# 非阻塞式保存（推荐）
BGSAVE

# 查看最后一次保存时间
LASTSAVE

# 获取RDB保存状态
INFO persistence
```



## 3. AOF 日志持久化

AOF 持久化是以日志的形式来记录每个写操作，将 Redis 执行过的所有写指令记录下来（读操作不记录）并以追加的方式写在日志中。

在 Redis 服务重启时，会根据日志文件的内容将写指令从前到后执行一次以完成数据的恢复工作。

工作原理如下：

>#### AOF 工作原理
>
>**写命令** → **追加到 AOF 缓冲区** → **同步到 AOF 文件** → **定期重写**
>
>特点：记录操作日志、数据完整性高、文件较大



在 Redis 执行写操作时，不会立刻将写操作写入 AOF 文件中，而是先将写命令保存在 AOF 缓存区，根据写入策略将所有写操作保存在 AOF 文件中。

随着写入 AOF 内容的增加，AOF 会根据规则进行命令的合并（重写），从而起到 AOF 文件压缩的目的，避免了文件膨胀。

「优势：」

AOF 有不同的写入策略，默认是每秒执行写入，其性能也是很好的，而且最多只能丢失一秒的数据；

AOF 日志是一个仅附加日志，不会出现寻道问题，不会在断电时出现损坏问题，即使有损坏，也可以通过 redis-check-aof 对 AOF 文件进行修复；

当 AOF 文件过大，Redis 能在后台自动重写 AOF，起到 AOF 文件压缩的目的，避免了文件膨胀；

AOF 文件内容易于理解，方便我们对其进行修改，从而达到我们想要的效果。

「劣势：」

AOF 文件通常比相同数据集的等效 RDB 文件大；

AOF 运行效率要慢于 RDB，每秒同步策略效率较好，不同步效率和 RDB 相同；

注意：AOF 的优先级高于 RDB，当 AOF 和 RDB 同时使用时，Redis 重启时，只会加载 AOF 文件，不会加载 RDB 文件。



### 3.1 AOF 配置参数

| 配置项                        | 描述             | 示例                              |
| :---------------------------- | :--------------- | :-------------------------------- |
| `appendonly`                  | 启用 AOF          | `appendonly yes`                  |
| `appendfilename`              | AOF 文件名        | `appendfilename "appendonly.aof"` |
| `appendfsync`                 | 同步策略         | `appendfsync everysec`            |
| `auto-aof-rewrite-percentage` | 重写触发百分比   | `auto-aof-rewrite-percentage 100` |
| `auto-aof-rewrite-min-size`   | 重写最小文件大小 | `auto-aof-rewrite-min-size 64mb`  |

### 3.2 AOF 同步策略

| 策略                          | 说明                 | 优点                    | 缺点                  |
| :---------------------------- | :------------------- | :-------------------------------- | --------------------------------- |
| `always`                      | 每个写命令都同步     | 可靠性高，数据基本不丢失 | 每个写操作都要落盘，性能影响较大 |
| `everysec`                    | 每秒同步一次（推荐） | 性能适中                 | 宕机时丢失 1 秒内的数据 |
| `no`       | 由操作系统决定       | 性能好                   | 宕机时丢失数据较多               |

### 3.3 AOF 配置示例

```bash
# redis.conf 配置
# 启用AOF
appendonly yes
appendfilename "appendonly.aof"

# 同步策略（推荐everysec）
appendfsync everysec

# AOF重写配置
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb

# 重写期间是否同步
no-appendfsync-on-rewrite no

# AOF文件损坏时的处理
aof-load-truncated yes
```

### 3.4 AOF 重写

随着 Redis 不断的进行，AOF 的文件会越来越大，文件越大，占用服务器内存越大以及 AOF 恢复要求时间越长。

为了解决这个问题，Redis 新增了重写机制，当 AOF 文件的大小超过所设定的峰值时，Redis 就会自动启动 AOF 文件的内容压缩，保留可以恢复数据的最小指令集。

示例：

```bash
# 手动触发AOF重写
BGREWRITEAOF

# 查看AOF重写状态
INFO persistence

# AOF重写示例
# 原始AOF文件可能包含：
SET key1 "value1"
SET key1 "value2"
SET key1 "value3"
DEL key2
SET key2 "new_value"

# 重写后的AOF文件：
SET key1 "value3"
SET key2 "new_value"
```



## 4. 混合持久化

从 Redis 4.0 起引入的混合持久化，结合了 RDB 和 AOF 的优点。

### 4.1 混合持久化配置

```bash
# 启用混合持久化
aof-use-rdb-preamble yes

# 混合持久化文件结构：
# [RDB格式的数据] + [AOF格式的增量数据]

# 优点：
# 1. 文件更小（RDB格式压缩率高）
# 2. 恢复更快（RDB格式加载快）
```



## 5. 持久化方式对比

| 特性           | RDB      | AOF  | 混合持久化 |
| :------------- | :------- | :--- | ---------- |
| **文件大小**   | 小       | 大   | 中等       |
| **恢复速度**   | 快       | 慢   | 快         |
| **数据完整性** | 可能丢失 | 完整 | 完整       |
| **性能影响**   | 小       | 大   | 小         |
| **可读性**     | 二进制   | 文本 | 混合       |

## 6. 持久化最佳实践

### 6.1 生产环境建议

- **同时启用 RDB 和 AOF**: RDB 用于备份，AOF 用于数据恢复
- **AOF 使用 everysec**: 平衡性能和数据安全
- **定期备份 RDB 文件**: 复制到其他服务器或云存储
- **监控磁盘空间**: 确保有足够空间存储持久化文件
- **测试恢复流程**: 定期验证数据恢复的正确性

### 6.2 注意事项

- **磁盘性能**: 持久化会增加磁盘 I/O，使用 SSD 提升性能
- **内存使用**: RDB fork 子进程会临时占用额外内存
- **文件权限**: 确保 Redis 进程有读写持久化文件的权限
- **网络传输**: 主从复制时需要传输 RDB 文件