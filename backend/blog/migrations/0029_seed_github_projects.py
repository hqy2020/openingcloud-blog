from django.db import migrations


PROJECTS = [
    {
        "name": "openingcloud-blog",
        "full_name": "hqy2020/openingcloud-blog",
        "description": "A full-stack personal blog built with React and Django, deployed with Docker and Nginx.",
        "description_zh": "个人博客系统，React + Django 全栈实现，使用 Docker + Nginx 部署。",
        "detail_en": "Includes 11 interactive homepage sections with split frontend-backend deployment and content management.",
        "detail_zh": "包含 11 个首页互动分区，支持前后端分离部署与内容管理。",
        "html_url": "https://github.com/hqy2020/openingcloud-blog",
        "language": "TypeScript",
        "topics": [],
        "tech_stack": ["TypeScript", "Python", "React", "Django", "Tailwind", "Docker", "Shell"],
        "sort_order": 1,
    },
    {
        "name": "algorithm-trainer",
        "full_name": "hqy2020/algorithm-trainer",
        "description": "An algorithm training repo with TypeScript/Python solutions and repeatable practice scripts.",
        "description_zh": "算法训练与刷题工程，包含 TypeScript/Python 代码与训练脚本。",
        "detail_en": "Problems are organized by topic and training cadence for easier review and steady iteration.",
        "detail_zh": "按题型与训练节奏组织题目，便于复盘和持续迭代。",
        "html_url": "https://github.com/hqy2020/algorithm-trainer",
        "language": "TypeScript",
        "topics": [],
        "tech_stack": ["TypeScript", "Python", "Docker", "Shell"],
        "sort_order": 2,
    },
    {
        "name": "bagu",
        "full_name": "hqy2020/bagu",
        "description": "An experimental dual-stack project combining TypeScript and Python with containerized tooling.",
        "description_zh": "实验性双栈项目，使用 TypeScript 与 Python，配套容器与脚本支持。",
        "detail_en": "Focused on rapid prototyping while refining cross-language architecture and dev scaffolding.",
        "detail_zh": "面向快速原型验证，沉淀跨语言工程结构与开发脚手架。",
        "html_url": "https://github.com/hqy2020/bagu",
        "language": "TypeScript",
        "topics": [],
        "tech_stack": ["TypeScript", "Python", "Docker", "Shell"],
        "sort_order": 3,
    },
    {
        "name": "2025_HQY_Thesis",
        "full_name": "hqy2020/2025_HQY_Thesis",
        "description": "Graduation thesis repository maintained with TeX for manuscript authoring and build workflows.",
        "description_zh": "2025 届毕业论文仓库，主要用 TeX 维护正文与构建流程。",
        "detail_en": "Supports chapter-based management and automated compilation for traceable revisions and reviews.",
        "detail_zh": "支持章节化管理和自动化编译，便于版本追踪与内容审阅。",
        "html_url": "https://github.com/hqy2020/2025_HQY_Thesis",
        "language": "TeX",
        "topics": [],
        "tech_stack": ["TeX", "Shell"],
        "sort_order": 4,
    },
    {
        "name": "hqy2020",
        "full_name": "hqy2020/hqy2020",
        "description": "GitHub profile repository using Markdown to present project navigation and yearly highlights.",
        "description_zh": "GitHub 个人主页仓库，用 Markdown 展示项目导航与年度记录。",
        "detail_en": "Acts as the profile README landing page that aggregates links, updates, and key outcomes.",
        "detail_zh": "作为 Profile README 首页，聚合个人导航、年度更新与成果入口。",
        "html_url": "https://github.com/hqy2020/hqy2020",
        "language": "Markdown",
        "topics": [],
        "tech_stack": ["Markdown"],
        "sort_order": 5,
    },
]


def seed_projects(apps, schema_editor):
    GithubProject = apps.get_model("blog", "GithubProject")
    for proj in PROJECTS:
        GithubProject.objects.update_or_create(
            full_name=proj["full_name"],
            defaults=proj,
        )


def unseed_projects(apps, schema_editor):
    GithubProject = apps.get_model("blog", "GithubProject")
    full_names = [p["full_name"] for p in PROJECTS]
    GithubProject.objects.filter(full_name__in=full_names).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("blog", "0028_githubproject_editorial_fields"),
    ]

    operations = [
        migrations.RunPython(seed_projects, unseed_projects),
    ]
