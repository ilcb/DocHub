---
title: Docker 构建 Jenkins
description: "Docker 构建 Jenkins"
slug: "/cloud-native/docker/build-jenkins"
hide_table_of_contents: false
keywords: ["Docker", "Jenkins"]
tags: ["Docker", "Jenkins", "CloudNative"]
date: 2017-08-01
categories: ["Docker"]
---

# Docker 构建 Jenkins

## 软件环境

| 名称          |
| ------------- |
| jdk-1.8.0_232 |
| SUSE Linux    |

## 前置准备

### 安装 jdk

下载安装 jdk 环境

```bash
wget https://www.oracle.com/java/technologies/downloads/#license-lightbox
```

安装 jdk

```bash
rpm -ivh jdk-8u371-linux-aarch64.rpm
```

配置环境变量

```bash
vi /etc/profile
```

```bash
#配置jdk环境
export JAVA_HOME=/opt/oracle-jdk-8u371
export PATH=$JAVA_HOME/bin:$PATH
export CLASSPATH=.:$JAVA_HOME/lib/dt.jar:$JAVA_HOME/lib/tools.jar

```

### 安装 Maven

下载 maven 安装包

```bash
wget https://dlcdn.apache.org/maven/maven-3/3.9.1/binaries/apache-maven-3.9.1-bin.tar.gz
```

安装 maven

```bash
tar -zxvf apache-maven-3.9.1-bin.tar.gz
mv apache-maven-3.9.1 opt/apache-maven-3.9.1 
```

配置 Maven 环境

```bash
vi /etc/profile
```

```bash
export MAVEN_HOME=/opt/apache-maven-3.9.1
export PATH=$PATH:$MAVEN_HOME/bin
```

## Jenkins 安装

### 通过 rpm 安装 jenkins

从 Jenkins 2.164（2019 年 2 月 10 日发布）和 LTS 2.164.1（ETA：3 月 14 日）开始，在 Jenkins 中全面支持 Java 11，后续支持 Java 17，需要按照 jdk 版本来适配 jenkins 版本

```bash
https://pkg.origin.jenkins.io/opensuse-stable/
```

由于项目 jdk 版本为 8，故此处选择版本 2.346.1

![查询版本](img/查询版本.png)



#### 下载 rpm 软件包

进入清华源，下载对应版本的 rpm 包

```bash
wget https://mirrors.tuna.tsinghua.edu.cn/jenkins/opensuse-stable/jenkins-2.346.3-1.2.noarch.rpm
```

#### 安装 jenkins

```bash
rpm -ivh jenkins-2.346.3-1.2.noarch.rpm
```

#### 启动 jenkins

```bash
service jenkins start
```

#### 其他配置

+ 如果需要修改端口号

```bash
vim /etc/sysconfig/jenkins
```

安装完成后，与 jenkins 相关的几个文件目录

> /usr/lib/jenkins 文件夹下存放的安装的 jenkins jar 包

> /etc/sysconfig/jenkins 该文件是 jenkins 的配置文件，可以配置用户，端口号等

> /var/log/jenkins 文件夹下的 jenkins.log 是 jenkins 的日志文件



### 通过 zypper 安装 jenkins

#### 添加 Jenkins repository

```bash
sudo zypper addrepo -f https://pkg.jenkins.io/opensuse-stable/ jenkins
```

#### 安装 Jenkins

```bash
sudo zypper install jenkins
```

#### 启动 jenkins

```bash
# 检查Jenkins服务状态
sudo systemctl status jenkins
# 设置为开机自启动
sudo systemctl enable jenkins
# 启动Jenkins服务
sudo systemctl start jenkins
```

## Jenkins 启动

jenkins 默认端口 8080，浏览器访问 `http://{jenkinsServerIP}:8080` 访问

