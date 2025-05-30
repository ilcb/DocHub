---
title: 命令模式
description: "命令模式"
slug: "/backend/design-pattern/action/command"
hide_table_of_contents: false
keywords: ["设计模式", "结构型"]
tags: ["设计模式", "结构型"]
date: 2017-08-01
categories: ["设计模式"]
---
## 概述
在软件设计中，经常需要向某些对象发送请求，但是并不知道请求的接收者是谁，也不知道被请求的操作是哪个，只需在程序运行时指定具体的请求接收者即可，此时，可以使用命令模式来进行设计，使得请求发送者与请求接收者消除彼此之间的耦合，让对象之间的调用关系更加灵活。
例子：电视机遥控器:遥控器是请求的发送者，电视机是请求的接收者，遥控器上有一些按钮如开关，换频道等按钮就是具体命令，不同的按钮对应电视机的不同操作。
## 问题
在软件系统中，“行为请求者”与“行为实现者”通常呈现一种“紧耦合”。但在某些场合，比如要对行为进行“记录、撤销/重做、事务”等处理，这种无法抵御变化的紧耦合是不合适的。在这种情况下，如何将“行为请求者”与“行为实现者”解耦？
## 定义
命令模式(Command)：将一个请求封装为一个对象，从而使可用不同的请求对客户进行参数化；
## 适用性
+ 系统需要将请求调用者和请求接收者解耦，使得调用者和接收者不直接交互。
+ 系统需要在不同的时间指定请求、将请求排队和执行请求。
+ 系统需要支持命令的撤销(Undo)操作和恢复(Redo)操作。
+ 系统需要将一组操作组合在一起，即支持宏命令。
## 结构

![command](img/command.png)

### 抽象命令类(Command)

声明执行操作的接口。调用接收者相应的操作，以实现执行的方法 Execute。
### 具体命令类(ConcreteCommand)
创建一个具体命令对象并设定它的接收者，通常会持有接收者，并调用接收者的功能来完成命令要执行的操作。
### 调用者(Invoker)
要求该命令执行这个请求，通常会持有命令对象，可以持有很多的命令对象。
### 接收者(Receiver)
知道如何实施与执行一个请求相关的操作，任何类都可能作为一个接收者,只要它能够实现命令要求实现的相应功能。
### 客户类(Client)
创建具体的命令对象，并且设置命令对象的接收者。真正使用命令的客户端是从 Invoker 来触发执行。

## 实现
```java
/**
 * 声明执行操作的接口
 */
public abstract class Command{
    protected Receiver receiver;

    public Command(Receiver receiver){
        this.receiver = receiver;
    }

    public abstract void execute();
}

/**
 * 具体命令
 */
public class ConcreteCommand extends Command {

    public ConcreteCommand(Receiver receiver){
        super(receiver);
    }

    @Override
    public void execute() {
        receiver.action();
    }
}

/**
 * 要求该命令执行这个操作
 */
public class Invoker {
    private Command command;

    public Invoker(Command command){
        this.command = command;
    }

    public void executeCommand(){
        command.execute();
    }
}

/**
 * 知道如何实施与执行一个与请求相关的操作，任何类都可能作为一个接收者
 */
public class Receiver {
    public void action(){
        System.out.println("执行请求!");
    }
}

public class CommandTest {
    @Test
    public void test() {
        Receiver receiver = new Receiver();
        ConcreteCommand command = new ConcreteCommand(receiver);
        Invoker invoker = new Invoker(command);
        invoker.executeCommand();
    }
}

## 结果
执行请求!
```

## 总结
### 优点
+ 降低系统的耦合度：Command 模式将调用操作的对象与知道如何实现该操作的对象解耦。
+ Command 是头等的对象，它们可像其他的对象一样被操纵和扩展。
+ 组合命令：你可将多个命令装配成一个组合命令，即可以比较容易地设计一个命令队列和宏命令。一般说来，组合命令是 Composite 模式的一个实例。
+ 增加新的 Command 很容易，因为这无需改变已有的类。
+ 可以方便地实现对请求的 Undo 和 Redo。

### 缺点
使用命令模式可能会导致某些系统有过多的具体命令类。因为针对每一个命令都需要设计一个具体命令类，因此某些系统可能需要大量具体命令类，这将影响命令模式的使用。

命令模式的本质是对命令进行封装，将发出命令的责任和执行命令的责任分割开。
每一个命令都是一个操作：请求的一方发出请求，要求执行一个操作；接收的一方收到请求，并执行操作
命令模式允许请求的一方和接收的一方独立开来，使得请求的一方不必知道接收请求的一方的接口，更不必知道请求是怎么被接收，以及操作是否被执行、何时被执行，以及是怎么被执行的。
命令模式使请求本身成为一个对象，这个对象和其他对象一样可以被存储和传递。
命令模式的关键在于引入了抽象命令接口，且发送者针对抽象命令接口编程，只有实现了抽象命令接口的具体命令才能与接收者相关联。