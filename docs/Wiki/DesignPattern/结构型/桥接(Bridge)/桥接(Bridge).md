---
title: 桥接模式
description: "桥接模式"
slug: "/backend/design-pattern/structure/dridge"
hide_table_of_contents: false
keywords: ["设计模式", "结构型"]
tags: ["设计模式", "结构型"]
date: 2017-08-01
categories: ["设计模式"]
---
## 概述
桥接模式(Bridge Pattern)：将抽象部分与它的实现部分分离，使它们都可以独立地变化。它是一种对象结构型模式，又称为柄体(Handle and Body)模式或接口(Interface)模式。
桥梁模式的用意是"将抽象化(Abstraction)与实现化(Implementation)脱耦，使得二者可以独立地变化"。这句话有三个关键词，也就是抽象化、实现化和脱耦。将类与类之间继承的关系，变为抽象类或者接口与接口之间的关联关系，实现了抽象化与实现化的脱耦。
+ 抽象化
存在于多个实体中的共同的概念性联系，就是抽象化。作为一个过程，抽象化就是忽略一些信息，从而把不同的实体当做同样的实体对待。
+ 实现化
抽象化给出的具体实现，就是实现化。
+ 脱耦
所谓耦合，就是两个实体的行为的某种强关联。而将它们的强关联去掉，就是耦合的解脱，或称脱耦。在这里，脱耦是指将抽象化和实现化之间的耦合解脱开，或者说是将它们之间的强关联改换成弱关联。
将两个角色之间的继承关系改为聚合关系，就是将它们之间的强关联改换成为弱关联。因此，桥梁模式中的所谓脱耦，就是指在一个软件系统的抽象化和实现化之间使用组合/聚合关系而不是继承关系，从而使两者可以相对独立地变化。这就是桥梁模式的用意
## 适用性
+ 不希望在抽象和实现部分之间有一个固定的邦定关系，如在程序的运行时刻实现部分应该可以被选择或者切换。
+ 类的抽象以及他的视像都可以通过生成子类的方法加以扩充，这时 bridge 模式使你可以对不同的抽象接口和实现部分进行组合，并对他们进行扩充。
+ 对一个抽象的实现部分的修改应该对客户不产生影响，即客户的代码不需要重新编译。
+ 想对客户完全隐藏抽象的实现部分。
+ 想在多个实现间共享实现，但同时要求客户并不知道这一点。
## 结构

![bridge](img/bridge.png)

### 抽象类(Abstraction)
定义抽象类的接口,维护一个指向 Implementor 类型对象的指针
### 扩充抽象类(RefinedAbstraction)
扩充由 Abstraction 定义的接口
### 实现类接口(Implementor) 
定义实现类的接口，该接口不一定要与 Abstraction 的接口完全一致；事实上这两个接口可以完全不同。一般来讲，Implementor 接口仅提供基本操作，而 Abstraction 则定义了基于这些基本操作的较高层次的操作。
### 具体实现类(ConcreteImplementor) 
实现 Implementor 接口并定义它的具体实现。

