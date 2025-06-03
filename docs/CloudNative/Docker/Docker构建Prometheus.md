---
title: Docker 构建 Prometheus
description: "Docker 构建 Prometheus"
slug: "/cloud-native/docker/build-prometheus"
hide_table_of_contents: false
keywords: ["Docker"]
tags: ["Docker", "CloudNative"]
date: 2017-08-01
categories: ["Docker"]
---

# 安装 Prometheus

# 1. Prometheus 介绍

## 1.1 简介

普罗米修斯是一个开源系统，Prometheus 收集其指标并将其存储为时间序列数据，即指标信息与记录它的时间戳一起存储，以及称为标签的可选键值对

## 1.2 什么是指标
通俗地说，指标是数字度量，时间序列意味着随时间记录更改，用户想要测量的内容因应用程序而异。对于 Web 服务器，它可能是请求时间，对于数据库，它可能是活动连接数或活动查询数等。

指标在理解应用程序以某种方式工作的原因方面起着重要作用。假设您正在运行一个 Web 应用程序，发现该应用程序很慢，您将需要一些信息来了解您的应用程序发生了什么。例如，当请求数很高时，应用程序可能会变慢。如果您有请求计数指标，则可以找出原因并增加处理负载的服务器数量。

## 1.3 组件概述
### 1.3.1 Prometheus Server

收集和存储时间序列数据，Prometheus Server 是 Prometheus 组件中的核心部分，负责实现对监控数据的获取，存储以及查询。 Prometheus Server 可以通过静态配置管理监控目标，也可以配合使用 Service Discovery 的方式动态管理监控目标，并从这些监控目标中获取数据。其次 Prometheus Server 需要对采集到的监控数据进行存储，Prometheus Server 本身就是一个时序数据库，将采集到的监控数据按照时间序列的方式存储在本地磁盘当中。最后 Prometheus Server 对外提供了自定义的 PromQL 语言，实现对数据的查询以及

### 1.3.2 Node-Exporter

用于暴露已有的第三方服务的 metrics 给 Prometheus。Exporter 将监控数据采集的端点通过 HTTP 服务的形式暴露给 Prometheus Server，Prometheus Server 通过访问该 Exporter 提供的 Endpoint 端点，即可获取到需要采集的监控数据。

### 1.3.3 Grafana

第三方展示工具，可以编写 PromQL 查询语句，通过 http 协议与 prometheus 集成

### 1.3.4 AlertManager

从 Prometheus Server 端接收到 alerts 后，会进行去除重复数据，分组，并路由到对方的接受方式，发出报警。常见的接收方式有：电子邮件，钉钉、企业微信，pagerduty 等

### 1.3.5 Push Gateway

主要用于短期的 jobs。由于这类 jobs 存在时间较短，可能在 Prometheus 来 pull 之前就消失了。为此，这些 jobs 可以直接向 Prometheus server 端推送它们的 metrics。

## 1.4 Prometheus 工作流程

### 1.4.1 指标采集

prometheus server 通过 pull 形式采集监控指标，可以直接拉取监控指标，也可以通过 pushgateway 做中间环节，监控目标先 push 形式上报数据到 pushgateway；

### 1.4.2 指标处理

prometheus server 将采集的数据存储在自身 db 或者第三方 db；

### 1.4.3 指标展示

prometheus server 通过提供 http 接口，提供自带或者第三方展示系统；

### 1.4.4 指标告警

prometheus server 通过 push 告警信息到 alert-manager，alert-manager 通过"静默-抑制-整合-下发"4 个阶段处理通知到观察者

## 1.5 Prometheus 指标分类
### 1.5.1 Counter

计数器类型，只增不减，如机器的启动时间，HTTP 访问量等。机器重启不会置零，在使用这种指标类型时，通常会结合 rate()方法获取该指标在某个时间段的变化率。

### 1.5.2 Gauge

仪表盘，可增可减，如 CPU 使用率，大部分监控数据都是这种类型的。

### 1.5.3 Summary

客户端定义，Summary，Histogram 都属于高级指标，用于凸显数据的分布情况。

# 2. 安装 prometheus

