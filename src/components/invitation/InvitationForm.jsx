import FormField from '../FormField'
import { formatDateTime } from '../../lib/format'
import { fieldClass } from '../../lib/formStyles'
import { EMPTY_EVENT } from '../../lib/invitationStatus'

const PERSON_FIELDS = [
  ['full_name', 'Nama Lengkap', 'Mis. Budi Santoso, S.Kom.'],
  ['nickname', 'Nama Panggilan', 'Mis. Budi'],
  ['father_name', 'Nama Ayah', 'Mis. Bapak Santoso'],
  ['mother_name', 'Nama Ibu', 'Mis. Ibu Sari'],
]

// Form data mempelai & acara. Dipakai client (Undangan Saya) dan admin (edit
// data dari detail order); label tombol bisa diganti, submitLabel null = tanpa tombol kirim.
export default function InvitationForm({
  form,
  setForm,
  errors,
  readOnly,
  saving,
  lastSaved,
  onSaveDraft,
  onSubmit,
  saveLabel = 'Simpan Draft',
  submitLabel = 'Kirim Data',
  hint = 'Kolom bertanda * wajib diisi sebelum kirim.',
  extra = null,
}) {
  const setPerson = (person, field) => (e) =>
    setForm((prev) => ({ ...prev, [person]: { ...prev[person], [field]: e.target.value } }))

  const setEvent = (index, field) => (e) =>
    setForm((prev) => ({
      ...prev,
      events: prev.events.map((event, i) => (i === index ? { ...event, [field]: e.target.value } : event)),
    }))

  const addEvent = () =>
    setForm((prev) => ({ ...prev, events: [...prev.events, { ...EMPTY_EVENT, name: prev.events.length ? 'Resepsi' : 'Akad Nikah' }] }))

  const removeEvent = (index) => setForm((prev) => ({ ...prev, events: prev.events.filter((_, i) => i !== index) }))

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
      <fieldset disabled={readOnly || saving} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {[
            ['groom', 'Mempelai Pria', '🤵'],
            ['bride', 'Mempelai Wanita', '👰'],
          ].map(([person, title, emoji]) => (
            <section key={person} className="animate-fade-up space-y-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h3 className="text-base font-semibold text-slate-900">
                {emoji} {title}
              </h3>
              {PERSON_FIELDS.map(([field, label, placeholder]) => (
                <FormField
                  key={field}
                  label={`${label}${['full_name', 'nickname'].includes(field) ? ' *' : ''}`}
                  error={errors[`${person}.${field}`]}
                >
                  <input
                    value={form[person][field] ?? ''}
                    onChange={setPerson(person, field)}
                    placeholder={placeholder}
                    className={fieldClass(errors[`${person}.${field}`])}
                  />
                </FormField>
              ))}
            </section>
          ))}
        </div>

        <section className="animate-fade-up space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-slate-900">📅 Acara</h3>
            {!readOnly && form.events.length < 10 && (
              <button type="button" onClick={addEvent} className="text-sm font-semibold text-violet-600 hover:underline">
                + Tambah Acara
              </button>
            )}
          </div>
          {errors.events && <p className="text-xs text-red-600">{[].concat(errors.events)[0]}</p>}

          {form.events.map((event, index) => {
            const err = (field) => errors[`events.${index}.${field}`]
            return (
              <div key={index} className="space-y-3 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">Acara {index + 1}</p>
                  {!readOnly && form.events.length > 1 && (
                    <button type="button" onClick={() => removeEvent(index)} className="text-xs font-medium text-red-600 hover:underline">
                      Hapus
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <FormField label="Nama Acara *" error={err('name')}>
                    <input value={event.name} onChange={setEvent(index, 'name')} placeholder="Akad Nikah / Resepsi" className={fieldClass(err('name'))} />
                  </FormField>
                  <FormField label="Tanggal *" error={err('date')}>
                    <input type="date" value={event.date} onChange={setEvent(index, 'date')} className={fieldClass(err('date'))} />
                  </FormField>
                  <FormField label="Jam Mulai *" error={err('time_start')}>
                    <input type="time" value={event.time_start} onChange={setEvent(index, 'time_start')} className={fieldClass(err('time_start'))} />
                  </FormField>
                  <FormField label="Jam Selesai" error={err('time_end')} hint='Boleh diisi "Selesai"'>
                    <input value={event.time_end} onChange={setEvent(index, 'time_end')} placeholder="11:00 / Selesai" className={fieldClass(err('time_end'))} />
                  </FormField>
                  <FormField label="Nama Tempat *" error={err('venue_name')}>
                    <input value={event.venue_name} onChange={setEvent(index, 'venue_name')} placeholder="Mis. Masjid Agung" className={fieldClass(err('venue_name'))} />
                  </FormField>
                  <FormField label="Link Google Maps" error={err('maps_url')}>
                    <input type="url" value={event.maps_url} onChange={setEvent(index, 'maps_url')} placeholder="https://maps.app.goo.gl/..." className={fieldClass(err('maps_url'))} />
                  </FormField>
                </div>
                <FormField label="Alamat Lengkap *" error={err('address')}>
                  <textarea rows={2} value={event.address} onChange={setEvent(index, 'address')} className={fieldClass(err('address'))} />
                </FormField>
              </div>
            )
          })}
        </section>

        {/* Bagian tambahan, mis. konten Self Editing. */}
        {extra}

        <section className="animate-fade-up rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <FormField label="Catatan untuk Admin" error={errors.notes} hint="Mis. warna favorit, kutipan ayat, atau permintaan khusus">
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              className={fieldClass(errors.notes)}
            />
          </FormField>
        </section>
      </fieldset>

      {!readOnly && (
        <div className="sticky bottom-3 z-10 flex flex-col gap-3 rounded-2xl bg-white/95 p-4 shadow-lg ring-1 ring-slate-200 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            {lastSaved ? `Draft terakhir disimpan ${formatDateTime(lastSaved)}` : hint}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onSaveDraft}
              disabled={saving}
              className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100 disabled:opacity-60 sm:flex-none"
            >
              {saving ? 'Menyimpan...' : saveLabel}
            </button>
            {submitLabel && (
              <button
                type="button"
                onClick={onSubmit}
                disabled={saving}
                className="flex-1 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60 sm:flex-none"
              >
                {submitLabel}
              </button>
            )}
          </div>
        </div>
      )}
    </form>
  )
}
