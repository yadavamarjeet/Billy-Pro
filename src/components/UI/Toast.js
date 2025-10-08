'use client';

import { useEffect } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function Toast({ message, type = 'success', isVisible, onHide }) {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onHide();
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [isVisible, onHide]);

    if (!isVisible) return null;

    const bgColor = type === 'error' ? 'bg-red-500' : 'bg-green-500';
    const Icon = type === 'error' ? AlertCircle : CheckCircle;

    return (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right">
            <div className={`${bgColor} text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2`}>
                <Icon className="w-5 h-5" />
                <span>{message}</span>
            </div>
        </div>
    );
}