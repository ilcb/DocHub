---
title: 解释器模式
description: "解释器模式"
slug: "/backend/design-pattern/action/interpreter"
hide_table_of_contents: false
keywords: ["设计模式", "结构型"]
tags: ["设计模式", "结构型"]
date: 2017-08-01
categories: ["设计模式"]
---
## 定义

解释器模式（Interpreter Pattern）提供了评估语言的语法或表达式的方式，它属于行为型模式。这种模式实现了一个表达式接口，该接口解释一个特定的上下文。这种模式被用在 SQL 解析、符号处理引擎等。

## 结构

### 抽象解释器（AbstractExpression）

声明一个抽象的解释操作，该接口为抽象语法树中所有的节点共享，具体的解释任务由各个实现类完成。 

### 终结符表达式（TerminalExpression）

实现与文法中的元素相关联的解释操作，通常一个解释器模式中只有一个终结表达式，但有多个实例，对应不同的终结符。 

### 非终结符表达式（NonterminalExpression）

文法中的每条规则对应于一个非终结表达式，非终结符表达式根据逻辑的复杂程度而增加，原则上每个文法规则都对应一个非终结符表达式 

### 上下文（Context） 

上下文环境类,包含解释器之外的全局信息 

## 实现

### 原型

```java
/**
 * 抽象表达式，声明一个抽象的解释操作，这个接口为抽象语法树中所有节点共享
 */
public abstract class AbstractExpression {
    public abstract void interpret(Context context);
}

/**
 * 终结符表达式，实现与文法中的终结符相关的解释操作
 */
public class TerminalExpression extends AbstractExpression {
    @Override
    public void interpret(Context context) {
        System.out.println("终结表达式");
    }
}

/**
 * 非终结符表达式，为文法中非终结符实现解释操作
 */
public class NonterminalExpression extends AbstractExpression {
    @Override
    public void interpret(Context context) {
        System.out.println("非终结解释器");
    }
}

/**
 * 包含解释器之外的一些全局信息
 */
public class Context {
    private String input;
    private String output;

    public String getInput() {
        return input;
    }

    public void setInput(String input) {
        this.input = input;
    }

    public String getOutput() {
        return output;
    }

    public void setOutput(String output) {
        this.output = output;
    }
}

public class InterperterTest {
    @Test
    public void interpret() {
        Context context = new Context();
        List<AbstractExpression> list = new ArrayList<>();
        list.add(new TerminalExpression());
        list.add(new NonterminalExpression());
        list.add(new TerminalExpression());
        list.add(new TerminalExpression());

        for (AbstractExpression expression : list) {
            expression.interpret(context);
        }
    }
}

##结果
终结表达式
非终结解释器
终结表达式
终结表达式
```

### 运算符

