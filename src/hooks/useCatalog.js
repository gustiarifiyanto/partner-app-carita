import { useEffect, useState } from 'react'
import api from '../lib/api'

// Paket & tema aktif dari API katalog publik.
export function useCatalog(enabled = true) {
  const [state, setState] = useState({
    packages: [],
    themes: [],
    categories: {},
    selfEditingPrice: 0,
    loading: true,
    error: '',
  })

  useEffect(() => {
    if (!enabled) return undefined
    let cancelled = false

    Promise.all([api.get('/catalog/packages'), api.get('/catalog/themes')])
      .then(([pkgRes, themeRes]) => {
        if (cancelled) return
        setState({
          packages: pkgRes.data.data,
          themes: themeRes.data.data,
          categories: themeRes.data.meta?.categories || {},
          selfEditingPrice: Number(themeRes.data.meta?.self_editing_price ?? 0),
          loading: false,
          error: '',
        })
      })
      .catch((err) => {
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: err.response?.data?.message || 'Gagal memuat katalog.',
          }))
        }
      })

    return () => {
      cancelled = true
    }
  }, [enabled])

  return state
}
