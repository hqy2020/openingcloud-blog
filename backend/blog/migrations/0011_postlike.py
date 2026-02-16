from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("blog", "0010_socialfriend_birthday"),
    ]

    operations = [
        migrations.CreateModel(
            name="PostLike",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("likes", models.PositiveIntegerField(default=0)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "post",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="like_record",
                        to="blog.post",
                    ),
                ),
            ],
            options={
                "verbose_name": "文章点赞",
                "verbose_name_plural": "文章点赞",
                "ordering": ["-likes"],
            },
        ),
    ]
