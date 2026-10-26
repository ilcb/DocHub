---
title: Docker 路由劫持排查与解决方案
description: "Docker 路由劫持（网段冲突）的成因、排查方法、解决方案与预防措施"
slug: "/cloud-native/docker/route-hijack-troubleshooting"
hide_table_of_contents: false
keywords: ["Docker", "路由劫持", "网段冲突", "daemon.json", "bip", "default-address-pools"]
tags: ["Docker", "网络", "CloudNative"]
date: 2026-10-26
categories: ["Docker"]
---

# Docker 路由劫持排查与解决方案实战指南

## 前言：什么是 Docker 路由劫持

Docker 安装后会默认创建一个名为 `docker0` 的虚拟网桥，分配 `172.17.0.0/16` 网段；使用 `docker-compose`、`docker network create` 或 Portainer 等工具启动项目时，还会自动创建额外的桥接网络（`br-xxxxxx` 网桥），网段从 `172.18.0.0/16` 起依次分配。每一条 Docker 网桥都会在宿主机路由表中写入一条路由。

**路由劫持的本质**：当 Docker 使用的网段与宿主机所在网络（公司内网、VPN、云上 VPC 等）的网段重叠时，Linux 内核按最长前缀匹配选路，原本应该发往局域网或云端其他服务的数据包被错误地送入 Docker 网桥。由于目标主机不在该网桥的二层网络内，数据包被直接丢弃，造成网络中断。

这不是安全意义上的"劫持"，而是**网段冲突引发的路由黑洞**。其根源在于 Docker 分配网段时不感知宿主机所在网络环境，而它的默认地址池恰好落在最常用的私网范围内。

全文按以下顺序组织：原理 → 排查方法 → 应急处理 → 根本解决方案 → 特殊环境 → 预防措施。正在处理线上故障的读者可直接从第 3 章开始。

---

## 1. 原理

### 1.1 Docker 的网段分配机制

| 分配顺序 | 网段 | 说明 |
|---|---|---|
| 默认网桥 docker0 | `172.17.0.0/16` | 由 `daemon.json` 的 `bip` 控制 |
| 第 1 个自定义网络 | `172.18.0.0/16` | 每个网络消耗一个 /16 |
| 依次递增 | `172.19.0.0/16` ~ `172.31.0.0/16` | 共 15 个 /16 |
| 地址池耗尽后 | `192.168.*` 等 C 类段 | 与家用/办公网段重叠概率高 |

Docker 分配网段时只检查自己已占用的池子，不感知宿主机内网、VPN、VPC 的占用情况。而 `172.16.0.0/12`（覆盖 `172.16.0.0` ~ `172.31.255.255`）是公司内网和云 VPC 最常用的 B 类私网段，`192.168.*` 是家用路由器的常用段，因此冲突概率很高。

容器数量少时问题不易暴露；随着网络越建越多、地址池越用越深，冲突会逐步累积，最终导致宿主机与局域网的地址规划互相干扰。

查看当前生效的默认地址池：

```bash
docker info --format '{{json .DefaultAddressPools}}'
# 规划后应显示所配置的池，例如：[{"Base":"172.16.0.0/12","Size":20}]
```

### 1.2 路由冲突导致中断的过程

```text
宿主机所在网段：172.16.251.0/24（走物理网卡 ens192）
Docker 网桥路由：172.18.0.0/16 或更大的重叠段（走 br-xxxxxx）

ping 172.16.251.100 时，内核查路由表：
  本应命中 → 172.16.251.0/24 dev ens192
  实际命中 → 重叠的 Docker 网桥路由
结果：数据包进入 docker0/br-xxxx，目标主机不在该二层网络，包被丢弃
```

表现即为：外网可达，内网不通；或者时通时断；严重时执行 `docker network create` 的瞬间 SSH 连接被切断。

### 1.3 常见冲突来源与故障表现

常见冲突来源：

