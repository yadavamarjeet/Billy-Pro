// lib/encryption.js
'use client';

export class EncryptionService {
    static ALGORITHM = 'AES-GCM';
    static KEY_LENGTH = 256;
    static SALT = 'BillyPro~!@#$%^&*()_+123789'; // Change this to your app-specific salt

    static async generateKey() {
        const encoder = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            encoder.encode(this.SALT),
            'PBKDF2',
            false,
            ['deriveKey']
        );

        return await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: encoder.encode('static-salt'),
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: this.ALGORITHM, length: this.KEY_LENGTH },
            false,
            ['encrypt', 'decrypt']
        );
    }

    static async encrypt(data) {
        try {
            const key = await this.generateKey();
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(JSON.stringify(data));

            const iv = crypto.getRandomValues(new Uint8Array(12));
            const encrypted = await crypto.subtle.encrypt(
                {
                    name: this.ALGORITHM,
                    iv: iv
                },
                key,
                dataBuffer
            );

            const encryptedArray = new Uint8Array(encrypted);
            const result = new Uint8Array(iv.length + encryptedArray.length);
            result.set(iv);
            result.set(encryptedArray, iv.length);

            return btoa(String.fromCharCode(...result));
        } catch (error) {
            console.error('Encryption error:', error);
            throw error;
        }
    }

    static async decrypt(encryptedData) {
        try {
            const key = await this.generateKey();
            const encryptedArray = new Uint8Array(
                atob(encryptedData).split('').map(char => char.charCodeAt(0))
            );

            const iv = encryptedArray.slice(0, 12);
            const data = encryptedArray.slice(12);

            const decrypted = await crypto.subtle.decrypt(
                {
                    name: this.ALGORITHM,
                    iv: iv
                },
                key,
                data
            );

            const decoder = new TextDecoder();
            return JSON.parse(decoder.decode(decrypted));
        } catch (error) {
            console.error('Decryption error:', error);
            throw error;
        }
    }
}