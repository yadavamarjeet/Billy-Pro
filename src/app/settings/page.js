'use client';

import { useState, useEffect } from 'react';
import { Save, Download, Upload, Trash2, Lock, Eye, EyeOff } from 'lucide-react';
import { Storage } from '@/lib/storage';
import { PasswordService } from '@/lib/password';
import { initialData } from '@/lib/data';
import Toast from '@/components/UI/Toast';
import Layout from '@/components/Layout/Layout';

export default function Settings() {
    const [data, setData] = useState(initialData);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [oldPassword, setOldPassword] = useState('');
    const [isSettingPassword, setIsSettingPassword] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [attempts, setAttempts] = useState(0);
    const [isLocked, setIsLocked] = useState(false);
    const [lockTime, setLockTime] = useState(0);
    const [hasPassword, setHasPassword] = useState(null);
    const [isClient, setIsClient] = useState(false);
    const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);

    useEffect(() => {
        (async () => {
            const savedData = await Storage.getData();
            if (savedData) setData(savedData);

            setIsClient(true);
            const passwordExists = await PasswordService.hasPassword();
            setHasPassword(passwordExists);

            // If no password exists, this is a first-time user
            if (!passwordExists) {
                setIsFirstTimeUser(true);
                setIsSettingPassword(true);
            }

            // Check if user is already authenticated
            // const authStatus = sessionStorage.getItem('settings_authenticated');
            // if (authStatus === 'true') {
            setIsAuthenticated(false);
            // }

            // Check if locked
            const lockUntil = await Storage.getItem('settings_lock_until');
            if (lockUntil && Date.now() < parseInt(lockUntil)) {
                setIsLocked(true);
                setLockTime(parseInt(lockUntil));
            }
        })();
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
    };

    const updateSettings = (field, value) => {
        setData(prev => ({
            ...prev,
            settings: {
                ...prev.settings,
                [field]: value
            }
        }));
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        if (isLocked) {
            const remainingTime = Math.ceil((lockTime - Date.now()) / 1000 / 60);
            showToast(`Too many failed attempts. Try again in ${remainingTime} minutes.`, 'error');
            return;
        }

        try {
            const isValid = await PasswordService.validatePassword(password);

            if (isValid) {
                setIsAuthenticated(true);
                await sessionStorage.setItem('settings_authenticated', 'true');
                setPassword('');
                setAttempts(0);
                showToast('Access granted');
            } else {
                const newAttempts = attempts + 1;
                setAttempts(newAttempts);

                if (newAttempts >= 5) {
                    // Lock for 30 minutes
                    const lockUntil = Date.now() + (30 * 60 * 1000);
                    await Storage.setItem('settings_lock_until', lockUntil.toString());
                    setIsLocked(true);
                    setLockTime(lockUntil);
                    showToast('Too many failed attempts. Locked for 30 minutes.', 'error');
                } else {
                    const remainingAttempts = 5 - newAttempts;
                    showToast(`Invalid password. ${remainingAttempts} attempts remaining.`, 'error');
                }
            }
        } catch (error) {
            showToast('Authentication failed', 'error');
        }
    };

    const handleSetPassword = async (e) => {
        e.preventDefault();

        // If password already exists and this is not first-time setup, require old password
        if (PasswordService.hasPassword() && !isFirstTimeUser) {
            const isOldPasswordValid = await PasswordService.validatePassword(oldPassword);
            if (!isOldPasswordValid) {
                showToast('Current password is incorrect', 'error');
                return;
            }
        }

        if (newPassword.length < 6) {
            showToast('Password must be at least 6 characters long', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }

        const strength = PasswordService.checkPasswordStrength(newPassword);
        if (strength.score < 3) {
            showToast('Password is too weak. Include uppercase, lowercase, numbers, and special characters.', 'error');
            return;
        }

        try {
            await PasswordService.setPassword(newPassword);
            setIsSettingPassword(false);
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');

            // If this was first-time setup, automatically authenticate the user
            if (isFirstTimeUser) {
                setIsAuthenticated(true);
                setIsFirstTimeUser(false);
                sessionStorage.setItem('settings_authenticated', 'true');
                showToast('Password set successfully! You now have access to settings.');
            } else {
                showToast('Password updated successfully');
            }
        } catch (error) {
            showToast(error.message, 'error');
        }
    };

    const saveSettings = async () => {
        await Storage.saveData(data);
        showToast('Settings saved successfully');
    };

    const exportData = async () => {
        const exportData = await Storage.exportData();
        if (exportData) {
            const a = document.createElement('a');
            a.href = exportData.url;
            a.download = exportData.filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(exportData.url);
            showToast('Data exported successfully');
        }
    };

    const importData = async (event) => {
        const file = event.target.files[0];
        if (file) {
            await Storage.importData(file)
                .then((importedData) => {
                    setData(importedData);
                    showToast('Data imported successfully');
                })
                .catch((error) => {
                    showToast(error.message, 'error');
                });
        }
        event.target.value = ''; // Reset file input
    };

    const clearData = async () => {
        if (confirm('Are you sure you want to clear ALL data? This action cannot be undone.')) {
            await Storage.clearData();
            setData(initialData);
            showToast('All data cleared successfully');
        }
    };

    const resetLock = async () => {
        await Storage.removeItem('settings_lock_until');
        setIsLocked(false);
        setAttempts(0);
        setLockTime(0);
    };

    if (hasPassword === null) {
        return (<Layout>
            <div className="flex items-center justify-center h-screen">
                <div className="text-gray-600 dark:text-gray-400">Loading...</div>
            </div>
        </Layout>
        );
    }

    // Password Protection Screen
    if (!isAuthenticated && isClient) {
        const remainingTime = isLocked ? Math.ceil((lockTime - Date.now()) / 1000 / 60) : 0;

        return (
            <Layout>
                <div className="container mx-auto p-6">
                    <div className="max-w-md mx-auto mt-20">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 border-2 border-gray-200 dark:border-gray-700">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Lock className="w-8 h-8 text-primary" />
                                </div>
                                <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                                    {isFirstTimeUser ? 'Setup Password' : 'Secure Settings'}
                                </h1>
                                <p className="text-gray-600 dark:text-gray-400">
                                    {isFirstTimeUser
                                        ? 'Create a password to secure your application settings'
                                        : 'Enter your password to access settings'
                                    }
                                </p>
                            </div>

                            {isLocked ? (
                                <div className="text-center p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                    <Lock className="w-12 h-12 text-red-500 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">
                                        Access Locked
                                    </h3>
                                    <p className="text-red-700 dark:text-red-400 mb-4">
                                        Too many failed attempts. Please try again in {remainingTime} minutes.
                                    </p>
                                    <button
                                        onClick={resetLock}
                                        className="text-sm text-primary hover:text-primary/80"
                                    >
                                        Reset Lock (Admin)
                                    </button>
                                </div>
                            ) : isSettingPassword || isFirstTimeUser ? (
                                <form onSubmit={handleSetPassword} className="space-y-4">
                                    {hasPassword && !isFirstTimeUser && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Current Password
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="password"
                                                    value={oldPassword}
                                                    onChange={(e) => setOldPassword(e.target.value)}
                                                    className="input-field"
                                                    placeholder="Enter current password"
                                                    required={hasPassword && !isFirstTimeUser}
                                                />
                                            </div>
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            {isFirstTimeUser ? 'Create Password' : 'New Password'}
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showNewPassword ? "text" : "password"}
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="input-field pr-10"
                                                placeholder={isFirstTimeUser ? "Create your password" : "Enter new password"}
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                            >
                                                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Confirm Password
                                        </label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="input-field"
                                            placeholder="Confirm your password"
                                            required
                                        />
                                    </div>
                                    {newPassword && (
                                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Password Strength
                                            </p>
                                            <div className="space-y-1">
                                                {[
                                                    { label: 'At least 8 characters', check: newPassword.length >= 8 },
                                                    { label: 'Uppercase letter', check: /[A-Z]/.test(newPassword) },
                                                    { label: 'Lowercase letter', check: /[a-z]/.test(newPassword) },
                                                    { label: 'Number', check: /[0-9]/.test(newPassword) },
                                                    { label: 'Special character', check: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword) }
                                                ].map((rule, index) => (
                                                    <div key={index} className="flex items-center text-sm">
                                                        <div className={`w-2 h-2 rounded-full mr-2 ${rule.check ? 'bg-green-500' : 'bg-gray-300'}`} />
                                                        <span className={rule.check ? 'text-green-600' : 'text-gray-500'}>
                                                            {rule.label}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <button
                                        type="submit"
                                        className="w-full btn-primary"
                                    >
                                        {isFirstTimeUser ? 'Set Password & Continue' : 'Update Password'}
                                    </button>
                                    {!isFirstTimeUser && (
                                        <button
                                            type="button"
                                            onClick={() => setIsSettingPassword(false)}
                                            className="w-full text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mt-2"
                                        >
                                            Back to Login
                                        </button>
                                    )}
                                </form>
                            ) : (
                                <form onSubmit={handleLogin} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="input-field pr-10"
                                                placeholder="Enter your password"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        className="w-full btn-primary"
                                    >
                                        Access Settings
                                    </button>
                                    <div className="text-center">
                                        <button
                                            type="button"
                                            onClick={() => setIsSettingPassword(true)}
                                            className="text-sm text-primary hover:text-primary/80"
                                        >
                                            Change Password
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                    <Toast
                        isVisible={toast.show}
                        message={toast.message}
                        type={toast.type}
                        onHide={() => setToast(prev => ({ ...prev, show: false }))}
                    />
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="container mx-auto p-6">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Settings</h1>
                <div className="space-y-6">
                    {/* Business Information */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                            Business Information
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Business Name
                                </label>
                                <input
                                    type="text"
                                    value={data.settings.businessName}
                                    onChange={(e) => updateSettings('businessName', e.target.value)}
                                    className="input-field"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={data.settings.businessEmail}
                                    onChange={(e) => updateSettings('businessEmail', e.target.value)}
                                    className="input-field"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Phone
                                </label>
                                <input
                                    type="text"
                                    value={data.settings.businessPhone}
                                    onChange={(e) => updateSettings('businessPhone', e.target.value)}
                                    className="input-field"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Address
                                </label>
                                <textarea
                                    value={data.settings.businessAddress}
                                    onChange={(e) => updateSettings('businessAddress', e.target.value)}
                                    rows="2"
                                    className="input-field"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Invoice Settings */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                            Invoice Settings
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Invoice Prefix
                                </label>
                                <input
                                    type="text"
                                    value={data.settings.invoicePrefix}
                                    onChange={(e) => updateSettings('invoicePrefix', e.target.value)}
                                    className="input-field"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Starting Number
                                </label>
                                <input
                                    type="number"
                                    value={data.settings.invoiceStart}
                                    onChange={(e) => updateSettings('invoiceStart', parseInt(e.target.value))}
                                    className="input-field"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Privacy Settings */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                            Privacy Settings
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Can Delete Invoices
                                </label>
                                <select
                                    value={data.settings.canDeleteInvoices ? 'true' : 'false'}
                                    onChange={(e) => updateSettings('canDeleteInvoices', e.target.value === 'true')}
                                    className="input-field"
                                >
                                    <option value="true">Yes</option>
                                    <option value="false">No</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Privacy Mode
                                </label>
                                <select
                                    value={data.settings.privacyMode ? 'true' : 'false'}
                                    onChange={(e) => updateSettings('privacyMode', e.target.value === 'true')}
                                    className="input-field"
                                >
                                    <option value="false">Disabled</option>
                                    <option value="true">Enabled</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Data Management */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                            Data Management
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <button
                                onClick={exportData}
                                className="btn-secondary flex items-center justify-center space-x-2"
                            >
                                <Download className="w-4 h-4" />
                                <span>Export All Data</span>
                            </button>

                            <label className="btn-primary flex items-center justify-center space-x-2 cursor-pointer">
                                <Upload className="w-4 h-4" />
                                <span>Import Data</span>
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={importData}
                                    className="hidden"
                                />
                            </label>

                            <button
                                onClick={clearData}
                                className="bg-red-500 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-red-600"
                            >
                                <Trash2 className="w-4 h-4" />
                                <span>Clear All Data</span>
                            </button>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end">
                        <button
                            onClick={saveSettings}
                            className="btn-primary flex items-center space-x-2"
                        >
                            <Save className="w-4 h-4" />
                            <span>Save Settings</span>
                        </button>
                    </div>
                </div>

                <Toast
                    isVisible={toast.show}
                    message={toast.message}
                    type={toast.type}
                    onHide={() => setToast(prev => ({ ...prev, show: false }))}
                />
            </div>
        </Layout>
    );
}