'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

export default function InviterPage() {
  const [email, setEmail]   = useState('')
  const [link, setLink]     = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setLink('')

    const res = await fetch('/api/auth/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    const data = await res.json()
    setLink(data.url)
    setLoading(false)
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Générer un lien d&apos;invitation</CardTitle>
          <CardDescription>
            Le chercheur recevra ce lien pour créer son espace candidat.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Adresse email du chercheur</Label>
              <Input
                id="email"
                type="email"
                placeholder="jean.dupont@cnrs.fr"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Génération…' : 'Générer le lien'}
            </Button>
          </form>

          {link && (
            <div className="space-y-2">
              <Label>Lien d&apos;invitation (valable 7 jours)</Label>
              <div className="flex gap-2">
                <Input value={link} readOnly className="text-xs font-mono" />
                <Button variant="outline" onClick={handleCopy} className="shrink-0">
                  {copied ? 'Copié !' : 'Copier'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
