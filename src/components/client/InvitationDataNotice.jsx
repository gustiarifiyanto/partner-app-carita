import { Link } from 'react-router-dom'
import { needsInvitationData } from '../../lib/invitationStatus'

// Catatan "belum mengisi data undangan" untuk order katalog client. Hilang
// otomatis setelah client menekan Kirim Data (status `submitted`).
export default function InvitationDataNotice({ order, className = '' }) {
  if (!needsInvitationData(order)) return null

  const chooseMode = order.invitation_data_status === 'choose_mode'
  const revision = order.invitation_data_status === 'revision'

  return (
    <div
      className={`flex flex-col gap-3 rounded-xl bg-amber-50 px-4 py-3 ring-1 ring-amber-200 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 text-base leading-none">⚠️</span>
        <div>
          <p className="text-sm font-semibold text-amber-900">
            {revision ? 'Revisi data undangan dibuka' : 'Kamu belum mengisi data undangan'}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-amber-800">
            {revision
              ? 'Admin membuka kunci data undangan kamu. Ubah data yang perlu direvisi lalu tekan Kirim Data lagi.'
              : `${
                  chooseMode
                    ? 'Pilih mode pengerjaan lalu isi data mempelai & acara. '
                    : 'Isi data mempelai & acara lalu tekan Kirim Data. '
                }Undangan baru bisa dikerjakan setelah datanya kami terima.`}
          </p>
        </div>
      </div>
      <Link
        to={`/client/undangan/${order.id}`}
        className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-center text-xs font-semibold text-white hover:bg-amber-700"
      >
        {revision ? 'Revisi Data' : 'Isi Data Undangan'}
      </Link>
    </div>
  )
}
