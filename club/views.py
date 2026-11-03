from django.contrib import messages
from django.contrib.auth import logout
from django.shortcuts import redirect, render
from django.views.decorators.http import require_http_methods

from .forms import (
    ClubProfileForm,
    CoachPasswordForm,
    FixtureForm,
    GalleryImageForm,
    PlayerForm,
    ResultFixtureForm,
    UpcomingFixtureForm,
)
from .models import ClubProfile, Fixture, GalleryImage, Player

COACH_PASSWORD = 'COACHAB'


def get_club():
    club = ClubProfile.objects.first()
    if club is None:
        club = ClubProfile.objects.create(
            name='Three Feathers Hockey Club',
            about='',
            training='',
            pitch='',
            contact='',
        )
    return club


def home(request):
    club = get_club()
    players = list(Player.objects.order_by('number', 'name'))
    upcoming = list(Fixture.objects.filter(us__isnull=True).order_by('date', 'time'))
    played = list(Fixture.objects.filter(us__isnull=False).order_by('-date', '-id'))
    gallery = list(GalleryImage.objects.order_by('-created_at', '-id'))
    top_goals = list(Player.objects.order_by('-goals', 'name')[:5])
    top_assists = list(Player.objects.order_by('-assists', 'name')[:5])

    context = {
        'club': club,
        'players': players,
        'upcoming': upcoming,
        'played': played,
        'gallery': gallery,
        'top_goals': top_goals,
        'top_assists': top_assists,
        'stats': {
            'players': len(players),
            'goals': sum(player.goals for player in players),
            'assists': sum(player.assists for player in players),
            'fixtures': len(played),
        },
    }
    return render(request, 'club/home.html', context)


def players_view(request):
    club = get_club()
    players = list(Player.objects.order_by('-goals', '-assists', 'name'))
    return render(request, 'club/players.html', {'club': club, 'players': players})


def fixtures_view(request):
    club = get_club()
    upcoming = list(Fixture.objects.filter(us__isnull=True).order_by('date', 'time'))
    played = list(Fixture.objects.filter(us__isnull=False).order_by('-date', '-id'))
    return render(request, 'club/fixtures.html', {'club': club, 'upcoming': upcoming, 'played': played})


def gallery_view(request):
    club = get_club()
    gallery = list(GalleryImage.objects.order_by('-created_at', '-id'))
    return render(request, 'club/gallery.html', {'club': club, 'gallery': gallery})


def coach_login(request):
    if request.method == 'POST':
        form = CoachPasswordForm(request.POST)
        if form.is_valid() and form.cleaned_data['password'] == COACH_PASSWORD:
            request.session['coach_authenticated'] = True
            return redirect('coach_dashboard')
        messages.error(request, 'Incorrect password. Please try again.')
    else:
        form = CoachPasswordForm()
    return render(request, 'club/coach_login.html', {'form': form})


def coach_logout(request):
    request.session.pop('coach_authenticated', None)
    logout(request)
    return redirect('home')


def is_coach_authenticated(request):
    return request.session.get('coach_authenticated') is True


@require_http_methods(['GET', 'POST'])
def coach_dashboard(request):
    if not is_coach_authenticated(request):
        return redirect('coach_login')

    club = get_club()

    club_form = ClubProfileForm(instance=club)
    player_form = PlayerForm()
    upcoming_form = UpcomingFixtureForm()
    result_form = ResultFixtureForm()
    gallery_form = GalleryImageForm()

    if request.method == 'POST':
        target = request.POST.get('target')
        if target == 'club':
            club_form = ClubProfileForm(request.POST, instance=club)
            if club_form.is_valid():
                club_form.save()
                messages.success(request, 'Club information updated.')
                return redirect('coach_dashboard')
        elif target == 'player':
            player_form = PlayerForm(request.POST, request.FILES)
            if player_form.is_valid():
                player_form.save()
                messages.success(request, 'Player added successfully.')
                return redirect('coach_dashboard')
        elif target == 'upcoming':
            upcoming_form = UpcomingFixtureForm(request.POST)
            if upcoming_form.is_valid():
                upcoming_form.save()
                messages.success(request, 'Upcoming match added successfully.')
                return redirect('coach_dashboard')
        elif target == 'result':
            result_form = ResultFixtureForm(request.POST)
            if result_form.is_valid():
                result_form.save()
                messages.success(request, 'Match result added successfully.')
                return redirect('coach_dashboard')
        elif target == 'gallery':
            gallery_form = GalleryImageForm(request.POST, request.FILES)
            if gallery_form.is_valid():
                gallery_form.save()
                messages.success(request, 'Gallery image added successfully.')
                return redirect('coach_dashboard')

    context = {
        'club': club,
        'club_form': club_form,
        'player_form': player_form,
        'upcoming_form': upcoming_form,
        'result_form': result_form,
        'gallery_form': gallery_form,
        'players': Player.objects.order_by('number', 'name'),
        'fixtures': Fixture.objects.order_by('date', 'time'),
        'gallery': GalleryImage.objects.order_by('-created_at', '-id'),
    }
    return render(request, 'club/coach_dashboard.html', context)
