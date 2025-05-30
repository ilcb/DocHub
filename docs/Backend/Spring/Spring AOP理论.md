---
title: Spring AOP 理论
description: "Spring AOP 理论"
slug: "/backend/spring/aop"
hide_table_of_contents: false
keywords: ["Spring", "AOP"]
tags: ["Spring", "AOP"]
date: 2017-08-01
categories: ["Spring"]
---
## 什么是 AOP
> AOP(Aspect-OrientedProgramming，面向切面编程)，可以说是 OOP(Object-Oriented rograming，面向对象编程的补充和完善。OOP 引入封装、继承和多态性等概念来建立一种对象层次结构，用以模拟公共行为的一个集合。
当我们需要为分散的对象引入公共行为的时候，OOP 则显得无能为力。也就是说，OOP 允许你定义从上到下的关系，但并不适合定义从左到右的关系，例如日志功能。日志代码往往水平地散布在所有对象层次中，而与它所散布到的对象
的核心功能毫无关系。对于其他类型的代码，如安全性、异常处理和透明的持续性也是如此。这种散布在各处的无关的代码被称为横切(cross-cutting)代码，在 OOP 设计中，它导致了大量代码的重复，而不利于各个模块的重用。
> AOP 技术则恰恰相反，它利用一种称为“横切”的技术，剖解开封装的对象内部，并将那些影响了多个类的公共行为封装到一个可重用模块，并将其名为“Aspect”，即切面。
所谓“切面”，简单地说，就是将那些与业务无关，却为业务模块所共同调用的逻辑或责任封装起来，便于减少系统的重复代码，降低模块间的耦合度，并有利于未来的可操作性和可维护性。
AOP 代表的是一个横向的关系，如果说“对象”是一个空心的圆柱体，其中封装的是对象的属性和行为；那么面向切面编程的方法，就仿佛一把利刃，将这些空心圆柱体剖开，以获得其内部的消息。
而剖开的切面，也就是所谓的“切面”了。然后它又以巧夺天功的妙手将这些剖开的切面复原，不留痕迹。
实现 AOP 的技术，主要分为两大类：
+ 一是采用动态代理技术，利用截取消息的方式，对该消息进行装饰，以取代原有对象行为的执行；
+ 二是采用静态织入的方式，引入特定的语法创建“切面”，从而使得编译器可以在编译期间织入有关“切面”的代码。

## AOP 使用场景
AOP 用来封装横切关注点，具体可以在下面的场景中使用:
+ Authentication 权限
+ Caching 缓存
+ Context passing 内容传递
+ Error handling 错误处理
+ Lazy loading 懒加载
+ Debugging 调试
+ logging, tracing, profiling and monitoring 记录跟踪 优化 校准
+ Performance optimization 性能优化
+ Persistence 持久化
+ Resource pooling 资源池
+ Synchronization 同步
+ Transactions 事务

## AOP 相关概念
### 连接点(Joinpoint)
表示需要在程序中插入横切关注点的扩展点，连接点可能是类初始化、方法执行、方法调用、字段调用或处理异常等等，Spring 只支持方法执行连接点，AOP 中表示为**“在哪里做”**；

### 切入点(Pointcut)
选择一组相关连接点的模式，即可以认为连接点的集合，Spring 支持 perl5 正则表达式和 AspectJ 切入点模式，Spring 默认使用 AspectJ 语法，在 AOP 中表示为**“在哪里做的集合”**；

### 增强(Advice)
在连接点上执行的行为，增强提供了在 AOP 中需要在切入点所选择的连接点处进行扩展现有行为的手段；包括前置增强(before advice)、后置增强(after advice)、环绕增强(around advice),
在 Spring 中通过代理模式实现 AOP，并通过拦截器模式以环绕连接点的拦截器链织入增强 ，在 AOP 中表示为**“做什么”**；

### 切面(Aspect)
横切关注点的模块化，可以认为是增强、引入和切入点的组合；在 Spring 中可以使用 Schema 和@AspectJ 方式进行组织实现,在 AOP 中表示为**“在哪里做和做什么的集合”**；

### 目标对象(Target Object)
需要被织入横切关注点的对象，即该对象是切入点选择的对象，需要被增强的对象，从而也可称为“被增强对象”；由于 SpringAOP 通过代理模式实现，从而这个对象永远是被代理对象，在 AOP 中表示为**“对谁做”**；

### AOP 代理(AOPProxy)
AOP 框架使用代理模式创建的对象，从而实现在连接点处插入增强(即应用切面)，就是通过代理来对目标对象应用切面。在 Spring 中，AOP 代理可以用 JDK 动态代理或 CGLIB 代理实现，而通过拦截器模型应用切面。

### 织入(Weaving)
织入是一个过程，是将切面应用到目标对象从而创建出 AOP 代理对象的过程，织入可以在编译期、类装载期、运行期进行。

### 引入(Introduction)
也称为内部类型声明，为已有的类添加额外新的字段或方法，Spring 允许引入新的接口(必须对应一个实现)到所有被代理对象(目标对象),在 AOP 中表示为“做什么(新增什么);

## AOP 的 Advice 类型
### 前置增强(Before advice)
在某连接点之前执行的增强，但这个增强不能阻止连接点前的执行(除非它抛出一个异常)。

### 后置返回增强(After returning advice)
在某连接点之前执行的增强，但这个增强不能阻止连接点前的执行(除非它抛出一个异常)。

### 后置异常增强(After throwing advice)
在方法抛出异常退出时执行的增强。

### 后置最终增强(After (finally) advice)
当某连接点退出的时候执行的增强(不论是正常返回还是异常退出)

### 环绕增强(Around Advice)
包围一个连接点的增强，如方法调用。这是最强大的一种增强类型。 环绕增强可以在方法调用前后完成自定义的行为。它也会选择是否继续执行连接点或直接返回它们自己的返回值或抛出异常来结束执行,相当于 Before + AfterReturning。

## Spring AOP 实现方式
### 经典的基于代理的 AOP
1. 可睡觉的接口，任何可以睡觉的人或机器都可以实现它。

```java
// 可睡觉的接口
public interface Sleepable {
    void sleep();
}
```

2. 接口实现类，“Person”可以睡觉，“Person”就实现可以睡觉的接口。

```java
public class Person implements Sleepable {
    public void sleep() {
        System.out.println("睡觉");
    }
}
```

3. 关注于睡觉的逻辑，但是睡觉需要其他功能辅助，比如睡前脱衣服，起床脱衣服，这里开始就需要 AOP 替“Person”完成。

```java
import org.springframework.aop.AfterAdvice;
import org.springframework.aop.AfterReturningAdvice;
import org.springframework.aop.MethodBeforeAdvice;

import java.lang.reflect.Method;

public class SleepAdvice implements MethodBeforeAdvice, AfterReturningAdvice {
    public void afterReturning(Object o, Method method, Object[] objects, Object o1) 
    		throws Throwable {
        System.out.println("起床后穿衣服");
    }
    
    public void before(Method method, Object[] objects, Object o) throws Throwable {
        System.out.println("睡觉前脱衣服");
    }
}
```

4. Spring 核心配置文件 application.xml 配置 AOP

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
                           http://www.springframework.org/schema/beans/spring-beans.xsd">

    <!-- 定义被代理者 -->
    <bean id="person" class="me.ilcb.aop.proxybased.Person"/>

    <!-- 定义通知内容，即切入点前后需要做的事-->
    <bean id="sleepAdvice" class="me.ilcb.aop.proxybased.SleepAdvice"/>

    <!-- 定义切入点位置 -->
    <bean id="sleepPointcut" class="org.springframework.aop.support.JdkRegexpMethodPointcut">
        <property name="pattern" value=".*sleep"/>
    </bean>

    <!-- 使切入点与通知相关联，完成切面配置 -->
    <bean id="sleepAdvisor" class="org.springframework.aop.support.DefaultPointcutAdvisor">
        <property name="advice" ref="sleepAdvice"/>
        <property name="pointcut" ref="sleepPointcut"/>
    </bean>

    <!-- 设置代理 -->
    <bean id="proxy" class="org.springframework.aop.framework.ProxyFactoryBean">
        <!-- 代理的对象-->
        <property name="target" ref="person"/>

        <!-- 使用切面-->
        <property name="interceptorNames" value="sleepAdvice"/>

        <!-- 代理接口-->
        <property name="proxyInterfaces" value="me.ilcb.aop.proxybased.Sleepable"/>
    </bean>
</beans>
```

5. 测试:

```java
import org.springframework.context.ApplicationContext;
import org.springframework.context.support.ClassPathXmlApplicationContext;
import org.springframework.context.support.FileSystemXmlApplicationContext;

public class SleepTest {
    public static void main(String[] args) {
        ApplicationContext context = new FileSystemXmlApplicationContext("classpath:
        		applicationContext.xml");
        Sleepable person = (Sleepable) context.getBean("proxy");
        person.sleep();
    }
}
```

6. 结果:
> 信息: Loading XML bean definitions from class path resource [applicationContext.xml]
> 睡觉前脱衣服
> 睡觉
> 起床后穿衣服

7. 通过 org.springframework.aop.framework.autoproxy.DefaultAdvisorAutoProxyCreator 简化配置

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
                           http://www.springframework.org/schema/beans/spring-beans.xsd">

    <!-- 定义被代理者 -->
    <bean id="person" class="me.ilcb.aop.proxybased.Person"/>

    <!-- 定义通知内容，即切入点前后需要做的事-->
    <bean id="sleepAdvice" class="me.ilcb.aop.proxybased.SleepAdvice"/>

    <!-- 定义切入点位置 -->
    <bean id="sleepPointcut" class="org.springframework.aop.support.JdkRegexpMethodPointcut">
        <property name="pattern" value=".*sleep"/>
    </bean>

    <!-- 使切入点与通知相关联，完成切面配置 -->
    <bean id="sleepAdvisor" class="org.springframework.aop.support.DefaultPointcutAdvisor">
        <property name="advice" ref="sleepAdvice"/>
        <property name="pointcut" ref="sleepPointcut"/>
    </bean>

    <!-- 设置代理配置的替代方式，可简化代码-->
    <bean class="org.springframework.aop.framework.autoproxy.DefaultAdvisorAutoProxyCreator"/>
</beans>
```

8. 结果:
> 信息: Loading XML bean definitions from class path resource [spring-aop-proxy-based.xml]
> 睡觉前脱衣服
> 睡觉
> 起床后穿衣服

### 基于 XML 配置实现 AOP(aop:config)
1.接口

```java
public interface IUserManagerService {
    //查找用户
    public String findUser();
    
    //添加用户
    public void addUser();
}
```

2. 接口实现类

```java
public class UserServiceImpl implements IUserService {
    private String name;

    public void setName(String name) {
        this.name = name;
    }

    public String findUser() {
        System.out.println("============执行方法findUser(),查找的用户是："+name+"=============");
        return name;
    }

    public void addUser() {
        System.out.println("============执行方法addUser()=============");
    }
}
```

3.切面类，实现对接口的增强

```java
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.ProceedingJoinPoint;

public class AOPAspect {
    /**
     * 前置通知：目标方法调用之前执行的代码
     */
    public void before(JoinPoint joinPoint) {
        System.out.println("Before ===> 执行前置通知============");
    }

    /**
     * 后置返回通知：目标方法正常结束后执行的代码
     * 返回通知是可以访问到目标方法的返回值的
     */
    public void afterReturning(JoinPoint joinPoint, String result){
        System.out.println("AfterReturning ===> 执行后置通知============");
        System.out.println("返回值result==================="+result);
    }

    /**
     * 最终通知：目标方法调用之后执行的代码（无论目标方法是否出现异常均执行）
     */
    public void after(JoinPoint joinPoint){
        System.out.println("After ===> 执行最终通知============");
    }

    /**
     *
     * 异常通知：目标方法抛出异常时执行的代码
     * 可以访问到异常对象
     */
    public void afterThrowing(JoinPoint joinPoint, Exception exception){
        System.out.println("AfterThrowing ===> 执行异常通知============");
    }

    /**
     * 环绕通知：目标方法调用前后执行的代码，可以在方法调用前后完成自定义的行为。
     * 包围一个连接点（join point）的通知。它会在切入点方法执行前执行同时方法结束也会执行对应的部分。
     * 主要是调用proceed()方法来执行切入点方法，来作为环绕通知前后方法的分水岭。
     *
     * 环绕通知类似于动态代理的全过程：ProceedingJoinPoint类型的参数可以决定是否执行目标方法。
     * 而且环绕通知必须有返回值，返回值即为目标方法的返回值
     */
    public Object around(ProceedingJoinPoint proceedingJoinPoint) throws Throwable {
        System.out.println("Around ===> 执行环绕通知开始=========");
        // 调用方法的参数
        Object[] args = proceedingJoinPoint.getArgs();

        // 调用的方法名
        String method = proceedingJoinPoint.getSignature().getName();

        // 目标对象
        Object target = proceedingJoinPoint.getTarget();

        // 执行完方法返回值，调用proceed()方法，就会触发切入点方法执行
        Object result = proceedingJoinPoint.proceed();
        System.out.println("输出,方法名：" + method + ";目标对象：" + target + ";
        					返回值：" + result);
        System.out.println("Around ===> 执行环绕通知结束=========");
        return result;
    }
}

```

4. Spring 核心配置文件 application.xml 配置 AOP

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:aop="http://www.springframework.org/schema/aop"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
                           http://www.springframework.org/schema/beans/spring-beans.xsd
                           http://www.springframework.org/schema/aop
                           http://www.springframework.org/schema/aop/spring-aop.xsd ">

    <bean id="aopAspect" class="me.ilcb.aop.xml.AOPAspect"/>

    <bean id="userServiceImpl" class="me.ilcb.aop.xml.UserServiceImpl">
        <property name="name" value="aaa"/>
    </bean>

    <aop:config>
        <aop:aspect ref="aopAspect">
            <aop:pointcut id="pointcut" expression="execution(* *.*.*.*.UserServiceImpl..
            					*(..))"/>
            <aop:before method="before" pointcut-ref="pointcut"/>
            <aop:after-returning method="afterReturning" pointcut-ref="pointcut" 			
            					returning="result"/>
            <aop:after method="after" pointcut-ref="pointcut"/>
            <aop:around method="around" pointcut-ref="pointcut"/>
        </aop:aspect>
    </aop:config>
</beans>
```

5. 测试：

```java
import org.springframework.context.ApplicationContext;
import org.springframework.context.support.ClassPathXmlApplicationContext;

public class UserServiceTest {
    public static void main(String[] args) {
        ApplicationContext context = new ClassPathXmlApplicationContext("classpath:
        					spring-aop-xml.xml");
        IUserService userService = (IUserService) context.getBean("userServiceImpl");
        userService.findUser();
        System.out.println();
        userService.addUser();
    }
}
```

6. 结果：
> 信息: Loading XML bean definitions from class path resource [spring-aop-xml.xml]
> Before ===> 执行前置通知============
> Around ===> 执行环绕通知开始=========
> ============执行方法 findUser(),查找的用户是：aaa=============
> 输出,方法名：findUser;目标对象：me.ilcb.aop.xml.UserServiceImpl@212bf671;返回值：aaa
> Around ===> 执行环绕通知结束=========
> After ===> 执行最终通知============
> AfterReturning ===> 执行后置通知============
> 返回值 result===================aaa
> Before ===> 执行前置通知============
> Around ===> 执行环绕通知开始=========
> ============执行方法 addUser()=============
> 输出,方法名：addUser;目标对象：me.ilcb.aop.xml.UserServiceImpl@212bf671;返回值：null
> Around ===> 执行环绕通知结束=========
> After ===> 执行最终通知============

### 通过 AspectJ 提供的注解实现 AOP
1. 可睡觉的接口，任何可以睡觉的人或机器都可以实现它

```java
// 可睡觉的接口
public interface Sleepable {
    void sleep();
}
```

2. 接口实现类，“Person”可以睡觉，“Person”就实现可以睡觉的接口。

```java
public class Person implements Sleepable {
    public void sleep() {
        System.out.println("睡觉");
    }
}
```

3. Person 关注于睡觉的逻辑，但是睡觉需要其他功能辅助，比如睡前脱衣服，起床脱衣服，这里开始就需要 AOP 替“Person”完成！

```java
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.aspectj.lang.annotation.Pointcut;

@Aspect
public class SleepAdvice {
    public SleepAdvice() {}

    @Pointcut("execution(* me.ilcb.aop.aspectj.Person.sleep(..))")
    public void pointcut(){}

    @Before("pointcut()")
    public void beforeSleep() {
        System.out.println("睡觉前脱衣服");
    }

    @AfterReturning("pointcut()")
    public void afterSleep() {
        System.out.println("睡觉后穿衣服");
    }
}
```

4. Spring 核心配置文件 application.xml 配置 AOP

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:aop="http://www.springframework.org/schema/aop"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
                           http://www.springframework.org/schema/beans/spring-beans.xsd
                           http://www.springframework.org/schema/aop
                           http://www.springframework.org/schema/aop/spring-aop.xsd">
    <aop:aspectj-autoproxy/>

    <!-- 定义通知内容，也就是切入点执行前后需要做的事情 -->
    <bean id="sleepAdvice" class="me.ilcb.aop.aspectj.SleepAdvice"/>

    <!-- 定义被代理者 -->
    <bean id="person" class="me.ilcb.aop.aspectj.Person"/>
</beans>
```

5.测试：

```java
import org.springframework.context.ApplicationContext;
import org.springframework.context.support.FileSystemXmlApplicationContext;

public class SleepTest {
    public static void main(String[] args) {
        ApplicationContext context = new FileSystemXmlApplicationContext("classpath:
        				spring-aop-aspectj.xml");
        Sleepable person = (Sleepable) context.getBean("person");
        person.sleep();
    }
}
```

6. 结果：
> 信息: Loading XML bean definitions from class path resource [spring-aop-aspectj.xml]
> 睡觉前脱衣服
> 睡觉
> 起床后穿衣服
