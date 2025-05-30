---
title: 备忘录模式
description: "备忘录模式"
slug: "/backend/design-pattern/action/memento"
hide_table_of_contents: false
keywords: ["设计模式", "结构型"]
tags: ["设计模式", "结构型"]
date: 2017-08-01
categories: ["设计模式"]
---
## 概述
备忘录模式就是在不破坏封装的前提下，捕获一个对象的内部状态，并在该对象之外保存这个状态，这样可以在以后将对象恢复到原先保存的状态。
很多时候我们总是需要记录一个对象的内部状态，这样做的目的就是为了允许用户取消不确定或者错误的操作，能够恢复到他原先的状态，使得他有"后悔药"可吃。

## 适用性
+ 需要保存/恢复数据的相关状态场景
+ 提供一个可回滚的操作

## 结构

![memento](img/memento.png)

### 发起人（Originator）
记录当前时刻的内部状态信息，提供创建备忘录和恢复备忘录数据的功能，实现其他业务功能，它可以访问备忘录里的所有信息。
### 管理者（Caretaker）
对备忘录进行管理，提供保存与获取备忘录的功能，但其不能对备忘录的内容进行访问与修改
### 备忘录（Memento）
负责存储发起人的内部状态，在需要的时候提供这些内部状态给发起人

## 实现

```java
/**
 * 发起人：记录当前时刻的内部状态，负责定义哪些属于备份范围的状态，负责创建和恢复备忘录数据
 */
public class Originator {
    private String state = "";

    public String getState() {
        return state;
    }
    public void setState(String state) {
        this.state = state;
    }
    public Memento createMemento(){
        return new Memento(this.state);
    }
    public void restoreMemento(Memento memento){
        this.setState(memento.getState());
    }
}

/**
 * 管理角色：对备忘录进行管理，保存和提供备忘录。
 */
public class Caretaker {
    private Memento memento;
    public Memento getMemento(){
        return memento;
    }
    public void setMemento(Memento memento){
        this.memento = memento;
    }
}

/**
 * 备忘录：负责存储发起人对象的内部状态，在需要的时候提供发起人需要的内部状态。
 */
public class Memento {
    private String state = "";
    public Memento(String state){
        this.state = state;
    }
    public String getState() {
        return state;
    }
    public void setState(String state) {
        this.state = state;
    }
}

public class MenentoTest {
    @Test
    public void test() {
        Originator originator = new Originator();
        originator.setState("状态1");
        System.out.println("初始状态:" + originator.getState());
        Caretaker caretaker = new Caretaker();
        caretaker.setMemento(originator.createMemento());
        originator.setState("状态2");
        System.out.println("改变后状态:" + originator.getState());
        originator.restoreMemento(caretaker.getMemento());
        System.out.println("恢复后状态:" + originator.getState());
    }
}

## 结果
初始状态:状态1
改变后状态:状态2
恢复后状态:状态1
```

## 总结
### 优点
+ 给用户提供了一种可以恢复状态的机制，可以使用户能够比较方便地回到某个历史的状态。 
+ 实现了信息的封装，使得用户不需要关心状态的保存细节。
### 缺点
+ 消耗资源，如果类的成员变量过多，势必会占用比较大的资源，而且每一次保存都会消耗一定的内存。