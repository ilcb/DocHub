---
title: Docker 构建 OnlyOffice 集群
description: "Docker 构建 OnlyOffice 集群"
slug: "/cloud-native/docker/build-onlyoffice-cluster"
hide_table_of_contents: false
keywords: ["Docker"]
tags: ["Docker", "CloudNative"]
date: 2017-08-01
categories: ["Docker"]
---

# Docker 构建 OnlyOffice 集群

# 1.选型

因为项目需要，需要在内网的环境下部署一套 office 的在线编辑软件。综合对比了一下网上的几种主流的解决方案，感觉 onlyoffice 比较合适。
对比如下，摘自http://www.dzzoffice.com/

| 解决方案         | 在线预览 | 在线编辑 | 本地依赖   | 内网使用 | 私有化部署 | 免费使用           |
| ---------------- | -------- | -------- | ---------- | -------- | ---------- | ------------------ |
| onlyoffice       | √        | √        | 无         | √        | √          | √ 最大 20 连接数     |
| collabora        | √        | √        | 无         | √        | √          | √ 最大 20 连接数     |
| MS Office Online | √        | √        | 无         | √        | √          | 预览免费编辑需购买 |
| google Doc       | √        | √        | 无         | ×        | ×          | √                  |
| 永中 Office       | √        | ×        | 无         | ×        | ×          | √                  |
| pageOffice       | √        | √        | Office 软件 | √        | √          | ×                  |

## 1.1 onlyOffice 优点

1. 文档还原度非常高，复杂文档还原度最好。
2. 安装部署方便，不需要独立服务器，支持 docker 容器安装，支持 windows 下部署。
3. 有社区版可免费使用（限制 20 连接数），同时提供多种版本可供企业购买使用，价格较便宜，按每服务器收取。
4. 有详尽开发文档，二次开发方便。
5. 提供贴牌服务。

## 1.2 OnlyOffice 项目信息

OnlyOfficeAPI 文档：https://api.onlyoffice.com/editors/basic
OnlyOffice 项目地址：https://github.com/ONLYOFFICE/Docker-DocumentServer
官方示例：https://api.onlyoffice.com/zh/editors/basic


# 2 依赖环境安装

## 2.1 安装 Docker

### 2.1.1 安装 Docker

```bash
curl -fsSL https://get.docker.com |bash -s docker --mirror Aliyun
```

### 2.1.2 检测 Docker 是否安装成功

```bash
docker ps
```

### 2.1.3 设置 docker 开机启动

```bash
systemctl enable docker.service
```

### 2.1.4 设置 docker 镜像源

docker 镜像从官方 dockerHub 下载会很慢，可以设置国内镜像源来加速下载

**编辑如下文件:**

```bash
vi /etc/docker/daemon.json
```

**内容为**

```bash
{
  "registry-mirrors": ["https://awkamezj.mirror.aliyuncs.com"]
}
```

修改完成后重启 docker

```bash
sudo systemctl daemon-reload

sudo systemctl restart docker
```

## 2.2 安装 nginx

nginx 在构建集群时需要用来做负载，也可以使用`HAProxy`来做负载均衡

### 2.2.1 docker 安装 nginx

```bash
#1.查询镜像
docker search nginx

#2.下载镜像
docker pull nginx
```

### 2.2.2 nginx 服务配置及启动

容器中的文件内容是可以被修改的，但是**一旦容器重启，所有写入到容器中的，针对数据文件、配置文件的修改都将丢失**。所以为了保存容器的运行状态，执行结果，我们需要将容器内的一些重要的数据文件、日志文件、配置文件映射到宿主机上。

### 2.2.3 启动容器

```bash
docker run --name nginx -p 80:80 -d nginx
```

### 2.2.4 目录映射

|                    | **容器中路径**        | **宿主机中自定义映射路径** |
| ------------------ | --------------------- | -------------------------- |
| 存储网站网页的目录 | /usr/share/nginx/html | /data/nginx/html            |
| 日志目录           | /etc/nginx/nginx.conf | /data/nginx/conf/nginx.conf |
| nginx 配置文件目录  | /var/log/nginx        | /data/nginx/logs            |
| 证书存放目录       | /etc/nginx/cert/      | /data/nginx/cert            |
| 子配置项存放处     | /etc/nginx/conf.d     | /data/nginx/conf.d          |

