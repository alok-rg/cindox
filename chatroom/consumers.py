import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.utils import timezone
import redis.asyncio as redis

# Redis-based online user tracking
REDIS_URL = 'redis://127.0.0.1:6379/0'
ONLINE_USERS_KEY = 'online_users'

"""
self.scope (in connect method) (type: dict) -> purpose: Holds metadata about the current connection, similar to request in standard Django views.

@database_sync_to_async -> purpose: Decorator to run database operations in a thread-safe manner, allowing async code to interact with Django ORM.
"""


# Notification consumer for handling notifications and online status
class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        self.user_id = str(getattr(self.user, 'id', None) or getattr(self.user, 'username', 'anonymous'))
        if self.user.is_anonymous:
            await self.close()
            return
        self.group_name = f"notifications_{self.user_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.add_online_user(self.user_id)
        await self.accept()
        await self.send_online_contacts()
        await self.notify_contacts_online_status(True)

    async def disconnect(self, close_code):
        await self.remove_online_user(self.user_id)
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
        await self.notify_contacts_online_status(False)

    async def receive(self, text_data):
        data = json.loads(text_data)
        if data.get("type") == "mark_read":
            await self.mark_messages_read(data.get("contact_id"))

    # Redis connection
    @staticmethod
    async def get_redis():
        return await redis.from_url(REDIS_URL, decode_responses=True)

    # Send online contacts to the user
    async def send_online_contacts(self):
        contacts = await self.get_contacts()
        online_contacts = []
        for contact_id in contacts:
            if await self.is_user_online(contact_id):
                online_contacts.append(contact_id)
        await self.send(text_data=json.dumps({
            "type": "online_contacts",
            "user_ids": online_contacts
        }))

    # Add user to online users list
    @classmethod
    async def add_online_user(cls, user_id):
        redis = await cls.get_redis()
        await redis.sadd(ONLINE_USERS_KEY, user_id)
        await redis.close()

    # Remove user from online users list
    @classmethod
    async def remove_online_user(cls, user_id):
        redis = await cls.get_redis()
        await redis.srem(ONLINE_USERS_KEY, user_id)
        await redis.close()

    # Check if a user is online
    @classmethod
    async def is_user_online(cls, user_id):
        redis = await cls.get_redis()
        is_online = await redis.sismember(ONLINE_USERS_KEY, user_id)
        await redis.close()
        return is_online

    # Get list of online contacts
    @database_sync_to_async
    def get_contacts(self):
        from .models import Contact
        return [str(c.contact_user.id) for c in Contact.objects.filter(user=self.user)]

    # Mark messages as read for a specific contact
    @database_sync_to_async
    def mark_messages_read(self, contact_id):
        from .models import Message
        return Message.objects.filter(sender_id=contact_id, receiver_id=self.user.id, is_read=False).update(is_read=True)

    # Send notification to the user
    async def send_notification(self, event):
        await self.send(text_data=json.dumps(event["data"]))

    # Send online status to contacts
    async def send_online_status(self, event):
        await self.send(text_data=json.dumps(event["data"]))

    # Notify contacts about the user's online status
    async def notify_contacts_online_status(self, is_online):
        contacts = await self.get_contacts()
        for contact_id in contacts:
            group = f"notifications_{contact_id}"
            await self.channel_layer.group_send(
                group,
                {
                    "type": "send_online_status",   # This will call the send_online_status method
                    "data": {
                        "type": "online_status",
                        "user_id": self.user_id,
                        "is_online": is_online,
                    },
                },
            )

    # Notify unread message count to the receiver
    @staticmethod
    async def notify_unread_message(receiver_id, sender_id, unread_count):
        from channels.layers import get_channel_layer
        channel_layer = get_channel_layer()
        group = f"notifications_{receiver_id}"
        await channel_layer.group_send(
            group,
            {
                "type": "send_notification",   # This will call the send_notification method
                "data": {
                    "type": "unread_message",
                    "from_user": sender_id,
                    "unread_count": unread_count,
                },
            },
        )


# Chat consumer for handling chat messages
class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        self.user_id = str(getattr(self.user, 'id', None) or getattr(self.user, 'username', 'anonymous'))
        self.contact_id = self.scope['url_route']['kwargs']['contact_id']
        if self.user.is_anonymous:
            await self.close()
            return
        ids = sorted([self.user_id, self.contact_id])
        self.room_group_name = f"chat_{ids[0]}_{ids[1]}"
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        session_name = data.get('sessionName')
        message = data.get('message')
        nonce = data.get('nonce')
        sender_id = self.user_id
        receiver_id = self.contact_id
        saved_message = await self.save_message(sender_id, receiver_id, message, nonce, session_name)
        local_time = timezone.localtime(saved_message.timestamp)
        formatted_timestamp = local_time.strftime('%I:%M %p')
        
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',  # This will call the chat_message method
                'message': message,
                'sender_id': sender_id,
                'nonce': nonce,
                'session_name': session_name,
                'timestamp': formatted_timestamp
            }
        )
        unread_count = await self.get_unread_count(sender_id, receiver_id)
        await NotificationConsumer.notify_unread_message(receiver_id, sender_id, unread_count)

    # Get unread message count for a specific sender and receiver
    @database_sync_to_async
    def get_unread_count(self, sender_id, receiver_id):
        from .models import Message
        return Message.objects.filter(sender_id=sender_id, receiver_id=receiver_id, is_read=False).count()

    # Send chat message to the group
    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': event['message'],
            'sender_id': event['sender_id'],
            'nonce': event.get('nonce'),
            'session_name': event.get('session_name'),
            'timestamp': event.get('timestamp')
        }))

    # Save message to the database
    @database_sync_to_async
    def save_message(self, sender_id, receiver_id, message, nonce, session_name):
        from django.contrib.auth import get_user_model
        from .models import Message, Session
        User = get_user_model()
        sender = User.objects.get(id=sender_id)
        receiver = User.objects.get(id=receiver_id)
        session = Session.objects.get(session_id=session_name)
        message_obj = Message.objects.create(sender=sender, receiver=receiver, content=message, nonce=nonce, session=session)
        return message_obj