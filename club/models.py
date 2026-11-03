from django.db import models


class ClubProfile(models.Model):
    name = models.CharField(max_length=120, default='Three Feathers Hockey Club')
    about = models.TextField(blank=True)
    training = models.TextField(blank=True)
    pitch = models.TextField(blank=True)
    contact = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'club profile'
        verbose_name_plural = 'club profiles'

    def __str__(self):
        return self.name


class Player(models.Model):
    POSITIONS = (
        ('Goalkeeper', 'Goalkeeper'),
        ('Defender', 'Defender'),
        ('Midfielder', 'Midfielder'),
        ('Forward', 'Forward'),
    )

    name = models.CharField(max_length=80)
    number = models.PositiveSmallIntegerField(blank=True, null=True)
    position = models.CharField(max_length=20, choices=POSITIONS, default='Midfielder')
    goals = models.PositiveIntegerField(default=0)
    assists = models.PositiveIntegerField(default=0)
    photo = models.ImageField(upload_to='players/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class Fixture(models.Model):
    opponent = models.CharField(max_length=80)
    date = models.DateField()
    time = models.TimeField(blank=True, null=True)
    venue = models.CharField(max_length=200, blank=True)
    home = models.BooleanField(default=True)
    us = models.PositiveSmallIntegerField(blank=True, null=True)
    them = models.PositiveSmallIntegerField(blank=True, null=True)

    class Meta:
        ordering = ['date', 'time']

    def __str__(self):
        return f'{self.opponent} on {self.date}'


class GalleryImage(models.Model):
    title = models.CharField(max_length=100, blank=True)
    caption = models.CharField(max_length=200, blank=True)
    image = models.ImageField(upload_to='gallery/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title or 'Gallery image'