![启动web控制台](img//启动web控制台.png)

#### 验证密钥

打开/var/lib/jenkins/secrets/initialAdminPassword 文件，复制其内容粘贴到`管理员密码`处，点击`继续`

![验证密钥](img//验证密钥.jpg)

#### 安装插件

![安装插件](img//安装插件.jpg)

![安装插件1](img//安装插件1.jpg)

#### 创建管理员账户

使用默认 admin 账户

![创建管理员账户](img//创建管理员账户.jpg)

![配置jenkinsurl](img//配置jenkinsurl.jpg)



## Jenkins 配置

### 全局安全配置

默认情况下，jenkins 允许匿名用户做任何事情，这也就意味着谁都可以使用 jenkins 进行发布，这显然不够安全，jenkins 支持多种安全认证机制。进入下图设置页面，这里采用 jenkins 内置的用户名、密码认证机制，同时允许用户注册，匿名用户有管理权（首次配置时，建议允许匿名用户有管理权限，等其它用户权限都设置好以后，再去掉匿名用户的管理权）
![安全配置](img//安全配置.jpg)

### 全局工具配置

进入：系统管理 / 全局工具设置（Global Tool Configuration）

#### maven 设置

![全局配置-maven配置](img//全局配置-maven配置.jpg)

#### jdk 配置

JDK 下不勾选“自动安装”，指定别名=oracle-jdk-8u371, JAVA_HOME=/opt/oracle-jdk-8u371

![全局配置-jdk](img//全局配置-jdk.jpg)

#### Maven

Maven 下不勾选“自动安装”，指定别名=apache-maven-3.9.1, MAVEN_HOME=/opt/apache-maven-3.9.1

![全局配置-maven](img//全局配置-maven.jpg)

### 插件管理

首页 >> Manager Jenkins(系统管理)  >> Manage Plugins(插件管理)

安装以下插件

| 名称              | 描述                  |
| ----------------- | --------------------- |
| Subversion        | 版本管理 SVN 的插件   |
| Maven Integration | 项目构建 Maven 的插件 |

示例: 安装 Subversion 插件

![安装Subversion插件](img//安装Subversion插件.jpg)

![安装Subversion插件1](img//安装Subversion插件1.jpg)

## Java 项目构建

### 新建 Java 任务

首页 >> 新建 Item(新建任务)  >> FreeStyle Project

![new-java-item](img//new-java-item.jpg)

![new-test-idm-item](img//new-test-idm-item.jpg)

### General 配置

![new-java-discard-old-build](img//new-java-discard-old-build.jpg)

### 源码管理

指定源代码下载方式为`Subversion`，输入项目代码地址

![idm-source-manage](img//idm-source-manage.jpg)

### 创建凭据

![new-credentials](img//new-credentials.jpg)

填写 Svn 的登录名和密码

![create-credentials](img//create-credentials.jpg)

### Build Triggers(构建触发器)配置

选中 Build periodically：周期性进行项目构建，这个是到指定的时间必须触发构建任务

选中 Poll SCM:定时检查源码变更，如果有更新就 checkout 最新 code 下来，然后执行构建动作

注：定时构建语法如下：(五颗星，中间用空格隔开）

\* * * * *

第一颗*表示分钟，取值 0~59

第二颗*表示小时，取值 0~23

第三颗*表示一个月的第几天，取值 1~31

第四颗*表示第几月，取值 1~12

第五颗*表示一周中的第几天，取值 0~7，其中 0 和 7 代表的都是周日

![java-trigger](img//java-trigger.jpg)

### 构建

添加构建步骤`Invoker top-level Maven targets`

![invoke-top-maven](img//invoke-top-maven.jpg)

指定 mvn 构建相关操作

![idm-maven-config](img//idm-maven-config.jpg)

### 执行构建

首页 >> 新建 Item(新建任务)  >> FreeStyle Project

![查看Java构建结果](img//查看Java构建结果.jpg)

![查看Java构建结果详情](img//查看Java构建结果详情.jpg)



## 集成 SonarQube

### SonarQube 简介

SonarQube 是一个开源的代码质量管理系统，用于检测代码中的错误，漏洞和代码规范。它可以现有的 Gitlab、Jenkins 集成，以便在项目拉取后进行连续的代码检查。

Sonar 的安装分两个步骤：

　　第一步安装 sonarqube server 端

　　第二步，jenkins 集成 sonarqube-scanner（需要连接 sonar 服务端）



### SonarQube 安装

SonarQube 7.8 是最后一个支持 MySQL 的版本，最后一个支持 jdk1.8 的版本，也就是说如果要使用 7.9 及以上的版本，SonarQube 

的数据库就不能为 MySQL，并且需要 jdk11，目前公司使用的是 jdk1.8 的版本 ，所以选择了 SonarQube 7.8，下面是具体的安装步骤。

注意 SonarQube 7.8 只支持数据库 5.6 以及上 8.0 以下的版本，其他版本的 MySQL 不支持。

#### 安装 MySQL 5.6

##### 检查是否已安装 MySQL

```bash
rpm -qa | grep mysql
```

##### 下载 mysql 安装包

```bash
wget https://cdn.mysql.com//Downloads/MySQL-5.7/mysql-5.7.42-1.sles12.x86_64.rpm-bundle.tar
```

##### 解压下载文件

```bash
tar -xvf mysql-5.7.42-1.sles12.x86_64.rpm-bundle.tar
```

##### 安装依赖 libatomic1

```bash
zypper search libatomic1
zypper in libatomic1
```

##### 安装 mysql

安装以下四个即可提供数据库服务。另外四个 rpm 包非必须安装。安装有依赖关系，必须按如下顺序安装

```bash
rpm -ivh mysql-community-common-5.7.42-1.sles12.x86_64.rpm
rpm -ivh mysql-community-libs-5.7.42-1.sles12.x86_64.rpm
rpm -ivh mysql-community-client-5.7.42-1.sles12.x86_64.rpm --nodeps
pm -ivh mysql-community-server-5.7.42-1.sles12.x86_64.rpm
```

**注：ivh 中， i-install 安装；v-verbose 进度条；h-hash 哈希校验**

##### 启动 MySQL

```bash
service mysql start 
```

##### 查找临时密码

```plain
cat  /var/log/mysql/mysqld.log
```

```bash
2023-05-06T03:24:20.815265Z 1 [Note] A temporary password is generated for root@localhost: E(BX?V;7t<.#
```

##### 登录 mysql

```bash
mysql -uroot -p
```

输入密码: `E(BX?V;7t<.#`

##### 修改密码

```bash
SET PASSWORD = PASSWORD('Root@123');
```

#### SonarQube 服务端安装

##### 下载 SonarQube 安装包

```bash
wget https://binaries.sonarsource.com/Distribution/sonarqube/sonarqube-7.8.zip
```

##### 解压到/opt

```bash
unzip -d /opt sonarqube-7.8.zip
```

##### 修改数据库配置

```bash
vi /opt/sonarqube-7.8/conf/sonar.properties
```

![sonar-jdbc-config](img/sonar-jdbc-config.jpg)

##### 修改系统进程最大打开文件数

打开`vim /etc/security/limits.conf`在尾部添加

```bash
* soft nofile 65536
* hard nofile 131072
* soft nproc 65535
* hard nproc 65535
```

##### 修改 vm.max_map_count 的大小
`vim /etc/sysctl.conf`
在尾部添加以下内容：

```plain
vm.max_map_count=655360
```

执行`sysctl -p`让配置生效

##### 创建 sonar 用户

不能使 root 用户启动 SonarQube，否则无法启动，创建一个 sonar 普通用户
```bash
# 新建用户组
groupadd sonar
# 新建用户
sudo useradd -m -g sonar sonar

chown -R sonar:sonar /opt/sonarqube-7.8/
```

##### 启动 SonarQube

以 sonar 用户启动服务
```bash
su sonar -c "/opt/sonarqube-7.8/bin/linux-x86-64/sonar.sh start"
```

> SonarQube 默认访问端口号为 9000，开放该端口号，如果是云服务器，那就就请在安全组中放行 9000 端口。
> firewall-cmd --permanent --add-port=9000/tcp
> firewall-cmd --reload

##### 访问 web 控制台

使用 IP+端口进行访问，登录的用户名和密码都是: admin

![sonar-dashboard](img//sonar-dashboard.jpg)

#### Jenkins 整合 SonarQube

##### Jenkins 安装 SonarQube Scanner for Jenkins 插件

![install-sonarqube-scanner](img//install-sonarqube-scanner.jpg)

##### 生成 SonarQube 令牌

![sonar-token-generate](img//sonar-token-generate.jpg)

![sonar-token-generate1](img//sonar-token-generate1.jpg)

复制并保存 token，后续不可见，此处生成的 token 值为: `bc3198df1dcc47416f5bd2e99c7737e1a48b1f3f`

##### 配置 Jenkins 的 Sonar Qube 信息

Dashboard > Config System

![jenkins-sonarqube-config](img//jenkins-sonarqube-config.jpg)

![jenkins-sonarqube-token-create](img//jenkins-sonarqube-token-create.jpg)

![jenkins-sonarqube-token-generate1](img//jenkins-sonarqube-token-generate1.jpg)

![jenkins-sonarqube-config1](img//jenkins-sonarqube-config1.jpg)

#### 配置 Sonar-scanner

Dashboard > Global Tool Configuration

![jenkins-sonarqube-scanner-config](img//jenkins-sonarqube-scanner-config.jpg)

##### 配置 Jenkins 构建任务的 Sonar Scanner

![projects-sonar-scanner-config](img//projects-sonar-scanner-config.jpg)

![project-sonar-scanner-config1](img//project-sonar-scanner-config1.jpg)

##### 执行构建

![execute-build](img//execute-build.jpg)

##### 查看 sonar 扫描结果

![查看sonar扫描结果](img//查看sonar扫描结果.jpg)

![sonar扫描详情](img//sonar扫描详情.jpg)

### 自动化测试





jenkins 安装过后会默认创建 jenkins 用户，用来构建 maven 时遇到报错

```text
[ERROR] Could not create local repository at /root/.m2/repository -> [Help 1]
org.apache.maven.repository.LocalRepositoryNotAccessibleException: Could not create local repository at /root/.m2/repository
```

需要修改 jenkins 为 root 权限，修改文件

```bash
vim /usr/lib/systemd/system/jenkins.service
```

修改内容

```bash
User=root
Group=root
```





https://www.cnblogs.com/xujingyang/p/16863221.html



