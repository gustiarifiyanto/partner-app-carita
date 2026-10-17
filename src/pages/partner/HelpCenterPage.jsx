import {
  BankIcon,
  OrderFlowIcon,
  PercentIcon,
  ShieldCheckIcon,
  WalletIcon,
  WarningIcon,
} from '../../components/icons/HelpIcons'
import { usePageHeader } from '../../hooks/usePageHeader'
import { buildWaLink } from '../../lib/contact'

const RULES = [
  {
    title: 'Verifikasi Akun',
    body: 'Akun baru diverifikasi admin dulu sebelum bisa mulai buat order.',
    icon: <ShieldCheckIcon />,
    gradient: 'linear-gradient(135deg, #60A5FA, #2563EB)',
  },
  {
    title: 'Komisi 20%',
    body: 'Rate komisi tetap 20% dari nilai order, berlaku untuk semua mitra.',
    icon: <PercentIcon />,
    gradient: 'linear-gradient(135deg, #34D399, #059669)',
  },
  {
    title: 'Alur Order',
    body: 'Order disetujui admin, komisi otomatis dihitung saat statusnya selesai.',
    icon: <OrderFlowIcon />,
    gradient: 'linear-gradient(135deg, #FBBF24, #EA580C)',
  },
  {
    title: 'Pencairan Komisi',
    body: 'Ajukan pencairan kapan saja selama saldo komisi tersedia.',
    icon: <WalletIcon />,
    gradient: 'linear-gradient(135deg, #A78BFA, #7C3AED)',
  },
  {
    title: 'Data Rekening',
    body: 'Lengkapi data bank di Profile supaya pembayaran lancar.',
    icon: <BankIcon />,
    gradient: 'linear-gradient(135deg, #22D3EE, #0284C7)',
  },
  {
    title: 'Status Akun',
    body: 'Pelanggaran ketentuan kerja sama bisa membuat akun ditangguhkan.',
    icon: <WarningIcon />,
    gradient: 'linear-gradient(135deg, #FB7185, #DC2626)',
  },
]

export default function HelpCenterPage() {
  usePageHeader('Help Center', 'Dukungan teknis & aturan kerja sama mitra Carita Studio')

  const waHref = buildWaLink(
    'Halo Admin, saya ingin bertanya seputar akun mitra saya di Carita Studio.',
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Dukungan Teknis</h2>
          <p className="mt-1 text-sm text-slate-500">
            Ada kendala pakai aplikasi, pertanyaan soal order, komisi, atau hal lain? Tim kami siap bantu
            lewat WhatsApp.
          </p>
        </div>
        <a
          href={waHref}
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Hubungi Admin via WhatsApp
        </a>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Aturan Kerja Sama Mitra</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {RULES.map((rule) => (
            <div
              key={rule.title}
              className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm"
                style={{ backgroundImage: rule.gradient }}
              >
                {rule.icon}
              </div>
              <p className="mt-4 text-sm font-semibold text-slate-900">{rule.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">{rule.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
