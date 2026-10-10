---
title: Docker 构建 Prometheus
description: "Docker 构建 Prometheus（docker-compose 部署版本）"
slug: "/cloud-native/docker/build-prometheus"
hide_table_of_contents: false
keywords: ["Docker"]
tags: ["Docker", "CloudNative"]
date: 2017-08-01
categories: ["Docker"]
---

# Docker 构建 Prometheus（docker-compose 部署版本）

# 1. Prometheus 介绍

Prometheus 是一个开源系统监控与告警工具包，它收集指标并将其存储为时间序列数据，即指标信息与记录它的时间戳一起存储，以及称为标签的可选键值对。

| 组件 | 作用 |
|------|------|
| Prometheus Server | 收集和存储时间序列数据，提供 PromQL 查询 |
| Node-Exporter | 暴露宿主机的硬件与操作系统指标 |
| AlertManager | 处理告警：去重、分组、路由（邮件 / 钉钉 / 企业微信等） |
| Grafana | 第三方展示工具，编写 PromQL 查询语句可视化展示 |
| cAdvisor | 监控容器资源使用情况 |

本文按 docker-compose 方式部署上述监控全家桶，镜像、端口、目录、容器名等可配置项全部集中在 `.env` 中管理，其余配置项放在 `PROMETHEUS_CONF_DIR` 下（默认 `/data/runtime/docker/prometheus/conf`）。

# 2. 宿主目录

| 宿主目录 | 用途 | 容器内用户 |
|---------|------|-----------|
| `/data/runtime/docker/prometheus/data` | Prometheus 时序数据 | root（compose 已设 `user: root`） |
| `/data/runtime/docker/prometheus/rules` | 告警规则文件 | root |
| `/data/runtime/docker/prometheus/grafana/data` | Grafana 数据 | uid 472 |
| `/data/runtime/docker/prometheus/grafana/plugins` | Grafana 插件 | uid 472 |
| `/data/runtime/docker/prometheus/conf` | 配置文件（prometheus.yml、alertmanager/） | 只读 |

> 数据目录：`.env` 中 `*_DIR` 留空则回退使用 Docker 命名卷；**配置目录 `PROMETHEUS_CONF_DIR` 为必填**，需先按第 3 节复制配置。

# 3. 创建宿主目录并设置权限

bind mount 首次使用需先建目录（prometheus 以 root 运行无需授权，grafana 授权 uid 472）：

```bash
# 1) 配置目录：首次部署把部署包 conf/ 复制到宿主根，之后直接修改宿主目录下的配置
mkdir -p /data/runtime/docker/prometheus/conf
cp -r ./conf/. /data/runtime/docker/prometheus/conf/

# 2) 数据目录
mkdir -p /data/runtime/docker/prometheus/{data,rules,grafana/{data,plugins}}
chown -R 472:472 /data/runtime/docker/prometheus/grafana
```

# 4. 编制 .env

在本目录创建 `.env` 文件（内容如下，按需修改）：

```bash
# ---------- Prometheus 监控全家桶环境变量（集中管理） ----------

# ===== 镜像配置 =====
PROMETHEUS_IMAGE=prom/prometheus:latest
NODE_EXPORTER_IMAGE=prom/node-exporter:latest
ALERTMANAGER_IMAGE=prom/alertmanager:latest
GRAFANA_IMAGE=grafana/grafana:latest
CADVISOR_IMAGE=gcr.io/cadvisor/cadvisor:latest

# ===== 宿主机端口（宿主机:容器）=====
PROMETHEUS_PORT=9090
NODE_EXPORTER_PORT=9100
ALERTMANAGER_PORT=9093
GRAFANA_PORT=3000
CADVISOR_PORT=9200

# ===== Grafana 管理员密码 =====
GRAFANA_ADMIN_PASSWORD=admin

# ===== 宿主机数据目录（统一约定 /data/runtime/docker/<服务>）；留空则回退到命名卷 =====
PROMETHEUS_DATA_DIR=/data/runtime/docker/prometheus/data
PROMETHEUS_RULES_DIR=/data/runtime/docker/prometheus/rules
GRAFANA_DATA_DIR=/data/runtime/docker/prometheus/grafana/data
GRAFANA_PLUGINS_DIR=/data/runtime/docker/prometheus/grafana/plugins
PROMETHEUS_CONF_DIR=/data/runtime/docker/prometheus/conf
TZ=Asia/Shanghai
```

