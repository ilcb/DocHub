---
title: Java 异常
description: "Java 异常"
slug: "/backend/java/exception"
hide_table_of_contents: false
keywords: ["Java", "异常"]
tags: ["Java", "异常"]
date: 2017-08-01
categories: ["Java"]
---

###  Java 异常体系
![exception](img/exception.jpg)
Exception 和 Error 都继承于共同的父类 Throwable；

**Error**表示运行故障发生于虚拟机自身、或者发生在虚拟机试图执行应用时，与代码编写者执行的操作无关，例如，Java 虚拟机运行错误(Virtual MachineError)，当 JVM 不再有继续执行操作所需
的内存资源时，将出现 OutOfMemoryError，这些错误是不可查的，因为它们在应用程序的控制和处理能力之外，而且绝大多数是程序运行时不允许出现的状况。对于设计合理的应用程序来说，即使确实发生了错误，本质上也不应该试图去处理它所引起的异常状况。在 Java 中，错误通过 Error 的子类描述，
发生这些情况时 Java 虚拟机(JVM)一般会选择线程终止。

**Exception**表示程序本身可以处理的异常。**Exception** 类有一个重要的子类 **RuntimeException**，它由 Java 虚拟机抛出；比如：
**NullPointerException**(要访问的变量没有引用任何对象时，抛出该异常)；
**ArithmeticException**(算术运算异常，一个整数除以 0 时，抛出该异常)；
**ArrayIndexOutOfBoundsException** （下标越界异常）。

**注意：Exception 和 Error 的区别：异常能被程序本身可以处理，错误是无法处理。**
### Throwable 类常用方法
- **public string getMessage()**:返回异常发生时的详细信息
- **public string toString()**:返回异常发生时的简要描述
- **public string getLocalizedMessage()**:返回异常对象的本地化信息。使用 Throwable 的子类覆盖这个方法，可以声称本地化信息。如果子类没有覆盖该方法，则该方法返回的信息与 getMessage()返回的结果相同
- **public void printStackTrace()**:在控制台上打印 Throwable 对象封装的异常信息

### 异常处理总结
- **try 块：** 用于捕获异常。其后可接零个或多个 catch 块，如果没有 catch 块，则必须跟一个 finally 块。
- **catch 块：** 用于处理 try 捕获到的异常，可以在一个 catch 内捕获多种异常如：catch(Exception e1 || UserException e2)。
- **finally 块：** 无论是否捕获或处理异常，finally 块里的语句都会被执行。当在 try 块或 catch 块中遇到 return 语句时，finally 语句块将在方法返回之前被执行。

### 关于 finally
在以下特殊情况下，finally 块不会被执行：
#### 在执行 finally 之前就已经 return 的情况下

```java
public static String init4() throws Exception {
  String str = "11111";
  if (true) {
    return str;
  }
  try {
    throw new Exception();
  } catch (Exception e) {
    str = "tttt";
    return str;
  } finally {
    System.out.println("finally");
    str = "cccc";
    throw new Exception();
  }
}

public static void main(String[] args) throws Exception {
  System.out.println(init4());
}
```

结果

> 11111

#### 在执行异常处理代码之前程序抛出异常

```java
public static String init5() throws Exception {
  int num = 10 / 0;
  String str = null;
  try {
    throw new Exception();
  } catch (Exception e) {
    str = "tttt";
    return str;
  } finally {
    System.out.println("finally");
    str = "cccc";
    throw new Exception();
  }
}

public static void main(String[] args) throws Exception {
  System.out.println(init5());
}
```

结果：

> Exception in thread "main" java.lang.ArithmeticException: / by zero
> 	at com.example.demo.TryCatchTest.init5(TryCatchTest.java:69)
> 	at com.example.demo.TryCatchTest.main(TryCatchTest.java:84)

分析：程序会抛出异常，finally 中的代码不会执行，只有与 finally 相对应的 try 语句块得到执行的情况下，finally 语句块才会执行。

#### finally 之前执行了 System.exit() 

```java
public static String init6() throws Exception {
  String str = null;
  try {
    System.out.println("aaaa");
    System.exit(1);
  } catch (Exception e) {
    str = "tttt";
    return str;
  } finally {
    System.out.println("finally");
    str = "cccc";
    throw new Exception();
  }
}

public static void main(String[] args) throws Exception {
  System.out.println(init6());
}
```

结果:
> aaaa

分析：System.exit 是用于结束当前正在运行中的 java 虚拟机，参数为 0 代表程序正常退出，非 0 代表程序非正常退出。

#### 所有非后台线程终止时，后台线程突然终止

```java
 public static void main(String[] args) throws Exception {
   Thread thread = new Thread(new Runnable() {
     @Override
     public void run() {
       try {
         Thread.sleep(10);
       } catch (Exception e) {

       } finally{
         System.out.println("finally 执行");
       }
     }
   });
   thread.setDaemon(true);//设置t1为后台线程
   thread.start();
   System.out.println("执行结束");
 }
```

结果：
> 执行结束

分析：上述代码，后台线程 thread 中有 finally 块，但在执行前，主线程终止了，导致后台线程立即终止，故 finally 块无法执行

### 关于 return
如果 try 语句里有 return，返回的是 try 语句块中变量值。 详细执行过程如下：
1. 如果有返回值，就把返回值保存到局部变量中；
2. 执行 jsr 指令跳到 finally 语句里执行；
3. 执行完 finally 语句后，返回之前保存在局部变量表里的值。
4. 如果 try，finally 语句里均有 return，忽略 try 的 return，而使用 finally 的 return.

#### 在 try 语句内 return

```java
public static int init() {
  try {
    return 1;
  } finally {
    System.out.println("finally执行");
  }
}
public static void main(String[] args) {
  System.out.println(init());
}
```

结果：

> finally 执行
> 1

#### 在 catch 里 return

```java
public static int init() {
  try {
    Integer num = null;
    num += 10;
    return num;
  } catch (Exception e) {
    return 2;
  } finally {
    System.out.println("finally执行");
  }
}
public static void main(String[] args) {
  System.out.println(init());
}
```

结果：
> finally 执行
> 2

#### finally 中 return 时

```java
public static int init2() {
  try {
    Integer num = null;
    num += 10;
    return num;
  } catch (Exception e) {
    return 2;
  } finally {
    System.out.println("finally执行");
    return 3;
  }
}

public static void main(String[] args) {
  System.out.println(init2());
}
```

执行结果：

> finally 执行
>
> 3

#### finally 中对变量做的改变会影响返回吗
##### 基本数据类型

```java
public static int init3() {
  int num = 1;
  try {
    return num / 0;
    throw new Exception();
  } catch (Exception e) {
    return 2;
  } finally {
    System.out.println("finally执行");
    num = 3;
  }
}

public static void main(String[] args) {
  System.out.println(init3());
}
```

执行结果：
> finally
>
> 2

##### 对象类型

```java
public static String init4() {
  String str = "11111";
  try {
    str = "tttt";
    return str;
  } finally {
    System.out.println("finally执行");
    str = "cccc";
  }
}

public static void main(String[] args) {
  System.out.println(init4());
}
```

结果：
> finally
> tttt

