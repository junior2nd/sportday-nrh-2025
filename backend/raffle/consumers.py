import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from accounts.models import User


class RaffleConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for raffle realtime updates"""
    
    async def connect(self):
        self.raffle_id = self.scope['url_route']['kwargs']['raffle_id']
        self.room_group_name = f'raffle_{self.raffle_id}'
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
    
    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_type = text_data_json.get('type')
        
        if message_type == 'ping':
            await self.send(text_data=json.dumps({
                'type': 'pong'
            }))
    
    # Receive message from room group
    async def raffle_result(self, event):
        """Send raffle result to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'raffle_result',
            'prize_id': event['prize_id'],
            'winners': event['winners'],
            'seed': event['seed']
        }))
    
    async def raffle_update(self, event):
        """Send general raffle update to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'raffle_update',
            'data': event['data']
        }))