```java
/**
 * 抽象解释器
 */
public abstract class Expression {
    abstract int interpret();
}

/**
 * 操作数表达式
 */
public class NumExpression extends Expression {
    private Integer num;

    public NumExpression(Integer num) {
        this.num = num;
    }

    @Override
    public int interpret() {
        return num;
    }
}

/**
 * 运算表达式
 */
public abstract class OperationExpression extends Expression {
    protected Expression leftExpression;
    protected Expression rightExpression;

    public OperationExpression(Expression leftExpression, Expression rightExpression) {
        this.leftExpression = leftExpression;
        this.rightExpression = rightExpression;
    }
}

/**
 * 加法运算
 */
public class AddExpression extends OperationExpression {
    public AddExpression(Expression leftExpression, Expression rightExpression) {
        super(leftExpression, rightExpression);
    }

    @Override
    int interpret() {
        return leftExpression.interpret() + rightExpression.interpret();
    }
}

/**
 * 减法运算
 */
public class SubExpression extends OperationExpression {
    public SubExpression(Expression leftExpression, Expression rightExpression) {
        super(leftExpression, rightExpression);
    }

    @Override
    int interpret() {
        return leftExpression.interpret() - rightExpression.interpret();
    }
}

/**
 * 乘法运算
 */
public class MultipleExpression extends OperationExpression {
    public MultipleExpression(Expression leftExpression, Expression rightExpression) {
        super(leftExpression, rightExpression);
    }

    @Override
    int interpret() {
        return leftExpression.interpret() * rightExpression.interpret();
    }
}

/**
 * 除法运算
 */
public class DivideExpression extends OperationExpression {
    public DivideExpression(Expression leftExpression, Expression rightExpression) {
        super(leftExpression, rightExpression);
    }

    @Override
    int interpret() {
        return leftExpression.interpret() / rightExpression.interpret();
    }
}

/**
 * 计算器
 */
public class Calculator {
    // 中缀表达式
    private String expressions;
    // 操作符栈
    private LinkedList<Character> operStack = new LinkedList<>();
    // 后缀表达式计算数据栈
    private Stack<Expression> numStack = new Stack<>();

    public String getExpressions() {
        return expressions;
    }

    public void setExpressions(String expressions) {
        this.expressions = expressions;
    }

    /**
     * 中缀转后缀
     * 1.遇到操作数：添加到后缀表达式中或直接输出
     * 2.栈空时：遇到运算符，直接入栈
     * 3.遇到左括号：将其入栈
     * 4.遇到右括号：执行出栈操作，输出到后缀表达式，直到弹出的是左括号(注意：左括号不输出到后缀表达式)
     * 5.遇到其他运算符：弹出所有优先级大于或等于该运算符的栈顶元素，然后将该运算符入栈
     * 6.将栈中剩余内容依次弹出后缀表达式
     */
    public String transferPostfix() {
        String result = "";
        for (char ele : expressions.toCharArray()) {
            // 数字直接入栈
            if (Character.isDigit(ele)) {
                result += ele;
                continue;
            }

            if (ele == '(') {
                // 3.遇到左括号：将其入栈
                operStack.push(ele);
            } else if (ele == ')') {
                // 4.遇到右括号：执行出栈操作，输出到后缀表达式，直到弹出的是左括号(注意：左括号不输出到后缀表达式)
                while (!operStack.isEmpty() && operStack.peek() != '(') {
                    result += operStack.pop();
                }

                // 弹出左括号
                operStack.pop();
            } else {
                //5.遇到其他运算符：弹出所有优先级大于或等于该运算符的栈顶元素，然后将该运算符入栈
                while (!operStack.isEmpty() && priority(operStack.peek()) >= priority(ele) && operStack.peek() != '(') {
                    result += operStack.pop();
                }
                operStack.push(ele);
            }
        }

        //6.将栈中剩余内容依次弹出后缀表达式
        while (!operStack.isEmpty()) {
            result += operStack.poll();
        }
        return result.toString();
    }

    private int priority(char oper) {
        switch (oper) {
            case '+':
            case '-':
                return 1;
            case '*':
            case '/':
                return 2;
            case '(':
            case ')':
                return 3;
            default:
                return 0;
        }
    }

    /**
     * 后缀表达式的计算
     * 从左到右扫描后缀表达式
     * 1.若是操作数，就压栈，
     * 2.若是操作符，就连续弹出两个操作数计算，计算结果压栈
     * 3.栈顶的值即为所需结果
     * 注：先弹出的是第一操作数，后弹出的是第二操作数
     */
    public int calculate() {
        Expression leftExpression = null;
        Expression rightExpression = null;
        char[] array = transferPostfix().toCharArray();
        for (int i = 0, length = array.length; i < length; ++i) {
            switch (array[i]) {
                case '+':
                    rightExpression = numStack.pop();
                    leftExpression = numStack.pop();
                    numStack.push(new AddExpression(leftExpression, rightExpression));
                    break;
                case '-':
                    rightExpression = numStack.pop();
                    leftExpression = numStack.pop();
                    numStack.push(new SubExpression(leftExpression, rightExpression));
                    break;
                case '*':
                    rightExpression = numStack.pop();
                    leftExpression = numStack.pop();
                    numStack.push(new MultipleExpression(leftExpression, rightExpression));
                    break;
                case '/':
                    rightExpression = numStack.pop();
                    leftExpression = numStack.pop();
                    numStack.push(new DivideExpression(leftExpression, rightExpression));
                    break;
                default:
                    numStack.push(new NumExpression(Integer.valueOf("" + array[i])));
            }
        }
        return numStack.pop().interpret();
    }
}

public class CalculterTest {
    @Test
    public void test() {
        String str = "3+(2-5)*6/3"; // 后缀表达式为： 325-6*3/+
        Calculator calculator = new Calculator();
        calculator.setExpressions(str);
        int result = calculator.calculate();
        System.out.println(result);

        str = "5+2*(3*(3-1*2+1))"; // 523312*-1+**+
        calculator.setExpressions(str);
        result = calculator.calculate();
        System.out.println(result);
    }
}

##结果
后缀： 325-6*3/+
-3
后缀： 523312*-1+**+
17

```



