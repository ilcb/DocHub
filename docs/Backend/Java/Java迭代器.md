---
title: Java 迭代器
description: "Java 迭代器"
slug: "/backend/java/iterator"
hide_table_of_contents: false
keywords: ["Java"]
tags: ["Java"]
date: 2017-08-01
categories: ["Java"]
---
迭代器是一种模式，它可以使得对于序列类型的数据结构的遍历行为与被遍历的对象分离，无需关心该序列的底层结构，只要拿到这个对象的迭代器就可以遍历这个对象的内部;
## Iterator
Java 提供一个专门的迭代器`<<interface>>Iterator`，我们可以对某个序列实现该 interface，来提供标准的 Java 迭代器。Iterator 接口实现后的功能是"使用”一个迭代器；

```java
package java.util;

import java.util.function.Consumer;

public interface Iterator<E> {
    /**
     * Returns {@code true} if the iteration has more elements.
     * (In other words， returns {@code true} if {@link #next} would
     * return an element rather than throwing an exception.)
     *
     * @return {@code true} if the iteration has more elements
     **/
    boolean hasNext();

    /**
     * Returns the next element in the iteration.
     *
     * @return the next element in the iteration
     * @throws NoSuchElementException if the iteration has no more elements
     **/
    E next();

    /**
     * Removes from the underlying collection the last element returned
     * by this iterator (optional operation).  This method can be called
     * only once per call to {@link #next}.  The behavior of an iterator
     * is unspecified if the underlying collection is modified while the
     * iteration is in progress in any way other than by calling this
     * method.
     *
     * @implSpec
     * The default implementation throws an instance of
     * {@link UnsupportedOperationException} and performs no other action.
     *
     * @throws UnsupportedOperationException if the {@code remove}
     *         operation is not supported by this iterator
     *
     * @throws IllegalStateException if the {@code next} method has not
     *         yet been called， or the {@code remove} method has already
     *         been called after the last call to the {@code next}
     *         method
     **/
    default void remove() {
        throw new UnsupportedOperationException("remove");
    }

    /**
     * Performs the given action for each remaining element until all elements
     * have been processed or the action throws an exception.  Actions are
     * performed in the order of iteration， if that order is specified.
     * Exceptions thrown by the action are relayed to the caller.
     *
     * @implSpec
     * <p>The default implementation behaves as if:
     * <pre>{@code
     *     while (hasNext())
     *         action.accept(next());
     * }</pre>
     *
     * @param action The action to be performed for each element
     * @throws NullPointerException if the specified action is null
     * @since 1.8
     **/
    default void forEachRemaining(Consumer<? super E> action) {
        Objects.requireNonNull(action);
        while (hasNext())
            action.accept(next());
    }
}
```

## Iterable
Java 中还提供了一个 Iterable 接口，Iterable 接口实现后的功能是"返回”一个迭代器，我们常用
的实现了该接口的子接口有： `Collection<E>`， `Deque<E>`，`List<E>`， `Queue<E>`， `Set<E>` 等。
该接口的 iterator()方法返回一个标准的 Iterator 实现，实现这个接口允许对象成为 foreach 语句的目标，就可以通过 foreach 语法遍历你的底层序列。
Iterable 接口包含一个能够产生 Iterator 的 iterator()方法，并且 Iterable 接口被 foreach 用来在序列中移动。因此如果创建了任何实现 Iterable 接口的类，都可以将它用于 foreach 语句中。

```java
package java.lang;

import java.util.Iterator;
import java.util.Objects;
import java.util.Spliterator;
import java.util.Spliterators;
import java.util.function.Consumer;

/*
 * Implementing this interface allows an object to be the target of
 * the "for-each loop" statement. See
 */
public interface Iterable<T> {
    /**
     * Returns an iterator over elements of type {@code T}.
     * @return an Iterator.
     **/
    Iterator<T> iterator();

    /**
     * Performs the given action for each element of the {@code Iterable}
     * until all elements have been processed or the action throws an
     * exception.  Unless otherwise specified by the implementing class，
     * actions are performed in the order of iteration (if an iteration order
     * is specified).  Exceptions thrown by the action are relayed to the
     * caller.
     **/
    default void foreach(Consumer<? super T> action) {
        Objects.requireNonNull(action);
        for (T t : this) {
            action.accept(t);
        }
    }

    /**
     * Creates a {@link Spliterator} over the elements described by this
     * {@code Iterable}.
     *
     * @implSpec
     * The default implementation creates an
     * <em><a href="Spliterator.html#binding">early-binding</a></em>
     * spliterator from the iterable's {@code Iterator}.  The spliterator
     * inherits the <em>fail-fast</em> properties of the iterable's iterator.
     *
     * @implNote
     * The default implementation should usually be overridden.  The
     * spliterator returned by the default implementation has poor splitting
     * capabilities， is unsized， and does not report any spliterator
     * characteristics. Implementing classes can nearly always provide a
     * better implementation.
     **/
    default Spliterator<T> spliterator() {
        return Spliterators.spliteratorUnknownSize(iterator()， 0);
    }
}
```
Iterator 示例:

