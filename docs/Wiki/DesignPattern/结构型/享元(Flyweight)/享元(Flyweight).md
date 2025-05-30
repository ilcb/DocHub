---
title: 享元模式
description: "享元模式"
slug: "/backend/design-pattern/structure/flyweight"
hide_table_of_contents: false
keywords: ["设计模式", "结构型"]
tags: ["设计模式", "结构型"]
date: 2017-08-01
categories: ["设计模式"]
---
## 概述
面向对象技术可以很好地解决系统一些灵活性或可扩展性或抽象性的问题，但在很多情况下需要在系统中增加类和对象的个数。当对象数量太多时，将导致运行代价过高，带来性能下降等问题。比如:
例子 1:图形应用中的图元等对象、字处理应用中的字符对象等。
## 解决方案
享元模式（Flyweight）：对象结构型模式，运用共享技术有效地支持大量细粒度的对象。
它使用共享物件，用来尽可能减少内存使用量以及分享资讯给尽可能多的相似物件；它适合用于当大量物件只是重复因而导致无法令人接受的使用大量内存，通常物件中的部分状态是可以分享。常见做法是把它们放在外部数据结构，当需要使用时再将它们传递给享元。
## 适用性
+ 一个应用程序使用大量相同或者相似的对象，造成很大的存储开销。
+ 对象的大部分状态都可以外部化，可以将这些外部状态传入对象中。
+ 如果删除对象的外部状态，那么可以用相对较少的共享对象取代很多组对象。
+ 应用程序不依赖于对象标识。由于 Flyweight 对象可以被共享，对于概念上明显有别的对象，标识测试将返回真值。
+ 使用享元模式需要维护一个存储享元对象的享元池，而这需要耗费资源，因此，应当在多次重复使用享元对象时才值得使用享元模式
## 结构

![flyweight](img/flyweight.png)

### 抽象享元类(Flyweight)
描述一个接口，通过这个接口 flyweight 可以接受并作用于外部状态。
### 具体享元类(ConcreteFlyweight)
实现 Flyweight 接口，并为内部状态（如果有的话)增加存储空间。ConcreteFlyweight 对象必须是可共享的，它所存储的状态必须是内部的，即它必须独立于 ConcreteFlyweight 对象的场景。
### 非共享具体享元类(UnsharedConcreteFlyweight)
并非所有的 Flyweight 子类都需要被共享。Flyweight 接口使共享成为可能，但它并不强制共享。在 Flyweight 对象结构的某些层次，UnsharedConcreteFlyweight 对象通常将 ConcreteFlyweight 对象作为子节点。
### 享元工厂类(FlyweightFactory)
创建并管理 flyweight 对象，确保合理地共享 flyweight。本角色必须保证享元对象可以被系统适当地共享，当一个客户端对象调用一个享元对象 flyweight 的时候，享元工厂角色（FlyweightFactory 对象）会检查系统中是否已经有一个符合要求的享元对象。如果已经有了，享元工厂角色就应当提供这个已有的享元对象，如果系统中没有一个适当的享元对象的话，享元工厂角色就应当创建一个合适的享元对象。

## 实现

享元模式可以分成单纯享元模式和复合享元模式两种形式。
### 单纯享元模式
在单纯的享元模式中，所有的享元对象都是可以共享的。
```java
/**
 * 抽象享元
 */
public abstract class Website {
    public abstract void use(User user);
}

/**
 * 具体享元
 */
public class ConcreteWebsite extends Website{
    private String name;

    public ConcreteWebsite(String name){
        this.name = name;
    }

    @Override
    public void use(User user) {
        System.out.println("对象地址: " + System.identityHashCode(this));
        System.out.println("网站分类:" + name + ", 用户: " + user.getName());
    }
}

/**
 * 用户
 */
public class User {
    public String name;

    public User(String name){
        this.name = name;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}

/**
 * 享元工厂
 */
public class WebsiteFactory {
    private Map<String, Website> websiteMap = new HashMap<String, Website>();

    public Website getWebsite(String key){
        if (!websiteMap.containsKey(key)){
            websiteMap.put(key, new ConcreteWebsite(key));
        }

        return websiteMap.get(key);
    }

    public int getWebsiteCount(){
        return websiteMap.size();
    }
}

public class WebsiteTest {
    @Test
    public void test() {
        WebsiteFactory factory = new WebsiteFactory();
        Website website1 = factory.getWebsite("Blog");
        website1.use(new User("A"));

        Website website2 = factory.getWebsite("Blog");
        website2.use(new User("B"));
    }
}

## 结果
对象地址: 422392391
网站分类:Blog, 用户: A
对象地址: 422392391
网站分类:Blog, 用户: B
```

