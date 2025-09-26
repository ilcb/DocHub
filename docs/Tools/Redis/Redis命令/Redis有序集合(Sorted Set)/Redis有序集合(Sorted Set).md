---
title: Redis 有序集合(Sorted Set)
description: "Redis 有序集合(Sorted Set)"
slug: "/tools/redis/ds-zset"
hide_table_of_contents: false
keywords: ["Redis"]
tags: ["Redis"]
date: 2017-08-01
categories: ["Redis"]
---
## 1. 简介
Redis 有序集合（Sorted Set）是字符串元素的集合，每个元素都关联一个分数（score）。元素按分数排序，分数可以重复，但元素必须唯一。有序集合提供了快速的范围查询和排名功能。

## 2. 基本命令

| 命令                                       | 描述                                                         | 示例                               |
| ------------------------------------------ | ------------------------------------------------------------ | ---------------------------------- |
| `ZADD key socre member [score member ...]` | 向有序集合添加一个或多个成员，或者更新已存在成员的分数       | `ZADD leaderboard 100 "player1"`   |
| `ZCORE key member`                         | 返回有序集中，成员的分数值                                   | `ZSCORE leaderboard "player1"`     |
| `ZCARD key`                                | 获取有序集合元素数量                                         | `ZCARD leaderboard`                |
| `ZCOUNT key min max`                       | 计算在有序集合中指定区间分数的成员数                         | `ZCOUNT leaderboard 80 100`        |
| `ZINCRBY key increment member`             | 有序集合中对指定成员的分数加上增量 increment                 | `ZINCRBY leaderboard 10 "player1"` |
| `ZRANK key member`                         | 获取元素排名（升序，从 0 开始）                                | `ZRANK leaderboard "player1"`      |
| `ZREVRANK key member`                      | 返回有序集合中指定成员的排名，有序集成员按分数值递减(从大到小)排序 |                                    |
| `ZLEXCOUNT key min max`                    | 在有序集合中计算指定字典区间内成员数量                       |                                    |

### 2.1 示例



## 3. 范围查询命令

按排名或分数范围查询元素：

| 命令                                                         | 描述                           | 示例                                   |
| :----------------------------------------------------------- | :----------------------------- | :------------------------------------- |
| `ZRANGE key start stop [WITHSCORES]`                         | 按排名范围获取元素（升序）     | `ZRANGE leaderboard 0 2 WITHSCORES`    |
| `ZRANGEBYLEX key min max [LIMIT offset count]`               | 通过字典区间返回有序集合的成员 |                                        |
| `ZREVRANGE key start stop [WITHSCORES]`                      | 按排名范围获取元素（降序）     | `ZREVRANGE leaderboard 0 2 WITHSCORES` |
| `ZRANGEBYSCORE key min max [WITHSCORES] [LIMIT offset count]` | 按分数范围获取元素（升序）     | `ZRANGEBYSCORE leaderboard 80 100`     |
| `ZREVRANGEBYSCORE key max min [WITHSCORES] [LIMIT offset count]` | 按分数范围获取元素（降序）     | `ZREVRANGEBYSCORE leaderboard 100 80`  |

### 3.1 示例

```bash
# 创建学生成绩排行榜
ZADD student:scores 85 "Alice" 92 "Bob" 78 "Charlie" 95 "David" 88 "Eve"

# 按排名查询（升序：分数从低到高）
ZRANGE student:scores 0 2               # 返回: ["Charlie", "Alice", "Eve"]
ZRANGE student:scores 0 2 WITHSCORES    # 返回: ["Charlie", "78", "Alice", "85", "Eve", "88"]

# 按排名查询（降序：分数从高到低）
ZREVRANGE student:scores 0 2            # 返回: ["David", "Bob", "Eve"] (前3名)
ZREVRANGE student:scores 0 2 WITHSCORES # 返回: ["David", "95", "Bob", "92", "Eve", "88"]

# 按分数范围查询
ZRANGEBYSCORE student:scores 80 90       # 返回: ["Alice", "Eve"] (80-90分的学生)
ZRANGEBYSCORE student:scores 90 100 WITHSCORES  # 返回: ["Bob", "92", "David", "95"]

# 获取排名
ZRANK student:scores "Alice"             # 返回: 1 (升序排名，从0开始)
ZREVRANK student:scores "Alice"          # 返回: 3 (降序排名，从0开始)

# 分页查询
ZREVRANGE student:scores 0 1            # 第1页：前2名
ZREVRANGE student:scores 2 3            # 第2页：第3-4名
```

