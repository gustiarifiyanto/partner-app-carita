import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ConfirmDialog from '../../components/ConfirmDialog'
import FormField from '../../components/FormField'
import Modal from '../../components/Modal'
import InvitationDataBadge from '../../components/InvitationDataBadge'
import ListSkeleton from '../../components/ListSkeleton'
import InvitationForm from '../../components/invitation/InvitationForm'
import InvitationPreview from '../../components/invitation/InvitationPreview'
import WordpressSelfEditor from '../../components/invitation/WordpressSelfEditor'
import { usePageHeader } from '../../hooks/usePageHeader'
import { useToast } from '../../hooks/useToast'
import api from '../../lib/api'
import { formatCurrency, formatDate, formatDateTime } from '../../lib/format'
import { fieldClass } from '../../lib/formStyles'
import { toInvitationForm } from '../../lib/invitationStatus'

// Editor Self Editing: client mengisi data + teks + foto sendiri dengan live
// preview, lalu "Ajukan Terbit". Admin memeriksa lalu menerbitkan (link
// undangan) atau mengembalikan dengan catatan.
export default function SelfEditorPage() {
  const { id } = useParams()
  const toast = useToast()
  const [data, setData] = useState(null)
  const [form, setForm] = useState(null)
  const [errors, setErrors] = useState({})
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState(null) // 'submit' | 'revision' | null
  const [switchOpen, setSwitchOpen] = useState(false)
  const [mobileTab, setMobileTab] = useState('edit')

  usePageHeader('Self Editing', data ? `Pesanan ${data.order.order_number}` : undefined)

  const apply = (next) => {
    setData(next)
    setForm(toInvitationForm(next))
  }

  useEffect(() => {
    let cancelled = false
    api
      .get(`/client/orders/${id}/invitation`)
      .then(({ data: res }) => {
        if (!cancelled) apply(res.data)
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(
            err.response?.status === 403 || err.response?.status === 404
              ? 'Undangan tidak ditemukan.'
              : err.response?.data?.message || 'Gagal memuat undangan.',
          )
        }
      })
    return () => {
      cancelled = true
    }
  }, [id])

  const handleError = (err, fallback) => {
    if (err.response?.status === 422 && err.response.data.errors) {
      setErrors(err.response.data.errors)
      toast.error('Masih ada data yang belum lengkap, cek kolom yang ditandai merah.')
    } else {
      toast.error(err.response?.data?.message || fallback)
    }
  }

  const requestRevision = async () => {
    setSaving(true)
    try {
      const { data: res } = await api.put(`/client/orders/${id}/invitation/revision`)
      apply(res.data)
      toast.success('Revisi dibuka. Ubah undanganmu lalu ajukan terbit lagi.')
    } catch (err) {
      handleError(err, 'Gagal membuka revisi.')
    } finally {
      setSaving(false)
      setConfirm(null)
    }
  }

  const saveDraft = async () => {
    setSaving(true)
    setErrors({})
    try {
      const { data: res } = await api.put(`/client/orders/${id}/invitation`, form)
      apply(res.data)
      toast.success('Draft tersimpan.')
    } catch (err) {
      handleError(err, 'Gagal menyimpan draft.')
    } finally {
      setSaving(false)
    }
  }

  const submit = async () => {
    setSaving(true)
    setErrors({})
    try {
      await api.put(`/client/orders/${id}/invitation`, form)
      const { data: res } = await api.put(`/client/orders/${id}/invitation/submit`)
      apply(res.data)
      toast.success('Undangan diajukan! Admin akan memeriksa lalu menerbitkannya.')
    } catch (err) {
      handleError(err, 'Gagal mengajukan undangan.')
    } finally {
      setSaving(false)
      setConfirm(null)
    }
  }

  // Aksi foto hanya memperbarui daftar foto, isi form yang belum disimpan tetap.
  const applyPhotos = (next) => setData(next)

  if (loadError) {
    return (
      <div className="space-y-3">
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{loadError}</p>
        <Link to="/client/self-editing" className="text-sm font-medium text-violet-600 hover:underline">
          ← Kembali ke Self Editing
        </Link>
      </div>
    )
  }

  if (!data || !form) {
    return (
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <ListSkeleton rows={4} />
      </div>
    )
  }

  const { order } = data
  const isSelf = data.editing_mode === 'self'

  return (
    <div className="space-y-6">
      <Link to="/client/self-editing" className="inline-block text-sm font-medium text-violet-600 hover:underline">
        ← Self Editing
      </Link>

      <section className="animate-fade-up flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
        {order.theme?.thumbnail && (
          <img
            src={order.theme.thumbnail}
            alt={order.theme.name}
            className="h-20 w-14 shrink-0 rounded-lg object-cover ring-1 ring-slate-200"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-700">
              {order.order_number}
            </span>
            {isSelf && <InvitationDataBadge status={data.data_status} mode="self" />}
          </div>
          <p className="mt-1 truncate font-semibold text-slate-900">{order.theme?.name ?? order.product_service_name}</p>
          <p className="text-xs text-slate-500">Paket {order.package?.name}</p>
        </div>
      </section>

      {!isSelf ? (
        <NotSelfNotice data={data} />
      ) : (
        <>
          {order.invitation_url && (
            <section className="animate-fade-up rounded-2xl bg-emerald-50 p-5 ring-1 ring-emerald-200">
              <p className="text-sm font-semibold text-emerald-900">Undangan kamu sudah terbit! 🎉</p>
              <a
                href={order.invitation_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block break-all text-sm font-medium text-emerald-700 hover:underline"
              >
                {order.invitation_url}
              </a>
              {order.invitation_expires_at && (
                <p className="mt-1 text-xs text-emerald-800">Aktif sampai {formatDate(order.invitation_expires_at)}</p>
              )}
            </section>
          )}

          {data.can_request_revision && (
            <section className="animate-fade-up flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Mau mengubah undangan?</p>
                <p className="text-xs text-slate-500">
                  Sisa revisi mandiri: <strong>{data.revisions_left}</strong> dari {data.max_revisions}x.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConfirm('revision')}
                className="shrink-0 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
              >
                Ajukan Revisi
              </button>
            </section>
          )}

          {data.data_status === 'revision' && data.revision_count > 0 && (
            <p className="animate-fade-up rounded-2xl bg-sky-50 px-4 py-3 text-sm text-sky-800 ring-1 ring-sky-200">
              Revisi ke-{data.revision_count} dari {data.max_revisions}. Ubah yang perlu lalu tekan Ajukan Terbit.
            </p>
          )}

          {data.mode_switch_requested_at && (
            <p className="animate-fade-up rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
              Permintaan pindah ke Admin Editing dikirim {formatDateTime(data.mode_switch_requested_at)}, menunggu
              konfirmasi admin.
            </p>
          )}

          {data.mode_switch_note && !data.mode_switch_requested_at && (
            <p className="animate-fade-up rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700 ring-1 ring-slate-200">
              Permintaan pindah ke Admin Editing ditolak: {data.mode_switch_note}
            </p>
          )}

          {data.review_note && data.can_edit && (
            <div className="animate-fade-up rounded-2xl bg-red-50 p-4 ring-1 ring-red-200">
              <p className="text-sm font-semibold text-red-800">Dikembalikan oleh admin</p>
              <p className="mt-1 text-sm whitespace-pre-line text-red-700">{data.review_note}</p>
              <p className="mt-2 text-xs text-red-600">Perbaiki sesuai catatan di atas, lalu tekan Ajukan Terbit lagi.</p>
            </div>
          )}

          {data.submitted_at && (
            <p className="animate-fade-up rounded-2xl bg-violet-50 px-4 py-3 text-sm text-violet-800 ring-1 ring-violet-200">
              Diajukan {formatDateTime(data.submitted_at)}.{' '}
              {order.invitation_url
                ? 'Butuh revisi? Hubungi admin.'
                : 'Admin sedang memeriksa dan akan menerbitkan undangan kamu.'}
            </p>
          )}

          {data.wordpress ? (
            <WordpressSelfEditor
              key={data.submitted_at ?? 'draft'}
              orderId={id}
              data={data}
              onApply={apply}
              photoSection={<PhotoSection orderId={id} data={data} onChanged={applyPhotos} />}
            />
          ) : (
          <>
          {/* Di HP editor & preview bergantian, di layar lebar berdampingan. */}
          <div className="flex gap-2 lg:hidden">
            {[
              ['edit', 'Edit'],
              ['preview', 'Preview'],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setMobileTab(key)}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${
                  mobileTab === key ? 'bg-violet-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className={mobileTab === 'edit' ? '' : 'hidden lg:block'}>
              <InvitationForm
                form={form}
                setForm={setForm}
                errors={errors}
                readOnly={!data.can_edit}
                saving={saving}
                lastSaved={!data.submitted_at ? data.updated_at : null}
                onSaveDraft={saveDraft}
                onSubmit={() => setConfirm('submit')}
                submitLabel="Ajukan Terbit"
                extra={
                  <>
                    <ContentSection form={form} setForm={setForm} errors={errors} />
                    <PhotoSection orderId={id} data={data} onChanged={applyPhotos} />
                  </>
                }
              />
            </div>
            <div className={mobileTab === 'preview' ? '' : 'hidden lg:block'}>
              <div className="lg:sticky lg:top-6">
                <InvitationPreview
                  form={form}
                  photos={data.photos}
                  template={data.template}
                  themeName={order.theme?.name}
                />
              </div>
            </div>
          </div>
          </>
          )}

          {data.can_request_mode_switch && (
            <p className="text-center text-xs text-slate-500">
              Tidak sempat mengedit sendiri?{' '}
              <button type="button" onClick={() => setSwitchOpen(true)} className="font-medium text-violet-600 hover:underline">
                Minta pindah ke Admin Editing
              </button>
            </p>
          )}
        </>
      )}

      <ConfirmDialog
        open={confirm === 'revision'}
        onClose={() => setConfirm(null)}
        onConfirm={requestRevision}
        loading={saving}
        title="Ajukan revisi?"
        description={`Undangan dibuka lagi untuk diedit, lalu kamu ajukan terbit ulang. Sisa revisi: ${data.revisions_left ?? 0} dari ${data.max_revisions}x.`}
        confirmLabel="Ya, Buka Revisi"
        icon={<path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Z" />}
      />
      {switchOpen && (
        <ModeSwitchModal
          orderId={id}
          fee={data.self_editing_fee}
          onClose={() => setSwitchOpen(false)}
          onSent={(next) => {
            apply(next)
            setSwitchOpen(false)
          }}
        />
      )}
      <ConfirmDialog
        open={confirm === 'submit'}
        onClose={() => setConfirm(null)}
        onConfirm={submit}
        loading={saving}
        tone="emerald"
        title="Ajukan terbit sekarang?"
        description="Data akan dikunci dan diperiksa admin. Kalau ada yang perlu diperbaiki, admin akan mengembalikannya dengan catatan."
        confirmLabel="Ya, Ajukan"
        loadingLabel="Mengajukan..."
        icon={<path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />}
      />
    </div>
  )
}

function NotSelfNotice({ data }) {
  return (
    <section className="animate-fade-up rounded-2xl bg-slate-50 p-5 text-sm text-slate-600 ring-1 ring-slate-200">
      {data.editing_mode === 'admin'
        ? 'Undangan ini dikerjakan admin (Admin Editing), jadi tidak bisa diedit sendiri.'
        : 'Self Editing dipilih saat checkout sebagai add-on, jadi tidak tersedia untuk pesanan ini.'}{' '}
      <Link to={`/client/undangan/${data.order.id}`} className="font-medium text-violet-600 hover:underline">
        Buka data undangan →
      </Link>
    </section>
  )
}

// Client Self Editing minta pindah ke Admin Editing; admin yang memutuskan.
function ModeSwitchModal({ orderId, fee, onClose, onSent }) {
  const toast = useToast()
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  const send = async (e) => {
    e.preventDefault()
    setSending(true)
    setError('')
    try {
      const { data: res } = await api.post(`/client/orders/${orderId}/invitation/mode-switch`, { reason })
      toast.success(res.message || 'Permintaan terkirim.')
      onSent(res.data)
    } catch (err) {
      setError(err.response?.data?.errors?.reason?.[0] || err.response?.data?.message || 'Gagal mengirim permintaan.')
    } finally {
      setSending(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Pindah ke Admin Editing">
      <form onSubmit={send} className="space-y-4 text-sm">
        <p className="text-slate-600">
          Undangan akan dikerjakan admin dari data yang sudah kamu isi. Permintaan ini perlu dikonfirmasi admin dulu.
          {Number(fee) > 0 && (
            <>
              {' '}
              Kalau disetujui, nilai pesanan berkurang <strong>{formatCurrency(fee)}</strong> (add-on Self Editing).
            </>
          )}
        </p>
        <FormField label="Alasan *" error={error}>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={1000}
            placeholder="Mis. Tidak sempat mengedit sendiri"
            className={fieldClass(error)}
          />
        </FormField>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 hover:bg-slate-100">
            Batal
          </button>
          <button
            type="submit"
            disabled={sending || !reason.trim()}
            className="rounded-lg bg-violet-600 px-4 py-2 font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
          >
            {sending ? 'Mengirim...' : 'Kirim Permintaan'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

const CONTENT_FIELDS = [
  ['opening_text', 'Kata Pembuka', 'Mis. Dengan memohon rahmat Allah SWT, kami bermaksud...', true],
  ['quote', 'Kutipan / Ayat', 'Mis. Dan di antara tanda-tanda kekuasaan-Nya...', true],
  ['quote_source', 'Sumber Kutipan', 'Mis. QS. Ar-Rum: 21', false],
  ['closing_text', 'Kata Penutup', 'Mis. Merupakan suatu kehormatan bagi kami...', true],
]

function ContentSection({ form, setForm, errors }) {
  const set = (field) => (e) => setForm((prev) => ({ ...prev, content: { ...prev.content, [field]: e.target.value } }))

  return (
    <section className="animate-fade-up space-y-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h3 className="text-base font-semibold text-slate-900">✍️ Kata-kata & Musik</h3>
      <p className="-mt-1 text-xs text-slate-500">Boleh dikosongkan, preview memakai teks bawaan.</p>
      {CONTENT_FIELDS.map(([field, label, placeholder, multiline]) => (
        <FormField key={field} label={label} error={errors[`content.${field}`]}>
          {multiline ? (
            <textarea
              rows={3}
              value={form.content[field] ?? ''}
              onChange={set(field)}
              placeholder={placeholder}
              className={fieldClass(errors[`content.${field}`])}
            />
          ) : (
            <input
              value={form.content[field] ?? ''}
              onChange={set(field)}
              placeholder={placeholder}
              className={fieldClass(errors[`content.${field}`])}
            />
          )}
        </FormField>
      ))}
      <FormField
        label="Link Musik Latar"
        error={errors['content.music_url']}
        hint="Link lagu (YouTube / MP3). Admin akan memasangnya saat menerbitkan."
      >
        <input
          type="url"
          value={form.content.music_url ?? ''}
          onChange={set('music_url')}
          placeholder="https://..."
          className={fieldClass(errors['content.music_url'])}
        />
      </FormField>
    </section>
  )
}

function PhotoSection({ orderId, data, onChanged }) {
  const toast = useToast()
  const inputRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const photos = data.photos ?? []
  const full = photos.length >= data.max_photos

  // Beberapa file diunggah berurutan supaya batas foto paket tetap dicek server.
  const upload = async (files) => {
    setBusy(true)
    let latest = null
    try {
      for (const file of files) {
        const body = new FormData()
        body.append('photo', file)
        const { data: res } = await api.post(`/client/orders/${orderId}/invitation/photos`, body)
        latest = res.data
      }
    } catch (err) {
      const errs = err.response?.data?.errors
      toast.error(errs?.photo?.[0] || err.response?.data?.message || 'Gagal mengunggah foto.')
    } finally {
      if (latest) onChanged(latest)
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const act = async (request, message) => {
    setBusy(true)
    try {
      const { data: res } = await request
      onChanged(res.data)
      toast.success(message)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memproses foto.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="animate-fade-up space-y-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-slate-900">📷 Foto</h3>
        <span className="text-xs font-medium text-slate-500">
          {photos.length}/{data.max_photos} foto
        </span>
      </div>
      <p className="-mt-1 text-xs text-slate-500">
        Foto sampul tampil di halaman depan, sisanya jadi galeri. JPG/PNG/WEBP, maks 4 MB per foto.
      </p>

      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo) => (
            <div key={photo.id} className="group relative overflow-hidden rounded-xl ring-1 ring-slate-200">
              <img src={photo.url} alt="" className="aspect-square w-full object-cover" />
              {photo.is_cover && (
                <span className="absolute top-2 left-2 rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                  Sampul
                </span>
              )}
              {data.can_edit && (
                <div className="absolute inset-x-0 bottom-0 flex gap-1 bg-gradient-to-t from-black/70 to-transparent p-2 pt-6">
                  {!photo.is_cover && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        act(api.put(`/client/orders/${orderId}/invitation/photos/${photo.id}/cover`), 'Foto sampul diganti.')
                      }
                      className="flex-1 rounded-md bg-white/90 px-1.5 py-1 text-[11px] font-semibold text-slate-800 hover:bg-white"
                    >
                      Jadikan Sampul
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => act(api.delete(`/client/orders/${orderId}/invitation/photos/${photo.id}`), 'Foto dihapus.')}
                    className="rounded-md bg-red-600/90 px-2 py-1 text-[11px] font-semibold text-white hover:bg-red-600"
                  >
                    Hapus
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {data.can_edit && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []).slice(0, data.max_photos - photos.length)
              if (files.length) upload(files)
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy || full}
            className="w-full rounded-xl border-2 border-dashed border-slate-300 px-4 py-4 text-sm font-medium text-slate-600 transition hover:border-violet-400 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? 'Memproses...' : full ? 'Batas foto paket sudah tercapai' : '+ Tambah Foto'}
          </button>
        </>
      )}
    </section>
  )
}
