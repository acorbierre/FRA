'use client'

import { LogOut, User } from 'lucide-react'
import { useClerk } from '@clerk/nextjs'
import Image from 'next/image'

export default function AppSidebarSignout({ photoUrl }: { photoUrl?: string }) {
  const { signOut } = useClerk()

  return (
    <div className="px-3 py-3 border-t border-border shrink-0">
      <button
        onClick={() => signOut({ redirectUrl: '/sign-in' })}
        className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
      >
        <div className="size-8 rounded-full bg-muted border border-border overflow-hidden shrink-0 flex items-center justify-center">
          {photoUrl ? (
            <Image src={photoUrl} alt="avatar" width={32} height={32} className="object-cover" />
          ) : (
            <User className="size-4" />
          )}
        </div>
        Déconnexion
        <LogOut className="size-4 shrink-0 ml-auto" />
      </button>
    </div>
  )
}
