import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Bid-Master Marketing Platform',
  description: 'AI-powered content and lead generation for government contractors.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={cn(inter.className, "antialiased min-h-screen bg-slate-50 text-slate-900")}>
        {children}
      </body>
    </html>
  )
}
