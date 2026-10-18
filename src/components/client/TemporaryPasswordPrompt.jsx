import { useState } from 'react'
import ChangePasswordModal from '../ChangePasswordModal'
import { useAuth } from '../../hooks/useAuth'

const AUTO_OPENED_KEY = 'tempPasswordPromptShown'

// Client yang masih memakai password sementara (dibuatkan partner/admin):
// banner di semua halaman client + pop-up yang terbuka otomatis sekali per sesi,
// termasuk saat client masuk langsung lewat link (mis. form data undangan).
export default function TemporaryPasswordPrompt() {
  const { user, updateUser } = useAuth()
  const mustChangePassword = Boolean(user?.must_change_password)
  const [open, setOpen] = useState(() => {
    if (!mustChangePassword) return false
    try {
      if (sessionStorage.getItem(AUTO_OPENED_KEY) === '1') return false
      sessionStorage.setItem(AUTO_OPENED_KEY, '1')
    } catch {
      // Storage tidak tersedia: tetap tampilkan pop-up.
    }
    return true
  })

  if (!mustChangePassword) return null

  return (
    <>
      <div className="animate-fade-up mb-6 flex flex-col gap-3 rounded-xl bg-amber-50 p-4 ring-1 ring-amber-200 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-amber-900">Buat password baru dulu, yuk</p>
          <p className="mt-0.5 text-sm text-amber-800">
            Kamu masih memakai password sementara. Ganti dengan password pilihanmu sendiri supaya akun kamu aman.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="shrink-0 rounded-lg bg-amber-900 px-4 py-2 text-sm font-semibold text-amber-50 hover:bg-amber-800"
        >
          Ganti Password
        </button>
      </div>

      <ChangePasswordModal
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={() => updateUser({ must_change_password: false })}
        title="Buat Password Baru"
        oldPasswordLabel="Password Sementara"
      />
    </>
  )
}
