from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('grades', '0002_gradebook_gradeactivity_gradeentry'),
    ]

    operations = [
        migrations.AlterField(
            model_name='grade',
            name='max_score',
            field=models.DecimalField(decimal_places=2, default=45.0, max_digits=5),
        ),
        migrations.AlterField(
            model_name='gradeactivity',
            name='max_score',
            field=models.DecimalField(decimal_places=2, default=45.0, max_digits=5),
        ),
    ]
