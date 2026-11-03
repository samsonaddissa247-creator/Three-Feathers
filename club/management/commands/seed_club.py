from django.core.management.base import BaseCommand

from club.models import ClubProfile, Fixture, GalleryImage, Player


class Command(BaseCommand):
    help = 'Clear demo content and prepare the site for real club information.'

    def handle(self, *args, **options):
        ClubProfile.objects.all().delete()
        Player.objects.all().delete()
        Fixture.objects.all().delete()
        GalleryImage.objects.all().delete()

        club = ClubProfile.objects.create(
            name='Three Feathers Hockey Club',
            about='',
            training='',
            pitch='',
            contact='',
        )

        self.stdout.write(self.style.SUCCESS(f'Club data cleared and ready for the coach to add real information: {club.name}'))
