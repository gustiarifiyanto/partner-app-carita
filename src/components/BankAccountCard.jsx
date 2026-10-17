import { BankIcon } from './icons/HelpIcons'

// Kartu rekening bank ala kartu fisik (dipakai di Detail Partner admin & Profile partner).
// `children` dirender di bagian bawah kartu (catatan / tombol aksi).
export default function BankAccountCard({ partner, delay = 0, className = '', children }) {
  return (
    <section
      className={`animate-fade-up group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-950 p-5 text-white shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-xl ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-indigo-500/30 blur-2xl transition-transform duration-500 group-hover:scale-125" />
      <div className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-fuchsia-500/20 blur-2xl" />

      <div className="relative flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <BankIcon />
          Rekening Bank
        </span>
        <span className="text-xs font-semibold tracking-widest text-white/70 uppercase">
          {partner.bank_name || 'Bank'}
        </span>
      </div>

      <div className="relative mt-4 h-7 w-10 rounded-md bg-gradient-to-br from-amber-200 to-amber-400 opacity-90" />

      {partner.bank_account_number ? (
        <p className="relative mt-4 font-mono text-lg tracking-widest">
          {formatAccountNumber(partner.bank_account_number)}
        </p>
      ) : (
        <p className="relative mt-4 text-sm text-white/60">Nomor rekening belum diisi</p>
      )}

      <div className="relative mt-4">
        <p className="text-[10px] tracking-wider text-white/50 uppercase">Pemilik Rekening</p>
        <p className="truncate text-sm font-medium">{partner.bank_account_holder || '-'}</p>
      </div>

      {children && <div className="relative mt-4">{children}</div>}
    </section>
  )
}

// Groups the account number in blocks of 4 for readability: "1234 5678 90".
function formatAccountNumber(number) {
  return String(number)
    .replace(/\s+/g, '')
    .replace(/(.{4})(?=.)/g, '$1 ')
}
