from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("blog", "0014_postlikevote"),
    ]

    operations = [
        migrations.CreateModel(
            name="SiteVisit",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("path", models.CharField(db_index=True, max_length=500)),
                ("referrer", models.URLField(blank=True, max_length=1000)),
                ("referrer_domain", models.CharField(blank=True, db_index=True, max_length=255)),
                ("ip_hash", models.CharField(db_index=True, max_length=64)),
                ("user_agent", models.CharField(blank=True, max_length=500)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
            ],
            options={
                "verbose_name": "站点访问",
                "verbose_name_plural": "站点访问",
                "ordering": ["-created_at"],
            },
        ),
        migrations.AddIndex(
            model_name="sitevisit",
            index=models.Index(fields=["path", "created_at"], name="blog_sitevi_path_0b4d3c_idx"),
        ),
        migrations.AddIndex(
            model_name="sitevisit",
            index=models.Index(fields=["referrer_domain", "created_at"], name="blog_sitevi_referre_a1c8e2_idx"),
        ),
    ]
