---
title: GitLab 迁移
description: "GitLab 迁移实战（CE 版）：物理机 → Docker、域名 → IP（备份、恢复、验证、切换全流程）"
slug: "/cloud-native/docker/gitlab-migration"
hide_table_of_contents: false
keywords: ["Docker", "GitLab"]
tags: ["Docker", "GitLab", "CloudNative"]
date: 2017-08-01
categories: ["Docker"]
---

## GitLab 迁移：物理机 → Docker（CE 版实战教程）

> 源端：服务器 A，物理机直接安装 GitLab（Omnibus，CE）17.4.1，访问地址 `http://gitlab.xx.com`
> 目标端：服务器 B，Docker 安装 GitLab CE 17.4.1，通过 `http://<服务器B_IP>` 访问
> 目标：代码、分组、用户、CI/CD 变量、Runner 等数据原样还原
>
> **本文以 GitLab CE（Community Edition）为例**，不涉及 EE。两端镜像必须都是 CE。

本篇与 [Docker 构建 GitLab](../Docker构建GitLab/Docker构建GitLab.md) 配套：部署篇讲全新部署与日常运维，本篇讲如何把物理机上的存量 GitLab 迁移到 Docker 环境。**服务器 B 的部署文件（`.env` + `docker-compose.yml`）复用部署篇的格式**，但迁移场景下 `.env` 中的 `GITLAB_OMNIBUS_CONFIG` **不会生效**（原因见 4.1），必须以修改 `gitlab.rb` 为准。

开始前先记住三条铁律：

1. **版本必须完全一致**：服务器 B 的 CE 镜像必须与服务器 A 的 GitLab 版本**完全一致**（本文为 17.4.1），`gitlab/gitlab-ce:17.4.1-ce.0` 精确匹配；
2. **`gitlab-secrets.json` 必须迁移**：它包含数据库加密密钥、CI/CD 变量加密密钥、2FA 密钥、Runner 认证密钥等，一旦丢失，加密数据将永久无法解密；
3. **`external_url` 必须改为 IP**：恢复出来的 `gitlab.rb` 中 `external_url` 必须改为 `http://<服务器B_IP>`，否则页面、邮件、克隆地址全部指向旧域名。

## 1. 整体流程与停服窗口

```
服务器 A（物理机）                     服务器 B（Docker）
─────────────────                    ─────────────────
清理重定向设置 → 冻结写入
→ 创建数据备份 → 打包配置
→ scp 传输两个文件        ──────►      准备目录与部署文件
                                     → 恢复配置（改 external_url/SSH 端口）
                                     → 放置备份包 → 启动空实例
                                     → 恢复数据 → 验证
                                     → 通知切换 → 关停 A
```

建议预留 **30–60 分钟**停服窗口（取决于仓库体积）。窗口期内服务器 A 保持冻结状态（Web 不可访问、无写入），若需回退，`sudo gitlab-ctl start` 即可恢复原服务。

## 2. 迁移前核对清单

| 核对项     | 要求                                                | 检查命令/说明                                       |
| ---------- | --------------------------------------------------- | ---------------------------------------------------- |
| GitLab 版本 | B 必须与 A **完全相同**（本文 17.4.1，CE）           | Docker 镜像 tag 精确匹配（见下）                     |
| 镜像类型   | 两端都是 **CE**                                     | B 用 `gitlab/gitlab-ce:17.4.1-ce.0`                  |
| 访问地址   | A 为 `http://gitlab.xx.com`；B 为 `http://<B_IP>`   | 迁移后统一改为 IP（铁律 3）                          |
| 磁盘空间   | B 至少预留 **2 倍备份包大小**                        | `df -h /data`                                        |
| 端口占用   | B 的 `80`、`2222` 未被占用，防火墙放行              | `ss -lntp \| grep -E ':80 \|:2222'`；容器 SSH 固定映射 `2222:22` |
| 停服窗口   | 建议 30–60 分钟                                     | 取决于仓库体积                                       |
| 备份可用   | A 可正常执行 gitlab-backup                          | 见下方一键预检                                       |

### 2.1 一键预检（迁移前在对应服务器执行）

