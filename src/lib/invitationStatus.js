// Status data undangan (mempelai & acara) untuk badge di client & admin.
export const INVITATION_DATA_STATUS = {
  choose_mode: {
    label: 'Pilih Mode Pengerjaan',
    className: 'bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-600/20',
  },
  waiting_data: {
    label: 'Menunggu Data Client',
    className: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  },
  submitted: {
    label: 'Data Terkirim',
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  },
  // Order sudah selesai, admin membuka kunci supaya client bisa merevisi data.
  revision: {
    label: 'Revisi Dibuka',
    className: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  },
}

export const EMPTY_EVENT = {
  name: '',
  date: '',
  time_start: '',
  time_end: '',
  venue_name: '',
  address: '',
  maps_url: '',
}

// Label status untuk order Self Editing (client mengedit sendiri, bukan menunggu data untuk admin).
export const SELF_EDITING_STATUS_LABEL = {
  waiting_data: 'Draft Self Editing',
  submitted: 'Menunggu Diterbitkan',
}

// Order katalog yang masih berjalan tapi client belum mengirim data undangan,
// atau order selesai yang revisinya dibuka admin.
export function needsInvitationData(order) {
  if (order.invitation_data_status === 'revision') return true
  return (
    ['awaiting_payment', 'pending_approval', 'confirmed'].includes(order.status) &&
    ['choose_mode', 'waiting_data'].includes(order.invitation_data_status)
  )
}

// Ambil isi form dari respons API (objek kosong dari server bisa berupa {}).
export function toInvitationForm(data) {
  return {
    groom: { ...data.groom },
    bride: { ...data.bride },
    events: data.events?.length ? data.events.map((e) => ({ ...EMPTY_EVENT, ...e })) : [{ ...EMPTY_EVENT, name: 'Akad Nikah' }],
    content: { ...EMPTY_CONTENT, ...data.content },
    notes: data.notes ?? '',
  }
}

// Teks tambahan Self Editing (sama dengan InvitationDetail::CONTENT_FIELDS).
export const EMPTY_CONTENT = {
  opening_text: '',
  quote: '',
  quote_source: '',
  closing_text: '',
  music_url: '',
}
