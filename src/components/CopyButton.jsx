import { useEffect, useState } from 'react'
import { useToast } from '../hooks/useToast'
import { copyToClipboard } from '../lib/clipboard'

// variant: 'dark' untuk latar gelap (default), 'light' untuk latar terang/ivory.
const VARIANT_CLASSES = {
  dark: 'bg-white/15 text-white ring-1 ring-white/30 hover:bg-white/25',
  light: 'bg-amber-950 text-amber-50 shadow-sm hover:bg-amber-900',
}

// Small "Salin" button that flips to a check mark for a moment after copying.
export default function CopyButton({
  text,
  label = 'Salin',
  successMessage = 'Berhasil disalin.',
  className = '',
  variant = 'dark',
}) {
  const toast = useToast()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 1800)
    return () => clearTimeout(timer)
  }, [copied])

  const handleCopy = async () => {
    try {
      await copyToClipboard(String(text))
      setCopied(true)
      toast.success(successMessage)
    } catch {
      toast.error('Gagal menyalin. Silakan salin manual.')
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={!text}
      className={`inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
        copied ? 'bg-emerald-500 text-white' : VARIANT_CLASSES[variant]
      } ${className}`}
    >
      {copied ? (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      ) : (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-9.126m-.75 4.5v3.375c0 .621.504 1.125 1.125 1.125h3.375m-12.75 0h9.75"
          />
        </svg>
      )}
      {copied ? 'Tersalin' : label}
    </button>
  )
}
