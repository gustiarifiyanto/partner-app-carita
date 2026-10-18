import { useState } from 'react'
import CopyButton from '../CopyButton'
import { WhatsAppIcon } from '../partner/ClientAccessShareModal'
import { useToast } from '../../hooks/useToast'
import api from '../../lib/api'
import { toWaNumber } from '../../lib/clientAccess'
import { formatDateTime } from '../../lib/format'
import { buildInvitationReminderMessage } from '../../lib/invitationReminder'

const CHANNEL_LABEL = { email: 'Email', whatsapp: 'WhatsApp' }

// Pengingat ke client untuk segera mengisi data undangan, dari detail order
// admin & partner. Email dikirim server; WA dibuka lewat wa.me lalu dicatat.
export default function InvitationReminderCard({ reminder, endpoint, orderNumber, senderName, onUpdated }) {
  const toast = useToast()
  const [sending, setSending] = useState(false)

  if (!reminder?.can_remind) return null

  const message = buildInvitationReminderMessage(reminder, orderNumber, senderName)
  const waLink = `https://wa.me/${toWaNumber(reminder.phone)}?text=${encodeURIComponent(message)}`
  const emailCooldown = Boolean(reminder.email_available_at)

  const sendEmail = async () => {
    setSending(true)
    try {
      const { data } = await api.post(endpoint, { channel: 'email' })
      onUpdated(data.invitation_reminder)
      toast.success(data.message || 'Email pengingat terkirim.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengirim email pengingat.')
    } finally {
      setSending(false)
    }
  }

  // WA dibuka langsung oleh link (supaya tidak diblokir popup blocker); pencatatan menyusul.
  const recordWhatsapp = () => {
    api
      .post(endpoint, { channel: 'whatsapp' })
      .then(({ data }) => onUpdated(data.invitation_reminder))
      .catch(() => {})
  }

  return (
    <section className="animate-fade-up space-y-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 p-5 shadow-sm ring-1 ring-amber-200 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
            />
          </svg>
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-900">Ingatkan Client Isi Data Undangan</h3>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
            {reminder.client_name || 'Client'} belum mengirim data mempelai &amp; acara. Order baru bisa dikerjakan
            setelah datanya lengkap.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {reminder.last_reminded_at
              ? `Terakhir diingatkan ${formatDateTime(reminder.last_reminded_at)} via ${CHANNEL_LABEL[reminder.last_reminded_channel] ?? '-'}`
              : 'Belum pernah diingatkan.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={recordWhatsapp}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          <WhatsAppIcon />
          Kirim via WhatsApp
        </a>
        <button
          type="button"
          onClick={sendEmail}
          disabled={sending || emailCooldown || !reminder.email}
          title={emailCooldown ? `Bisa kirim lagi ${formatDateTime(reminder.email_available_at)}` : undefined}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 6.75c0-.83.67-1.5 1.5-1.5h16.5c.83 0 1.5.67 1.5 1.5v10.5c0 .83-.67 1.5-1.5 1.5H3.75a1.5 1.5 0 0 1-1.5-1.5V6.75Z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" d="m3 7 9 6 9-6" />
          </svg>
          {sending ? 'Mengirim...' : emailCooldown ? 'Email baru saja dikirim' : 'Kirim via Email'}
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span className="min-w-0 truncate">
          {reminder.phone ? `WA: ${reminder.phone}` : 'Nomor WA client kosong, pilih kontak di WhatsApp.'}
          {reminder.email ? ` · Email: ${reminder.email}` : ''}
        </span>
        <CopyButton text={message} label="Salin pesan" successMessage="Pesan pengingat disalin." variant="light" />
      </div>
    </section>
  )
}