```bash
# 在服务器 A 执行：确认版本与 CE 类型
sudo gitlab-rake gitlab:env:info | grep -E "Version|Edition"
# 预期输出形如：
#   Version: 17.4.1
#   Edition: CE
# 若显示 EE 或版本号不是 17.4.1，先与 B 对齐，不要继续！

# 在服务器 B 执行：确认磁盘与端口
df -h /data
ss -lntp | grep -E ':80 |:2222' || echo "80/2222 端口空闲 ✅"
```

> **硬性条件**：版本不一致、备份命令不可用、`gitlab-secrets.json` 未迁移，都会导致恢复失败或加密数据永久不可用。预检不通过不要开始迁移。

## 3. 第一阶段：服务器 A（物理机）备份

### 3.1 清空可能导致重定向的自定义设置【必须】

登录服务器 A 的 GitLab Web 界面：**Admin Area → Settings → Sign-in restrictions**，检查并清空以下两项（会随数据库备份带到 B，不清空会导致访问 IP 时被 302 重定向回旧域名）：

- Home page URL
- After sign-out path

> 可选：停服窗口内发一条全局公告（Admin Area → Overview → Dashboard → Broadcast banner）告知用户。

### 3.2 冻结写入（只停应用服务，不停数据库）【必须】

```bash
# 只停止对外服务和后台任务，保持 PostgreSQL/Redis 运行
sudo gitlab-ctl stop puma
sudo gitlab-ctl stop sidekiq

# 确认状态：puma/sidekiq 为 down，postgresql/redis 为 run
sudo gitlab-ctl status
```

> ⚠️ **不要执行 `gitlab-ctl stop` 全量停止**：备份需要连接 PostgreSQL 和 Redis，数据库停了 `gitlab-backup create` 会直接失败。只停 puma/sidekiq 即可保证备份一致性。

此后服务器 A 保持冻结状态（Web 不可访问）直至迁移完成。期间**不要在 A 上修改任何配置**，保证回退环境完好（回退只需 `sudo gitlab-ctl start`）。

### 3.3 创建数据备份【必须】

```bash
sudo gitlab-backup create
```

执行完成后确认备份文件生成：

```bash
ls -lh /var/opt/gitlab/backups/*_gitlab_backup.tar
# 预期：存在形如 17xxxxxxxx_2026_10_21_17.4.1_gitlab_backup.tar 的文件，且体积非 0
```

> 可选：跳过非核心数据以减小体积：`sudo gitlab-backup create SKIP=registry,artifacts`。使用后这些数据不会进入备份包，恢复后容器镜像仓库与 CI 产物为空，验证阶段做对应确认（见 5.1）。

### 3.4 单独打包配置文件和密钥【必须】

```bash
sudo tar -czvf gitlab-config.tar.gz /etc/gitlab
```

打包后**必须校验** `gitlab-secrets.json` 在包内（铁律 2，它是迁移成败的关键）：

```bash
tar -tzf gitlab-config.tar.gz | grep -E "gitlab-secrets.json|gitlab.rb$"
# 预期两条都列出；缺 gitlab-secrets.json 则重新打包
```

> 备份包里**不包含** `/etc/gitlab` 下的任何文件，`gitlab.rb`、`gitlab-secrets.json`、TLS 证书、SSH 主机密钥全靠这个 tar 包迁移。

### 3.5 一键备份打包脚本（可选，替代 3.2~3.4）

不想分步执行时，可用下面脚本一条命令完成「冻结写入 → 数据备份 → 配置打包 → 完整性校验」，产物与分步法完全一致：

```bash
# 用法：sudo bash gitlab-migrate-backup.sh [SKIP=registry,artifacts]
# 产物：
#   1) /var/opt/gitlab/backups/<时间戳>_<版本>_gitlab_backup.tar   数据备份
#   2) /tmp/gitlab-migrate/gitlab-config-<时间戳>.tar.gz          配置包（含 gitlab-secrets.json）
```

创建脚本文件：

```bash
touch gitlab-migrate-backup.sh && vi gitlab-migrate-backup.sh
```

将以下内容完整粘贴保存：