## 实现
```java
/**
 *  定义抽象类的接口
 */
public class Abstraction {
    protected Implementor implementor;

    public void setImplementor(Implementor implementor){
        this.implementor = implementor;
    }

    public void operation(){
        implementor.operation();
    }
}

/**
 *  定义实现类的接口
 */
public abstract class Implementor {
    public abstract void operation();
}

/**
 *  实现Implementor接口并定义它的具体实现
 */
public class ConcreteImplementorA extends Implementor{
    @Override
    public void operation() {
        System.out.println("具体实现A");
    }
}

/**
 * 实现Implementor接口并定义它的具体实现
 */
public class ConcreteImplementorB extends Implementor{
    @Override
    public void operation() {
        System.out.println("具体实现B");
    }
}

/**
 *  扩充由Abstraction定义的接口
 */
public class RefinedAbstraction extends Abstraction{
    public void operation(){
        implementor.operation();
    }
}

public class BridgeTest {
    @Test
    public void test() {
        Abstraction abstraction = new RefinedAbstraction();

        abstraction.setImplementor(new ConcreteImplementorA());
        abstraction.operation();

        abstraction.setImplementor(new ConcreteImplementorB());
        abstraction.operation();
    }
}

## 结果
具体实现A
具体实现B
```
模拟毛笔：
现需要提供大中小 3 种型号的画笔，能够绘制 5 种不同颜色，如果使用蜡笔，我们需要准备 3*5=15 支蜡笔，也就是说必须准备 15 个具体的蜡笔类。而如果使用毛笔的话，只需要 3 种型号的毛笔，外加 5 个颜料盒，用 3+5=8 个类就可以实现 15 支蜡笔的功能。
实际上，蜡笔和毛笔的关键一个区别就在于笔和颜色是否能够分离。即将抽象化(Abstraction)与实现化(Implementation)脱耦，使得二者可以独立地变化"。关键就在于能否脱耦。蜡笔的颜色和蜡笔本身是分不开的，所以就造成必须使用 15 支色彩、大小各异的蜡笔来绘制图画。而毛笔与颜料能够很好的脱耦，各自独立变化，便简化了操作。在这里，抽象层面的概念是："毛笔用颜料作画"，而在实现时，毛笔有大中小三号，颜料有红绿蓝黑白等 5 种，于是便可出现 3×5 种组合。每个参与者（毛笔与颜料）都可以在自己的自由度上随意转换。
蜡笔由于无法将笔与颜色分离，造成笔与颜色两个自由度无法单独变化，使得只有创建 15 种对象才能完成任务。
Bridge 模式将继承关系转换为组合关系，从而降低了系统间的耦合，减少了代码编写量。
代码实现：
```java
/**
 * Created by Jasper on 2016/5/12.
 * Abstraction抽象类的接口
 */
public abstract class BrushPenAbstraction {
    protected ImplementorColor implementorColor = null;

    public void setImplementorColor(ImplementorColor color) {
        this.implementorColor = color;
    }
    
    public abstract void operationDraw();
}

/**
 * Created by Jasper on 2016/5/12.
 * RefinedAbstraction
 * 扩充由Abstraction;大毛笔
 */
public class BigBrushPenRefined extends BrushPenAbstraction{
    public void operationDraw() {
        System.out.print("big brush use: ");
        implementorColor.bepaint();
        System.out.println(" draw!");
    }
}

/**
 * Created by Jasper on 2016/5/12.
 * RefinedAbstraction
 * 扩充由Abstraction;中毛笔
 */
public class MiddleBrushPenRefined extends BrushPenAbstraction{
    public void operationDraw() {
        System.out.print("middle brush use: ");
        implementorColor.bepaint();
        System.out.println(" draw!");
    }
}

/**
 * Created by Jasper on 2016/5/12.
 * RefinedAbstraction
 * 扩充由Abstraction;小毛笔
 */
public class SmallBrushPenRefined extends BrushPenAbstraction {
    public void operationDraw() {
        System.out.print("small brush use: ");
        implementorColor.bepaint();
        System.out.println(" draw!");
    }
}

/**
 * Created by Jasper on 2016/5/12.
 * 实现类接口(Implementor)
 */
public class ImplementorColor {
    protected String value;

    public void bepaint() {
        System.out.print(value);
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }
}

/**
 * Created by Jasper on 2016/5/12.
 */
public class OncreteImplementorRed extends ImplementorColor {
    public OncreteImplementorRed(){
       this.value = "red";
    }
    public void bepaint(){
       System.out.println(value);
    }
}

/**
 * Created by Jasper on 2016/5/12.
 */
public class OncreteImplementorGreen extends ImplementorColor {
    public OncreteImplementorGreen(){
       this.value = "green";
    }
}

/**
 * Created by Jasper on 2016/5/12.
 */
public class OncreteImplementorBlue extends ImplementorColor {
    public OncreteImplementorBlue(){
       this.value = "blue";
    }
}

/**
 * Created by Jasper on 2016/5/12.
 */
public class OncreteImplementorWhite extends ImplementorColor {
    public OncreteImplementorWhite(){
       this.value = "white";
    }
}

public class BrushTest{
    public static void main(String[] args){
        BrushPenAbstraction brush = new BigBrushPenRefined();
        brush.setImplementorColor(new OncreteImplementorBlue());;
        brush.operationDraw();
    }
}

运行结果：
big brush use: blue draw!
```

## 总结
### 优点
+ 分离接口及其实现部分，一个实现未必不变地绑定在一个接口上。抽象类的实现可以在运行时刻进行配置，一个对象甚至可以在运行时刻改变它的实现。将 Abstraction 与 Implementor 分离有助于降低对实现部分编译时刻的依赖性，当改变一个实现类时，并不需要重新编译 Abstraction 类和它的客户程序。为了保证一个类库的不同版本之间的二进制兼容性，一定要有这个性质。另外，接口与实现分离有助于分层，从而产生更好的结构化系统，系统的高层部分仅需知道 Abstraction 和 Implementor 即可。
+ 提高可扩充性，可以独立地对 Abstraction 和 Implementor 层次结构进行扩充。
+ )实现细节对客户透明，可以对客户隐藏实现细节，例如共享 Implementor 对象以及相应的引用计数机制（如果有的话）。
### 缺点
+ 桥接模式的引入会增加系统的理解与设计难度，由于聚合关联关系建立在抽象层，要求开发者针对抽象进行设计与编程。
+ 桥接模式要求正确识别出系统中两个独立变化的维度，因此其使用范围具有一定的局限性。