### 2.2.5 创建挂载目录

```bash
mkdir -p /data/nginx/{conf,conf.d,html,logs,cert}
```

### 2.2.6 复制配置到宿主机

将 nginx 配置文件 copy 到宿主机中

```bash
docker cp nginx:/etc/nginx/nginx.conf /data/nginx/conf
docker cp nginx:/etc/nginx/conf.d /data/nginx/
docker cp nginx:/usr/share/nginx/html/ /data/nginx/html/
docker cp nginx:/var/log/nginx/ /data/nginx/logs/
docker cp nginx:/etc/nginx/cert/ /data/nginx/cert/
```

### 2.2.7 停止并移除容器

```bash
docker stop nginx
docker rm nginx
```

### 2.2.8 启动容器

```bash
docker run -d \
           --name nginx \
           --restart=always \
           -p 80:80 \
           -p 443:443 \
           -v /data/nginx/conf/nginx.conf:/etc/nginx/nginx.conf \
           -v /data/nginx/html/:/usr/share/nginx/html/ \
           -v /data/nginx/logs/:/var/log/nginx/ \
           -v /data/nginx/conf.d/:/etc/nginx/conf.d \
           -v /data/nginx/cert/:/etc/nginx/cert \
           --privileged=true \
           nginx
```



# 3.重制 OnlyOffice 镜像

## 3.1 特殊需求

目前 OnlyOffice 官方镜像并不能满足业务需求，考虑对官方镜像进行改造并重新提供适合需求的镜像，的需求目前收集到的如下:

1.需要适配`WOPI`协议(官方镜像默认不支持，需要修改镜像配置)

2.OnlyOffice 在线编辑器的 logo 字样为`ONLYOFFICE`，需要进行修改


## 3.2 docker 镜像安装

```bash
#1.查找镜像
docker search onlyoffice/documentserver

#2.下载镜像
docker pull onlyoffice/documentserver
```

## 3.3 重构 Docker 镜像
以下为文件目录结构

├── Dockerfile
├── build-image.sh
├── header
│   ├── dark-logo_s.svg
│   ├── header-logo_s.svg
│   └── icons.svg
└── local.json

下面是相关文件及配置的一些说明

### 3.3.1 Dockerfile

```dockerfile
#指定基础镜像
FROM onlyoffice/documentserver:latest

LABEL maintainer = "xxx@126.com"
LABEL build_date = "2023-05-25"
LABEL comments = "1.开启WOPI协议;2.更换编辑器logo"

#镜像操作指令安装vim
RUN apt-get update
RUN apt-get install -y vim

#暴露程序端口80
EXPOSE 80 443

#更换编辑器logo
COPY ./header /var/www/onlyoffice/documentserver/web-apps/apps/common/main/resources/img/header/

COPY ./local.json /etc/onlyoffice/documentserver/

ENTRYPOINT ["/app/ds/run-document-server.sh"]
```



### 3.3.2 local.json

local.json 文件为 OnlyOffice/documentserver 的容器配置，来源于容器内的 `/etc/onlyoffice/documentserver/local.json`

```json
{
  "services": {
    "CoAuthoring": {
      "sql": {
        "type": "postgres",
        "dbHost": "localhost",
        "dbPort": "5432",
        "dbName": "onlyoffice",
        "dbUser": "onlyoffice",
        "dbPass": "onlyoffice"
      },
      "token": {
        "enable": {
          "request": {
            "inbox": false,
            "outbox": false
          },
          "browser": false
        },
        "inbox": {
          "header": "Authorization",
          "inBody": false
        },
        "outbox": {
          "header": "Authorization",
          "inBody": false
        }
      },
      "secret": {
        "inbox": {
          "string": "m0SnCOYxU9SoLOV2zGqKgiq6ARBBxc4i"
        },
        "outbox": {
          "string": "m0SnCOYxU9SoLOV2zGqKgiq6ARBBxc4i"
        },
        "session": {
          "string": "m0SnCOYxU9SoLOV2zGqKgiq6ARBBxc4i"
        }
      }
    }
  },
  "rabbitmq": {
    "url": "amqp://guest:guest@localhost"
  },
  "wopi": {
    "enable": true
  },
  "ipfilter": {
    "rules": [
        {
            "address": "*",
            "allowed": true
        }
    ],
    "useforrequest": true,
    "errorcode": 403
  }
}

```

