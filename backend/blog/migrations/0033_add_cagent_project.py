from django.db import migrations


def seed_cagent(apps, schema_editor):
    GithubProject = apps.get_model("blog", "GithubProject")
    GithubProject.objects.update_or_create(
        full_name="hqy2020/CAgent",
        defaults={
            "name": "CAgent",
            "full_name": "hqy2020/CAgent",
            "description": "基于 RAG + LLM 构建的个人知识管理与问答系统",
            "description_zh": "基于 RAG + LLM 构建的个人知识管理与问答系统",
            "detail_en": "对话式知识检索，支持深度思考模式、Query Rewrite、多问句拆分、意图识别等高级 RAG 功能。",
            "detail_zh": "对话式知识检索，支持深度思考模式、Query Rewrite、多问句拆分、意图识别等高级 RAG 功能。",
            "html_url": "https://github.com/hqy2020/CAgent",
            "language": "Java",
            "topics": [],
            "tech_stack": ["Java", "TypeScript", "Python", "Lua", "Shell"],
            "sort_order": 6,
        },
    )


def remove_cagent(apps, schema_editor):
    GithubProject = apps.get_model("blog", "GithubProject")
    GithubProject.objects.filter(full_name="hqy2020/CAgent").delete()


class Migration(migrations.Migration):
    dependencies = [
        ("blog", "0032_wishitem_price_new_wishes"),
    ]

    operations = [
        migrations.RunPython(seed_cagent, remove_cagent),
    ]
