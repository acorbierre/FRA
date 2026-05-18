'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { FIELD_LABELS } from '@/lib/config'
import type { Candidature } from '@/types'
import type { Thematique } from '@/services/neon/thematiques'

const schema = z.object({
  titre:         z.string().min(3, 'Titre requis (3 caractères minimum)'),
  thematiqueId:  z.coerce.number().min(1, 'Thématique requise'),
  resume:        z.string().min(50, 'Résumé requis (50 caractères minimum)').max(500, '500 caractères maximum'),
  description:   z.string().min(100, 'Description requise (100 caractères minimum)'),
  budgetDemande: z.coerce.number().positive('Budget requis'),
  dureeMois:     z.coerce.number().int().min(1).max(60, 'Durée max : 60 mois'),
  partenaires:   z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const STEPS = ['Présentation', 'Détails', 'Récapitulatif']

interface Props {
  candidatureId: string
  defaultValues?: Partial<Candidature>
  thematiques: Thematique[]
}

export default function CandidatureForm({ candidatureId, defaultValues, thematiques }: Props) {
  const [step, setStep] = useState(0)
  const [serverError, setServerError] = useState('')
  const [saved, setSaved] = useState(false)

  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    mode: 'onTouched',
    defaultValues: {
      titre:         defaultValues?.titre         ?? '',
      thematiqueId:  defaultValues?.thematiqueId  ?? 0,
      resume:        defaultValues?.resume        ?? '',
      description:   defaultValues?.description   ?? '',
      budgetDemande: defaultValues?.budgetDemande ?? undefined,
      dureeMois:     defaultValues?.dureeMois     ?? undefined,
      partenaires:   defaultValues?.partenaires   ?? '',
    },
  })

  const watchedValues = watch()
  useEffect(() => {
    if (step === 2) return
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    autosaveTimer.current = setTimeout(() => {
      saveDraft(getValues())
    }, 2000)
    return () => { if (autosaveTimer.current) clearTimeout(autosaveTimer.current) }
  }, [watchedValues, step]) // eslint-disable-line react-hooks/exhaustive-deps

  async function saveDraft(data: Partial<FormValues>) {
    await fetch(`/api/candidature/${candidatureId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function goNext() {
    const fields: (keyof FormValues)[] = step === 0
      ? ['titre', 'thematiqueId', 'resume']
      : ['description', 'budgetDemande', 'dureeMois']
    const valid = await trigger(fields)
    if (valid) {
      await saveDraft(getValues())
      setStep(s => s + 1)
    }
  }

  async function onSubmit(values: FormValues) {
    setServerError('')
    const res = await fetch(`/api/candidature/${candidatureId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...values,
        statut: 'Soumise',
        dateSoumission: new Date().toISOString().slice(0, 10),
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setServerError(data.error ?? 'Une erreur est survenue.')
      return
    }
    window.location.assign('/espace/candidature')
  }

  const values = getValues()

  return (
    <div className="max-w-2xl space-y-6">

      {/* Header */}
      <div>
        <h1 className="page-title">Nouvelle candidature</h1>
        <p className="page-subtitle">Appel à projets {new Date().getFullYear()}</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center">
            <div className="flex items-center gap-2">
              <div className={[
                'size-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors',
                i < step  ? 'bg-primary border-primary text-primary-foreground'
                : i === step ? 'border-primary text-primary bg-background'
                : 'border-border text-muted-foreground bg-background',
              ].join(' ')}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={[
                'text-sm',
                i === step ? 'font-medium text-foreground' : 'text-muted-foreground',
              ].join(' ')}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={['mx-3 h-px w-12 transition-colors', i < step ? 'bg-primary' : 'bg-border'].join(' ')} />
            )}
          </div>
        ))}

        {saved && (
          <span className="ml-auto text-xs text-muted-foreground">Brouillon sauvegardé ✓</span>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* Step 0 — Présentation */}
            {step === 0 && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="titre">Titre du projet *</Label>
                  <Input
                    id="titre"
                    placeholder="Ex : Rôle des microbiotes dans les maladies inflammatoires"
                    {...register('titre')}
                  />
                  {errors.titre && <p className="text-xs text-destructive">{errors.titre.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="thematiqueId">Domaine de recherche *</Label>
                  <select
                    id="thematiqueId"
                    {...register('thematiqueId')}
                    className="w-full h-11 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value={0}>Sélectionner une thématique…</option>
                    {thematiques.map(t => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                  {errors.thematiqueId && <p className="text-xs text-destructive">{errors.thematiqueId.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="resume">
                    Résumé *
                    <span className="ml-1.5 text-xs text-muted-foreground font-normal">500 caractères max</span>
                  </Label>
                  <Textarea
                    id="resume"
                    placeholder="Présentez votre projet en quelques phrases accessibles à un lecteur non spécialiste…"
                    rows={4}
                    {...register('resume')}
                  />
                  {errors.resume && <p className="text-xs text-destructive">{errors.resume.message}</p>}
                </div>

                <div className="flex justify-end">
                  <Button type="button" onClick={goNext}>Suivant</Button>
                </div>
              </>
            )}

            {/* Step 1 — Détails */}
            {step === 1 && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="description">Description détaillée *</Label>
                  <Textarea
                    id="description"
                    placeholder="Objectifs scientifiques, méthodologie, livrables attendus, impact prévu…"
                    rows={7}
                    {...register('description')}
                  />
                  {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="budgetDemande">Budget demandé (€) *</Label>
                    <Input
                      id="budgetDemande"
                      type="number"
                      min={0}
                      step={500}
                      placeholder="15000"
                      {...register('budgetDemande')}
                    />
                    {errors.budgetDemande && <p className="text-xs text-destructive">{errors.budgetDemande.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="dureeMois">Durée (mois) *</Label>
                    <Input
                      id="dureeMois"
                      type="number"
                      min={1}
                      max={60}
                      placeholder="24"
                      {...register('dureeMois')}
                    />
                    {errors.dureeMois && <p className="text-xs text-destructive">{errors.dureeMois.message}</p>}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="partenaires">
                    Partenaires
                    <span className="ml-1.5 text-xs text-muted-foreground font-normal">optionnel</span>
                  </Label>
                  <Textarea
                    id="partenaires"
                    placeholder="Institutions, laboratoires ou entreprises partenaires impliqués dans le projet…"
                    rows={3}
                    {...register('partenaires')}
                  />
                </div>

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setStep(0)}>Retour</Button>
                  <Button type="button" onClick={goNext}>Suivant</Button>
                </div>
              </>
            )}

            {/* Step 2 — Récapitulatif */}
            {step === 2 && (
              <>
                <div className="space-y-4 text-sm">
                  <Recap label={FIELD_LABELS.titre} value={values.titre} />
                  <Recap label={FIELD_LABELS.thematique} value={thematiques.find(t => t.id === Number(values.thematiqueId))?.label ?? '—'} />
                  <Recap label={FIELD_LABELS.resume} value={values.resume} multiline />
                  <Recap label={FIELD_LABELS.description} value={values.description} multiline />
                  <div className="grid grid-cols-2 gap-4">
                    <Recap label={FIELD_LABELS.budgetDemande} value={`${Number(values.budgetDemande).toLocaleString('fr-FR')} €`} />
                    <Recap label={FIELD_LABELS.dureeMois} value={`${values.dureeMois} mois`} />
                  </div>
                  {values.partenaires && <Recap label={FIELD_LABELS.partenaires} value={values.partenaires} multiline />}
                </div>

                {serverError && <p className="text-sm text-destructive">{serverError}</p>}

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setStep(1)}>Retour</Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Envoi en cours…' : 'Soumettre ma candidature'}
                  </Button>
                </div>
              </>
            )}

          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function Recap({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={multiline ? 'whitespace-pre-wrap text-foreground' : 'text-foreground'}>{value}</p>
    </div>
  )
}
