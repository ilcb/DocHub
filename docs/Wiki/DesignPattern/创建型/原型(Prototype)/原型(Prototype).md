---
title: 原型模式
description: "原型模式"
slug: "/backend/design-pattern/creation/prototype"
hide_table_of_contents: false
keywords: ["设计模式", "创建型"]
tags: ["设计模式", "创建型"]
date: 2017-08-01
categories: ["设计模式"]
---
## 定义
通过复制（克隆、拷贝）一个指定类型的对象来创建更多同类型的对象。这个指定的对象可被称为“原型”对象，也就是通过复制原型对象来得到更多同类型的对象。即原型设计模式。
## 结构

![prototype](img/prototype.png)

### 抽象原型（Prototype）角色
规定了具体原型对象必须实现的接口（如果要提供深拷贝，则必须具有实现 clone 的规定）
### 具体原型（ConcretePrototype）
从抽象原型派生而来，是客户程序使用的对象，即被复制的对象。此角色需要实现抽象原型角色所要求的接口。

## 实现

```java
/**
 * 抽象原型角色
 */
public interface Prototype {
    Prototype clone();
}

/**
 * 具体原型角色
 */
public class ConcretePrototype1 implements Prototype {
    private String name;

    public ConcretePrototype1(String name) {
        this.name = name;
    }

    public Prototype clone() {
        return new ConcretePrototype1(name);
    }

    public String toString(){
        return "Now in Prototype1, the name is " + this.name;
    }
}

/**
 * 具体原型角色
 */
public class ConcretePrototype2 implements Prototype{
    private String name;

    public ConcretePrototype2(String name) {
        this.name = name;
    }

    public Prototype clone() {
        return new ConcretePrototype2(name);
    }

    public String toString(){
        return "Now in Prototype2, the name is " + name;
    }
}

public class PrototypeTest {
    @Test
    public void test() {
        Prototype p1 = new ConcretePrototype1("aaa");
        //获取原型来创建对象
        Prototype clonedP1 = p1.clone();
        System.out.println("clonedP1：" + clonedP1);

        //有人动态的切换了实现
        Prototype p2 = new ConcretePrototype2("bbb");
        Prototype clonedP2 = p2.clone();
        System.out.println("clonedP2：" + clonedP2);
    }
}

## 结果
clonedP1：Now in Prototype1, the name is aaa
clonedP2：Now in Prototype2, the name is bbb
```

## 扩展
### 浅拷贝
被拷贝对象的所有变量都含有与原对象相同的值，而且对其他对象的引用仍然是指向原来的对象。即浅拷贝只负责当前对象实例，对引用的对象不做拷贝。
### 深拷贝
被拷贝对象的所有的变量都含有与原来对象相同的值，除了那些引用其他对象的变量。那些引用其他对象的变量将指向一个被拷贝的新对象，而不再是原有那些被引用对象。即深拷贝把要拷贝的对象所引用的对象也都拷贝了一次，而这种对被引用到的对象拷贝叫做间接拷贝。