# 5. .env 变量说明

| 变量 | 说明 | 示例 |
|------|------|------|
| `PROMETHEUS_IMAGE` 等 | 各组件镜像 | `prom/prometheus:latest` |
| `PROMETHEUS_PORT` / `NODE_EXPORTER_PORT` / `ALERTMANAGER_PORT` / `GRAFANA_PORT` / `CADVISOR_PORT` | 宿主机端口 | `9090` / `9100` / `9093` / `3000` / `9200` |
| `GRAFANA_ADMIN_PASSWORD` | Grafana 管理员密码 | `admin` |
| `PROMETHEUS_DATA_DIR` / `PROMETHEUS_RULES_DIR` / `GRAFANA_DATA_DIR` / `GRAFANA_PLUGINS_DIR` | 数据目录，留空回退命名卷 | `/data/runtime/docker/prometheus/...` |
| `PROMETHEUS_CONF_DIR` | 配置目录（必填，先复制 conf/） | `/data/runtime/docker/prometheus/conf` |
| `TZ` | 时区 | `Asia/Shanghai` |

# 6. docker-compose.yml

在本目录创建 `docker-compose.yml`：

```yaml
services:
  prometheus:
    image: ${PROMETHEUS_IMAGE}
    container_name: prometheus
    restart: always
    user: root
    ports:
      - "${PROMETHEUS_PORT}:9090"
    volumes:
      - ${PROMETHEUS_CONF_DIR}/prometheus.yml:/prometheus/config/prometheus.yml
      - ${PROMETHEUS_DATA_DIR:-prom-data}:/prometheus/data
      - ${PROMETHEUS_RULES_DIR:-prom-rules}:/prometheus/rules
      - /etc/localtime:/etc/localtime:ro
    command:
      - '--web.enable-lifecycle'                # 支持热更新
      - '--storage.tsdb.retention.time=100d'    # 保留 100 天数据
      - '--storage.tsdb.path=/prometheus'
      - '--config.file=/prometheus/config/prometheus.yml'

  node-exporter:
    image: ${NODE_EXPORTER_IMAGE}
    container_name: node-exporter
    restart: always
    ports:
      - "${NODE_EXPORTER_PORT}:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro

  alertmanager:
    image: ${ALERTMANAGER_IMAGE}
    container_name: alertmanager
    restart: always
    ports:
      - "${ALERTMANAGER_PORT}:9093"
    volumes:
      - ${PROMETHEUS_CONF_DIR}/alertmanager/alertmanager.yml:/alertmanager/config/alertmanager.yml
      - ${PROMETHEUS_CONF_DIR}/alertmanager/template:/alertmanager/template
      - /etc/localtime:/etc/localtime:ro
    command:
      - '--config.file=/alertmanager/config/alertmanager.yml'

  grafana:
    image: ${GRAFANA_IMAGE}
    container_name: grafana
    restart: always
    user: root
    ports:
      - "${GRAFANA_PORT}:3000"
    volumes:
      - ${GRAFANA_DATA_DIR:-grafana-data}:/var/lib/grafana
      - ${GRAFANA_PLUGINS_DIR:-grafana-plugins}:/var/lib/grafana/plugins
      - /etc/localtime:/etc/localtime:ro
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD}
      - GF_INSTALL_PLUGINS=grafana-clock-panel,grafana-simple-json-datasource,grafana-piechart-panel
      - TZ=${TZ}
    depends_on:
      - prometheus

  cadvisor:
    image: ${CADVISOR_IMAGE}
    container_name: cadvisor
    restart: always
    ports:
      - "${CADVISOR_PORT}:8080"
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
```

# 7. 配置文件说明

## 7.1 `${PROMETHEUS_CONF_DIR}/prometheus.yml`（抓取目标）

compose 内直接用服务名互相访问：

```yaml
global:
  scrape_interval: 15s
  scrape_timeout: 15s
  evaluation_interval: 60s

alerting:
  alertmanagers:
  - static_configs:
    - targets: ["alertmanager:9093"]

rule_files:
  - '/prometheus/rules/*.yml'

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
    - targets: ["prometheus:9090"]
      labels: { instance: prometheus }
  - job_name: 'node-exporter'
    static_configs:
    - targets: ["node-exporter:9100"]
  - job_name: 'alertmanager'
    static_configs:
    - targets: ["alertmanager:9093"]
```

