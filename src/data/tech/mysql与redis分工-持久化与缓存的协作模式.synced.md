---
title: "MySQL与Redis分工-持久化与缓存的协作模式"
description: "用金库vs柜台的比喻理解 MySQL 和 Redis 的分工协作，含秒杀场景实战分析"
date: 2026-02-04
category: tech
tags: [架构, Redis, MySQL]
---

# MySQL与Redis分工-持久化与缓存的协作模式

## 关系描述
> MySQL 是「金库」（数据源、持久化、强一致），Redis 是「柜台」（缓存、快速读取、扛高并发），两者协作实现既安全又高效的数据存储方案。

## 关联概念
- **主体**：[MySQL](/posts/mysql)（持久化存储）
- **客体**：[Redis](/posts/redis)（内存缓存）
- **类型**：协作关系

## 关系详解

### 分工定位

| 角色 | MySQL | Redis |
|------|-------|-------|
| 定位 | 数据源（Source of Truth） | 缓存（热数据加速） |
| 存储 | 磁盘 | 内存 |
| 速度 | 慢（毫秒~秒级） | 快（微秒~毫秒级） |
| 容量 | 大（TB级） | 小（GB级） |
| 一致性 | 强一致（ACID） | 最终一致 |
| 高并发 | 弱（几千 QPS） | 强（10万+ QPS） |

### 协作模式

```
用户请求
    ↓
[Redis 缓存] ──命中──→ 返回（快）
    │
  未命中
    ↓
[MySQL 数据库] ──查询──→ 写入 Redis → 返回
```

### 为什么秒杀场景必须用 Redis

秒杀 QPS 可能达到几万甚至几十万：
- **MySQL**：连接池有限（通常几百），行锁竞争激烈，扛不住
- **Redis**：单机 10万+ QPS，内存操作无磁盘IO

### 数据不一致风险

```java
// 写入 Redis 后需要确认（写后查询策略）
stringRedisTemplate.opsForZSet().add(key, member, score);
Double scored = stringRedisTemplate.opsForZSet().score(key, member);
if (scored == null) {
    // 主从同步可能丢数据，再写一次
    stringRedisTemplate.opsForZSet().add(key, member, score);
}
```

原因：Redis 主从复制是**异步**的，主节点写成功后返回，但数据可能还没同步到从节点。

## 典型案例

1. **优惠券秒杀**：Redis 存用户已领券列表（快速判断超领），MySQL 存完整领券记录
2. **商品详情**：Redis 缓存热门商品，MySQL 存全量商品
3. **用户 Session**：Redis 存会话信息，MySQL 存用户基本资料

## 注意事项

- 缓存击穿：热点 key 过期瞬间大量请求打到 MySQL
- 缓存穿透：查询不存在的数据，需要布隆过滤器
- 缓存雪崩：大量 key 同时过期，需要加随机过期时间
- 数据一致性：先写 MySQL 后写 Redis，或用 Canal 异步同步

## 与其他概念的关系
- [Canal](/posts/canal)：通过监听 binlog 实现 MySQL → Redis 异步同步
- [布隆过滤器](/posts/布隆过滤器)：解决缓存穿透问题
- [分布式锁](/posts/分布式锁)：解决缓存击穿的热点 key 问题

## 参考来源
- 《牛券oneCoupon优惠券系统设计》第23小节
