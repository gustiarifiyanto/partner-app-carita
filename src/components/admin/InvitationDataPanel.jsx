import { useState } from 'react'
import ConfirmDialog from '../ConfirmDialog'
import CopyButton from '../CopyButton'
import InvitationDataBadge from '../InvitationDataBadge'
import InvitationForm from '../invitation/InvitationForm'
import { useToast } from '../../hooks/useToast'
import api from '../../lib/api'
import { formatCurrency, formatDate, formatDateTime } from '../../lib/format'
import { toInvitationForm } from '../../lib/invitationStatus'

const MODE_LABEL = { admin: 'Admin Editing', self: 'Self Editing' }

// Data mempelai & acara yang diisi client, untuk admin yang mengerjakan undangan.
// Admin juga bisa mengedit langsung atau membuka revisi, termasuk setelah order selesai.
export default function InvitationDataPanel({ order, selfEdit = null, onChanged }) {
  const toast = useToast()
  const [confirmUnlock, setConfirmUnlock] = useState(false)
  const [busy, setBusy] = useState(false)
  const [unlockNote, setUnlockNote] = useState('')
  const [switchAction, setSwitchAction] = useState(null) // 'approve' | 'reject' | null
  const [switchNote, setSwitchNote] = useState('')
  const [form, setForm] = useState(null) // null = tidak sedang mengedit
  const [errors, setErrors] = useState({})
  const status = order.invitation_data_status
  if (!status || status === 'not_required') return null

  const detail = order.invitation_detail
  const mode = detail?.editing_mode ?? (order.source === 'client' ? null : 'admin')
  const submitted = status === 'submitted'
  const completed = order.status === 'completed'
  const canManage = order.status !== 'cancelled'
  // Pengajuan Self Editing yang belum terbit: admin "mengembalikan" dengan catatan.
  const selfReview = mode === 'self' && submitted && !completed
  const content = detail?.content ?? {}
  const photos = detail?.photos ?? []
  const hasContent = Object.values(content).some(Boolean)
  // Self Editing v2: undangan dirender WordPress dari isian per field, bukan form mempelai/acara.
  const wordpress = Boolean(selfEdit)

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

  const markHandled = async () => {
    setBusy(true)
    try {
      await api.put(`/admin/orders/${order.id}/invitation/handled`)
      toast.success('Ditandai sudah ditangani.')
      onChanged()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menandai.')
    } finally {
      setBusy(false)
    }
  }

  const decideModeSwitch = async () => {
    setBusy(true)
    try {
      const { data } = await api.put(
        `/admin/orders/${order.id}/invitation/mode-switch/${switchAction}`,
        switchAction === 'reject' ? { note: switchNote.trim() || null } : {},
      )
      toast.success(data.message)
      setSwitchAction(null)
      setSwitchNote('')
      onChanged()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memproses permintaan.')
    } finally {
      setBusy(false)
    }
  }

  const unlock = async () => {
    setBusy(true)
    try {
      await api.put(`/admin/orders/${order.id}/invitation/unlock`, { note: unlockNote.trim() || null })
      toast.success(
        selfReview
          ? 'Pengajuan dikembalikan ke client beserta catatanmu.'
          : completed
            ? 'Revisi dibuka, client bisa mengubah data lalu mengirim ulang.'
            : 'Kunci dibuka, client bisa merevisi data undangan.',
      )
      setConfirmUnlock(false)
      setUnlockNote('')
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
            <InvitationDataBadge status={status} mode={mode} />
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Mode: {mode ? MODE_LABEL[mode] : 'belum dipilih client'}
            {mode === 'self' && Number(order.self_editing_fee) > 0
              ? ` (add-on ${formatCurrency(order.self_editing_fee)})`
              : ''}
            {mode === 'self' && detail?.revision_count > 0 ? ` · revisi client ${detail.revision_count}/5` : ''}
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
            {!wordpress && (
              <button
                type="button"
                onClick={startEdit}
                className="rounded-lg border border-violet-300 px-3 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-50"
              >
                Edit Data
              </button>
            )}
            {submitted && (
              <button
                type="button"
                onClick={() => setConfirmUnlock(true)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                {selfReview ? 'Kembalikan ke Client' : completed ? 'Buka Revisi untuk Client' : 'Buka Kunci untuk Revisi'}
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

      {detail?.awaiting_admin_since && canManage && (
        <div className="flex flex-col gap-2 rounded-xl bg-fuchsia-50 px-4 py-3 ring-1 ring-fuchsia-200 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-fuchsia-800">
            🔔 Menunggu tindakan admin sejak {formatDateTime(detail.awaiting_admin_since)}. Hilang otomatis saat order
            diselesaikan, dikembalikan, atau link undangan dikirim.
          </p>
          <button
            type="button"
            onClick={markHandled}
            disabled={busy}
            className="shrink-0 rounded-lg border border-fuchsia-300 bg-white px-3 py-1.5 text-xs font-medium text-fuchsia-700 hover:bg-fuchsia-100 disabled:opacity-60"
          >
            Tandai Sudah Ditangani
          </button>
        </div>
      )}

      {detail?.mode_switch_requested_at && (
        <div className="flex flex-col gap-3 rounded-xl bg-amber-50 p-4 ring-1 ring-amber-200 sm:flex-row sm:items-start sm:justify-between">
          <div className="text-sm">
            <p className="font-semibold text-amber-900">Client minta pindah ke Admin Editing</p>
            <p className="mt-0.5 text-xs text-amber-800">
              Dikirim {formatDateTime(detail.mode_switch_requested_at)}. Alasan: {detail.mode_switch_reason || '-'}
            </p>
          </div>
          {canManage && (
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => setSwitchAction('reject')}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Tolak
              </button>
              <button
                type="button"
                onClick={() => setSwitchAction('approve')}
                className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
              >
                Setujui
              </button>
            </div>
          )}
        </div>
      )}

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
      ) : detail && (wordpress || detail.groom || detail.bride || detail.events?.length || photos.length || hasContent) ? (
        <div className="space-y-4">
          {selfReview && (
            <p className="rounded-lg bg-fuchsia-50 px-3 py-2 text-xs text-fuchsia-800">
              Client mengajukan terbit (Self Editing). Periksa {wordpress ? 'preview undangan' : 'teks & foto'} di bawah. Kalau sudah pas, isi{' '}
              <strong>Link Undangan</strong> lalu <strong>Selesaikan Order</strong>. Kalau ada yang perlu diperbaiki,
              pakai <strong>Kembalikan ke Client</strong>.
            </p>
          )}
          {mode === 'self' && submitted && completed && detail.revision_count > 0 && (
            <p className="rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-800">
              Client mengajukan revisi ke-{detail.revision_count} dari 5. Perbarui undangan sesuai data terbaru di bawah,
              lalu kabari client (Link Undangan → Kirim). Kalau ada yang perlu diperbaiki, pakai Buka Revisi untuk Client.
            </p>
          )}
          {mode === 'self' && detail.review_note && !submitted && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
              Catatan pengembalian terakhir: {detail.review_note}
            </p>
          )}
          {!submitted && status !== 'revision' && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Masih draft, client belum menekan &quot;Kirim Data&quot;. Isi bisa berubah.
            </p>
          )}
          {wordpress ? (
            <SelfEditCard selfEdit={selfEdit} />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <PersonCard title="🤵 Mempelai Pria" person={detail.groom} />
              <PersonCard title="👰 Mempelai Wanita" person={detail.bride} />
            </div>
          )}
          {(wordpress ? [] : (detail.events ?? [])).map((event, i) => (
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
          {hasContent && <ContentCard content={content} />}
          {photos.length > 0 && <PhotoGrid photos={photos} />}
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
        open={switchAction !== null}
        onClose={() => setSwitchAction(null)}
        onConfirm={decideModeSwitch}
        loading={busy}
        tone={switchAction === 'approve' ? 'emerald' : 'indigo'}
        title={switchAction === 'approve' ? 'Setujui pindah ke Admin Editing?' : 'Tolak permintaan pindah mode?'}
        description={
          switchAction === 'approve'
            ? `Undangan dikerjakan admin dari data client. Nilai order turun ${formatCurrency(order.self_editing_fee)} (add-on Self Editing). Kalau client sudah membayar, kembalikan dananya secara manual.`
            : 'Client tetap memakai Self Editing.'
        }
        confirmLabel={switchAction === 'approve' ? 'Ya, Setujui' : 'Ya, Tolak'}
        icon={<path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />}
      >
        {switchAction === 'reject' && (
          <label className="block text-left text-xs font-medium text-slate-600">
            Catatan untuk client (opsional)
            <textarea
              rows={3}
              value={switchNote}
              onChange={(e) => setSwitchNote(e.target.value)}
              maxLength={1000}
              placeholder="Mis. Template ini hanya tersedia untuk Self Editing."
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:ring-violet-500"
            />
          </label>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmUnlock}
        onClose={() => setConfirmUnlock(false)}
        onConfirm={unlock}
        loading={busy}
        title={selfReview ? 'Kembalikan ke client?' : completed ? 'Buka revisi untuk client?' : 'Buka kunci data undangan?'}
        description={
          selfReview
            ? 'Client bisa memperbaiki undangannya lalu mengajukan terbit lagi. Tulis apa yang perlu diperbaiki.'
            : completed
              ? 'Order tetap berstatus selesai. Client bisa mengubah data undangan lalu menekan Kirim Data lagi.'
              : 'Client bisa mengubah data lagi dan harus menekan Kirim Data ulang sebelum order bisa diselesaikan.'
        }
        confirmLabel={selfReview ? 'Ya, Kembalikan' : completed ? 'Ya, Buka Revisi' : 'Ya, Buka Kunci'}
        icon={<path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />}
      >
        <label className="block text-left text-xs font-medium text-slate-600">
          Catatan untuk client{selfReview ? '' : ' (opsional)'}
          <textarea
            rows={3}
            value={unlockNote}
            onChange={(e) => setUnlockNote(e.target.value)}
            maxLength={1000}
            placeholder={
              selfReview ? 'Mis. Foto sampul kurang jelas, ganti dengan foto lain.' : 'Mis. Silakan ubah jam akad sesuai permintaan.'
            }
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:ring-violet-500"
          />
        </label>
      </ConfirmDialog>
    </section>
  )
}

// Self Editing v2: link preview WordPress + isian client per field (berlabel dari server).
function SelfEditCard({ selfEdit }) {
  const groups = selfEdit.fields.reduce((acc, field) => {
    ;(acc[field.group] ??= []).push(field)
    return acc
  }, {})

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 rounded-xl bg-violet-50 p-4 text-sm ring-1 ring-violet-200 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-violet-900">👁 Preview undangan (WordPress)</p>
          <p className="mt-0.5 text-xs text-violet-800">
            {selfEdit.synced_at
              ? `Diperbarui ${formatDateTime(selfEdit.synced_at)}`
              : 'Client belum membuat preview.'}
          </p>
          {selfEdit.sync_error && (
            <p className="mt-1 text-xs text-red-600">Sync terakhir gagal: {selfEdit.sync_error}</p>
          )}
        </div>
        {selfEdit.preview_url && (
          <a
            href={selfEdit.preview_url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-lg bg-violet-600 px-3 py-1.5 text-center text-xs font-semibold text-white hover:bg-violet-700"
          >
            Buka Preview ↗
          </a>
        )}
      </div>
      {Object.keys(groups).length > 0 && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {Object.entries(groups).map(([group, fields]) => (
            <div key={group} className="rounded-xl bg-slate-50 p-4 text-sm ring-1 ring-slate-200">
              <p className="mb-2 font-semibold text-slate-900">{group}</p>
              <dl className="space-y-1.5">
                {fields.map((field) => (
                  <div key={field.key} className="flex items-start justify-between gap-2">
                    <dt className="shrink-0 text-slate-500">{field.label}</dt>
                    <dd className="flex min-w-0 items-center gap-1.5 text-right font-medium text-slate-800">
                      {field.type === 'image' ? (
                        field.value ? (
                          <a href={field.value} target="_blank" rel="noopener noreferrer">
                            <img src={field.value} alt="" className="h-10 w-10 rounded object-cover ring-1 ring-slate-200" />
                          </a>
                        ) : (
                          '-'
                        )
                      ) : (
                        <>
                          <span className="break-words whitespace-pre-line">
                            {field.type === 'date' ? formatDate(field.value) : field.value}
                          </span>
                          <CopyButton text={String(field.value)} label="" successMessage={`${field.label} disalin.`} variant="light" />
                        </>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      )}
    </div>
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

const CONTENT_ROWS = [
  ['opening_text', 'Kata pembuka'],
  ['quote', 'Kutipan'],
  ['quote_source', 'Sumber kutipan'],
  ['closing_text', 'Kata penutup'],
  ['music_url', 'Link musik'],
]

// Teks tambahan Self Editing.
function ContentCard({ content }) {
  return (
    <div className="space-y-2 rounded-xl bg-slate-50 p-4 text-sm ring-1 ring-slate-200">
      <p className="font-semibold text-slate-900">✍️ Kata-kata &amp; Musik</p>
      {CONTENT_ROWS.filter(([field]) => content[field]).map(([field, label]) => (
        <div key={field}>
          <div className="flex items-center gap-1.5">
            <p className="text-xs text-slate-500">{label}</p>
            <CopyButton text={content[field]} label="" successMessage={`${label} disalin.`} variant="light" />
          </div>
          {field === 'music_url' ? (
            <a href={content[field]} target="_blank" rel="noopener noreferrer" className="break-all text-violet-600 hover:underline">
              {content[field]}
            </a>
          ) : (
            <p className="whitespace-pre-line text-slate-800">{content[field]}</p>
          )}
        </div>
      ))}
    </div>
  )
}

// Foto Self Editing; klik untuk membuka ukuran penuh (bisa diunduh).
function PhotoGrid({ photos }) {
  return (
    <div className="space-y-2 rounded-xl bg-slate-50 p-4 text-sm ring-1 ring-slate-200">
      <p className="font-semibold text-slate-900">📷 Foto ({photos.length})</p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {photos.map((photo) => (
          <a
            key={photo.id}
            href={photo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="relative block overflow-hidden rounded-lg ring-1 ring-slate-200"
          >
            <img src={photo.url} alt="" className="aspect-square w-full object-cover transition hover:scale-105" />
            {photo.is_cover && (
              <span className="absolute top-1 left-1 rounded-full bg-violet-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                Sampul
              </span>
            )}
          </a>
        ))}
      </div>
    </div>
  )
}
