import { getAvatarSrc } from '../lib/avatarOptions'

const GRADIENTS = [
  'linear-gradient(135deg, #818CF8, #4F46E5)',
  'linear-gradient(135deg, #34D399, #059669)',
  'linear-gradient(135deg, #FBBF24, #D97706)',
  'linear-gradient(135deg, #F472B6, #DB2777)',
  'linear-gradient(135deg, #22D3EE, #0284C7)',
]

const SIZES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-20 w-20 text-2xl',
}

// Shows the partner's chosen avatar, falling back to colored initials.
export default function PartnerAvatar({ partner, size = 'md' }) {
  const dimension = SIZES[size] || SIZES.md
  const avatarSrc = partner?.avatar ? getAvatarSrc(partner.avatar) : null

  if (avatarSrc) {
    return <img src={avatarSrc} alt="" className={`${dimension} shrink-0 rounded-full object-cover shadow-sm`} />
  }

  const initials =
    (partner?.company_name || '?')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase() || '?'

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-white shadow-sm ${dimension}`}
      style={{ backgroundImage: GRADIENTS[(partner?.id || 0) % GRADIENTS.length] }}
    >
      {initials}
    </span>
  )
}
