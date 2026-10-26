---
title: GitLab 版本升级
description: "GitLab 版本升级（docker-compose 部署版本）：升级路径、备份、逐版本升级、验证与回退全流程"
slug: "/cloud-native/docker/gitlab-upgrade"
hide_table_of_contents: false
keywords: ["Docker", "GitLab"]
tags: ["Docker", "GitLab", "CloudNative"]
date: 2026-10-26
categories: ["Docker"]
---

## GitLab 版本升级（docker-compose 部署版本）

> 适用对象：按 [Docker 构建 GitLab](../Docker构建GitLab/Docker构建GitLab.md) 部署的 GitLab CE 实例（`.env` + `docker-compose.yml` 方式）
> 若你的实例是从物理机 Omnibus 迁移而来，应先完成迁移（见 [GitLab 迁移](../GitLab迁移/GitLab迁移.md)），迁移稳定后再按本文升级

升级 = 修改 `.env` 中的镜像版本号 → 重启容器，**每个版本约 5–15 分钟**。本文以 CE 17.4.1 升到目标版本为例，全程不涉及 EE。

开始前先记住两条铁律：

1. **必须走官方升级路径，禁止跳版本**：GitLab 每年发布一个大版本（major，如 17 → 18）、每月一个小版本（minor）。**跨 major 必须先升到旧 major 的最新 minor**（如 17.4 → 17.11.x → 18.0），不能直接从 16.x 跳 18.x；minor 之间按列表逐版本升级；
2. **每个版本升级前必须备份**：数据包 + `/etc/gitlab` 配置包（含 `gitlab-secrets.json`）。备份只能在**同版本**恢复，升级完成、验证稳定前不要删除该版本的备份。

## 1. 定位合规升级路径（第一步，最重要）

GitLab 官方提供 **Upgrade Path** 工具，输入当前版本与目标版本，自动给出合规的最少升级步骤，无需自己推算。

网页版（浏览器打开，在能联网的机器上）：

