import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import api from '../../lib/api'

// Banner "verifikasi email" di dashboard client + penanganan hasil klik link
// verifikasi (backend redirect ke /client?verified=success|invalid).
export default function EmailVerificationBanner({ onVerified }) {
  const { user, updateUser } = useAuth()
  const toast = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const [sending, setSending] = useState(false)
  const handledRef = useRef(false)

  const verifiedParam = searchParams.get('verified')

  useEffect(() => {
    if (!verifiedParam || handledRef.current) return
    handledRef.current = true

    const next = new URLSearchParams(searchParams)
    next.delete('verified')
    setSearchParams(next, { replace: true })

    if (verifiedParam !== 'success') {
      toast.error('Link verifikasi tidak valid atau sudah kedaluwarsa. Kirim ulang link dari dashboard.')
      return
    }

    toast.success('Email berhasil diverifikasi. Pesanan lama dengan email ini sudah masuk ke akun kamu.')
    api
      .get('/auth/me')
      .then(({ data }) => {
        updateUser({ client: data.user.client })
        onVerified?.()
      })
      .catch(() => {})
  }, [verifiedParam, searchParams, setSearchParams, toast, updateUser, onVerified])

  if (!user?.client || user.client.email_verified) return null

  const handleResend = async () => {
    setSending(true)
    try {
      const { data } = await api.post('/auth/email/resend')
      if (data.already_verified) {
        updateUser({ client: { ...user.client, email_verified: true } })
        onVerified?.()
      }
      toast.success(data.message)
    } catch (err) {
      toast.error(
        err.response?.status === 429
          ? 'Terlalu sering mengirim ulang. Tunggu beberapa menit lalu coba lagi.'
          : err.response?.data?.message || 'Gagal mengirim ulang email verifikasi.',
      )
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="animate-fade-up flex flex-col gap-3 rounded-xl bg-violet-50 p-4 ring-1 ring-violet-200 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-violet-900">Verifikasi email kamu</p>
        <p className="mt-0.5 text-sm break-words text-violet-800">
          Kami sudah mengirim link verifikasi ke <strong>{user.email}</strong>. Setelah diverifikasi, pesanan lama yang
          memakai email ini otomatis muncul di sini.
        </p>
      </div>
      <button
        type="button"
        onClick={handleResend}
        disabled={sending}
        className="shrink-0 rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {sending ? 'Mengirim...' : 'Kirim Ulang Link'}
      </button>
    </div>
  )
}
