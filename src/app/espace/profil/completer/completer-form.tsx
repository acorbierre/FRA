'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  prenom:      z.string().min(1, 'Prénom requis'),
  nom:         z.string().min(1, 'Nom requis'),
  indicatif:   z.string().min(1),
  telephone:   z.string().optional(),
  ville:       z.string().min(1, 'Ville requise'),
  laboratoire: z.string().min(2, 'Laboratoire requis'),
  bio:         z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface LaboSuggestion { id: string; nom: string; ville: string }

interface Props { prenom?: string; nom?: string }

export default function CompleterProfilForm({ prenom, nom }: Props) {
  const router = useRouter()
  const [serverError, setServerError] = useState('')

  // Autocomplete labo
  const [villeInput, setVilleInput]         = useState('')
  const [laboInput, setLaboInput]           = useState('')
  const [suggestions, setSuggestions]       = useState<LaboSuggestion[]>([])
  const [selectedLabo, setSelectedLabo]     = useState<LaboSuggestion | null>(null)
  const [showDropdown, setShowDropdown]     = useState(false)
  const [laboNotFound, setLaboNotFound]     = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { indicatif: '+33', prenom: prenom ?? '', nom: nom ?? '' },
  })

  // Fermer dropdown au clic extérieur
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleLaboInputChange(value: string) {
    setLaboInput(value)
    setSelectedLabo(null)
    setLaboNotFound(false)
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

  function handleLaboNotFound() {
    setLaboNotFound(true)
    setSelectedLabo(null)
    setShowDropdown(false)
  }

  async function onSubmit(values: FormValues) {
    setServerError('')
    const telephone = values.telephone
      ? `${values.indicatif} ${values.telephone}`
      : undefined

    const res = await fetch('/api/auth/complete-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...values,
        telephone,
        carteLabId: selectedLabo?.id ?? null,
      }),
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
              {errors.prenom && <p className="text-xs text-destructive">{errors.prenom.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nom">Nom *</Label>
              <Input id="nom" placeholder="Dupont" {...register('nom')} />
              {errors.nom && <p className="text-xs text-destructive">{errors.nom.message}</p>}
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
            <Label htmlFor="ville">Ville *</Label>
            <Input
              id="ville"
              placeholder="Paris"
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
            />
            {errors.ville && <p className="text-xs text-destructive">{errors.ville.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="laboratoire">Laboratoire de rattachement *</Label>
            <div className="relative" ref={dropdownRef}>
              <div className="relative">
                <Input
                  id="laboratoire"
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
              {laboNotFound && (
                <p className="text-xs text-muted-foreground mt-1">
                  Laboratoire saisi manuellement — ne figurera pas sur la carte.
                </p>
              )}
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
                    onClick={handleLaboNotFound}
                    className="w-full text-left px-3 py-2.5 text-xs text-muted-foreground hover:bg-muted transition-colors"
                  >
                    Mon laboratoire n'est pas dans la liste
                  </button>
                </div>
              )}
              {showDropdown && suggestions.length === 0 && laboInput.length >= 2 && (
                <div className="absolute z-50 top-full mt-1 w-full bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                  <div className="px-3 py-2.5 text-sm text-muted-foreground">Aucun résultat</div>
                  <button
                    type="button"
                    onClick={handleLaboNotFound}
                    className="w-full text-left px-3 py-2.5 text-xs text-muted-foreground hover:bg-muted transition-colors border-t border-border"
                  >
                    Mon laboratoire n'est pas dans la liste
                  </button>
                </div>
              )}
            </div>
            {errors.laboratoire && <p className="text-xs text-destructive">{errors.laboratoire.message}</p>}
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
  )
}
