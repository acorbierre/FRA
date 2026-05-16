'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Pencil } from 'lucide-react'

function resizeToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => {
      const img = new window.Image()
      img.src = e.target!.result as string
      img.onload = () => {
        const MAX = 1200
        const scale = Math.min(MAX / img.width, MAX / img.height, 1)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.88))
      }
      img.onerror = reject
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

interface Props {
  projetId: string
  titre: string
  initialPhotoUrl?: string
}

export default function ProjetPhotoUpload({ projetId, titre, initialPhotoUrl }: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(initialPhotoUrl)
  const [uploading, setUploading] = useState(false)

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const dataUrl = await resizeToBase64(file)
      const res = await fetch(`/api/gestion/projet/${projetId}/photo`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl }),
      })
      if (res.ok) {
        setPhotoUrl(dataUrl)
        router.refresh()
      }
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="relative rounded-2xl overflow-hidden bg-muted" style={{ height: 280 }}>
      {photoUrl ? (
        <Image src={photoUrl} alt={titre} fill className="object-cover" priority unoptimized />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/20 text-7xl font-bold select-none">
          {titre.charAt(0)}
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      {/* Bouton upload */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="absolute top-3 right-3 size-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors disabled:opacity-50 cursor-pointer"
      >
        <Pencil className="size-3.5" />
      </button>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
    </div>
  )
}
