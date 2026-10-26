---
title: Docker 构建 GitLab
description: "Docker 构建 GitLab（docker-compose 部署版本）"
slug: "/cloud-native/docker/build-gitlab"
hide_table_of_contents: false
keywords: ["Docker"]
tags: ["Docker", "CloudNative"]
date: 2017-08-01
categories: ["Docker"]
---

## Docker 构建 GitLab（docker-compose 部署版本）

GitLab 是一个开源的一体化 DevOps 平台，提供代码托管、Code Review、CI/CD（GitLab CI）、Wiki、Issue 跟踪、容器镜像仓库等能力，广泛用作企业内部的代码托管与研发协作平台。

本文按 docker-compose 方式部署 GitLab CE 单节点，镜像、端口、访问地址、目录等全部集中在 `.env` 中管理。

> 若是从 Linux 包安装（Omnibus）的 GitLab 迁移到 Docker 部署，`.env` 中 `GITLAB_IMAGE` 的版本必须与源服务器一致，先完成备份恢复（见第 8 节），再考虑升级。

## 1. 宿主目录

| 宿主目录 | 用途 |
|---------|------|
| `/data/runtime/docker/gitlab/config` | 配置文件（gitlab.rb、gitlab-secrets.json 等） |
| `/data/runtime/docker/gitlab/logs` | 日志 |
| `/data/runtime/docker/gitlab/data` | 仓库数据、数据库、备份文件 |

> 若将 `.env` 中对应目录变量留空，则回退使用 Docker 命名卷 `gitlab-config` / `gitlab-logs` / `gitlab-data`，无需创建宿主目录。

## 2. 创建宿主目录并设置权限

bind mount 首次使用需先建目录：

```bash
mkdir -p /data/runtime/docker/gitlab/{config,logs,data}
```

## 3. 编制 .env

在本目录创建 `.env` 文件（内容如下，按需修改）：

```bash
# ---------- GitLab 环境变量（集中管理） ----------

# ===== 镜像配置 =====
GITLAB_IMAGE=gitlab/gitlab-ce:17.4.1-ce.0
GITLAB_CONTAINER_NAME=gitlab

# ===== 主机名与访问地址 =====
# 服务器对外访问的地址（域名或IP:端口）
GITLAB_HOSTNAME=gitlab.example.com
GITLAB_EXTERNAL_URL=http://gitlab.example.com

# ===== 宿主机端口（宿主机:容器）=====
GITLAB_HTTP_PORT=80
GITLAB_HTTPS_PORT=443
# 宿主机SSH端口，避免与宿主机22冲突
GITLAB_SSH_PORT=2222

# ===== 性能与资源（按服务器配置调整）=====
GITLAB_PUMA_WORKERS=2
GITLAB_SIDEKIQ_CONCURRENCY=5
GITLAB_PROMETHEUS_ENABLE=false

# ===== 宿主机数据目录（统一约定 /data/runtime/docker/<服务>）；留空则回退到命名卷 =====
GITLAB_CONFIG_DIR=/data/runtime/docker/gitlab/config
GITLAB_LOGS_DIR=/data/runtime/docker/gitlab/logs
GITLAB_DATA_DIR=/data/runtime/docker/gitlab/data
TZ=Asia/Shanghai
```

## 4. .env 变量说明

| 变量 | 说明 | 示例 |
|------|------|------|
| `GITLAB_IMAGE` | 镜像版本 | `gitlab/gitlab-ce:17.4.1-ce.0` |
| `GITLAB_CONTAINER_NAME` | 容器名 | `gitlab` |
| `GITLAB_HOSTNAME` | 容器主机名 | `gitlab.example.com` |
| `GITLAB_EXTERNAL_URL` | 对外访问地址，决定生成的访问协议与端口 | `http://gitlab.example.com` |
| `GITLAB_HTTP_PORT` / `GITLAB_HTTPS_PORT` | Web 端口（映射到容器 80/443） | `80` / `443` |
| `GITLAB_SSH_PORT` | SSH 克隆端口（映射到容器 22），避免与宿主机 22 冲突 | `2222` |
| `GITLAB_PUMA_WORKERS` | Puma Web 进程数 | `2` |
| `GITLAB_SIDEKIQ_CONCURRENCY` | Sidekiq 后台任务并发数 | `5` |
| `GITLAB_PROMETHEUS_ENABLE` | 是否启用内置 Prometheus 监控（已外置监控时可关闭） | `false` |
| `GITLAB_CONFIG_DIR` / `GITLAB_LOGS_DIR` / `GITLAB_DATA_DIR` | 配置 / 日志 / 数据目录，留空回退命名卷 | `/data/runtime/docker/gitlab/...` |
| `TZ` | 时区 | `Asia/Shanghai` |

