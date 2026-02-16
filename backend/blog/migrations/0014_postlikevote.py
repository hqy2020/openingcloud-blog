from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("blog", "0013_merge_0009_and_0012"),
    ]

    operations = [
        migrations.CreateModel(
            name="PostLikeVote",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("ip_hash", models.CharField(db_index=True, max_length=64)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("post", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="like_votes", to="blog.post")),
            ],
            options={
                "verbose_name": "点赞投票",
                "verbose_name_plural": "点赞投票",
                "unique_together": {("post", "ip_hash")},
            },
        ),
    ]
