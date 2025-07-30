// chatroom/static/js/notifications.js
// Real-time notifications and online status for chat contacts

class ChatNotificationManager {
    constructor() {
        this.ws = null;
        this.connect();
        this.selectedContactUserId = null;
    }

    // Establish WebSocket connection to the notifications endpoint
    connect() {
        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const wsUrl = `${protocol}://${window.location.host}/ws/notifications/`;
        this.ws = new WebSocket(wsUrl);

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'online_status') {
                this.updateContactOnlineStatus(data.user_id, data.is_online);
            } else if (data.type === 'unread_message') {
                this.updateUnreadBadge(data.from_user, data.unread_count);
            } else if (data.type === 'online_contacts') {
                this.updateAllOnlineContacts(data.user_ids);
            }
        };
    }

    updateAllOnlineContacts(userIds) {
        // Set all contacts offline first
        document.querySelectorAll('.contact-item').forEach(contact => {
            this.updateContactOnlineStatus(contact.getAttribute('data-user-id'), false);
        });
        // Set online those in the list
        userIds.forEach(userId => {
            this.updateContactOnlineStatus(userId, true);
        });
    }

    updateContactOnlineStatus(userId, isOnline) {
        // Find contact by userId and update online status
        const contact = document.querySelector(`.contact-item[data-user-id='${userId}']`);
        if (contact) {
            let status = contact.querySelector('.online-status');
            if (!status) {
                status = document.createElement('div');
                status.className = 'online-status';
                contact.querySelector('div[style*="position: relative"]')?.appendChild(status);
            }
            status.textContent = isOnline ? 'Online' : 'Offline';
            status.classList.toggle('is-online', isOnline);
            status.classList.toggle('is-offline', !isOnline);
            // If this contact is currently selected, update chat header status
            if (this.selectedContactUserId && String(this.selectedContactUserId) === String(userId)) {
                this.updateChatHeaderStatus(isOnline);
            }
        }
    }

    updateChatHeaderStatus(isOnline) {
        const chatHeaderInfo = document.querySelector('.chat-header-info');
        if (chatHeaderInfo) {
            let statusP = chatHeaderInfo.querySelector('p');
            statusP.textContent = isOnline ? 'Online' : 'Offline';
            statusP.classList.toggle('is-online', isOnline);
            statusP.classList.toggle('is-offline', !isOnline);
        }
    }

    setSelectedContact(userId) {
        this.selectedContactUserId = userId;
        // Find the contact's current status
        const contact = document.querySelector(`.contact-item[data-user-id='${userId}']`);
        let isOnline = false;
        if (contact) {
            const statusDiv = contact.querySelector('.online-status');
            isOnline = statusDiv && statusDiv.classList.contains('is-online');
        }
        this.updateChatHeaderStatus(isOnline);
    }

    updateUnreadBadge(userId, count) {
        // If this contact is currently open, always clear the badge
        if (String(userId) === String(window.currentContactId)) {
            count = 0;
        }
        const contact = document.querySelector(`.contact-item[data-user-id='${userId}']`);
        if (contact) {
            let badge = contact.querySelector('.unread-badge');
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'unread-badge';
                contact.querySelector('.contact-info')?.appendChild(badge);
            }
            badge.textContent = count > 0 ? count : '';
            badge.style.display = count > 0 ? 'inline-block' : 'none';
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.chatNotificationManager = new ChatNotificationManager();
    // Listen for contact selection events from chats.js
    document.addEventListener('contactSelected', function (e) {
        if (e.detail && e.detail.userId) {
            window.chatNotificationManager.setSelectedContact(e.detail.userId);
        }
    });
});