## 4. 删除操作命令

按排名或分数范围删除元素：

| 命令                             | 描述                                   | 说明                                |
| :------------------------------- | :------------------------------------- | :---------------------------------- |
| `ZREM key member [member ...]`   | 移除有序集合中的一个或多个成员         |                                     |
| `ZREMRANGEBYLEX key min max`     | 移除有序集合中给定的字典区间的所有成员 |                                     |
| `ZREMRANGEBYRANK key start stop` | 按排名范围删除元素                     | `ZREMRANGEBYRANK leaderboard 0 2`   |
| `ZREMRANGEBYSCORE key min max`   | 按分数范围删除元素                     | `ZREMRANGEBYSCORE leaderboard 0 60` |

### 4.1 示例

```bash
# 创建测试数据
ZADD test:scores 10 "a" 20 "b" 30 "c" 40 "d" 50 "e" 60 "f"

# 删除最低的3个分数
ZREMRANGEBYRANK test:scores 0 2         # 删除排名0-2的元素（a, b, c）
ZRANGE test:scores 0 -1                 # 返回: ["d", "e", "f"]

# 删除分数低于50的元素
ZREMRANGEBYSCORE test:scores 0 49       # 删除分数0-49的元素
ZRANGE test:scores 0 -1 WITHSCORES      # 返回: ["e", "50", "f", "60"]

# 保留前N名（删除其他）
ZADD ranking 100 "p1" 90 "p2" 80 "p3" 70 "p4" 60 "p5"
ZREMRANGEBYRANK ranking 0 -4            # 保留前3名，删除其他
ZREVRANGE ranking 0 -1                  # 返回: ["p1", "p2", "p3"]
```



## 5. 集合运算命令

有序集合之间的运算操作：

| 命令                                                         | 描述           | 示例                           |
| :----------------------------------------------------------- | :------------- | :----------------------------- |
| `ZUNIONSTORE destination numkeys key [key ...] [WEIGHTS weight [weight ...]] [AGGREGATE SUM` | 计算并集并存储 | ZUNIONSTORE result 2 set1 set2 |
| `ZINTERSTORE destination numkeys key [key ...] [WEIGHTS weight [weight ...]] [AGGREGATE SUM` | 计算交集并存储 | ZINTERSTORE result 2 set1 set2 |

### 5.1 示例

```bash
# 创建两个科目的成绩
ZADD math:scores 85 "Alice" 90 "Bob" 78 "Charlie"
ZADD english:scores 88 "Alice" 82 "Bob" 92 "David"

# 计算总分（并集，分数相加）
ZUNIONSTORE total:scores 2 math:scores english:scores AGGREGATE SUM
ZREVRANGE total:scores 0 -1 WITHSCORES
# 返回: ["Alice", "173", "Bob", "172", "David", "92", "Charlie", "78"]

# 计算两科都有成绩的学生（交集）
ZINTERSTORE both:scores 2 math:scores english:scores AGGREGATE SUM
ZREVRANGE both:scores 0 -1 WITHSCORES
# 返回: ["Alice", "173", "Bob", "172"] (只有Alice和Bob两科都有成绩)

# 使用权重计算加权平均
ZUNIONSTORE weighted:scores 2 math:scores english:scores WEIGHTS 0.6 0.4
ZREVRANGE weighted:scores 0 -1 WITHSCORES
# 数学占60%，英语占40%的加权分数
```

