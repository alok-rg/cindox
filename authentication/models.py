from django.db import models
from django.contrib.auth.models import User

# Define the Profile model to extend the User model with additional fields
class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    mobile = models.CharField(max_length=10)
    profile_picture = models.ImageField(upload_to='profile_pics/')
    public_key = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username}'s Profile"