```java
import java.util.*;

public class IteratorTest {
    public static void main(String[] args) {
        List<String> list = new ArrayList<>();
        Map<Integer, String> map = new HashMap<>();

        for (int i = 0; i < 10; ++i) {
            list.add("list" + i);
            map.put(i, "map" + i);
        }

        Iterator iter = list.iterator();
        while (iter.hasNext()) {
            String element = (String) iter.next();
            System.out.println(element);
        }

        for (Map.Entry<Integer, String> entry : map.entrySet()) {
            System.out.println("key: " + entry.getKey() + "， value: " + entry.getValue());
        }
    }
}
```
**接口 Iterator 在不同的子接口中会根据情况进行功能的扩展，例如针对 List 的迭代器 ListIterator，该迭代器只能用于各种 List 类的访问。ListIterator 可以双向移动，添加了 previous()等方法。**

## Iterator 与泛型搭配
Iterator 对集合类中的任何一个实现类，都可以返回这样一个 Iterator 对象，适用于任何一个类。
因为集合类(List 和 Set 等)可以装入的对象的类型是不确定的，从集合中取出时都是 Object 类型，用时都需要进行强制转化，用上泛型，提前告诉集合确定要装入集合的类型，这样就可以直接使用而不用显示类型转换。

## foreach 和 Iterator 的关系
foreach 是 jdk5.0 新增加的一个循环结构，可以用来处理集合中的每个元素而不用考虑集合定下标。其实 foreach 循环内部也是依赖于 Iterator 迭代器，只不过 Java 提供的语法糖，Java 编译器会将其转化为 Iterator 迭代器方式遍历。对以下 foreach 循环进行反编译：
```java
for(Integer i : list) {
  System.out.println(i);
}
```
反编译后：
```java
for(Iterator iterator = list.iterator(); iterator.hasNext();) {
  Integer i = (Integer)iterator.next();
  System.out.println(i);
}
```
使用 foreach 循环语句的优势在于更加简洁，更不容易出错，不必关心下标的起始值和终止值。
foreach 不是关键字，关键字还是 for，语句是由 iterator 实现的，他们最大的不同之处就在于 remove()方法上。
一般调用删除和添加方法都是具体集合的方法，例如：
List list = new ArrayList();
list.add(...); 
list.remove(...);
但是，如果在循环的过程中调用集合的 remove()方法，就会导致循环出错，因为循环过程 list.size()的大小变化了，就导致了错误。 所以，如果想在循环语句中删除集合中的某个元素，就要用迭代器 iterator 的 remove()方法，因为它的 remove()方法不仅会删除元素，还会维护一个标志，用来记录目前是不是可删除状态，例如，你不能连续两次调用它的 remove()方法，调用之前至少有一次 next()方法的调用。
foreach 就是为了让用 iterator 循环访问的形式简单，写起来更方便。当然功能不太全，所以但如有删除操作，还是要用它原来的形式。

## 使用 for 循环与使用迭代器 iterator 的对比
### 效率上
采用 ArrayList 对随机访问比较快，而 for 循环中的 get()方法，采用的即是随机访问的方法，因此在 ArrayList 里，for 循环较快；
采用 LinkedList 则是顺序访问比较快，iterator 中的 next()方法，采用的即是顺序访问的方法，因此在 LinkedList 里，使用 iterator 较快；
### 数据结构角度分析
for 循环适合访问顺序结构，可以根据下标快速获取指定元素；
Iterator 适合访问链式结构，因为迭代器是通过 next()和 pre()来定位的，可以访问没有顺序的集合；
使用 Iterator 的好处在于可以使用相同方式去遍历集合中元素，而不用考虑集合类的内部实现（只要它实现了 java.lang.Iterable 接口），如果使用 Iterator 来遍历集合中元素，一旦不再使用 List 转而使用 Set 来组织数据，那遍历元素的代码不用做任何修改，如果使用 for 来遍历，那所有遍历此集合的算法都得做相应调整，因为 List 有序，Set 无序，结构不同，他们的访问算法也不一样。

## fast-fail

fail-fast 机制是 java 集合(Collection)中的一种错误机制。当多个线程对同一个集合的内容进行操作时，就可能会产生 fail-fast 事件，抛出**ConcurrentModificationException**异常；

原理：ArrayList 继承自 AbstractList 类，AbstractList 内部有一个字段 modCount，代表修改的次数；