### 2.1 获取镜像

```bash
docker search prom/prometheus
docker pull prom/prometheus
```

### 2.2 创建持久化路径

```bash
mkdir -p /data/docker/prometheus/{config,data,rules}
chmod -R 777 /data/docker/prometheus
```

### 2.3 写主配置文件

```bash
cd /data/docker/prometheus/config
touch prometheus.yml
vi prometheus.yml

```

```yaml
# my global config
global:
  # 设置抓取数据的时间间隔，间隔设置为每15秒一次。默认为每1分钟。
  scrape_interval: 15s
  # 设定抓取数据的超时时间，默认为10s
  scrape_timeout: 15s
  # 设置规则刷新，每15秒刷新一次规则。默认值为每1分钟。
  evaluation_interval: 60s

# 监控报警配置（需要额外安装 alertmanager组件）
alerting:
  alertmanagers:
  - static_configs:
    # 设定alertmanager和prometheus交互的接口，即alertmanager监听的ip地址和端口
    - targets: ["localhost:9093"]

# 报警规则文件
rule_files:
  - '/data/docker/prometheus/rules/*.yml'

# 普罗米修斯与抓取模块交互的接口配置
scrape_configs:
	- job_name: 'prometheus'
    static_configs:
    - targets: ["prometheus的本机真实ip:9090"]
      labels:
          instance: prometheus
 
  - job_name: 'node-exporter'
    static_configs:
    - targets: ["node节点的真实ip:9100","node节点的真实ip:9100","node节点的真实ip:9100"]
  
  - job_name: 'alertmanager'
    static_configs:
    - targets: ["alertmanager的本机真实ip:9093"]
```

### 2.4 创建 rule 告警阈值

```bash
cd /data/docker/prometheus/rules
touch rule.yml
vi rule.yml
```



```bash
groups:
- name: Hosts.rules
  rules:
  - alert: HostDown           
    expr: up{job=~"node-exporter|prometheus|grafana|alertmanager"} == 0
    for: 0m
    labels:
      severity: ERROR
    annotations:
      title: 'Instance down'
      summary: "{{$labels.instance}}"
      description: "主机: 【{{ $labels.instance }}】has been down for more than 1 minute"
## 注意==0为报警条件，当有服务宕机测会告警，如果测试需改为1
注：- alert: HostDown这个数据本机基本数据类，如果要监控其他的可以设置例外的名字
```

### 2.5 运行容器

将对应的 rules 文件上传到 /data/docker/prometheus/rules 下

```bash
docker run -d \
           -u root \
           --restart=always \
           --name prometheus \
           -p 9090:9090 \
           -v /etc/localtime:/etc/localtime \
           -v /data/docker/prometheus/config:/prometheus/config \
           -v /data/docker/prometheus/data:/prometheus/data \
           -v /data/docker/prometheus/rules:/prometheus/rules \
           prom/prometheus \
           --storage.tsdb.retention.time=100d \
           --web.enable-lifecycle \
           --config.file=/prometheus/config/prometheus.yml
```

> --restart=always          还可以设置自动重启容器
>
> -d  --detach=false        指定容器运行于前台还是后台，默认为 false
>
> --net                              网络模式，host 网络互通模式
>
> --web.enable-lifecycle  热更新
>
> -v 给容器挂载存储卷，挂载到容器的某个目录(宿主机目录:/docker 目录)，注意本地需要要该文件



### 2.6 查看主服务部署状况

http://localhost:9090



# 3. 安装 node-exporter

负责收集 host 硬件和操作系统数据，将以容器方式运行在所有 host 上

### 3.1 获取镜像

```bash
docker search node-exporter
docker pull prom/node-exporter
```

### 3.2 启动容器

```bash
docker run -d \
           -p 9100:9100 \
           --name node-exporter \
           --restart=always \
           -v "/proc:/host/proc:ro" \
           -v "/sys:/host/sys:ro" \
           -v "/:/rootfs:ro" \
           prom/node-exporter
```

选项说明:

