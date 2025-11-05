import './globals.css'
import { Inter } from 'next/font/google'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { AuthProvider } from '@/hooks/useGoogleAuth'
import { CartProvider } from '@/hooks/useCart'
import { ToastProvider } from '@/components/Toast'
import { ThemeProvider } from '@/contexts/ThemeContext'
import DynamicHead from '@/components/DynamicHead'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Betarak - Store Warehouse Solution',
  description: 'Betarak adalah penyedia solusi rak dan perlengkapan toko terlengkap di Indonesia. Kami berkomitmen memberikan produk berkualitas tinggi dengan pelayanan terbaik.',
  keywords: 'rak toko, rak gudang, perlengkapan toko, warehouse solution, betarak, rak display, rak minimarket',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={inter.className}>
        <DynamicHead />
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <CartProvider>
                {children}
              </CartProvider>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
