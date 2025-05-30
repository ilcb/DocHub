---
title: 状态模式
description: "状态模式"
slug: "/backend/design-pattern/action/state"
hide_table_of_contents: false
keywords: ["设计模式", "结构型"]
tags: ["设计模式", "结构型"]
date: 2017-08-01
categories: ["设计模式"]
---
## 概述

在软件开发过程中，应用程序可能会根据不同的情况作出不同的处理，最直接的解决方案是将这些所有可能发生的情况全都考虑到，然后使用 if...ellse 语句来做状态判断来进行不同情况的处理。但是对复杂状态的判断就显得“力不从心了”，随着增加新的状态或者修改一个状体（if else(或 switch case)语句的增多或者修改）可能会引起很大的修改，而程序的可读性，扩展性也会变得很弱。维护也会很麻烦。那么我就考虑只修改自身状态的模式。

例子 1：按钮来控制一个电梯的状态，一个电梯开们，关门，停，运行。每一种状态改变，都有可能要根据其他状态来更新处理。例如，开门状体，不能在运行的时候开门，而是在电梯定下后才能开门。

例子 2：我们给一部手机打电话，就可能出现这几种情况：用户开机，用户关机，用户欠费停机，用户消户等。所以当我们拨打这个号码的时候：系统就要判断，该用户是否在开机且不忙状态，又或者是关机，欠费等状态。但不管是那种状态我们都应给出对应的处理操作。

对象如何在每一种状态下表现出不同的行为？

## 定义

状态模式：允许一个对象在其内部状态改变时改变它的行为，对象看起来似乎修改了它的类。

在很多情况下，一个对象的行为取决于一个或多个动态变化的属性，这样的属性叫做状态，这样的对象叫做有状态的(stateful)对象，这样的对象状态是从事先定义好的一系列值中取出的。当一个这样的对象与外部事件产生互动时，其内部状态就会改变，从而使得系统的行为也随之发生变化。

## 适用性

+ 一个对象的行为取决于它的状态，并且它必须在运行时刻根据状态改变它的行为。

+ 代码中包含大量与对象状态有关的条件语句：一个操作中含有庞大的多分支的条件（ifelse(或 switchcase)语句，且这些分支依赖于该对象的状态。这个状态通常用一个或多个枚举常量表示。通常，有多个操作包含这一相同的条件结构。State 模式将每一个条件分支放入一个独立的类中，这使得可以根据对象自身的情况将对象的状态作为一个对象，这一对象可以不依赖于其他对象而独立变化。

## 结构

![state](img/state.png)

### 环境类（Context）

定义客户感兴趣的接口，维护一个 ConcreteState 子类的实例，这个实例定义当前状态。

### 抽象状态类（State）

定义一个接口以封装与 Context 的一个特定状态相关的行为。

### 具体状态类（ConcreteState）

每一子类实现一个与 Context 的一个状态相关的行为。

## 实现

```java
/**
 * 抽象状态
 */
public abstract class State {
    public abstract void handle(Context context);
}

/**
 * 具体状态
 */
public class ConcreteStateA extends State {

    @Override
    public void handle(Context context) {
        State state = new ConcreteStateB();
        context.setState(state);
    }
}

/**
 * 具体状态
 */
public class ConcreteStateB extends State {

    @Override
    public void handle(Context context) {
        State state = new ConcreteStateA();
        context.setState(state);
    }
}

/**
 * Context
 */
public class Context {
    private State state;

    public Context(State state){
        this.state = state;
    }

    public State getState(){
        return state;
    }

    public void setState(State state){
        this.state = state;
        System.out.println("当前状态:" + state.getClass().getName());
    }

    public void request(){
        state.handle(this);
    }
}

public class StateTest {
    @Test
    public void test() {
        Context context = new Context(new ConcreteStateA());
        context.request();
        context.request();
        context.request();
        context.request();
    }
}

##结果
当前状态:ConcreteStateB
当前状态:ConcreteStateA
当前状态:ConcreteStateB
当前状态:ConcreteStateA
```

电梯的例子：

```java
/**
 * 电梯状态
 */
public abstract class LiftState {
    protected Context context;

    public void setContext(Context context) {
        this.context = context;
    }

    public abstract void open();

    public abstract void close();

    public abstract void run();

    public abstract void stop();
}

/**
 * 在电梯门开启的状态下能做什么事情
 */
public class OpenningState extends LiftState {

    public void close() {
        this.context.setLiftState(new ClosingState());
        this.context.getLiftState().close();
    }

    public void open() {
        System.out.println("lift open");
    }

    public void run() {
    }

    public void stop() {
    }
}

/**
 * 电梯门关闭以后，电梯可以做哪些事情
 */
public class ClosingState extends LiftState {
    public void close() {
        System.out.println("lift close");
    }

    public void open() {
        this.context.setLiftState(new OpenningState());
        this.context.getLiftState().open();
    }

    public void run() {
        this.context.setLiftState(new RunningState());
        this.context.getLiftState().run();
    }

    public void stop() {
        this.context.setLiftState(new StoppingState());
        this.context.getLiftState().stop();
    }
}

/**
 * 电梯运行状态
 */
public class RunningState extends LiftState {
    @Override
    public void open() {

    }

    @Override
    public void close() {

    }

    @Override
    public void run() {
        System.out.println("lift run");
    }

    @Override
    public void stop() {
        this.context.setLiftState(new ClosingState());
        this.context.getLiftState().stop();
    }
}

/**
 * 电梯终止状态
 */
public class StoppingState extends LiftState {
    public void close() {
    }

    public void open() {
        this.context.setLiftState(new OpenningState());
        this.context.getLiftState().open();
    }

    public void run() {
        this.context.setLiftState(new RunningState());
        this.context.getLiftState().run();
    }

    public void stop() {
        System.out.println("lift stop");
    }
}

/**
 * 环境类:定义客户感兴趣的接口。维护一个ConcreteState子类的实例，这个实例定义当前状态。
 */
public class Context {
    public void Context() {
    }

    //定一个当前电梯状态
    private LiftState liftState;

    public LiftState getLiftState() {
        return liftState;
    }

    public void setLiftState(LiftState liftState) {
        this.liftState = liftState;
        //把当前的环境通知到各个实现类中
        liftState.setContext(this);
    }

    public void open() {
        liftState.open();
    }

    public void close() {
        liftState.close();
    }

    public void run() {
        liftState.run();
    }

    public void stop() {
        liftState.stop();
    }
}

public class StateTest {
    @Test
    public void test() {
        Context context = new Context();
        context.setLiftState(new ClosingState());

        context.open();
        context.close();
        context.run();
        context.stop();
    }
}

## 结果
lift open
lift close
lift run
lift stop

```