>-d, --detach=false         指定容器运行于前台还是后台[默认为 false]
>
>--net="host"                  容器网络设置:
>
>  bridge                          使用 docker daemon 指定的网桥
>
>  host                              容器使用主机的网络
>
>  container:NAME_or_ID >   使用其他容器的网路, 共享 IP 和 PORT 等网络资源
>
>  none                             容器使用自己的网络(类似--net=bridge), 但是不进行配置
>
>--cap-add=[]                   添加权限, 权限清单如下, SYS_TIME:设置实时时间
>
>--pid="host"                   将 PID 模式设置为主机 PID 模式。这将打开之间的共享 容器和主机操作系统的 PID 地址空间。 
>
>​                                         使用此标志启动的容器可以访问和操作其他 裸机计算机命名空间中的容器,反之亦然。
>
>-v                                     给容器挂载存储卷,挂载到容器的某个目录(/宿主机目录:/docker 目录)
>
>-e, --env=[]                     指定环境变量, 容器中可以使用该环境变量, 设置容器, HOST=ip, PORTO=端口
>
>/start                              启动之后要执行的命令(可以是 shell 也可以是脚本), 如带/bin/bash 则是解释器
>
>​                                        (注:脚本启动失败则容器启动失败)
>
>--restart=always           还可以设置自动重启容器

### 3.3 查看

http://localhost:9100/



# 4. 安装 alertmanager

### 4.1 获取镜像

```bash
docker search alertmanager
docker pull prom/alertmanager
```

### 4.2 创建持久化目录

```bash
mkdir -p /data/docker/prometheus/alertmanager/{config,template}
chmod -R 777 /data/docker/prometheus/alertmanager
```

### 4.3 告警邮件配置

```bash
cd /data/docker/prometheus/alertmanager/config
touch vi alertmanager.yml
vi alertmanager.yml
```



```bash
global:
  resolve_timeout: 5m 
  smtp_smarthost: 'smtp.qq.com:465'
  smtp_from: 'xx@qq.com'
  smtp_auth_username: 'xx@qq.com'  
  # qq邮箱授权码
  smtp_auth_password: 'xxxx'  
  smtp_require_tls: false
  smtp_hello: 'qq.com'

templates:
  # 指定预警内容模板
  - '/etc/alertmanager/template/*.tmpl'
  
route:
  group_by: ['alertname']
  group_wait: 5s
  group_interval: 5s
  repeat_interval: 5m
  receiver: 'email'
  
receivers:
  - name: 'email'
    email_configs:
    - to: 'xx@126.com'
      html: '{{ template "email.html" . }}'
      headers: { Subject: "[WARN]告警" }
      send_resolved: true
```

>
>
>全局配置(global):        用于定义一些全局的公共参数，如全局的 SMTP 配置，Slack 配置等内容；
>
>模板(templates):         用于定义告警通知时的模板，如 HTML 模板，邮件模板等；
>
>告警路由(route):         根据标签匹配，确定当前告警应该如何处理；
>
>接收人(receivers):      接收人是一个抽象的概念，它可以是一个邮箱也可以是微信，Slack 或者 Webhook 等，
>
>​                                     接收人一般配合告警路由使用；
>
>抑制规则(inhibit_rules): 合理设置抑制规则可以减少垃圾告警的产生
>
>

### 4.4 准备预警内容模板文件

```bash
cd /data/docker/prometheus/alertmanager/template
touch email.tmpl
vi email.tmpl
```



