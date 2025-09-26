---
title: Redis GEO
description: "Redis GEO"
slug: "/tools/redis/geo"
hide_table_of_contents: false
keywords: ["Redis"]
tags: ["Redis"]
date: 2017-08-01
categories: ["Redis"]
---

Redis GEO 主要用于存储地理位置信息，并对存储的信息进行操作，该功能在 Redis 3.2 版本新增

## 1. 基本命令

| 命令              | 功能             | 示例                                     |
| :---------------- | :--------------- | :--------------------------------------- |
| GEOADD            | 添加地理位置     | GEOADD key lng lat member                |
| GEODIST           | 计算距离         | GEODIST key member1 member2 [unit]       |
| GEORADIUS         | 范围查询         | GEORADIUS key lng lat radius unit        |
| GEORADIUSBYMEMBER | 以成员为中心查询 | GEORADIUSBYMEMBER key member radius unit |
| GEOPOS            | 获取坐标         | GEOPOS key member [member ...]           |
| GEOHASH           | 获取哈希值       | GEOHASH key member [member ...]          |

### 1.1 添加地理位置

```bash
# 添加单个位置 
GEOADD cities 116.397128 39.916527 "北京" 
# 添加多个位置 
GEOADD cities 121.473701 31.230416 "上海" \ 113.264385 23.129163 "广州" \ 114.085947 22.547 "深圳" 
# 查看添加结果 
ZRANGE cities 0 -1
```

### 1.2 距离计算

```bash
# 计算北京到上海的距离（默认米） 
GEODIST cities "北京" "上海" 
# 指定单位 
GEODIST cities "北京" "上海" km 
GEODIST cities "北京" "上海" mi 
GEODIST cities "北京" "上海" ft
```
距离计算支持的单位：

| 单位 | 说明       |
| :--- | :--------- |
| m    | 米（默认） |
| km   | 千米       |
| mi   | 英里       |
| ft   | 英尺       |

### 1.3 范围查询

查找指定范围内的地理位置：

```bash
\# 以指定成员为中心查找范围内的位置 
GEORADIUS cities 116.397128 39.916527 1000 km 
# 以现有成员为中心查找 
GEORADIUSBYMEMBER cities "北京" 1000 km 
# 带距离信息 
GEORADIUS cities 116.397128 39.916527 1000 km WITHDIST 
# 带坐标信息 
GEORADIUS cities 116.397128 39.916527 1000 km WITHCOORD 
# 带哈希值 
GEORADIUS cities 116.397128 39.916527 1000 km WITHHASH 
# 限制返回数量并排序 
GEORADIUS cities 116.397128 39.916527 1000 km COUNT 3 ASC
```

查询选项说明：

- **WITHDIST**：返回距离信息
- **WITHCOORD**：返回坐标信息
- **WITHHASH**：返回哈希值
- **COUNT**：限制返回数量
- **ASC/DESC**：按距离排序

### 1.4 获取位置信息

获取存储的地理位置信息：

```bash
\# 获取位置坐标 
GEOPOS cities "北京" "上海" 
# 获取位置哈希值 
GEOHASH cities "北京" "上海" "广州" 
# 查看所有成员 
ZRANGE cities 0 -1 
# 查看成员数量 
ZCARD cities
```

### 1.5 删除位置

删除地理位置信息：

```bash
\# 删除单个位置 
ZREM cities "深圳" 
# 删除多个位置 
ZREM cities "广州" "上海" 
# 清空所有位置 
DEL cities
```

## 2. 实际应用场景

Redis GEO 在实际项目中的应用：

#### 常见应用场景

- **附近的人**：社交应用中查找附近用户
- **外卖配送**：查找附近的餐厅和配送员
- **打车服务**：匹配附近的司机和乘客
- **门店定位**：查找附近的商店或服务点
- **物流追踪**：跟踪货物和车辆位置

```bash
# 外卖应用示例 
# 添加餐厅位置 
GEOADD restaurants 116.397128 39.916527 "麦当劳-王府井店" 
GEOADD restaurants 116.407128 39.926527 "肯德基-东单店"
GEOADD restaurants 116.387128 39.906527 "星巴克-前门店" 
# 用户查找附近2公里内的餐厅 
GEORADIUS restaurants 116.397128 39.916527 2 km WITHDIST ASC 
# 添加配送员位置 
GEOADD delivery_staff 116.397128 39.916527 "配送员001" 
GEOADD delivery_staff 116.407128 39.926527 "配送员002" 
# 为订单匹配最近的配送员
GEORADIUS delivery_staff 116.397128 39.916527 5 km COUNT 1 ASC
```