```bash
#!/bin/bash
# ============================================================
# GitLab 迁移 · 服务器 A 一键备份打包脚本
# 用法：sudo bash gitlab-migrate-backup.sh [SKIP=registry,artifacts]
# 产物：见脚本末尾清单
# ============================================================
set -euo pipefail

SKIP_OPTS="${1:-}"                # 可选：SKIP=registry,artifacts
OUT_DIR="/tmp/gitlab-migrate"    # 配置包输出目录
BACKUP_DIR="/var/opt/gitlab/backups"
DATE="$(date +%Y%m%d_%H%M%S)"

# ---------- 0. 前置检查 ----------
if [ "$(id -u)" -ne 0 ]; then
    echo "[错误] 请以 root 运行：sudo bash $0 [SKIP=...]" >&2
    exit 1
fi
if ! gitlab-ctl status >/dev/null 2>&1; then
    echo "[错误] GitLab 服务不可用，请先 gitlab-ctl start" >&2
    exit 1
fi

# ---------- 1. 版本确认 ----------
echo "===== [1/5] 版本确认 ====="
gitlab-rake gitlab:env:info 2>/dev/null | grep -E "Version|Edition" || true

# ---------- 2. 冻结写入 ----------
echo "===== [2/5] 冻结写入（停 puma/sidekiq，保留 postgres/redis）====="
gitlab-ctl stop puma
gitlab-ctl stop sidekiq
if ! gitlab-ctl status | grep -q "run: postgresql" || ! gitlab-ctl status | grep -q "run: redis"; then
    echo "[错误] postgresql/redis 未运行，备份无法进行" >&2
    exit 1
fi
gitlab-ctl status | grep -E "puma|sidekiq|postgresql|redis" || true

# ---------- 3. 创建数据备份 ----------
echo "===== [3/5] 创建数据备份 ====="
if [ -n "$SKIP_OPTS" ]; then
    echo "跳过非核心数据：$SKIP_OPTS"
    gitlab-backup create "$SKIP_OPTS"
else
    gitlab-backup create
fi

# ---------- 4. 打包配置与密钥 ----------
echo "===== [4/5] 打包配置与密钥（/etc/gitlab）====="
mkdir -p "$OUT_DIR"
tar -czvf "$OUT_DIR/gitlab-config-$DATE.tar.gz" /etc/gitlab

# ---------- 5. 完整性校验 ----------
echo "===== [5/5] 完整性校验 ====="
TAR="$OUT_DIR/gitlab-config-$DATE.tar.gz"
for key in "gitlab.rb$" "gitlab-secrets.json"; do
    if ! tar -tzf "$TAR" | grep -qE "$key"; then
        echo "[错误] 配置包缺少 $key，请检查 /etc/gitlab 后重新打包" >&2
        exit 1
    fi
done
echo "[OK] 配置包校验通过，关键文件如下："
tar -tzf "$TAR" | grep -E "gitlab.rb$|gitlab-secrets.json|/ssl/|ssh_host" | head -20

echo
echo "================ 备份产物清单 ================"
ls -lh "$BACKUP_DIR"/*_gitlab_backup.tar
ls -lh "$TAR"
echo
echo "下一步（传输到服务器 B）："
echo "  scp $BACKUP_DIR/*_gitlab_backup.tar $TAR root@<服务器B_IP>:/tmp/"
```

执行：

```bash
sudo bash gitlab-migrate-backup.sh
# 可选跳过非核心数据：sudo bash gitlab-migrate-backup.sh SKIP=registry,artifacts
```

> 脚本步骤 2 之后服务器 A 即处于冻结状态（Web 不可访问），与分步法行为一致；若脚本任一步骤失败会立刻报错退出，不会留下半成品。

### 3.6 传输到服务器 B

```bash
scp /var/opt/gitlab/backups/*_gitlab_backup.tar \
    gitlab-config.tar.gz \
    root@<服务器B_IP>:/tmp/
```

## 4. 第二阶段：服务器 B（Docker）部署与恢复

### 4.1 准备目录与部署文件

创建宿主目录（约定见部署篇：统一 `/data/runtime/docker/<服务>`）：

```bash
mkdir -p /data/runtime/docker/gitlab/{config,logs,data}
mkdir -p /data/runtime/docker/gitlab/data/backups
```

编写 `.env`（与 [Docker 构建 GitLab](../Docker构建GitLab/Docker构建GitLab.md) 相同格式，标注处为迁移定制项）：

