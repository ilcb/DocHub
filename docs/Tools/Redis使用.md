---
layout: _post
title: Redis 使用
date: 2017-07-26 17:33:12
tags: 
  - Redis
categories: 
  - 工具
---
## Redis key 命令
+ del key
  存在 key 时删除 key
+ dump key
  序列化给定 key ，并返回被序列化的值
+ exists key 
  检查 key 是否存在
+ expire key seconds 
  设置 key 的过期时间，以秒为单位
+ expireat key timestamp 
  设置 key 在指定时间戳之后过期
+ expireat key millseconds 
  设置 key 的过期时间，以毫秒为单位
+ pexoureat key milliseconds-timestamp 
  设置 key 过期时间的时间戳(unix timestamp) 以毫秒计
+ keys pattern 
  查找与指定模式匹配的所有 key
+ move key db 
  将当前数据库的 key 移动到给定的数据库 db 当中
+ persist key 
  删除 key 的过期时间
+ ttl key 
  获取 key 的剩余到期时间,以秒为单位
+ randomkey 
  从 redis 返回一个随机的 key
+ rename key newkey 
  更改 key 名称
+ pttl key 
  获取 key 的剩余到期时间，以毫秒为单位
+ renamenx key newkey 
  仅当 newkey 不存在时，将 key 改名为 newkey
+ type key
  返回 key 所存储的值的类型
## Redis 字符串（string）
+ set key value 
  设置 key 的值
  ```bash
  127.0.0.1:6379> set key 'value'
  ​OK
  ```
+ get key
  获取指定 key 的值
  ```bash
  127.0.0.1:6379> get key
  ​"value"
  ```
+ getset key value
  将给定 key 的值设为 value,返回 key 的旧值（old value）
  ```bash
  ​127.0.0.1:6379> getset key 'new-value'
  ​"value"
  ​127.0.0.1:6379> get key
  ​"new-value"
  ```
+ setex key seconds value
  将 value 关联到 key,并将 key 的过期时间设置位 seconds 秒
  ```bash
  ​127.0.0.1:6379> setex mykey 60 redis
  ​OK
  ​127.0.0.1:6379> ttl mykey
  ​(integer) 55
  ​127.0.0.1:6379> get mykey
  ​"redis"
  ```
+ setnx key value
  只有在 key 不存在时设置 key 的值
  ```bash
  ​127.0.0.1:6379> exists job
  ​(integer) 0
  ​127.0.0.1:6379> setnx job 'programmer'
  ​(integer) 1
  ​127.0.0.1:6379> setnx job 'code-framer'
  ​(integer) 0
  ​127.0.0.1:6379> get job
  ​"programmer"
  ```
+ setrange key offset value
  用 value 重置 key 存储的字符串值，从偏移量 offset 开始
  ```bash
  ​127.0.0.1:6379> set key1 'hello world'
  ​OK
  ​127.0.0.1:6379> setrange key1 6 'redis'
  ​(integer) 11
  ​127.0.0.1:6379> get key1
  ​"hello redis"
  ```
+ getrange key start end
  返回 key 中字符串的子串
  ```bash
  ​127.0.0.1:6379> get key
  ​"value"
  ```
+ setbit key offset value
  对 key 存储的字符串值，设定或清除指定偏移量上的位
+ getbit key offset
  对 key 存储的字符串值，获取指定偏移量上的位（bit）
+ mset key value key1 value1 ...
  设置一个或多个 key-value 对
  ```bash
  ​127.0.0.1:6379> mset key1 'hello' key2 'world'
  ​OK
  ​127.0.0.1:6379> get key1
  ​"hello"
  ​127.0.0.1:6379> get key2
  ​"world"
  ​127.0.0.1:6379> mget key1 key2
  ​1) "hello"
  ​2) "world"
  ```
+ mget key1 key2 ...
  获取一个或多个给定 key 的值
  ```bash
  ​127.0.0.1:6379> set key1 'value1'
  ​OK
  ​127.0.0.1:6379> set key2 'value2'
  ​OK
  ​127.0.0.1:6379> mget key1 key2
  ​1) "value1"
  ​2) "value2"
  ```
