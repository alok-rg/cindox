import init, { aes_decrypt } from '/static/authentication/wasm/zcore_crypto.js';

let userPassword = null;

// Function to open IndexedDB for temporary key storage
function openTempKeysDB() {
    return new Promise((resolve, reject) => {
        const dbRequest = indexedDB.open("TempKeysDB", 1);
        dbRequest.onupgradeneeded = function (event) {
            const db = event.target.result;
            if (!db.objectStoreNames.contains("tempKeys")) {
                db.createObjectStore("tempKeys", { keyPath: "id" });
            }
        };
        dbRequest.onsuccess = function (event) {
            resolve(event.target.result);
        };
        dbRequest.onerror = function (event) {
            reject(event.target.error);
        };
    });
}

// Store decrypted key in IndexedDB temporarily
async function storeDecryptedKeyTemporarily(decryptedKey) {
    const db = await openTempKeysDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction("tempKeys", "readwrite");
        const store = tx.objectStore("tempKeys");
        store.put({
            id: "decryptedPrivateKey",
            key: decryptedKey,
            timestamp: Date.now()
        });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

// Get decrypted key from IndexedDB
async function getDecryptedKeyFromDB() {
    try {
        const db = await openTempKeysDB();
        return await new Promise((resolve, reject) => {
            let tx, store, request;
            try {
                tx = db.transaction("tempKeys", "readonly");
                store = tx.objectStore("tempKeys");
                request = store.get("decryptedPrivateKey");
            } catch (e) {
                // Object store does not exist
                resolve(null);
                return;
            }
            request.onsuccess = function () {
                resolve(request.result ? request.result.key : null);
            };
            request.onerror = () => resolve(null);
        });
    } catch (e) {
        // DB does not exist or cannot be opened
        return null;
    }
}

// Delete decrypted key from IndexedDB
async function deleteDecryptedKeyFromDB() {
    const db = await openTempKeysDB();
    return new Promise((resolve) => {
        const tx = db.transaction("tempKeys", "readwrite");
        const store = tx.objectStore("tempKeys");
        store.delete("decryptedPrivateKey");
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve(); // Don't fail if deletion fails
    });
}

// Helper to open IndexedDB
async function openUserKeysDB() {
    return new Promise((resolve, reject) => {
        const dbRequest = indexedDB.open("UserKeysDB", 1);
        dbRequest.onsuccess = event => resolve(event.target.result);
        dbRequest.onerror = event => reject(event.target.error);
    });
}

// Helper to get a value from an object store
async function getFromStore(db, storeName, key) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// decrypt the private key using WASM and store it temporarily
async function getDecryptedPrivateKey() {
    let cachedKey = null;
    try {
        cachedKey = await getDecryptedKeyFromDB();
    } catch (e) {
        cachedKey = null;
    }
    if (cachedKey) {
        return cachedKey;
    }

    userPassword = prompt('Enter your password :');
    if (!userPassword) {
        alert('Password is required to access encrypted features.');
        window.location.href = '/auth/logout/';
        return null;
    }

    try {
        await init('/static/authentication/wasm/zcore_crypto_bg.wasm');

        const db = await openUserKeysDB();
        const result = await getFromStore(db, "keys", "privateKey");

        if (!result) {
            alert('No encrypted private key found. Please register first.');
            throw new Error('No private key found');
        }

        const { encryptedPrivateKeyHex, salt } = result;
        const saltBytes = Uint8Array.from(atob(salt), c => c.charCodeAt(0));
        const encoder = new TextEncoder();
        const passwordBytes = encoder.encode(userPassword);

        const keyMaterial = await crypto.subtle.importKey(
            'raw', passwordBytes, { name: 'PBKDF2' }, false, ['deriveBits']
        );
        const derivedBits = await crypto.subtle.deriveBits(
            {name: 'PBKDF2', salt: saltBytes, iterations: 100000, hash: 'SHA-256'}, keyMaterial, 384
        );
        const derivedArray = new Uint8Array(derivedBits);
        const aesKey = Array.from(derivedArray.slice(0, 32));
        const iv = Array.from(derivedArray.slice(32, 48));
        const aesKeyHex = aesKey.map(b => b.toString(16).padStart(2, '0')).join('');
        const ivHex = iv.map(b => b.toString(16).padStart(2, '0')).join('');

        const decryptedBase64 = aes_decrypt(aesKeyHex, ivHex, encryptedPrivateKeyHex);

        try {
            await storeDecryptedKeyTemporarily(decryptedBase64);
        } catch (error) {
            console.warn('Failed to store decrypted key temporarily:', error);
        }

        return decryptedBase64;

    } catch (error) {
        console.error('Failed to decrypt private key:', error);
        alert('Failed to access encrypted features.');
        throw error;
    }
}

// Clean up when user leaves the page
function setupCleanupListeners() {
    // Delete decrypted key when page is about to unload
    window.addEventListener('beforeunload', () => {
        deleteDecryptedKeyFromDB();
    });
}

// Auto-initialize when the module loads
document.addEventListener('DOMContentLoaded', async function () {
    // Setup cleanup listeners
    setupCleanupListeners();

    // Only prompt if user is on a page that needs the private key
    if (window.location.pathname.includes('/')) {
        await getDecryptedPrivateKey();
    }
});