```bash
# ---------- GitLab 环境变量（集中管理） ----------

# ===== 镜像配置 =====
# ★迁移定制：必须与服务器 A 精确同版本、同 CE 类型
GITLAB_IMAGE=gitlab/gitlab-ce:17.4.1-ce.0
GITLAB_CONTAINER_NAME=gitlab

# ===== 主机名与访问地址 =====
GITLAB_HOSTNAME=gitlab
# ★迁移定制：从域名改为服务器 B 的 IP（铁律 3）
GITLAB_EXTERNAL_URL=http://<服务器B_IP>

# ===== 宿主机端口（宿主机:容器）=====
GITLAB_HTTP_PORT=80
GITLAB_HTTPS_PORT=443
# 容器 SSH 固定映射 2222:22，避免与宿主机 sshd 的 22 冲突
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

`docker-compose.yml` 与部署篇完全一致：

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

> ⚠️ **关键区别（迁移与全新部署）**：部署篇全新部署时 `/etc/gitlab/gitlab.rb` 不存在，`.env` 的 `GITLAB_OMNIBUS_CONFIG` 会在首次启动时写入 `gitlab.rb`；**迁移场景我们在 4.2 恢复了源端 `gitlab.rb`，环境变量将完全不生效**。因此 `external_url` 与 SSH 端口**只能**靠 4.2 修改 `gitlab.rb` 保证，不要依赖 `.env`。

### 4.2 恢复配置文件并修改 gitlab.rb【必须】

```bash
# 解压服务器 A 的配置包并放入 config 目录
tar -xzvf /tmp/gitlab-config.tar.gz -C /tmp/
cp -a /tmp/etc/gitlab/. /data/runtime/docker/gitlab/config/
```

核对关键文件：

```bash
ls -l /data/runtime/docker/gitlab/config/gitlab-secrets.json
# 预期：文件存在，且来自服务器 A（可对比文件内容）
```

修改 `gitlab.rb` 中的 `external_url` 与 SSH 端口（**必须改，`GITLAB_OMNIBUS_CONFIG` 不会覆盖**）：

```bash
CONFIG=/data/runtime/docker/gitlab/config/gitlab.rb

# 1) external_url 改为服务器 B 的 IP（已有则替换，没有则追加）
if grep -q "^external_url" "$CONFIG"; then
    sed -i "s|^external_url.*|external_url 'http://<服务器B_IP>'|" "$CONFIG"
else
    echo "external_url 'http://<服务器B_IP>'" >> "$CONFIG"
fi

# 2) SSH 克隆端口改为 2222（源端默认 22，不改成 2222 则 SSH 克隆连不上）
if grep -q "gitlab_shell_ssh_port" "$CONFIG"; then
    sed -i "s|.*gitlab_shell_ssh_port.*|gitlab_rails['gitlab_shell_ssh_port'] = 2222|" "$CONFIG"
else
    echo "gitlab_rails['gitlab_shell_ssh_port'] = 2222" >> "$CONFIG"
