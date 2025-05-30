---
title: 外观模式
description: "外观模式"
slug: "/backend/design-pattern/structure/facade"
hide_table_of_contents: false
keywords: ["设计模式", "结构型"]
tags: ["设计模式", "结构型"]
date: 2017-08-01
categories: ["设计模式"]
---

## 概述
外观模式为子系统中的一组接口提供一个一致的界面，外观模式隐藏系统的复杂性，并向客户端提供了一个客户端可以访问系统的接口。

## 结构

![facade](img/facade.png)

### 外观（Facade）角色
为多个子系统对外提供一个共同的接口。
### 子系统（Sub System）角色
实现系统的部分功能，客户可以通过外观角色访问它。

## 实现
```java
/**
 * 子系统
 */
public class SubSystemOne {
    public void methodOne(){
        System.out.println("子系统方法一");
    }
}

/**
 * 子系统
 */
public class SubSystemTwo {
    public void methodTwo(){
        System.out.println("子系统方法二");
    }
}

/**
 * 子系统
 */
public class SubSystemThree {
    public void methodThree(){
        System.out.println("子系统方法三");
    }
}

/**
 * 子系统
 */
public class SubSystemFour {
    public void methodFour(){
        System.out.println("子系统方法四");
    }
}

/**
 * 门面
 */
public class Facade {
    private SubSystemOne subSystemOne;
    private SubSystemTwo subSystemTwo;
    private SubSystemThree subSystemThree;
    private SubSystemFour subSystemFour;

    public Facade(){
        subSystemOne = new SubSystemOne();
        subSystemTwo = new SubSystemTwo();
        subSystemThree = new SubSystemThree();
        subSystemFour = new SubSystemFour();
    }

    public void methodA(){
        System.out.println("-----方法组A-----");
        subSystemOne.methodOne();
        subSystemFour.methodFour();
    }

    public void methodB(){
        System.out.println("-----方法组B-----");
        subSystemThree.methodThree();
    }
}

public class FacadeTest {
    @Test
    public void test() {
        Facade facade = new Facade();
        facade.methodA();
        facade.methodB();
    }
}
```

## 结果
-----方法组 A-----
子系统方法一
子系统方法四
-----方法组 B-----
子系统方法三
