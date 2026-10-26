---
title: 安装 K3s（离线）
description: "K3s 离线安装（airgap）教程：自定义数据目录 + 外部 MySQL 数据库，Server/Agent 节点离线安装、验证与常见问题"
slug: "/cloud-native/orchestration/install-k3s-airgap"
hide_table_of_contents: false
keywords: ["K3s", "离线安装", "airgap", "MySQL", "Kubernetes"]
tags: ["K3s", "CloudNative", "Kubernetes"]
date: 2026-10-26
categories: ["Orchestration"]
---

# 安装 K3s（离线）

> 适用场景：服务器无法访问外网（无法 `curl get.k3s.io`），但内网可相互通信。
> 在线安装请参照 [安装 K3s](../安装K3s/安装K3s.md)；两者的**集群规划与前置准备完全相同**，本文只讲离线差异部分。
>
> **本文示例为「自定义数据目录 + 外部 MySQL」架构**：数据目录指定为 `/data/runtime/k3s`，K3s 的集群状态存储到外部 MySQL 8.0。若不需要外部数据库（默认嵌入式 SQLite），文中已标注差异命令，按标注替换即可。

K3s 离线安装（官方 airgap 模式）的原理：把 **k3s 二进制**与**内置镜像包**（coredns、traefik、metrics-server 等集群组件镜像）在有网机器下载好，随安装脚本一起拷入离线服务器；安装时用 `INSTALL_K3S_SKIP_DOWNLOAD=true` 跳过联网下载，仅使用本地文件。

> ⚠️ 关键约束：**k3s 二进制与镜像包必须同版本**（本文均为 `v1.37.1+k3s1`），混用会导致组件镜像拉取失败。

## 1. 集群规划

| 服务器 ip    | 主机名       | 角色 | 配置 |
| ----------- | ---------- | ---- | ---- |
| 192.168.0.110 | mysql01    | MySQL 8.0（外部数据存储） | |
| 192.168.0.115 | k3s-master | K3s Server（control plane） | |
| 192.168.0.120 | k3s-node01 | K3s Agent | |
| 192.168.0.125 | k3s-node02 | K3s Agent | |

> 前置准备（禁用 SELinux、防火墙、配置 hosts、设置主机名、时间同步）与在线安装**完全一致**，直接按 [安装 K3s](../安装K3s/安装K3s.md) 的 2.x 节在所有节点执行完毕即可。

## 2. 安装模式与关键参数

### 2.1 数据存储模式选择

| 模式 | datastore 配置 | 适用场景 |
| ---- | -------------- | -------- |
| 默认（嵌入式 SQLite） | 不设置任何参数 | 单 Server 简单集群，数据在本地 data-dir |
| 外部 MySQL / MariaDB | `--datastore-endpoint`（或环境变量 `K3S_DATASTORE_ENDPOINT`） | 数据独立存储、便于备份，未来可平滑扩展多 Server |

官方认证的数据库版本：**MySQL 8.0 / 8.4**、MariaDB 10.11 / 11.4。

### 2.2 自定义数据目录（--data-dir）

默认数据目录为 `/var/lib/rancher/k3s`。指定 `--data-dir /data/runtime/k3s` 后，**以下路径会跟随变化**，务必注意：

- 镜像包目录：`<data-dir>/agent/images/`（Server 与 Agent 都要放，且 data-dir 必须一致）
- Server 令牌：`<data-dir>/server/node-token`
- 集群数据：`<data-dir>/server/db`、`<data-dir>/agent` 等

### 2.3 外部数据库连接串

连接串格式（官方）：

```text
mysql://username:password@tcp(hostname:3306)/database-name
```

- 指定的数据库**不存在时 K3s 会自动创建**（数据库账号需有 CREATE 权限）
- **推荐用环境变量 `K3S_DATASTORE_ENDPOINT` 传递**，避免密码出现在进程信息（`ps`）中
- 密码含 `@ : /` 等特殊字符时需按 URL 编码转义（如 `@` 写 `%40`）
- K3s 已知问题：连接串**不能设置 `tls` 参数**
- **不支持多主数据库**（Galera 等设置了 `auto_increment_increment` / `auto_increment_offset` > 1 的集群不可用）

