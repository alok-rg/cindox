from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
import json
from django.contrib.auth.models import User
from django.db.models import Q
from django.utils import timezone
from .models import FriendRequest, Contact, Message, Session


# Chatroom views
@login_required(login_url='/auth/login/')
def chats(request):
    friend_requests = FriendRequest.objects.filter(receiver=request.user)
    contact_list = Contact.objects.filter(user=request.user)
    for contact in contact_list:
        contact.unread_count = Message.objects.filter(
            sender=contact.contact_user, 
            receiver=request.user, 
            is_read=False
        ).count()
    return render(
        request, 'chats.html', 
        {
            'user': request.user, 
            'friend_requests': friend_requests,
            'contacts': contact_list,
        }
    )


# Send friend request
@login_required(login_url='/auth/login/')
def send_friend_request(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        username = data.get('username')
        try:
            user = User.objects.get(username=username)
            if user == request.user:
                return JsonResponse({'success': False, 'error': 'You cannot send a request to yourself.'})
            already_contact = Contact.objects.filter(user=request.user, contact_user=user).exists()
            if already_contact:
                return JsonResponse({'success': False, 'error': 'This user is already in your contacts.'})
            already_sent = FriendRequest.objects.filter(sender=request.user, receiver=user).exists()
            already_received = FriendRequest.objects.filter(sender=user, receiver=request.user).exists()
            if already_sent:
                return JsonResponse({'success': False, 'error': 'Friend request already sent.'})
            if already_received:
                return JsonResponse({'success': False, 'error': 'You have a pending request from this user.'})
            friend_request = FriendRequest(sender=request.user, receiver=user)
            friend_request.save()
            return JsonResponse({'success': True, 'message': 'Friend request sent!'})
        except User.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'User not found.'})
    return JsonResponse({'success': False, 'error': 'Invalid request.'})


# Accept friend request
@login_required(login_url='/auth/login/')
def accept_friend_request(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        username = data.get('username')
        nonce_b64 = data.get('nonce')
        aes_key_encrypted_sender = data.get('aes_key_encrypted_sender')
        aes_key_encrypted_receiver = data.get('aes_key_encrypted_receiver')
        welcome_message_encrypted = data.get('encrypted_welcome_message')
        try:
            user = User.objects.get(username=username)
            contact = Contact(user=request.user, contact_user=user)
            contact.save()
            contact_reverse = Contact(user=user, contact_user=request.user)
            contact_reverse.save()
            FriendRequest.objects.filter(sender=user, receiver=request.user).delete()

            sender = request.user
            receiver = user
            session_id = f"{sender.username}_{receiver.username}"
            session = Session.objects.create(
                session_id=session_id,
                sender=sender,
                receiver=receiver,
                aes_key_encrypted_sender=aes_key_encrypted_sender,
                aes_key_encrypted_receiver=aes_key_encrypted_receiver
            )
            Message.objects.create(
                session=session,
                sender=sender,
                receiver=receiver,
                content=welcome_message_encrypted,
                nonce=nonce_b64,
            )
            return JsonResponse({'success': True, 'message': 'Friend request accepted!'})
        except User.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'User not found.'})
    return JsonResponse({'success': False, 'error': 'Invalid request.'})


# Reject friend request
@login_required(login_url='/auth/login/')
def reject_friend_request(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        username = data.get('username')
        try:
            request_user = FriendRequest.objects.get(username=username)
            request_user.delete()
            return JsonResponse({'success': True, 'message': 'Friend request rejected!'})
        except FriendRequest.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Friend request not found.'})


# Get messages between two users
@login_required(login_url='/auth/login/')
def get_messages(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        username = data.get('username')
        try:
            contact = User.objects.get(username=username)
            messages = Message.objects.filter(
                Q(sender=request.user, receiver=contact) |
                Q(sender=contact, receiver=request.user)
            ).order_by('timestamp')
            messages_data = [
                {
                    'sender': msg.sender.username,
                    'receiver': msg.receiver.username,
                    'content': msg.content,
                    'nonce': msg.nonce,
                    'timestamp': timezone.localtime(msg.timestamp).strftime('%I:%M %p'),
                    'is_sent': msg.sender == request.user
                }
                for msg in messages
            ]
            if not messages_data:
                return JsonResponse({'success': False, 'error': 'No messages found.'})
            return JsonResponse({'success': True, 'messages': messages_data})
        except User.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Contact not found.'})
    return JsonResponse({'success': False, 'error': 'Invalid request.'})


# Get public keys for encryption
@login_required(login_url='/auth/login/')
def get_public_keys(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        username = data.get('username')
        try:
            user = User.objects.get(username=username)
            print(f"Public key for {user.username}: {user.profile.public_key}")
            print(f"Public key for {request.user.username}: {request.user.profile.public_key}")
            return JsonResponse({
                'success': True,
                'public_key_sender': request.user.profile.public_key,
                'public_key_receiver': user.profile.public_key
            })
        except User.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'User not found.'})
    return JsonResponse({'success': False, 'error': 'Invalid request.'})


# Get session ID for a chat
@login_required(login_url='/auth/login/')
def get_session_id(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        sender = data.get('sender')
        receiver = data.get('receiver')
        if not sender or not receiver:
            return JsonResponse({'success': False, 'error': 'Missing sender or receiver.'})
        
        session_id = f"{sender}_{receiver}"
        reverse_session_id = f"{receiver}_{sender}"
        session_exists = Session.objects.filter(
            Q(session_id=session_id) | Q(session_id=reverse_session_id)
        ).exists()

        if session_exists:
            session = Session.objects.filter(Q(session_id=session_id) | Q(session_id=reverse_session_id)).first()
            if session.sender == request.user:
                aes_key = session.aes_key_encrypted_sender
                r = session.receiver
            else:
                aes_key = session.aes_key_encrypted_receiver
                r = session.sender
            return JsonResponse({
                'success': True,
                'session_id': session.session_id,
                'aes_key': aes_key,
                'uname': r.username
            })
    return JsonResponse({'success': False, 'error': 'Invalid request.'})


# Uncomment if you want to implement sending messages via AJAX POST request
# @login_required(login_url='/auth/login/')
# def send_message(request):
#     if request.method == 'POST':
#         data = json.loads(request.body)
#         username = data.get('username')
#         content = data.get('content')
#         if not username or not content:
#             return JsonResponse({'success': False, 'error': 'Missing username or message content.'})
#         try:
#             receiver = User.objects.get(username=username)
#             message = Message.objects.create(
#                 sender=request.user,
#                 receiver=receiver,
#                 content=content
#             )
#             return JsonResponse({
#                 'success': True,
#                 'message': {
#                     'sender': request.user.username,
#                     'receiver': receiver.username,
#                     'content': message.content,
#                     'timestamp': message.timestamp.strftime('%I:%M %p'),
#                     'is_sent': True
#                 }
#             })
#         except User.DoesNotExist:
#             return JsonResponse({'success': False, 'error': 'Receiver not found.'})
#     return JsonResponse({'success': False, 'error': 'Invalid request.'})