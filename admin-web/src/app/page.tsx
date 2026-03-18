'use client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function RootPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Basic redirect to dashboard
    router.replace('/merchants')
  }, [router])
  
  return null
}
