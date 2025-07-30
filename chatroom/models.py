
from django.db import models
from django.contrib.auth.models import User


# Session model for chat sessions
class Session(models.Model):
    session_id = models.CharField(max_length=128, unique=True)
    sender = models.ForeignKey(User, related_name='sessions_as_a', on_delete=models.CASCADE)
    receiver = models.ForeignKey(User, related_name='sessions_as_b', on_delete=models.CASCADE)
    aes_key_encrypted_sender = models.TextField()
    aes_key_encrypted_receiver = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Session {self.session_id}"


# Message model now references Session
class Message(models.Model):
    session = models.ForeignKey(Session, related_name='messages', on_delete=models.CASCADE)
    sender = models.ForeignKey(User, related_name='sent_messages', on_delete=models.CASCADE)
    receiver = models.ForeignKey(User, related_name='received_messages', on_delete=models.CASCADE)
    content = models.TextField()
    nonce = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    def __str__(self):
        return f"From {self.sender.username} to {self.receiver.username}"


class Contact(models.Model):
    user = models.ForeignKey(User, related_name='contacts', on_delete=models.CASCADE)
    contact_user = models.ForeignKey(User, related_name='contacted_by', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} to {self.contact_user.username}"


class FriendRequest(models.Model):
    sender = models.ForeignKey(User, related_name='friend_requests_sent', on_delete=models.CASCADE)
    receiver = models.ForeignKey(User, related_name='friend_requests_received', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Friend request from {self.sender.username} to {self.receiver.username}"