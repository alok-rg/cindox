# Cindox - Secure Real-Time Chat Application
<br>

<div align="center">
  <img src="static/img/logo.png" alt="Cindox Logo" width="80" height="80" style="border-radius: 10px; box-shadow: 0 0 10px 1px #4df9f9ff;">
    <br>
    <br>

  ![Django](https://img.shields.io/badge/Django-5.2.4-092E20?style=for-the-badge&logo=django&logoColor=white)
  ![Python](https://img.shields.io/badge/Python-3.13-3776AB?style=for-the-badge&logo=python&logoColor=white)
  ![WebSocket](https://img.shields.io/badge/WebSocket-Real--Time-FF6B6B?style=for-the-badge)
  ![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
  ![WebAssembly](https://img.shields.io/badge/WebAssembly-654FF0?style=for-the-badge&logo=webassembly&logoColor=white)
</div>


## 🪄 Table of Contents
1. [Introduction](#-introduction)
2. [Features](#-features)
3. [Directory Structure](#-directory-structure)
4. [Technology Stack](#-technology-stack)
5. [Prerequisites](#-prerequisites)
6. [Installation & Setup](#-installation--setup)
7. [Usage Guide](#-usage-guide)
8. [Endpoints](#-endpoints)
9. [Configuration](#-configuration)
10. [Database Schema](#-database-schema)
11. [Deployment](#-deployment)
12. [Troubleshooting](#-troubleshooting)
13. [Contributing](#-contributing)
14. [License](#-license)
15. [Acknowledgments](#-acknowledgments)
16. [Support](#-support)


## 🌟 Introduction
Cindox is a modern, secure, and feature-rich real-time chat application built with Django Channels. It leverages cutting-edge technologies such as WebSockets, Redis, and WebAssembly to provide a seamless messaging experience.

It focuses on security with end-to-end encryption, ensuring that user data remains private and secure. The application features a sleek dark theme with glassmorphism effects, providing an intuitive user experience.

### How it is secure:
- **End-to-End Encryption**: Messages are encrypted using AES-256 with unique session keys for each user.
- **RSA Key Exchange**: Secure key exchange protocol for establishing encrypted sessions.
- **WebAssembly Cryptography**: High-performance cryptographic operations using WASM modules. Also they are hard to reverse engineer or modify.
- **Client-Side Encryption**: All messages are encrypted before transmission, ensuring that only the intended recipients can read them not even the server or intermediaries.
- **Nonce Usage**: Nonces are used to ensure message integrity and prevent replay attacks.
- **Secure User Authentication**: Django's built-in authentication with password validation.
- **CSRF Protection**: Django's built-in CSRF protection to prevent cross-site request forgery attacks.
- **Object-Relational Mapping**: Prevents SQL injection attacks by using Django's ORM for database interactions.
- **Session Management**: Secure session handling with Django's session framework.
- **On-unload Event Handling**: Clean-up of sensitive data on page unload to prevent data leakage.



## 🌟 Features

### 🔐 Security & Encryption (Discussed in Introduction)

### 💬 Real-Time Communication
- **WebSocket Integration**: Real-time messaging using Django Channels
- **Live Online Status**: Track which contacts are currently online
- **Instant Notifications**: Real-time message notifications and unread counts
- **Contact Management**: Friend request system with accept/reject functionality
- **Message History**: Persistent chat history with encryption

### 🎨 Modern User Interface
- **Dark Theme**: Modern dark theme with glassmorphism effects
- **Intuitive UX**: Clean and professional user interface
- **Profile Pictures**: User avatars and profile customization
- **Real-time Updates**: Dynamic UI updates without page refresh
- **Responsive Design**: Mobile-first responsive layout (might be 🥲)

### 🚀 Performance & Scalability
- **Redis Integration**: High-performance message queuing and caching
- **Async WebSocket Consumers**: Efficient handling of concurrent connections
- **Static File Optimization**: WhiteNoise for production-ready static file serving
- **Database Optimization**: Its is already optimized by Object-Relational Mapping



## 🏗️ Directory Structure
```
virtual/                               # Virtual environment for dependencies
Cindox/                                # Project root directory
├── authentication/                    # User authentication & profiles
│   ├── templates/                     # Authentication HTML templates
│   │   ├── login.html                 # User login page
│   │   └── register.html              # User registration page
│   ├── __init__.py                    # Python package initialization
│   ├── admin.py                       # Django admin configuration
│   ├── apps.py                        # Django app configuration
│   ├── models.py                      # User Profile model with encryption keys
│   ├── urls.py                        # Authentication URL routing
│   └── views.py                       # Login, Register, Logout views
├── chatroom/                          # Real-time chat functionality
│   ├── templates/                     # Chat HTML templates
│   │   └── chats.html                 # Main chat interface
│   ├── __init__.py                    # Python package initialization
│   ├── admin.py                       # Django admin configuration
│   ├── apps.py                        # Django app configuration
│   ├── consumers.py                   # WebSocket consumers for real-time messaging
│   ├── models.py                      # Message, Session, Contact models
│   ├── routing.py                     # WebSocket URL routing
│   ├── urls.py                        # Chat URL routing
│   └── views.py                       # Chat views and API endpoints
├── profile_pics/                      # User profile picture uploads
├── static/                            # Static files (CSS, JS, images)
│   ├── admin/                         # Django admin static files
│   ├── authentication/                # Authentication static assets
│   │   ├── css/                       # Authentication stylesheets
│   │   │   └── auth.css               # Authentication page styles
│   │   ├── js/                        # Authentication JavaScript
│   │   │   ├── auth.js                # Authentication logic
│   │   │   └── wasm_register.js       # Registration WASM integration
│   │   └── wasm/                      # WebAssembly crypto modules
│   ├── chatroom/                      # Chat interface static assets
│   │   ├── css/                       # Chat stylesheets
│   │   │   └── chats.css              # Chat interface styles
│   │   ├── js/                        # Chat JavaScript modules
│   │   │   ├── chat_crypto_module.js  # Encryption/decryption functions
│   │   │   ├── chats.js               # Main chat functionality
│   │   │   ├── notifications.js       # Real-time notifications
│   │   │   └── wasm_d.js              # WASM integration
│   │   └── wasm/                      # Chat WebAssembly modules
│   └── img/                           # Static images and icons
├── zcore/                             # Django project configuration
│   ├── __init__.py                    # Python package initialization
│   ├── asgi.py                        # ASGI configuration for WebSocket support
│   ├── settings.py                    # Django settings with Channels configuration
│   ├── urls.py                        # Main URL routing
│   └── wsgi.py                        # WSGI configuration for deployment
├── db.sqlite3                         # SQLite database file
├── manage.py                          # Django management script
└── README.md                          # Project documentation
```



## 🛠️ Technology Stack

### Backend Technologies
- **Python 3.13**: Latest Python with enhanced performance
- **Django 5.2.4**: Web framework for rapid development
- **SQLite**: Lightweight database for development (Easy to Change 😎)
- **Django Channels**: WebSocket support for real-time features
- **Daphne**: ASGI server for handling WebSocket connections
- **Redis**: In-memory data structure store for real-time features
- **Whitenoise**: Static file serving for production
- **Pillow**: Image processing for profile pictures

### Frontend Technologies
- **HTML5 & CSS3**: Modern web standards
- **JavaScript**: Modern JavaScript features
- **AJAX (Asynchronous JavaScript and XML)**: For dynamic, background data exchange between client and server
- **WebAssembly (WASM)**: High-performance cryptographic operations
- **WebSocket API**: Real-time bidirectional communication
- **Font Awesome**: Icon library for UI elements

### Security Technologies
- **RSA Encryption**: Asymmetric encryption for key exchange
- **AES-256**: Symmetric encryption for message content
- **WebAssembly Crypto**: High-performance cryptographic operations
- **CSRF Protection**: Django's built-in CSRF protection
- **Session Management**: Secure session handling



## 📋 Prerequisites
- Python 3.11 or higher ([download](https://www.python.org/downloads/))
- Redis server ([installer](https://github.com/tporadowski/redis/releases/download/v5.0.14.1/Redis-x64-5.0.14.1.msi))
- Modern web browser with WebAssembly support (e.g., Chrome, Firefox, Edge, Brave)
- Git (for cloning the repository)



## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd cindox
```

### 2. Create Virtual Environment
```bash
# Windows
python -m venv virtual
virtual\Scripts\activate

# macOS/Linux
python3 -m venv virtual
source virtual/bin/activate
```

### 3. Install Dependencies
```bash
pip install django==5.2.4
pip install channels
pip install channels-redis
pip install redis
pip install whitenoise
pip install pillow
pip install daphne
```

### 4. Start Redis Server
```bash
# Windows (if Redis is installed)
redis-server

# macOS (using Homebrew)
brew services start redis

# Linux (using systemd)
sudo systemctl start redis
```
```bash
# Verify Redis is running
redis-cli ping

# Should return "PONG"
```

### 5. Database Setup
```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser  # Optional: Create admin user
```


### 6. Run the Development Server
```bash
daphne -p 8000 zcore.asgi:application
```

Visit http://127.0.0.1:8000 to access the application.



## 📱 Usage Guide

### Getting Started
1. **Register Account**: Create a new account with username, email, and profile picture
2. **Login**: Sign in with your credentials
3. **Add Contacts**: Send friend requests to other users by username
4. **Start Chatting**: Accept friend requests and begin secure conversations

### Key Features
- **Send Messages**: Type and send encrypted messages in real-time
- **Online Status**: See which contacts are currently online (green indicator)
- **Notifications**: Receive real-time notifications for new messages
- **Unread Count**: Track unread messages with notification badges
- **Profile Management**: View and manage your profile information



## 📝 Endpoints

### Django Admin Interface
- `admin/` - Django admin interface (requires superuser)

### Authentication Endpoints
- `/auth/login/` - User login
- `/auth/register/` - User registration
- `/auth/logout/` - User logout

### Chat Endpoints
- `/` - Main chat interface
- `/send_friend_request/` - Send friend request
- `/accept_friend_request/` - Accept friend request
- `/reject_friend_request/` - Reject friend request
- `/get_messages/` - Retrieve chat messages
- `/get_public_keys/` - Get user public keys
- `/get_session_id/` - Get chat session ID

### WebSocket Endpoints
- `ws/notifications/` - Real-time notifications
- `ws/chat/<contact_id>/` - Real-time chat messages



## 🔧 Configuration

### Redis Configuration
The application uses Redis for real-time features. Configure in `settings.py`:
```python
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [('127.0.0.1', 6379)],
        },
    },
}
```

### SQL Configuration
Database settings need to be configured in `settings.py` in production:
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'your_database_name',
        'USER': 'your_database_user',
        'PASSWORD': 'your_database_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```
<p style="color: #239ad1ff">Note: SQLite is used by default for development. Change to PostgreSQL or another database for production.</p>

### Static Files
Static files are handled by WhiteNoise for production deployment:
```python
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
```

### Security Settings
Key security configurations in `settings.py`:
- `SECRET_KEY`: Django secret key (change in production)
- `DEBUG`: Set to `False` in production
- `ALLOWED_HOSTS`: Configure allowed hosts for production
- Password validators for strong password requirements




## 🏗️ Database Schema

#### User Profile
- Extended Django User model
- Mobile number field
- Profile picture upload
- Public key for encryption
- Timestamps for creation and updates

#### Chat Session
- Unique session identifier
- Sender and receiver references
- Encrypted AES keys for both parties
- Session creation timestamp

#### Messages
- Session reference for organization
- Sender and receiver identification
- Encrypted message content
- Nonce for encryption
- Read status tracking
- Message timestamp

#### Contacts & Friend Requests
- Contact relationship management
- Friend request workflow
- User relationship tracking


## 🚀 Deployment

### Production Checklist
- [ ] Set `DEBUG = False`
- [ ] Configure `ALLOWED_HOSTS`
- [ ] Set up production database (PostgreSQL recommended)
- [ ] Configure Redis for production
- [ ] Set up SSL/HTTPS
- [ ] Configure static file serving (WhiteNoise, Nginx, etc.)
- [ ] Set environment variables for sensitive data

### Environment Variables
```bash
DJANGO_SECRET_KEY=your-secret-key
DJANGO_DEBUG=False
DATABASE_URL=your-database-url
REDIS_URL=your-redis-url
```

## Future Enhancements
- **Enhanced Security**: Implement two-factor authentication (2FA)
- **Mobile App**: Develop a mobile app for iOS and Android
- **Group Chats**: Implement group chat functionality
- **File Sharing**: Allow users to share files securely
- **Message Reactions**: Add support for message reactions (like, love, etc.)
- **Search Functionality**: Implement search for messages and contacts
- **User Blocking**: Allow users to block contacts
- **Message Editing/Deletion**: Allow users to edit or delete sent messages
- **Multi-language Support**: Add support for multiple languages
- **Analytics Dashboard**: Provide insights into user activity and engagement
- **Many more features similar to other chat applications 🥲**


## 🐛 Troubleshooting

**Redis Connection Error**
- Ensure Redis server is running
- Check Redis configuration in settings
- Verify Redis port (default: 6379)

**WebSocket Connection Failed**
- Check ASGI configuration
- Verify WebSocket URL routing
- Ensure channels is properly installed

**Static Files Not Loading**
- Run `python manage.py collectstatic`
- Check STATIC_URL and STATIC_ROOT settings
- Verify WhiteNoise configuration

**Encryption Errors**
- Ensure WebAssembly modules are loaded
- Check browser WebAssembly support
- Verify cryptographic key generation



## 🤝 Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request



## 📄 License
- This project is part of a Final Year Project and is intended for educational purposes.



## 🙏 Acknowledgments
- Django and Django Channels communities
- WebAssembly cryptography implementations
- Redis for real-time data management
- Font Awesome for UI icons
- AI for code assistance (frontend 🥲)



## 📞 Support
### For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the Django Channels documentation

---

<div align="center">
  <br>
  <strong>Built with ❤️ using Django, WebSockets, and WebAssembly</strong>
</div>
