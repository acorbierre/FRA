'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

const COUNTRY_CODES = [
  { code: '+33',  flag: '🇫🇷', label: 'France' },
  { code: '+32',  flag: '🇧🇪', label: 'Belgique' },
  { code: '+41',  flag: '🇨🇭', label: 'Suisse' },
  { code: '+352', flag: '🇱🇺', label: 'Luxembourg' },
  { code: '+1',   flag: '🇺🇸', label: 'États-Unis / Canada' },
  { code: '+44',  flag: '🇬🇧', label: 'Royaume-Uni' },
  { code: '+49',  flag: '🇩🇪', label: 'Allemagne' },
  { code: '+34',  flag: '🇪🇸', label: 'Espagne' },
  { code: '+39',  flag: '🇮🇹', label: 'Italie' },
  { code: '+31',  flag: '🇳🇱', label: 'Pays-Bas' },
  { code: '+351', flag: '🇵🇹', label: 'Portugal' },
  { code: '+46',  flag: '🇸🇪', label: 'Suède' },
  { code: '+47',  flag: '🇳🇴', label: 'Norvège' },
  { code: '+45',  flag: '🇩🇰', label: 'Danemark' },
  { code: '+212', flag: '🇲🇦', label: 'Maroc' },
  { code: '+213', flag: '🇩🇿', label: 'Algérie' },
  { code: '+216', flag: '🇹🇳', label: 'Tunisie' },
  { code: '+221', flag: '🇸🇳', label: 'Sénégal' },
  { code: '+225', flag: '🇨🇮', label: "Côte d'Ivoire" },
]

const schema = z.object({
  prenom:       z.string().min(1, 'Prénom requis'),
  nom:          z.string().min(1, 'Nom requis'),
  indicatif:    z.string().min(1),
  telephone:    z.string().optional(),
  laboratoire:  z.string().min(2, 'Laboratoire requis'),
  bio:          z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export default function CompleterProfilPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { indicatif: '+33' },
  })

  async function onSubmit(values: FormValues) {
    setServerError('')
    const telephone = values.telephone
      ? `${values.indicatif} ${values.telephone}`
      : undefined

    const res = await fetch('/api/auth/complete-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...values, telephone }),
    })

    const data = await res.json()
    if (!res.ok) {
      setServerError(data.error ?? 'Une erreur est survenue.')
      return
    }

    router.push('/espace')
    router.refresh()
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-lg space-y-6">
        <div>
          <h1 className="page-title">Bienvenue</h1>
          <p className="page-subtitle">Complétez votre profil pour accéder à votre espace candidat.</p>
        </div>
        <Card>
        <CardHeader className="sr-only">
          <CardTitle>Profil</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="prenom">Prénom *</Label>
                <Input id="prenom" placeholder="Jean" {...register('prenom')} />
                {errors.prenom && (
                  <p className="text-xs text-destructive">{errors.prenom.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nom">Nom *</Label>
                <Input id="nom" placeholder="Dupont" {...register('nom')} />
                {errors.nom && (
                  <p className="text-xs text-destructive">{errors.nom.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="telephone">Téléphone</Label>
              <div className="flex gap-2">
                <select
                  {...register('indicatif')}
                  className="h-11 w-24 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {COUNTRY_CODES.map(({ code, flag, label }) => (
                    <option key={code} value={code} title={label}>
                      {flag} {code}
                    </option>
                  ))}
                </select>
                <Input
                  id="telephone"
                  placeholder="6 00 00 00 00"
                  className="flex-1"
                  {...register('telephone')}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="laboratoire">Laboratoire de rattachement *</Label>
              <Input
                id="laboratoire"
                placeholder="Ex : CNRS UMR 1234 — Institut Pasteur"
                {...register('laboratoire')}
              />
              {errors.laboratoire && (
                <p className="text-xs text-destructive">{errors.laboratoire.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bio">Présentation courte</Label>
              <Textarea
                id="bio"
                placeholder="Vos thématiques de recherche, vos publications récentes…"
                rows={4}
                {...register('bio')}
              />
            </div>

            {serverError && (
              <p className="text-sm text-destructive">{serverError}</p>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement…' : 'Accéder à mon espace'}
            </Button>

          </form>
        </CardContent>
        </Card>
      </div>
    </main>
  )
}