+ msetnx key value key1 value1 ...
  仅当所有给定的 key 都不存在时设置一个或多个 key-value 对
  ```bash
  ​127.0.0.1:6379> msetnx rmdbs 'mysql' nosql 'mongodb' key-value-store 'redis'
  ​(integer) 1
  ​127.0.0.1:6379> mget rmdbs nosql key-value-store
  ​1) "mysql"
  ​2) "mongodb"
  ​3) "redis"
  ​127.0.0.1:6379> msetnx rmdbs 'sqlite' language 'java'
  ​(integer) 0
  ```
+ strlen key
  返回 key 存储值的长度
  ```bash
  ​127.0.0.1:6379> set mykey 'hello world'
  ​OK
  ​127.0.0.1:6379> strlen mykey
  ​(integer) 11
  ```
+ psetex key milliseconds value
  以毫秒为单位设置 key 的生存时间
  ```bash
  ​127.0.0.1:6379> psetex mykey 20000 'hell0'
  ​OK
  ​127.0.0.1:6379> pttl mykey
  ​(integer) 16300
  ​127.0.0.1:6379> get mykey
  ​"hell0"
  ```
+ incr key
  将 key 中存储的数字+1
  ```bash
  ​127.0.0.1:6379> set page 10
  ​OK
  ​127.0.0.1:6379> incr page
  ​(integer) 11
  ​127.0.0.1:6379> get page
  ​"11"
  ```
+ incrby key increment
  将 key 存储的值加上给定的增量值(increment)
  ```bash
  ​127.0.0.1:6379> set page 10
  ​OK
  ​127.0.0.1:6379> incrby page 5
  ​(integer) 15
  ```
+ incrbyfloat key increment
  将 key 存储的值奖赏指定的浮点增量值(increment)
  ```bash
  ​127.0.0.1:6379> set mykey 10.5
  ​OK
  ​127.0.0.1:6379> incrbyfloat mykey 0.4
  ​"10.9"
  ```
+ decr key
  将 key 中存储的数字-1
  ```bash
  ​127.0.0.1:6379> set fail_times 10
  ​OK
  ​127.0.0.1:6379> decr fail_times
  ​(integer) 9
  ```
+ decrby key decrement
  将 key 中存储的数字减去指定的减量值(decrement)
  ```bash
  ​127.0.0.1:6379> set count 10
  ​OK
  ​127.0.0.1:6379> decrby count 5
  ​(integer) 5
  ```
+ append key value
  如果 key 已经存在且是一个字符串，将 value 值追加到 key 中存储值的末尾
  ```bash
  ​127.0.0.1:6379> exists phone
  ​(integer) 0
  ​127.0.0.1:6379> append phone 'nokia'
  ​(integer) 5
  ​127.0.0.1:6379> append phone '5300'
  ​(integer) 9
  ​127.0.0.1:6379> get phone
  ​"nokia5300"
  ```
## Redis 哈希 (hash)
+ hset key field value
  将哈希表 key 中的字段 field 的值设为 value
  ```bash
  ​127.0.0.1:6379> hset myhash field1 'aaa'
  ​(integer) 1
  ```
+ hsetnx key field value
  只有在字段 field 不存在时，设置哈希表字段的值
  ```bash
  ​127.0.0.1:6379> hsetnx myhash field1 'aaa'
  ​(integer) 0
  ```
+ hget key field
  获取哈希表中指定 key 的指定字段和值
  ```bash
  ​127.0.0.1:6379> hget myhash field1
  ​"aaa"
  ```
+ hgetall key
  获取哈希表中指定 key 的所有字段和值
  ```bash
  ​127.0.0.1:6379> hset myhash field2 'bbb'
  ​(integer) 1
  ​127.0.0.1:6379> hgetall myhash
  ​1) "field1"
  ​2) "aaa"
  ​3) "field2"
  ​4) "bbb"
  ```
+ hmset key field1 value1 field2 value2 ...
  同时将多个 field-value 对设置到哈希表中
  ```bash
  ​127.0.0.1:6379> hmset myhash field3 'ccc' field4 'ddd'
  ​OK
  ```
+ hmget key field1 field2 ...
  获取所有给定字段的值
  ```bash
  ​127.0.0.1:6379> hmget myhash field3
  ​1) "ccc"
  ```
+ hdel key field1 field2 
  删除一个或多个哈希表字段
  ```bash
  ​127.0.0.1:6379> hdel myhash field3
  ​(integer) 1
  ​127.0.0.1:6379> hgetall myhash
  ​1) "field1"
  ​2) "aaa"
  ​3) "field2"
  ​4) "bbb"
  ```
