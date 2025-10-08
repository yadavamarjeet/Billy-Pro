'use client';

import { Share2 } from "lucide-react";
import { WhatsAppService } from "@/lib/whatsapp";
import clsx from "clsx";


export default function ShareButton({ invoice: invoice, data: data }) {
    return (
        <button
            onClick={() => {
                const whatsappUrl = WhatsAppService.shareInvoice(invoice, data)
                window.open(whatsappUrl, '_blank');
            }}
            className={clsx(
                invoice.customerPhone ? 'opacity-100 cursor-allowed' : 'opacity-50 cursor-not-allowed',
                'text-green-600 hover:text-green-800 p-1 rounded',
                'hover:bg-green-100 dark:hover:bg-green-900'
            )}
            title="Share via WhatsApp"
        >
            <Share2 className="w-4 h-4 inline" />
        </button>
    );
}