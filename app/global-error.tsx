'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Only log the error, don't show it to the user
    console.error('Global error:', error)
    // Automatically reset after a short delay
    const timer = setTimeout(() => {
      reset()
    }, 100)
    return () => clearTimeout(timer)
  }, [error, reset])

  // Return null instead of error UI
  return null
}