+ hexists key field
  查看哈希表 key 中，指定的 field 是否存在
  ```bash
  ​127.0.0.1:6379> hexists myhash field3
  ​(integer) 0
  ```
+ hkeys key
  获取所有哈希表中的字段
  ```bash
  ​127.0.0.1:6379> hexists myhash field3
  ​(integer) 0
  ```
+ hincrby key field increment
  哈希表中 key 指定的字段的整数值加上增量
  ```bash
  ​increment127.0.0.1:6379> hset myhash field 5
  ​(integer) 1
  ​127.0.0.1:6379> hincrby myhash field 1
  ​(integer) 6
  ​127.0.0.1:6379> hincrby myhash field -6
  ​(integer) 0
  ```
+ hincrbyfloat key field increment
  哈希表中 key 指定的字段的浮点值加上增量 increment
  ```bash
  ​127.0.0.1:6379> hset mykey field 10.5
  ​(integer) 1
  ​127.0.0.1:6379> hincrbyfloat mykey field 0.1
  ​"10.6"
  ```
+ hlen key
获取哈希表中字段的数量
  ```bash
  ​127.0.0.1:6379> hlen myhash
  ​(integer) 3
  ```
+ hvals key
  获取哈希表中所有值
  ```bash
  ​127.0.0.1:6379> hvals myhash
  ​1) "aaa"
  ​2) "bbb"
  ​3) "10.5"
  ```
+ hscan key cursor[MATCH pattern][COUNT count]
  迭代哈希表中的键值对
## Redis 列表 (list)
+ lpush key value1 value2 ...
  将一个或多个值插入到列表头部
  ```bash
  ​127.0.0.1:6379> lpush list1 'aaa'
  ​(integer) 1
  ​127.0.0.1:6379> lpush list1 'bbb' 'ccc'
  ​(integer) 3
  ```
+ lpushx key value
  将一个子插入到已存在的列表头部
  ```bash
  ​127.0.0.1:6379> lpushx list1 '111'
  ​(integer) 4
  ​127.0.0.1:6379> lrange list1 0 4
  ​1) "111"
  ​2) "ccc"
  ​3) "bbb"
  ​4) "aaa"
  ```
+ lpop key
  移出并获取列表的第 1 个元素
  ```bash
  ​127.0.0.1:6379> lpop list1
  ​"111"
  ​127.0.0.1:6379> lrange list1 0 4
  ​1) "ccc"
  ​2) "bbb"
  ​3) "aaa"
  ```
+ rpush key value1 value2 ...
  在列表中添加一个或多个值
  ```bash
  ​127.0.0.1:6379> rpush list1 '111'
  ​(integer) 4
  ​127.0.0.1:6379> lrange list1 0 4
  ​1) "ccc"
  ​2) "bbb"
  ​3) "aaa"
  ​4) "111"
  ```
+ rpushx key value
  为已存在的列表添加值
  ```bash
  ​127.0.0.1:6379> rpushx list1 '222'
  ​(integer) 5
  ​127.0.0.1:6379> lrange list1 0 5
  ​1) "ccc"
  ​2) "bbb"
  ​3) "aaa"
  ​4) "111"
  ​5) "222"
  ```
+ rpop key
  移除并获取列表最后一个元素
  ```bash
  ​127.0.0.1:6379> rpop list1
  ​"222"
  ​127.0.0.1:6379> lrange list1 0 5
  ​1) "ccc"
  ​2) "bbb"
  ​3) "aaa"
  ​4) "111"
  ```
+ blpop key1 key2 ... timeout
  移除并获取列表的第 1 个元素，如果没有元素会阻塞列表知道等待超时或者发现可弹出元素为止
  如果列表为空，返回一个 nil 。 否则，返回一个含有两个元素的列表，第一个元素是被弹出元素所属的 key ，第二个元素是被弹出元素的值。
  ```bash
  ​127.0.0.1:6379> blpop list1 100
  ​1) "list1"
  ​2) "ccc"
  ```
