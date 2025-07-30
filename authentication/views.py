from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib import messages
from .models import Profile


# Display login page and handle login submission
def login_view(request):
    if request.user.is_authenticated:
        return redirect('chats')
    
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        # remember_me = request.POST.get('remember_me')
        
        if username and password:
            user = authenticate(request, username=username, password=password)
            if user is not None:
                login(request, user)
                request.session.set_expiry(0)
                # # Set session expiry based on remember me
                # if not remember_me:
                #     request.session.set_expiry(0)  # Browser session
                # else:
                #     request.session.set_expiry(1209600)  # 2 weeks
                
                return redirect('chats')
            else:
                messages.error(request, 'Invalid username or password')
        else:
            messages.error(request, 'Please fill in all fields')
    
    return render(request, 'login.html')


# Display register page and handle registration submission
def register_view(request):
    if request.user.is_authenticated:
        return redirect('chats')
    
    if request.method == 'POST':
        email = request.POST.get('email')
        username = request.POST.get('username')
        name = request.POST.get('name')
        mobile = request.POST.get('mobile')
        password = request.POST.get('password')
        confirm_password = request.POST.get('confirm_password')
        agree_terms = request.POST.get('agree_terms')
        profile_picture = request.FILES.get('profile_picture')
        public_key = request.POST.get('public_key')

        errors = []
        
        if not all([email, username, mobile, password, confirm_password]):
            errors.append('All fields are required')

        if password != confirm_password:
            errors.append('Passwords do not match')
        
        if len(password) < 8:
            errors.append('Password must be at least 8 characters')
        
        if len(mobile) != 10 or not mobile.isdigit():
            errors.append('Mobile number must be 10 digits')
        
        if not agree_terms:
            errors.append('You must agree to terms and conditions')
        
        # Check if username or email already exists
        if User.objects.filter(username=username).exists():
            errors.append('Username already exists')
        
        # Check if email already exists
        if User.objects.filter(email=email).exists():
            errors.append('Email already exists')
        
        if errors:
            for error in errors:
                messages.error(request, error)
        else:
            try:
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=password,
                    first_name=name
                )
                profile = Profile.objects.create(
                    user=user,
                    mobile=mobile,
                    profile_picture=profile_picture,
                    public_key=public_key
                )
                messages.success(request, 'Account created successfully! Please log in.')
                return redirect('login')
                
            except Exception as e:
                messages.error(request, f'An error occurred while creating your account: {str(e)}')
    
    return render(request, 'register.html')


# Handle user logout
def logout_view(request):
    logout(request)
    messages.success(request, 'You have been logged out successfully')
    return redirect('login')
