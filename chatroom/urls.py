from django.urls import include, path
from . import views

urlpatterns = [
    path('', views.chats, name='chats'),
    path('send_friend_request/', views.send_friend_request, name='send_friend_request'),
    path('accept_friend_request/', views.accept_friend_request, name='accept_friend_request'),
    path('reject_friend_request/', views.reject_friend_request, name='reject_friend_request'),
    path('get_messages/', views.get_messages, name='get_messages'),
    path('get_public_keys/', views.get_public_keys, name='get_public_keys'),
    path('get_session_id/', views.get_session_id, name='get_session_id'),
]