'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, X, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Notification } from '@/services/neon/notifications'

const TYPE_LABELS: Record<string, string> = {
  candidature_soumise:  'Candidature reçue',
  evaluation_transmise: 'Évaluation transmise',
}

function getNotifUrl(n: Pick<Notification, 'candidatureId' | 'type'>): string | null {
  if (!n.candidatureId) return null
  const tab = n.type === 'evaluation_transmise' ? '?tab=evaluation' : ''
  return `/gestion/candidatures/${n.candidatureId}${tab}`
}

const TOAST_SESSION_KEY = 'notif_last_toasted'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const min  = Math.floor(diff / 60_000)
  const h    = Math.floor(diff / 3_600_000)
  const d    = Math.floor(diff / 86_400_000)
  if (min < 1)  return "à l'instant"
  if (min < 60) return `il y a ${min} min`
  if (h   < 24) return `il y a ${h}h`
  return `il y a ${d}j`
}

function Avatar({ url }: { url: string | null; fallback?: string }) {
  if (url) return <img src={url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
  return (
    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
      <User className="size-4 text-muted-foreground" />
    </div>
  )
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open,  setOpen]  = useState(false)
  const [toast, setToast] = useState<Notification | null>(null)
  const ref        = useRef<HTMLDivElement>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const unread = notifications.filter(n => !n.read).length

  useEffect(() => {
    fetch('/api/gestion/notifications')
      .then(r => r.json())
      .then((data: Notification[]) => {
        if (!Array.isArray(data)) return
        setNotifications(data)

        // Toast : affiche la dernière notif non lue si pas déjà vue cette session
        const latest = data.find(n => !n.read)
        if (latest) {
          const lastToasted = sessionStorage.getItem(TOAST_SESSION_KEY)
          if (lastToasted !== latest.id) {
            sessionStorage.setItem(TOAST_SESSION_KEY, latest.id)
            setToast(latest)
            toastTimer.current = setTimeout(() => setToast(null), 5000)
          }
        }
      })
      .catch(() => {})
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current) }
  }, [])

  // Ferme le dropdown au clic extérieur
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function handleOpen() {
    setOpen(o => !o)
    if (!open && unread > 0) {
      fetch('/api/gestion/notifications', { method: 'PATCH' }).catch(() => {})
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    }
  }

  function dismissToast() {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(null)
  }

  return (
    <>
      {/* Cloche */}
      <div className="relative inline-flex items-center" ref={ref}>
        <button
          onClick={handleOpen}
          className="relative text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          title="Notifications"
        >
          <Bell className="size-4" />
          {unread > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center px-0.5 leading-none">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-96 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <span className="text-sm font-semibold font-heading">Notifications</span>
              {notifications.length > 0 && (
                <span className="text-xs text-muted-foreground">{notifications.length} au total</span>
              )}
            </div>

            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground text-center">Aucune notification</p>
            ) : (
              <ul className="max-h-80 overflow-y-auto divide-y divide-border">
                {notifications.map(n => (
                  <li key={n.id} className={cn('px-4 py-3', !n.read && 'bg-primary/5')}>
                    {getNotifUrl(n) ? (
                      <a href={getNotifUrl(n)!} className="flex items-start gap-3 hover:opacity-70 transition-opacity" onClick={() => setOpen(false)}>
                        <NotifRow n={n} />
                      </a>
                    ) : (
                      <div className="flex items-start gap-3"><NotifRow n={n} /></div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (() => {
        const toastUrl = getNotifUrl(toast)
        const toastContent = (
          <>
            <div className="flex items-start gap-3 px-4 py-3.5">
              <Avatar url={toast.avatarUrl} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-primary mb-0.5">{TYPE_LABELS[toast.type] ?? toast.type}</p>
                <p className="text-sm text-foreground leading-snug line-clamp-2">{toast.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{timeAgo(toast.createdAt)}</p>
              </div>
              <button onClick={e => { e.preventDefault(); e.stopPropagation(); dismissToast() }} className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex-shrink-0 mt-0.5">
                <X className="size-3.5" />
              </button>
            </div>
            <div className="h-0.5 bg-primary/20">
              <div className="h-full bg-primary origin-left animate-[shrink_5s_linear_forwards]" />
            </div>
          </>
        )
        return toastUrl ? (
          <a href={toastUrl} onClick={dismissToast} className="fixed top-[72px] right-6 z-50 w-96 bg-card border border-border rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-top-2 fade-in duration-300 hover:shadow-2xl transition-shadow block">
            {toastContent}
          </a>
        ) : (
          <div className="fixed top-[72px] right-6 z-50 w-96 bg-card border border-border rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-top-2 fade-in duration-300">
            {toastContent}
          </div>
        )
      })()}
    </>
  )
}

function NotifRow({ n }: { n: Notification }) {
  return (
    <>
      <Avatar url={n.avatarUrl} fallback={n.type === 'candidature_soumise' ? 'C' : 'E'} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground leading-snug">{n.message}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{TYPE_LABELS[n.type] ?? n.type} · {timeAgo(n.createdAt)}</p>
      </div>
    </>
  )
}
