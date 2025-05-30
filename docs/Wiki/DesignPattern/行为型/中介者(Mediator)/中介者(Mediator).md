---
title: 中介者模式
description: "中介者模式"
slug: "/backend/design-pattern/action/mediator"
hide_table_of_contents: false
keywords: ["设计模式", "结构型"]
tags: ["设计模式", "结构型"]
date: 2017-08-01
categories: ["设计模式"]
---
## 概述

面对一系列的相交互对象。怎么样保证使各对象不需要显式地相互引用，使其耦合松散？

## 定义

中介者模式：用一个中介对象来封装一系列的对象交互。中介者使各对象不需要显式地相互引用，从而使其耦合松散，而且可以独立地改变它们之间的交互。中介者模式又称为调停者模式。

## 适用性
+ 系统中对象之间存在复杂的引用关系，产生的相互依赖关系结构混乱且难以理解。
+ 一组对象以定义良好但是以复杂的方式进行通信，产生的相互依赖关系结构混乱且难以理解。
+ 一个对象引用其他很多对象并且直接与这些对象通信,导致难以复用该对象。
+ 想通过一个中间类来封装多个类中的行为，而又不想生成太多的子类。可以通过引入中介者类来实现，在中介者中定义对象交互的公共行为，如果需要改变行为则可以增加新的中介者类。

## 结构

![mediator](img/mediator.png)

### 抽象中介者(Mediator)

中介者定义一个接口用于与各同事（Colleague）对象通信。

### 具体中介者(ConcreteMediator)

具体中介者通过协调各同事对象实现协作行为。了解并维护它的各个同事。

### 抽象同事类(Colleague)

定义同事类接口,定义各同事的公有方法.

### 具体同事类(ConcreteColleague)

实现抽象同事类中的方法。每一个同时类需要知道中介者对象；每个具体同事类只需要了解自己的行为，而不需要了解其他同事类的情况。每一个同事对象在需与其他的同事通信的时候，与它的中介者通信。

## 实现

```java
/**
 * 抽象中介者
 */
public abstract class Mediator {
    public abstract void send(String message, Colleague colleague);
}

/**
 * 具体中介类
 */
public class ConcreteMediator extends Mediator{
    private ConcreteColleague1 colleague1;
    private ConcreteColleague2 colleague2;

    public ConcreteColleague1 getColleague1() {
        return colleague1;
    }

    public void setColleague1(ConcreteColleague1 colleague1) {
        this.colleague1 = colleague1;
    }

    public ConcreteColleague2 getColleague2() {
        return colleague2;
    }

    public void setColleague2(ConcreteColleague2 colleague2) {
        this.colleague2 = colleague2;
    }

    @Override
    public void send(String message, Colleague colleague) {
        if (colleague == colleague1){
            colleague2.notify(message);
        } else {
            colleague1.notify(message);
        }
    }
}

/**
 * 抽象同事类
 */
public class Colleague {
    protected Mediator mediator;

    public Colleague(Mediator mediator) {
        this.mediator = mediator;
    }
}

/**
 * 具体同事类
 */
public class ConcreteColleague1 extends Colleague {
    public ConcreteColleague1(Mediator mediator) {
        super(mediator);
    }

    public void send(String message){
        mediator.send(message, this);
    }

    public void notify(String message){
        System.out.println(getClass().getSimpleName() + "得到消息:" + message);
    }
}

/**
 * 具体同事类
 */
public class ConcreteColleague2 extends Colleague {
    public ConcreteColleague2(Mediator mediator) {
        super(mediator);
    }

    public void send(String message){
        mediator.send(message, this);
    }

    public void notify(String message){
        System.out.println(getClass().getSimpleName() + "得到消息:" + message);
    }
}

public class MediatorTest {
    @Test
    public void test() {
        ConcreteMediator mediator = new ConcreteMediator();

        ConcreteColleague1 colleague1 = new ConcreteColleague1(mediator);
        ConcreteColleague2 colleague2 = new ConcreteColleague2(mediator);

        mediator.setColleague1(colleague1);
        mediator.setColleague2(colleague2);
        colleague1.send("Hello!");
        colleague2.send("Hi");
    }
}

## 结果
ConcreteColleague2得到消息:Hello!
ConcreteColleague1得到消息:Hi

```

## 总结
### 优点
+ 减少了子类生成:Mediator 将原本分布于多个对象间的行为集中在一起。改变这些行为只需生成 Mediator 的子类即可。这样各个 Colleague 类可被重用。
+ 简化各同事类的设计和实现:它将各同事类 Colleague 解耦，Mediator 有利于各 Colleague 间的松耦合.你可以独立的改变和复用各 Colleague 类和 Mediator 类。
+ 它简化了对象协议:用 Mediator 和各 Colleague 间的一对多的交互来代替多对多的交互。一对多的关系更易于理解、维护和扩展。
+ 它对对象如何协作进行了抽象将中介作为一个独立的概念并将其封装在一个对象中，使你将注意力从对象各自本身的行为转移到它们之间的交互上来。这有助于弄清楚一个系统中的对象是如何交互的。
+ 它使控制集中化中介者模式将交互的复杂性变为中介者的复杂性。

###缺点：
因为中介者封装了协议，即在具体中介者类中包含了同事之间的交互细节，可能会导致具体中介者类非常复杂，这可能使得中介者自身成为一个难于维护的庞然大物。

迪米特法则的一个典型应用：在中介者模式中，通过创造出一个中介者对象，将系统中有关的对象所引用的其他对象数目减少到最少，使得一个对象与其同事之间的相互作用被这个对象与中介者对象之间的相互作用所取代。因此，中介者模式就是迪米特法则的一个典型应用。
通过引入中介者对象，可以将系统的网状结构变成以中介者为中心的星形结构，中介者承担了中转作用和协调作用。中介者类是中介者模式的核心，它对整个系统进行控制和协调，简化了对象之间的交互，还可以对对象间的交互进行进一步的控制。
中介者模式的主要优点在于简化了对象之间的交互，将各同事解耦，还可以减少子类生成，对于复杂的对象之间的交互，通过引入中介者，可以简化各同事类的设计和实现；中介者模式主要缺点在于具体中介者类中包含了同事之间的交互细节，可能会导致具体中介者类非常复杂，使得系统难以维护。
中介者模式适用情况包括：系统中对象之间存在复杂的引用关系，产生的相互依赖关系结构混乱且难以理解；一个对象由于引用了其他很多对象并且直接和这些对象通信，导致难以复用该对象；想通过一个中间类来封装多个类中的行为，而又不想生成太多的子类。