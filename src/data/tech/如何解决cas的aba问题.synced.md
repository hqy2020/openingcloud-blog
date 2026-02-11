---
title: "如何解决CAS的ABA问题"
description: "通过版本号双重CAS和AtomicStampedReference解决ABA问题"
date: 2026-02-11
category: tech
tags: [并发编程]
---

# 如何解决 CAS 的 ABA 问题？

## 回答话术

ABA 问题是指：线程1准备将变量从 A 改为 B 时，线程2先将其改成 C 再改回 A，此时线程1仍能成功 CAS，造成数据错误。解决方案有两种：分布式锁避免并发修改，或引入单调递增版本号实现双重 CAS（先 CAS 版本号成功后再 CAS 目标值）。JDK 提供了 `AtomicStampedReference` 工具实现双重 CAS 机制。

## 问题详解

### ABA 问题的具体场景

转账示例：
1. 账户初始余额 100 元，线程 A 执行 cas(100,0) 但卡住
2. 线程 B 成功执行 cas(100,0)，余额变为 0
3. 客户转账 100 元，余额重新变为 100
4. 线程 A 恢复运行，再次 cas(100,0) 成功，余额又变为 0（错误）

**问题本质**："第一次的100元"与"客户转账后的100元"业务含义不同，仅比较金额数值不合理。

### ABA 问题出现的前置条件

1. **变量值可回退**：值必须能往返变化
2. **修改操作并行**：存在并发修改

破除任一条件即可解决 ABA 问题。

### 双重 CAS 解决方案

添加版本号（stamp），每次 CAS 时：
1. 先比较并递增版本号
2. 版本号 CAS 成功后再 CAS 目标值

**乐观锁实现示例**：

```sql
UPDATE example t
SET t.name = ${name}, t.version = t.version + 1
WHERE t.id = ${id} AND t.version = ${version}
```

### JUC 中的实现 - AtomicStampedReference

**使用对比**：

```java
// 单CAS
AtomicReference<Integer> ref1 = new AtomicReference<>(0);
ref1.compareAndSet(0, 1);

// 双重CAS
AtomicStampedReference<Integer> ref2 =
    new AtomicStampedReference<>(0, 0);
int stamp = ref2.getStamp();
ref2.compareAndSet(0, 1, stamp, stamp + 1);
```

**原子性保证机制**：将目标值 + 版本号封装为 Pair 对象

```java
private static class Pair<T> {
    final T reference;      // 目标值
    final int stamp;        // 版本号
}

public boolean compareAndSet(...) {
    Pair<V> current = pair;
    // 步骤1：比较预期值和版本号
    if (expectedReference != current.reference ||
        expectedStamp != current.stamp) {
        return false;
    }
    // 步骤2：创建新Pair对象并原子替换
    return casPair(current, Pair.of(newReference, newStamp));
}
```

通过将两个变量打包为单一对象，最终只需一次 CAS 操作即可保证原子性。

## 关键要点

- ABA 问题的本质是 CAS 仅比较值，不追踪中间状态变化
- 两大解决方案：分布式锁（并发控制）/ 版本号 + 双重 CAS
- JDK 工具类：`AtomicStampedReference` 和 `StampedLock`
- Pair 打包 + 单次 CAS 替换，优雅解决双变量同步问题
- 破除 ABA 的关键：让版本号单调递增，使变量状态不可回退
