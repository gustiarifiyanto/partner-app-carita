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
