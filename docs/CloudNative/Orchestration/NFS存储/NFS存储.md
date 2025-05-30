---
title: NFS 存储
description: "NFS 存储"
slug: "/cloud-native/orchestration/nfs-storage"
hide_table_of_contents: false
keywords: ["NFS 存储"]
tags: ["NFS", "CloudNative"]
date: 2017-08-01
categories: ["Orchestration"]
---

# NFS 存储
在 K8s 中当我们需要持久化存储一些数据的使用，会使用到的就是 PV 和 PVC，但 PV 和 PVC 都是需要手动创建的话会很麻烦，
特别是当有 StatefulSet 应用存在的时候，如果你需要手动对每个 pod 都创建一个 PVC 和 PV 就非常麻烦，于是 StorageClass 就是来解决这个问题的。

Persistent Volumes：PV 是持久化卷，系统管理员设置的存储，它是群集的一部分，是一种资源，所以它有独立于 Pod 的生命周期
Persistent Volume Claim：PVC 是用户存储的请求。它与 Pod 相似，Pod 消耗节点的 CPU 和内存资源，PVC 则消耗 PV 资源，可以声明特定的容量大小和访问模式。
部署模式：
NFS（NAS）  ==》PV  ==》PVC


## 1.概念
### 1.1 基础概念
容器本身是非持久化的，存在 2 个问题:
1. 首先当容器崩溃，kubelet 将重新启动容器，容器将会以镜像的初始状态重新开始在通过一个 Pod 中一起运行的容器，此时之前写入容器的文件将会丢失
2. 另外容器之间通常需要共享容文件.
Kubernetes 通过 Volume 卷解决上述的两个问题。

Docker 中存储卷只是磁盘的或另一个容器中的目录，并没有对其生命周期进行管理。Kubernetes 的存储卷有自己的生命周期，它的生命周期与使用的它 Pod 生命周期一致。
相比于在 Pod 中运行的容器来说，存储卷的存在时间会比的其中的任何容器都长，并且在容器重新启动时会保留数据。当然，当 Pod 停止存在时，存储卷也将不再存在。

在 Pod 中通过指定下面的字段来使用存储卷：
spec.volumes：通过此字段提供指定的存储卷
spec.containers.volumeMounts：通过此字段将存储卷挂接到容器中

### 1.2 PV 的配置
#### 1.2.1 静态 PV 配置
管理员人为的创建静态一些 PV。

#### 1.2.2 动态 PV 配置
系统自动创建的 PV。可以通过 storageClass 来动态的产生 PV。当管理员创建的静态 PV 都不匹配用户的 PersistentVolumeClaim 时，集群可能会尝试动态地为 PVC 创建卷。此配置基于 StorageClasses：PVC 必须请求存储类，并且管理员必须创建并配置该类才能进行动态创建。声明该类为 "" 可以有效地禁用其动态配置。要启用基于存储级别的动态存储配置，集群管理员需要启用 API server 上的 DefaultStorageClass 准入控制器。例如，通过确保 DefaultStorageClass 位于 API server 组件的 --admission-control 标志，使用逗号分隔的有序值列表中，可以完成此操作。有关 API server 命令行标志的更多信息，请检查 kube-apiserver 文档。

#### 1.2.3 PVC 与 PV 的绑定
一旦用户创建或已经创建了具有特定存储量的 PersistentVolumeClaim 以及某些访问模式。Kubernetes 控制器会监视到新的 PVC，并寻找匹配的 PV，并将它们绑定在一起。 PVC 跟 PV 绑定是一对一的映射。

#### 1.2.4 PVC 及 PV 的使用
Pod 使用 PVC 作为卷，集群检查 PVC 以查找绑定的卷并为集群挂载该卷。对于支持多种访问模式的卷，用户指定在使用声明作为容器中的卷时所需的模式（读写、只读）

## 2.NFS
NFS（Network File System）即网络文件系统，Sun 公司开发，是 FreeBSD 支持的文件系统中的一种，它允许网络中的计算机之间通过 TCP/IP 网络共享资源。在 NFS 的应用中，本地 NFS 的客户端应用可以透明地读写位于远端 NFS 服务器上的文件，就像访问本地文件一样。
好处就是一台磁盘共享，其他服务器都能共用改服务器的磁盘空间。

