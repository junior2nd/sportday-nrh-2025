from django.urls import re_path
from channels.routing import URLRouter

# Import consumers
from raffle.consumers import RaffleConsumer
from sports.consumers import SportsConsumer

websocket_urlpatterns = [
    re_path(r'ws/raffle/(?P<raffle_id>\w+)/$', RaffleConsumer.as_asgi()),
    re_path(r'ws/sports/(?P<tournament_id>\w+)/$', SportsConsumer.as_asgi()),
]

