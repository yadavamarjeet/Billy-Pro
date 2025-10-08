'use client';

export class Storage {
    static key = 'BillyProData';

    static getData() {
        if (typeof window === 'undefined') return null;

        try {
            const data = localStorage.getItem(this.key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error loading data:', error);
            return null;
        }
    }

    static getItem(key) {
        if (typeof window === 'undefined') return null;
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error loading data:', error);
            return null;
        }
    }

    static setItem(key, data) {
        if (typeof window === 'undefined') return false;
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error saving data:', error);
            return false;
        }
    }

    static saveData(data) {
        if (typeof window === 'undefined') return;

        try {
            localStorage.setItem(this.key, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving data:', error);
        }
    }

    static exportData() {
        const data = this.getData();
        if (!data) return null;

        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        return {
            url,
            filename: `billy-pro-data-${new Date().toISOString().split('T')[0]}.json`
        };
    }

    static importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    this.saveData(data);
                    resolve(data);
                } catch (error) {
                    reject(new Error('Invalid JSON file'));
                }
            };

            reader.onerror = () => reject(new Error('Error reading file'));
            reader.readAsText(file);
        });
    }

    static clearData() {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(this.key);
    }
}