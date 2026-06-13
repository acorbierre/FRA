import type { Metadata } from "next"
import { Inter, Plus_Jakarta_Sans } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import { frFR } from "@clerk/localizations"
import "./globals.css"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
})

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
})

export const metadata: Metadata = {
  title: "Espace FRA",
  description: "Portail de candidature aux appels à projets de recherche",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider afterSignOutUrl="/sign-in" localization={frFR}>
      <html
        lang="fr"
        className={`${inter.variable} ${plusJakartaSans.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col" suppressHydrationWarning>{children}</body>
      </html>
    </ClerkProvider>
  )
}
