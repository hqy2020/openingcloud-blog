---
title: "Redis Pipeline-批量命令减少网络往返"
description: "Redis Pipeline 的本质是攒一批命令一次发送，省的是网络往返时间而非 Redis 执行时间"
date: 2026-02-11
category: tech
tags: [Redis, 性能优化]
---

# Redis Pipeline-批量命令减少网络往返

## 定义
> Redis Pipeline 是将多条命令打包成一次网络请求发送给 Redis 服务器，服务器按顺序执行后将结果一次性返回，从而减少网络往返次数（RTT）的技术。

## 核心要点

### 有无 Pipeline 的区别

```
无 Pipeline（3 条命令 = 3 次网络往返）：
客户端 → HGETALL key1 → Redis → 返回结果1
客户端 → HGETALL key2 → Redis → 返回结果2
客户端 → HGETALL key3 → Redis → 返回结果3

有 Pipeline（3 条命令 = 1 次网络往返）：
客户端 → [HGETALL key1, HGETALL key2, HGETALL key3] → Redis
Redis  → [结果1, 结果2, 结果3] → 客户端
```

**关键认知**：Pipeline 省的是网络时间（毫秒级），不是 Redis 执行时间（微秒级）。

### Spring Boot 中的写法

```java
List<Object> results = stringRedisTemplate.executePipelined(
    (RedisCallback<String>) connection -> {
        // connection 是底层 Redis 连接，在这里塞命令
        keyList.forEach(key ->
            connection.hashCommands().hGetAll(key.getBytes())
        );
        return null;  // Pipeline 模式下返回值被忽略，固定写 null
    }
);
// results 的顺序和发命令的顺序一一对应
```

### 语法拆解

| 部分 | 作用 |
|------|------|
| `executePipelined()` | 告诉 Spring：攒命令，一次性发 |
| `RedisCallback<String>` | 回调接口，Spring 给你底层 connection |
| `connection.hashCommands().hGetAll()` | 用底层连接发命令（不会立即返回结果） |
| `return null` | 固定写法，Pipeline 模式忽略回调返回值 |

## 与其他概念的关系
- [MySQL与Redis分工-持久化与缓存的协作模式](/posts/mysql与redis分工-持久化与缓存的协作模式)：Pipeline 是 Redis 读取优化的具体手段
- [ZSet数据结构-排序集合的设计精髓](/posts/zset数据结构-排序集合的设计精髓)：优惠券场景中先用 ZSet 取 ID 列表，再用 Pipeline 批量获取详情

## 应用场景
- 批量获取优惠券模板详情（用户有 N 张券，一次取回所有模板信息）
- 批量写入缓存（如预热场景）
- 批量删除缓存 key

## 参考来源
- 《牛券oneCoupon优惠券系统设计》第29小节
