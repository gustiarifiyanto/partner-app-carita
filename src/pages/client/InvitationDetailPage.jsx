import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ConfirmDialog from '../../components/ConfirmDialog'
import InvitationDataBadge from '../../components/InvitationDataBadge'
import ListSkeleton from '../../components/ListSkeleton'
import ThemeDemoButton from '../../components/catalog/ThemeDemoButton'
import InvitationForm from '../../components/invitation/InvitationForm'
import { useAuth } from '../../hooks/useAuth'
import { usePageHeader } from '../../hooks/usePageHeader'
import { useToast } from '../../hooks/useToast'
import api from '../../lib/api'
import { clientOrderStatus } from '../../lib/clientOrderStatus'
import { buildWaLink } from '../../lib/contact'
import { formatDate, formatDateTime } from '../../lib/format'
import { toInvitationForm } from '../../lib/invitationStatus'

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
            {(order.status !== 'completed' || data.data_status === 'revision') && (
              <InvitationDataBadge status={data.data_status} mode={data.editing_mode} />
            )}
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

      {data.editing_mode === 'self' && (
        <Link
          to={`/client/self-editing/${order.id}`}
          className="animate-fade-up group flex items-center justify-between gap-3 rounded-2xl bg-fuchsia-50 p-5 ring-1 ring-fuchsia-200 transition hover:bg-fuchsia-100"
        >
          <div>
            <p className="text-sm font-semibold text-fuchsia-900">✏️ Mode: Self Editing</p>
            <p className="mt-0.5 text-sm text-fuchsia-800">Undangan ini kamu edit sendiri di editor Self Editing.</p>
          </div>
          <span className="shrink-0 text-sm font-semibold text-fuchsia-700 group-hover:underline">Buka Editor →</span>
        </Link>
      )}

      {adminMode && (
        <section className="animate-fade-up flex flex-col gap-3 rounded-2xl bg-violet-50 p-5 ring-1 ring-violet-200 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-violet-900">
            <p className="font-semibold">Mode: Admin Editing</p>
            <p className="mt-0.5 text-violet-800">
              {data.data_status === 'revision'
                ? 'Admin membuka revisi data undangan kamu. Ubah data yang perlu direvisi lalu tekan "Kirim Data" lagi.'
                : data.submitted_at
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
        <div className="rounded-xl bg-slate-50 p-4 opacity-80 ring-1 ring-slate-200" aria-disabled="true">
          <p className="text-2xl">✏️</p>
          <p className="mt-2 font-semibold text-slate-900">Self Editing</p>
          <p className="mt-1 text-sm text-slate-600">
            Self Editing adalah add-on yang dipilih saat membuat pesanan, jadi tidak tersedia untuk pesanan ini.
          </p>
        </div>
      </div>
    </section>
  )
}
