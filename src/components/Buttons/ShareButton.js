'use client';

import { Share2 } from "lucide-react";
import { WhatsAppService } from "@/lib/whatsapp";
import clsx from "clsx";
import { useState } from "react";
import Toast from "../UI/Toast";


export default function ShareButton({ invoice: invoice, data: data }) {

    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
    };

    const shareWhatsApp = async () => {
        if (invoice.customerPhone == null || invoice.customerPhone.trim() === '' || invoice.customerPhone.length <= 9) {
            showToast('Customer phone number is required for WhatsApp sharing', 'error');
            return;
        }

        try {
            const whatsappUrl = WhatsAppService.shareInvoice(invoice, data);
            window.open(whatsappUrl, '_blank');
            showToast('Opening WhatsApp...');
        } catch (error) {
            showToast(error.message, 'error');
        }
    };


    return (
        <div>
            <button
                onClick={shareWhatsApp}
                className={clsx(
                    invoice.customerPhone.length === 10 ? 'opacity-100 cursor-allowed' : 'opacity-50 cursor-not-allowed',
                    'text-green-600 hover:text-green-800 p-1 rounded',
                    'hover:bg-green-100 dark:hover:bg-green-900'
                )}
                title="Share via WhatsApp"
            >
                <Share2 className="w-4 h-4 inline" />
            </button>
            <Toast
                isVisible={toast.show}
                message={toast.message}
                type={toast.type}
                onHide={() => setToast(prev => ({ ...prev, show: false }))}
            />
        </div>
    );
}