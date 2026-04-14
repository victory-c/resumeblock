import type { Metadata } from "next"
import localFont from "next/font/local"
import "./globals.css"
import { Sidebar } from "@/components/layout/Sidebar"
import { Toaster } from "sonner"
import { initDirs } from "@/lib/init-dirs"

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
})

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
})

export const metadata: Metadata = {
  title: "ResumeBlock",
  description: "AI-powered modular resume builder",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  initDirs()
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
        <Toaster position="bottom-right" />
      </body>
    </html>
  )
}