## 6. 遍历命令

安全遍历大有序集合

| 命令                                             | 描述             | 示例                            |
| :----------------------------------------------- | :--------------- | :------------------------------ |
| `ZSCAN key cursor [MATCH pattern] [COUNT count]` | 迭代有序集合元素 | `ZSCAN myzset 0 MATCH "user:*"` |

## 6. 实际应用场景

### 6.1 排行榜系统

使用有序集合实现各种排行榜：

```bash
# 游戏积分排行榜
ZADD game:leaderboard 1500 "player001" 1200 "player002" 1800 "player003"
ZADD game:leaderboard 1350 "player004" 1600 "player005"

# 获取前10名
ZREVRANGE game:leaderboard 0 9 WITHSCORES

# 获取某玩家排名
ZREVRANK game:leaderboard "player001"   # 返回: 2 (第3名，从0开始)

# 获取某玩家周围的排名
SET player_rank [ZREVRANK game:leaderboard "player001"]
ZREVRANGE game:leaderboard (player_rank-2) (player_rank+2) WITHSCORES

# 更新玩家分数
ZINCRBY game:leaderboard 100 "player001" # 增加100分

# 月度排行榜重置
DEL game:leaderboard:2024-01
RENAME game:leaderboard game:leaderboard:2024-01

# 分段排行榜
ZRANGEBYSCORE game:leaderboard 1000 1500 WITHSCORES  # 1000-1500分段
```

### 6.2 延时队列

使用时间戳作为分数实现延时任务：

```bash
# 添加延时任务（时间戳作为分数）
ZADD delay:queue 1640995200 "task:send_email:1001"     # 2022-01-01 00:00:00
ZADD delay:queue 1640995800 "task:send_sms:1002"       # 2022-01-01 00:10:00
ZADD delay:queue 1640996400 "task:push_notification:1003" # 2022-01-01 00:20:00

# 获取当前时间戳
SET current_time [date +%s]

# 获取到期的任务
ZRANGEBYSCORE delay:queue 0 $current_time

# 处理到期任务并删除
ZRANGEBYSCORE delay:queue 0 $current_time LIMIT 0 10
# 处理任务...
ZREMRANGEBYSCORE delay:queue 0 $current_time

# 定时任务调度器
while true; do
    current=$(date +%s)
    tasks=$(redis-cli ZRANGEBYSCORE delay:queue 0 $current LIMIT 0 100)
    for task in $tasks; do
        # 处理任务
        echo "Processing: $task"
    done
    redis-cli ZREMRANGEBYSCORE delay:queue 0 $current
    sleep 1
done
```



### 6.3 时间序列数据

使用时间戳存储时间序列数据：

```bash
# 存储用户活跃度数据（时间戳:活跃度分数）
ZADD user:1001:activity 1640995200 85   # 2022-01-01的活跃度
ZADD user:1001:activity 1641081600 92   # 2022-01-02的活跃度
ZADD user:1001:activity 1641168000 78   # 2022-01-03的活跃度

# 获取最近7天的活跃度
SET week_ago [expr [date +%s] - 604800]
ZRANGEBYSCORE user:1001:activity $week_ago +inf WITHSCORES

# 获取某时间段的平均活跃度
ZRANGEBYSCORE user:1001:activity 1640995200 1641168000 WITHSCORES

# 存储股票价格数据
ZADD stock:AAPL:price 1640995200 150.25  # 某时刻的股价
ZADD stock:AAPL:price 1640995260 150.30  # 1分钟后的股价

# 获取某时间段的价格走势
ZRANGEBYSCORE stock:AAPL:price 1640995200 1640999999 WITHSCORES

# 清理过期数据（保留最近30天）
SET month_ago [expr [date +%s] - 2592000]
ZREMRANG
```

