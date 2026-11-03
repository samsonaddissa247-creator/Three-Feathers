from django.urls import path

from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('players/', views.players_view, name='players'),
    path('fixtures/', views.fixtures_view, name='fixtures'),
    path('gallery/', views.gallery_view, name='gallery'),
    path('coach/', views.coach_dashboard, name='coach_dashboard'),
    path('coach/login/', views.coach_login, name='coach_login'),
    path('coach/logout/', views.coach_logout, name='coach_logout'),
]
