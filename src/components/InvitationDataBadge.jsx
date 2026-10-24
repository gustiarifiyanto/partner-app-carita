import { INVITATION_DATA_STATUS, SELF_EDITING_STATUS_LABEL } from '../lib/invitationStatus'

// Badge status data undangan; tidak tampil untuk order lama (not_required).
// Order Self Editing memakai label sendiri (Draft / Menunggu Diterbitkan).
export default function InvitationDataBadge({ status, mode }) {
  const base = INVITATION_DATA_STATUS[status]
  const meta = base && mode === 'self' && SELF_EDITING_STATUS_LABEL[status] ? { ...base, label: SELF_EDITING_STATUS_LABEL[status] } : base
  if (!meta) return null
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${meta.className}`}>
      {meta.label}
    </span>
  )
}