+ brpop key1 key2 ... timeout
  移除并获取列表的最后 1 个元素，如果没有元素会阻塞列表知道等待超时或者发现可弹出元素为止
  假如在指定时间内没有任何元素被弹出，则返回一个 nil 和等待时长。 反之，返回一个含有两个元素的列表，第一个元素是被弹出元素所属的 key ，第二个元素是被弹出元素的值。
  ```bash
  ​127.0.0.1:6379> brpop list1 100
  ​1) "list1"
  ​2) "111"
  ```
+ brpoplpush source destination timeout
  从列表中弹出一个值，并插入另一个列表中并返回它， 如果列表没有元素会阻塞列表直到等待超时或发现可弹出元素为止
+ rpoplpush source destination
  移除列表最后一个元素，并将元素添加到另一个列表并返回
  ```bash
  127.0.0.1:6379> rpush mylist 'aaa'
  ​(integer) 1
  ​127.0.0.1:6379> rpush mylist 'bbb'
  ​(integer) 2
  ​127.0.0.1:6379> rpoplpush mylist myotherlist
  ​"bbb"
  ​127.0.0.1:6379> lrange mylist 0 2
  ​1) "aaa"
  ​127.0.0.1:6379> lrange myotherlist 0 2
  ​1) "bbb"
  ```
+ lindex key index
  通过索引获取列表中的元素
  ```bash
  ​127.0.0.1:6379> lindex list1 0
  ​"bbb"
  ```
+ linsert key BEFORE|AFTER pivot value
  在列表的元素前或者之后插入元素
  ```bash
  ​127.0.0.1:6379> linsert list1 before 'aaa' '444'
  ​(integer) 3
  ​127.0.0.1:6379> lrange list1 0 4
  ​1) "bbb"
  ​2) "444"
  ​3) "aaa"
  ```
+ lrange key start end
  获取列表指定范围内的元素
+ llen key
  获取列表长度
  ```bash
  ​127.0.0.1:6379> llen list1
  ​(integer) 3
  ```
+ lrem key count value
  移除列表元素
  * count > 0 : 从表头开始向表尾搜索，移除与 VALUE 相等的元素，数量为 COUNT 。
  * count < 0 : 从表尾开始向表头搜索，移除与 VALUE 相等的元素，数量为 COUNT 的绝对值。
  * count = 0 : 移除表中所有与 VALUE 相等的值
  ```bash
  127.0.0.1:6379> lrem list1 -2 'bbb'
  (integer) 1
  127.0.0.1:6379> lrange list1 0 3
  1) "444"
  2) "aaa"
  ```
+ lset key index value
  通过索引设置列表元素的值
  ```bash
  ​127.0.0.1:6379> lset list1 0 'ccc'
  ​OK
  ​127.0.0.1:6379> lrange list1 0 3
  ​1) "ccc"
  ​2) "aaa"
  ```
+ ltrim key start end
  截取列表，只保留指定区间的元素
  ```bash
  ​127.0.0.1:6379> ltrim list1 1 2
  ​OK
  ​127.0.0.1:6379> lrange list1 1 2
  ​(empty list or set)
  ```
​
## Redis 集合 (set)
+ sadd key memeber1 member2
  向集合中添加一个或多个成员
  ```bash
  ​127.0.0.1:6379> sadd myset 'aaa' 'bbb'
  ​(integer) 2
  ```
+ spop key
  移除并返回集合中的一个随机元素
  ```bash
  127.0.0.1:6379> spop myset
  ​"aaa"
  ```
+ smembers key
  返回集合中的所有成员
  ```bash
  ​127.0.0.1:6379> smembers myset
  ​1) "bbb"
  ```
+ sismember key member
  判断 member 元素是否是集合 key 的元素
  ```bash
  ​127.0.0.1:6379> sismember myset 'bbb'
  ​(integer) 1
  ```
+ scard key
  获取集合成员数
  ```bash
  ​127.0.0.1:6379> scard myset
  ​(integer) 1
  ```
+ sdiff key1 key2 ...
  返回指定所有集合的差集
  ```bash
  ​127.0.0.1:6379> sadd myset1 'ccc'
  ​(integer) 1
  ​127.0.0.1:6379> sdiff myset myset1
  ​1) "bbb"
  ```
+ sdiffstore destination key1 key2 ...
  返回所有给定集合的差集并存储在 destination 中
  ```bash
  ​127.0.0.1:6379> sdiffstore myset2 myset myset1
  ​(integer) 1
  ​127.0.0.1:6379> smembers myset2
  ​1) "bbb"
  ```
