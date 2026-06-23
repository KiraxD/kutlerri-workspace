import type { Metadata } from 'next'
import { Space_Grotesk, Montserrat } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { TooltipProvider } from '@/components/ui/tooltip'

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
})

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Kutlerri Workspace',
  description: 'Manage tasks, cycles, and teams with efficiency.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${spaceGrotesk.variable} ${montserrat.variable} h-full antialiased`}>
      {/* Force light mode: clear any persisted dark theme from localStorage */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{localStorage.setItem('theme','light')}catch(e){}})()` }} />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <TooltipProvider delay={0}>
            {children}
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

