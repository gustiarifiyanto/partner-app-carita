import { useState } from 'react'
import CopyButton from '../CopyButton'
import FormField from '../FormField'
import { WhatsAppIcon } from '../partner/ClientAccessShareModal'
import { useToast } from '../../hooks/useToast'
import api from '../../lib/api'
import { toWaNumber } from '../../lib/clientAccess'
import { formatDate, formatDateTime } from '../../lib/format'
import { fieldClass } from '../../lib/formStyles'
import { buildInvitationReadyMessage } from '../../lib/invitationReminder'

const CHANNEL_LABEL = { email: 'Email', whatsapp: 'WhatsApp' }

// Link undangan yang sudah jadi: diisi saat order dikerjakan/selesai, lalu
// dikirim ke client via WA (wa.me) atau email (server) setelah order selesai.
export default function InvitationLinkPanel({ order, link, onSaved, onUpdated }) {
  const toast = useToast()
  const [editing, setEditing] = useState(!link?.url)
  const [form, setForm] = useState(() => initialForm(link))
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  if (!link || (!link.can_edit && !link.url)) return null

  const save = async (e) => {
    e.preventDefault()
    setBusy(true)
    setErrors({})
    try {
      const { data } = await api.put(`/admin/orders/${order.id}/invitation-link`, {
        invitation_url: form.url.trim(),
        invitation_expires_at: form.expiresAt || null,
      })
      toast.success('Link undangan disimpan.')
      setEditing(false)
      onSaved(data.invitation_link)
    } catch (err) {
      if (err.response?.status === 422 && err.response.data.errors) {
        setErrors(err.response.data.errors)
      } else {
        toast.error(err.response?.data?.message || 'Gagal menyimpan link undangan.')
      }
    } finally {
      setBusy(false)
    }
  }

  const sendEmail = async () => {
    setBusy(true)
    try {
      const { data } = await api.post(`/admin/orders/${order.id}/invitation-link/send`, { channel: 'email' })
      onUpdated(data.invitation_link)
      toast.success(data.message || 'Link undangan terkirim ke email client.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengirim email.')
    } finally {
      setBusy(false)
    }
  }

  // WA dibuka langsung oleh link (supaya tidak diblokir popup blocker); pencatatan menyusul.
  const recordWhatsapp = () => {
    api
      .post(`/admin/orders/${order.id}/invitation-link/send`, { channel: 'whatsapp' })
      .then(({ data }) => onUpdated(data.invitation_link))
      .catch(() => {})
  }

  const message = link.url
    ? buildInvitationReadyMessage(link, order.order_number, link.expires_at ? formatDate(link.expires_at) : null)
    : ''
  const emailCooldown = Boolean(link.email_available_at)

  return (
    <section className="animate-fade-up space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">💌 Link Undangan</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {link.can_send
              ? link.last_sent_at
                ? `Terakhir dikirim ke client ${formatDateTime(link.last_sent_at)} via ${CHANNEL_LABEL[link.last_sent_channel] ?? '-'}`
                : 'Order sudah selesai. Kirim link undangan ke client.'
              : order.status === 'completed'
                ? 'Isi link undangan yang sudah jadi, lalu kirim ke client.'
                : 'Link bisa diisi sekarang, dan dikirim ke client setelah order diselesaikan.'}
          </p>
        </div>
        {link.url && !editing && link.can_edit && (
          <button
            type="button"
            onClick={() => {
              setForm(initialForm(link))
              setEditing(true)
            }}
            className="shrink-0 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Ubah Link
          </button>
        )}
      </div>

      {editing ? (
        <form onSubmit={save} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <FormField label="Link Undangan *" error={errors.invitation_url}>
                <input
                  type="url"
                  value={form.url}
                  onChange={(e) => setForm((prev) => ({ ...prev, url: e.target.value }))}
                  placeholder="https://..."
                  className={fieldClass(errors.invitation_url)}
                />
              </FormField>
            </div>
            <FormField
              label="Aktif Sampai"
              error={errors.invitation_expires_at}
              hint={link.suggested_expires_at ? 'Default dari masa aktif paket' : 'Kosongkan kalau tanpa batas'}
            >
              <input
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm((prev) => ({ ...prev, expiresAt: e.target.value }))}
                className={fieldClass(errors.invitation_expires_at)}
              />
            </FormField>
          </div>
          <div className="flex justify-end gap-2">
            {link.url && (
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
              >
                Batal
              </button>
            )}
            <button
              type="submit"
              disabled={busy || !form.url.trim()}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
            >
              {busy ? 'Menyimpan...' : 'Simpan Link'}
            </button>
          </div>
        </form>
      ) : (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-200">
          <div className="min-w-0">
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block truncate text-sm font-semibold text-emerald-800 hover:underline"
            >
              {link.url}
            </a>
            <p className="text-xs text-emerald-700">
              {link.expires_at ? `Aktif sampai ${formatDate(link.expires_at)}` : 'Tanpa batas waktu'}
            </p>
          </div>
          <CopyButton text={link.url} label="" successMessage="Link undangan disalin." variant="light" />
        </div>
      )}

      {link.can_send && !editing && (
        <>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <a
              href={`https://wa.me/${toWaNumber(link.phone)}?text=${encodeURIComponent(message)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={recordWhatsapp}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <WhatsAppIcon />
              Kirim Link via WhatsApp
            </a>
            <button
              type="button"
              onClick={sendEmail}
              disabled={busy || emailCooldown || !link.email}
              title={emailCooldown ? `Bisa kirim lagi ${formatDateTime(link.email_available_at)}` : undefined}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? 'Mengirim...' : emailCooldown ? 'Email baru saja dikirim' : 'Kirim Link via Email'}
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span className="min-w-0 truncate">
              {link.phone ? `WA: ${link.phone}` : 'Nomor WA client kosong, pilih kontak di WhatsApp.'}
              {link.email ? ` · Email: ${link.email}` : ''}
            </span>
            <CopyButton text={message} label="Salin pesan" successMessage="Pesan disalin." variant="light" />
          </div>
        </>
      )}
    </section>
  )
}

function initialForm(link) {
  return {
    url: link?.url ?? '',
    expiresAt: (link?.expires_at ?? link?.suggested_expires_at ?? '').slice(0, 10),
  }
}
