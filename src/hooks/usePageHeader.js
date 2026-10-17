import { useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'

export function usePageHeader(title, subtitle) {
  const { setPageHeader } = useOutletContext()

  useEffect(() => {
    setPageHeader({ title, subtitle })
  }, [title, subtitle, setPageHeader])
}
