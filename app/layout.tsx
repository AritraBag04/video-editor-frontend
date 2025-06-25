import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from "sonner"


export const metadata: Metadata = {
  title: 'Video Editor'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // @ts-ignore
    return (
    <html lang="en">
      <body>
        <main>{children}</main>
        <Toaster />
      </body>
    </html>
  )
}