```java
/*
* The number of times this list has been <i>structurally modified</i>.
* Structural modifications are those that change the size of the
* list, or otherwise perturb it in such a fashion that iterations in
* progress may yield incorrect results.
*
* <p>This field is used by the iterator and list iterator implementation
* returned by the {@code iterator} and {@code listIterator} methods.
* If the value of this field changes unexpectedly, the iterator (or list
* iterator) will throw a {@code ConcurrentModificationException} in
* response to the {@code next}, {@code remove}, {@code previous},
* {@code set} or {@code add} operations.  This provides
* <i>fail-fast</i> behavior, rather than non-deterministic behavior in
* the face of concurrent modification during iteration.
*
* <p><b>Use of this field by subclasses is optional.</b> If a subclass
* wishes to provide fail-fast iterators (and list iterators), then it
* merely has to increment this field in its {@code add(int, E)} and
* {@code remove(int)} methods (and any other methods that it overrides
* that result in structural modifications to the list).  A single call to
* {@code add(int, E)} or {@code remove(int)} must add no more than
* one to this field, or the iterators (and list iterators) will throw
* bogus {@code ConcurrentModificationExceptions}.  If an implementation
* does not wish to provide fail-fast iterators, this field may be
* ignored.
*/
protected transient int modCount = 0;
```

翻译过来就是 modCount 是这个 list 被结构性修改的次数。结构性修改是指：改变 list 的 size 大小，或者，以其他方式改变他导致正在进行迭代时出现错误的结果。这个字段用于迭代器和列表迭代器的实现类中，由迭代器和列表迭代器方法返回。如果这个值被意外改变，这个迭代器将会抛出 ConcurrentModificationException 的异常来响应：next，remove，previous，set，add 这些操作。在迭代过程中，提供了 fail-fast 行为而不是不确定行为来处理并发修改。子类使用这个字段是可选的，如果子类希望提供 fail-fast 迭代器，它仅仅需要在 add(int, E)，remove(int)方法（或者它重写的其他任何会结构性修改这个列表的方法）中添加这个字段。调用 add(int,E)或者 remove(int)方法时必须且仅仅给这个字段加 1，否则迭代器会抛出 ConcurrentModificationExceptions 错误。如果一个实现类不希望提供 fail-fast 迭代器，则可以忽略这个字段。

当使用 ArrayList.iterator()返回一个迭代器对象时，迭代器对象有一个属性 expectedModCount，它被赋值为该方法调用时 modCount 的值。**这个值是 modCount 在这个时间点的快照值，expectedModCount 值在 iterator 对象内部不会再发送变化！**

```java
private class Itr implements Iterator<E> {
   /**
    * Index of element to be returned by subsequent call to next.
    */
   int cursor = 0;

   /**
    * Index of element returned by most recent call to next or
    * previous.  Reset to -1 if this element is deleted by a call
    * to remove.
    */
   int lastRet = -1;

   /**
    * The modCount value that the iterator believes that the backing
    * List should have.  If this expectation is violated, the iterator
    * has detected concurrent modification.
    */
   int expectedModCount = modCount;

   public boolean hasNext() {
       return cursor != size();
   }

   public E next() {
       checkForComodification();
       try {
           int i = cursor;
           E next = get(i);
           lastRet = i;
           cursor = i + 1;
           return next;
       } catch (IndexOutOfBoundsException e) {
           checkForComodification();
           throw new NoSuchElementException();
       }
   }

   public void remove() {
       if (lastRet < 0)
           throw new IllegalStateException();
       checkForComodification();

       try {
           AbstractList.this.remove(lastRet);
           if (lastRet < cursor)
               cursor--;
           lastRet = -1;
           expectedModCount = modCount;
       } catch (IndexOutOfBoundsException e) {
           throw new ConcurrentModificationException();
       }
   }

   /**
    * 检查modCount和expectedModCount是否相等，即modCount是否发生了变化
    * 如果modCount相比获取迭代器的时候发生了变化就抛出ConcurrentModificationException
    */
   final void checkForComodification() {
       if (modCount != expectedModCount)
           throw new ConcurrentModificationException();
   }
}
```

获取到迭代器之后，如果使用 ArrayList 的 add、remove 等方法，会使得 modCount 的值自增（**发生了变化**），而 iterator 内部的 expectedModCount 值却还是之前的快照值。而 iterator 在调用 next 方法时，**第一步就是检查 modCount 值和迭代器内部的 expectedModCount 值是否相等**！这个时候确定值是不等的，所以在调用 next 方法的时候，就抛出了 ConcurrentModificationException 异常。

获取到迭代器之后，如果使用 ArrayList 的 remove 方法时，会对 expectedModCount 重新赋值为 modCount，保证了下一次迭代的正确。

fail-fast 机制，是一种错误检测机制，如果在多线程环境下使用 fail-fast 机制的集合，建议使用“java.util.concurrent 包下的类”去取代“java.util 包下的类”，如 CopyOnWriteArrayList




