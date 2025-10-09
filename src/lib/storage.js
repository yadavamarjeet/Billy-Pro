'use client';

import { initialData } from './data';
import { EncryptionService } from './encryption';

export class Storage {
    static key = 'BillyProData';

    static async getItem(key) {
        if (typeof window === 'undefined') return null;
        try {
            const encryptedData = localStorage.getItem(key);
            if (!encryptedData) return null;

            return await EncryptionService.decrypt(encryptedData);
        } catch (error) {
            console.error('Error loading data:', error);
            // Fallback to plain data
            try {
                const data = localStorage.getItem(key);
                return data ? JSON.parse(data) : null;
            } catch {
                return null;
            }
        }
    }

    static async setItem(key, data) {
        if (typeof window === 'undefined') return false;
        try {
            const encryptedData = await EncryptionService.encrypt(data);
            localStorage.setItem(key, encryptedData);
            return true;
        } catch (error) {
            console.error('Error saving data:', error);
            // Fallback to plain storage
            try {
                localStorage.setItem(key, JSON.stringify(data));
                return true;
            } catch (fallbackError) {
                console.error('Fallback save also failed:', fallbackError);
                return false;
            }
        }
    }

    static async getData() {
        if (typeof window === 'undefined') return null;

        try {
            const encryptedData = localStorage.getItem(this.key);

            if (!encryptedData) {
                // No data found, initialize with default data
                await this.saveData(initialData);
                return initialData;
            }

            // Data exists, decrypt and return it
            return await EncryptionService.decrypt(encryptedData);
        } catch (error) {
            console.error('Error loading data:', error);
            // Fallback to plain data for migration
            try {
                const data = localStorage.getItem(this.key);
                return data ? JSON.parse(data) : null;
            } catch {
                return initialData;
            }
        }
    }

    static async saveData(data) {
        if (typeof window === 'undefined') return;

        try {
            const encryptedData = await EncryptionService.encrypt(data);
            localStorage.setItem(this.key, encryptedData);
        } catch (error) {
            console.error('Error saving data:', error);
            // Fallback to plain storage if encryption fails
            try {
                localStorage.setItem(this.key, JSON.stringify(data));
            } catch (fallbackError) {
                console.error('Fallback save also failed:', fallbackError);
            }
        }
    }

    static async exportData() {
        const data = await this.getData();
        if (!data) return null;

        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        return {
            url,
            filename: `invoice-ninja-data-${new Date().toISOString().split('T')[0]}.json`
        };
    }

    static async importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = async (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    await this.saveData(data);
                    resolve(data);
                } catch (error) {
                    reject(new Error('Invalid JSON file'));
                }
            };

            reader.onerror = () => reject(new Error('Error reading file'));
            reader.readAsText(file);
        });
    }

    static removeItem(key) {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(key);
    }

    static clearData() {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(this.key);
    }
}