本文以 NFS 构建 K8s 集群共享存储
nfs 是我们最终的存储
nfs-client 是用来动态创建 pv 和 pvc 的，我们称为 provisioner
StorageClass 关联到对应的 provisioner 就可以使用
statefulset（或别的资源）需要配置 storageClassName 进行使用

### 2.1 环境概况
1 个 3 台机器的 K8s 或者 K3s 集群, 其中 1 个 Server 节点, 2 个 Agent 节点, 默认 NFS 安装在该集群
| 服务器 ip    | 主机名       | 是否共享 | 共享目录 | 角色  |
| ----------- | ------------ |------|------|-----|
| 172.31.12.216 | k8s-master/k3s-master | 是    | /data/nfs | 服务端 |
| 172.31.12.220 | k8s-node01/k8s-node01 | 否    | 挂载/data  | 客户端 |
| 172.31.12.225 | K8s-node02/k3s-node02 | 否    | 挂载/data  | 客户端 |

### 2.2 服务端安装步骤
#### 2.2.1 关闭防火墙
```bash
systemctl stop firewalld
system disable firewalld
```

#### 2.2.2 创建共享目录和权限设置
```bash
mkdir -p /data/nfs
chown -R 777 /data/nfs
```

#### 2.2.3 安装 nfs
nfs 依赖 rpcbind, 故需安装
```bash
yum install -y nfs-utils rpcbind
```

#### 2.2.3 配置 nfs
nfs 的默认配置在/etc/exports 中，将共享目录配置到其中
```bash
echo "/data/nfs *(insecure,rw,sync,no_root_squash)" > /etc/exports
```
> 备注相关配置说明
> /data/nfs：是共享的数据目录
> *：表示任何人都有权限连接，当然也可以是一个网段，一个 IP，也可以是域名
> rw：读写的权限
> sync：表示文件同时写入硬盘和内存
> no_root_squash：当登录 NFS 主机使用共享目录的使用者是 root 时，其权限将被转换成为匿名使用者，通常它的 UID 与 GID，都会变成 nobody 身份

#### 2.2.4 配置生效
```bash
exportfs -r
```
#### 2.2.5 启动服务
```bash
# 设置开机启动
systemctl enable rpcbind
systemctl enable nfs-server
           
# 启动nfs
systemctl start rpcbind
systemctl start nfs-server
```

#### 2.2.6 查看相关信息
检查配置是否生效:
```bash
➜  system exportfs
/data/nfs       <world>
```

查看 nfs 相关信息
```bash
➜  system rpcinfo -p | grep nfs
    100003    3   tcp   2049  nfs
    100003    4   tcp   2049  nfs
    100227    3   tcp   2049  nfs_acl
```

查看挂载信息
```bash
➜  system cat /var/lib/nfs/etab
/data/nfs       *(rw,sync,wdelay,hide,nocrossmnt,insecure,no_root_squash,no_all_squash,no_subtree_check,secure_locks,acl,no_pnfs,anonuid=65534,anongid=65534,sec=sys,rw,insecure,no_root_squash,no_all_squash)
```

### 2.3 客户端安装步骤

以下步骤 2.3.1 至 2.3.5 在所有 Agent 节点都需要执行

#### 2.3.1 关闭防火墙

```bash
systemctl stop firewalld
system disable firewalld
```

#### 2.3.2 安装 nfs

nfs 依赖 rpcbind, 故需安装

```bash
yum install -y nfs-utils
```

#### 2.3.3 创建自启动服务
```bash
systemctl enable rpcbind
systemctl start rpcbind
```

#### 2.3.4 查看可访问的 nfs 地址

```bash
[root@k3s-node01 ~]# showmount -e 172.31.12.216
Export list for 172.31.12.216:
/data/nfs *

[root@k3s-node02 ~]# showmount -e 172.31.12.216
Export list for 172.31.12.216:
/data/nfs *
```