fi
```

验证修改结果：

```bash
grep -E "^external_url|gitlab_shell_ssh_port" "$CONFIG"
# 预期：
#   external_url 'http://<服务器B_IP>'
#   gitlab_rails['gitlab_shell_ssh_port'] = 2222
```

检查源端是否自定义过备份目录（恢复时 BACKUP 前缀的查找位置会随之变化）：

```bash
grep -n "backup_path" "$CONFIG" || echo "使用默认备份目录 /var/opt/gitlab/backups ✅"
```

> 若源端 `gitlab.rb` 中还有 SMTP、LDAP 等自定义配置，会随文件一起保留生效，属预期行为；无需改动。也可以删除 `external_url` 行后完全交给 `.env`，但按铁律 3 保持两处一致，避免排障时被误导。

### 4.3 放置数据备份包【必须】

```bash
cp /tmp/*_gitlab_backup.tar /data/runtime/docker/gitlab/data/backups/
ls -lh /data/runtime/docker/gitlab/data/backups/   # 确认存在且体积非 0
```

### 4.4 启动并处理权限【必须】

```bash
docker compose up -d
```

GitLab 首次启动会初始化数据库并执行 reconfigure（因已恢复配置，本步骤不会重复生成 secrets），约 3–5 分钟，待日志出现 `gitlab Reconfigured!` 后继续：

```bash
docker compose logs -f gitlab
# 出现类似日志后即可继续：==> /var/log/gitlab/gitlab-rails/... Reconfigured!
```

修正备份包属主（官方要求备份文件归 `git` 用户所有；**在容器内按用户名操作，不要在宿主机硬编码数字 UID**）：

```bash
docker exec gitlab chown git:git /var/opt/gitlab/backups/*_gitlab_backup.tar
docker exec gitlab chmod 600 /var/opt/gitlab/backups/*_gitlab_backup.tar
```

如目录层级仍有权限报错，优先使用镜像自带的修复命令，**不要**对整个数据目录 `chown -R`（目录下有分属 `gitlab-psql` 等用户的数据库文件，整体改属主会导致 PostgreSQL 无法启动）：

```bash
docker exec -it gitlab update-permissions
docker restart gitlab
# 等日志再次出现 Reconfigured! 再继续
```

### 4.5 执行数据恢复【必须】

恢复前先停止连接数据库的应用进程（保持 postgres/redis 运行），并确认状态：

```bash
docker exec -it gitlab gitlab-ctl stop puma
docker exec -it gitlab gitlab-ctl stop sidekiq
docker exec gitlab gitlab-ctl status
# 预期：puma down、sidekiq down、postgresql run、redis run
```

**自动提取备份前缀**（避免手抄 `BACKUP=` 前缀出错）：

```bash
BACKUP_FILE=$(basename "$(ls /data/runtime/docker/gitlab/data/backups/*_gitlab_backup.tar | head -1)")
BACKUP_NAME=${BACKUP_FILE%_gitlab_backup.tar}
echo "待恢复备份: $BACKUP_NAME"
# 预期输出形如：待恢复备份: 17xxxxxxxx_2026_10_21_17.4.1
```

执行恢复（用 `yes |` 自动应答确认，避免交互卡住）：

```bash
docker exec -i gitlab sh -c "yes | gitlab-backup restore BACKUP=$BACKUP_NAME"
```

> `BACKUP=` 只需文件名去掉 `_gitlab_backup.tar` 的前缀部分。恢复过程需数分钟到数十分钟，日志会逐步出现 `Restoring...` 与 `done.`；若中途 `Permission denied`，回到 4.4 处理权限后重试。

恢复完成后按 **reconfigure → restart** 的顺序收尾：

```bash
docker exec -it gitlab gitlab-ctl reconfigure
docker restart gitlab
```

> 首次启动生成的 `initial_root_password` 仅供全新实例使用；恢复成功后数据库已被备份覆盖，管理员密码、用户密码均与服务器 A 一致，无需理会该文件。

## 5. 第三阶段：恢复后验证

### 5.1 基础访问验证

| 序号 | 检查项   | 通过标准                                                |
| ---- | -------- | ------------------------------------------------------- |
| 1    | Web 访问 | `http://<服务器B_IP>` 正常打开，**不跳转**到旧域名      |
| 2    | 用户登录 | 原账号密码可登录                                        |
| 3    | 2FA      | 原 2FA 验证码可用，说明 `gitlab-secrets.json` 生效      |
| 4    | 用户分组 | Admin Area 中用户数、分组数与源端一致                   |
| 5    | 项目代码 | 分支、标签、提交历史完整                                |
| 6    | 克隆地址 | HTTP 地址显示 `http://<服务器B_IP>/...`；SSH 端口为 2222 |
| 7    | Runner   | Admin Area → Runners 中原 Runner 在线（离线处理见 6.3） |
| 8    | 产物镜像 | 若 3.3 未用 `SKIP`，抽查 CI 产物与容器镜像仓库完整      |

SSH 端到端验证（GitLab 会返回欢迎语并断开）：

```bash
ssh -p 2222 git@<服务器B_IP>
# 预期：Welcome to GitLab, @root!（或对应账号）
```

### 5.2 数据一致性深度验证

```bash
# 数据库迁移状态：预期全部为 up
docker exec -it gitlab gitlab-rake db:migrate:status

# 加密列是否可解密：验证 secrets 是否真正生效（大量失败则见第 7 节）
docker exec -it gitlab gitlab-rake gitlab:doctor:secrets

# 仓库完整性：预期无 FAILED
docker exec -it gitlab gitlab-rake gitlab:git:check

# 系统健康检查
docker exec -it gitlab gitlab-rake gitlab:check SANITIZE=true
docker exec -it gitlab gitlab-rake gitlab:gitaly:check
```

## 6. 第四阶段：异常处理与切换收尾

### 6.1 如果访问 IP 仍被重定向到旧域名

```bash
docker exec -it gitlab gitlab-rails console
```

在控制台执行：

```ruby
pp ApplicationSetting.current.home_page_url
ApplicationSetting.current.update!(home_page_url: '')
ApplicationSetting.current.update!(after_sign_out_path: '')
exit
```

（此兜底与 3.1 配合，双保险。）

### 6.2 通知用户更新本地 remote URL

GitLab 内部克隆地址已变为 IP，但用户本地仓库不会自动更新：

```bash
git remote set-url origin http://<服务器B_IP>/<namespace>/<project>.git
```

访问地址从域名变为 IP，SSH 首次连接必然出现 host key 告警，提示用户清理旧记录：

```bash
ssh-keygen -R gitlab.xx.com
```

批量检查旧域名残留：

```bash
git remote -v | grep "gitlab.xx.com" && echo "需要更新 remote URL"
```

### 6.3 更新 Runner 与外部集成

**Runner**：secrets 迁移成功时 Runner 的认证 token 依然有效，通常只需修改每台 Runner 机器 `config.toml` 中的 `url` 并重启，**无需重新注册**（重新注册会生成新的 Runner 记录，丢失与历史作业的关联）：

```bash
# /etc/gitlab-runner/config.toml
[[runners]]
  url = "http://<服务器B_IP>"     # 原为 http://gitlab.xx.com

sudo systemctl restart gitlab-runner
```

仅当 token 确实失效时才重新注册。

**外部集成**：迁移后检查并更新：

- Admin Area → Applications 中 OAuth 回调地址
- 项目/群组 Webhook URL
- 与 Jira、Slack、LDAP 等集成的回调地址

### 6.4 关闭服务器 A 的 GitLab

验证通过后：

- 停止服务器 A 的 GitLab 服务（A 目前 puma/sidekiq 已停，补 `sudo gitlab-ctl stop` 即可）
- 禁用其定时备份任务（`crontab -l` 检查）
- 避免两套实例同时发送邮件、处理 webhook

在验证全部通过前**保留服务器 A 原环境**（配置未做任何修改）作为回退保障，回退只需 `sudo gitlab-ctl start`。

## 7. `gitlab-secrets.json` 丢失或未生效的补救流程

> **破坏性操作，先备份数据库。**
> 仅当确认 `gitlab:doctor:secrets` 大量失败，且无法找回服务器 A 的 `gitlab-secrets.json` 时执行。

### 7.1 为所有用户禁用 2FA

```bash
docker exec -it gitlab gitlab-rails runner \
  "User.update_all(otp_required_for_login: false, encrypted_otp_secret: nil, otp_secret: nil)"
```

### 7.2 清空不可解密的 CI/CD 变量

```bash
docker exec -it gitlab gitlab-rails dbconsole --database main
```

```sql
SELECT COUNT(*) FROM ci_group_variables;
SELECT COUNT(*) FROM ci_variables;

DELETE FROM ci_group_variables;
DELETE FROM ci_variables;
```

### 7.3 重置 Runner 令牌

```sql
UPDATE projects SET runners_token = NULL, runners_token_encrypted = NULL;
UPDATE namespaces SET runners_token = NULL, runners_token_encrypted = NULL;
UPDATE application_settings SET runners_registration_token_encrypted = NULL;
UPDATE ci_runners SET token = NULL, token_encrypted = NULL;
```

完成后重启 GitLab，通知用户重新激活 2FA、重新录入 CI 变量、重新注册 Runner。

## 8. 快速执行清单

| 阶段   | 核心命令/动作                                           | 完成标志                             |
| ------ | ------------------------------------------------------- | ------------------------------------ |
| 预检   | 版本=17.4.1 CE、磁盘 2 倍、端口空闲                     | 全部通过再继续                       |
| A 设置 | 清空 Home page URL / After sign-out path                | Web 设置已清空                       |
| A 冻结 | `gitlab-ctl stop puma` + `gitlab-ctl stop sidekiq`      | 写入冻结、postgres/redis 仍在运行    |
| A 备份 | `sudo gitlab-backup create`                             | 生成 `*_gitlab_backup.tar` 且非 0    |
| A 配置 | `sudo tar -czvf gitlab-config.tar.gz /etc/gitlab`       | 包内含 `gitlab-secrets.json`         |
| A 一键 | `sudo bash gitlab-migrate-backup.sh`（可选，替代上面三步） | 产物与校验全部通过              |
| A 传输 | `scp` 两个文件到 B                                      | B 的 `/tmp/` 有文件                  |
| B 准备 | 建目录 + 编写 `.env`（版本钉死、URL 改 IP）             | `.env`/`docker-compose.yml` 就绪     |
| B 配置 | 恢复配置到 config 目录，**改 gitlab.rb 的 external_url 与 SSH 端口** | 两处 grep 验证通过 |
| B 备份 | 备份包放入 `data/backups/`，容器内 `chown git:git`      | 属主为 git、权限 600                 |
| B 启动 | `docker compose up -d` + `update-permissions`           | 日志出现 `gitlab Reconfigured!`      |
| B 恢复 | 停 puma/sidekiq → `yes \| gitlab-backup restore BACKUP=<前缀>` | 恢复完成、无 Permission denied |
| B 重启 | `gitlab-ctl reconfigure` → `docker restart gitlab`      | 服务正常                             |
| C 验证 | 访问 IP 不跳转、登录、2FA、SSH 2222 连接                | 全部通过                             |
| C 深度 | `gitlab:doctor:secrets`、`gitlab:git:check`、`db:migrate:status` | 无大量失败                  |
| D 收尾 | 更新 remote/Runner/集成，关闭 A                         | 迁移完成                             |

## 9. 核心风险提示

| 风险点                                    | 后果                                                         | 规避措施                                                     |
| ----------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| `gitlab-secrets.json` 未迁移或使用新生成版本 | CI 变量永久失效、2FA 用户无法登录、Runner 认证失败            | 3.4 必须打包并校验包内容；4.2 必须确认文件来源                |
| 恢复的 `gitlab.rb` 未改 `external_url`    | 持续重定向到旧域名                                           | 4.2 sed 修改并 grep 验证（`.env` 不会覆盖，勿依赖它）         |
| 未改 `gitlab_shell_ssh_port`              | SSH 克隆端口仍为 22，映射的是 2222，SSH 克隆连不上            | 4.2 一并修改并 grep 验证                                     |
| 误认为 `.env` 的 `GITLAB_OMNIBUS_CONFIG` 会覆盖 gitlab.rb | 上述两项配置失效，迁移"看起来成功"实则 URL/SSH 错乱 | 理解 4.1 的 ⚠️ 说明：配置已恢复时环境变量不生效              |
| 备份前全量 `gitlab-ctl stop`              | 数据库被停，备份命令直接失败                                 | 只停 puma/sidekiq（3.2）                                     |
| 容器 SSH 映射宿主机 22                    | 与宿主机 sshd 冲突，容器启动失败                             | 固定映射 `2222:22`（4.1）                                    |
| 恢复前未停 puma/sidekiq                   | 恢复过程中应用进程干扰数据库                                 | 4.5 先停再恢复                                               |
| 备份文件/目录权限错误                     | 恢复时 `Permission denied`                                   | 容器内 `chown git:git` + `chmod 600`；目录用 `update-permissions`，勿整体 `chown -R` |
| 手抄 `BACKUP=` 前缀出错                   | 恢复报"备份文件不存在"                                       | 4.5 用脚本自动提取前缀，不要手打                             |
| 版本或 CE 类型不匹配                      | 恢复直接失败或数据损坏                                       | 迁移前严格预检镜像 tag（2.1）                                |
| 恢复前未冻结写入                          | 备份包数据不一致                                             | 3.2 先停 puma/sidekiq 再备份                                 |
| 服务器 A 继续运行                         | 两套实例同时处理邮件/webhook                                 | 验证通过后停止 A 并禁用定时任务                              |
| 忘记更新 Runner 与外部集成回调地址        | Runner 离线、OAuth/Webhook 静默失效                          | 6.3 逐一更新 Runner `config.toml` 与回调地址                 |
