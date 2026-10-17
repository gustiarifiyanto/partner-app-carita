import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ConfirmDialog from '../../components/ConfirmDialog'
import FormField from '../../components/FormField'
import InvitationDataBadge from '../../components/InvitationDataBadge'
import ListSkeleton from '../../components/ListSkeleton'
import ThemeDemoButton from '../../components/catalog/ThemeDemoButton'
import { useAuth } from '../../hooks/useAuth'
import { usePageHeader } from '../../hooks/usePageHeader'
import { useToast } from '../../hooks/useToast'
import api from '../../lib/api'
import { clientOrderStatus } from '../../lib/clientOrderStatus'
import { buildWaLink } from '../../lib/contact'
import { formatDate, formatDateTime } from '../../lib/format'
import { fieldClass } from '../../lib/formStyles'
import { EMPTY_EVENT } from '../../lib/invitationStatus'

const PERSON_FIELDS = [
  ['full_name', 'Nama Lengkap', 'Mis. Budi Santoso, S.Kom.'],
  ['nickname', 'Nama Panggilan', 'Mis. Budi'],
  ['father_name', 'Nama Ayah', 'Mis. Bapak Santoso'],
  ['mother_name', 'Nama Ibu', 'Mis. Ibu Sari'],
]

// Ambil isi form dari respons API (objek kosong dari server bisa berupa {}).
function toForm(data) {
  return {
    groom: { ...data.groom },
    bride: { ...data.bride },
    events: data.events?.length ? data.events.map((e) => ({ ...EMPTY_EVENT, ...e })) : [{ ...EMPTY_EVENT, name: 'Akad Nikah' }],
    notes: data.notes ?? '',
  }
}

