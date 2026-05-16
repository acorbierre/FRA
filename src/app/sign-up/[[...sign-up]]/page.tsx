import { SignUp } from '@clerk/nextjs'
import { frFR } from '@clerk/localizations'

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
  },
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const localization: any = {
  ...frFR,
  signUp: {
    ...(frFR as any).signUp,
    continue: {
      ...(frFR as any).signUp?.continue,
      title: 'Créez votre mot de passe',
    },
  },
}

export default function SignUpPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <SignUp appearance={appearance} fallbackRedirectUrl="/redirect" />
    </main>
  )
}
