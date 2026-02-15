# 首页数据一期种子执行手册

适用仓库：`/Users/openingcloud/openingcloud-blog`  
种子文件：`/Users/openingcloud/openingcloud-blog/backend/fixtures/homepage_seed.v1.json`

## 1. 数据来源

- 时间线、高光：`/Users/openingcloud/openingcloud-blog/assets/博客需求文档.md`
- 旅行首版：用户口述城市清单（桃花岛归一到舟山，辽宁归一到沈阳）
- 社交首版：`/Users/openingcloud/Documents/GardenOfOpeningClouds/2-Resource（参考资源）/40_个人档案/联系人`

## 2. 执行前备份

```bash
cd /Users/openingcloud/openingcloud-blog/backend
cp db.sqlite3 "db.sqlite3.bak.homepage_seed.$(date +%Y%m%d_%H%M%S)"
```

## 3. 应用迁移（修复 social_graph 必需）

```bash
cd /Users/openingcloud/openingcloud-blog/backend
.venv/bin/python manage.py migrate
.venv/bin/python manage.py showmigrations blog
```

预期：`blog` 的 `0001_initial`、`0002_socialfriend_stage_key`、`0003_synclog` 均为 `[X]`。

## 4. 导入结构化首页数据

先 dry-run：

```bash
cd /Users/openingcloud/openingcloud-blog/backend
.venv/bin/python manage.py import_structured_data fixtures/homepage_seed.v1.json --dry-run
```

正式导入（全量覆盖四模块）：

```bash
cd /Users/openingcloud/openingcloud-blog/backend
.venv/bin/python manage.py import_structured_data fixtures/homepage_seed.v1.json --truncate
```

说明：`--truncate` 仅清理并重建结构化模块（timeline/travel/social/highlights），不影响文章与阅读数据。

## 5. 验证命令

### 5.1 数据计数

```bash
cd /Users/openingcloud/openingcloud-blog/backend
.venv/bin/python manage.py shell -c "from blog.models import TimelineNode,HighlightStage,HighlightItem,TravelPlace,SocialFriend; print({'timeline':TimelineNode.objects.count(),'highlight_stages':HighlightStage.objects.count(),'highlight_items':HighlightItem.objects.count(),'travel':TravelPlace.objects.count(),'social':SocialFriend.objects.count()})"
```

### 5.2 首页聚合接口

```bash
cd /Users/openingcloud/openingcloud-blog/backend
.venv/bin/python manage.py shell -c "from django.test import Client; r=Client().get('/api/home/'); d=r.json(); print(r.status_code, d.get('ok')); data=d.get('data',{}); print('timeline',len(data.get('timeline',[])),'highlights',len(data.get('highlights',[])),'travel',len(data.get('travel',[])),'social_nodes',len(data.get('social_graph',{}).get('nodes',[])))"
```

### 5.3 公开社交隐私校验

```bash
cd /Users/openingcloud/openingcloud-blog/backend
.venv/bin/python manage.py shell -c "from django.test import Client; d=Client().get('/api/social-graph/').json()['data']; friends=[n for n in d['nodes'] if n.get('type')=='friend']; print('friend_nodes',len(friends)); print('leak_fields', any(any(k in n for k in ['name','profile_url','avatar']) for n in friends))"
```

预期：`leak_fields` 为 `False`。

### 5.4 回归测试

```bash
cd /Users/openingcloud/openingcloud-blog/backend
.venv/bin/python manage.py test blog.tests
```

## 6. 回滚

### 6.1 整库回滚

```bash
cd /Users/openingcloud/openingcloud-blog/backend
cp db.sqlite3.bak.homepage_seed.<timestamp> db.sqlite3
```

### 6.2 仅结构化模块回滚

重新导入上一版稳定 seed：

```bash
cd /Users/openingcloud/openingcloud-blog/backend
.venv/bin/python manage.py import_structured_data fixtures/<previous_seed>.json --truncate
```
