import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: 'Billy Pro',
  description: 'Professional invoicing and CRM solution',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
          {children}
        </div>
      </body>
    </html>
  );
}
