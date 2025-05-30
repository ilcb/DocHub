---
title: 简单工厂模式
description: "简单工厂模式"
slug: "/backend/design-pattern/creation/factory"
hide_table_of_contents: false
keywords: ["设计模式", "创建型"]
tags: ["设计模式", "创建型"]
date: 2017-08-01
categories: ["设计模式"]
---

## 定义
简单工厂模式又称静态工厂方法模式，在创建一个对象时不向客户暴露内部细节，并提供一个创建对象的通用接口。
它存在的目的很简单：定义一个用于创建对象的接口。

## 结构

![simple-factory](img/simplefactory.png)

### 工厂类角色
内部提供静态工厂方法，用于创建所需产品对象，可被外界直接调用
### 抽象产品角色
工厂类创建的所有对象的父类或共有的接口，封装各种产品对象的公有方法
### 具体产品角色
是此模式的创建目标，每个具体产品都继承了抽象产品角色，实现抽象产品角色中的抽象方法
## 实现

```java
/**
 * 抽象产品接口
 */
public interface ISender {
    void send();
}

/**
 * 具体产品角色
 */
public class MailSender implements ISender {
    public void send() {
        System.out.println("this is a MailSender");
    }
}

/**
 * 具体产品角色
 */
public class SmsSender implements ISender {
    public void send() {
        System.out.println("this is a SmsSender");
    }
}

/**
 * 工厂角色
 */
public class SenderFactory {
    public ISender create(String type) {
        ISender sender = null;
        if (type.equals("sms")) {
            sender = new SmsSender();
        } else if ("mail".equals(type)) {
            sender = new MailSender();
        }
        return sender;
    }
}

public class OperationFactoryTest {
    @Test
    public void test() {
        IOperationFactory factory = new AddOperationFactory();
        IOperation operation = factory.createOperation();
        double total = operation.calculate(1.0, 3.0);
        Assert.assertEquals(4.0, total, 0.0001);
    }
}

# 结果
this is a SmsSender
```