```bash
{{ define "email.html" }}             # 告警标题在alertmagar引用
{{- if gt (len .Alerts.Firing) 0 -}}     # 告警有两种状态（Firing和Resolved）
{{- range $index, $alert := .Alerts -}}  # 格式书写

========= <span style=color:red;font-size:36px;font-weight:bold;> 监控告警 </span>=========<br>
告警程序:  Alertmanager <br>
告警类型:  {{ $alert.Labels.alertname }} <br>
告警级别:  {{ $alert.Labels.severity }} 级 <br>
告警状态:  {{ .Status }} <br>
故障主机:  {{ $alert.Labels.instance }} {{ $alert.Labels.device }} <br>
告警主题:  {{ .Annotations.summary }} <br>
告警详情:  {{ $alert.Annotations.message }}{{ $alert.Annotations.description}} <br>
主机标签:  {{ range .Labels.SortedPairs  }} <br> [{{ .Name }}: {{ .Value  | html }} ]{{ end }}<br>
故障时间:  {{ ($alert.StartsAt.Add 28800e9).Format "2006-01-02 15:04:05" }}<br>

{{- end }}
{{- end }}
========== end =  =========
{{- if gt (len .Alerts.Resolved) 0 -}}
{{- range $index, $alert := .Alerts -}}
========= <span style=color:#00FF00;font-size:24px;font-weight:bold;> 告警恢复 </span>=========<br>
告警程序: Alertmanager <br>
告警类型: {{ $alert.Labels.alertname }} <br>
告警级别: {{ $alert.Labels.severity }} 级 <br>
告警状态: {{ .Status }} <br>
故障主机: {{ $alert.Labels.instance }} {{ $alert.Labels.device }} <br>
告警主题: {{ .Annotations.summary }} <br>
告警详情: {{ $alert.Annotations.message }}{{ $alert.Annotations.description}} <br>
主机标签: {{ range .Labels.SortedPairs  }} <br> [{{ .Name }}: {{ .Value  | html }} ]{{ end }}<br>
故障时间: {{ ($alert.StartsAt.Add 28800e9).Format "2006-01-02 15:04:05" }}<br>
{{- end }}
{{- end }}
========== end =  =========
{{- end }}


{{ define "email.html" }}
<table border="1">
    <tr>
        <td>报警项</td>
        <td>实例</td>
        <td>报警阀值</td>
        <td>开始时间</td>
        <td>告警信息</td>
    </tr>
    {{ range $i, $alert := .Alerts }}
        <tr>
            <td>{{ index $alert.Labels "alertname" }}</td>
            <td>{{ index $alert.Labels "instance" }}</td>
            <td>{{ index $alert.Annotations "value" }}</td>
            <td>{{ $alert.StartsAt }}</td>
            <td>{{ index $alert.Annotations "description" }}</td>
        </tr>
    {{ end }}
</table>
{{ end }}
```

### 4.5 启动容器

```bash
docker run -d --name=alertmanager \
    -p 9093:9093 \
    --restart=always \
    -v /etc/localtime:/etc/localtime:ro \
    -v /data/docker/prometheus/alertmanager/config/alertmanager.yml:/alertmanager/config/alertmanager.yml \
    -v /data/docker/prometheus/alertmanager/template:/alertmanager/template \
    prom/alertmanager
```

### 4.6 查看并等待告警

http://localhost:9093



# 5. 安装 grafana

### 5.1 获取镜像

```bash
docker search grafana
docker pull grafana/grafana
```



### 5.2 创建持久化目录

```bash
mkdir -p /data/docker/prometheus/grafana/{data,plugins,config}
chmod 777 -R /data/docker/prometheus/grafana
```

### 5.3 启动容器

```bash
# 先临时启动一个容器
docker run --name grafana-tmp -d -p 3000:3000 grafana/grafana
# 将容器中默认的配置文件拷贝到宿主机上
docker cp grafana-tmp:/etc/grafana/grafana.ini /data/docker/prometheus/grafana/config/grafana.ini
# 移除临时容器
docker stop grafana-tmp
docker rm grafana-tmp

docker run -d \
           -p 3000:3000 \
           --name=grafana \
           --restart=always \
           -v /etc/localtime:/etc/localtime:ro \
           -v /data/docker/prometheus/grafana/data:/var/lib/grafana \
           -v /data/docker/prometheus/grafana/plugins/:/var/lib/grafana/plugins \
           -v /data/prometheus/grafana/config/grafana.ini:/etc/grafana/grafana.ini \
           -e "GF_SECURITY_ADMIN_PASSWORD=admin" \
           -e "GF_INSTALL_PLUGINS=grafana-clock-panel,grafana-simple-json-datasource,grafana-piechart-panel" \
           grafana/grafana
```

访问`{ip}:3000`即可，使用账密 admin/admin 进行登录即可



