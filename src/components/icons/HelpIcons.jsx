function Icon({ children }) {
  return (
    <svg className="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      {children}
    </svg>
  )
}

export const ShieldCheckIcon = () => (
  <Icon>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 3.25 19 6v5c0 4.5-3 8.25-7 9.75-4-1.5-7-5.25-7-9.75V6l7-2.75Z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" d="m9 12 2 2 4-4.5" />
  </Icon>
)

export const PercentIcon = () => (
  <Icon>
    <circle cx="7.5" cy="7.5" r="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="16.5" cy="16.5" r="2" strokeLinecap="round" strokeLinejoin="round" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 7 7 17" />
  </Icon>
)

export const WalletIcon = () => (
  <Icon>
    <rect x="3" y="6.5" width="18" height="12.5" rx="2.25" strokeLinecap="round" strokeLinejoin="round" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5h18" />
    <circle cx="16.75" cy="14.75" r="1" fill="currentColor" stroke="none" />
  </Icon>
)

export const BankIcon = () => (
  <Icon>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75 12 4l9 5.75" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 9.75v9M9 9.75v9M15 9.75v9M19.5 9.75v9" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 18.75h18M3 9.75h18" />
  </Icon>
)

export const WarningIcon = () => (
  <Icon>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.5 21.5 20h-19L12 3.5Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v4" />
    <circle cx="12" cy="17" r="0.9" fill="currentColor" stroke="none" />
  </Icon>
)

export const OrderFlowIcon = () => (
  <Icon>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z"
    />
  </Icon>
)

export const CheckCircleIcon = () => (
  <Icon>
    <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 12.5 2.5 2.5 5-5.5" />
  </Icon>
)

export const ClockIcon = () => (
  <Icon>
    <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5V12l3 2" />
  </Icon>
)

export const RevenueIcon = () => (
  <Icon>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 20V11M10 20V6M16 20V13.5M20 20V9" />
  </Icon>
)
