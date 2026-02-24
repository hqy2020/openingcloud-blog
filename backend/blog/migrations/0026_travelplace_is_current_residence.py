from django.db import migrations, models


def mark_hangzhou_as_current(apps, schema_editor):
    TravelPlace = apps.get_model("blog", "TravelPlace")
    TravelPlace.objects.filter(province="浙江", city="杭州").update(is_current_residence=True)


def unmark_hangzhou(apps, schema_editor):
    TravelPlace = apps.get_model("blog", "TravelPlace")
    TravelPlace.objects.filter(province="浙江", city="杭州").update(is_current_residence=False)


class Migration(migrations.Migration):

    dependencies = [
        ("blog", "0025_seed_section_quotes"),
    ]

    operations = [
        migrations.AddField(
            model_name="travelplace",
            name="is_current_residence",
            field=models.BooleanField(default=False, verbose_name="当前居住地"),
        ),
        migrations.RunPython(mark_hangzhou_as_current, unmark_hangzhou),
    ]