# 6.docker-compose 启动 prometheus

目录结构:

```bash
├── .env
├── delete-container.sh
├── docker-compose.yml
└── start.sh
```

## 6.1 .env

```properties
prometheus_local_dir=/data/docker/prometheus
alertmanager_local_dir=/data/docker/prometheus/alertmanager
grafana_local_dir=/data/docker/prometheus/grafana
```



## 6.2 docker-compose.yml

```yaml
version: '3'
services:
  # 添加 普罗米修斯服务
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    hostname: prometheus
    restart: always
    user: root
    ports:
      - '9090:9090'
    volumes:
      - /etc/localtime:/etc/localtime
      - ${prometheus_local_dir}/config:/prometheus/config
      - ${prometheus_local_dir}/data/docker:/prometheus/data
      - ${prometheus_local_dir}/rules:/prometheus/rules
    # 指定容器中的配置文件
    command:
      # 支持热更新
      - '--web.enable-lifecycle'
      # 保留100天的数据
      - '--storage.tsdb.retention.time=100d'
      - '--storage.tsdb.path=/prometheus'
      - '--config.file=/prometheus/config/prometheus.yml'

  node-exporter:
    image: prom/node-exporter:latest
    container_name: node-exporter
    hostname: node-exporter
    restart: always
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro



  # 添加告警模块
  alertmanager:
    image: prom/alertmanager:latest
    container_name: alertmanager
    hostname: alertmanager
    restart: always
    ports:
      - '9093:9093'
    volumes:
      - /etc/localtime:/etc/localtime:ro
      - ${alertmanager_local_dir}/config/alertmanager.yml:/alertmanager/config/alertmanager.yml
      - ${alertmanager_local_dir}/template:/alertmanager/template
    command:
      - '--config.file=/alertmanager/config/alertmanager.yml'

  # 添加监控可视化面板
  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    hostname: grafana
    restart: always
    user: root
    ports:
      - '3000:3000'
    volumes:
      - /etc/localtime:/etc/localtime:ro
      - ${grafana_local_dir}/data/docker:/var/lib/grafana
      - ${grafana_local_dir}/plugins/:/var/lib/grafana/plugins
      - ${grafana_local_dir}/config/grafana.ini:/etc/grafana/grafana.ini
    environment:
      - '-GF_SECURITY_ADMIN_PASSWORD=admin'
      - "-GF_INSTALL_PLUGINS=grafana-clock-panel,grafana-simple-json-datasource,grafana-piechart-panel"


  cadvisor:
    image: gcr.io/cadvisor/cadvisor:latest
    container_name: cadvisor
    hostname: cadvisor
    restart: always
    ports:
      - "9200:8080"
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro

```



## 6.3 start.sh

```bash
#/bin/bash
docker-compose -p prometheus down  --remove-orphans
docker-compose -p prometheus -f ./docker-compose.yml up -d
```



## 6.4 delete-container.sh

```bash
#/bin/bash
docker-compose -p prometheus down --remove-orphans
```



# 7. 监控 Oracle

## 7.1 软件包

oracle-instantclient12.2-basic-12.2.0.1.0-1.x86_64.rpm 

下载地址: https://www.oracle.com/database/technologies/instant-client/linux-x86-64-downloads.html



oracledb_exporter.tar.gz: 二进制文件

https://github.com/iamseth/oracledb_exporter/releases/download/0.5.0/oracledb_exporter.tar.gz



oracledb_exporter-0.5.0.tar.gz: 源代码文件包含配置

https://github.com/iamseth/oracledb_exporter/archive/refs/tags/0.5.0.tar.gz



说明:

oracledb_exporterer 连接 oracle 数据库，需依赖 oracle client，因此也要提前下载好 oracle client。

## 7.2 安装 oracle-instantclient

```bash
rpm -ivh oracle-instantclient12.2-basic-12.2.0.1.0-1.x86_64.rpm 
```

安装的文件默认放在两个位置：
包文件：`/usr/lib/oracle/12.2/client64` 下，包含\{bin、lib\}两个文件夹.

### 7.2.1 创建 tnsname