[GitLab Upgrade Path 工具](https://gitlab-com.gitlab.io/support/toolbox/upgrade-path/)

命令行版（可在 Docker 中执行）：

```bash
# 示例：从 17.4.1 升到最新版本
docker run --rm -it \
  -e SOURCE_VERSION=17.4.1 \
  -e TARGET_VERSION=latest \
  registry.gitlab.com/gitlab-org/support/toolbox/upgrade-path:latest
```

预期输出形如一条升级链：

```text
17.4.1 → 17.11.4 → 18.0.0 → 18.x.y ...
```

**记下这条链，后续按链上的版本逐个执行第 4 节**，跳过任何一步都可能失败。

## 2. 升级前准备

### 2.1 检查磁盘空间

每个版本的 reconfigure 与数据库迁移都需要临时空间，升级前后均需留足（建议至少为数据目录当前体积的 1 倍）：

```bash
df -h /data/runtime/docker/gitlab
```

### 2.2 备份数据包

```bash
cd Docker构建GitLab
docker compose exec gitlab gitlab-backup create
```

> 数据备份（`*_gitlab_backup.tar`，含数据库转储与仓库）**版本相关**：只能在创建它的 GitLab 版本上恢复。因此升级过程中每升一个版本都要重新备份（见 4.4），回退时必须先把镜像降回备份对应的版本（见第 6 节）。

### 2.3 备份配置包（含 gitlab-secrets.json）

配置文件不在数据备份包内，必须单独打包（`gitlab-secrets.json` 丢失会导致加密数据永久无法解密）：

```bash
docker compose exec gitlab tar -czf /var/opt/gitlab/backups/gitlab-config-$(date +%Y%m%d%H%M).tar.gz /etc/gitlab
```

> 配置包（`gitlab-config-*.tar.gz`）**版本无关**：`gitlab.rb`、`gitlab-secrets.json`、证书等在升级期间原样保留在 `/etc/gitlab` 卷中，reconfigure 直接复用，不会随版本改变。其中 `gitlab-secrets.json` 必须保持**同一份**（从首次部署/迁移沿用至今），**不要**按新版本重新生成，否则 CI 变量、2FA、Runner token 等加密数据永久失效。

将备份从容器拉回宿主机，并确认体积非 0：

```bash
docker cp gitlab:/var/opt/gitlab/backups/. /data/runtime/docker/gitlab/data/backups/
ls -lh /data/runtime/docker/gitlab/data/backups/
```

## 3. 修改 .env 镜像版本

编辑 `.env`，将 `GITLAB_IMAGE` 改为升级链上的**下一个**版本（示例：17.4.1 → 17.11.4）：

```bash
GITLAB_IMAGE=gitlab/gitlab-ce:17.11.4-ce.0
```

> minor 版本请填 Upgrade Path 给出的**确切版本**（如 17.11.4），不要用 `latest`；同一大版本内的 patch 升级（如 17.4.1 → 17.4.6）可小幅跳升。

## 4. 逐版本升级

### 4.1 拉取新镜像并重启

```bash
cd Docker构建GitLab
docker compose pull gitlab
docker compose up -d
```

### 4.2 等待 reconfigure 完成

```bash
docker compose logs -f gitlab
# 出现 "gitlab Reconfigured!" 后继续下一步
```

### 4.3 验证本版本

```bash
# 版本号确认
docker exec gitlab gitlab-rake gitlab:env:info | grep -E "Version|Edition"

# 数据库迁移全部完成（预期全部为 up）
docker exec gitlab gitlab-rake db:migrate:status

# 系统健康检查（预期无 FAILED）
docker exec gitlab gitlab-rake gitlab:check SANITIZE=true
```

### 4.4 重复直到目标版本

若升级链还有后续版本，回到第 3 节继续（**每升一个版本都要先做 2.2/2.3 的备份**），直到抵达目标版本。

## 5. 升级后收尾验证

全部版本升级完成后，做一次端到端验证：

| 检查项     | 通过标准                                        |
| ---------- | ------------------------------------------------ |
| Web 访问   | `GITLAB_EXTERNAL_URL` 正常打开、无 502 持续报错  |
| 用户登录   | 管理员与原用户均可登录                           |
| 2FA        | 原 2FA 验证码可用（说明 secrets 未受影响）       |
| 项目与代码 | 抽查分支、标签、提交历史完整                     |
| Runner     | Runner 在线并能执行一次流水线                    |
| CI 变量    | 抽查 CI/CD 变量值可正常读取                      |
| SSH 克隆   | `ssh -p 2222 git@<服务器IP>` 返回欢迎语          |

确认稳定后，按第 2.2/2.3 再备份一次（备份当前最终版本），并清理早期版本的临时备份（可选）。

## 6. 回退方案

升级失败或验证不通过时，回退到上一个版本：

```bash
# ① 改回上一个版本的镜像 tag
GITLAB_IMAGE=gitlab/gitlab-ce:<上一版本>-ce.0

# ② 停容器，恢复该版本的备份
docker compose down
# 将上一版本的 *_gitlab_backup.tar 与 gitlab-config-*.tar.gz 放入对应目录
```

> **注意**：数据备份只能在**同版本**恢复。若已升级到 17.11.4 但备份是 17.4.1 的，需先回退镜像到 17.4.1 再恢复备份；回退后如无该版本备份，则无法恢复数据，这也是铁律 2 要求"每版本都备份"的原因。

## 7. 快速执行清单

| 步骤 | 动作                                                    | 完成标志                             |
| ---- | ------------------------------------------------------- | ------------------------------------ |
| 1    | Upgrade Path 工具查询升级链                              | 拿到逐版本列表                       |
| 2    | 磁盘空间检查 + 数据备份 + 配置包备份                     | 备份文件存在且非 0                   |
| 3    | `.env` 改 `GITLAB_IMAGE` 为链上下一个版本                | 版本号精确匹配                       |
| 4    | `docker compose pull && up -d`                          | 日志出现 `gitlab Reconfigured!`      |
| 5    | `env:info` / `db:migrate:status` / `gitlab:check`       | 版本正确、迁移全 up、无 FAILED       |
| 6    | 重复 3–5 直到目标版本                                    | 链上版本全部走完                     |
| 7    | 端到端验证（登录、2FA、Runner、CI、SSH）                 | 全部通过                             |
| 8    | 备份最终版本，稳定后清理早期备份                          | 最终版本已备份                       |

## 8. 核心风险提示

| 风险点                     | 后果                                     | 规避措施                               |
| -------------------------- | ---------------------------------------- | -------------------------------------- |
| 跳过升级路径中的版本       | 升级直接失败、数据库损坏                 | 严格按 Upgrade Path 链逐版本升级（第 1 节） |
| 升级前未备份或备份被删除   | 失败后无法回退数据                       | 每个版本升级前备份，稳定前保留（第 2/6 节） |
| 误用 `latest` tag          | 无法控制版本、路径不可预期               | `.env` 钉死精确版本号（第 3 节）       |
| 跨大版本前未升到旧 major 最新 minor | 数据库迁移报错、升级失败         | 17.x → 18.x 必须先到 17.11.x（第 1 节） |
| CE/EE 类型变更             | 类型混用导致数据损坏                     | 全程 CE，不切换类型                     |
| 升级后未验证就删旧备份     | 新版本异常时无备份可用                   | 验证稳定后再清理（第 5/6 节）          |
| 磁盘空间不足               | reconfigure/迁移中断                     | 升级前检查空间（第 2.1 节）            |