## 5. docker-compose.yml

在本目录创建 `docker-compose.yml`：

```yaml
services:
  gitlab:
    image: ${GITLAB_IMAGE}
    container_name: ${GITLAB_CONTAINER_NAME}
    restart: always
    hostname: ${GITLAB_HOSTNAME}
    environment:
      TZ: ${TZ}
      GITLAB_OMNIBUS_CONFIG: |
        external_url '${GITLAB_EXTERNAL_URL}'
        gitlab_rails['gitlab_shell_ssh_port'] = ${GITLAB_SSH_PORT}
        puma['worker_processes'] = ${GITLAB_PUMA_WORKERS}
        sidekiq['concurrency'] = ${GITLAB_SIDEKIQ_CONCURRENCY}
        prometheus_monitoring['enable'] = ${GITLAB_PROMETHEUS_ENABLE}
    ports:
      - "${GITLAB_HTTP_PORT}:80"
      - "${GITLAB_HTTPS_PORT}:443"
      - "${GITLAB_SSH_PORT}:22"
    volumes:
      - ${GITLAB_CONFIG_DIR:-gitlab-config}:/etc/gitlab
      - ${GITLAB_LOGS_DIR:-gitlab-logs}:/var/log/gitlab
      - ${GITLAB_DATA_DIR:-gitlab-data}:/var/opt/gitlab
    shm_size: '256m'
    # 增加资源限制，防止GitLab耗尽宿主机资源
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G

volumes:
  gitlab-config:
  gitlab-logs:
  gitlab-data:
```

## 6. 启动

```bash
cd Docker构建GitLab
docker compose up -d
docker compose ps
docker compose logs -f gitlab
docker compose down        # 停止并移除容器（命名卷数据保留）
docker compose down -v     # 连数据卷一起清空
```

GitLab 首次启动需初始化数据库并执行 reconfigure，一般需要 3~5 分钟，待 `docker compose logs -f gitlab` 中出现 `gitlab Reconfigured!` 后即可访问。

## 7. 访问

- Web：浏览器访问 `.env` 中的 `GITLAB_EXTERNAL_URL`（示例为 `http://gitlab.example.com`）
- 初始 root 密码：`docker compose exec gitlab cat /etc/gitlab/initial_root_password`（生成后 24 小时内有效，首次登录后请立即修改）
- SSH 克隆地址：`ssh://git@gitlab.example.com:2222/<群组>/<项目>.git`（端口对应 `.env` 中的 `GITLAB_SSH_PORT`）

## 8. 常见运维

### 8.1 备份

```bash
docker compose exec gitlab gitlab-backup create
```

备份文件生成在容器内 `/var/opt/gitlab/backups/`，即宿主机 `GITLAB_DATA_DIR` 目录下，文件名形如 `1728547800_2025_04_22_17.4.1_gitlab_backup.tar`。

注意：配置文件不在备份包内，`GITLAB_CONFIG_DIR` 下的 `gitlab.rb` 与 `gitlab-secrets.json` 需单独备份（`gitlab-secrets.json` 丢失将导致 CI 变量等加密数据无法解密）。

### 8.2 恢复

将备份文件放入 `GITLAB_DATA_DIR` 下的 `backups/` 目录后执行：

```bash
docker compose exec gitlab gitlab-backup restore BACKUP=1728547800_2025_04_22_17.4.1
docker compose restart
```

恢复时 `GITLAB_IMAGE` 版本必须与备份时的版本一致。

### 8.3 升级

修改 `.env` 中的 `GITLAB_IMAGE` 版本后执行 `docker compose up -d` 即可。GitLab 对跨版本升级有路径要求，跨大版本需按官方升级路径逐版本升级，升级前务必先完成 8.1 的备份。
