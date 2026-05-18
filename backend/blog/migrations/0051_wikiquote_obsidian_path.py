from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("blog", "0050_photowallimage_obsidian_path_photowallimage_sync_key"),
    ]

    operations = [
        migrations.AddField(
            model_name="wikiquote",
            name="obsidian_path",
            field=models.CharField(blank=True, db_index=True, max_length=500, verbose_name="Obsidian 路径"),
        ),
    ]