```bash
mkdir /usr/lib/oracle/12.2/client64/network/admin -p
cd /usr/lib/oracle/12.2/client64/network/admin
touch tnsnames.ora
vi tnsnames.ora
```

内容为

```bash
{SID} =
   (DESCRIPTION =
       (ADDRESS = (PROTOCOL = TCP)(HOST = {ip})(PORT = 1521))
       (CONNECT_DATA =
          (SERVER = DEDICATED)
          (SERVICE_NAME = {sid})
       )
   )
EOF
```

### 7.2.2 配置 oracle 客户端环境变量

```bash
cd /etc/profile.d
touch oracledb_exporter.sh
vi oracledb_exporter.sh
```

内容为:

```bash
export TNS_ADMIN=/usr/lib/oracle/12.2/client64/network/admin
export DATA_SOURCE_NAME=oracle://system:{password}@{ip}:1521/{sid}
export LD_LIBRARY_PATH=/usr/lib/oracle/12.2/client64/lib
export PATH=/usr/lib/oracle/12.2/client64/bin:$PATH
```

使配置完的环境变量生效 `source /etc/profile.d/oracledb_exporter.sh`



## 7.3 安装 oracledb_exporter

### 7.3.1 解压 oracledb_exporter 执行文件

```bash
tar -zxvf oracledb_exporter.tar.gz -C /opt
```

解压后文件目录:
└── oracledb_exporter



### 7.3.2 解压 oracledb_exporter 源文件

```bash
tar -zxvf oracledb_exporter-0.5.0.tar.gz

```
文件目录:

├── Dockerfile
├── LICENSE
├── Makefile
├── README.md
├── alpine
├── collector
├── custom-metrics-example
├── default-asm-metrics.toml
├── default-metrics.legacy-tablespace.toml
├── default-metrics.toml
├── go.mod
├── go.sum
├── main.go
├── metric-dual-example.toml
├── metric-histogram-example.toml
├── multi-metric-dual-example-labels.toml
├── operating-principles.md
├── oraclelinux
├── systemd-example
└── tests



复制默认指标文件

```bash
cp oracledb_exporter-0.5.0/default-metrics.toml /opt/oracledb_exporter-0.5.0.linux-amd64/
```



### 7.3.3 创建启动脚本

```bash
cd /opt/oracledb_exporter-0.5.0.linux-amd64/
vi start.sh
```

内容为:

```bash
#!/bin/bash
nohup ./oracledb_exporter --log.level warn --web.listen-address=0.0.0.0:9161 --default.metrics ./default-metrics.toml > ./output.log &
```



### 7.3.4 启动 oracledb_exporter

```bash
sh ./start.sh
```



### 7.3.5 确认启动是否成功

浏览器打开 `http://{ip}:9161/metrics`

截取部分内容

```bash
go_threads 20
# HELP oracledb_activity_execute_count Generic counter metric from v$sysstat view in Oracle.
# TYPE oracledb_activity_execute_count gauge
oracledb_activity_execute_count 8.891983314e+09
# HELP oracledb_activity_parse_count_total Generic counter metric from v$sysstat view in Oracle.
# TYPE oracledb_activity_parse_count_total gauge
oracledb_activity_parse_count_total 3.553429672e+09
# HELP oracledb_activity_user_commits Generic counter metric from v$sysstat view in Oracle.
# TYPE oracledb_activity_user_commits gauge
oracledb_activity_user_commits 3.0688661e+07
# HELP oracledb_activity_user_rollbacks Generic counter metric from v$sysstat view in Oracle.
# TYPE oracledb_activity_user_rollbacks gauge
oracledb_activity_user_rollbacks 154234
# HELP oracledb_exporter_build_info A metric with a constant '1' value labeled by version, revision, branch, goversion from which oracledb_exporter was built, and the goos and goarch for the build.
# TYPE oracledb_exporter_build_info gauge
oracledb_exporter_build_info{branch="",goarch="amd64",goos="linux",goversion="go1.19.4",revision="c951abb83a79c37a608f809378333895244f5ba5",tags="unknown",version=""} 1
# HELP oracledb_exporter_last_scrape_duration_seconds Duration of the last scrape of metrics from Oracle DB.
# TYPE oracledb_exporter_last_scrape_duration_seconds gauge
oracledb_exporter_last_scrape_duration_seconds 0.388182934
# HELP oracledb_exporter_last_scrape_error Whether the last scrape of metrics from Oracle DB resulted in an error (1 for error, 0 for success).
# TYPE oracledb_exporter_last_scrape_error gauge
oracledb_exporter_last_scrape_error 0
```

