---
title: Java 线程池
description: "Java 线程池"
slug: "/backend/java/thread-pool"
hide_table_of_contents: false
keywords: ["Java", "线程池"]
tags: ["Java", "并发"]
date: 2017-08-01
categories: ["Java"]
---
## 线程池的作用
+ 根据系统的环境情况，可以自动或手动设置线程数量，达到运行的最佳效果；
+ 少了浪费了系统资源，多了造成系统拥挤效率不高。
+ 用线程池控制线程数量，其他线程排队等候。
+ 一个任务执行完毕，再从队列的中取最前面的任务开始执行。
+ 若队列中没有等待进程，线程池的这一资源处于等待。
+ 当一个新任务需要运行时，如果线程池中有等待的工作线程，就可以开始运行了；否则进入等待队列。

## 为什么要使用线程池
### new Thread()的缺点
+ 每次 new Thread()耗费性能 (每个线程需要大约 1MB 内存，线程开的越多，消耗的内存也就越大，最后死机)
+ 调用 new Thread()创建的线程缺乏管理，被称为野线程，而且可以无限制创建，之间相互竞争，会导致过多占用系统资源导致系统瘫痪。 
+ 不利于扩展，比如如定时执行、定期执行、线程中断

### 采用线程池的优点
+ 线程放在线程池里，减少线程的创建和销毁的开销
+ 可有效控制最大并发线程数，提高系统资源的使用率，同时避免过多资源竞争，避免堵塞 
+ 提供定时执行、定期执行、单线程、并发数控制等功能

## 线程池原理
### ThreadPoolExecutor 构造方法说明

```java
public ThreadPoolExecutor(
        int corePoolSize,                  //线程池维护线程的最少数量 
        int maximumPoolSize,               //线程池维护线程的最大数量 
        long keepAliveTime,	           //线程所允许的空闲时间(对超出corePoolSize的线程而言)
        TimeUnit unit,                     //线程所允许的空闲时间的单位 
        BlockingQueue<Runnable> workQueue, //线程池所使用的缓冲队列
        RejectedExecutionHandler handler   //线程池对拒绝任务的处理策略  
) {}
```

### 线程处理的优先级
1. 在线程池中线程数小于 corePoolSize 时，每次执行都新建一个线程
2. 在线程池中线程数等于 corePoolSize，缓冲队列未满时，优先丢入队列
3. 在线程池中线程数等于或大于 corePoolSize，缓冲队列已满时，新建线程执行任务，直到线程数达到 maximumPoolSize
4. 在线程池中线程数等于 maximumPoolSize，缓冲队列已满时，使用 handler 处理拒绝任务
5. 在线程池中线程数大于 corePoolSize 时，空闲线程的存活时间由 keepAliveTime 和 unit 决定

### BlockingQueue 的种类
#### ArrayBlockingQueue
数组实现的阻塞队列，数组的大小就是队列的长度，如果队列为空且线程进行元素获取，或者队列已满且进行任务添加，都将导致阻塞等待。进出队列采用 FIFO（先进先出）原则。
#### LinkedBlockingQueue
链表实现的阻塞队列，如果不在构造时指定大小，则其大小取决于 Integer.MAX_VALUE，除了实现方式与 ArrayBlockingQueue 不同外，行为基本相同。
#### PriorityBlockingQueue
类似于 LinkedBlockQueue，但其所含对象的排序不是 FIFO，而是依据对象的自然排序顺序或者是构造函数的 Comparator 决定的顺序。
#### SynchronousQueue
该队列的操作必须是放和取交替完成的。在被元素被取走之前，该元素的插入操作不会结束，因此，名为同步队列，也即非异步、阻塞执行。该队列长度为 0，元素插入就需要被取走。
#### DelayQueue
是一个无界的 BlockingQueue，用于放置实现了 Delayed 接口的对象，其中的对象只能在其到期时才能从队列中取走。这种队列是有序的，即队头对象的延迟到期时间最长。
#### LinkedTransferQueue
无界队列（Integer.MAX_VALUE），进出队列采用 FIFO（先进先出）原则。生产者会一直阻塞直到所添加到队列的元素被某一个消费者所消费。主要用于线程间消息的传递，与 SynchronousQueue 很类似，但是比起 SynchronousQueue 更好用。LinkedTransferQueue 既可以使用 BlockingQueue 的 put 方法进行常规的添加元素操作，也可以使用 transfer 方法进行阻塞添加，而且比 SynchronousQueue 灵活之处在于，队列长度非 0，阻塞插入和非阻塞插入的元素可以共存。

