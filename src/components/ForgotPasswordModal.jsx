import { useState } from 'react'
import FormField from './FormField'
import Modal from './Modal'
import api from '../lib/api'
import { fieldClass } from '../lib/formStyles'
import { useToast } from '../hooks/useToast'

const TITLES = {
  intro: 'Lupa Password?',
  form: 'Request Reset Password',
  sent: 'Permintaan Terkirim',
}

const PRIMARY_BUTTON =
  'flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-[0_8px_24px_rgba(109,40,217,0.35)] disabled:cursor-not-allowed disabled:opacity-60'
const PRIMARY_GRADIENT = { backgroundImage: 'linear-gradient(135deg, #4c1d95, #6d28d9)' }

const EMPTY_FORM = { email: '', name: '', phone: '', message: '', website: '' }

// Sama dengan aturan di PasswordResetRequestRequest (backend tetap jadi penjaga utama)
const CODE_PATTERN = /<[^>]*>|<\?|\?>|\{\{|\{!!|javascript\s*:|\bon[a-z]+\s*=/i
const NAME_PATTERN = /^[\p{L}\p{M}\s.'-]+$/u
const PHONE_PATTERN = /^\+?[0-9][0-9\s-]{7,18}$/
const EMAIL_PATTERN = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[a-z]{2,}$/i

function validate(form) {
  const errors = {}
  const email = form.email.trim()
  const name = form.name.trim()
  const phone = form.phone.trim()

  if (!email) errors.email = 'Email akun wajib diisi'
  else if (!EMAIL_PATTERN.test(email)) errors.email = 'Email tidak valid'

  if (!name) errors.name = 'Nama wajib diisi'
  else if (name.length < 2) errors.name = 'Nama minimal 2 karakter'
  else if (!NAME_PATTERN.test(name))
    errors.name = 'Nama hanya boleh berisi huruf, spasi, titik, tanda petik, dan tanda hubung'

  if (phone && !PHONE_PATTERN.test(phone))
    errors.phone = 'Nomor WhatsApp hanya boleh berisi angka (8–19 digit), boleh diawali +'

  if (CODE_PATTERN.test(form.message)) errors.message = 'Catatan tidak boleh berisi kode (HTML, PHP, script)'

  return errors
}

const MailIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 6.75c0-.83.67-1.5 1.5-1.5h16.5c.83 0 1.5.67 1.5 1.5v10.5c0 .83-.67 1.5-1.5 1.5H3.75a1.5 1.5 0 0 1-1.5-1.5V6.75Z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" d="m3 7 9 6 9-6" />
  </svg>
)

export default function ForgotPasswordModal({ open, onClose, initialEmail = '' }) {
  const toast = useToast()
  const [step, setStep] = useState('intro')
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleClose = () => {
    setStep('intro')
    setForm(EMPTY_FORM)
    setErrors({})
    setError('')
    onClose()
  }

  const openForm = () => {
    // Bawa email yang sudah diketik di form login supaya partner tidak mengetik ulang
    setForm((prev) => ({ ...prev, email: prev.email || initialEmail }))
    setStep('form')
  }

  const handleChange = (field) => (e) => {
    let { value } = e.target
    // No. WA: hanya angka, spasi, tanda hubung, dan + di depan
    if (field === 'phone') value = value.replace(/[^\d\s+-]/g, '').replace(/(?!^)\+/g, '')
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const clientErrors = validate(form)
    setErrors(clientErrors)
    if (Object.keys(clientErrors).length > 0) return

    setSubmitting(true)

    try {
      await api.post('/auth/password-reset-request', form)
      setStep('sent')
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {})
        setError(err.response.data.message || '')
      } else if (err.response?.status === 429) {
        setError('Terlalu banyak permintaan. Silakan coba lagi dalam beberapa menit.')
      } else {
        const message = err.response?.data?.message || 'Gagal mengirim permintaan.'
        setError(message)
        toast.error(message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title={TITLES[step]}>
      {step === 'intro' && (
        <>
          <p className="text-sm text-slate-600">
            Untuk keamanan akun, reset password saat ini masih dibantu langsung oleh admin. Klik tombol di
            bawah untuk mengisi form permintaan reset password ke admin.
          </p>
          <button type="button" onClick={openForm} className={`mt-5 ${PRIMARY_BUTTON}`} style={PRIMARY_GRADIENT}>
            <MailIcon />
            Hubungi Admin via Email
          </button>
        </>
      )}

      {step === 'form' && (
        <>
          {error && <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Honeypot anti-bot: tidak terlihat & tidak bisa di-tab, manusia tidak akan mengisinya */}
            <div
              aria-hidden="true"
              style={{ position: 'absolute', left: '-9999px', top: 0, width: 1, height: 1, overflow: 'hidden', opacity: 0 }}
            >
              <label>
                Website
                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.website}
                  onChange={handleChange('website')}
                />
              </label>
            </div>

            <FormField label="Email Akun" error={errors.email} hint="Email yang kamu pakai untuk login">
              <input
                type="email"
                required
                maxLength={255}
                value={form.email}
                onChange={handleChange('email')}
                placeholder="nama@perusahaan.com"
                className={fieldClass(errors.email)}
              />
            </FormField>

            <FormField label="Nama Lengkap" error={errors.name}>
              <input
                type="text"
                required
                maxLength={100}
                value={form.name}
                onChange={handleChange('name')}
                className={fieldClass(errors.name)}
              />
            </FormField>

            <FormField label="No. WhatsApp (opsional)" error={errors.phone} hint="Agar admin bisa menghubungi lebih cepat">
              <input
                type="tel"
                inputMode="tel"
                maxLength={19}
                value={form.phone}
                onChange={handleChange('phone')}
                placeholder="08xxxxxxxxxx"
                className={fieldClass(errors.phone)}
              />
            </FormField>

            <FormField label="Catatan (opsional)" error={errors.message}>
              <textarea
                rows={3}
                maxLength={500}
                value={form.message}
                onChange={handleChange('message')}
                placeholder="Contoh: nama perusahaan / info tambahan untuk verifikasi"
                className={fieldClass(errors.message)}
              />
            </FormField>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setStep('intro')}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
              >
                Kembali
              </button>
              <button type="submit" disabled={submitting} className={`flex-1 ${PRIMARY_BUTTON}`} style={PRIMARY_GRADIENT}>
                <MailIcon />
                {submitting ? 'Mengirim...' : 'Kirim ke Admin'}
              </button>
            </div>
          </form>
        </>
      )}

      {step === 'sent' && (
        <div className="text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </span>
          <p className="mt-4 text-sm text-slate-600">
            Permintaan reset password untuk <span className="font-medium text-slate-900">{form.email}</span> sudah
            dikirim ke admin Carita. Admin akan menghubungi kamu setelah password direset.
          </p>
          <button type="button" onClick={handleClose} className={`mt-5 ${PRIMARY_BUTTON}`} style={PRIMARY_GRADIENT}>
            Oke, Mengerti
          </button>
        </div>
      )}
    </Modal>
  )
}
