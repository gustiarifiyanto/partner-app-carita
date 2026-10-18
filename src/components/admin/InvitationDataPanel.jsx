import { useState } from 'react'
import ConfirmDialog from '../ConfirmDialog'
import CopyButton from '../CopyButton'
import InvitationDataBadge from '../InvitationDataBadge'
import InvitationForm from '../invitation/InvitationForm'
import { useToast } from '../../hooks/useToast'
import api from '../../lib/api'
import { formatDate, formatDateTime } from '../../lib/format'
import { toInvitationForm } from '../../lib/invitationStatus'

const MODE_LABEL = { admin: 'Admin Editing', self: 'Self Editing' }

// Data mempelai & acara yang diisi client, untuk admin yang mengerjakan undangan.
// Admin juga bisa mengedit langsung atau membuka revisi, termasuk setelah order selesai.
export default function InvitationDataPanel({ order, onChanged }) {
  const toast = useToast()
  const [confirmUnlock, setConfirmUnlock] = useState(false)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState(null) // null = tidak sedang mengedit
  const [errors, setErrors] = useState({})
  const status = order.invitation_data_status
  if (!status || status === 'not_required') return null

  const detail = order.invitation_detail
  const mode = detail?.editing_mode ?? (order.source === 'client' ? null : 'admin')
  const submitted = status === 'submitted'
  const completed = order.status === 'completed'
  const canManage = order.status !== 'cancelled'

  const startEdit = () => {
    setErrors({})
    setForm(toInvitationForm(detail ?? {}))
  }

  const save = async (markSubmitted) => {
    setBusy(true)
    setErrors({})
    try {
      await api.put(`/admin/orders/${order.id}/invitation`, { ...form, mark_submitted: markSubmitted })
      toast.success(markSubmitted ? 'Data disimpan dan ditandai terkirim.' : 'Data undangan disimpan.')
      setForm(null)
      onChanged()
    } catch (err) {
      if (err.response?.status === 422 && err.response.data.errors) {
        setErrors(err.response.data.errors)
        toast.error('Masih ada data yang belum lengkap, cek kolom yang ditandai merah.')
      } else {
        toast.error(err.response?.data?.message || 'Gagal menyimpan data undangan.')
      }
    } finally {
      setBusy(false)
    }
  }

  const unlock = async () => {
    setBusy(true)
    try {
      await api.put(`/admin/orders/${order.id}/invitation/unlock`)
      toast.success(
        completed ? 'Revisi dibuka, client bisa mengubah data lalu mengirim ulang.' : 'Kunci dibuka, client bisa merevisi data undangan.',
      )
      setConfirmUnlock(false)
      onChanged()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal membuka kunci.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="animate-fade-up space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900">Data Undangan</h3>
            <InvitationDataBadge status={status} />
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Mode: {mode ? MODE_LABEL[mode] : 'belum dipilih client'}
            {submitted && detail?.submitted_at ? ` · dikirim ${formatDateTime(detail.submitted_at)}` : ''}
            {status === 'revision'
              ? ' · revisi dibuka, menunggu client mengirim ulang'
              : !submitted && !completed
                ? ' · order belum bisa diselesaikan sampai client mengirim data'
                : ''}
          </p>
        </div>
        {canManage && !form && (
          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              onClick={startEdit}
              className="rounded-lg border border-violet-300 px-3 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-50"
            >
              Edit Data
            </button>
            {submitted && (
              <button
                type="button"
                onClick={() => setConfirmUnlock(true)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                {completed ? 'Buka Revisi untuk Client' : 'Buka Kunci untuk Revisi'}
              </button>
            )}
          </div>
        )}
        {form && (
          <button
            type="button"
            onClick={() => setForm(null)}
            disabled={busy}
            className="shrink-0 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Batal Edit
          </button>
        )}
      </div>

      {form ? (
        <div className="space-y-3">
          <p className="rounded-lg bg-violet-50 px-3 py-2 text-xs text-violet-800">
            Kamu sedang mengedit data undangan atas nama client. Perubahan langsung terlihat di akun client.
          </p>
          <InvitationForm
            form={form}
            setForm={setForm}
            errors={errors}
            readOnly={false}
            saving={busy}
            onSaveDraft={() => save(false)}
            onSubmit={() => save(true)}
            saveLabel="Simpan Perubahan"
            submitLabel={submitted ? null : 'Simpan & Tandai Terkirim'}
            hint={submitted ? 'Data tetap terkunci untuk client.' : 'Tandai terkirim kalau data sudah lengkap (dari client via WA).'}
          />
        </div>
      ) : detail && (detail.groom || detail.bride || detail.events?.length) ? (
        <div className="space-y-4">
          {!submitted && status !== 'revision' && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Masih draft, client belum menekan &quot;Kirim Data&quot;. Isi bisa berubah.
            </p>
          )}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <PersonCard title="🤵 Mempelai Pria" person={detail.groom} />
            <PersonCard title="👰 Mempelai Wanita" person={detail.bride} />
          </div>
          {(detail.events ?? []).map((event, i) => (
            <div key={i} className="rounded-xl bg-slate-50 p-4 text-sm ring-1 ring-slate-200">
              <p className="font-semibold text-slate-900">📅 {event.name || `Acara ${i + 1}`}</p>
              <p className="mt-1 text-slate-700">
                {event.date ? formatDate(event.date) : '-'} · {event.time_start || '-'}
                {event.time_end ? ` – ${event.time_end}` : ''}
              </p>
              <p className="text-slate-700">{event.venue_name || '-'}</p>
              <p className="whitespace-pre-line text-slate-500">{event.address || '-'}</p>
              {event.maps_url && (
                <a href={event.maps_url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-violet-600 hover:underline">
                  Buka Google Maps
                </a>
              )}
            </div>
          ))}
          {detail.notes && (
            <div className="rounded-xl bg-violet-50 p-4 text-sm ring-1 ring-violet-200">
              <p className="text-xs font-semibold text-violet-800">Catatan client</p>
              <p className="mt-1 whitespace-pre-line text-violet-900">{detail.notes}</p>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-slate-400">Client belum mengisi data undangan.</p>
      )}

      <ConfirmDialog
        open={confirmUnlock}
        onClose={() => setConfirmUnlock(false)}
        onConfirm={unlock}
        loading={busy}
        title={completed ? 'Buka revisi untuk client?' : 'Buka kunci data undangan?'}
        description={
          completed
            ? 'Order tetap berstatus selesai. Client bisa mengubah data undangan lalu menekan Kirim Data lagi.'
            : 'Client bisa mengubah data lagi dan harus menekan Kirim Data ulang sebelum order bisa diselesaikan.'
        }
        confirmLabel={completed ? 'Ya, Buka Revisi' : 'Ya, Buka Kunci'}
        icon={<path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />}
      />
    </section>
  )
}

function PersonCard({ title, person }) {
  const rows = [
    ['Nama lengkap', person?.full_name],
    ['Panggilan', person?.nickname],
    ['Ayah', person?.father_name],
    ['Ibu', person?.mother_name],
  ]
  return (
    <div className="rounded-xl bg-slate-50 p-4 text-sm ring-1 ring-slate-200">
      <p className="mb-2 font-semibold text-slate-900">{title}</p>
      <dl className="space-y-1">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-2">
            <dt className="text-slate-500">{label}</dt>
            <dd className="flex min-w-0 items-center gap-1.5 text-right font-medium text-slate-800">
              <span className="truncate">{value || '-'}</span>
              {value && <CopyButton text={value} label="" successMessage={`${label} disalin.`} variant="light" />}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
