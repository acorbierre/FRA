'use client'

import { useEffect } from 'react'

export default function AuthRedirect() {
  useEffect(() => {
    window.location.replace('/redirect')
  }, [])
  return null
}
