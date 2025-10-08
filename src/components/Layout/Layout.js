'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    Home,
    FileText,
    ShoppingBag,
    Grid,
    Users,
    Settings,
    Moon,
    Sun,
    Menu,
    Plus
} from 'lucide-react';
import { Storage } from '@/lib/storage';
import clsx from 'clsx';

export default function Layout({ children }) {
    const [darkMode, setDarkMode] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(async () => {
        const savedSidebarState = await Storage.getItem('sidebarOpen');
        return savedSidebarState !== null ? savedSidebarState : true;
    });

    const pathname = usePathname();

    useEffect(() => {
        // Load theme preference
        const savedTheme = Storage.getItem('theme');
        if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            setDarkMode(true);
            document.documentElement.classList.add('dark');
        }
    }, []);

    useEffect(() => {
        Storage.setItem('sidebarOpen', sidebarOpen); // Store just the boolean
    }, [sidebarOpen]);

    useEffect(() => {
        // Save theme preference
        if (darkMode) {
            document.documentElement.classList.add('dark');
            Storage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            Storage.setItem('theme', 'light');
        }
    }, [darkMode]);

    const navigation = [
        { name: 'Dashboard', href: '/', icon: Home },
        { name: 'Invoices', href: '/invoices', icon: FileText }, // Add this line
        { name: 'Create Invoice', href: '/invoices/create', icon: Plus }, // Changed icon to Plus
        { name: 'Products', href: '/products', icon: ShoppingBag },
        { name: 'Categories', href: '/categories', icon: Grid },
        { name: 'Customers', href: '/customers', icon: Users },
        { name: 'Settings', href: '/settings', icon: Settings },
    ];

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
            {/* Sidebar */}
            <div className={clsx(
                sidebarOpen ? 'w-64' : 'w-20',
                'bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 flex flex-col'
            )}>
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h1 className={clsx(sidebarOpen ? 'block' : 'hidden', `text-xl font-bold text-gray-800 dark:text-white`)}>
                        Billy Pro
                    </h1>
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                        <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${isActive
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                            >
                                <item.icon className="w-5 h-5" />
                                <span className={clsx(sidebarOpen ? 'block' : 'hidden')}>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => setDarkMode(!darkMode)}
                        className="flex items-center space-x-3 p-3 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full"
                    >
                        {darkMode ? (
                            <Sun className="w-5 h-5 text-yellow-500" />
                        ) : (
                            <Moon className="w-5 h-5" />
                        )}
                        <span className={clsx(sidebarOpen ? 'block' : 'hidden')}>
                            {darkMode ? 'Light Mode' : 'Dark Mode'}
                        </span>
                    </button>
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 overflow-auto">
                {children}
            </div>
        </div>
    );
}