至此 oracledb_exporter 安装成功



## 7.4 Prometheus 集成 oracledb_exporter

### 7.4.1 配置监听

配置 prometheus

```bash
vi /data/docker/prometheus/config/prometheus.yml
```

新增:

```bash
- job_name: 'oracle'
    static_configs:
      - targets: ['{数据库主机ip}:9161']
```



### 7.4.2 配置告警规则

```bash
cd /data/docker/prometheus/rules
touch oracle.yml
vi oracle.yml
```

内容为:

```yaml
groups:
- name: Oracle.rules
  rules:
  - alert: TableSpaceWarning           
    expr: oracledb_tablespace_used_percent{tablespace=~".+",type="PERMANENT"} > 80
    for: 30s
    labels:
      severity: WARNING
    annotations:
      title: '数据库表空间预警'
      description: "主机: [{{$labels.instance}}] 表空间 [{{$labels.tablespace}}] 使用率超过80%, 当前: {{ $value }}%"

```

# 8. 告警

## 8.1 邮件告警

邮件告警前面已经设置好了，参照 安装 alertmanager



## 8.2 钉钉告警

### 8.2.1 添加钉钉告警机器人

![image.png](https://cdn.nlark.com/yuque/0/2023/png/22370594/1685435921767-4a51e17d-0fc4-43b1-924c-84817201aab2.png?x-oss-process=image%2Fresize%2Cw_1500%2Climit_0)


![自定义机器人.png](https://img-blog.csdnimg.cn/0910373b6dca47b0af66591af6be68ac.png)


![添加机器人.png](https://img-blog.csdnimg.cn/78d4afda5e434167a03f651f32c49360.png)


![创建完成.png](https://img-blog.csdnimg.cn/7be5b07ad2e447158895a97cdf863c66.png)

Sign:  `SEC4a95e85cb40e3a5155639963bf105ef94407cdd706c6d1ba5c3227c63f88ce6f`

Webhook: `https://oapi.dingtalk.com/robot/send?access_token=1141e53e8263b3cdec4a89a285c81fec2de129b8ae9769df5980a455b591c575`



### 8.2.2 安装插件

#### 8.2.2.1 下载插件
https://github.com/timonwong/prometheus-webhook-dingtalk/releases/
wget https://github.com/timonwong/prometheus-webhook-dingtalk/releases/download/v2.1.0/prometheus-webhook-dingtalk-2.1.0.linux-amd64.tar.gz

#### 8.2.2.2 安装
tar -xvf prometheus-webhook-dingtalk-2.1.0.linux-amd64.tar.gz -C /usr/local
cd /usr/local
mv prometheus-webhook-dingtalk-2.1.0.linux-amd64 prometheus-webhook-dingtalk



```bash
cd prometheus-webhook-dingtalk
mv config.example.yml config.yml

mkdir templates
mv contrib/templates/legacy/template.tmpl templates/

#删除多余文件
rm -rf contrib
```

#### 8.2.2.3 修改钉钉告警插件配置文件

```bash
vi config.yml
```

内容为

```yaml
timeout: 5s
templates:
  - templates/template.tmpl

targets:
  webhook1:
    url: https://oapi.dingtalk.com/robot/send?access_token=1141e53e8263b3cdec4a89a285c81fec2de129b8ae9769df5980a455b591c575
    secret: SEC4a95e85cb40e3a5155639963bf105ef94407cdd706c6d1ba5c3227c63f88ce6f

```

url 和 secret 为创建钉钉机器人过程中记录下来的值

#### 8.2.2.4 修改钉钉告警模板

```bash
vi /templates/template.tmpl
```

内容为

```bash
{{ define "__subject" }}
[{{ .Status | toUpper }}{{ if eq .Status "firing" }}:{{ .Alerts.Firing | len }}{{ end }}]
{{ end }}
 
 
{{ define "__alert_list" }}{{ range . }}
---
{{ if .Labels.owner }}@{{ .Labels.owner }}{{ end }}
告警程序:  Alertmanager

告警名称: {{ .Labels.alertname }} 

告警级别: {{ .Labels.severity }}

告警状态: {{ .Status }}

告警主机: {{ .Labels.instance }} 

告警主题: {{ .Annotations.title }}

告警信息: {{ .Annotations.description}}

告警时间: {{ dateInZone "2006.01.02 15:04:05" (.StartsAt) "Asia/Shanghai" }}

{{ end }}{{ end }}

 
{{ define "__resolved_list" }}{{ range . }}
---
{{ if .Labels.owner }}@{{ .Labels.owner }}{{ end }}
告警程序:  Alertmanager

告警名称: {{ .Labels.alertname }} 

告警级别: {{ .Labels.severity }}

告警状态: {{ .Status }}

告警主机: {{ .Labels.instance }} 

告警主题: {{ .Annotations.title }}

告警信息: {{ .Annotations.description}}

告警时间: {{ dateInZone "2006.01.02 15:04:05" (.StartsAt) "Asia/Shanghai" }}

{{ end }}{{ end }}
 
 
{{ define "default.title" }}
{{ template "__subject" . }}
{{ end }}
 
{{ define "default.content" }}
{{ if gt (len .Alerts.Firing) 0 }}
**====侦测到{{ .Alerts.Firing | len  }}个故障====**
{{ template "__alert_list" .Alerts.Firing }}
---
{{ end }}
 
{{ if gt (len .Alerts.Resolved) 0 }}
**====恢复{{ .Alerts.Resolved | len  }}个故障====**
{{ template "__resolved_list" .Alerts.Resolved }}
{{ end }}
{{ end }}
 
 
{{ define "ding.link.title" }}{{ template "default.title" . }}{{ end }}
{{ define "ding.link.content" }}{{ template "default.content" . }}{{ end }}
{{ template "default.title" . }}
{{ template "default.content" . }}

```



#### 8.2.2.5 启动告警插件

```bash
./prometheus-webhook-dingtalk --config.file=config.yml 
```



#### 8.2.2.6 修改 alertManager 告警

```bash
vi /data/docker/prometheus/alertmanager/config/alertmanager.yml
```

route 部分

```yaml
route:
  group_by: ['alertname']
  group_wait: 30s
  group_interval: 30s
  repeat_interval: 30s
  receiver: dingtalk-webhook
  routes:
    - receiver: dingtalk-webhook
      group_wait: 10s

    - receiver: email
      group_wait: 10s
```

receivers 部分:

```bash
receivers:
  - name: 'email'
    email_configs:
    - to: 'exfoide@126.com'
      send_resolved: true
      html: '{{ template "email.html" . }}'
      headers: { Subject: "[WARN]告警" }
  
  - name: 'dingtalk-webhook' 
    webhook_configs:
    - url: 'http://{钉钉插件部署主机ip}:8060/dingtalk/webhook1/send'
      send_resolved: true
```

webhook_configs.url 为部署 prometheus-webhook-dingtalk 的机器, webhook1 需要和 config.yml 中保持一致



#### 8.2.2.7 重启 AlertManager



#### 8.2.2.8 查看告警是否生成

进入 Prometheus 面板

![image.png](https://cdn.nlark.com/yuque/0/2023/png/22370594/1685437183708-1d505db3-ee6b-4912-93ba-ce5a6af51da7.png?x-oss-process=image%2Fresize%2Cw_1500%2Climit_0)

#### 8.2.2.9 钉钉告警信息

![image.png](https://cdn.nlark.com/yuque/0/2023/png/22370594/1685437446515-7ab1ed92-35d5-4e23-814d-05f7c253d251.png?x-oss-process=image%2Fresize%2Cw_1500%2Climit_0)
