from django.contrib import admin
from .models import Message, Contact, FriendRequest, Session

# Register your models here.

admin.site.register(Message)
admin.site.register(Contact)
admin.site.register(FriendRequest)
admin.site.register(Session)
