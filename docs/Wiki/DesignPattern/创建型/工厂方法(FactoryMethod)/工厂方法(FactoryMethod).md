---
title: 工厂方法模式
description: "工厂方法模式"
slug: "/backend/design-pattern/creation/factory-method"
hide_table_of_contents: false
keywords: ["设计模式", "创建型"]
tags: ["设计模式", "创建型"]
date: 2017-08-01
categories: ["设计模式"]
---

## 定义
定义了一个创建对象的接口，但由子类决定要实例化哪个类，工厂方法把实例化操作推迟到子类。
工厂方法模式去掉了简单工厂模式中工厂方法的静态属性，使得它可以被子类继承。这样在简单工厂模式里集中在工厂方法上的压力可以由工厂方法模式里不同的工厂子类来分担。

## 结构
![factorymethod](img/factorymethod.png)

### 抽象工厂角色 
抽象工厂是具体工厂角色必须实现的接口或者必须继承的父类。 一个抽象工厂类，可以派生出多个具体工厂类。
### 具体工厂角色
实现抽象工厂的接口，用于创建对应的具体产品的对象。每个具体工厂类只能创建一个具体产品类的实例。
### 抽象产品角色

抽象产品是具体产品继承的父类或者是实现的接口。一个抽象产品类，可以派生出多个具体产品类。
### 具体产品角色
具体工厂角色所创建的对象就是此角色的实例。

## 实现

```java
/**
 * 抽象工厂
 */
public interface IOperationFactory {
    IOperation createOperation();
}

/**
 * 加法工厂
 */
public class AddOperationFactory implements IOperationFactory {
    public IOperation createOperation() {
        return new Add();
    }
}

/**
 * 减法工厂
 */
public class SubOperationFactory implements IOperationFactory {
    public IOperation createOperation() {
        return new Sub();
    }
}

/**
 * 乘法工厂
 */
public class MultipleOperationFactory implements IOperationFactory {
    public IOperation createOperation() {
        return new Multiple();
    }
}

/**
 * 除法工厂
 */
public class DivisionOperationFactory implements IOperationFactory {
    public IOperation createOperation() {
        return new Division();
    }
}

/**
 * 抽象操作（抽象产品角色）
 */
public interface IOperation {
    double calculate(double num1, double num2);
}

/**
 * 加法（具体产品角色）
 */
public class Add implements IOperation {
    public double calculate(double num1, double num2) {
        return num1 + num2;
    }
}

/**
 * 减法（具体产品角色）
 */
public class Sub implements IOperation {
    public double calculate(double num1, double num2) {
        return num1 - num2;
    }
}

/**
 * 乘法（具体产品角色）
 */
public class Multiple implements IOperation {
    public double calculate(double num1, double num2) {
        return num1 * num2;
    }
}

/**
 * 除法（具体产品角色）
 */
public class Division implements IOperation{
    public double calculate(double num1, double num2) {
        return num1 != 0 ? num1 / num2 : Double.MIN_VALUE;
    }
}

public class OperationFactoryTest {
    @Test
    public void test() {
        IOperationFactory factory = new AddOperationFactory();
        IOperation operation = factory.createOperation();
        double total = operation.calculate(1.0, 3.0);
        System.out.println(total);
        Assert.assertEquals(4.0, total, 0.0001);
    }
}

## 结果
4.0
```

## 小结
### 工厂方法模式的优点
+ 在工厂方法模式中，工厂方法用来创建客户所需要的产品，同时还向客户隐藏了哪种具体产品类将被实例化这一细节，用户只需要关心所需产品对应的工厂，无须关心创建细节，甚至无须知道具体产品类的类名。
基于工厂角色和产品角色的多态性设计是工厂方法模式的关键，它能够使工厂可以自主确定创建何种产品对象，而如何创建这个对象的细节则完全封装在具体工厂内部。工厂方法模式之所以又被称为多态工厂模式，是因为所有的具体工厂类都具有同一抽象父类。
+ 使用工厂方法模式的另一个优点是在系统中加入新产品时，无须修改抽象工厂和抽象产品提供的接口，无须修改客户端，也无须修改其他的具体工厂和具体产品，而只要添加一个具体工厂和具体产品就可以了。这样，系统的可扩展性也就变得非常好，完全符合“开闭原则”。

### 工厂方法模式的缺点
+ 在添加新产品时，需要编写新的具体产品类，而且还要提供与之对应的具体工厂类，系统中类的个数将成对增加，在一定程度上增加了系统的复杂度。
+ 由于考虑到系统的可扩展性，需要引入抽象层，在客户端代码中均使用抽象层进行定义，增加了系统的抽象性和理解难度，且在实现时可能需要用到 DOM、反射等技术，增加了系统的实现难度。

### 模式适用环境
在以下情况下可以使用工厂方法模式：

- 一个类不知道它所需要的对象的类：在工厂方法模式中，客户端不需要知道具体产品类的类名，只需要知道所对应的工厂即可，具体的产品对象由具体工厂类创建；客户端需要知道创建具体产品的工厂类。
- 一个类通过其子类来指定创建哪个对象：在工厂方法模式中，对于抽象工厂类只需要提供一个创建产品的接口，而由其子类来确定具体要创建的对象，利用面向对象的多态性和里氏代换原则，在程序运行时，子类对象将覆盖父类对象，从而使得系统更容易扩展。
- 将创建对象的任务委托给多个工厂子类中的某一个，客户端在使用时可以无须关心是哪一个工厂子类创建产品子类，需要时再动态指定，可将具体工厂类的类名存储在配置文件或数据库中。 