import { SignIn } from '@clerk/nextjs'
import { frFR } from '@clerk/localizations'

const localization = {
  ...frFR,
  socialButtonsBlockButton: '{{provider|titleize}}',
  signIn: {
    ...(frFR.signIn ?? {}),
    start: {
      ...(frFR.signIn?.start ?? {}),
      actionButton: 'Se connecter',
    },
  },
}

const appearance = {
  variables: {
    colorPrimary: '#8231a8',
    colorText: '#0a0a0a',
    colorTextSecondary: '#71717a',
    colorBackground: '#ffffff',
    colorInputBackground: '#ffffff',
    borderRadius: '0.5rem',
    fontFamily: 'var(--font-inter), Inter, sans-serif',
    fontSize: '14px',
  },
  elements: {
    card: 'shadow-sm border border-zinc-200',
    formButtonPrimary: 'h-11 text-sm font-medium',
    footer: { display: 'none' },
    badge: { display: 'none' },
  },
}

export default function SignInPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <SignIn appearance={appearance} forceRedirectUrl="/auth-redirect" />
    </main>
  )
}
