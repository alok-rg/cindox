// Real-time chat WebSocket logic
let chatSocket = null;
let currentContactId = null;

// Helper function to format timestamp consistently
function formatTimestamp(date = new Date()) {
    return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
    });
}


// Handle Enter key for sending messages
document.getElementById('messageInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Utility : function to get the current user ID
function getCurrentUserId() {
    return document.getElementById('chat-root').getAttribute('data-user-id');
}

// Utility : function to get the current user
function getCurrentUser() {
    return document.getElementById('username').textContent.trim();
}

// Utility : function to get CSRF token from cookies
function getCSRFToken() {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, 10) === ('csrftoken=')) {
                cookieValue = decodeURIComponent(cookie.substring(10));
                break;
            }
        }
    }
    return cookieValue;
}

// Utility : function to get the decrypted private key from IndexedDB
async function getDecryptedKeyFromDB() {
    return new Promise((resolve, reject) => {
        const dbRequest = indexedDB.open("TempKeysDB", 1);
        dbRequest.onsuccess = function (event) {
            const db = event.target.result;
            const tx = db.transaction("tempKeys", "readonly");
            const store = tx.objectStore("tempKeys");
            const request = store.get("decryptedPrivateKey");
            request.onsuccess = function () {
                if (request.result) {
                    resolve(request.result); // This is your decrypted private key
                } else {
                    resolve(null);
                }
            };
            request.onerror = function () {
                reject(request.error);
            };
        };
        dbRequest.onerror = function () {
            reject(dbRequest.error);
        };
    });
}

// Utility : function to add messages to UI
function addMessageToUI(content, type, timestamp) {
    const messagesContainer = document.getElementById('messagesContainer');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ' + type;
    
    // Create structure safely to prevent XSS
    const messageBubble = document.createElement('div');
    messageBubble.className = 'message-bubble';
    
    // Use textContent to safely set message content
    const messageContent = document.createTextNode(content);
    messageBubble.appendChild(messageContent);
    
    const messageTime = document.createElement('div');
    messageTime.className = 'message-time';
    messageTime.textContent = timestamp || '';
    messageBubble.appendChild(messageTime);
    
    messageDiv.appendChild(messageBubble);
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Main : function to remove a request item from the UI
function removeRequestItem(username) {
    const items = document.querySelectorAll('.request-item');
    let removed = false;
    items.forEach(item => {
        const h5 = item.querySelector('.request-info h5');
        if (h5 && h5.textContent.trim() === username) {
            item.remove();
            removed = true;
        }
    });
    // If no more requests, show the "no requests" message
    if (removed) {
        const pendingList = document.querySelector('.pending-requests-list');
        if (pendingList && pendingList.querySelectorAll('.request-item').length === 0) {
            let noReqMsg = document.getElementById('noRequestsMessage');
            if (!noReqMsg) {
                noReqMsg = document.createElement('div');
                noReqMsg.className = 'no-requests';
                noReqMsg.id = 'noRequestsMessage';
                noReqMsg.innerHTML = '<p>No pending friend requests.</p>';
                pendingList.appendChild(noReqMsg);
            } else {
                noReqMsg.style.display = 'block';
            }
        }
    }
}

// Main : function to set session ID for the last message object
async function setSessionId(lastMessageObj) {
    let sessionName;
    const response = await fetch('/get_session_id/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify({
            sender: lastMessageObj.sender,
            receiver: lastMessageObj.receiver
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                sessionName = data.session_id;
                aes_key = data.aes_key;
                uname = data.uname;
                sessionStorage.setItem(uname, JSON.stringify({
                    aes_key: aes_key,
                    session_id: sessionName
                }));
            }
        });
}

// Main : function to decrypt messages for display
async function decryptMessageForDisplay(encryptedContent, nonce, username) {
    const sessionInfo = JSON.parse(sessionStorage.getItem(username));
    const aes_key_b64 = sessionInfo ? sessionInfo.aes_key : null;
    const pkObj = await getDecryptedKeyFromDB();
    const pk = pkObj ? pkObj.key : null;
    if (!pk) {
        console.error('Private key not found. Please login again.');
        return '<Decryption failed, Need to refresh :)>';
    }
    if (!aes_key_b64 || !nonce) return '<Decryption failed, Need to refresh :)>';

    try {
        const module = await import('/static/chatroom/js/chat_crypto_module.js');
        const d_aes_key_b64 = await module.decrypt_aes_key(aes_key_b64, pk);
        return await module.decrypt_message_fun(d_aes_key_b64, encryptedContent, nonce);
    } catch (e) {
        console.error('Decryption error:', e);
        return '<Decryption failed, Need to refresh :)>';
    }
}

