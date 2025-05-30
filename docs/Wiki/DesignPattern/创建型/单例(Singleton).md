---
title: 单例模式
description: "单例模式"
slug: "/backend/design-pattern/creation/singleton"
hide_table_of_contents: false
keywords: ["设计模式", "创建型"]
tags: ["设计模式", "创建型"]
date: 2017-08-01
categories: ["设计模式"]
---

## 单例模式
单例模式确保某个类只有一个实例，而且自行实例化并向整个系统提供这个实例，保证了全局对象的唯一性。
单例模式特点：
+ 单例类只能有一个实例。
+ 单例类必须自己创建自己的唯一实例。
+ 单例类必须给所有其他对象提供这一实例。

## 单例模式实现

### 懒汉(线程不安全)

这种写法 lazy loading 很明显，但是致命的是在多线程不能正常工作

```java
public class Singleton {
    private static Singleton instance = null;

    private Singleton() {}

    public static Singleton getInstance() {
        if (instance == null) {
            instance = new Singleton();
        }
        return instance;
    }
}
```

### 懒汉(线程安全)

这种写法能够在多线程中很好的工作，而且看起来它也具备很好的 lazy loading，但是效率很低，99%情况下不需要同步

```java
public class Singleton {
    private static Singleton instance = null;

    private Singleton() {}

    public static synchronized Singleton getInstance() {
        if (instance == null) {
            instance = new Singleton();
        }
        return instance;
    }
}
```

### 饿汉

这种方式基于 classloder 机制避免了多线程的同步问题，不过 instance 在类装载时就实例化，虽然导致类装载的原因有很多种，在单例模式中大多数都是调用 getInstance 方法， 但是也不能确定有其他的方式（或者其他的静态方法）导致类装载，这时候初始化 instance 显然没有达到 lazy loading 的效果

```java
public class Singleton {
    private static Singleton instance = new Singleton();

    private Singleton(){}

    public Singleton getInstance() {
        return instance;
    }
}
```

### 饿汉(变种)

```java
public class Singleton {
    private static Singleton instance = null;

    static {
        instance = new Singleton();
    }

    private Singleton(){}

    public static Singleton getInstance() {
        return instance;
    }
}
```

### 静态内部类

这种方式同样利用了 classloder 的机制来保证初始化 instance 时只有一个线程，它跟第三种和第四种方式不同的是：第三种和第四种方式是只要 Singleton 类被装载了，那么 instance 就会被实例化（没有达到 lazy loading 效果），而这种方式是 Singleton 类被装载了，instance 不一定被初始化。因为 SingletonHolder 类没有被主动使用，只有显示通过调用 getInstance 方法时，才会显示装载 SingletonHolder 类，从而实例化 instance。如果实例化 instance 很消耗资源，想延迟加载，同时不希望在 Singleton 类加载时就实例化，因为不能确保 Singleton 类还可能在其他的地方被主动使用从而被加载，那么这个时候实例化 instance 显然是不合适的。这个时候，这种方式相比第三和第四种方式就显得很合理。

```java
public class Singleton {
    private static class SingletonHolder {
        private static final Singleton INSTANCE = new Singleton();
    }

    private Singleton() {}

    public static final Singleton getInstance() {
        return SingletonHolder.INSTANCE;
    }
}
```

### 双重锁校验

```java
public class Singleton {
    private static volatile Singleton instance = null;

    private Singleton(){}

    public static Singleton getInstance() {
        Singleton tInstance = instance;
        if (tInstance == null) {
            synchronized (Singleton.class) {
                tInstance = instance;
                if (tInstance == null) {
                    tInstance = new Singleton();
                    instance = tInstance;
                }
            }
        }
        return tInstance;
    }
}
```

### 枚举

```java
public enum Singleton {
    INSTANCE;
}
```

## Tips

+ 使用反射是可以破坏单例的

```java
Constructor constructor = clazz.getDeclaredConstructor(null); 
constructor.setAccessible(true);
Instance instance = (Instance) cons.newInstance(null)
```

+ 如果单例由不同的类装载器装入，那便有可能存在多个单例类的实例。假定不是远端存取，例如一些 servlet 容器对每个 servlet 使用完全不同的类装载器，这样的话如果有两个 servlet 访问一个单例类，它们就都会有各自的实例。
此问题的修复方式为：
```java
private static Class getClass(String classname)throws ClassNotFoundException {  
    ClassLoader classLoader = Thread.currentThread().getContextClassLoader();
      if(classLoader == null){    
          classLoader = Singleton.class.getClassLoader();     
          return (classLoader.loadClass(classname));     
      }     
}  
```

+ 如果 Singleton 实现了 java.io.Serializable 接口，那么这个类的实例就可能被序列化和复原。不管怎样，如果你序列化一个单例类的对象，接下来复原多个那个对象，那你就会有多个单例类的实例。
此问题修复的办法是：
```java
public class Singleton implements java.io.Serializable {     
    public static Singleton INSTANCE = new Singleton();     
       protected Singleton() {}     
       private Object readResolve() {     
           return INSTANCE;     
       }    
}   
```