#### 各种 Deque（双端队列）
双端队列不仅可以实现 FIFO（先进先出）队列，还可以实现 FILO（先进后出）的栈，但是不常用，在此不多做介绍。

### RejectedExecutionHandler 的种类
#### ThreadPoolExecutor.AbortPolicy()
抛出 java.util.concurrent.RejectedExecutionException 异常，注意，这是线程池的默认策略
#### ThreadPoolExecutor.CallerRunsPolicy()
重试添加当前的任务，他会自动重复调用 execute()方法
#### ThreadPoolExecutor.DiscardOldestPolicy()
抛弃旧的任务（最先进入队列的任务）
#### ThreadPoolExecutor.DiscardPolicy()
抛弃当前的任务（即将进入队列的任务）
## 线程池相关类
### Executor
Java 5 中引入了 Executor 线程池框架，关于线程池相关的类都在 java.util.cocurrent 包下，通过该框架来控制线程的启动、执行和关闭，通过 Executor 来启动线程比使用 Thread 的 start 方法更好，除了更易管理，效率更好（用线程池实现，节约开销外，还有助于避免 this 逃逸问题—如果在构造器中启动一个线程，因为另一个任务可能会在构造器结束之前开始执行，此时可能会访问到初始化了一半的对象用 Executor 在构造器中。
Executor 框架包括：线程池，Executor，Executors，ExecutorService，CompletionService，Future，Callable 等。
Java 里面线程池的顶级接口是 Executor，但是严格意义上讲 Executor 并不是一个线程池，而只是一个执行线程的工具。真正的线程池接口是 ExecutorService。
比较重要的几个类：

| Executors                   | 提供了一系列工厂方法用于创先线程池，返回的线程池都实现了 ExecutorService 接口 |
| --------------------------- | ---------------------------------------- |
| ExecutorService             | 真正的线程池接口                                 |
| ScheduledExecutorService    | 和 Timer/TimerTask 类似，解决那些需要任务重复执行的问题       |
| ThreadPoolExecutor          | ExecutorService 的默认实现                     |
| ScheduledThreadPoolExecutor | 继承 ThreadPoolExecutor 的 ScheduledExecutorService 接口实现，周期性任务调度的类实现 |

### Executors
Executors 提供四种线程池：
- newFixedThreadPool
- newCachedThreadPool
- newSingleThreadExecutor
- newScheduledThreadPool。

1.创建固定数目线程的线程池:
`public static ExecutorService newFixedThreadPool(int nThreads) ;`

2.创建一个可缓存的线程池，如果现有线程没有可用的，则创建一个新线程添加到池中。终止并从缓存中移除那些已有 60 秒钟未被使用的线程
`public static ExecutorService newCachedThreadPool();` 

3.创建一个单线程化的 Executor
`public static ExecutorService newSingleThreadExecutor();`

4.创建一个支持定时及周期性的任务执行的线程池，多数情况下可用来替代 Timer 类
`public static ScheduledExecutorService newScheduledThreadPool(int corePoolSize);`

#### FixedThreadPool 
创建线程数量固定的线程池，以共享的无界队列方式来运行这些线程，空闲线程销毁时间为 0，无界队列，拒绝任务的策略为抛出异常

```java
public static ExecutorService newFixedThreadPool(int nThreads) {
    return new ThreadPoolExecutor(
    	nThreads,
    	nThreads,
        0L,
        TimeUnit.MILLISECONDS,
        new LinkedBlockingQueue<Runnable>()
    );
}
```
实例：
```java
public static void fixedThreadPool() {
    ExecutorService executorService = Executors.newFixedThreadPool(5);
    for (int i = 0; i < 10; ++i) {
        executorService.execute(new Runnable() {
            public void run() {
                System.out.println(Thread.currentThread().getName());
            }
        });
    }
}
```

