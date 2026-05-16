'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Pencil, X, Check, UserRoundPen } from 'lucide-react'
import Image from 'next/image'
import { rolePillClass, roleLabel } from '@/lib/role-colors'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import type { Chercheur } from '@/types'

const schema = z.object({
  prenom:      z.string().min(1, 'Requis'),
  nom:         z.string().min(1, 'Requis'),
  telephone:   z.string().optional(),
  laboratoire: z.string().min(2, 'Requis'),
  bio:         z.string().optional(),
})

type FormValues = z.infer<typeof schema>

function resizeToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => {
      const img = new window.Image()
      img.src = e.target!.result as string
      img.onload = () => {
        const MAX = 300
        const scale = Math.min(MAX / img.width, MAX / img.height, 1)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.onerror = reject
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function ProfileEditor({ chercheur }: { chercheur: Chercheur }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [serverError, setServerError] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(chercheur.photo?.[0]?.url)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPhoto(true)
    try {
      const dataUrl = await resizeToBase64(file)
      const res = await fetch('/api/chercheur/photo', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl }),
      })
      if (res.ok) {
        setPhotoUrl(dataUrl)
        router.refresh()
      }
    } finally {
      setUploadingPhoto(false)
      e.target.value = ''
    }
  }

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: {
        prenom:      chercheur.prenom,
        nom:         chercheur.nom,
        telephone:   chercheur.telephone ?? '',
        laboratoire: chercheur.laboratoireDeclaratif ?? '',
        bio:         chercheur.bio ?? '',
      },
    })

  function handleCancel() {
    reset()
    setEditing(false)
    setServerError('')
  }

  async function onSubmit(values: FormValues) {
    setServerError('')
    const res = await fetch('/api/chercheur/profil', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    if (!res.ok) {
      const data = await res.json()
      setServerError(data.error ?? 'Erreur serveur.')
      return
    }
    setEditing(false)
    router.refresh()
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Informations</CardTitle>
        {!editing && (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="size-3.5 mr-1.5" /> Modifier
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div
            onClick={() => !uploadingPhoto && fileInputRef.current?.click()}
            className={`relative size-20 rounded-full bg-muted flex items-center justify-center overflow-hidden group shrink-0 ${uploadingPhoto ? 'opacity-60' : 'cursor-pointer'}`}
          >
            {photoUrl ? (
              <Image src={photoUrl} alt="avatar" width={80} height={80} className="object-cover" unoptimized />
            ) : (
              <UserRoundPen className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-[calc(50%-3px)] size-8 text-muted-foreground group-hover:text-foreground transition-colors" />
            )}
            {photoUrl && (
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <UserRoundPen className="size-6 text-white" />
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          <div>
            <p className="font-medium text-sm">{chercheur.nomComplet}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{chercheur.email}</p>
          </div>
        </div>

        {editing ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Prénom *</Label>
                <Input {...register('prenom')} />
                {errors.prenom && <p className="text-xs text-destructive">{errors.prenom.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Nom *</Label>
                <Input {...register('nom')} />
                {errors.nom && <p className="text-xs text-destructive">{errors.nom.message}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={chercheur.email} disabled className="opacity-60" />
            </div>
            <div className="space-y-1.5">
              <Label>Téléphone</Label>
              <Input {...register('telephone')} placeholder="+33 6 00 00 00 00" />
            </div>
            <div className="space-y-1.5">
              <Label>Laboratoire *</Label>
              <Input {...register('laboratoire')} />
              {errors.laboratoire && <p className="text-xs text-destructive">{errors.laboratoire.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Présentation</Label>
              <Textarea {...register('bio')} rows={4} />
            </div>
            {serverError && <p className="text-sm text-destructive">{serverError}</p>}
            <div className="flex gap-2 pt-1">
              <Button type="submit" size="sm" disabled={isSubmitting}>
                <Check className="size-3.5 mr-1.5" />
                {isSubmitting ? 'Enregistrement…' : 'Enregistrer'}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handleCancel}>
                <X className="size-3.5 mr-1.5" /> Annuler
              </Button>
            </div>
          </form>
        ) : (
          <dl className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-muted-foreground">Nom complet</dt>
                <dd className="font-medium mt-0.5">{chercheur.nomComplet}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Email</dt>
                <dd className="font-medium mt-0.5">{chercheur.email}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Téléphone</dt>
                <dd className="font-medium mt-0.5">{chercheur.telephone || '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Rôle</dt>
                <dd className="flex gap-1 flex-wrap mt-0.5">
                  {chercheur.role.map(r => (
                    <span key={r} className={`text-xs px-2.5 py-1 rounded-full font-medium ${rolePillClass(r)}`}>
                      {roleLabel(r)}
                    </span>
                  ))}
                </dd>
              </div>
            </div>
            <div>
              <dt className="text-muted-foreground">Laboratoire</dt>
              <dd className="font-medium mt-0.5">{chercheur.laboratoireDeclaratif || '—'}</dd>
            </div>
            {chercheur.bio && (
              <div>
                <dt className="text-muted-foreground">Présentation</dt>
                <dd className="mt-0.5">{chercheur.bio}</dd>
              </div>
            )}
          </dl>
        )}
      </CardContent>
    </Card>
  )
}
