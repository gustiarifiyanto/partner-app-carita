import { useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'

const GAP = 8
const MOBILE_WIDTH = 384

// Dropdown panel untuk tombol di header (mis. lonceng notifikasi).
// Dirender lewat portal ke <body> karena <main> memakai overflow-y-auto (panel
// lebar akan terpotong di sisi kiri) dan header memakai backdrop-blur saat
// di-scroll (membuat position: fixed relatif ke header, bukan ke layar).
// Posisinya dihitung dari header: di desktop rata kanan dengan padding header
// dan tidak pernah melewati tepi kiri area konten (sidebar lebar/ciut aman).
export default function HeaderPanel({ anchorRef, panelRef, maxWidth, className = '', children }) {
  const [position, setPosition] = useState(null)

  useLayoutEffect(() => {
    const header = anchorRef.current?.closest('[data-app-header]')
    if (!header) return undefined

    function update() {
      const rect = header.getBoundingClientRect()
      const padding = parseFloat(getComputedStyle(header).paddingRight) || 16
      const top = rect.bottom + GAP
      const isMobile = window.innerWidth < 768
      let width
      let left
      if (isMobile) {
        width = Math.min(MOBILE_WIDTH, window.innerWidth - 32)
        left = (window.innerWidth - width) / 2
      } else {
        width = Math.min(maxWidth, rect.width - padding * 2)
        left = rect.right - padding - width
      }
      setPosition({ top, left, width, maxHeight: window.innerHeight - top - 16 })
    }

    update()
    // Header ikut melebar/menyempit saat sidebar diciutkan (Ctrl+B).
    const observer = new ResizeObserver(update)
    observer.observe(header)
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [anchorRef, maxWidth])

  if (!position) return null

  return createPortal(
    <div
      ref={panelRef}
      className={`animate-toast-in fixed z-50 overflow-x-hidden overflow-y-auto rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 ${className}`}
      style={position}
    >
      {children}
    </div>,
    document.body,
  )
}