## 总结

### 优点

+ 它将与特定状态相关的行为局部化，并且将不同状态的行为分割开来：State 模式将所有与一个特定的状态相关的行为都放入一个对象中。因为所有与状态相关的代码都存在于某一个 State 子类中，所以通过定义新的子类可以很容易的增加新的状态和转换。另一个方法是使用数据值定义内部状态并且让 Context 操作来显式地检查这些数据。但这样将会使整个 Context 的实现中遍布看起来很相似的条件 if else 语句或 switch case 语句。增加一个新的状态可能需要改变若干个操作，这就使得维护变得复杂了。State 模式避免了这个问题，但可能会引入另一个问题，因为该模式将不同状态的行为分布在多个 State 子类中。这就增加了子类的数目，相对于单个类的实现来说不够紧凑。但是如果有许多状态时这样的分布实际上更好一些，否则需要使用巨大的条件语句。正如很长的过程一样，巨大的条件语句是不受欢迎的。它们形成一大整块并且使得代码不够清晰，这又使得它们难以修改和扩展。State 模式提供了一个更好的方法来组织与特定状态相关的代码。决定状态转移的逻辑不在单块的 if 或 switch 语句中，而是分布在 State 子类之间。将每一个状态转换和动作封装到一个类中，就把着眼点从执行状态提高到整个对象的状态。这将使代码结构化并使其意图更加清晰。

+ 它使得状态转换显式化:当一个对象仅以内部数据值来定义当前状态时,其状态仅表现为对一些变量的赋值，这不够明确。为不同的状态引入独立的对象使得转换变得更加明确。而且,State 对象可保证 Context 不会发生内部状态不一致的情况，因为从 Context 的角度看，状态转换是原子的—只需重新绑定一个变量(即 Context 的 State 对象变量)，而无需为多个变量赋值

+ State 对象可被共享如果 State 对象没有实例变量—即它们表示的状态完全以它们的类型来编码—那么各 Context 对象可以共享一个 State 对象。当状态以这种方式被共享时,它们必然是没有内部状态,只有行为的轻量级对象。

### 缺点

+ 状态模式的使用必然会增加系统类和对象的个数。
+ 状态模式的结构与实现都较为复杂，如果使用不当将导致程序结构和代码的混乱。
状态模式的主要优点在于封装了转换规则，并枚举可能的状态，它将所有与某个状态有关的行为放到一个类中，并且可以方便地增加新的状态，只需要改变对象状态即可改变对象的行为，还可以让多个环境对象共享一个状态对象，从而减少系统中对象的个数；其缺点在于使用状态模式会增加系统类和对象的个数，且状态模式的结构与实现都较为复杂，如果使用不当将导致程序结构和代码的混乱，对于可以切换状态的状态模式不满足“开闭原则”的要求。

## 与其他相关模式

### 职责链模式

职责链模式和状态模式都可以解决 If 分支语句过多，

从定义来看，状态模式是一个对象的内在状态发生改变（一个对象，相对比较稳定，处理完一个对象下一个对象的处理一般都已确定），而职责链模式是多个对象之间的改变（多个对象之间的话，就会出现某个对象不存在的现在，就像我们举例的公司请假流程，经理可能不在公司情况），这也说明他们两个模式处理的情况不同。

这两个设计模式最大的区别就是状态模式是让各个状态对象自己知道其下一个处理的对象是谁。而职责链模式中的各个对象并不指定其下一个处理的对象到底是谁，只有在客户端才设定。

用通俗的编程语言来说，就是状态模式：相当于 If else if else；职责链模式相当于 Swich case

### 策略模式：（状态模式是策略模式的孪生兄弟）

状态模式和策略模式的实现方法非常类似，都是利用多态把一些操作分配到一组相关的简单的类中，因此很多人认为这两种模式实际上是相同的。

然而在现实世界中，策略和状态是两种完全不同的思想。当我们对状态和策略进行建模时，这种差异会导致完全不同的问题。例如，对状态进行建模时，状态迁移是一个核心内容；然而，在选择策略时，迁移与此毫无关系。另外，策略模式允许一个客户选择或提供一种策略，而这种思想在状态模式中完全没有。