- **本地开发机**：公司内网网段、VPN 分配网段、VMware/VirtualBox 等虚拟机 NAT 网段
- **云上服务器**：VPC 网段（如 `172.16.0.0/12`）、云联网/专线连接的远端网段、RDS/Redis 等云产品内网网段
- **家用 NAS / 家庭实验室**：路由器 LAN 段（多为 `192.168.*`）、光猫/AP 默认段、软路由与 VPN 实验段

故障表现分两类：

- **显性故障**：执行网络操作后立即中断，如创建网络导致 SSH 断连、业务访问立即失败，问题指向明确
- **渐进式劣化**：不报错、能运行，但部分设备时通时断、互访异常，容易被误判为交换机、AP 或路由器故障。实际原因是 Docker 网段与局域网逐步重叠，路由与访问关系变得不可预测。这类问题排查时应将 Docker 网络纳入检查范围

---

## 2. 排查方法

无论本地还是云上，排查均按以下步骤执行。

### 2.1 查看路由表

```bash
ip route show
# 或
route -n
```

重点检查出口接口为 `docker0` 或 `br-xxxxxx` 的路由条目：

```text
Destination     Gateway         Genmask         Flags Metric Ref    Use Iface
172.17.0.0      0.0.0.0         255.255.0.0     U     0      0        0 docker0
172.18.0.0      0.0.0.0         255.255.0.0     U     0      0        0 br-abc123
```

`br-` 后面的字符串是对应 Docker 网络 ID 的前 12 位，可用于反查网络。

### 2.2 收集 Docker 网段并与环境网段比对

```bash
# 一行列出所有 Docker 网络的名称、子网、网关
docker network ls -q | xargs docker network inspect | grep -E '"(Name|Subnet|Gateway)"'
```

将列出的每个 `Subnet` 与以下网段对比，存在重叠即为嫌疑项：

| 环境 | 需比对的网段 |
|---|---|
| 本地机器 | 宿主机网卡网段（`ip addr`）、公司内网网段、VPN 分配网段、虚拟机 NAT 网段 |
| 云上服务器 | VPC 网段、云联网/专线远端网段、RDS/Redis 等云产品内网 IP 所在网段 |
| 家用 NAS | 路由器 LAN 网段、光猫/AP 默认网段 |

