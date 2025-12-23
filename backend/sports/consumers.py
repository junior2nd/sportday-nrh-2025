import json
from channels.generic.websocket import AsyncWebsocketConsumer


class SportsConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for sports realtime updates"""
    
    async def connect(self):
        self.tournament_id = self.scope['url_route']['kwargs']['tournament_id']
        self.room_group_name = f'sports_{self.tournament_id}'
        
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
    async def match_update(self, event):
        """Send match update to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'match_update',
            'match_id': event['match_id'],
            'result': event['result']
        }))
    
    async def tournament_update(self, event):
        """Send tournament update to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'tournament_update',
            'data': event['data']
        }))