## 3. 离线安装包准备（在有网机器上）

### 3.1 下载三件套

版本固定为 `v1.37.1+k3s1`（与目标集群版本一致），下载地址：

[K3s Releases](https://github.com/k3s-io/k3s/releases/tag/v1.37.1+k3s1)

```bash
mkdir -p /tmp/k3s-offline && cd /tmp/k3s-offline

VERSION=v1.37.1+k3s1
BASE=https://github.com/k3s-io/k3s/releases/download/${VERSION}

# ① k3s 二进制
curl -fSL "${BASE}/k3s" -o k3s

# ② 内置镜像包（.zst 压缩版体积最小，containerd 原生支持）
curl -fSL "${BASE}/k3s-airgap-images-amd64.tar.zst" -o k3s-airgap-images-amd64.tar.zst

# ③ 校验文件
curl -fSL "${BASE}/sha256sum-amd64.txt" -o sha256sum-amd64.txt

# ④ 安装脚本（get.k3s.io）
curl -fSL "https://get.k3s.io" -o install.sh
```

> 下载前确认机器架构为 amd64/x86_64；ARM 机器请下载 `k3s-airgap-images-arm64.tar.zst` 等对应文件。

### 3.2 校验文件完整性

```bash
cd /tmp/k3s-offline
sha256sum -c sha256sum-amd64.txt --ignore-missing k3s k3s-airgap-images-amd64.tar.zst
# 预期两条均输出：OK
```

### 3.3 分发到所有节点

三个文件（k3s、镜像包、install.sh）要拷到**每个 K3s 节点**（Server 和 Agent 都需要镜像包）：

```bash
for ip in 192.168.0.115 192.168.0.120 192.168.0.125; do
    scp /tmp/k3s-offline/{k3s,k3s-airgap-images-amd64.tar.zst,install.sh} root@${ip}:/tmp/k3s-offline/
done
```

## 4. 准备 MySQL 数据库

在 MySQL 服务器（192.168.0.110）上创建 K3s 使用的数据库与账号。可通过本库 [Docker 构建 MySQL](../../../Docker/Docker构建MySQL/Docker构建MySQL.md) 部署，或使用系统自带 MySQL：

```bash
mysql -uroot -p
```

```sql
-- 数据库（utf8mb4，K3s 需要；若账号无 CREATE 权限也可只建库，K3s 会自动建表）
CREATE DATABASE IF NOT EXISTS k3s CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- 专用账号（密码替换为你的强密码；K3s 会自动建表，故授予该库全部权限即可）
CREATE USER 'k3s'@'%' IDENTIFIED BY '<MySQL密码>';
GRANT ALL PRIVILEGES ON k3s.* TO 'k3s'@'%';
FLUSH PRIVILEGES;
```

验证连接串可达：

```bash
mysql -h192.168.0.110 -uk3s -p'<MySQL密码>' k3s -e "SELECT 1;"
```

## 5. Server 节点离线安装（192.168.0.115）

### 5.1 放置二进制与镜像包

> 本文数据目录为 `/data/runtime/k3s`，**镜像包放在 `<data-dir>/agent/images/`**；若用默认目录则放 `/var/lib/rancher/k3s/agent/images/`。

```bash
cd /tmp/k3s-offline

# 安装 k3s 二进制
sudo cp k3s /usr/local/bin/k3s
sudo chmod +x /usr/local/bin/k3s

# 创建镜像目录并放入镜像包（目录跟随 --data-dir）
sudo mkdir -p /data/runtime/k3s/agent/images/
sudo cp k3s-airgap-images-amd64.tar.zst /data/runtime/k3s/agent/images/

# 核对
ls -lh /usr/local/bin/k3s /data/runtime/k3s/agent/images/
```

### 5.2 离线安装 Server（自定义数据目录 + 外部 MySQL）

**方式一（推荐，以 root 执行，避免 sudo 传递环境变量的问题）：**

```bash
sudo -i          # 切换到 root shell（后续命令在 root 下执行）

export INSTALL_K3S_SKIP_DOWNLOAD=true
export K3S_DATASTORE_ENDPOINT='mysql://k3s:<MySQL密码>@tcp(192.168.0.110:3306)/k3s'

sh install.sh \
    --data-dir /data/runtime/k3s \
    --write-kubeconfig ~/.kube/config \
    --write-kubeconfig-mode 666 \
    --disable traefik
```

**方式二（不切换 root，用 sudo）：**

```bash
sudo INSTALL_K3S_SKIP_DOWNLOAD=true \
    K3S_DATASTORE_ENDPOINT='mysql://k3s:<MySQL密码>@tcp(192.168.0.110:3306)/k3s' \
    sh install.sh \
    --data-dir /data/runtime/k3s \
    --write-kubeconfig ~/.kube/config \
    --write-kubeconfig-mode 666 \
    --disable traefik
```

> **不使用外部 MySQL 的默认模式**：去掉 `K3S_DATASTORE_ENDPOINT` 环境变量即可（嵌入式 SQLite）。参数 `--data-dir`、`--disable traefik` 均按需保留。

安装完成后自动注册为 systemd 服务（`k3s`），并安装 `kubectl`、`crictl`、`ctr`、`k3s-killall.sh`、`k3s-uninstall.sh`。

### 5.3 验证并获取 Agent 注册令牌

```bash
kubectl get node -o wide
# 预期：k3s-master 处于 Ready

# 供 Agent 节点加入集群使用（路径跟随 --data-dir）
sudo cat /data/runtime/k3s/server/node-token
# 形如：K10eb7d903c4a9fc0abaf9f61856f54b50a9a5c3a9680d8ed8b6c26bdce83c1dff4::server:2025f3e45d5e705909bca242471ce6cf

# 确认外部数据库已写入（可选）
mysql -h192.168.0.110 -uk3s -p'<MySQL密码>' k3s -e "SHOW TABLES;" | head
# 预期：kine 相关表（如 kine、kine_meta）已自动创建
```

## 6. Agent 节点离线安装（192.168.0.120 / 192.168.0.125）

### 6.1 放置二进制与镜像包（与 5.1 相同）

在每个 Agent 节点执行（**data-dir 必须与 Server 一致**，否则 Agent 本地组件镜像加载不到）：

```bash
cd /tmp/k3s-offline

sudo cp k3s /usr/local/bin/k3s
sudo chmod +x /usr/local/bin/k3s

sudo mkdir -p /data/runtime/k3s/agent/images/
sudo cp k3s-airgap-images-amd64.tar.zst /data/runtime/k3s/agent/images/
```

> Agent 节点也**必须**放入镜像包：集群组件（如 kube-proxy、flannel 等）会在 Agent 上运行，需要本地镜像。

### 6.2 离线加入集群

将 `K3S_URL` 指向 Server 地址、`K3S_TOKEN` 替换为 5.3 获取的令牌值（Agent **无需**配置 datastore，通过 Server 访问数据库）：

```bash
# 192.168.0.120
sudo INSTALL_K3S_SKIP_DOWNLOAD=true \
    K3S_URL=https://192.168.0.115:6443 \
    K3S_TOKEN=K10eb7d903c4a9fc0abaf9f61856f54b50a9a5c3a9680d8ed8b6c26bdce83c1dff4::server:2025f3e45d5e705909bca242471ce6cf \
    sh install.sh --data-dir /data/runtime/k3s

# 192.168.0.125（令牌相同）
sudo INSTALL_K3S_SKIP_DOWNLOAD=true \
    K3S_URL=https://192.168.0.115:6443 \
    K3S_TOKEN=K10eb7d903c4a9fc0abaf9f61856f54b50a9a5c3a9680d8ed8b6c26bdce83c1dff4::server:2025f3e45d5e705909bca242471ce6cf \
    sh install.sh --data-dir /data/runtime/k3s
```

安装完成后 Agent 注册为 systemd 服务 `k3s-agent`。

### 6.3 验证集群

在 Server 节点执行：

```bash
kubectl get node -o wide
# 预期：三个节点全部 Ready

kubectl get pods -A -o wide
# 预期：coredns、metrics-server、local-path-provisioner 等组件 Running
```

## 7. 一键安装脚本（可选，Server 版）

不想手动放置文件时，可用脚本完成「放二进制 → 放镜像包 → 离线安装（含 data-dir 与 MySQL）」：

```bash
#!/bin/bash
# K3s 离线安装脚本（Server 节点：自定义数据目录 + 外部 MySQL）
# 用法：以 root 执行  sudo -i && bash k3s-airgap-install.sh
set -euo pipefail

cd "$(dirname "$0")"

DATA_DIR="/data/runtime/k3s"                                   # 自定义数据目录
MYSQL_ENDPOINT='mysql://k3s:<MySQL密码>@tcp(192.168.0.110:3306)/k3s'   # 外部数据库

echo "[1/4] 放置 k3s 二进制"
cp k3s /usr/local/bin/k3s
chmod +x /usr/local/bin/k3s

echo "[2/4] 放置镜像包（${DATA_DIR}/agent/images/）"
mkdir -p "${DATA_DIR}/agent/images/"
cp k3s-airgap-images-amd64.tar.zst "${DATA_DIR}/agent/images/"

echo "[3/4] 离线安装 Server"
export INSTALL_K3S_SKIP_DOWNLOAD=true
export K3S_DATASTORE_ENDPOINT="$MYSQL_ENDPOINT"
sh install.sh \
    --data-dir "$DATA_DIR" \
    --write-kubeconfig ~/.kube/config \
    --write-kubeconfig-mode 666 \
    --disable traefik

echo "[4/4] 安装完成："
kubectl get node -o wide
echo "Agent 加入令牌：$(cat "${DATA_DIR}/server/node-token")"
```

> 使用默认嵌入式 SQLite 时，把 `MYSQL_ENDPOINT` 行注释掉即可。

## 8. 离线升级 K3s

离线环境升级与安装同理：**替换镜像包 + 替换二进制 + 重跑安装脚本 + 重启服务**。升级时**必须带上与原安装一致的 `--data-dir`（及 datastore 环境变量，如仍用外部 MySQL）**。建议先升级 Server 节点，再逐个升级 Agent 节点。

```bash
# ① 在有网机器下载目标版本三件套（新版本二进制、新版本镜像包、最新 install.sh），
#    并确保二进制与镜像包版本一致，校验 sha256（见 3.1/3.2）

# ② 每个节点：删除旧镜像包，放入新镜像包（目录跟随 data-dir）
sudo rm -f /data/runtime/k3s/agent/images/k3s-airgap-images-amd64.tar.zst
sudo cp k3s-airgap-images-amd64.tar.zst /data/runtime/k3s/agent/images/

# ③ 每个节点：替换 k3s 二进制
sudo cp k3s /usr/local/bin/k3s && sudo chmod +x /usr/local/bin/k3s

# ④ 重新执行安装脚本（参数与原安装保持一致）
#    Server 节点：
sudo -i
export INSTALL_K3S_SKIP_DOWNLOAD=true
export K3S_DATASTORE_ENDPOINT='mysql://k3s:<MySQL密码>@tcp(192.168.0.110:3306)/k3s'
sh install.sh \
    --data-dir /data/runtime/k3s \
    --write-kubeconfig ~/.kube/config \
    --write-kubeconfig-mode 666 \
    --disable traefik
#    Agent 节点（K3S_TOKEN 不变，取当前 Server 的 node-token）：
sudo INSTALL_K3S_SKIP_DOWNLOAD=true \
    K3S_URL=https://192.168.0.115:6443 \
    K3S_TOKEN=<node-token> \
    sh install.sh --data-dir /data/runtime/k3s

# ⑤ 重启 K3s 服务加载新镜像
sudo systemctl restart k3s          # Server 节点
sudo systemctl restart k3s-agent    # Agent 节点

# ⑥ 验证
k3s --version
kubectl get node -o wide
kubectl get pods -A -o wide
```

> 若升级失败，可将旧版本镜像包与旧二进制放回、重跑安装脚本并重启服务回退；外部 MySQL 场景建议升级前对数据库做备份（`mysqldump k3s` 或数据库快照）。

## 9. 常见问题

### 9.1 组件 Pod 一直 ImagePullBackOff

多为镜像包缺失或版本不匹配：

```bash
# 确认镜像包已放入且版本与 k3s 一致（注意目录跟随 data-dir）
ls -lh /data/runtime/k3s/agent/images/
k3s --version

# 放置/更换镜像包后需重启 k3s 才会重新加载
sudo systemctl restart k3s          # Server 节点
sudo systemctl restart k3s-agent    # Agent 节点
```

### 9.2 安装报错 Unable to find k3s

`INSTALL_K3S_SKIP_DOWNLOAD=true` 时安装脚本不会下载二进制，要求 `/usr/local/bin/k3s` 已就位（或 `INSTALL_K3S_BIN_DIR` 指定目录）。确认 5.1 步骤已执行、权限为可执行。

### 9.3 Server 启动失败：连接 MySQL 报错

- 确认连接串格式与可达性：`mysql -h<主机> -uk3s -p'<密码>' k3s -e "SELECT 1;"`
- 确认账号已授权 `k3s.*`（含 CREATE，K3s 会自动建库/建表）
- MySQL 版本须为官方认证版本（8.0 / 8.4 或 MariaDB 10.11 / 11.4）
- 密码含特殊字符时按 URL 编码转义（`@` → `%40` 等），或改用 `export K3S_DATASTORE_ENDPOINT` 方式避免引号/转义问题
- 查看详细日志：`sudo journalctl -u k3s -n 100` 或 `sudo journalctl -u k3s -f`

### 9.4 Agent 上组件 Pod 起不来，Server 正常

多为 **Agent 与 Server 的 `--data-dir` 不一致**：镜像包放到了别的目录，Agent 加载不到本地镜像。确认两端 `--data-dir` 相同（6.1）。

### 9.5 内网已有私有镜像仓库（Harbor 等）

可将 `--system-default-registry` 指向内网仓库，让 K3s 组件镜像从私有仓库拉取（替代本地镜像包）：

```bash
sh install.sh \
    --data-dir /data/runtime/k3s \
    --system-default-registry "harbor.xx.com/library" ...
```

### 9.6 卸载

与在线安装完全相同：

```bash
# Server 节点卸载（卸载前请先备份数据库）
/usr/local/bin/k3s-uninstall.sh

# Agent 节点卸载
/usr/local/bin/k3s-agent-uninstall.sh
```

## 10. 核心风险提示

| 风险点                           | 后果                             | 规避措施                                       |
| -------------------------------- | -------------------------------- | ---------------------------------------------- |
| 二进制与镜像包版本不一致         | 组件镜像拉取失败、Pod 无法运行   | 下载时固定同一 tag，校验 sha256（3.2）          |
| Agent 节点漏放镜像包             | Agent 上组件 Pod 起不来          | 每个节点都放镜像包（6.1）                       |
| **Agent 与 Server 的 `--data-dir` 不一致** | **Agent 加载不到本地镜像，组件 Pod 异常** | 两端 `--data-dir` 保持一致（6.1）   |
| 镜像包放错目录（默认目录 vs 自定义 data-dir） | 镜像加载失败           | 镜像包放 `<data-dir>/agent/images/`（5.1）      |
| 忘记 `INSTALL_K3S_SKIP_DOWNLOAD` | 安装脚本仍尝试联网下载，失败     | 安装命令必须带该变量（5.2/6.2）                 |
| MySQL 连接串错误 / 账号无权限     | Server 启动失败                 | 先 `mysql -e "SELECT 1"` 验证；账号授 `k3s.*` 权限（4） |
| 使用不支持的数据库版本/多主      | 数据写入异常或集群不可用         | 用官方认证版本（8.0/8.4），不用 Galera 多主（2.3） |
| **外部 MySQL 单点**              | **数据库故障则集群不可用**       | 数据库做主从/备份；按官方支持矩阵扩展多 Server 提高可用性 |
| 架构不匹配（arm64 机器用 amd64 包） | 镜像无法加载                     | 按节点架构下载对应 airgap 包（3.1）             |
| 前置准备未完成（防火墙/SELinux） | 节点间通信异常                   | 先按在线文档 2.x 完成前置准备                   |