#### 2.3.5 挂载和查看
```bash
# 创建共享目录
mkdir -p /data/nfs
# mount -t nfs $(nfs服务器的IP):/data/nfs /data/nfs
mount -t nfs 172.31.12.216:/data/nfs /data/nfs/

[root@k3s-node01 data]# df -h
Filesystem                  Size  Used Avail Use% Mounted on
devtmpfs                    4.0M     0  4.0M   0% /dev
tmpfs                       3.8G     0  3.8G   0% /dev/shm
tmpfs                       1.6G  8.8M  1.5G   1% /run
/dev/mapper/almalinux-root   48G  2.3G   46G   5% /
/dev/mapper/almalinux-home   24G  464M   23G   2% /home
/dev/sda1                   960M  231M  730M  24% /boot
tmpfs                       7.6G   12K  7.6G   1% /var/lib/kubelet/pods/5381ddd0-c56b-4cbe-befb-2bb901f4255b/volumes/kubernetes.io~projected/kube-api-access-2f7bj
shm                          64M     0   64M   0% /run/k3s/containerd/io.containerd.grpc.v1.cri/sandboxes/f95f5777fd2ddd8d287f9f4e6ce2cb9dae8a56dc00c3040c23c8471bb903a457/shm
overlay                      48G  2.3G   46G   5% /run/k3s/containerd/io.containerd.runtime.v2.task/k8s.io/f95f5777fd2ddd8d287f9f4e6ce2cb9dae8a56dc00c3040c23c8471bb903a457/rootfs
tmpfs                       769M     0  769M   0% /run/user/0
overlay                      48G  2.3G   46G   5% /run/k3s/containerd/io.containerd.runtime.v2.task/k8s.io/40273cba399bb8a3f870afa96e2292e19a5d7b80f358b75409d6a2aaeb2b86e0/rootfs
172.31.12.216:/data/nfs      70G   19G   52G  27% /data/nfs

[root@k3s-node02 data]# df -h
Filesystem                       Size  Used Avail Use% Mounted on
devtmpfs                         4.0M     0  4.0M   0% /dev
tmpfs                            3.8G     0  3.8G   0% /dev/shm
tmpfs                            1.6G  8.8M  1.5G   1% /run
/dev/mapper/almalinux_vbox-root   35G  2.1G   33G   6% /
/dev/sda1                        960M  231M  730M  24% /boot
tmpfs                            769M     0  769M   0% /run/user/0
tmpfs                            7.6G   12K  7.6G   1% /var/lib/kubelet/pods/cb99dc58-5d34-4a2c-a765-bb7a5621d041/volumes/kubernetes.io~projected/kube-api-access-9vj4n
shm                               64M     0   64M   0% /run/k3s/containerd/io.containerd.grpc.v1.cri/sandboxes/7e0a96ee6f6fa4c01a5af031d8d2e2e6e96a37e79a41553bf3906ef55b1d8ddd/shm
overlay                           35G  2.1G   33G   6% /run/k3s/containerd/io.containerd.runtime.v2.task/k8s.io/7e0a96ee6f6fa4c01a5af031d8d2e2e6e96a37e79a41553bf3906ef55b1d8ddd/rootfs
overlay                           35G  2.1G   33G   6% /run/k3s/containerd/io.containerd.runtime.v2.task/k8s.io/9300a9f13ac198a0e8c568eba1e248f4aa4584b2c3d2c9cb2bfee7066ab831a5/rootfs
172.31.12.216:/data/nfs           70G   19G   52G  27% /data/nfs
```

#### 2.3.6 验证
##### 2.3.6.1 k3s-node01 验证

客户端写入数据

```bash
echo 4444 >> /data/nfs/2.log
cat /data/nfs/2.log 
4444
```

服务端验证

```bash
cat /data/nfs/2.log 
4444
```

##### 2.3.6.2 k3s-node02 验证

客户端写入数据

```bash
echo 3333 >> /data/nfs/3.txt
cat /data/nfs/3.txt
3333
```

服务端验证

```bash
cat /data/nfs/3.txt
3333
```