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

const schema = z.object({
  prenom:      z.string().min(1, 'Prénom requis'),
  nom:         z.string().min(1, 'Nom requis'),
  telephone:   z.string().optional(),
  laboratoire: z.string().min(2, 'Laboratoire requis'),
  bio:         z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  email: string
  token: string
}

export default function RegisterForm({ email, token }: Props) {
  const router = useRouter()
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    setServerError('')
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, ...values }),
    })

    const data = await res.json()
    if (!res.ok) {
      setServerError(data.error ?? 'Une erreur est survenue.')
      return
    }

    router.push('/espace')
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Créer votre espace candidat</CardTitle>
        <CardDescription>
          Vous êtes invité(e) à rejoindre la plateforme avec l&apos;adresse{' '}
          <span className="font-medium text-foreground">{email}</span>.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
            <Input id="telephone" placeholder="+33 6 00 00 00 00" {...register('telephone')} />
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
            {isSubmitting ? 'Création du compte…' : 'Créer mon espace candidat'}
          </Button>

        </form>
      </CardContent>
    </Card>
  )
}