// Main : function to fetch messages for selected contact
function fetchMessageForContact(username, setSessionId) {
    const messagesContainer = document.getElementById('messagesContainer');
    messagesContainer.innerHTML = '';  // Clear existing messages

    fetch('/get_messages/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify({ username: username })
    })
        .then(response => response.json())
        .then(async data => {
            if (data.success) {
                if (data.messages.length > 0) {
                    window.lastMessageObj = data.messages[data.messages.length - 1];
                    await setSessionId(window.lastMessageObj);
                }
                for (let i = 0; i < data.messages.length; i++) {
                    let decryptedContent = data.messages[i].content;
                    if (data.messages[i].nonce) {
                        decryptedContent = await decryptMessageForDisplay(data.messages[i].content, data.messages[i].nonce, username);
                    }
                    const msgDiv = document.createElement('div');
                    msgDiv.className = 'message ' + (data.messages[i].is_sent ? 'sent' : 'received');
                    
                    // Create structure safely to prevent XSS
                    const messageBubble = document.createElement('div');
                    messageBubble.className = 'message-bubble';
                    
                    // Use textContent to safely set message content
                    messageBubble.textContent = decryptedContent;
                    
                    const messageTime = document.createElement('div');
                    messageTime.className = 'message-time';
                    messageTime.textContent = data.messages[i].timestamp;
                    messageBubble.appendChild(messageTime);
                    
                    msgDiv.appendChild(messageBubble);
                    messagesContainer.appendChild(msgDiv);
                }
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            } else {
                messagesContainer.innerHTML = '<div class="no-messages">No messages found.</div>';
            }
        });
}

// Main : function to handle contact selection and update chat header
document.querySelectorAll('.contact-item').forEach(contact => {
    contact.addEventListener('click', function () {
        document.querySelectorAll('.contact-item').forEach(c => c.classList.remove('active'));
        this.classList.add('active');

        // Update chat header
        const chatHeaderAvatar = document.querySelector('.chat-header-avatar');
        const chatHeaderInfo = document.querySelector('.chat-header-info');
        const contactName = this.querySelector('.take-name').textContent;

        chatHeaderAvatar.src = this.querySelector('.contact-avatar').src;
        chatHeaderInfo.querySelector('h3').textContent = contactName;
        chatHeaderAvatar.style.display = 'block';
        chatHeaderInfo.style.display = 'block';

        // input message area for selected contact
        const messageInput = document.getElementById('messageInput');
        messageInput.name = this.querySelector('.take-username').textContent;

        // Notify notifications.js of the selected contact for real-time status
        const userId = this.getAttribute('data-user-id');
        document.dispatchEvent(new CustomEvent('contactSelected', { detail: { userId } }));

        // Open chat WebSocket for this contact
        openChatSocket(userId);

        // Clear unread badge immediately in UI for this contact
        window.currentContactId = userId;
        if (window.chatNotificationManager) {
            window.chatNotificationManager.updateUnreadBadge(userId, 0);
        }
        // Send mark_read event to notification WebSocket to clear unread badge in real time
        setTimeout(() => {
            if (window.chatNotificationManager && window.chatNotificationManager.ws && window.chatNotificationManager.ws.readyState === WebSocket.OPEN) {
                window.chatNotificationManager.ws.send(JSON.stringify({ type: 'mark_read', contact_id: userId }));
            }
        }, 300);

        // Close mobile panel after selection
        if (window.innerWidth <= 768) {
            document.getElementById('contactsPanel').classList.remove('mobile-open');
        }

        // Optionally: fetch old messages from server if needed
        fetchMessageForContact(this.querySelector('.take-username').textContent, setSessionId);
    });
});

// Main : function to send messages
async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    if (!currentContactId) {
        alert('Please select a contact to chat with.');
        return;
    }
    if (!message) return;
    const uname = messageInput.name;
    const sessionInfo = JSON.parse(sessionStorage.getItem(uname));
    if (!sessionInfo || !sessionInfo.aes_key) {
        alert('Session key not found. Please refresh or reselect contact.');
        return;
    }
    const encrypted_aes_key_b64 = sessionInfo.aes_key;
    const pkObj = await getDecryptedKeyFromDB();
    const pk = pkObj ? pkObj.key : null;
    const sessionName = sessionInfo.session_id;
    if (!pk) {
        alert('Private key not found. Please login again.');
        return;
    }

    if (chatSocket && chatSocket.readyState === WebSocket.OPEN) {
        // Dynamically import the crypto module
        import('/static/chatroom/js/chat_crypto_module.js').then(async module => {

            const aes_key_b64 = await module.decrypt_aes_key(encrypted_aes_key_b64, pk);
            const nonce_b64 = await module.generate_nonce_fun();
            const encryptedMessage = await module.encrypt_message_fun(aes_key_b64, message, nonce_b64);

            const timestamp = formatTimestamp();
            chatSocket.send(JSON.stringify({
                sessionName: sessionName,
                message: encryptedMessage,
                nonce: nonce_b64,
                timestamp: timestamp
            }));

            messageInput.value = '';
        }).catch(error => {
            console.error('Encryption module error:', error);
            alert('Could not encrypt message.');
        });
    }
}



