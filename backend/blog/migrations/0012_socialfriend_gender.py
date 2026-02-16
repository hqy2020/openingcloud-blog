from django.db import migrations, models


def backfill_gender(apps, schema_editor):
    SocialFriend = apps.get_model("blog", "SocialFriend")
    SocialFriend.objects.filter(honorific="mr").update(gender="male")
    SocialFriend.objects.filter(honorific="ms").update(gender="female")


class Migration(migrations.Migration):

    dependencies = [
        ("blog", "0011_postlike"),
    ]

    operations = [
        migrations.AddField(
            model_name="socialfriend",
            name="gender",
            field=models.CharField(
                choices=[("male", "男"), ("female", "女"), ("unknown", "未知")],
                default="unknown",
                max_length=10,
            ),
        ),
        migrations.RunPython(backfill_gender, migrations.RunPython.noop),
    ]
