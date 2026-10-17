import { useCallback, useEffect, useState } from 'react'
import api from '../lib/api'

export function useApiList(endpoint, initialFilters = {}) {
  const [filters, setFilters] = useState(initialFilters)
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadToken, setReloadToken] = useState(0)

  const refetch = useCallback(() => setReloadToken((t) => t + 1), [])

  const filtersKey = JSON.stringify(filters)

  useEffect(() => {
    let cancelled = false
    // Reset loading/error synchronously when the effect re-runs (filter change,
    // refetch) - the documented React data-fetching effect pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    setError('')

    const params = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== '' && v !== undefined && v !== null),
    )

    api
      .get(endpoint, { params })
      .then(({ data }) => {
        if (cancelled) return
        setItems(data.data)
        setMeta(data.meta ?? null)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.response?.data?.message || 'Gagal memuat data.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, filtersKey, reloadToken])

  return { items, meta, loading, error, filters, setFilters, refetch }
}
