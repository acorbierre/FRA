import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LienExpirePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>Lien invalide ou expiré</CardTitle>
          <CardDescription>
            Ce lien d&apos;invitation n&apos;est plus valide. Il a peut-être expiré (validité 7 jours)
            ou déjà été utilisé.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Contactez l&apos;équipe pour recevoir un nouveau lien d&apos;invitation.
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
