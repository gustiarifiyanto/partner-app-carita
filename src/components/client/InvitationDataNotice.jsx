import { Link } from 'react-router-dom'
import { needsInvitationData } from '../../lib/invitationStatus'

// Catatan "belum mengisi data undangan" untuk order katalog client. Hilang
// otomatis setelah client menekan Kirim Data / Ajukan Terbit (status `submitted`).
// Order Self Editing diarahkan ke editor, bukan ke form data untuk admin.
export default function InvitationDataNotice({ order, className = '' }) {
  if (!needsInvitationData(order)) return null

  const status = order.invitation_data_status
  const self = order.invitation_editing_mode === 'self'
  const revision = status === 'revision'

  const { title, text, action, href } = self
    ? {
        title: revision ? 'Revisi undangan dibuka' : 'Undanganmu belum diajukan terbit',
        text: revision
          ? 'Ubah undanganmu di editor Self Editing, lalu tekan Ajukan Terbit lagi.'
          : 'Kamu memilih Self Editing. Edit data, kata-kata & foto undanganmu di editor, lalu tekan Ajukan Terbit supaya admin bisa menerbitkannya.',
        action: 'Buka Editor',
        href: `/client/self-editing/${order.id}`,
      }
    : {
        title: revision ? 'Revisi data undangan dibuka' : 'Kamu belum mengisi data undangan',
        text: revision
          ? 'Admin membuka kunci data undangan kamu. Ubah data yang perlu direvisi lalu tekan Kirim Data lagi.'
          : `${
              status === 'choose_mode'
                ? 'Pilih mode pengerjaan lalu isi data mempelai & acara. '
                : 'Isi data mempelai & acara lalu tekan Kirim Data. '
            }Undangan baru bisa dikerjakan setelah datanya kami terima.`,
        action: revision ? 'Revisi Data' : 'Isi Data Undangan',
        href: `/client/undangan/${order.id}`,
      }

  return (
    <div
      className={`flex flex-col gap-3 rounded-xl px-4 py-3 ring-1 sm:flex-row sm:items-center sm:justify-between ${
        self ? 'bg-fuchsia-50 ring-fuchsia-200' : 'bg-amber-50 ring-amber-200'
      } ${className}`}
    >
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 text-base leading-none">{self ? '✏️' : '⚠️'}</span>
        <div>
          <p className={`text-sm font-semibold ${self ? 'text-fuchsia-900' : 'text-amber-900'}`}>{title}</p>
          <p className={`mt-0.5 text-xs leading-relaxed ${self ? 'text-fuchsia-800' : 'text-amber-800'}`}>{text}</p>
        </div>
      </div>
      <Link
        to={href}
        className={`shrink-0 rounded-lg px-3 py-1.5 text-center text-xs font-semibold text-white ${
          self ? 'bg-fuchsia-600 hover:bg-fuchsia-700' : 'bg-amber-600 hover:bg-amber-700'
        }`}
      >
        {action}
      </Link>
    </div>
  )
}
