import init, { aes_encrypt } from '/static/authentication/wasm/zcore_crypto.js';

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('registerForm');
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // 1. Get password from form
        const password = form.querySelector('input[name="password"]').value;
        if (!password) {
            alert("Password required for key generation.");
            return;
        }

        // 2. Generate RSA key pair
        const keyPair = await window.crypto.subtle.generateKey(
            { name: "RSA-OAEP", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
            true,
            ["encrypt", "decrypt"]
        );

        // 3. Export public and private keys
        const publicKey = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
        const privateKey = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

        // 4. Derive AES key and IV from password (using PBKDF2)
        const enc = new TextEncoder();
        const salt = window.crypto.getRandomValues(new Uint8Array(16));
        const passwordKey = await window.crypto.subtle.importKey(
            "raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveBits", "deriveKey"]
        );
        const derivedBits = await window.crypto.subtle.deriveBits(
            { name: "PBKDF2", salt: salt, iterations: 100000, hash: "SHA-256" },
            passwordKey,
            384 // 32 bytes key + 16 bytes IV = 384 bits
        );
        const derivedBytes = new Uint8Array(derivedBits);
        const aesKeyHex = Array.from(derivedBytes.slice(0, 32)).map(b => b.toString(16).padStart(2, '0')).join('');
        const ivHex = Array.from(derivedBytes.slice(32)).map(b => b.toString(16).padStart(2, '0')).join('');

        // 5. Initialize Wasm
        await init('/static/authentication/wasm/zcore_crypto_bg.wasm');

        // 6. Encrypt private key with Wasm AES
        const privateKeyBase64 = arrayBufferToBase64(privateKey);
        const encryptedPrivateKeyHex = aes_encrypt(aesKeyHex, ivHex, privateKeyBase64);

        // 7. Store encrypted private key, salt, and iv in IndexedDB
        const dbRequest = indexedDB.open("UserKeysDB", 1);
        dbRequest.onupgradeneeded = function(event) {
            const db = event.target.result;
            db.createObjectStore("keys", { keyPath: "id" });
        };
        dbRequest.onsuccess = function(event) {
            const db = event.target.result;
            const tx = db.transaction("keys", "readwrite");
            const store = tx.objectStore("keys");
            store.put({
                id: "privateKey",
                encryptedPrivateKeyHex: encryptedPrivateKeyHex,
                salt: arrayBufferToBase64(salt)
            });
        };

        // 8. Send public key to server (base64 encoded)
        const publicKeyBase64 = arrayBufferToBase64(publicKey);
        document.getElementById('public_key').value = publicKeyBase64;

        // 9. Prepare form data
        const formData = new FormData(form);

        // 10. Send via fetch (AJAX)
        const response = await fetch(form.action, {
            method: "POST",
            body: formData,
            headers: {
                'X-CSRFToken': form.querySelector('[name=csrfmiddlewaretoken]').value
            }
        });

        if (response.ok) {
            // Redirect or show success
            window.location.href = "/auth/login/";
        } else {
            // Handle errors
            alert("Registration failed.");
        }
    });

    function arrayBufferToBase64(buffer) {
        let binary = '';
        let bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }
});