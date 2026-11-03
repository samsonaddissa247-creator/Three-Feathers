from django.contrib import admin

from .models import ClubProfile, Fixture, GalleryImage, Player


@admin.register(ClubProfile)
class ClubProfileAdmin(admin.ModelAdmin):
    list_display = ('name', 'updated_at')
    fields = ('name', 'about', 'training', 'pitch', 'contact')


@admin.register(Player)
class PlayerAdmin(admin.ModelAdmin):
    list_display = ('name', 'number', 'position', 'goals', 'assists')
    list_filter = ('position',)
    search_fields = ('name',)


@admin.register(Fixture)
class FixtureAdmin(admin.ModelAdmin):
    list_display = ('opponent', 'date', 'venue', 'home', 'us', 'them')
    list_filter = ('home', 'date')
    search_fields = ('opponent', 'venue')


@admin.register(GalleryImage)
class GalleryImageAdmin(admin.ModelAdmin):
    list_display = ('title', 'caption', 'created_at')
    search_fields = ('title', 'caption')
