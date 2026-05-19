import { auth, clerkClient } from '@clerk/nextjs/server'
import { getChercheurByEmail } from '@/services/neon/chercheurs'
import { getAllCandidatures } from '@/services/neon/candidatures'
import { getProjets } from '@/services/neon/projets'
import { getRapportsAttendus, getRapports } from '@/services/neon/rapports'
import { getConventions } from '@/services/neon/conventions'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { APPEL_ANNEE } from '@/lib/config'
import { FileText, AlertTriangle, Folder, Euro } from 'lucide-react'
import WeekCalendar, { type CalendarEvent } from '@/components/gestion/week-calendar'

function getWeekRange() {
  const now = new Date()
  const day = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return { monday, sunday }
}

function isThisWeek(dateStr?: string, monday?: Date, sunday?: Date): boolean {
  if (!dateStr || !monday || !sunday) return false
  const d = new Date(dateStr)
  return d >= monday && d <= sunday
}

export default async function GestionPage() {
  const { userId } = await auth()
  const client = await clerkClient()
  const clerkUser = await client.users.getUser(userId!)
  const email = clerkUser.emailAddresses[0]?.emailAddress
  const chercheur = email ? await getChercheurByEmail(email) : null
  const prenom = chercheur?.prenom ?? clerkUser.firstName ?? 'vous'

  const [candidatures, projets, rapportsAttendus, conventions, tousRapports] = await Promise.all([
    getAllCandidatures(),
    getProjets(),
    getRapportsAttendus(),
    getConventions(),
    getRapports(),
  ])

  const totalRecues    = candidatures.filter(c => c.statut !== 'Brouillon').length
  const soumises       = candidatures.filter(c => c.statut === 'Soumise').length
  const enEvaluation   = candidatures.filter(c => c.statut === 'En évaluation').length
  const projetsEnCours = projets.filter(p => p.statut === 'En cours').length
  const budgetEngage   = conventions
    .filter(c => c.statut === 'En cours')
    .reduce((s, c) => s + (c.montantTotal ?? 0), 0)

  // Calendrier cette semaine
  const { monday, sunday } = getWeekRange()

  const calendarEvents: CalendarEvent[] = []
  for (const r of tousRapports) {
    if (isThisWeek(r.dateAttendue, monday, sunday)) {
      calendarEvents.push({ date: r.dateAttendue!, label: `${r.type} attendu`, type: 'rapport' })
    }
  }
  for (const p of projets) {
    if (isThisWeek(p.dateDebut, monday, sunday)) {
      calendarEvents.push({ date: p.dateDebut!, label: `Démarrage — ${p.titreCourt ?? p.titre}`, type: 'projet-debut' })
    }
    if (isThisWeek(p.dateFinPrevue, monday, sunday)) {
      calendarEvents.push({ date: p.dateFinPrevue!, label: `Fin — ${p.titreCourt ?? p.titre}`, type: 'projet-fin' })
    }
  }
  for (const c of conventions) {
    if (isThisWeek(c.dateSignature, monday, sunday)) {
      calendarEvents.push({ date: c.dateSignature!, label: `Convention ${c.numeroConvention}`, type: 'convention' })
    }
  }

  // Build weekDays array server-side (no hydration issues)
  const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return {
      dateStr: d.toISOString().slice(0, 10),
      dayName: DAY_NAMES[i],
      dayNum: d.getDate(),
    }
  })
  const todayStr = new Date().toISOString().slice(0, 10)

  const kpis = [
    { label: 'Candidatures soumises', value: soumises,      sub: `${totalRecues} reçues · ${enEvaluation} en évaluation`, icon: FileText,      color: 'text-blue-600 bg-blue-50', hasNotif: soumises > 0, href: '/gestion/candidatures' },
    { label: 'Rapports non reçus',    value: rapportsAttendus.length, sub: 'Statut "Attendu"',   icon: AlertTriangle,  color: 'text-amber-600 bg-amber-50' },
    { label: 'Projets en gestion',    value: projetsEnCours, sub: `${projets.length} au total`,  icon: Folder,         color: 'text-green-600 bg-green-50' },
    { label: 'Budget engagé',         value: budgetEngage.toLocaleString('fr-FR') + ' €', sub: 'Conventions actives', icon: Euro, color: 'text-primary bg-primary/10' },
  ]

  return (
    <div className="max-w-5xl space-y-8">

      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Bonjour, {prenom}</h1>
        <p className="text-muted-foreground mt-1">Portail de gestion — Appel à projets {APPEL_ANNEE}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map(({ label, value, sub, icon: Icon, color, hasNotif, href }) => {
          const card = (
            <Card key={label} className={href ? 'hover:shadow-[0_0_24px_rgba(0,0,0,0.13)] transition-shadow' : ''}>
              <CardContent className="pt-2 space-y-3">
                <div className={`size-9 rounded-lg flex items-center justify-center ${color}`}>
                  <Icon className={`size-4 ${hasNotif ? 'animate-bounce' : ''}`} />
                </div>
                <div>
                  <p className="text-2xl font-semibold tracking-tight">{value}</p>
                  <p className="text-sm font-medium text-foreground mt-0.5">{label}</p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
              </CardContent>
            </Card>
          )
          return href
            ? <Link key={label} href={href}>{card}</Link>
            : card
        })}
      </div>

      {/* Calendrier cette semaine */}
      <WeekCalendar weekDays={weekDays} todayStr={todayStr} events={calendarEvents} moreHref="/gestion/projets/agenda" />

    </div>
  )
}
