import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from accounts.models import User

logger = logging.getLogger(__name__)


class RaffleConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for raffle realtime updates"""
    
    async def connect(self):
        try:
            self.raffle_id = self.scope['url_route']['kwargs']['raffle_id']
            self.room_group_name = f'raffle_{self.raffle_id}'
            
            logger.info(f"WebSocket connecting: raffle_id={self.raffle_id}, room={self.room_group_name}")
            
            # Accept connection first
            await self.accept()
            logger.info(f"WebSocket accepted: raffle_id={self.raffle_id}")
            
            # Join room group
            if self.channel_layer:
                await self.channel_layer.group_add(
                    self.room_group_name,
                    self.channel_name
                )
                logger.info(f"Joined room group: {self.room_group_name}")
            else:
                logger.warning("Channel layer is None!")
        except Exception as e:
            logger.error(f"Error in WebSocket connect: {e}", exc_info=True)
            # Don't accept if there's an error
            raise
    
    async def disconnect(self, close_code):
        try:
            logger.info(f"WebSocket disconnecting: raffle_id={self.raffle_id}, close_code={close_code}")
            # Leave room group
            if self.channel_layer:
                await self.channel_layer.group_discard(
                    self.room_group_name,
                    self.channel_name
                )
                logger.info(f"Left room group: {self.room_group_name}")
        except Exception as e:
            logger.error(f"Error in WebSocket disconnect: {e}", exc_info=True)
    
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
    
    async def winners_update(self, event):
        """Send winners update to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'winners_update',
            'raffle_event_id': event.get('raffle_event_id'),
            'winners': event.get('winners', []),
            'timestamp': event.get('timestamp')
        }))
    
    async def control_action(self, event):
        """Send control action to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'control_action',
            'action': event.get('action'),  # spin, save, select_prize, set_display_count
            'data': event.get('data', {}),
            'timestamp': event.get('timestamp')
        }))