+ sinter key1 key2 ...
  返回给定所有集合的交集
  ```bash
  ​127.0.0.1:6379> sinter myset myset1
  ​(empty list or set)
  ```
+ sinterstore destination key1 key2 ...
  返回给定所有集合的交集并存储在 destination 中
+ sunion key1 key2 ...
  返回所有给定结合的并集
  ```bash
  ​127.0.0.1:6379> sunion myset myset1
  ​1) "ccc"
  ​2) "bbb"
  ```
+ sunionstore destination key1 key2 ...
  所有给定集合的并集存储在 destination 中
  ```bash
  ​127.0.0.1:6379> sunionstore myset3 myset myset1
  ​(integer) 2
  ​127.0.0.1:6379> smembers myset3
  ​1) "ccc"
  ​2) "bbb"
  ```
+ smove source destination memeber
  将 members 元素从 source 集合移动到 destination 集合
  ```bash
  ​127.0.0.1:6379> smove myset myset1 'bbb'
  ​(integer) 1
  ​127.0.0.1:6379> smembers myset1
  ​1) "ccc"
  ​2) "bbb"
  ​127.0.0.1:6379> smembers myset
  ​(empty list or set)
  ```
+ srandmember key [count]
  返回结合中一个或多个随机数
  ```bash
  ​127.0.0.1:6379> srandmember myset1
  ​"bbb"
  ```
+ srem key member1 member2 ...
  移除集合中一个或多个成员
  ```bash
  ​127.0.0.1:6379> srem myset1 'bbb'
  ​(integer) 1
  ​127.0.0.1:6379> smembers myset1
  ​1) "ccc"
  ```
+ sscan key cursour [MATCH pattern][COUNT count]
  迭代集合中的元素
## Redis 有序集合 (sorted set)
  + zadd key score1 member1 score2 member2 ...
  向有序集合添加一个或多个成员
  ```bash
  ​127.0.0.1:6379> zadd myset 1 'aaa'
  ​(integer) 1
  ​127.0.0.1:6379> zadd myset 1 'bbb'
  ​(integer) 1
  ​127.0.0.1:6379> zadd myset 2 'ccc' 3 'ddd'
  ​(integer) 2
  ​127.0.0.1:6379> zrange myset 0 -1 withscores
  ​1) "aaa"
  ​2) "1"
  ​3) "bbb"
  ​4) "1"
  ​5) "ccc"
  ​6) "2"
  ​7) "ddd"
  ​8) "3"
  ```
+ zrem key member1 member2 ...
  移除有序集合中一个或多个成员
  ```bash
  ​127.0.0.1:6379> zrem myset 'ddd'
  ​(integer) 1
  ​127.0.0.1:6379> zrange myset 0 -1 withscores
  ​1) "aaa"
  ​2) "1"
  ​3) "bbb"
  ​4) "1"
  ​5) "ccc"
  ​6) "2"
  ```
+ zremrangebylex key min max
  移除有序集合中给定字典区间内所有成员
  ```bash
  ​127.0.0.1:6379> zadd myzset 0 aaa 0 b 0 c 0 d 0 e
  ​(integer) 5
  ​127.0.0.1:6379> zadd myzset 0 foo 0 zap 0 zip 0 alpha
  ​(integer) 4
  ​127.0.0.1:6379> zrange myzset 0 -1
  ​1) "aaa"
  ​2) "alpha"
  ​3) "b"
  ​4) "c"
  ​5) "d"
  ​6) "e"
  ​7) "foo"
  ​8) "zap"
  ​9) "zip"
  ```
+ zremrangebyrank key start end
  移除有序集合中给定排名区间内的所有成员
  ```bash
  ​127.0.0.1:6379> zremrangebyrank myzset 0 1
  ​(integer) 2
  ​127.0.0.1:6379> zrange myzset 0 -1
  ​1) "b"
  ​2) "c"
  ​3) "d"
  ​4) "e"
  ​5) "foo"
  ​6) "zap"
  ​7) "zip"
  ```
+ zremrangebyscore key min max
  移除有序集合中给定分数区间内的所有成员
  ```bash
  ​127.0.0.1:6379> zremrangebyscore myzset 0 1
  ​(integer) 7
  ​127.0.0.1:6379> zrange myzset 0 -1
  ​(empty list or set)
  ```