### 6.4 热门内容

基于热度分数的内容排序：

```bash
# 文章热度排行（综合浏览量、点赞数、评论数）
# 热度分数 = 浏览量 * 0.1 + 点赞数 * 2 + 评论数 * 5
ZADD hot:articles 156.5 "article:1001"  # 1000浏览+20点赞+3评论
ZADD hot:articles 234.2 "article:1002"  # 1500浏览+35点赞+8评论
ZADD hot:articles 89.3 "article:1003"   # 800浏览+5点赞+1评论

# 获取热门文章
ZREVRANGE hot:articles 0 9              # 前10热门文章

# 更新文章热度
function update_article_heat(article_id, views, likes, comments) {
    heat_score = views * 0.1 + likes * 2 + comments * 5
    ZADD hot:articles $heat_score $article_id
}

# 时间衰减热度（每小时降低5%）
function decay_heat() {
    articles = ZRANGE hot:articles 0 -1 WITHSCORES
    for article, score in articles {
        new_score = score * 0.95
        ZADD hot:articles $new_score $article
    }
}

# 分类热门内容
ZADD hot:tech:articles 156.5 "article:tech:1001"
ZADD hot:sports:articles 234.2 "article:sports:1002"

# 获取各分类热门
ZREVRANGE hot:tech:articles 0 4         # 科技类前5
ZREVRANGE hot:sports:articles 0 4       # 体育类前5
```



### 6.5 价格区间查询

商品价格范围搜索：

```plain
# 商品价格索引（价格作为分数）
ZADD products:by_price 99.99 "product:1001"    # iPhone手机壳
ZADD products:by_price 1299.00 "product:1002"  # iPad
ZADD products:by_price 199.99 "product:1003"   # AirPods
ZADD products:by_price 2999.00 "product:1004"  # MacBook
ZADD products:by_price 599.99 "product:1005"   # Apple Watch

# 价格区间搜索
ZRANGEBYSCORE products:by_price 100 500        # 100-500元商品
ZRANGEBYSCORE products:by_price 1000 2000      # 1000-2000元商品
ZRANGEBYSCORE products:by_price 0 100          # 100元以下商品

# 分页查询（按价格升序）
ZRANGEBYSCORE products:by_price 0 +inf LIMIT 0 10   # 第1页
ZRANGEBYSCORE products:by_price 0 +inf LIMIT 10 10  # 第2页

# 价格统计
ZCOUNT products:by_price 0 100                 # 100元以下商品数量
ZCOUNT products:by_price 100 500               # 100-500元商品数量
ZCOUNT products:by_price 500 1000              # 500-1000元商品数量

# 获取价格范围
ZRANGE products:by_price 0 0 WITHSCORES        # 最低价
ZREVRANGE products:by_price 0 0 WITHSCORES     # 最高价
```



## 7. 性能优化建议

- **合理使用索引**: 有序集合内部使用跳跃表和哈希表，查询效率高
- **避免大集合**: 单个有序集合元素数量不宜过多（建议小于 100 万）
- **使用 ZSCAN**: 遍历大有序集合时使用 ZSCAN 而不是 ZRANGE
- **批量操作**: 使用 ZADD 的多元素版本减少网络往返
- **分数设计**: 合理设计分数计算规则，避免频繁更新
- **定期清理**: 使用 ZREMRANGEBYRANK 或 ZREMRANGEBYSCORE 清理过期数据



## 8. 列表 vs 其他数据类型
  - **Sorted Set vs List**: Sorted Set 按分数排序且元素唯一，List 按插入顺序且允许重复
  - **Sorted Set vs Set**: Sorted Set 有序且支持范围查询，Set 无序但集合运算更丰富
  - **Sorted Set vs Hash**: Sorted Set 存储分数-元素对，Hash 存储字段-值对
  - **使用 Sorted Set 的场景**: 排行榜、延时队列、时间序列、价格区间查询、热门内容