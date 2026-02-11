---
title: "Collectors.toMap-List转Map的空间换时间"
description: "Collectors.toMap 是业务代码中最高频的 List → Map 转换模式，本质是建索引避免反复遍历"
date: 2026-02-11
category: tech
tags: [Java, Stream, 编码技巧]
---

# Collectors.toMap-List转Map的空间换时间

## 定义
> `Collectors.toMap()` 是 Java Stream API 中将 List 转换为 Map 的收集器，本质是提前为列表建立索引，将后续按字段查找的复杂度从 O(n) 降到 O(1)。

## 核心要点

### 固定模式

```java
Map<String, GoodsDTO> map = list.stream()
    .collect(Collectors.toMap(
        GoodsDTO::getGoodsNumber,       // 参数1：用什么当 Key
        Function.identity(),             // 参数2：用什么当 Value（identity = 对象本身）
        (existing, replacement) -> existing  // 参数3：Key 重复时保留哪个
    ));
```

### 三个参数的含义

| 参数 | 作用 | 常见写法 |
|------|------|---------|
| 参数1（keyMapper） | 从对象中取哪个字段当 Key | `Xxx::getId` |
| 参数2（valueMapper） | Value 放什么 | `Function.identity()`（放对象本身） |
| 参数3（mergeFunction） | Key 冲突时的处理策略 | `(a, b) -> a`（保留第一个） |

### 等价的 for 循环写法

```java
Map<String, GoodsDTO> map = new HashMap<>();
for (GoodsDTO goods : list) {
    map.putIfAbsent(goods.getGoodsNumber(), goods);
}
```

两种写法完全等价，Stream 写法更简洁，for 循环更易读。

### 为什么要转 Map

场景：有 N 张商品专属券，每张券要根据商品编号找到对应商品的金额。

```java
// 不转 Map：每张券都遍历商品列表找匹配 → O(券数 × 商品数)
for (Coupon coupon : coupons) {
    for (Goods goods : goodsList) {
        if (goods.getNumber().equals(coupon.getGoods())) { ... }
    }
}

// 转 Map 后：直接按编号查 → O(商品数 + 券数)
Map<String, Goods> map = goodsList → toMap;
for (Coupon coupon : coupons) {
    Goods goods = map.get(coupon.getGoods());  // O(1) 定位
}
```

**经验法则**：只要看到「从一个列表中按某个字段反复查找」，就应该先转 Map。

## 与其他概念的关系
- [HashMap](/posts/hashmap)：toMap 底层创建的就是 HashMap
- [Stream API](/posts/stream-api)：toMap 是 Stream 终端操作 collect 的一种收集器

## 应用场景
- 订单结算：按商品编号查商品金额（优惠券场景）
- 批量查询后组装：按 ID 查对应实体
- 两个列表按关联字段合并数据

## 参考来源
- 《牛券oneCoupon优惠券系统设计》第29小节