> 监控其它主机 / Oracle 时，往 `scrape_configs` 追加 job，并同步到宿主机 `${PROMETHEUS_RULES_DIR}` 下的规则文件。

## 7.2 `${PROMETHEUS_RULES_DIR}/rule.yml`（告警阈值）

```yaml
groups:
- name: Hosts.rules
  rules:
  - alert: HostDown
    expr: up{job=~"node-exporter|prometheus|grafana|alertmanager"} == 0
    for: 0m
    labels: { severity: ERROR }
    annotations:
      title: 'Instance down'
      summary: "{{$labels.instance}}"
      description: "主机: 【 {{ $labels.instance }} 】has been down for more than 1 minute"
```

## 7.3 `${PROMETHEUS_CONF_DIR}/alertmanager/alertmanager.yml`（邮件告警）

```yaml
global:
  resolve_timeout: 5m
  smtp_smarthost: 'smtp.qq.com:465'
  smtp_from: 'xx@qq.com'
  smtp_auth_username: 'xx@qq.com'
  smtp_auth_password: 'xxxx'      # qq 邮箱授权码
  smtp_require_tls: false
  smtp_hello: 'qq.com'

templates:
  - '/alertmanager/template/*.tmpl'

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

# 8. 启动

```bash
cd Docker构建Prometheus
docker compose up -d
docker compose ps
docker compose logs -f
docker compose down        # 停止并移除容器（命名卷数据保留）
docker compose down -v     # 连数据卷一起清空
```

# 9. 访问入口

| 服务 | 地址 | 默认账号 |
|------|------|----------|
| Prometheus | `http://<服务器IP>:9090` | - |
| Node-Exporter | `http://<服务器IP>:9100/metrics` | - |
| AlertManager | `http://<服务器IP>:9093` | - |
| Grafana | `http://<服务器IP>:3000` | `admin` / `.env` 中 `GRAFANA_ADMIN_PASSWORD` |
| cAdvisor | `http://<服务器IP>:9200` | - |

# 10. 告警扩展（摘要）

## 10.1 钉钉告警

使用 `prometheus-webhook-dingtalk` 转发 AlertManager 告警到钉钉机器人：

1. 在钉钉群添加自定义机器人，记录 `Webhook` 与 `Sign`
2. 部署 `prometheus-webhook-dingtalk`（`config.yml` 配置 webhook url / secret），监听 8060
3. `${PROMETHEUS_CONF_DIR}/alertmanager/alertmanager.yml` 的 route 增加 `dingtalk-webhook` receiver，webhook 指向 `http://<钉钉插件部署主机ip>:8060/dingtalk/webhook1/send`
4. 重启 AlertManager 生效

## 10.2 监控 Oracle

Prometheus 官方不直接采集 Oracle，需部署 `oracledb_exporter`（二进制方式，非容器），依赖 Oracle Instant Client：

1. 安装 `oracle-instantclient12.2-basic`，配置 `tnsnames.ora` 与 `LD_LIBRARY_PATH`、`DATA_SOURCE_NAME` 环境变量
2. 启动 `oracledb_exporter --web.listen-address=0.0.0.0:9161 --default.metrics ./default-metrics.toml`
3. 在 `${PROMETHEUS_CONF_DIR}/prometheus.yml` 追加 job：`targets: ['<数据库主机ip>:9161']`
4. 在 `${PROMETHEUS_RULES_DIR}` 下新增表空间告警规则：

```yaml
groups:
- name: Oracle.rules
  rules:
  - alert: TableSpaceWarning
    expr: oracledb_tablespace_used_percent{tablespace=~".+",type="PERMANENT"} > 80
    for: 30s
    labels: { severity: WARNING }
    annotations:
      title: '数据库表空间预警'
      description: "主机: [{{$labels.instance}}] 表空间 [{{$labels.tablespace}}] 使用率超过80%, 当前: {{ $value }}%"
```

> Prometheus 配置修改后无需重启：`curl -X POST http://<服务器IP>:9090/-/reload`（已开启 `--web.enable-lifecycle`）。
