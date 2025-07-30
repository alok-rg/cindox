// chat_crypto_module.js
import init, { 
    decrypt_message,
    encrypt_message,
    generate_nonce,
    encrypt_aes_key_with_rsa,
    decrypt_aes_key_with_rsa,
    generate_aes_key
} from '/static/chatroom/wasm/chat_crypto_wasm.js';

// Ensure the WASM module is initialized only once
let wasmInitialized = false;
async function ensureWasm() {
    if (!wasmInitialized) {
        await init(); // This loads and initializes the WASM module
        wasmInitialized = true;
    }
}

// Function to generate AES key
export async function decrypt_aes_key(encrypted_aes_key_b64, private_key_pem) {
    await ensureWasm();
    private_key_pem = formatPrivatePem(private_key_pem);
    return decrypt_aes_key_with_rsa(encrypted_aes_key_b64, private_key_pem);
}

// Function to encrypt AES key with RSA
export async function generate_nonce_fun() {
    await ensureWasm();
    return generate_nonce();
}

// Function to encrypt AES key with RSA
export async function encrypt_message_fun(aes_key_b64, plaintext, nonce_b64) {
    await ensureWasm();
    return encrypt_message(aes_key_b64, plaintext, nonce_b64);
}

// Function to encrypt AES key with RSA
export async function decrypt_message_fun(aes_key_b64, ciphertext, nonce_b64) {
    await ensureWasm();
    return decrypt_message(aes_key_b64, ciphertext, nonce_b64);
}

// Function to format private PEM keys
function formatPrivatePem(key) {
    // Remove any existing header/footer and whitespace
    key = key.replace(/-----.*PRIVATE KEY-----/g, '').replace(/\s+/g, '');
    // Split into lines of 64 characters
    let lines = [];
    for (let i = 0; i < key.length; i += 64) {
        lines.push(key.substr(i, 64));
    }
    return '-----BEGIN PRIVATE KEY-----\n' + lines.join('\n') + '\n-----END PRIVATE KEY-----';
}

// Function to format PEM keys
function formatPem(key) {
    // Remove any existing header/footer and whitespace
    key = key.replace(/-----.*-----/g, '').replace(/\s+/g, '');
    
    // Split into lines of 64 characters
    let lines = [];
    for (let i = 0; i < key.length; i += 64) {
        lines.push(key.substr(i, 64));
    }
    
    return '-----BEGIN PUBLIC KEY-----\n' + lines.join('\n') + '\n-----END PUBLIC KEY-----';
}

// Helper to get CSRF token from cookie
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

// Function to fetch public keys from the server
export async function getPublicKeys(username) {
    const response = await fetch('/get_public_keys/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify({ username })
    });
    const data = await response.json();
    if (data.success) {
        return {
            senderPublicKey: data.public_key_sender,
            receiverPublicKey: data.public_key_receiver
        };
    } else {
        throw new Error(data.error || 'Failed to fetch public keys');
    }
}

// Function to accept a friend request
export async function acceptRequest(username) {
    await init(); // Ensure WASM is initialized
    const aesKey = generate_aes_key();
    const nonce = generate_nonce();
    try {
        const { senderPublicKey, receiverPublicKey } = await getPublicKeys(username);
        
        // Use formatPem instead of ensurePemFormat
        const cleanSenderKey = formatPem(senderPublicKey);
        const cleanReceiverKey = formatPem(receiverPublicKey);
        const encryptWelcomeMessage = encrypt_message(aesKey, "Nice to connect with you!", nonce);
        
        // Now use the keys
        const aesKeyForSender = encrypt_aes_key_with_rsa(aesKey, cleanSenderKey);
        const aesKeyForReceiver = encrypt_aes_key_with_rsa(aesKey, cleanReceiverKey);

        // Send the request to the server
        const response = await fetch('/accept_friend_request/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            },
            body: JSON.stringify({
                username,
                aes_key_encrypted_sender: aesKeyForSender,
                aes_key_encrypted_receiver: aesKeyForReceiver,
                nonce,
                encrypted_welcome_message: encryptWelcomeMessage
            })
        });
        return await response.json();
    } catch (error) {
        throw error;
    }
}