import { useEffect, useState } from 'react'
import api from '../lib/api'

// Rekening tujuan transfer + batas file bukti (dari config/payment.php backend).
export function usePaymentInfo(enabled = true) {
  const [info, setInfo] = useState({ bank_accounts: [], proof_max_mb: 5, loading: true })

  useEffect(() => {
    if (!enabled) return undefined
    let cancelled = false

    api
      .get('/auth/payment-info')
      .then(({ data }) => {
        if (!cancelled) setInfo({ ...data.data, loading: false })
      })
      .catch(() => {
        if (!cancelled) setInfo((prev) => ({ ...prev, loading: false }))
      })

    return () => {
      cancelled = true
    }
  }, [enabled])

  return info
}