export default function ClientInvitationDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const toast = useToast()
  const [data, setData] = useState(null)
  const [form, setForm] = useState(null)
  const [errors, setErrors] = useState({})
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState(null) // 'mode' | 'submit' | null

  usePageHeader('Undangan Saya', data ? `Pesanan ${data.order.order_number}` : undefined)

  const apply = (next) => {
    setData(next)
    setForm(toForm(next))
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
              : err.response?.data?.message || 'Gagal memuat data undangan.',
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

  const chooseAdminMode = async () => {
    setSaving(true)
    try {
      const { data: res } = await api.put(`/client/orders/${id}/invitation/mode`, { mode: 'admin' })
      apply(res.data)
      setConfirm(null)
      toast.success('Admin Editing dipilih. Silakan lengkapi data undangan.')
    } catch (err) {
      setConfirm(null)
      handleError(err, 'Gagal menyimpan pilihan.')
    } finally {
      setSaving(false)
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

  // Simpan dulu isi form terbaru, baru kirim (kunci).
  const submitData = async () => {
    setSaving(true)
    setErrors({})
    try {
      await api.put(`/client/orders/${id}/invitation`, form)
      const { data: res } = await api.put(`/client/orders/${id}/invitation/submit`)
      apply(res.data)
      toast.success('Data undangan terkirim! Admin akan segera mengerjakan undangan kamu.')
    } catch (err) {
      handleError(err, 'Gagal mengirim data.')
    } finally {
      setSaving(false)
      setConfirm(null)
    }
  }

  if (loadError) {
    return (
      <div className="space-y-3">
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{loadError}</p>
        <Link to="/client/undangan" className="text-sm font-medium text-violet-600 hover:underline">
          ← Kembali ke Undangan Saya
        </Link>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <ListSkeleton rows={4} />
      </div>
    )
  }

  const { order } = data
  const status = clientOrderStatus(order.status)
  const fullName = user?.client?.full_name || user?.name
  const revisionHref = buildWaLink(
    `Halo Admin Carita, saya ${fullName} ingin request revisi undangan untuk pesanan ${order.order_number} (${order.product_service_name}).`,
  )
  const adminMode = data.editing_mode === 'admin'

  return (
    <div className="space-y-6">
      <Link to="/client/undangan" className="inline-block text-sm font-medium text-violet-600 hover:underline">
        ← Undangan Saya
      </Link>

      <section className="animate-fade-up flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:flex-row sm:p-6">
        {order.theme?.thumbnail && (
          <img
            src={order.theme.thumbnail}
            alt={order.theme.name}
            className="h-40 w-full shrink-0 rounded-xl object-cover ring-1 ring-slate-200 sm:h-36 sm:w-28"
          />
        )}
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs font-semibold tracking-wide text-slate-800">
              {order.order_number}
            </span>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${status.className}`}>
              {status.label}
            </span>
            {order.status !== 'completed' && <InvitationDataBadge status={data.data_status} />}
          </div>
          <p className="text-lg font-semibold text-slate-900">{order.theme?.name ?? order.product_service_name}</p>
          <p className="text-sm text-slate-500">
            Paket {order.package?.name} · Dipesan {formatDate(order.created_at)}
          </p>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {order.theme?.demo_url && (
              <ThemeDemoButton theme={order.theme} label="Lihat demo tema" className="font-medium text-violet-600 hover:underline" />
            )}
            <Link to={`/client/orders/${order.id}`} className="font-medium text-slate-500 hover:text-slate-700 hover:underline">
              Detail pesanan & pembayaran
            </Link>
          </div>
        </div>
      </section>

      {order.invitation_url && (
        <section className="animate-fade-up rounded-2xl bg-emerald-50 p-5 ring-1 ring-emerald-200">
          <p className="text-sm font-semibold text-emerald-900">Undangan kamu sudah siap! 🎉</p>
          <a
            href={order.invitation_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block break-all text-sm font-medium text-emerald-700 hover:underline"
          >
            {order.invitation_url}
          </a>
          {order.invitation_expires_at && (
            <p className="mt-1 text-xs text-emerald-800">Aktif sampai {formatDate(order.invitation_expires_at)}</p>
          )}
        </section>
      )}

      {data.can_choose_mode && <ModeChooser onChooseAdmin={() => setConfirm('mode')} />}

      {adminMode && (
        <section className="animate-fade-up flex flex-col gap-3 rounded-2xl bg-violet-50 p-5 ring-1 ring-violet-200 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-violet-900">
            <p className="font-semibold">Mode: Admin Editing</p>
            <p className="mt-0.5 text-violet-800">
              {data.submitted_at
                ? `Data terkirim ${formatDateTime(data.submitted_at)} dan sedang dikerjakan admin. Butuh perubahan? Hubungi admin untuk request revisi.`
                : 'Undangan dikerjakan oleh admin Carita. Lengkapi data di bawah lalu tekan "Kirim Data" supaya undangan bisa mulai dikerjakan.'}
            </p>
          </div>
          <a
            href={revisionHref}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-lg bg-emerald-600 px-4 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            Hubungi Admin
          </a>
        </section>
      )}

      {adminMode && form && (
        <InvitationForm
          form={form}
          setForm={setForm}
          errors={errors}
          readOnly={!data.can_edit}
          saving={saving}
          lastSaved={!data.submitted_at ? data.updated_at : null}
          onSaveDraft={saveDraft}
          onSubmit={() => setConfirm('submit')}
        />
      )}

      <ConfirmDialog
        open={confirm === 'mode'}
        onClose={() => setConfirm(null)}
        onConfirm={chooseAdminMode}
        loading={saving}
        title="Pilih Admin Editing?"
        description="Undangan akan dikerjakan oleh admin dari data yang kamu isi. Pilihan ini tidak bisa diganti sendiri, kalau perlu ubah hubungi admin."
        confirmLabel="Ya, Admin Editing"
        icon={<path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />}
      />
      <ConfirmDialog
        open={confirm === 'submit'}
        onClose={() => setConfirm(null)}
        onConfirm={submitData}
        loading={saving}
        title="Kirim data undangan?"
        description="Setelah dikirim, data dikunci dan admin mulai mengerjakan undangan. Perubahan selanjutnya lewat request revisi ke admin."
        confirmLabel="Ya, Kirim Data"
        icon={<path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />}
      />
    </div>
  )
}

function ModeChooser({ onChooseAdmin }) {
  return (
    <section className="animate-fade-up space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Pilih cara pengerjaan undangan</h2>
        <p className="mt-0.5 text-sm text-slate-500">Pilihan ini hanya bisa dipilih sekali.</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={onChooseAdmin}
          className="group rounded-xl p-4 text-left ring-2 ring-violet-200 transition hover:bg-violet-50 hover:ring-violet-500"
        >
          <p className="text-2xl">🧑‍💻</p>
          <p className="mt-2 font-semibold text-slate-900">Admin Editing</p>
          <p className="mt-1 text-sm text-slate-600">
            Kamu cukup isi data mempelai & acara, admin Carita yang membuatkan undangannya. Revisi lewat admin.
          </p>
          <span className="mt-3 inline-block text-sm font-semibold text-violet-600 group-hover:underline">Pilih →</span>
        </button>
        <div className="relative rounded-xl bg-slate-50 p-4 opacity-70 ring-1 ring-slate-200" aria-disabled="true">
          <span className="absolute top-3 right-3 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
            Segera Hadir
          </span>
          <p className="text-2xl">✏️</p>
          <p className="mt-2 font-semibold text-slate-900">Self Editing</p>
          <p className="mt-1 text-sm text-slate-600">
            Edit sendiri teks, foto, dan susunan undangan langsung dari dashboard. Fitur ini sedang kami siapkan.
          </p>
        </div>
      </div>
    </section>
  )
}

function InvitationForm({ form, setForm, errors, readOnly, saving, lastSaved, onSaveDraft, onSubmit }) {
  const setPerson = (person, field) => (e) =>
    setForm((prev) => ({ ...prev, [person]: { ...prev[person], [field]: e.target.value } }))

  const setEvent = (index, field) => (e) =>
    setForm((prev) => ({
      ...prev,
      events: prev.events.map((event, i) => (i === index ? { ...event, [field]: e.target.value } : event)),
    }))

  const addEvent = () =>
    setForm((prev) => ({ ...prev, events: [...prev.events, { ...EMPTY_EVENT, name: prev.events.length ? 'Resepsi' : 'Akad Nikah' }] }))

  const removeEvent = (index) => setForm((prev) => ({ ...prev, events: prev.events.filter((_, i) => i !== index) }))

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
      <fieldset disabled={readOnly || saving} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {[
            ['groom', 'Mempelai Pria', '🤵'],
            ['bride', 'Mempelai Wanita', '👰'],
          ].map(([person, title, emoji]) => (
            <section key={person} className="animate-fade-up space-y-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h3 className="text-base font-semibold text-slate-900">
                {emoji} {title}
              </h3>
              {PERSON_FIELDS.map(([field, label, placeholder]) => (
                <FormField
                  key={field}
                  label={`${label}${['full_name', 'nickname'].includes(field) ? ' *' : ''}`}
                  error={errors[`${person}.${field}`]}
                >
                  <input
                    value={form[person][field] ?? ''}
                    onChange={setPerson(person, field)}
                    placeholder={placeholder}
                    className={fieldClass(errors[`${person}.${field}`])}
                  />
                </FormField>
              ))}
            </section>
          ))}
        </div>

        <section className="animate-fade-up space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-slate-900">📅 Acara</h3>
            {!readOnly && form.events.length < 10 && (
              <button type="button" onClick={addEvent} className="text-sm font-semibold text-violet-600 hover:underline">
                + Tambah Acara
              </button>
            )}
          </div>
          {errors.events && <p className="text-xs text-red-600">{[].concat(errors.events)[0]}</p>}

          {form.events.map((event, index) => {
            const err = (field) => errors[`events.${index}.${field}`]
            return (
              <div key={index} className="space-y-3 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">Acara {index + 1}</p>
                  {!readOnly && form.events.length > 1 && (
                    <button type="button" onClick={() => removeEvent(index)} className="text-xs font-medium text-red-600 hover:underline">
                      Hapus
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <FormField label="Nama Acara *" error={err('name')}>
                    <input value={event.name} onChange={setEvent(index, 'name')} placeholder="Akad Nikah / Resepsi" className={fieldClass(err('name'))} />
                  </FormField>
                  <FormField label="Tanggal *" error={err('date')}>
                    <input type="date" value={event.date} onChange={setEvent(index, 'date')} className={fieldClass(err('date'))} />
                  </FormField>
                  <FormField label="Jam Mulai *" error={err('time_start')}>
                    <input type="time" value={event.time_start} onChange={setEvent(index, 'time_start')} className={fieldClass(err('time_start'))} />
                  </FormField>
                  <FormField label="Jam Selesai" error={err('time_end')} hint='Boleh diisi "Selesai"'>
                    <input value={event.time_end} onChange={setEvent(index, 'time_end')} placeholder="11:00 / Selesai" className={fieldClass(err('time_end'))} />
                  </FormField>
                  <FormField label="Nama Tempat *" error={err('venue_name')}>
                    <input value={event.venue_name} onChange={setEvent(index, 'venue_name')} placeholder="Mis. Masjid Agung" className={fieldClass(err('venue_name'))} />
                  </FormField>
                  <FormField label="Link Google Maps" error={err('maps_url')}>
                    <input type="url" value={event.maps_url} onChange={setEvent(index, 'maps_url')} placeholder="https://maps.app.goo.gl/..." className={fieldClass(err('maps_url'))} />
                  </FormField>
                </div>
                <FormField label="Alamat Lengkap *" error={err('address')}>
                  <textarea rows={2} value={event.address} onChange={setEvent(index, 'address')} className={fieldClass(err('address'))} />
                </FormField>
              </div>
            )
          })}
        </section>

        <section className="animate-fade-up rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <FormField label="Catatan untuk Admin" error={errors.notes} hint="Mis. warna favorit, kutipan ayat, atau permintaan khusus">
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              className={fieldClass(errors.notes)}
            />
          </FormField>
        </section>
      </fieldset>

      {!readOnly && (
        <div className="sticky bottom-3 z-10 flex flex-col gap-3 rounded-2xl bg-white/95 p-4 shadow-lg ring-1 ring-slate-200 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            {lastSaved ? `Draft terakhir disimpan ${formatDateTime(lastSaved)}` : 'Kolom bertanda * wajib diisi sebelum kirim.'}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onSaveDraft}
              disabled={saving}
              className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100 disabled:opacity-60 sm:flex-none"
            >
              {saving ? 'Menyimpan...' : 'Simpan Draft'}
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={saving}
              className="flex-1 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60 sm:flex-none"
            >
              Kirim Data
            </button>
          </div>
        </div>
      )}
    </form>
  )
}