运行结果：

pool-1-thread-3
pool-1-thread-3
pool-1-thread-3
pool-1-thread-3
pool-1-thread-3
pool-1-thread-3
pool-1-thread-4
pool-1-thread-1
pool-1-thread-2
pool-1-thread-5

#### CachedThreadPool 
无界线程池，可以进行自动线程回收。可以自动回收是因为 corePoolSize 被设置为零，此外，这个线程池比较特殊的特点是采用了 SynchronousQueue。所有元素都会单起一个线程阻塞的等待获取

```java
public static ExecutorService newCachedThreadPool() {
    return new ThreadPoolExecutor(
    	0,
    	Integer.MAX_VALUE,
        60L,
        TimeUnit.SECONDS,
        new SynchronousQueue<Runnable>()
    );
}
```

实例：
```java
public static void cachedThreadPool(int size) {
    ExecutorService executorService = Executors.newCachedThreadPool();
    for (int i = 0; i < size; ++i) {
        executorService.submit(new Runnable() {
            public void run() {
                System.out.println(Thread.currentThread().getName());
            }
        });
    }
}
```

运行结果：

pool-1-thread-1
pool-1-thread-1
pool-1-thread-2
pool-1-thread-3
pool-1-thread-3
pool-1-thread-5
pool-1-thread-2
pool-1-thread-14
pool-1-thread-1
pool-1-thread-9
pool-1-thread-4
pool-1-thread-8
pool-1-thread-12
pool-1-thread-13
pool-1-thread-6
pool-1-thread-3
pool-1-thread-10
pool-1-thread-7
pool-1-thread-11
pool-1-thread-15

缓存线程池大小是不定值，可以创建不同数量的线程，在使用缓存型池时，如果缓存池中存在之前创建的线程就使用，否则新建线程加入线程池；缓存型池子通常用于执行一些生存期很短的异步型任务

#### ScheduledThreadPool 
创建一个定长线程池，支持定时及周期性任务执行
+ **schedule(Runnable command, long delay, TimeUnit unit)**
创建并执行在给定延迟后启用的一次性操作

```java
// 从未提交任务开始计时，5s后执行
public static void scheduleThreadPool() {
ScheduledExecutorService scheduledExecutorService = Executors.newScheduledThreadPool(5);
	for (int i = 0; i < 10; ++i) {
    	Runnable scheduleTask = new Runnable() {
            public void run() {
                System.out.println(Thread.currentThread().getName());
            }
        };
        scheduledExecutorService.schedule(scheduleTask, 5000, TimeUnit.MILLISECONDS);
    }
}
```

运行结果和 FixedThreadPool 类似，不同的是 ScheduledThreadPool 是延时一定时间之后才执行

+ **scheduleAtFixedRate(Runnable command, long initialDelay, long period, TimeUnitunit)**
创建并执行一个在给定初始延迟后首次启用的定期操作，后续操作具有给定的周期；也就是将在 initialDelay 后开始执行，然后在 initialDelay+period 后执行，接着在 initialDelay + 2 * period 后执行，依此类推：

```java
public static void scheduleAtFixedRate() {
    ScheduledExecutorService scheduledExecutorService = Executors.newScheduledThreadPool(5);
    Runnable scheduleTask = new Runnable() {
        public void run() {
            System.out.println(Thread.currentThread().getName());
        }
    };
    scheduledExecutorService.scheduleAtFixedRate(scheduleTask, 5000, 2000, TimeUnit.MILLISECONDS);
}
```

+ **scheduleWithFixedDelay(Runnable command, long initialDelay, long delay, TimeUnit unit)**
创建并执行一个在给定初始延迟后首次启用的定期操作，随后，在每一次执行终止和下一次执行开始之间都存在给定的延迟：

```java
public static void scheduleWithFixedDelay() {
    ScheduledExecutorService scheduledExecutorService = Executors.newScheduledThreadPool(5);
    Runnable scheduleTask = new Runnable() {
        public void run() {
            System.out.println(Thread.currentThread().getName());
        }
    };
    scheduledExecutorService.scheduleWithFixedDelay(scheduleTask, 5000, 3000, TimeUnit.MILLISECONDS);
}
```