批量检测脚本见[附录 B](#b-网段收集与冲突检测脚本)。

### 2.3 连通性验证

```bash
# A. 测试外网（通常不受影响）
ping 114.114.114.114

# B. 测试局域网 / VPC 内目标机器
ping 192.168.1.100    # 替换为目标 IP

# 查看到目标 IP 实际使用的路由
ip route get 192.168.1.100
```

判定标准：A 通、B 不通，且 `ip route get` 显示去往 B 的流量走了 `docker0` / `br-xxx`，即可确定是路由劫持。

进一步验证容器侧连通性：

```bash
# 容器内测试到宿主机网关的连通性（出向）
docker exec -it <容器名> ping <宿主机网关 IP>

# 宿主机测试到容器 IP 的连通性（入向）
ping <容器 IP>

# 容器内验证 DNS 与出网全链路
docker exec -it <容器名> curl -I http://www.baidu.com

# DNS 解析专项测试，区分解析问题与路由问题
docker run --rm --dns=8.8.8.8 busybox nslookup <域名>
```

### 2.4 NAT 规则复核

修改网段后若仍不通，检查 NAT 与转发配置：

```bash
# MASQUERADE 规则应指向当前的 docker0 / br-xxxx 接口
iptables -L -t nat -n | grep POSTROUTING | grep MASQUERADE

# IP 转发必须开启
cat /proc/sys/net/ipv4/ip_forward   # 应为 1
```

---

## 3. 应急处理

先恢复网络，再执行第 4 章的根本解决方案。

### 3.1 删除冲突网络

适用于已定位到某个 Docker 网络与宿主机网络冲突的场景：

```bash
# ① 从路由表找到冲突网桥名（br- 后 12 位 = 网络 ID 前缀）
ip route

# ② 反查网络名称及所挂载的容器
docker network ls
docker network inspect <网络名> | grep -A 10 Containers

# ③ 先停止容器（compose 项目直接执行 docker-compose down）
docker stop <容器ID>

# ④ 删除网络，其路由会自动从内核路由表移除
docker network rm <网络ID>

# ⑤ 复核路由恢复情况
ip route
```

注意操作顺序：必须先停止容器、再删除网络。若在容器运行时删除网络，其中的服务会立即中断。

### 3.2 SSH 中断后的恢复

创建网络导致 SSH 断连且无法重连时，通过以下途径登录宿主机后按 3.1 处理：

- 云服务器：云控制台的 VNC / Web Shell
- 物理机：KVM 或接显示器

恢复后应立即执行第 4 章的根治方案，否则后续创建网络时问题会再次出现。

典型案例：某服务器执行 `docker network create` 后 SSH 立即断开（客户端报 `Socket error 10053`），且无法重连。原因是 Docker 默认在 `172.16.0.0/12` 内最多分配 15 个 /16 网段，耗尽后回落到 `192.168.*`，新建网络与宿主机管理网段发生冲突。临时通过 VNC 删除冲突网络恢复连接，随后通过修改 `daemon.json` 根治（见第 4 章）。

### 3.3 临时静态路由

仅作应急使用，重启后规则丢失，且容易造成路由混乱，不作为长期方案：

```bash
# 让被劫持网段的流量走回正确网关
sudo route add -net <被劫持网段> gw <正确网关>
```

---

## 4. 根本解决方案：规划 Docker 网段

核心做法是明确指定 Docker 的网段，不依赖自动分配，使其与业务网络完全隔离。由两个配置项实现：

| 配置项 | 作用范围 |
|---|---|
| `bip` | 默认网桥 `docker0` 的网段 |
| `default-address-pools` | 之后新建的自定义网络的地址池 |

### 4.1 网段选择

三个 RFC 1918 私有段的实际占用情况差别较大，选段前先评估所在环境：

| 私有段 | 实际占用情况 | 适用性 |
|---|---|---|
| `192.168.0.0/16` | 家庭路由器、光猫、AP、NAS 初始化向导的默认段，占用普遍 | 不适合，冲突概率最高 |
| `10.0.0.0/8` | 公司 VPN、云 VPC、虚拟化平台、开发测试网段常占用 | 空间大，但需仔细核对未占用部分 |
| `172.16.0.0/12` | 家庭与一般办公环境较少整段占用，覆盖范围 `172.16.0.0` ~ `172.31.255.255` | 家庭 NAS 环境可优先考虑 |

按环境选择：

| 所在环境 | 建议 Docker 网段 |
|---|---|
| 家庭 NAS / 软路由（LAN 在 `192.168.*`，VPN 常占 `10.*`） | `172.16.0.0/12`（`size: 20`），与 LAN、VPN 网段隔离 |
| 公司内网 / 云 VPC 在 `172.16.0.0/12` | `10.200.0.0/16` 等未占用段 |
| 公司内网在 `10.0.0.0/8` | `172.16.0.0/12` 中未占用段，或专用 `192.168.200.0/24` |
| 云上 | 避开云产品内网网段（RDS/Redis 常用 `10.*` 或 `172.*`） |

选择原则：

1. 选择一个完全不在自身任何网络环境中的私有网段
2. 局域网、Docker、VPN 三类网段不放在同一个大类内
3. 避开 `100.64.0.0/10`（CGNAT 段，部分运营商 NAT 与 Tailscale 类组网使用）
4. 禁止使用公网网段（部分资料示例中出现 `8.8.8.0/24` 等，属错误配置，会污染出网路由）

实践参考：某长期运行的家庭 NAS（Portainer/Dockhand 管理数十个容器），Docker 自动分配的网段逐步落入 `192.168.*`，与家庭 LAN 同大类，导致部分设备互访异常。处理方式为将默认地址池统一配置为 `172.16.0.0/12`（size=20），并将存量网络逐个迁移至该段内，此后新建网络均自动落在规划池内。

### 4.2 配置方法

**Linux** —— 修改 `/etc/docker/daemon.json`（JSON 文件中不能包含注释，包括中文注释）：

```json
{
  "registry-mirrors": ["https://你的镜像加速器地址"],
  "insecure-registries": ["192.168.88.88:8888"],
  "bip": "10.200.0.1/24",
  "default-address-pools": [
    {"base": "10.201.0.0/16", "size": 24},
    {"base": "10.202.0.0/16", "size": 24}
  ]
}
```

`size: 24` 表示从 `10.201.0.0/16` 大池中按 /24 切分，单个 /16 可提供 256 个独立网络，避免默认机制"15 个 /16 耗尽后回落 192.168"的问题。

家庭 NAS 环境（LAN 在 `192.168.*`）可将地址池整体换为 172 段：

```json
{
  "default-address-pools": [
    {"base": "172.16.0.0/12", "size": 20}
  ]
}
```

docker0 默认的 `172.17.0.1/16` 虽在该大段内，但与家庭 LAN 不冲突，通常无需修改 `bip`；若创建网络时报 `pool overlaps` 错误，再将 `bip` 移出该大段。

群晖（Container Manager）等 NAS 系统的配置文件路径可能与 `/etc/docker/daemon.json` 不同，配置规则一致。修改后必须重启 Docker daemon，地址池配置不支持热加载。

**Docker Desktop（macOS / Windows）** —— 设置界面无法直接修改网段，需编辑配置文件：

- macOS：`~/.docker/daemon.json`
- Windows：`%USERPROFILE%\.docker\daemon.json`

```json
{
  "bip": "10.200.0.1/24",
  "default-address-pools": [
    {"base": "10.201.0.0/16", "size": 24}
  ]
}
```

```bash
# macOS 重启 Docker Desktop
osascript -e 'quit app "Docker"' && open -a Docker
```

```powershell
# Windows（PowerShell）重启 Docker Desktop
& 'C:\Program Files\Docker\Docker\Docker Desktop.exe' -shutdown
Start-Process 'C:\Program Files\Docker\Docker\Docker Desktop.exe'
```

### 4.3 重启与验证（Linux）

```bash
# ① 备份现有配置
sudo cp /etc/docker/daemon.json /etc/docker/daemon.json.bak

# ② 停止服务，删除旧网桥（重启后按新配置自动重建）
sudo systemctl stop docker && sudo systemctl stop containerd
sudo ip link delete docker0

# ③ 启动服务
sudo systemctl start docker

# ④ 验证
ip addr show docker0                                  # 确认 bip 生效
docker info --format '{{json .DefaultAddressPools}}'  # 确认地址池生效
docker network create test-net && \
  docker network inspect test-net | grep Subnet       # 确认新网络落在新池
ip route | grep -E 'docker0|br-'                      # 确认路由无旧网段残留
```

验证通过后清理残留：

```bash
# 删除已停止的容器（按需，先确认）
docker rm -f $(docker ps -aq)

# 清理无用的自定义网络
docker network prune

# 复核路由
ip route | grep -E 'docker0|br-'
```

### 4.4 存量网络迁移

`default-address-pools` 仅对之后新建的网络生效，已存在的旧网络不会自动迁移。只改配置不迁移存量，旧网络仍会留在冲突网段中。处理原则：数据卷必须保留，网络可以重建。

迁移步骤：

```text
识别旧网段 → 停止相关 stack → 按新子网重建网络 → 启动容器 → 验证
```

1. 确认绑定了该网络的容器：`docker network inspect <网络名>`
2. 记录网络名与 IPAM 配置，形成迁移清单
3. 停止对应的 stack / compose 项目
4. 删除旧网络，按新子网重建；或删除 compose 中写死的 `subnet`，交由新地址池自动分配
5. 启动容器，逐项确认服务可达

两点注意：

- 必须先停止容器再删除网络，顺序颠倒会导致服务中断
- 需同步修改 compose / Portainer / Dockhand 中写死的 `ipam.config.subnet`，否则下次部署会恢复旧网段

迁移后验证三项：

1. 地址池生效：`docker info --format '{{json .DefaultAddressPools}}'` 输出新配置
2. 残留清零：现有网络中无冲突网段
3. 服务恢复：迁移的服务正常启动、相互可访问、外部可达

补充说明：既然目标是网段规划可控，规划范围之外的所有网段（不限于 `192.168.*`）都应一并迁移。默认地址池只覆盖 bridge 网络，`macvlan`、`ipvlan`、Swarm `overlay` 的地址逻辑不同，需单独规划。

---

## 5. 显式指定网段（不停机场景）

线上无法重启 Docker 时，可不依赖自动分配，为每个项目显式指定网段：

```yaml
# docker-compose.yml
networks:
  backend:
    driver: bridge
    ipam:
      config:
        - subnet: "10.210.1.0/24"
          gateway: "10.210.1.1"

services:
  app:
    networks:
      - backend
```

注意事项：

1. 每个项目使用独立的 subnet，已使用的网段登记台账，避免项目间冲突
2. 显式声明的 subnet 不经过默认地址池。这带来精确控制，但也意味着配置错误会被固化，修改配置时需同步检查各项目的声明
3. 应急访问 RDS 等外部服务时，可用 `extra_hosts` 固定域名解析：

```yaml
services:
  app:
    extra_hosts:
      - "database.rds.internal:172.31.0.100"
```

---

## 6. 特殊环境处理

### 6.1 VPN 冲突

现象：连接 VPN 后无法访问 Docker 容器，或连接 VPN 后宿主机网络异常。

```bash
# 查看 VPN 分配的网段
ifconfig | grep -A 1 "utun"    # macOS
ipconfig /all                  # Windows
```

处理方式：

- VPN 网段与 Docker 网段重叠时，按第 4 章调整 Docker 网段（根本解决）
- 短期内无法调整时，连接 VPN 后手动添加更精确的路由（临时方案，见 3.3）

典型场景：公司 VPN 使用 `172.18.0.0/16`，本地 compose 项目自动分配的网络恰好也是该网段，连接 VPN 后两边同时异常。将 Docker 网段调整到规划的专属段后问题消除。

### 6.2 云上生产环境

操作原则与第 4 章相同，需额外注意：

1. 修改前在云控制台确认 VPC 网段，并逐一核对 RDS、Redis 等云产品的内网 IP 段
2. 修改前备份 `daemon.json` 并保存路由表快照（`ip route > /root/route.bak`）
3. 在业务低峰期操作，先从负载均衡摘除节点、停止容器，再执行修改
4. 修改后按 4.3 节验证，通过后再恢复流量

### 6.3 Kubernetes

K8s 的 Pod 网段与 Service 网段也会写入路由表，需一并检查。常见默认值：

| 方案 / 发行版 | 默认 Pod 网段 |
|---|---|
| Flannel | `10.244.0.0/16` |
| Calico | `192.168.0.0/16` |
| K3s | `10.42.0.0/16` |
| kubeadm Service 网段 | `10.96.0.0/12` |

```bash
# 查看 Calico 的 IP 池
kubectl get ippools.crd.projectcalico.org -o yaml | grep cidr
```

处理方式：

- Pod CIDR / Service CIDR 与 VPC 或 Docker 网段冲突时，在云厂商容器服务控制台调整；部分云厂商不支持修改存量集群网段，需重建集群
- K3s 可在安装时通过 `--cluster-cidr` / `--service-cidr` 参数指定
- 同一节点上 K8s 与独立 Docker 并存时，两侧网段不得重叠

---

## 7. 预防措施

### 7.1 网段规划

在部署前确定网段规划，示例划分：

```text
开发环境业务网段：10.10.0.0/16
测试环境业务网段：10.20.0.0/16
生产环境业务网段：10.30.0.0/16
Docker 保留网段：  10.201.0.0/16 ~ 10.202.0.0/16
```

所有主机统一使用相同的 `daemon.json` 基线；家庭 NAS 环境可按 4.1 节改用 172 段基线。已使用的 Docker 网段登记到统一台账，新建项目先查台账再领号。

### 7.2 部署前检查清单

- [ ] 已收集宿主机网卡、公司内网、VPN、云 VPC、云产品内网网段
- [ ] `daemon.json` 已配置 `bip` 与 `default-address-pools`，与上述网段无重叠
- [ ] `docker info --format '{{json .DefaultAddressPools}}'` 确认地址池生效
- [ ] compose / 管理工具中无规划段外硬编码的 `ipam.config.subnet`
- [ ] 已用网段登记台账

### 7.3 日常维护

```bash
# 定期清理无用的网络，释放地址池
docker network prune

# 巡检：检查是否存在规划段外的路由
ip route | grep -E 'docker0|br-'
```

网络配置可纳入配置管理工具（Ansible/Terraform）统一下发，变更走版本管理与评审。

---

## 8. 常见问题

**Q1：修改 `bip` 后，已有容器需要重建吗？**

需要。修改会重建 `docker0`，使用默认 bridge 网络的容器需重新创建。

**Q2：修改了 `bip`，为什么新建的网络还是旧网段？**

`bip` 只控制默认的 `bridge` 网络。自定义网络的网段由 `default-address-pools` 或创建时的 `--subnet` 决定，且已存在的网络不受新配置影响，需删除重建。

**Q3：修改了 `default-address-pools`，旧网络仍在 `192.168.*` 怎么办？**

地址池仅对之后新建的网络生效，存量网络需按 4.4 节逐个迁移，并同步清理 stack 中写死的旧 subnet。

**Q4：云上修改 Docker 网段会影响在跑的业务吗？**

会。修改需要重启 Docker，所有容器中断。应在业务低峰期操作，并提前摘除节点、停止容器，步骤见 6.2 节。

**Q5：能否不重启 Docker 解决路由冲突？**

可以。冲突的自定义网络可直接删除并按新网段重建，不影响 Docker 进程；默认 `docker0` 网段的修改则必须通过重启生效。

**Q6：Portainer / Dockhand 等管理工具新建的网络会遵循新地址池吗？**

stack 未显式指定 `ipam.config.subnet` 时走默认地址池；显式指定则绕过默认池。需在管理工具内做源头检查：修改到规划池内的网段，或删除显式 subnet 配置。

**Q7：按文档修改后问题仍存在，按什么顺序检查？**

1. `docker network ls -q | xargs docker network inspect` 全量检查是否仍有其他冲突网段
2. `cat /proc/sys/net/ipv4/ip_forward` 是否为 1
3. 宿主机防火墙 / 云安全组规则是否放行
4. `iptables -L -t nat -n` 确认 `MASQUERADE` 指向新网桥
5. 云上再检查 VPC 路由表与安全组策略

---

## 9. 附录

### A. 命令速查表

| 用途 | 命令 |
|---|---|
| 查看宿主机路由表 | `ip route show` |
| 查看到目标 IP 的实际路由 | `ip route get <IP>` |
| 列出 Docker 网络及网段 | `docker network ls -q \| xargs docker network inspect \| grep -E '"(Name\|Subnet\|Gateway)"'` |
| 查看 Docker 默认地址池 | `docker info --format '{{json .DefaultAddressPools}}'` |
| 查看某网络的容器 | `docker network inspect <网络名>` |
| 删除冲突网络 | `docker network rm <网络ID>` |
| 清理无用网络 | `docker network prune` |
| 删除 docker0（重启自动重建） | `sudo ip link delete docker0` |
| 补临时路由 | `sudo route add -net <网段> gw <网关>` |
| 查 NAT 规则 | `iptables -L -t nat -n \| grep MASQUERADE` |
| 查 IP 转发 | `cat /proc/sys/net/ipv4/ip_forward` |

### B. 网段收集与冲突检测脚本

**一键收集**（本机全部 Docker 网络的网段、网关、容器）：

```bash
#!/bin/bash
echo "========== Docker 网络 =========="
docker network ls

echo -e "\n========== 子网与网关 =========="
docker network ls --quiet | xargs docker network inspect \
  | grep -E '"(Name|Subnet|Gateway)"'

echo -e "\n========== 网络与容器对应 =========="
for net_id in $(docker network ls -q); do
  name=$(docker network inspect $net_id --format '{{.Name}}')
  containers=$(docker network inspect $net_id --format '{{range .Containers}}{{.Name}} {{end}}')
  [ -n "$containers" ] && echo "网络: $name  容器: $containers"
done
```

**冲突检测**（同时对照环境中要避开的网段与本机现有 Docker 网络，部署前执行一次）：

```python
#!/usr/bin/env python3
"""用法：python3 check_conflict.py 10.201.0.0/16
使用前先修改 AVOID 列表为所在环境的真实网段。"""
import subprocess, json, ipaddress, sys

# 所在环境中已占用的真实网段（按需增删）
AVOID = [
    "10.0.0.0/8",       # 公司 VPN / 云 VPC 常用
    "172.16.0.0/12",    # 公司内网常用（若 Docker 段恰好选 172 则删除此行）
    "192.168.0.0/16",   # 家庭 / 办公网常用
    "100.64.0.0/10",    # CGNAT，Tailscale 类组网使用
]

candidate = ipaddress.ip_network(sys.argv[1], strict=False)
print(f"候选网段: {candidate}")

ok = True
for cidr in AVOID:
    if candidate.overlaps(ipaddress.ip_network(cidr, strict=False)):
        print(f"  [冲突] 与环境网段 {cidr} 重叠")
        ok = False

for nid in subprocess.check_output("docker network ls -q", shell=True).decode().split():
    info = json.loads(subprocess.check_output(
        f"docker network inspect {nid}", shell=True).decode())[0]
    subnet = info.get('IPAM', {}).get('Config', [{}])[0].get('Subnet', '')
    if subnet and candidate.overlaps(ipaddress.ip_network(subnet, strict=False)):
        print(f"  [冲突] 与现有 Docker 网络 {info['Name']} ({subnet}) 重叠")
        ok = False

print("  [可用] 无冲突" if ok else "  [失败] 存在冲突，请更换网段")
sys.exit(0 if ok else 1)
```

### C. 参考来源

1. [Docker路由劫持故障排查与解决方案：本地机器与云上服务器实战指南 - 技术栈](https://jishuzhan.net/article/2072544566749786114)
2. [Docker桥接网络生成路由表和主机的路由冲突解决 - 腾讯云开发者社区](https://cloud.tencent.com/developer/article/2370373)
3. [Docker网络冲突排查指南：从网段重叠到路由异常的完整方案 - CSDN](https://blog.csdn.net/weixin_31528001/article/details/166604618)
4. [如何解决Docker容器由于网络子网冲突导致的路由转发失效 - php中文网](https://www.php.cn/faq/2448452.html)
5. [Docker网络冲突排查与解决方案：完整指南 - 技术栈](https://jishuzhan.net/article/2010253545124708353)
6. [创建docker网络导致SSH连接断开的解决方法 - CSDN](https://blog.csdn.net/u013007181/article/details/139832581)
7. [Docker网络冲突排查与解决方案的完整指南 - 脚本之家](https://www.jb51.net/server/363125mbo.htm)（与来源 5 同源，补充 CGNAT 网段与容器级诊断命令）
8. [Docker 容器太多导致网段冲突：把自动分配网络统一迁回 172 私有段的完整记录 - margrop's blog](https://blog.margrop.net/post/docker-network-subnet-conflict-migration-record/)（NAS 迁移实录，172 段选型依据与存量迁移方法）
