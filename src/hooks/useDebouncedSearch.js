import { useEffect, useState } from 'react'

// Keeps a local search input and pushes it into the list filters after the
// user stops typing, resetting to page 1.
export function useDebouncedSearch(currentSearch, setFilters, delay = 350) {
  const [searchInput, setSearchInput] = useState(currentSearch || '')

  useEffect(() => {
    const query = searchInput.trim()
    if (query === currentSearch) return

    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: query, page: 1 }))
    }, delay)
    return () => clearTimeout(timer)
  }, [searchInput, currentSearch, setFilters, delay])

  return [searchInput, setSearchInput]
}
