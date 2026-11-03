from django import forms

from .models import ClubProfile, Fixture, GalleryImage, Player


class CoachPasswordForm(forms.Form):
    password = forms.CharField(
        widget=forms.PasswordInput(attrs={'placeholder': 'Enter coach password'}),
        label='Coach password',
    )


class ClubProfileForm(forms.ModelForm):
    class Meta:
        model = ClubProfile
        fields = ['name', 'about', 'training', 'pitch', 'contact']
        widgets = {
            'about': forms.Textarea(attrs={'rows': 4}),
            'training': forms.Textarea(attrs={'rows': 3}),
            'pitch': forms.Textarea(attrs={'rows': 3}),
            'contact': forms.Textarea(attrs={'rows': 3}),
        }


class PlayerForm(forms.ModelForm):
    class Meta:
        model = Player
        fields = ['name', 'number', 'position', 'goals', 'assists', 'photo']
        widgets = {
            'name': forms.TextInput(attrs={'placeholder': 'Full name'}),
        }


class FixtureForm(forms.ModelForm):
    class Meta:
        model = Fixture
        fields = ['opponent', 'date', 'time', 'venue', 'home', 'us', 'them']
        widgets = {
            'date': forms.DateInput(attrs={'type': 'date'}),
            'time': forms.TimeInput(attrs={'type': 'time'}),
            'venue': forms.TextInput(attrs={'placeholder': 'Venue'}),
            'opponent': forms.TextInput(attrs={'placeholder': 'Opponent'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['us'].required = False
        self.fields['them'].required = False
        self.fields['time'].required = False
        self.fields['venue'].required = False
        self.fields['home'].help_text = 'Leave score blank if this is an upcoming match.'


class UpcomingFixtureForm(forms.ModelForm):
    class Meta:
        model = Fixture
        fields = ['opponent', 'date', 'time', 'venue', 'home']
        widgets = {
            'date': forms.DateInput(attrs={'type': 'date'}),
            'time': forms.TimeInput(attrs={'type': 'time'}),
            'venue': forms.TextInput(attrs={'placeholder': 'Venue'}),
            'opponent': forms.TextInput(attrs={'placeholder': 'Opponent'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['time'].required = False


class ResultFixtureForm(forms.ModelForm):
    class Meta:
        model = Fixture
        fields = ['opponent', 'date', 'venue', 'home', 'us', 'them']
        widgets = {
            'date': forms.DateInput(attrs={'type': 'date'}),
            'venue': forms.TextInput(attrs={'placeholder': 'Venue'}),
            'opponent': forms.TextInput(attrs={'placeholder': 'Opponent'}),
        }


class GalleryImageForm(forms.ModelForm):
    class Meta:
        model = GalleryImage
        fields = ['title', 'caption', 'image']
        widgets = {
            'title': forms.TextInput(attrs={'placeholder': 'Match or training title'}),
            'caption': forms.Textarea(attrs={'rows': 3}),
        }
