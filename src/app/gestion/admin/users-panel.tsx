'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Chercheur } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Mail, UserPlus, CheckCircle2, AlertCircle, Loader2, Pencil, Trash2, X } from 'lucide-react'
import { rolePillClass, roleLabel } from '@/lib/role-colors'

const TABS = ['Admin', 'Comité scientifique', 'Candidats'] as const
type Tab = typeof TABS[number]

const ROLE_MAP: Record<Tab, string> = {
  'Admin': 'Admin',
  'Comité scientifique': 'Examinateur',
  'Candidats': 'Candidat',
}

interface Props { users: Chercheur[]; currentUserEmail: string; registeredEmails: Set<string> }

export default function UsersPanel({ users, currentUserEmail, registeredEmails }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('Admin')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showModal, setShowModal] = useState(false)
  const [editUser, setEditUser] = useState<Chercheur | null>(null)
  const [inviting, setInviting] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [invited, setInvited] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const filtered = users.filter(u =>
    tab === 'Admin'
      ? u.role.includes('Admin') || u.role.includes('Super-Admin')
      : u.role.includes(ROLE_MAP[tab])
  )
  const selectable = filtered.filter(u =>
    !u.role.includes('Super-Admin') &&
    u.email !== currentUserEmail
  )

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 4000)
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === selectable.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(selectable.map(u => u.id)))
    }
  }

  async function invite(emails: string[]) {
    const ids = filtered.filter(u => emails.includes(u.email)).map(u => u.id)
    setInviting(prev => new Set([...prev, ...ids]))
    try {
      const res = await fetch('/api/gestion/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      showToast('success', `${data.sent} invitation${data.sent > 1 ? 's' : ''} envoyée${data.sent > 1 ? 's' : ''}`)
      setInvited(prev => new Set([...prev, ...ids]))
      setSelected(new Set())
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : 'Erreur')
    } finally {
      setInviting(prev => {
        const next = new Set(prev)
        ids.forEach(id => next.delete(id))
        return next
      })
    }
  }

  async function deleteUser(id: string) {
    if (!confirm('Supprimer cet utilisateur ?')) return
    setDeleting(prev => new Set([...prev, id]))
    try {
      const res = await fetch(`/api/gestion/admin/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      showToast('success', 'Utilisateur supprimé')
      startTransition(() => router.refresh())
    } catch {
      showToast('error', 'Erreur lors de la suppression')
    } finally {
      setDeleting(prev => { const n = new Set(prev); n.delete(id); return n })
    }
  }

  async function deleteSelected() {
    if (!confirm(`Supprimer ${selected.size} utilisateur${selected.size > 1 ? 's' : ''} ?`)) return
    setBulkDeleting(true)
    try {
      await Promise.all(
        [...selected].map(id => fetch(`/api/gestion/admin/${id}`, { method: 'DELETE' }))
      )
      showToast('success', `${selected.size} utilisateur${selected.size > 1 ? 's' : ''} supprimé${selected.size > 1 ? 's' : ''}`)
      setSelected(new Set())
      startTransition(() => router.refresh())
    } catch {
      showToast('error', 'Erreur lors de la suppression')
    } finally {
      setBulkDeleting(false)
    }
  }

  const selectedEmails = filtered.filter(u => selected.has(u.id) && !registeredEmails.has(u.email)).map(u => u.email)

  return (
    <div className="space-y-4">
      {/* Tabs + action */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setSelected(new Set()) }}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                tab === t ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t} <span className="text-muted-foreground font-normal">
                ({t === 'Admin'
                  ? users.filter(u => u.role.includes('Admin') || u.role.includes('Super-Admin')).length
                  : users.filter(u => u.role.includes(ROLE_MAP[t])).length
                })
              </span>
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer"
        >
          <UserPlus className="size-4" />
          Ajouter un utilisateur
        </button>
      </div>

      {/* Bulk invite bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-lg">
          <span className="text-sm text-primary font-medium">{selected.size} utilisateur{selected.size > 1 ? 's' : ''} sélectionné{selected.size > 1 ? 's' : ''}</span>
          {selectedEmails.length > 0 && (
            <button
              onClick={() => invite(selectedEmails)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-primary/40 text-xs font-medium text-primary hover:border-primary transition-colors cursor-pointer"
            >
              <Mail className="size-3" />
              Inviter ({selectedEmails.length})
            </button>
          )}
          <button
            onClick={deleteSelected}
            disabled={bulkDeleting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-red-600/40 text-xs font-medium text-red-600 hover:border-red-600 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {bulkDeleting ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
            Supprimer ({selected.size})
          </button>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground p-6">Aucun utilisateur dans cette catégorie.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectable.length > 0 && selected.size === selectable.length}
                      onChange={toggleAll}
                      className="size-4 rounded border-zinc-300 cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nom</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Rôle</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(u.id)}
                        onChange={() => toggleSelect(u.id)}
                        disabled={u.role.includes('Super-Admin') || u.email === currentUserEmail}
                        className={`size-4 rounded border-zinc-300 cursor-pointer ${
                          u.role.includes('Super-Admin') || u.email === currentUserEmail ? 'opacity-0' : ''
                        }`}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium">{u.nomComplet}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3">
                      {(() => { const r = u.role.includes('Super-Admin') ? 'Super-Admin' : ROLE_MAP[tab]; return (
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${rolePillClass(r)}`}>{roleLabel(r)}</span>
                      )})()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {u.email === currentUserEmail ? (
                          <span className="px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-500 text-xs font-medium">Vous</span>
                        ) : u.role.includes('Super-Admin') ? (
                          <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">Super-Admin</span>
                        ) : (
                          <>
                            <button
                              onClick={() => setEditUser(u)}
                              className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors cursor-pointer"
                            >
                              <Pencil className="size-3.5" />
                            </button>
                            <button
                              onClick={() => deleteUser(u.id)}
                              disabled={deleting.has(u.id)}
                              className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-red-600 hover:border-red-300 transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              {deleting.has(u.id) ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                            </button>
                            {registeredEmails.has(u.email) ? (
                              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-100 text-zinc-500 text-xs font-medium">
                                <CheckCircle2 className="size-3" />
                                Inscrit(e)
                              </span>
                            ) : invited.has(u.id) ? (
                              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-green-100 text-green-700 text-xs font-medium">
                                <CheckCircle2 className="size-3" />
                                Invité(e)
                              </span>
                            ) : (
                              <button
                                onClick={() => invite([u.email])}
                                disabled={inviting.has(u.id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors disabled:opacity-50 cursor-pointer"
                              >
                                {inviting.has(u.id) ? <Loader2 className="size-3 animate-spin" /> : <Mail className="size-3" />}
                                Inviter
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium z-50 ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}
          {toast.msg}
        </div>
      )}

      {showModal && (
        <AddUserModal
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); startTransition(() => router.refresh()) }}
        />
      )}
      {editUser && (
        <EditUserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSaved={() => { setEditUser(null); startTransition(() => router.refresh()) }}
        />
      )}
    </div>
  )
}