+ zcard key
  获取有序集合的成员数
  ```bash
  ​127.0.0.1:6379> zcard myset
  ​(integer) 3
  ```
+ zcount key min max
  计算在有序集合中指定分数区间的成员数
  ```bash
  ​127.0.0.1:6379> zcount myset 0 2
  ​(integer) 3
  ```
+ zrevrank key member
  返回有序集合中指定成员的排名，有序集合成员按分数从大到小排序
  ```bash
  ​127.0.0.1:6379> zrevrank myset 'aaa'
  ​(integer) 2
  ```
+ zscore key member
  返回有序集合中成员的分数值
  ```bash
  ​127.0.0.1:6379> zscore myset 'aaa'
  ​"1"
  ```
+ zincrby key increment member
  有序集合中对指定成员的分数加上增量 increment
  ```bash
  ​127.0.0.1:6379> zincrby myset 3 'aaa'
  ​"4"
  ​127.0.0.1:6379> zrange myset 0 -1 withscores
  ​1) "bbb"
  ​2) "1"
  ​3) "ccc"
  ​4) "2"
  ​5) "aaa"
  ​6) "4"
  ```
+ zinterstore destination numkeys key1 key2
  计算给定的一个或多个有序集合的交集并将结果存储在新的有序集合中
  ```bash
  redis 127.0.0.1:6379> ZADD mid_test 70 "Li Lei"
  (integer) 1
  redis 127.0.0.1:6379> ZADD mid_test 70 "Han Meimei"
  (integer) 1
  redis 127.0.0.1:6379> ZADD mid_test 99.5 "Tom"
  (integer) 1
  redis 127.0.0.1:6379> ZADD fin_test 88 "Li Lei"
  (integer) 1
  redis 127.0.0.1:6379> ZADD fin_test 75 "Han Meimei"
  (integer) 1
  redis 127.0.0.1:6379> ZADD fin_test 99.5 "Tom"
  (integer) 1
  redis 127.0.0.1:6379> ZINTERSTORE sum_point 2 mid_test fin_test
  (integer) 3
  ```
+ zunionstore destination numkeys key1 key2 ...
  计算给定的一个或多个有序集合的并集，并存储在 destination 中
+ zlexcount key min max
  在有序集合中计算指定字典区间内成员数量
+ zrange key start stop [WITHSCOURES]
  通过索引区间返回有序集合指定区间内的成员
+ zrangebylex key min max [LIMIT offset count]
  通过字典区间返回有序集合的成员
+ zrangebyscore key min max [WITHSCORES][LIMIT]
  通过分数返回有序集合中指定成员的索引
+ zrank key member
  返回有序集合中指定成员的索引
+ zrevrange key start end [WITHSCORES]
  返回有序集合指定区间内的成员，通过索引，分数从高到低
+ zrevrangebyscore key max min [WITHSCORES]
  返回有序集合中指定分数区间内的成员，分数从高到低
+ scan key cursor [MATCH pattern][COUNT count]
  迭代有序集合中的元素
## HyperLogLog
​  在 Redis 里面，每个 HyperLogLog 键只需要花费 12 KB 内存，就可以计算接近 2^64 个不同元素的基 数。这和计算基数时，元素越多耗费内存就越多的集合形成鲜明对比。
  ​但是，因为 Hy​Redis HyperLogLog 是用来做基数统计的算法，HyperLogLog 的优点是，在输入元素的数量或者体积非常非常大时，计算基数所需的空间总是固定 的、并且是很小的。
  perLogLog 只会根据输入元素来计算基数，而不会储存输入元素本身，所以 HyperLogLog 不能像集合那样，返回输入的各个元素。
+ pfadd key element1 element2 ...
  添加指定元素到 HyperLogLog 中
+ pfcount key1 key2 ...
  返回给定 HyperLogLog 的基数估算值。
