// lib/password.js
'use client';
import { Storage } from './storage';

export class PasswordService {
    static PASSWORD_KEY = 'billy_pro_settings_password';
    static SALT_ROUNDS = 12;

    // Generate a secure hash (in a real app, use bcrypt on server-side)
    static async hashPassword(password) {
        // For client-side demo - in production, this should be done server-side
        const encoder = new TextEncoder();
        const data = encoder.encode(password + process.env.NEXT_PUBLIC_PASSWORD_SALT);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Verify password
    static async verifyPassword(password, hash) {
        const newHash = await this.hashPassword(password);
        return newHash === hash;
    }

    // Check if password is set
    static async hasPassword() {
        if (typeof window === 'undefined') return false;
        const storedHash = await Storage.getItem(this.PASSWORD_KEY)
        return !!storedHash;
    }

    // Set new password
    static async setPassword(password) {
        if (password.length < 6) {
            throw new Error('Password must be at least 6 characters long');
        }

        const hash = await this.hashPassword(password);
        await Storage.setItem(this.PASSWORD_KEY, hash);
        return true;
    }

    // Validate password
    static async validatePassword(password) {
        const storedHash = await Storage.getItem(this.PASSWORD_KEY);
        if (!storedHash) return true; // No password set yet

        const isValid = await this.verifyPassword(password, storedHash);
        return isValid;
    }

    // Clear password (for reset)
    static async clearPassword() {
        await Storage.removeItem(this.PASSWORD_KEY);
    }

    // Password strength checker
    static checkPasswordStrength(password) {
        const checks = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            numbers: /[0-9]/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };

        const score = Object.values(checks).filter(Boolean).length;

        return {
            score,
            strength: score >= 4 ? 'strong' : score >= 3 ? 'good' : score >= 2 ? 'weak' : 'very weak',
            checks
        };
    }
}