// Main : function to open a chat socket for a specific contact
function openChatSocket(contactId) {
    // If a socket exists, close it and wait for it to close before opening a new one
    if (chatSocket) {
        chatSocket.onclose = null;
        chatSocket.onmessage = null;
        chatSocket.onerror = null;
        chatSocket.onopen = null;
        chatSocket.close();
        chatSocket = null;
    }
    if (!contactId) return;
    currentContactId = contactId;
    // Delay opening new socket to ensure previous is closed
    setTimeout(() => {
        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const wsUrl = `${protocol}://${window.location.host}/ws/chat/${contactId}/`;
        chatSocket = new WebSocket(wsUrl);

        chatSocket.onmessage = async function (event) {
            const data = JSON.parse(event.data);
            if (data.type === 'chat_message') {
                const type = String(data.sender_id) === String(getCurrentUserId()) ? 'sent' : 'received';
                const username = document.getElementById('messageInput').name;
                decryptedContent = await decryptMessageForDisplay(data.message, data.nonce, username);
                addMessageToUI(decryptedContent, type, data.timestamp);
                // If this chat is currently open and the message is received, mark as read immediately
                if (type === 'received' && window.chatNotificationManager && window.chatNotificationManager.ws && window.chatNotificationManager.ws.readyState === WebSocket.OPEN) {
                    window.chatNotificationManager.ws.send(JSON.stringify({ type: 'mark_read', contact_id: currentContactId }));
                    // Also clear badge in UI immediately
                    window.chatNotificationManager.updateUnreadBadge(currentContactId, 0);
                }
            }
        };

        chatSocket.onclose = function () {
            chatSocket = null;
        };
    }, 150); // 150ms delay to allow socket to close
}

// Main : function to send a friend request
function sendFriendRequest() {
    const usernameInput = document.getElementById('usernameInput');
    const username = usernameInput.value.trim();
    const statusMessage = document.getElementById('statusMessage');
    const sendBtn = document.getElementById('sendRequestBtn');

    if (!username) {
        statusMessage.textContent = 'Please enter a username.';
        statusMessage.style.color = '#ff6b6b';
        return;
    }

    // Show loading state
    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending...';

    fetch('/send_friend_request/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify({ username: username })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                statusMessage.textContent = data.message || `Friend request sent to ${username}!`;
                statusMessage.style.color = '#00ff88';
                usernameInput.value = '';
            } else {
                statusMessage.textContent = data.error || 'User not found or request failed.';
                statusMessage.style.color = '#ff6b6b';
            }
        })
        .catch(() => {
            statusMessage.textContent = 'An error occurred. Please try again.';
            statusMessage.style.color = '#ff6b6b';
        })
        .finally(() => {
            sendBtn.disabled = false;
            sendBtn.textContent = 'Send';
        });
}

// Main : function to accept a friend request
function acceptRequest(username) {
    import('/static/chatroom/js/chat_crypto_module.js').then(module => {
        module.acceptRequest(username).then(data => {
            if (data.success) {
                removeRequestItem(username);
            } else {
                alert(data.error);
            }
        }).catch(error => {
            console.error(error);
            alert('Could not process friend request.');
        });
    });
}
window.acceptRequest = acceptRequest;


// Main : function to reject a friend request
function rejectRequest(username) {
    fetch('/reject_friend_request/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify({ username: username })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                removeRequestItem(username);
            } else {
                alert(data.error);
            }
        });
}

// Main : function to logout the user
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        window.location.href = '/auth/logout/';
    }
}

// Main : function to auto-scroll to bottom on page load
document.addEventListener('DOMContentLoaded', function () {
    const messagesContainer = document.getElementById('messagesContainer');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
});

// Close mobile panel when clicking outside
document.addEventListener('click', function (e) {
    const contactsPanel = document.getElementById('contactsPanel');
    const mobileToggle = document.querySelector('.mobile-toggle');

    if (window.innerWidth <= 768 &&
        !contactsPanel.contains(e.target) &&
        !mobileToggle.contains(e.target)) {
        contactsPanel.classList.remove('mobile-open');
    }
});

// Responsive contacts panel toggle
document.addEventListener('DOMContentLoaded', function () {
    var toggleBtn = document.getElementById('mobileToggleBtn');
    var contactsPanel = document.getElementById('contactsPanel');
    if (toggleBtn && contactsPanel) {
        toggleBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            contactsPanel.classList.toggle('open');
        });
    }
    // Optional: close panel when clicking outside on mobile
    document.addEventListener('click', function (e) {
        if (window.innerWidth <= 900 && contactsPanel.classList.contains('open')) {
            if (!contactsPanel.contains(e.target) && e.target !== toggleBtn) {
                contactsPanel.classList.remove('open');
            }
        }
    });
});

// Mobile toggle function
function toggleContacts() {
    const contactsPanel = document.getElementById('contactsPanel');
    contactsPanel.classList.toggle('mobile-open');
}

// Contact Requests toggle function
function toggleContactRequests() {
    const contactRequestsPanel = document.getElementById('contactRequestsPanel');
    contactRequestsPanel.style.display = contactRequestsPanel.style.display === 'flex' ? 'none' : 'flex';
}

// Close Contact Requests panel
function closeContactRequests() {
    document.getElementById('contactRequestsPanel').style.display = 'none';
}