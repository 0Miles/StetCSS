import './globals.css'

export const metadata = {
  title: 'StetCSS Next.js playground',
  description: 'StetCSS Next.js static CSS playground'
}

export default function RootLayout({ children }: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
