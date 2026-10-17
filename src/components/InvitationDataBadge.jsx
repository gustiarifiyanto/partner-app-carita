import { INVITATION_DATA_STATUS } from '../lib/invitationStatus'

// Badge status data undangan; tidak tampil untuk order lama (not_required).
export default function InvitationDataBadge({ status }) {
  const meta = INVITATION_DATA_STATUS[status]
  if (!meta) return null
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${meta.className}`}>
      {meta.label}
    </span>
  )
}