#### SingleThreadExecutor
最大线程数为 1 的线程池，用唯一的工作线程来执行任务，保证所有任务按照指定顺序(FIFO, LIFO, 优先级)执行,空闲线程销毁时间为 0，无界队列，拒绝任务的策略为抛出异常

```java
public static ExecutorService newSingleThreadExecutor() {
    return new FinalizableDelegatedExecutorService
        (new ThreadPoolExecutor(
            1,
            1,
            0L,
            TimeUnit.MILLISECONDS,
            new LinkedBlockingQueue<Runnable>()
        ));
}
```

实例：

```java
public static void singleThreadPool() throws ExecutionException, InterruptedException {
    ExecutorService executorService = Executors.newSingleThreadExecutor();
    for (int i = 0; i < 10; ++i) {
        Callable<String> task = new Callable<String>() {
            public String call() throws Exception {
                return Thread.currentThread().getName();
            }
        };
        Future<String> result = executorService.submit(task);
        System.out.println(result.get());
    }
}
```

运行结果：只会创建一个线程，当上一个执行完之后才会执行第二个

## ExecutorService
ExecutorService 接口继承了 Executor 接口，定义了一些生命周期的方法

```java
/**
 * 顺次关闭ExecutorService，停止接收新的任务，等待所有已经提交的任务执行完毕之后，关闭ExecutorService
 */
void shutdown(); 

/**
 * 阻止等待任务启动并试图停止当前正在执行的任务，停止接收新的任务，返回处于等待的任务列表
 */
List<Runnable> shutdownNow(); 

boolean isShutdown(); // 判断线程池是否已经关闭

/**
 * 如果关闭后所有任务都已完成，则返回true。除非首先调用 shutdown或shutdownNow，否则isTerminated永不为    
 * true。
 */
boolean isTerminated(); 

/**
 * 等待（阻塞）直到关闭或最长等待时间或发生中断, timeout(最长等待时间)，unit(timeout参数的时间单位)，如果  
 * ExecutorService已关闭，则返回 true；如果终止前超时期满，则返回false 
 */
boolean awaitTermination(long timeout, TimeUnit unit) 

/**
 * 提交一个返回值的任务用于执行，返回一个表示任务的未决结果的Future。
 * 该Future的get方法在成功完成时将会返回该任务的结果。
 */
<T> Future<T> submit(Callable<T> task); 
      
/**
 * 提交一个Runnable任务用于执行，并返回一个表示该任务的Future。
 * 该Future的get方法在成功完成时将会返回给定的结果。
 */
<T> Future<T> submit(Runnable task, T result); 

/**
 * 提交一个Runnable任务用于执行，并返回一个表示该任务的Future。
 * 该Future的get方法在成功 完成时将会返回null
 */
Future<?> submit(Runnable task); 

/**
 * 执行给定的任务，当所有任务完成时，返回保持任务状态和结果的Future列表。                     
 * 返回列表的所有元素的 Future.isDone() 为 true。
 */
<T> List<Future<T>> invokeAll(Collection<? extends Callable<T>> tasks) throws InterruptedException; 

 /**
  * 执行给定的任务，当所有任务完成时，返回保持任务状态和结果的 Future 列表。返回列表的所有元素的    
  * Future.isDone()为true   
  */
<T> List<Future<T>> invokeAll(Collection<? extends Callable<T>> tasks, long timeout, TimeUnit unit) throws InterruptedException;

/**
 * 执行给定的任务，如果在给定的超时期满前某个任务已成功完成（也就是未抛出异常），则返回其结果。一旦正常或异常 
 * 返回后，则取消尚未完成的任务。
 */
<T> T invokeAny(Collection<? extends Callable<T>> tasks) throws InterruptedException, ExecutionException; 

<T> T invokeAny(Collection<? extends Callable<T>> tasks, long timeout, TimeUnit unit) throws InterruptedException, ExecutionException, TimeoutException;

```