### 复合享元模式

复合享元模式对象是由一些单纯享元使用合成模式加以复合而成

复合享元角色所代表的对象是不可以共享的，但是一个复合享元对象可以分解成为多个本身是单纯享元对象的组合。

```java
/**
 * 所有具体享元类的父类或接口，通过这个接口，享元类可以接受并作用于外部状态
 */
public abstract class Flyweight {
    public abstract void operation(int externsicState);
}

/**
 * 具体享元
 */
public class ConcreteFlyweight extends Flyweight {
    public void operation(int externsicState){
        System.out.println("状态: " + externsicState);
    }
}

/**
 * 具体非享元
 */
public class UnsharedConcreteFlyweight extends Flyweight {
    public void operation(int externsicState){
        System.out.println("不共享的状态: " + externsicState);
    }
}

/**
 * 享元工厂
 */
public class FlyweightFactory {
    private Map<String, Flyweight> factory = new HashMap<String, Flyweight>();

    public FlyweightFactory(){
        factory.put("X", new ConcreteFlyweight());
        factory.put("Y", new ConcreteFlyweight());
        factory.put("Z", new ConcreteFlyweight());
    }

    public Flyweight getFlyweight(String key){
        return factory.get(key);
    }
}

public class FlyweightTest {
    @Test
    public void test() {
        int externsicState = 10;
        FlyweightFactory factory = new FlyweightFactory();

        Flyweight flyweight1 = factory.getFlyweight("X");
        flyweight1.operation(--externsicState);

        Flyweight flyweight2 = factory.getFlyweight("Y");
        flyweight2.operation(--externsicState);

        Flyweight flyweight3 = factory.getFlyweight("Z");
        flyweight3.operation(--externsicState);

        UnsharedConcreteFlyweight unsharedConcreteFlyweight = new UnsharedConcreteFlyweight();
        unsharedConcreteFlyweight.operation(--externsicState);
    }
}

## 结果
状态: 9
状态: 8
状态: 7
不共享的状态: 6
```

## 其他相关模式
### Singleton 模式
客户端要引用享元对象，是通过工厂对象创建或者获得的，客户端每次引用一个享元对象，都是可以通过同一个工厂对象来引用所需要的享元对象。因此，可以将享元工厂设计成单例模式，这样就可以保证客户端只引用一个工厂实例。因为所有的享元对象都是由一个工厂对象统一管理的，所以在客户端没有必要引用多个工厂对象。不管是单纯享元模式还是复合享元模式中的享元工厂角色，都可以设计成为单例模式，对于结果是不会有任何影响的。
### Composite 模式
Flyweight 模式通常和 Composite 模式结合起来，用共享叶结点的有向无环图实现一个逻辑上的层次结构，复合享元模式实际上是单纯享元模式与合成模式的组合。单纯享元对象可以作为树叶对象来讲，是可以共享的，而复合享元对象可以作为树枝对象，因此在复合享元角色中可以添加聚集管理方法。通常，最好用 Flyweight 实现 State 和 Strategy 对象。

## 总结
### 优点
- 享元模式的优点在于它可以极大减少内存中对象的数量，使得相同对象或相似对象在内存中只保存一份。
- 享元模式的外部状态相对独立，而且不会影响其内部状态，从而使得享元对象可以在不同的环境中被共享。

### 缺点
- 享元模式使得系统更加复杂，需要分离出内部状态和外部状态，这使得程序的逻辑复杂化。
- 为了使对象可以共享，享元模式需要将享元对象的状态外部化，而读取外部状态使得运行时间变长。

享元模式是一个考虑系统性能的设计模式，通过使用享元模式可以节约内存空间，提高系统的性能。
享元模式的核心在于享元工厂类，享元工厂类的作用在于提供一个用于存储享元对象的享元池，用户需要对象时，首先从享元池中获取，如果享元池中不存在，则创建一个新的享元对象返回给用户，并在享元池中保存该新增对象。
享元模式以共享的方式高效地支持大量的细粒度对象，享元对象能做到共享的关键是区分内部状态(InternalState)和外部状态(ExternalState)
**内部状态**是存储在享元对象内部并且不会随环境改变而改变的状态，因此内部状态可以共享
**外部状态**是随环境改变而改变的、不可以共享的状态。享元对象的外部状态必须由客户端保存，并在享元对象被创建之后，在需要使用的时候再传入到享元对象内部。一个外部状态与另一个外部状态之间是相互独立的

[]: ./装饰模式.md	""xx""