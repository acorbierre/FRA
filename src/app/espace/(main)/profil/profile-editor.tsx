'use client'

import { useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Pencil, X, Check, UserRoundPen, Map } from 'lucide-react'
import Image from 'next/image'
import { rolePillClass, roleLabel } from '@/lib/role-colors'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import type { Utilisateur } from '@/types'

const schema = z.object({
  prenom:      z.string().min(1, 'Requis'),
  nom:         z.string().min(1, 'Requis'),
  telephone:   z.string().optional(),
  ville:       z.string().optional(),
  laboratoire: z.string().min(2, 'Requis'),
  bio:         z.string().optional(),
})

type FormValues = z.infer<typeof schema>
interface LaboSuggestion { id: string; nom: string; ville: string }

export default function ProfileEditor({ utilisateur }: { utilisateur: Utilisateur }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [serverError, setServerError] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(utilisateur.photo?.[0]?.url)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Autocomplete labo
  const [villeInput, setVilleInput]         = useState(utilisateur.ville ?? '')
  const [laboInput, setLaboInput]           = useState(utilisateur.laboratoireDeclaratif ?? '')
  const [suggestions, setSuggestions]       = useState<LaboSuggestion[]>([])
  const [selectedLabo, setSelectedLabo]     = useState<LaboSuggestion | null>(
    utilisateur.carteLabId ? { id: utilisateur.carteLabId, nom: utilisateur.laboratoireDeclaratif ?? '', ville: '' } : null
  )
  const [showDropdown, setShowDropdown]     = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPhoto(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/utilisateur/photo', { method: 'PATCH', body: form })
      if (res.ok) {
        const { url } = await res.json()
        setPhotoUrl(url)
      }
    } finally {
      setUploadingPhoto(false)
      e.target.value = ''
    }
  }

  function handleLaboInputChange(value: string) {
    setLaboInput(value)
    setSelectedLabo(null)
    setValue('laboratoire', value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (value.length < 2) { setSuggestions([]); setShowDropdown(false); return }
    debounceRef.current = setTimeout(async () => {
      const params = new URLSearchParams({ q: value })
      if (villeInput.length > 1) params.set('ville', villeInput)
      const res = await fetch(`/api/labos/search?${params}`)
      const data: LaboSuggestion[] = await res.json()
      setSuggestions(data)
      setShowDropdown(true)
    }, 300)
  }

  function handleSelectLabo(labo: LaboSuggestion) {
    setSelectedLabo(labo)
    setLaboInput(labo.nom)
    setValue('laboratoire', labo.nom)
    setShowDropdown(false)
    setSuggestions([])
  }

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: {
        prenom:      utilisateur.prenom,
        nom:         utilisateur.nom,
        telephone:   utilisateur.telephone ?? '',
        ville:       utilisateur.ville ?? '',
        laboratoire: utilisateur.laboratoireDeclaratif ?? '',
        bio:         utilisateur.bio ?? '',
      },
    })

  function handleCancel() {
    reset()
    setLaboInput(utilisateur.laboratoireDeclaratif ?? '')
    setVilleInput(utilisateur.ville ?? '')
    setSelectedLabo(utilisateur.carteLabId ? { id: utilisateur.carteLabId, nom: utilisateur.laboratoireDeclaratif ?? '', ville: '' } : null)
    setEditing(false)
    setServerError('')
  }

  async function onSubmit(values: FormValues) {
    setServerError('')
    const res = await fetch('/api/utilisateur/profil', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...values, carteLabId: selectedLabo?.id ?? null }),
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
            <p className="font-medium text-sm">{utilisateur.nomComplet}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{utilisateur.email}</p>
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
              <Input value={utilisateur.email} disabled className="opacity-60" />
            </div>
            <div className="space-y-1.5">
              <Label>Téléphone</Label>
              <Input {...register('telephone')} placeholder="+33 6 00 00 00 00" />
            </div>
            <div className="space-y-1.5">
              <Label>Ville</Label>
              <Input
                {...register('ville', {
                  onChange: e => {
                    setVilleInput(e.target.value)
                    if (selectedLabo) {
                      setSelectedLabo(null)
                      setLaboInput('')
                      setValue('laboratoire', '')
                    }
                  },
                })}
                placeholder="Paris"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Laboratoire *</Label>
              <div className="relative" ref={dropdownRef}>
                <div className="relative">
                  <Input
                    placeholder="Tapez le nom de votre laboratoire…"
                    value={laboInput}
                    onChange={e => handleLaboInputChange(e.target.value)}
                    onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
                    autoComplete="off"
                    className={selectedLabo ? 'pr-8' : ''}
                  />
                  {selectedLabo && (
                    <Check className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-primary" />
                  )}
                </div>
                {showDropdown && suggestions.length > 0 && (
                  <div className="absolute z-50 top-full mt-1 w-full bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                    {suggestions.map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleSelectLabo(s)}
                        className="w-full text-left px-3 py-2.5 text-sm hover:bg-muted transition-colors border-b border-border last:border-0"
                      >
                        <span className="font-medium">{s.nom}</span>
                        <span className="text-xs text-muted-foreground ml-2">{s.ville}</span>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => { setSelectedLabo(null); setShowDropdown(false) }}
                      className="w-full text-left px-3 py-2.5 text-xs text-muted-foreground hover:bg-muted transition-colors"
                    >
                      Mon laboratoire n'est pas dans la liste
                    </button>
                  </div>
                )}
                {showDropdown && suggestions.length === 0 && laboInput.length >= 2 && (
                  <div className="absolute z-50 top-full mt-1 w-full bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                    <div className="px-3 py-2.5 text-sm text-muted-foreground">Aucun résultat</div>
                  </div>
                )}
              </div>
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
                <dd className="font-medium mt-0.5">{utilisateur.nomComplet}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Email</dt>
                <dd className="font-medium mt-0.5">{utilisateur.email}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Téléphone</dt>
                <dd className="font-medium mt-0.5">{utilisateur.telephone || '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Rôle</dt>
                <dd className="flex gap-1 flex-wrap mt-0.5">
                  {utilisateur.role.map(r => (
                    <span key={r} className={`text-xs px-2.5 py-1 rounded-full font-medium ${rolePillClass(r)}`}>
                      {roleLabel(r)}
                    </span>
                  ))}
                </dd>
              </div>
              {utilisateur.ville && (
                <div>
                  <dt className="text-muted-foreground">Ville</dt>
                  <dd className="font-medium mt-0.5">{utilisateur.ville}</dd>
                </div>
              )}
            </div>
            <div>
              <dt className="text-muted-foreground">Laboratoire</dt>
              <dd className="font-medium mt-0.5 flex items-center gap-2">
                {utilisateur.laboratoireDeclaratif || '—'}
                {utilisateur.carteLabId && (
                  <a
                    href={`/carto?lab=${utilisateur.carteLabId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <Map className="size-3" /> Voir sur la carte
                  </a>
                )}
              </dd>
            </div>
            {utilisateur.bio && (
              <div>
                <dt className="text-muted-foreground">Présentation</dt>
                <dd className="mt-0.5 whitespace-pre-wrap">{utilisateur.bio}</dd>
              </div>
            )}
          </dl>
        )}
      </CardContent>
    </Card>
  )
}
