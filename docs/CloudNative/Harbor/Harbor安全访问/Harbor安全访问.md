---
title: Harbor 安全访问
description: "Harbor 安全访问"
slug: "/cloud-native/harbor/secure-harbor"
hide_table_of_contents: false
keywords: ["Harbor"]
tags: ["Harbor", "CloudNative"]
date: 2017-08-01
categories: ["Harbor"]
---
# Harbor 安全访问

Harbor 支持 Http 及 Https 协议访问, Harbor 安全访问需要基于 Https 协议, 本文介绍怎样配置 Harbor 的 Https 协议访问;

默认情况下，Harbor 不附带证书；可以在没有安全性的情况下部署 Harbor，以便可以通过 HTTP 连接到它。
但是只有在没有外部网络连接的空白测试或开发环境中，才可以使用 HTTP；在生产环境中使用 HTTP 会使您遭受中间人攻击，请务必使用 HTTPS。
要配置 HTTPS，必须创建 SSL 证书。您可以使用由受信任的第三方 CA 签名的证书，也可以使用自签名证书；

## 1. Harbor 启用 https 访问
本文中默认 172.31.12.216 映射为域名 harbor.repo, 生成证书既可以域名亦可以 ip

### 1.1 创建证书目录
```bash
mkdir -p /data/harbor/ssl
```

### 1.2 生成证书颁发机构证书
在生产环境中，您应该从 CA 获得证书。在测试或开发环境中，您可以生成自己的 CA。要生成 CA 证书，请运行以下命令

#### 1.2.1 生成证书颁发机构私钥
```bash 
openssl genrsa -out ca.key 4096
```

#### 1.2.2 生成证书颁发机构证书
```bash 
openssl req -x509 -new -nodes -sha512 -days 3650 \
-subj "/C=CN/ST=Yunnan/L=Kunming/O=example/OU=Personal/CN=harbor.repo" \
-key ca.key -out ca.crt
```
如果是 ip 访问:
```bash 
openssl req -x509 -new -nodes -sha512 -days 3650 \
-subj "/C=CN/ST=Yunnan/L=Kunming/O=example/OU=Personal/CN=172.31.12.216" \
key ca.key -out ca.crt
```

### 1.3 生成服务器证书
证书通常包含一个.crt 文件和一个.key 文件

#### 1.3.1 生成服务器私钥
```bash
openssl genrsa -out harbor.repo.key 4096
```
如果是 ip 访问:
```bash
openssl genrsa -out 172.31.12.216.key 4096
```

#### 1.3.2 生成证书签名请求
```bash 
openssl req -sha512 -new \
-subj "/C=CN/ST=Yunnan/L=Kunming/O=example/OU=Personal/CN=harbor.repo" \
-key harbor.repo.key \
-out harbor.repo.csr
```
如果是 ip 访问:
```bash 
openssl req -sha512 -new \
-subj "/C=CN/ST=Yunnan/L=Kunming/O=example/OU=Personal/CN=172.31.12.216" \
-key 172.31.12.216.key \
-out 172.31.12.216.csr
```

#### 1.3.3 生成 x509 v3 扩展文件
无论您使用 FQDN 还是 IP 地址连接到 Harbor 主机，都必须创建此文件，以便可以为您的 Harbor 主机生成符合主题备用名称（SAN）和 x509 v3 的证书扩展要求。替换 DNS 条目以反映您的域
```bash
cat > v3.ext <<-EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names
[alt_names]
DNS.1=harbor.repo
DNS.2=*.harbor.repo
DNS.3=hostname
EOF
```
如果是 ip 访问
```bash
cat > v3.ext <<-EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = IP:172.31.12.216
EOF
```

#### 1.3.4 使用该 v3.ext 文件为 Harbor 服务器生成证书
```bash
openssl x509 -req -sha512 -days 3650 -extfile v3.ext  \
-CA ca.crt -CAkey ca.key -CAcreateserial \
-in harbor.repo.csr \
-out harbor.repo.crt
```
如果是 ip 访问:
```bash
openssl x509 -req -sha512 -days 3650 -extfile v3.ext \
-CA ca.crt -CAkey ca.key -CAcreateserial \
-in 172.31.12.216.csr \
-out 172.31.12.216.crt
```

### 1.4 crt 转换
Docker 守护进程将 `.crt` 文件解释为 CA 证书，`.cert` 将文件解释为客户端证书，需将 harbor.repo.crt 转换为 harbor.repo.cert 以供 Docker 使用
```bash
openssl x509 -inform PEM -in harbor.repo.crt -out harbor.repo.cert
```
如果是 ip 访问:
```bash
openssl x509 -inform PEM -in 172.31.12.216.crt -out 172.31.12.216.cert
```

### 1.5 配置 Harbor 支持 https
修改 harbor.yml:
```yml
# https related config
https:
  # https port for harbor, default is 443
  port: 8443
  # The path of cert and key files for nginx
  certificate: /data/harbor/ssl/harbor.repo.crt
  private_key: /data/harbor/ssl/harbor.repo.key
  # enable strong ssl ciphers (default: false)
  # strong_ssl_ciphers: false
```

### 1.6 配置 Docker 支持 Harbor 证书
harbor 有使用 https 证书时, docker 登录报错如下:
```bash
➜  ~ docker login -u admin -p Harbor12345 harbor.repo:8443
WARNING! Using --password via the CLI is insecure. Use --password-stdin.
Error response from daemon: Get "https://harbor.repo:8443/v2/": tls: failed to verify certificate: x509: certificate signed by unknown authority
➜  ~
```
出现这种情况有 2 种解决办法:
#### 1.6.1 方法一
编辑 Docker 配置文件
```bash
sudo nano /etc/docker/daemon.json
```

添加不安全的 Harbor 注册表地址
```json
{
      "insecure-registries": [
            "https://172.31.12.216:8443",
            "https://harbor.repo:8443"
      ]
}
```
重启 Docker 服务
```bash
sudo systemctl restart docker
```

登录 Harbor
```bash
➜  ~ docker login -u admin -p Harbor12345 harbor.repo:8443
WARNING! Using --password via the CLI is insecure. Use --password-stdin.
Login Succeeded
```

#### 1.6.2 方法二
在 Docker 客户端机器上创建证书目录
```bash
mkdir -p /etc/docker/certs.d/harbor.repo:8443
```

如果 Docker 客户端是 MacOS:
```bash
mkdir -p ~/.docker/certs.d/harbor.repo:8443
```

复制自签名证书到 Docker 目录

```bash
sudo cp /data/harbor/ssl/ca.crt /etc/docker/certs.d/harbor.repo:8443/
sudo cp /data/harbor/ssl/harbor.repo.{cert,key} /etc/docker/certs.d/harbor.repo:8443/
```

重启 Docker 服务
```bash
sudo systemctl restart docker
```

登录 Harbor
```bash
➜  ~ docker login -u admin -p Harbor12345 harbor.repo:8443
WARNING! Using --password via the CLI is insecure. Use --password-stdin.
Login Succeeded
```






