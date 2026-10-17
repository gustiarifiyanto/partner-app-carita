import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import logo from '../assets/logo/logo_carita_v4.png'
import LottiePlayer from '../components/LottiePlayer'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { homePathForRole } from '../lib/roles'
import { clientLandingPath } from '../lib/orderLink'

const INITIAL_FORM = {
  name: '',
  email: '',
  whatsapp: '',
  password: '',
  password_confirmation: '',
}

const WELCOME_ANIMATION_URL = 'https://lottie.host/ec597f6b-05ba-410b-9b0b-f514296016f8/3EXwA6dOLC.json'

const BENEFITS = [
  'Pantau status pesanan undangan kamu',
  'Pesanan lama otomatis masuk setelah email diverifikasi',
  'Akun langsung aktif, tanpa menunggu verifikasi admin',
]

const inputClass = (hasError) =>
  `w-full rounded-lg border py-2.5 px-3 text-sm text-slate-900 transition focus:ring-2 focus:outline-none ${
    hasError
      ? 'border-red-400 focus:border-red-500 focus:ring-red-500/30'
      : 'border-slate-300 focus:border-violet-500 focus:ring-violet-500/30'
  }`

export default function ClientRegisterPage() {
  const { user, token, loading: authLoading, registerClient } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const continuingOrder = searchParams.get('lanjut') === 'order'

  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const [generalError, setGeneralError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  if (!authLoading && token && user) {
    return <Navigate to={homePathForRole(user.role)} replace />
  }

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setGeneralError('')
    setSubmitting(true)

    try {
      const data = await registerClient(form)
      if (data.verification_email_sent) {
        toast.success('Akun berhasil dibuat! Cek email kamu untuk verifikasi.')
      } else {
        toast.error('Akun berhasil dibuat, tapi email verifikasi gagal dikirim. Kirim ulang dari dashboard.')
      }
      navigate(clientLandingPath(), { replace: true })
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {})
      } else if (err.response?.status === 429) {
        setGeneralError('Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.')
      } else {
        setGeneralError(err.response?.data?.message || 'Registrasi gagal, silakan coba lagi.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 lg:h-screen lg:flex-row lg:overflow-hidden">
      <div
        className="relative hidden items-center justify-center overflow-hidden px-10 lg:flex lg:h-full lg:w-1/2"
        style={{ backgroundImage: 'linear-gradient(135deg, #4c1d95 0%, #6d28d9 60%, #7c3aed 100%)' }}
      >
        <div
          className="animate-blob absolute -top-20 -left-20 h-96 w-96 rounded-full blur-3xl"
          style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
        />
        <div
          className="animate-blob absolute -right-14 -bottom-20 h-80 w-80 rounded-full blur-3xl"
          style={{ backgroundColor: 'rgba(221,214,254,0.25)', animationDelay: '3s' }}
        />

        <div className="relative z-10 w-full max-w-md text-center">
          <LottiePlayer path={WELCOME_ANIMATION_URL} className="mx-auto w-full max-w-sm" />
          <h2 className="animate-fade-up mt-6 text-2xl font-semibold text-white">Undangan Digital Carita Studio</h2>
          <p className="animate-fade-up mt-3 text-sm text-violet-100" style={{ animationDelay: '80ms' }}>
            Buat akun untuk memesan dan memantau undangan digital kamu.
          </p>

          <ul className="mt-8 flex flex-col gap-2.5 text-left">
            {BENEFITS.map((benefit, i) => (
              <li
                key={benefit}
                className="animate-fade-up flex items-center gap-3 rounded-xl bg-white/15 px-3 py-2 text-sm font-medium text-white shadow-sm backdrop-blur-sm"
                style={{ animationDelay: `${140 + i * 90}ms` }}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-violet-600 shadow-sm">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </span>
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex w-full flex-1 items-center justify-center px-4 py-10 lg:h-full lg:w-1/2 lg:items-start lg:overflow-y-auto">
        <div className="animate-card-in my-auto w-full max-w-md rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200 sm:p-10">
          <img src={logo} alt="Carita Studio" className="mx-auto mb-6 h-16 w-16 object-contain" />

          <h1 className="text-center text-xl font-semibold text-slate-900 lg:text-left">Buat Akun</h1>
          <p className="mt-1 text-center text-sm text-slate-500 lg:text-left">
            Daftar sebagai client Carita Studio
          </p>

          {continuingOrder && (
            <div className="mt-5 rounded-lg bg-violet-50 px-3 py-2.5 text-sm text-violet-800">
              Buat akun dulu untuk melanjutkan pesanan kamu. Sudah punya akun?{' '}
              <Link to="/login" className="font-semibold underline">
                Masuk di sini
              </Link>
              , pilihan paket & tema kamu tetap tersimpan.
            </div>
          )}

          {generalError && (
            <div className="animate-error-in mt-5 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-600">
              {generalError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            <Field id="name" label="Nama Lengkap" error={errors.name}>
              <input
                id="name"
                autoComplete="name"
                required
                value={form.name}
                onChange={handleChange('name')}
                className={inputClass(errors.name)}
              />
            </Field>

            <Field
              id="email"
              label="Email"
              error={errors.email}
              errorExtra={
                errors.email?.[0]?.includes('sudah punya akun') && (
                  <Link to="/login" className="font-semibold underline">
                    Ke halaman login
                  </Link>
                )
              }
            >
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={handleChange('email')}
                placeholder="nama@email.com"
                className={inputClass(errors.email)}
              />
            </Field>

            <Field id="whatsapp" label="No. WhatsApp" error={errors.whatsapp}>
              <input
                id="whatsapp"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                required
                value={form.whatsapp}
                onChange={handleChange('whatsapp')}
                placeholder="08xxxxxxxxxx"
                className={inputClass(errors.whatsapp)}
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id="password" label="Password" error={errors.password}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={form.password}
                  onChange={handleChange('password')}
                  placeholder="Min. 8 karakter"
                  className={inputClass(errors.password)}
                />
              </Field>
              <Field id="password_confirmation" label="Konfirmasi Password">
                <input
                  id="password_confirmation"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={form.password_confirmation}
                  onChange={handleChange('password_confirmation')}
                  className={inputClass(false)}
                />
              </Field>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
              />
              Tampilkan password
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-[0_8px_24px_rgba(109,40,217,0.35)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              style={{ backgroundImage: 'linear-gradient(135deg, #4c1d95, #6d28d9)' }}
            >
              {submitting ? 'Memproses...' : 'Daftar'}
            </button>

            <p className="text-center text-sm text-slate-500">
              Sudah punya akun?{' '}
              <Link to="/login" className="font-medium text-violet-600 hover:text-violet-700 hover:underline">
                Masuk
              </Link>
            </p>
            <p className="text-center text-xs text-slate-400">
              Ingin bergabung sebagai mitra?{' '}
              <Link to="/register" className="font-medium text-slate-500 hover:text-violet-600 hover:underline">
                Daftar sebagai partner
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

function Field({ id, label, error, errorExtra, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-xs text-red-600">
          {Array.isArray(error) ? error[0] : error} {errorExtra}
        </p>
      )}
    </div>
  )
}
