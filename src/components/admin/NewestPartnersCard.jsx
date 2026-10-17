import { getAvatarSrc } from '../../lib/avatarOptions'
import { formatDate } from '../../lib/format'
import StatusBadge from '../StatusBadge'

function UserPlusIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.375 21c-2.331 0-4.512-.645-6.374-1.766Z"
      />
    </svg>
  )
}

function SparkleBadge() {
  return (
    <span className="animate-sparkle-pop absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white ring-2 ring-white">
      <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2z" />
      </svg>
    </span>
  )
}

function getInitials(name) {
  if (!name) return '?'
  return name.trim().slice(0, 2).toUpperCase()
}

export default function NewestPartnersCard({ partners }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-sm">
          <UserPlusIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-900">Partner Terbaru</h2>
          <p className="truncate text-xs text-slate-400">Partner baru yang bergabung</p>
        </div>
      </div>

      {partners.length === 0 ? (
        <p className="text-sm text-slate-400">Belum ada data.</p>
      ) : (
        <ul className="space-y-1">
          {partners.map((partner) => {
            const avatarSrc = partner.avatar ? getAvatarSrc(partner.avatar) : null

            return (
              <li
                key={partner.id}
                className="flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition hover:bg-slate-50"
              >
                <span className="relative shrink-0">
                  {avatarSrc ? (
                    <img src={avatarSrc} alt="" className="h-9 w-9 rounded-full object-cover ring-2 ring-white" />
                  ) : (
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-blue-500 text-xs font-bold text-white">
                      {getInitials(partner.company_name)}
                    </span>
                  )}
                  <SparkleBadge />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{partner.company_name}</p>
                  <p className="text-xs text-slate-500">{formatDate(partner.created_at)}</p>
                </div>
                <StatusBadge status={partner.verification_status} />
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
