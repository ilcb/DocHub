---
title: 观察者模式
description: "观察者模式"
slug: "/backend/design-pattern/action/observer"
hide_table_of_contents: false
keywords: ["设计模式", "结构型"]
tags: ["设计模式", "结构型"]
date: 2017-08-01
categories: ["设计模式"]
---
## 观察者模式
定义对象间的一种一对多的依赖关系，当一个对象的状态发生改变时，所有依赖于它的对象都得到通知并被自动更新。
观察者模式允许一个对象关注其他对象的状态，观察者模式还为被观察者提供了一种观察结构，或者说是一个主体和一个客体。主体，也就是被观察者，可以用来联系所有的观察它的观察者；客体，也就是观察者，用来接受主体状态的改变，观察就是一个可被观察的类（也就是主题）与一个或多个观察它的类（也就是客体）的协作。不论什么时候，当被观察对象的状态变化时，所有注册过的观察者都会得到通知。
观察模式将被观察者（主体）从观察者（客体）种分离出来，这样每个观察者都可以根据主体的变化分别采取各自的操作（观察模式和 Publish/Subscribe 模式一样，也是一种有效描述对象间相互作用的模式）。一个观察者可以在任何合适的时候进行注册和取消注册。

## 适用性
- 当一个抽象模型有两个方面，其中一个方面依赖于另一方面，将这二者封装在独立的对象中以使它们可以各自独立地改变和复用。
- 当对一个对象的改变需要同时改变其它对象，而不知道具体有多少对象有待改变。
- 当一个对象必须通知其它对象，而它又不能假定其它对象是谁，换言之，不希望这些对象是紧密耦合的。

## 结构

![observer](img/observer.png)

观察者模式包含如下角色：

### 主题（Subject）
目标知道它的观察者，可以有任意多个观察者观察同一个目标，提供注册和删除观察者对象的接口。
### 具体主题（ConcreteSubject）
将有关状态存入各 ConcreteObserver 对象。
### 观察者(Observer)
为那些在目标发生改变时需获得通知的对象定义一个更新接口，当它的状态发生改变时，向它的各个观察者发出通知。
### 具体观察者(ConcreteObserver)
维护一个指向 ConcreteSubject 对象的引用，存储有关状态，这些状态应与目标的状态保持一致。实现 Observer 的更新接口以使自身状态与目标的状态保持一致。

## 实现

```java
/**
 * 主题/抽象通知者
 */
public abstract class Subject {
    public List<Observer> observers = new ArrayList<Observer>();

    public void registerObserver(Observer observer){
        observers.add(observer);
    }

    public void removeObserver(Observer observer){
        observers.remove(observer);
    }

    public void notifyObservers(){
        for (Observer observer : observers){
            observer.update();
        }
    }
}

/**
 * 具体主题/通知者，将有关状态存入具体观察者对象，在具体主题内部状态发生改变时，给所有登记过的观察者发出通知
 */
public class ConcreteSubject extends Subject{
    //具体被观察者状态
    public String subjectState;

    public String getSubjectState() {
        return subjectState;
    }

    public void setSubjectState(String subjectState) {
        this.subjectState = subjectState;
    }
}

/**
 * 抽象观察者，位所有的抽象观察对象提供接口，在收到主题的通知时更新自己
 */
public abstract class Observer {
    public abstract void update();
}

/**
 * 具体观察者，实现抽象观察者角色所要求的更新接口，以便使自身的状态与主题的状态一致
 */
public class ConcreteObserver extends Observer {
    private String name;
    private String observerState;
    private ConcreteSubject subject;

    public ConcreteObserver(String name, ConcreteSubject subject) {
        this.name = name;
        this.subject = subject;
    }

    @Override
    public void update() {
        observerState = subject.getSubjectState();
        System.out.println("观察者" + name + "的状态是:" + observerState);
    }

    public ConcreteSubject getSubject() {
        return subject;
    }

    public void setSubject(ConcreteSubject subject) {
        this.subject = subject;
    }
}

public class ObserverTest {
    @Test
    public void test() {
        ConcreteSubject subject = new ConcreteSubject();
        subject.registerObserver(new ConcreteObserver("A", subject));
        subject.registerObserver(new ConcreteObserver("B", subject));
        subject.registerObserver(new ConcreteObserver("C", subject));

        subject.subjectState = "OMG";
        subject.notifyObservers();
    }
}

结果：
观察者A的状态是:OMG
观察者B的状态是:OMG
观察者C的状态是:OMG
```

## 分析
观察者模式的优点:
1. 观察者模式可以实现表示层和数据逻辑层的分离，并定义了稳定的消息更新传递机制，抽象了更新接口，使得可以有各种各样不同的表示层作为具体观察者角色。
2. 在观察主题和观察者之间建立一个抽象的耦合：一个主题所知道的仅仅是它有一系列观察者，每个都符合抽象的 Observer 类的简单接口。主题不知道任何一个观察者属于哪一个具体的类，这样主题和观察者之间的耦合是抽象的和最小的。因为主题和观察者不是紧密耦合的，它们可以属于一个系统中的不同抽象层次。一个处于较低层次的目标对象可与一个处于较高层次的观察者通信并通知它，这样就保持了系统层次的完整。如果目标和观察者混在一块，那么得到的对象要么横贯两个层次(违反了层次性)，要么必须放在这两层的某一层中(这可能会损害层次抽象)。
3. 支持广播通信:不像通常的请求,目标发送的通知不需指定它的接收者。通知被自动广播给所有已向该目标对象登记的有关对象。目标对象并不关心到底有多少对象对自己感兴趣;它唯一的责任就是通知它的各观察者。这给了你在任何时刻增加和删除观察者的自由。处理还是忽略一个通知取决于观察者。
4. 观察者模式符合“开闭原则”的要求。
观察者模式的缺点
1. 如果一个观察目标对象有很多直接和间接的观察者的话，将所有的观察者都通知到会花费很多时间。
2. 如果在观察者和观察目标之间有循环依赖的话，观察目标会触发它们之间进行循环调用，可能导致系统崩溃。
3. 观察者模式没有相应的机制让观察者知道所观察的目标对象是怎么发生变化的，而仅仅只是知道观察目标发生了变化。

## 总结
通过 Observer 模式，把一对多对象之间的通知依赖关系的变得更为松散，大大地提高了程序的可维护性和可扩展性，也很好的符合了开放-封闭原则。