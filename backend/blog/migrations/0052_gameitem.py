from django.db import migrations, models


GAME_NOTE_PATH = "2-Resource/90_网站同步/06_游戏库/游戏库.md"
GAME_SEED_ROWS = [
    {
        "title": "路易吉洋馆3",
        "english_title": "Luigi's Mansion 3",
        "platform": "Switch",
        "status": "wishlist",
        "sort_order": 10,
    },
    {
        "title": "雪地奔驰",
        "english_title": "SnowRunner",
        "platform": "Switch",
        "status": "wishlist",
        "sort_order": 20,
    },
    {
        "title": "杀戮尖塔",
        "english_title": "Slay the Spire",
        "platform": "Switch",
        "status": "wishlist",
        "sort_order": 30,
    },
    {
        "title": "双点医院",
        "english_title": "Two Point Hospital",
        "platform": "Switch",
        "status": "wishlist",
        "sort_order": 40,
    },
    {
        "title": "勇者斗恶龙",
        "english_title": "Dragon Quest",
        "platform": "Switch",
        "status": "wishlist",
        "sort_order": 50,
    },
    {
        "title": "赛博朋克 2077",
        "english_title": "Cyberpunk 2077",
        "platform": "Switch",
        "status": "wishlist",
        "sort_order": 60,
    },
    {
        "title": "潜水员戴夫",
        "english_title": "Dave the Diver",
        "platform": "Switch",
        "status": "wishlist",
        "sort_order": 70,
    },
    {
        "title": "瓦力欧制造",
        "english_title": "WarioWare",
        "platform": "Switch",
        "status": "wishlist",
        "sort_order": 80,
    },
    {
        "title": "塞尔达传说：旷野之息",
        "english_title": "The Legend of Zelda: Breath of the Wild",
        "platform": "Switch",
        "status": "owned",
        "sort_order": 1010,
    },
    {
        "title": "三国志14",
        "english_title": "Romance of the Three Kingdoms 14",
        "platform": "Switch",
        "status": "owned",
        "sort_order": 1020,
    },
    {
        "title": "真三国无双：起源",
        "english_title": "Dynasty Warriors: Origins",
        "platform": "Switch",
        "status": "owned",
        "sort_order": 1030,
    },
    {
        "title": "咚奇刚：蕉力全开",
        "english_title": "Donkey Kong Country: Tropical Freeze",
        "platform": "Switch",
        "status": "owned",
        "sort_order": 1040,
    },
    {
        "title": "马力欧赛车：世界",
        "english_title": "Mario Kart World",
        "platform": "Switch",
        "status": "owned",
        "sort_order": 1050,
    },
    {
        "title": "超级马力欧：奥德赛",
        "english_title": "Super Mario Odyssey",
        "platform": "Switch",
        "status": "owned",
        "sort_order": 1060,
    },
    {
        "title": "超级马力欧派对：空前盛会",
        "english_title": "Super Mario Party Jamboree",
        "platform": "Switch",
        "status": "owned",
        "sort_order": 1070,
    },
    {
        "title": "双影奇境",
        "english_title": "It Takes Two",
        "platform": "Switch",
        "status": "owned",
        "sort_order": 1080,
    },
    {
        "title": "文明7",
        "english_title": "Civilization VII",
        "platform": "Switch",
        "status": "owned",
        "sort_order": 1090,
    },
]


def seed_game_items(apps, schema_editor):
    GameItem = apps.get_model("blog", "GameItem")
    for row in GAME_SEED_ROWS:
        defaults = {
            "english_title": row["english_title"],
            "platform": row["platform"],
            "status": row["status"],
            "notes": "",
            "info_url": "",
            "source_url": "",
            "obsidian_path": GAME_NOTE_PATH,
            "ai_context": {},
            "sort_order": row["sort_order"],
            "is_active": True,
        }
        GameItem.objects.update_or_create(title=row["title"], defaults=defaults)


def unseed_game_items(apps, schema_editor):
    GameItem = apps.get_model("blog", "GameItem")
    titles = [row["title"] for row in GAME_SEED_ROWS]
    GameItem.objects.filter(obsidian_path=GAME_NOTE_PATH, title__in=titles).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("blog", "0051_wikiquote_obsidian_path"),
    ]

    operations = [
        migrations.CreateModel(
            name="GameItem",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("title", models.CharField(max_length=200)),
                ("english_title", models.CharField(blank=True, max_length=240, verbose_name="英文名")),
                ("platform", models.CharField(default="Switch", max_length=60, verbose_name="平台")),
                ("status", models.CharField(choices=[("wishlist", "想买"), ("owned", "已买")], db_index=True, default="wishlist", max_length=16)),
                ("notes", models.TextField(blank=True, verbose_name="备注")),
                ("info_url", models.URLField(blank=True, max_length=800, verbose_name="信息链接")),
                ("source_url", models.URLField(blank=True, max_length=800, verbose_name="Obsidian 来源链接")),
                ("obsidian_path", models.CharField(blank=True, db_index=True, max_length=500, verbose_name="Obsidian 路径")),
                ("ai_context", models.JSONField(blank=True, default=dict, verbose_name="AI 补全上下文")),
                ("sort_order", models.PositiveIntegerField(db_index=True, default=0)),
                ("is_active", models.BooleanField(db_index=True, default=True)),
            ],
            options={
                "verbose_name": "游戏库",
                "verbose_name_plural": "游戏库",
                "ordering": ["sort_order", "title"],
            },
        ),
        migrations.RunPython(seed_game_items, reverse_code=unseed_game_items),
    ]