#### 3.3.2.1 开启 WOPI 协议

开启 WOPI 协议，需要修改 local.json，新增如下配置

```bash
"wopi": {
    "enable": true
  },
  "ipfilter": {
    "rules": [
        {
            "address": "*",
            "allowed": true
        }
    ],
    "useforrequest": true,
    "errorcode": 403
  }
```

### 3.3.3 header

header 目录为 onlyoffice 编辑器样式中 logo 部分引用的图片，下边有 2 个文件`header-logo_s.svg`和`header-logo_s.svg`，为了实现对 logo 的自定义，需要修改这 2 个文件

### 3.3.4 build-image.sh

按照 Dockerfile 重新构建镜像，镜像名称为`exfoide/onlyoffice:7.3.3`，其中`7.3.3`是`onlyoffce/documentserver`官方镜像的版本，表示`exfoide/onlyoffice:7.3.3`是基于`onlyoffce/documentserver:7.3.3`版本构建而成

```bash
#/bin/bash
docker build --no-cache -f ./Dockerfile -t exfoide/onlyoffice:7.3.3 .
```

执行`build-image.sh`脚本后，docker 中新创建了容器:

![image.png](https://cdn.nlark.com/yuque/0/2023/png/22370594/1685000007506-2cbfc63a-39a2-4210-89b7-a63b2f4d9d1d.png)

## 3.4 替换 logo 方法(参考)

### 3.4.1 将容器内的 logo 图片拷贝到本地

```bash
sudo docker cp $(docker ps|grep onlyoffice/documentserver |awk '{print $1}'):/var/www/onlyoffice/documentserver/web-apps/apps/common/main/resources/img/header ~/Desktop/header
```

### 3.4.2 修改 logo 图片

### 3.4.3 修改完成后将图片信息拷贝到容器

```bash
sudo docker cp ~/Desktop/header $(docker ps|grep onlyoffice/documentserver |awk '{print $1}'):/var/www/onlyoffice/documentserver/web-apps/apps/common/main/resources/img/
```

# 4.OnlyOffice 伪集群部署

本例中准备 3 台服务器，机器环境如下

| **服务器**   | **ip**       | **部署服务** | 端口 |
|-----------|--------------| ------------ | ---- |
| localhost | 127.0.0.1    | OnlyOffice   | 8091 |
| localhost | 127.0.0.1    | OnlyOffice   | 8092 |
| localhost | 127.0.0.1    | OnlyOffice   | 8093 |
| localhost | 127.0.0.1    | nginx        | 80   |

## 4.1 安装 PostgreSQL

### 4.1.1 获取镜像

```bash
docker pull postgres
```

### 4.1.2 启动容器

```bash
docker run --name postgres -p 5432:5432 -e POSTGRES_PASSWORD=123456 --restart=always -v /data/postgres/data:/var/lib/postgresql/data -d postgres
           
```

## 4.2 准备 PostgreSQL 数据库环境

通过 `<<**4.1安装PostgreSQL**>>` 已经安装了 PostgreSQL 数据库，接下来需要初始化 OnlyOffice 数据库及数据表

### 4.2.1 创建数据库

```bash
docker exec -it $(docker ps|grep postgres |awk '{print $1}') bash
```

```bash
# 连接数据库
psql -h 127.0.0.1 -U postgres

#Password for user postgres:
输入: 123456

#创建用户
CREATE USER onlyoffice WITH PASSWORD 'onlyoffice';

#创建数据库
CREATE DATABASE onlyoffice OWNER onlyoffice;
```

### 4.2.2 创建数据表

```sql
CREATE TABLE IF NOT EXISTS "public"."doc_changes" (
"tenant" varchar(255) COLLATE "default" NOT NULL,
"id" varchar(255) COLLATE "default" NOT NULL,
"change_id" int4 NOT NULL,
"user_id" varchar(255) COLLATE "default" NOT NULL,
"user_id_original" varchar(255) COLLATE "default" NOT NULL,
"user_name" varchar(255) COLLATE "default" NOT NULL,
"change_data" text COLLATE "default" NOT NULL,
"change_date" timestamp without time zone NOT NULL,
PRIMARY KEY ("tenant", "id", "change_id")
)
WITH (OIDS=FALSE);

-- ----------------------------
-- Table structure for task_result
-- ----------------------------
CREATE TABLE IF NOT EXISTS "public"."task_result" (
"tenant" varchar(255) COLLATE "default" NOT NULL,
"id" varchar(255) COLLATE "default" NOT NULL,
"status" int2 NOT NULL,
"status_info" int4 NOT NULL,
"created_at" timestamp without time zone DEFAULT NOW(),
"last_open_date" timestamp without time zone NOT NULL,
"user_index" int4 NOT NULL DEFAULT 1,
"change_id" int4 NOT NULL DEFAULT 0,
"callback" text COLLATE "default" NOT NULL,
"baseurl" text COLLATE "default" NOT NULL,
"password" text COLLATE "default" NULL,
"additional" text COLLATE "default" NULL,
PRIMARY KEY ("tenant", "id")
)
WITH (OIDS=FALSE);

CREATE OR REPLACE FUNCTION merge_db(_tenant varchar(255), _id varchar(255), _status int2, _status_info int4, _last_open_date timestamp without time zone, _user_index int4, _change_id int4, _callback text, _baseurl text, OUT isupdate char(5), OUT userindex int4) AS
$$
DECLARE
	t_var "public"."task_result"."user_index"%TYPE;
BEGIN
	LOOP
		-- first try to update the key
		-- note that "a" must be unique
		IF ((_callback <> '') IS TRUE) AND ((_baseurl <> '') IS TRUE) THEN
			UPDATE "public"."task_result" SET last_open_date=_last_open_date, user_index=user_index+1,callback=_callback,baseurl=_baseurl WHERE tenant = _tenant AND id = _id RETURNING user_index into userindex;
		ELSE
			UPDATE "public"."task_result" SET last_open_date=_last_open_date, user_index=user_index+1 WHERE tenant = _tenant AND id = _id RETURNING user_index into userindex;
		END IF;
		IF found THEN
			isupdate := 'true';
			RETURN;
		END IF;
		-- not there, so try to insert the key
		-- if someone else inserts the same key concurrently,
		-- we could get a unique-key failure
		BEGIN
			INSERT INTO "public"."task_result"(tenant, id, status, status_info, last_open_date, user_index, change_id, callback, baseurl) VALUES(_tenant, _id, _status, _status_info, _last_open_date, _user_index, _change_id, _callback, _baseurl) RETURNING user_index into userindex;
			isupdate := 'false';
			RETURN;
		EXCEPTION WHEN unique_violation THEN
			-- do nothing, and loop to try the UPDATE again
		END;
	END LOOP;
END;
$$
LANGUAGE plpgsql;
```

## 4.3 Docker-compose 启动集群

### 4.3.1 安装 Docker-compose

```bash
#从Docker官方网站下载Docker Compose最新版本的二进制文件
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/bin/docker-compose

#授予Docker Compose二进制文件执行权限
sudo chmod +x /usr/bin/docker-compose 
```

### 4.3.2 Docker-Compose 配置

以下为文件目录结构
├── .env
├── delete-container.sh
├── docker-compose.yml
└── start.sh
下面是相关文件及配置的一些说明

#### 4.3.2.1 .env

指定 docker-compose 文件中的环境变量

```.env
#指定数据库
DB_TYPE=postgres

#数据库ip
DB_HOST=127.0.0.1

JWT_ENABLED=false

#onlyoffice容器挂载到本地的目录
MAPPING_LOCAL_DIR=/data/onlyoffice
```

#### 4.3.2.2 docker-compose.yml

指定启动 3 个 onlyoffice 实例:onlyoffice-8091、onlyoffice-8092、onlyoffice-8093
```dockerfile
version: '3'
services:
  onlyoffice-8091:
    build:
      context: .
      dockerfile: ../docker-build/Dockerfile
    image: exfoide/onlyoffice:7.3.3
    container_name: onlyoffice-8091
    environment:
      - DB_TYPE
      - DB_HOST
      - DB_PORT=5432
      - DB_NAME=onlyoffice
      - DB_USER=onlyoffice
      # Uncomment strings below to enable the JSON Web Token validation.
      - JWT_ENABLED
      #- JWT_SECRET=secret
      #- JWT_HEADER=Authorization
      #- JWT_IN_BODY=true
    ports:
      - '8091:80'
    stdin_open: true
    restart: always
    stop_grace_period: 60s
    volumes:
      - ${MAPPING_LOCAL_DIR}/DocumentServer/logs:/var/log/onlyoffice
      - ${MAPPING_LOCAL_DIR}/DocumentServer/data:/var/www/onlyoffice/Data
      - ${MAPPING_LOCAL_DIR}/DocumentServer/lib:/var/lib/onlyoffice
      - ${MAPPING_LOCAL_DIR}/DocumentServer/db:/var/lib/postgresql
      - ${MAPPING_LOCAL_DIR}/DocumentServer/cache/files:/var/lib/onlyoffice/documentserver/App_Data/cache/files
      - /usr/share/fonts
    privileged: true

  onlyoffice-8092:
    build:
      context: .
      dockerfile: ../docker-build/Dockerfile
    image: exfoide/onlyoffice:7.3.3
    container_name: onlyoffice-8092
    environment:
      - DB_TYPE
      - DB_HOST
      - DB_PORT=5432
      - DB_NAME=onlyoffice
      - DB_USER=onlyoffice
      # Uncomment strings below to enable the JSON Web Token validation.
      - JWT_ENABLED
      #- JWT_SECRET=secret
      #- JWT_HEADER=Authorization
      #- JWT_IN_BODY=true
    ports:
      - '8092:80'
    stdin_open: true
    restart: always
    stop_grace_period: 60s
    volumes:
      - ${MAPPING_LOCAL_DIR}/DocumentServer/logs:/var/log/onlyoffice
      - ${MAPPING_LOCAL_DIR}/DocumentServer/data:/var/www/onlyoffice/Data
      - ${MAPPING_LOCAL_DIR}/DocumentServer/lib:/var/lib/onlyoffice
      - ${MAPPING_LOCAL_DIR}/DocumentServer/db:/var/lib/postgresql
      - ${MAPPING_LOCAL_DIR}/DocumentServer/cache/files:/var/lib/onlyoffice/documentserver/App_Data/cache/files
      - /usr/share/fonts
    privileged: true

  onlyoffice-8093:
    build:
      context: .
      dockerfile: ../docker-build/Dockerfile
    image: exfoide/onlyoffice:7.3.3
    container_name: onlyoffice-8093
    environment:
      - DB_TYPE
      - DB_HOST
      - DB_PORT=5432
      - DB_NAME=onlyoffice
      - DB_USER=onlyoffice
      # Uncomment strings below to enable the JSON Web Token validation.
      - JWT_ENABLED
      #- JWT_SECRET=secret
      #- JWT_HEADER=Authorization
      #- JWT_IN_BODY=true
    ports:
      - '8093:80'
    stdin_open: true
    restart: always
    stop_grace_period: 60s
    volumes:
      - ${MAPPING_LOCAL_DIR}/DocumentServer/logs:/var/log/onlyoffice
      - ${MAPPING_LOCAL_DIR}/DocumentServer/data:/var/www/onlyoffice/Data
      - ${MAPPING_LOCAL_DIR}/DocumentServer/lib:/var/lib/onlyoffice
      - ${MAPPING_LOCAL_DIR}/DocumentServer/db:/var/lib/postgresql
      - ${MAPPING_LOCAL_DIR}/DocumentServer/cache/files:/var/lib/onlyoffice/documentserver/App_Data/cache/files
      - /usr/share/fonts
    privileged: true
```

#### 4.3.2.3 start.sh
通过 docker-compose 启动集群容器

```bash
#/bin/bash
docker-compose down  --remove-orphans
docker-compose -p onlyoffice -f ./docker-compose.yml up -d
```

#### 4.3.2.4 delete-container.sh

通过 docker-compose 停止并删除集群容器

```bash
#/bin/bash
docker-compose -p onlyoffice down --remove-orphans
```


### 4.3.3 启动集群

执行 start.sh 启动 3 个 OnlyOffice 实例

![image.png](https://cdn.nlark.com/yuque/0/2023/png/22370594/1685002964009-e822b725-6ff3-48fe-b5be-7ad0d179d1c5.png)


## 4.4 部署 ngnix

参照本文目录 1.2 安装 nginx

### 4.4.1 配置负载配置

配置 nginx 负载

```bash
cd /data/nginx/conf.d
touch office.conf
vi office.conf
```

文件内容

```bash
upstream office {
  hash $remote_addr consistent;
  server 127.0.0.1:8091;
  server 127.0.0.1:8092;
  server 127.0.0.1:8093;
}

server {
    listen       80;
    listen  [::]:80;
    server_name  localhost;

    #access_log  /var/log/nginx/host.access.log  main;

    location / {
        proxy_pass http://office;

        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $http_host;
        proxy_set_header X-Nginx-Proxy true;

        # WebSocker配置
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # 显示具体负载的机器的ip,X-Route-Ip随便命名
        add_header X-Route-Ip $upstream_addr;
        add_header X-Route-Status $upstream_status;
    }
}
```

# 5.OnlyOffice 集成 WOPI 协议

官方文档: https://api.onlyoffice.com/zh/editors/wopi/

## 5.1 WOPI 协议集成

通过`**4.OnlyOffice伪集群部署**`我们已经部署了 3 个 OnlyOffice 实例的集群，并且已经开启了 WOPI 协议

![image.png](https://cdn.nlark.com/yuque/0/2023/png/22370594/1685154630255-ef36d531-a51f-4720-aa76-c333643f048d.png?x-oss-process=image%2Fresize%2Cw_1500%2Climit_0)

## 5.2 WOPI 协议交互流程

![img](https://cdn.nlark.com/yuque/0/2023/jpeg/22370594/1684546162673-72f1dd88-b451-4b60-821e-5fb1e6a5f0f1.jpeg)

1. 浏览器请求编辑或查看 Office 文件
2. WOPI Host 服务返回调用 wopi 所需的信息，如http://127.0.0.1/hosting/wopi/cell/edit?WOPISrc=http://127.0.0.1:8099/api/wopi/files/%E4%BA%A7%E5%93%81%E4%B8%AD%E5%BF%83%E5%91%A8%E6%8A%A520230503.xlsx, 其中http://127.0.0.1/hosting/wopi/cell/edit 表示需要通过 wopi 协议对 excel 类文件做编辑操作,

WOPISrc=http://127.0.0.1:8099/api/wopi/files/%E4%BA%A7%E5%93%81%E4%B8%AD%E5%BF%83%E5%91%A8%E6%8A%A520230503.xlsx 表示编辑器中需要展示的文件链接

1. 浏览器请求 OnlyOffice 文档服务对文件进行操作
2. OnlyOffice 文档服务请求 WOPI Host 服务查询文件信息，调用的 WOPI 协议接口为:[CheckFileInfo](https://api.onlyoffice.com/zh/editors/wopi/restapi/checkfileinfo)
3. WOPI Host 返回文件名称、大小、是否能修改、是否支持锁等信息
4. OnlyOffice 文档服务请求 WOPI Host 服务查询文件信息，调用的 WOPI 协议接口为:[GetFile](https://api.onlyoffice.com/zh/editors/wopi/restapi/getfile)
5. WOPI Host 返回二进制格式的完整文件内容
6. OnlyOffice 文档服务将文件内容转换为 Office Open XML 格式, 返回给 js 编辑器, js 编辑器渲染 Office 文档内容
7. 用户在 js 编辑器对文档进行编辑等操作，在编辑过程中会调用一些 WOPI 协议接口，如[Lock](https://api.onlyoffice.com/zh/editors/wopi/restapi/lock), [UnLock](https://api.onlyoffice.com/zh/editors/wopi/restapi/unlock), [RefreshLock](https://api.onlyoffice.com/zh/editors/wopi/restapi/refreshlock)等
8. 用户编辑完成，保存文档
9. OnlyOffice 文档服务请求更新文件内容，调用的 WOPI 协议接口为:[PutFile](https://api.onlyoffice.com/zh/editors/wopi/restapi/putfile)

### 5.2.1 协议核心理解

#### 5.2.1.1 认证阶段

该阶段上面的交互流程图中的 step1、2 步骤，需要 Server 事先提供 Host 页面，用户通过 Browser 请求 Host 页面(用户感知到的只有 Host 页面，而不是 Office 页面)，Server 内部生成两个重要信息：

- 文档唯一 ID：fileId
- 认证信息：access_token、access_token_ttl 然后内部通过调用/hosting/discovery 接口，返回一个可以访问 Office 服务的 urlsrc。具体交互时序图如下：

![img](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/baf9a4bd5745440ab20833f3681d7769~tplv-k3u1fbpfcp-zoom-in-crop-mark:4536:0:0:0.awebp?)

为何 Browser 不能跳过第 1、2 两步，直接进入 Step3 通过 URL 访问 Office 页面，这样 Office 客户端根据 WOPISrc 地址去 Server 执行 file 操作？理论上这样交互是可行，但是这么做相当于 Server 文档对任何外部请求都是可访问的，这对 Server 方是不能接受的，除非 Server 方信任并知道 Client 的地址情况下通过 IP 白名单机制来限制，但这样导致 Server 和 Client 存在耦合关系。

步骤 1、2 就是从 Server 获取文档权限信息，这样保护文件安全。Server 在页面初始化时生成 access_token，access_token 看成是一个认证凭证，代表用户是否有权访问文档：

- 生成好的 access_token 返回给 Browser，也就是上图 step2 返回内容之一
- 然后接下来 Browser 向 Client 发出的请求带上 access_token，即 step3 发出的请求
- Client 收到后在后续和 Server 交互时，会原样在请求 URL 参数里带上 access_token，这样 Server 会先校验请求携带的 access_token 是否合法，如果是说明 Office 有权限打开文档

这个过程可以总结为 Client 和 Server 通过 Browser 这个中介来传递 access_token。当然 access_token 值并不是一直有效，WOPI 协议规定 Server 设置 access_token_ttl，用来通知 Client 关于 access_token 值的有效期，默认是 10h，超过这个时间后 Client 会取消本次会话。

注意：step3 中 access_token 是怎么传递给 Server？如果开始时直接在 URL 参数里携带，URL 在公网传输，就有提前泄漏 access_token 的风险，也就是说 Browser 不能主动在 URL 里写入 access_token，但是 Client 是可以的，因为 access_token 有效性是由 Server 决定，Client 只管在请求里原样返回并由 Server 校验。所以 WOPI 协议的 demo 建议 step3 通过 POST 方法访问 Office 平台，access_token 通过表单提交，这样在 https 传输协议下 access_token 传输至少是安全的。

#### 5.2.1.2 文档打开和编辑保存

从文档生命周期来看，文档操作包括打开、查看/编辑和保存流程。

查看和编辑是 Office 平台能力，打开文档请求 Server 获取文档内容，编辑文档后关闭页面，通知 Server 保存文档最新内容。WOPI 协议定义了文件操作接口，其中 CheckFileInfo、GetFile、PutFile 接口实现上述打开和保存文件功能， GetFile、PutFile 比较好理解，CheckFileInfo 接口功能比较复杂，但是它决定 Client 端对文档的 UI 展示行为和后续允许的操作，这是由 Server 端提供属性信息决定，该接口返回包括：

- 文件基本信息：比如大小、文件展示名字等，
- 用户权限属性，常见属性包括：

- - UserCanWrite：指示当前请求用户是否有权限更改文件，这决定 Client 后续是否允许调用 PutFile 接口
- ReadOnly：文档是否只读
- UserCanRename：文档是否允许重命名，为 false 时 Client 在 UI 展示时不会提供重命名按钮

- 指示 Client，Server 支持哪些功能属性（capabilities properties），列举几个常见属性

- - SupportsGetLock：为 true 说明 Server 支持 GetLock 操作
- SupportsLocks：为 true 说明 Server 端支持 Lock、Unlock 等操作，Lock 相关语义方面会提到
- SupportsRename：为 true 说明 Server 端支持对文档重命名操作
- SupportsUpdate：为 true，说明 Server 支持更新文档操作 Server 通知 Client 后，Client 就可以在 Server 提供的属性决定后续操作是否允许调用，比如假设 Server 端通过 checkFileInfo 接口设置 SupportsUpdate 为 false，那 Client 端知道 Server 不支持提供 PutFile 接口来更新文档，当文档关闭后 Client 不会把文档更新内容通知 Server 保存。

这些权限属性和 access_token 有什么关系？事实上，access_token 充当对任何请求来源的认证机制，只有匹配 Server 端生成的值才是合法的，如果 Server 校验 access_token 不合法时，Client 发出的任何操作请求被拒绝；而上述权限属性是在请求被认证通过的基础上，用来限制用户在 Client 端的操作能力。

#### 5.2.1.3 锁机制

如果用户有权限编辑文档内容，Server 就要关心是否支持对文档的加解锁操作。锁的作用就像一把进入文档编辑的钥匙，只有拿到钥匙的合法用户才能编辑文档。锁机制判断文档是否允许多个用户同时编辑。

锁信息用锁 id（lockId）标识，lockId 的生命周期由 Client 负责控制，Server 存储指定文档的 lockId，在 Client 获取文档内容之前开始加锁，调用文档保存接口后解锁：

- 加锁操作时 Client 向 Server 发出 lock 请求，lockId 放在请求头的 X-WOPI-Lock 字段中，Server 获取该字段值后，判断文档是否被加锁或者校验请求 lockId 和已有是否匹配，匹配才能允许 Client 获取文档内容。
- 解锁操作时 Client 向 Server 发出 unlock 请求，同样 Server 检查 lockId 是否匹配，匹配成功才能释放锁

为何 lockId 还需要 Server 来存储，Server 没必要感知到锁的存在？上面提到 Server 通过 SupportsLocks 属性通知 Client 是否支持对文档加解锁，Server 虽然不负责 lockId 的生成，但是具体加解锁判断成功与否的策略由 Server 控制，举个例子，如果两个用户 A、B 操作同一个文档，A 先加锁拿到 lockID，B 后续通过 unlock 请求解锁表示要提前保存文档，并且解锁请求头携带的 lockId 和 A 相同，这种情况下 Client 无法判断是否允许这样操作，Client 生成的 lockId 和具体用户没有任何关联，只有 Server 有权决定不同用户拿到相同 lockId 时操作是否允许。

### 5.2.2 组成部分

按照 WOPI 协议交互流程图所示，整个 onlyoffice 集成过程中有 3 个角色，分别是:

- Web Office 编辑器: 通过 js 实现 office 编辑器，需要在浏览器中展现
- WOPI 服务器(Host): 实现[WOIPI REST API](https://api.onlyoffice.com/zh/editors/wopi/restapi)的文件管理系统
- WOPI 客户端(Client): 理解为提供 Office 查看和编辑能力的平台，比如前面安装的 Onlyoffice

#### 5.2.2.1 Web Office 编辑器集成

Web Office 编辑器需要一个前端页面来承载，传送门[主机页面](https://api.onlyoffice.com/zh/editors/wopi/hostpage)

其中 actionUrl、token、tokenTtl 需要传入，actionUrl 指定需要 Office 编辑器执行的操作

举例如下:

`http:{documentserverIP}/hosting/wopi/:documentType/:mode?WOPISrc=http://serverHost/wopi/files/:fileId`：根据指定文档 fileId，返回用户可以查看或者编辑文档的 HTML 内容，渲染器最终渲染该页面，域名和路径就是/hosting/discovery 接口返回的 urlsrc，其中

- documentserverIP 表示部署 only office/documentserver 服务的地址
- documentType 表示文档类型，包括 xlsx、docx 等
- mode 表示查看或者编辑模式，包括 show、edit。上图中 step3 通过该接口访问 Office Client 服务
- WOPISrc：协议约定的一个 URL，需要 Server 提供，Browser 根据该信息通知 Client 可以对 Office 文档执行 WOPI 规定的文档操作

#### 5.2.2.2 WOPI 服务器(Host)

实现了[WOPI Rest Api](https://api.onlyoffice.com/zh/editors/wopi/restapi)的后端应用，需要实现对文件的查看、下载、锁定等 api 接口。

#### 5.2.2.3 WOPI 客户端(Client)

理解为提供 Office 查看和编辑能力的平台，比如前面安装的 onlyoffice/documentserver 等，之前的步骤中已经安装好了 onlyoffice/documentserver，并且开启了 wopi 协议，Client 的所有配置及开发工作已经完成，后续操作中需要确保 onlyoffice/documentserver 保持运行