function EditUserModal({ user, onClose, onSaved }: { user: Chercheur; onClose: () => void; onSaved: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    prenom: user.prenom,
    nom: user.nom,
    email: user.email,
    role: user.role[0] ?? 'Candidat',
  })

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/gestion/admin/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-5">
        <h2 className="font-heading text-lg font-semibold">Modifier l'utilisateur</h2>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Prénom</label>
              <input required value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Nom</label>
              <input required value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Email</label>
            <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Rôle</label>
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="Examinateur">Comité scientifique</option>
              <option value="Admin">Admin</option>
              <option value="Candidat">Candidat</option>
            </select>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
              {loading && <Loader2 className="size-3.5 animate-spin" />}
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AddUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ prenom: '', nom: '', email: '', role: 'Examinateur' })

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/gestion/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onCreated()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-5">
        <h2 className="font-heading text-lg font-semibold">Ajouter un utilisateur</h2>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Prénom</label>
              <input
                required
                value={form.prenom}
                onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Nom</label>
              <input
                required
                value={form.nom}
                onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Email</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Rôle</label>
            <select
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="Examinateur">Comité scientifique</option>
              <option value="Admin">Admin</option>
              <option value="Candidat">Candidat</option>
            </select>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading && <Loader2 className="size-3.5 animate-spin" />}
              Créer le profil
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
