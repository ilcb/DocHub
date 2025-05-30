---
title: 组合模式
description: "组合模式"
slug: "/backend/design-pattern/structure/composite"
hide_table_of_contents: false
keywords: ["设计模式", "结构型"]
tags: ["设计模式", "结构型"]
date: 2017-08-01
categories: ["设计模式"]
---

## 概述
在数据结构里面，树结构是很重要，可以把树的结构应用到设计模式里面。
例子 1：就是多级树形菜单。
例子 2：文件和文件夹目录
可以使用简单的对象组合成复杂的对象，而这个复杂对象有可以组合成更大的对象。可以把简单这些对象定义成类，然后定义一些容器类来存储这些简单对象。客户端代码必须区别对象简单对象和容器对象，而实际上大多数情况下用户认为它们是一样的。对这些类区别使用，使得程序更加复杂。递归使用的时候跟麻烦，而如何使用递归组合，使得用户不必对这些类进行区别呢？

## 定义
组合模式：将对象组合成树形结构以表示“部分-整体”的层次结构。Composite 使得用户对单个对象和组合对象的使用具有一致性。
它使树型结构的问题中，模糊了简单元素和复杂元素的概念，客户程序可以向处理简单元素一样来处理复杂元素,从而使得客户程序与复杂元素的内部结构解耦。
组合模式让你可以优化处理递归或分级数据结构。关于分级数据结构的一个普遍性的例子是你每次使用电脑时所遇到的:文件系统。文件系统由目录和文件组成。每个目录都可以装内容。目录的内容可以是文件，也可以是目录。按照这种方式，计算机的文件系统就是以递归结构来组织的。如果你想要描述这样的数据结构，那么你可以使用组合模式 Composite。

## 结构

![composite](img/composite.png)

### 抽象构件角色（component）

是组合中的对象声明接口，在适当的情况下，实现所有类共有接口的默认行为。声明一个接口用于访问和管理 Component 子部件。这个接口可以用来管理所有的子对象。(可选)在递归结构中定义一个接口，用于访问一个父部件，并在合适的情况下实现它。
### 树叶构件角色(Leaf)
在组合树中表示叶节点对象，叶节点没有子节点，并在组合中定义图元对象的行为。
### 树枝构件角色（Composite）
定义有子部件的那些部件的行为，存储子部件，在 Component 接口中实现与子部件有关的操作。

## 实现
```java
/**
 * Component为组合中的对象声明接口，在适当情况下，实现所有类共有借口的默认行为
 */
public abstract class Component {
    protected String name;

    public Component(String name){
        this.name = name;
    }

    public abstract void add(Component component);
    public abstract void remove(Component component);
    public abstract void display(int depth);
}

/**
 *
 */
public class Composite extends Component {
    private List<Component> children = new ArrayList<Component>();

    public Composite(String name){
        super(name);
    }

    @Override
    public void add(Component component) {
        children.add(component);
    }

    @Override
    public void remove(Component component) {
        children.remove(component);
    }

    @Override
    public void display(int depth) {
        for (int i = 0; i < depth; ++i){
            System.out.print("--");
        }
        System.out.println(name);

        for (Component c : children){
            c.display(depth + 1);
        }

    }
}

/**
 * 叶子节点
 */
public class Leaf extends Component {
    public Leaf(String name) {
        super(name);
    }

    @Override
    public void add(Component component) {
        System.out.println("Leaf cannot add!");
    }

    @Override
    public void remove(Component component) {
        System.out.println("Leaf cannot remove!");
    }

    @Override
    public void display(int depth) {
        for (int i = 0; i < depth; ++i){
            System.out.print("-");
        }
        System.out.println(name);
    }
}

public class CompositeTest {
    @Test
    public void test() {
        Composite root  = new Composite("root");
        root.add(new Leaf("Leaf A"));
        root.add(new Leaf("Leaf B"));

        Composite comp = new Composite("Composite X");
        comp.add(new Leaf("Composite XA"));
        comp.add(new Leaf("Composite XB"));
        root.add(comp);

        Composite comp1 = new Composite("Composite XY");
        comp1.add(new Leaf("Composite XYA"));
        comp1.add(new Leaf("Composite XYB"));
        comp.add(comp1);

        root.add(new Leaf("Leaf C"));

        Leaf leaf = new Leaf("Leaf D");
        root.add(leaf);
        root.remove(leaf);

        root.display(1);
    }
}

## 结果
--Leaf A
--Leaf B
----Composite X
---Composite XA
---Composite XB
------Composite XY
----Composite XYA
----Composite XYB
--Leaf C
```

## 总结
+ 定义了包含基本对象和组合对象的类层次结构基本对象可以被组合成更复杂的组合对象，而这个组合对象又可以被组合，这样不断的递归下去。客户代码中，任何用到基本对象的地方都可以使用组合对象。
+ 简化客户代码客户可以一致地使用组合结构和单个对象。通常用户不知道(也不关心)处理的是一个叶节点还是一个组合组件。这就简化了客户代码,因为在定义组合的那些类中不需要写一些充斥着选择语句的函数。
+ 使得更容易增加新类型的组件新定义的 Composite 或 Leaf 子类自动地与已有的结构和客户代码一起工作，客户程序不需因新的 Component 类而改变。
+ 使你的设计变得更加一般化容易增加新组件也会产生一些问题，那就是很难限制组合中的组件。有时你希望一个组合只能有某些特定的组件。使用 Composite 时，你不能依赖类型系统施加这些约束，而必须在运行时刻进行检查。
组合模式解耦了客户程序与复杂元素内部结构，从而使客户程序可以向处理简单元素一样来处理复杂元素。