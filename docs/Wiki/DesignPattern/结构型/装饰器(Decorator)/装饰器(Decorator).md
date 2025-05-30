---
title: 装饰模式
description: "装饰模式"
slug: "/backend/design-pattern/structure/decorator"
hide_table_of_contents: false
keywords: ["设计模式", "结构型"]
tags: ["设计模式", "结构型"]
date: 2017-08-01
categories: ["设计模式"]
---
## 概述
装饰器模式：动态地给一个对象添加一些额外的职责或者行为，就增加功能来说，Decorator 模式相比生成子类更为灵活。

装饰器模式提供了改变子类的灵活方案，装饰器模式在不必改变原类文件和使用继承的情况下，动态的扩展一个对象的功能，它是通过创建一个包装对象，也就是装饰来包裹真实的对象。

当用于一组子类时，装饰器模式更加有用。如果你拥有一组子类（从一个父类派生而来），你需要在与子类独立使用情况下添加额外的特性，你可以使用装饰器模式，以避免代码重复和具体子类数量的增加。

## 适用性
+ 在不影响其他对象的情况下，以动态、透明的方式给单个对象添加职责。
+ 处理那些可以撤消的职责。
+ 当不能采用生成子类的方法进行扩充，一种情况是，可能有大量独立的扩展
+ 为支持每一种组合将产生大量的子类，使得子类数目呈爆炸性增长。
+ 另一种情况可能是因为类定义被隐藏，或类定义不能用于生成子类。

## 结构
![decorator](img/decorator.png)
### 抽象组件角色(Component)
定义一个对象接口，以规范准备接受附加责任的对象，即可以给这些对象动态地添加职责。
### 具体组件角色(ConcreteComponent)
被装饰者，定义一个将要被装饰增加功能的类，可以给这个类的对象添加一些职责
### 抽象装饰器(Decorator)
维持一个指向构件 Component 对象的实例，并定义一个与抽象组件角色 Component 接口一致的接口
### 具体装饰器角色（ConcreteDecorator)
向组件添加职责。

## 实现
 ```java
/**
 * 组件接口，定义组件规则
 */
public abstract class Component {
    public abstract void operation();
}

/**
 * 具体组件，被装饰者实例
 */
public class ConcreteComponent extends Component {
    @Override
    public void operation() {
        System.out.println("具体组件");
    }
}

/**
 * 装饰者父类
 */
public class Decorator extends Component {
    private Component component;

    public void setComponent(Component compontent){
        this.component = compontent;
    }
    
    @Override
    public void operation() {
        if (component != null){
            component.operation();
        }
    }
}

/**
 * 具体装饰者
 */
public class ConcreteDecoratorA extends Decorator {
    private String addState; //标识区分其他ConcreteDecorator

    public void operation(){
        super.operation();
        addState = "new State";
        System.out.println("具体装饰A");
    }
}

/**
 * 具体装饰者
 */
public class ConcreteDecoratorB extends Decorator {
    public void operation(){
        super.operation();
        addOperation();
    }

    public void addOperation(){
				System.out.println("具体装饰B");
    }
}

public class DecoratorTest {
    @Test
    public void test() {
        ConcreteComponent component = new ConcreteComponent();
        ConcreteDecoratorA decoratorA = new ConcreteDecoratorA();
        ConcreteDecoratorB decoratorB = new ConcreteDecoratorB();

        decoratorA.setComponent(component);
        decoratorB.setComponent(decoratorA);
        decoratorB.operation();
    }
}

## 结果
具体组件
具体装饰A
具体装饰B
 ```

## 装饰者模式的应用
Java 中 IO 流的设计就大量运用了装饰模式:

```java
BufferedReader br = new BufferedReader(new InputStreamReader(new FileInputStream("..")));
```

- java.io.BufferedInputStream(InputStream)
- java.io.DataInputStream(InputStream)
- java.io.BufferedOutputStream(OutputStream)
- java.util.zip.ZipOutputStream(OutputStream)
- java.util.Collections#checked[List|Map|Set|SortedSet|SortedMap]

## 分析

### 装饰模式的特点
+ 装饰对象和真实对象有相同的接口，这样客户端对象就可以以和真实对象相同的方式和装饰对象交互。

+ 装饰对象包含一个真实对象的索引（reference）

+ 装饰对象接受所有的来自客户端的请求，它把这些请求转发给真实的对象。

+ 装饰对象可以在转发这些请求以前或以后增加一些附加功能。这样就确保了在运行时，不用修改给定对象的结构就可以在外部增加附加的功能。在面向对象的设计中，通常是通过继承来实现对给定类的功能扩展。

  

### Decorator 模式优缺点
+ 比静态继承更灵活：与对象的静态继承（多重继承）相比，Decorator 模式提供了更加灵活的向对象添加职责的方式。可以用添加和分离的方法，用装饰在运行时刻增加和删除职责。相比之下，继承机制要求为每个添加的职责创建一个新的子类。这会产生许多新的类，并且会增加系统的复杂度。此外，为一个特定的 Component 类提供多个不同的 Decorator 类，这就使得你可以对一些职责进行混合和匹配。使用 Decorator 模式可以很容易地重复添加一个特性。

+ 避免在层次结构高层的类有太多的特征 Decorator 模式提供了一种“即用即付”的方法来添加职责。它并不试图在一个复杂的可定制的类中支持所有可预见的特征，相反，你可以定义一个简单的类，并且用 Decorator 类给它逐渐地添加功能。可以从简单的部件组合出复杂的功能。这样，应用程序不必为不需要的特征付出代价。同时更易于不依赖于 Decorator 所扩展（甚至是不可预知的扩展）的类而独立地定义新类型的 Decorator。扩展一个复杂类的时候，很可能会暴露与添加的职责无关的细节。 

+ Decorator 与它的 Component 不一样，Decorator 是一个透明的包装。如果我们从对象标识的观点出发，一个被装饰了的组件与这个组件是有差别的，因此，使用装饰不应该依赖对象标识。

  
## 装饰器模式与其他相关模式
### Adapter 模式
Decorator 模式不同于 Adapter 模式，因为装饰仅改变对象的职责而不改变它的接口，而适配器将给对象一个全新的接口。
### Composite 模式
可以将装饰视为一个退化的、仅有一个组件的组合。然而，装饰仅给对象添加一些额外的职责—它的目的不在于对象聚集。
### Strategy 模式
用一个装饰你可以改变对象的外表；而 Strategy 模式使得你可以改变对象的内核，这是改变对象的两种途径。
## 总结

+ 使用装饰器设计模式设计类的目标是：不必重写任何已有的功能性代码，而是对某个基于对象应用增量变化。
+ 装饰器设计模式采用这样的构建方式：在主代码流中应该能够直接插入一个或多个更改或“装饰”目标对象的装饰器，同时不影响其他代码流。
+ Decorator 模式采用对象组合而非继承的手法，实现了在运行时动态的扩展对象功能的能力，而且可以根据需要扩展多个功能，避免了单独使用继承带来的“灵活性差”和“多子类衍生问题”。同时它很好地符合面向对象设计原则中“优先使用对象组合而非继承”和“开放-封闭”原则。