ExecutorService 接口继承自 Executor 接口，提供了更多方法，比如，ExecutorService 提供了关闭自己的方法，以及可为跟踪一个或多个异步任务执行状况而生成 Future 的方法。 可以调用 ExecutorService 的 shutdown()方法来平滑地关闭 ExecutorService，调用该方法后，将导致 ExecutorService 停止接受任何新的任务且等待已经提交的任务执行完成(已经提交的任务会分两类：一类是已经在执行的，另一类是还没有开始执行的，当所有已经提交的任务执行完毕后将会关闭 ExecutorService。一般用该接口来实现和管理多线程。

ExecutorService 的生命周期包括三种状态：运行、关闭、终止。创建后便进入运行状态，当调用了 shutdown()方法时，便进入关闭状态，此时意味着 ExecutorService 不再接受新的任务，但它还在执行已经提交了的任务，当素有已经提交了的任务执行完后，便到达终止状态。如果不调 shutdown()方法，ExecutorService 会一直处在运行状态，不断接收新的任务，执行新的任务，服务器端一般不需要关闭它，保持一直运行即可。

### ExecutorService 执行 Runnable 任务
Runnable 任务传递到 execute()方法，该方法便会自动在一个线程上执行。下面是是 Executor 执行 Runnable 任务的示例代码：

```java
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class ThreadPoolTest {
       public static void main(String[] args) {
       		executeRunnable();
       }

    public static void executeRunnable() {
        ExecutorService executorService = Executors.newFixedThreadPool(5);
        for (int i = 0; i < 5; ++i) {
            Runnable task = new Runnable() {
                public void run() {
                    System.out.println(Thread.currentThread().getName());
                }
            };
            executorService.submit(task);
        }
    }
}
```

结果：

pool-1-thread-1
pool-1-thread-3
pool-1-thread-4
pool-1-thread-5
pool-1-thread-2

### Executor 执行 Callable 任务
在 Java 5 之后，任务分两类：一类是实现了 Runnable 接口的类，一类是实现了 Callable 接口的类。两者都可以被 ExecutorService 执行，但是 Runnable 任务没有返回值，而 Callable 任务有返回值。并且 Callable 的 call()方法只能通过 ExecutorService 的 submit(Callable task) 方法来执行，并且返回一个 Future，是表示任务等待完成的 Future。

实例：

```java
public void callCallable() {
    ExecutorService executorService = Executors.newCachedThreadPool();

    List<Future<String>> futureResults = new ArrayList<Future<String>>();
    for (int i = 0; i < 5; ++i) {
        Future<String> future = executorService.submit(new FutureTasks(i));
        futureResults.add(future);
    }

    for (Future future : futureResults) {
        try {
            while (!future.isDone()) {
                System.out.println(future.get());
            }
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            executorService.shutdown();
        }
    }
}

class FutureTasks implements Callable<String> {
    private int id;

    public FutureTasks(int id){
        this.id = id;
    }

    public String call() throws Exception {
        System.out.println(Thread.currentThread().getName() + " call() invoked");
        return Thread.currentThread().getName() + "====>" + id;
    }
}
```

某次运行结果：

pool-1-thread-2 call() invoked
pool-1-thread-3 call() invoked
pool-1-thread-1 call() invoked
pool-1-thread-1====>0
pool-1-thread-5 call() invoked
pool-1-thread-4 call() invoked
pool-1-thread-4====>3

需要注意：如果 Future 的返回尚未完成，则 get()方法会阻塞等待，直到 Future 完成返回，可以通过调用 isDone（）方法判断 Future 是否完成了返回。

## WorkStealingPool
在 Executors 中还会看到这种池，这个不是平常使用的线程池。而是一个 ForkJoinPool。
ForkJoinPool 是一个可以执行 ForkJoinTask 的 ExcuteService，与 ExcuteService 不同的是它采用了 work-stealing 模式：所有在池中的线程尝试去执行其他线程创建的子任务（多线程并行执行一个任务），这样就很少有线程处于空闲状态，非常高效。
ForkJoinPool 解决的不是并发问题，而是高效并行问题，在这里不做具体介绍。

## SingleThreadScheduledExecutor
ScheduledThreadPoolExecutor 是 ThreadPoolExecutor 的子类，用于多线程的执行定时任务，其内部使用的是与上文提到的 DelayQueue 相类似的队列，DelayedWorkQueue。