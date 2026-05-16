'use client'

import { LogOut, User } from 'lucide-react'
import { useClerk, useUser } from '@clerk/nextjs'
import Image from 'next/image'

export default function AppSidebarSignout() {
  const { signOut } = useClerk()
  const { user } = useUser()

  return (
    <div className="px-3 py-3 border-t border-border shrink-0">
      <button
        onClick={() => signOut({ redirectUrl: '/sign-in' })}
        className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
      >
        <div className="size-6 rounded-full bg-muted border border-border overflow-hidden shrink-0 flex items-center justify-center">
          {user?.imageUrl ? (
            <Image src={user.imageUrl} alt="avatar" width={24} height={24} className="object-cover" />
          ) : (
            <User className="size-3.5" />
          )}
        </div>
        Déconnexion
        <LogOut className="size-4 shrink-0 ml-auto" />
      </button>
    </div>
  )
}