+ [PFMERGE destkey sourcekey [sourcekey ...\]](http://www.runoob.com/redis/hyperloglog-pfmerge.html) 
   将多个 HyperLogLog 合并为一个 HyperLogLog
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
## Redis 发布订阅(pub/sub)
  ​Redis 发布订阅(pub/sub)是一种消息通信模式：发送者(pub)发送消息，订阅者(sub)接收消息。
  ​Redis 客户端可以订阅任意数量的频道。
​下图展示了频道 channel1 ， 以及订阅这个频道的三个客户端 —— client2 、 client5 和 client1 之间的关系：
​![pubsub1](http://www.runoob.com/wp-content/uploads/2014/11/pubsub1.png)
​当有新消息通过 PUBLISH 命令发送给频道 channel1 时， 这个消息就会被发送给订阅它的三个客户端：
​![pubsub2](http://www.runoob.com/wp-content/uploads/2014/11/pubsub2.png)
### 示例
```bash
127.0.0.1:6379> subscribe redisChat
Reading messages... (press Ctrl-C to quit)
1) "subscribe"
2) "redisChat"
3) (integer) 1
```
重新开启个 redis 客户端，然后在同一个频道 redisChat 发布两次消息，订阅者就能接收到消息：
```bash
127.0.0.1:6379> publish redisChat 'Redis is a great caching tools'
(integer) 1
127.0.0.1:6379> publish redisChat 'learn redis'
(integer) 1
```
订阅者的客户端收到消息：
```bash
1) "message"
2) "redisChat"
3) "Redis is a great caching tools"
1) "message"
2) "redisChat"
3) "learn redis"
```
### 命令
+ psubscribe pattern1 pattern2 ...
  订阅一个或多个符合给定模式的频道。
  ```bash
  redis 127.0.0.1:6379> PSUBSCRIBE mychannel
  Reading messages... (press Ctrl-C to quit)
  1) "psubscribe"
  2) "mychannel"
  3) (integer) 1
  ```
+ pubsub subcommand argument1 argument2 ...
  查看订阅与发布系统状态
  ```bash
  redis 127.0.0.1:6379> PUBSUB CHANNELS
  (empty list or set)
  ```
+ publish channel message
  将信息发送到指定的频道
  ```bash
  redis 127.0.0.1:6379> PUBLISH mychannel "hello, i m here"
  (integer) 1
  ```
+ punsubscribe pattern1 pattern2 ...
  退订所有给定模式的频道
  ```bash
  redis 127.0.0.1:6379> PUNSUBSCRIBE mychannel 
  1) "punsubscribe"
  2) "a"
  3) (integer) 1
  ```
+ subscribe channel1 channel2 ...
  订阅给定的一个或多个频道的信息
  ```bash
  redis 127.0.0.1:6379> SUBSCRIBE mychannel 
  Reading messages... (press Ctrl-C to quit)
  1) "subscribe"
  2) "mychannel"
  3) (integer) 1
  1) "message"
  2) "mychannel"
  3) "a"
  ```
+ unsubscribe channel1 channel2
  退订指定的频道
  ```bash
  redis 127.0.0.1:6379> UNSUBSCRIBE mychannel 
  1) "unsubscribe"
  2) "a"
  3) (integer) 0
  ```
## Redis 事务
​Redis 事务可以一次执行多个命令， 并且带有以下两个重要的保证：
​事务是一个单独的隔离操作：事务中的所有命令都会序列化、按顺序地执行。事务在执行的过程中，不会被其他客户端发送来的命令请求所打断。
​事务是一个原子操作：事务中的命令要么全部被执行，要么全部都不执行。
​一个事务从开始到执行会经历以下三个阶段：
- 开始事务。
- 命令入队。
- 执行事务。
### 示例
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
+ multi
  标记一个事务的开始
+ discard
  取消事务，放弃执行事务内的所有命令
+ exec
  执行所有事务命令
+ watch key1 key2
  监视一个或多个 key,如果在事务执行之前 key 被其它命令改动，则事务被打断
+ unwatch
  取消 watch 命令对所有 key 的监视
## Redis 连接命令
+ auth password
  验证密码是否正确
  ```bash
  redis 127.0.0.1:6379> AUTH PASSWORD
  (error) ERR Client sent AUTH, but no password is set
  redis 127.0.0.1:6379> CONFIG SET requirepass "mypass"
  OK
  redis 127.0.0.1:6379> AUTH mypass
  Ok
  ```
+ echo message 
  打印字符串
  ```bash
  redis 127.0.0.1:6379> ECHO "Hello World"
  "Hello World"
  ```
+ ping
  查看服务是否运行
+ quit
  关闭当前连接
+ select index
  切换到指定的数据库