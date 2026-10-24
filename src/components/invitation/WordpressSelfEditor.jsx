import { useEffect, useMemo, useRef, useState } from 'react'
import ConfirmDialog from '../ConfirmDialog'
import FormField from '../FormField'
import { useToast } from '../../hooks/useToast'
import api from '../../lib/api'
import { formatDateTime } from '../../lib/format'
import { fieldClass } from '../../lib/formStyles'

// Teks panjang memakai textarea.
const LONG_TEXT = /(_text|_parents|_address|^quote)$/

const PLACEHOLDERS = {
  text: 'Kosongkan untuk memakai teks bawaan tema',
  link: 'https://...',
}

const TABS = [
  ['data', '📝 Data'],
  ['photos', '📷 Foto'],
  ['style', '🎨 Warna & Font'],
  ['layout', '🧩 Susunan'],
]

// Antrean preview (SELF_EDIT_SYNC=queue): cek status tiap 2 detik, maks 1 menit.
const POLL_INTERVAL = 2000
const POLL_LIMIT = 30

function initialCustomization(editor) {
  const saved = editor.customization ?? {}
  const optional = editor.sections.filter((s) => !s.required).map((s) => s.element_id)
  const savedOrder = (saved.sections?.order ?? []).filter((id) => optional.includes(id))
  return {
    colors: { ...(saved.colors ?? {}) },
    fonts: { ...(saved.fonts ?? {}) },
    hiddenSections: saved.sections?.hidden ?? [],
    order: [...savedOrder, ...optional.filter((id) => !savedOrder.includes(id))],
    // Bawaan admin (hidden_default) berlaku sampai client memilih menampilkannya.
    hiddenBlocks: [
      ...new Set([
        ...editor.blocks
          .filter((b) => b.hidden_default && !(saved.blocks?.shown ?? []).includes(b.element_id))
          .map((b) => b.element_id),
        ...(saved.blocks?.hidden ?? []),
      ]),
    ],
  }
}

function toPayload(values, custom, blockIds) {
  return {
    fields: values,
    customization: {
      colors: custom.colors,
      fonts: custom.fonts,
      sections: { hidden: custom.hiddenSections, order: custom.order },
      blocks: { hidden: custom.hiddenBlocks, shown: blockIds.filter((id) => !custom.hiddenBlocks.includes(id)) },
    },
  }
}

const fullHex = (hex) => (hex.length === 4 ? `#${[...hex.slice(1)].map((c) => c + c).join('')}` : hex)

// Editor Self Editing v2: undangan dirender Elementor di WordPress, jadi tampilannya sama
// dengan template asli. Client hanya mengisi field yang dipetakan admin, memilih foto,
// mengganti warna/font yang dibuka admin, dan menyembunyikan/mengurutkan bagian opsional.
export default function WordpressSelfEditor({ orderId, data, onApply, photoSection }) {
  const toast = useToast()
  const editor = data.wordpress
  const readOnly = !data.can_edit
  const [values, setValues] = useState(() => ({ ...(editor.values ?? {}) }))
  const [custom, setCustom] = useState(() => initialCustomization(editor))
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(null) // 'save' | 'preview' | 'submit' | null
  const [polling, setPolling] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [tab, setTab] = useState('data')
  const [mobileView, setMobileView] = useState('edit')
  const [confirmSubmit, setConfirmSubmit] = useState(false)
  const pollRef = useRef(null)

  useEffect(() => () => clearTimeout(pollRef.current), [])

  // Foto yang sudah dihapus tidak dianggap terpilih (dan tidak ikut dikirim).
  const photoIds = (data.photos ?? []).map((p) => p.id)
  const currentValues = Object.fromEntries(
    Object.entries(values).filter(
      ([key, value]) => editor.fields.find((f) => f.key === key)?.type !== 'image' || photoIds.includes(value),
    ),
  )

  const textFields = useMemo(() => editor.fields.filter((f) => !['image', 'gallery'].includes(f.type)), [editor.fields])
  const imageFields = editor.fields.filter((f) => f.type === 'image')
  const hasGallery = editor.fields.some((f) => f.type === 'gallery')
  const groups = useMemo(
    () =>
      textFields.reduce((acc, field) => {
        ;(acc[field.group] ??= []).push(field)
        return acc
      }, {}),
    [textFields],
  )

  const setValue = (key, value) => {
    setValues((current) => ({ ...current, [key]: value }))
    setDirty(true)
  }
  const updateCustom = (change) => {
    setCustom((current) => ({ ...current, ...change(current) }))
    setDirty(true)
  }

  const handleError = (err, fallback) => {
    const errs = err.response?.status === 422 ? err.response.data.errors : null
    if (errs) {
      setErrors(errs)
      toast.error(Object.values(errs).flat()[0] || 'Masih ada isian yang belum benar.')
      if (Object.keys(errs).some((key) => key.startsWith('fields.'))) setTab('data')
    } else {
      toast.error(err.response?.data?.message || fallback)
    }
  }

  const save = async () => {
    setErrors({})
    const { data: res } = await api.put(`/client/orders/${orderId}/invitation`, toPayload(currentValues, custom, editor.blocks.map((b) => b.element_id)))
    setValues({ ...(res.data.wordpress?.values ?? {}) })
    setDirty(false)
    return res.data
  }

  // Queue: tunggu sampai job selesai (synced_at / sync_error berubah).
  const waitForSync = (before, attempt = 0) => {
    setPolling(true)
    pollRef.current = setTimeout(async () => {
      try {
        const { data: res } = await api.get(`/client/orders/${orderId}/invitation`)
        const wp = res.data.wordpress
        if (wp.synced_at !== before.synced_at || wp.sync_error !== before.sync_error || attempt >= POLL_LIMIT) {
          onApply(res.data)
          setPolling(false)
          if (wp.sync_error) toast.error(`Preview gagal diperbarui: ${wp.sync_error}`)
          return
        }
      } catch {
        // Coba lagi di putaran berikutnya.
      }
      waitForSync(before, attempt + 1)
    }, POLL_INTERVAL)
  }

  const run = async (action, task, fallback) => {
    setBusy(action)
    try {
      await task()
    } catch (err) {
      handleError(err, fallback)
    } finally {
      setBusy(null)
    }
  }

  const saveDraft = () =>
    run(
      'save',
      async () => {
        onApply(await save())
        toast.success('Draft tersimpan.')
      },
      'Gagal menyimpan draft.',
    )

  const savePreview = () =>
    run(
      'preview',
      async () => {
        const before = { synced_at: editor.synced_at, sync_error: editor.sync_error }
        await save()
        try {
          const { data: res } = await api.post(`/client/orders/${orderId}/invitation/preview`)
          onApply(res.data)
          if (res.data.wordpress.synced_at === before.synced_at && editor.sync_mode === 'queue') {
            waitForSync(before)
          } else {
            toast.success(res.message || 'Preview diperbarui.')
            setMobileView('preview')
          }
        } catch (err) {
          // Data sudah tersimpan walau preview gagal; tampilkan status error terbaru.
          const { data: res } = await api.get(`/client/orders/${orderId}/invitation`)
          onApply(res.data)
          throw err
        }
      },
      'Gagal memperbarui preview.',
    )

  const submit = () =>
    run(
      'submit',
      async () => {
        await save()
        try {
          const { data: res } = await api.put(`/client/orders/${orderId}/invitation/submit`)
          onApply(res.data)
          toast.success('Undangan diajukan! Admin akan memeriksa lalu menerbitkannya.')
        } finally {
          setConfirmSubmit(false)
        }
      },
      'Gagal mengajukan undangan.',
    )

  const optionalSections = custom.order
    .map((id) => editor.sections.find((s) => s.element_id === id))
    .filter(Boolean)
  const moveSection = (index, delta) =>
    updateCustom((c) => {
      const order = [...c.order]
      const target = index + delta
      if (target < 0 || target >= order.length) return {}
      ;[order[index], order[target]] = [order[target], order[index]]
      return { order }
    })
  const toggleIn = (list, id, hidden) => (hidden ? [...new Set([...list, id])] : list.filter((x) => x !== id))

  const fieldError = (key) => errors[`fields.${key}`]
  const working = busy !== null || polling

  return (
    <div className="space-y-4">
      {/* Di HP editor & preview bergantian, di layar lebar berdampingan. */}
      <div className="flex gap-2 lg:hidden">
        {[
          ['edit', 'Edit'],
          ['preview', 'Preview'],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setMobileView(key)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${
              mobileView === key ? 'bg-violet-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className={`min-w-0 space-y-4 ${mobileView === 'edit' ? '' : 'hidden lg:block'}`}>
          <div className="flex gap-1 overflow-x-auto rounded-xl bg-white p-1 shadow-sm ring-1 ring-slate-200">
            {TABS.map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold whitespace-nowrap sm:text-sm ${
                  tab === key ? 'bg-violet-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === 'data' && (
            <div className="space-y-4">
              <p className="rounded-xl bg-violet-50 px-4 py-3 text-xs text-violet-800 ring-1 ring-violet-200">
                Isi data di bawah, lalu tekan <strong>Simpan &amp; Preview</strong> untuk melihat hasilnya di undangan
                asli. Kolom yang dikosongkan memakai teks bawaan tema. Kolom bertanda * wajib diisi sebelum Ajukan
                Terbit.
              </p>
              {Object.entries(groups).map(([group, fields]) => (
                <section key={group} className="space-y-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                  <h3 className="text-base font-semibold text-slate-900">{group}</h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {fields.map((field) => {
                      const long = field.type === 'text' && LONG_TEXT.test(field.key)
                      const common = {
                        value: values[field.key] ?? '',
                        onChange: (e) => setValue(field.key, e.target.value),
                        disabled: readOnly,
                        className: fieldClass(fieldError(field.key)),
                      }
                      return (
                        <div key={field.key} className={long ? 'sm:col-span-2' : ''}>
                          <FormField label={`${field.label}${field.required ? ' *' : ''}`} error={fieldError(field.key)}>
                            <DemoHint demos={field.demos} />
                            {long ? (
                              <textarea rows={3} placeholder={PLACEHOLDERS.text} {...common} />
                            ) : (
                              <input
                                type={field.type === 'date' ? 'date' : field.type === 'link' ? 'url' : 'text'}
                                placeholder={PLACEHOLDERS[field.type] ?? ''}
                                {...common}
                              />
                            )}
                          </FormField>
                        </div>
                      )
                    })}
                  </div>
                </section>
              ))}
              {textFields.length === 0 && (
                <p className="rounded-2xl bg-white p-5 text-sm text-slate-500 ring-1 ring-slate-200">
                  Tema ini tidak punya teks yang bisa diubah.
                </p>
              )}
            </div>
          )}

          {tab === 'photos' && (
            <div className="space-y-4">
              {photoSection}
              {imageFields.length > 0 && (
                <section className="space-y-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                  <h3 className="text-base font-semibold text-slate-900">Pilih foto per bagian</h3>
                  <p className="-mt-1 text-xs text-slate-500">
                    Otomatis: foto sampul dipakai di bagian sampul, foto galeri ke-n mengikuti urutan unggahan. Bagian
                    tanpa foto memakai foto bawaan tema.
                    {hasGallery && ' Galeri undangan berisi semua foto yang kamu unggah.'}
                    {' '}Foto otomatis dipotong &amp; dibentuk mengikuti bingkai foto di template (mis. oval), jadi pilih
                    foto yang wajahnya di tengah.
                  </p>
                  {imageFields.map((field) => (
                    <PhotoPicker
                      key={field.key}
                      field={field}
                      photos={data.photos ?? []}
                      value={currentValues[field.key]}
                      error={fieldError(field.key)}
                      disabled={readOnly}
                      onChange={(photoId) => setValue(field.key, photoId)}
                    />
                  ))}
                </section>
              )}
            </div>
          )}

          {tab === 'style' && (
            <section className="space-y-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              {editor.colors.length + editor.fonts.length === 0 && (
                <p className="text-sm text-slate-500">Warna dan font tema ini sudah dikunci admin.</p>
              )}
              {editor.colors.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-base font-semibold text-slate-900">Warna</h3>
                  {editor.colors.map((slot) => {
                    const current = custom.colors[slot.value]
                    return (
                      <div key={slot.value} className="flex items-center gap-3 text-sm">
                        <span className="h-7 w-7 shrink-0 rounded-md ring-1 ring-slate-300" style={{ backgroundColor: slot.value }} />
                        <span className="text-slate-400">→</span>
                        <input
                          type="color"
                          value={current || fullHex(slot.value)}
                          disabled={readOnly}
                          onChange={(e) =>
                            updateCustom((c) => ({ colors: { ...c.colors, [slot.value]: e.target.value.toUpperCase() } }))
                          }
                          className="h-8 w-10 shrink-0 cursor-pointer rounded border border-slate-300 bg-white disabled:cursor-not-allowed"
                        />
                        <span className="min-w-0 flex-1 truncate text-slate-700">{slot.label || slot.value}</span>
                        {current && !readOnly && (
                          <button
                            type="button"
                            onClick={() =>
                              updateCustom((c) => {
                                const colors = { ...c.colors }
                                delete colors[slot.value]
                                return { colors }
                              })
                            }
                            className="text-xs font-medium text-slate-500 hover:text-slate-800"
                          >
                            Kembalikan
                          </button>
                        )}
                      </div>
                    )
                  })}
                  {Object.entries(errors)
                    .filter(([key]) => key.startsWith('colors.'))
                    .map(([key, messages]) => (
                      <p key={key} className="text-xs text-red-600">
                        {messages[0]}
                      </p>
                    ))}
                </div>
              )}
              {editor.fonts.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-base font-semibold text-slate-900">Font</h3>
                  {editor.fonts.map((slot) => (
                    <label key={slot.value} className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:gap-3">
                      <span className="w-40 shrink-0 truncate text-slate-700" title={slot.value}>
                        {slot.label || slot.value}
                      </span>
                      <select
                        value={custom.fonts[slot.value] ?? ''}
                        disabled={readOnly}
                        onChange={(e) =>
                          updateCustom((c) => {
                            const fonts = { ...c.fonts }
                            if (e.target.value) fonts[slot.value] = e.target.value
                            else delete fonts[slot.value]
                            return { fonts }
                          })
                        }
                        className={fieldClass(errors[`fonts.${slot.value}`])}
                      >
                        <option value="">Bawaan tema ({slot.value})</option>
                        {editor.font_choices
                          .filter((font) => font !== slot.value)
                          .map((font) => (
                            <option key={font} value={font}>
                              {font}
                            </option>
                          ))}
                      </select>
                    </label>
                  ))}
                </div>
              )}
            </section>
          )}

          {tab === 'layout' && (
            <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Susunan undangan</h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Bagian bertanda 🔒 selalu tampil di posisinya. Bagian lain bisa disembunyikan atau digeser urutannya.
                </p>
              </div>
              <ul className="space-y-2">
                {editor.sections.map((section) => {
                  const blocks = editor.blocks.filter((b) => b.section === section.element_id)
                  if (section.required) {
                    return (
                      <li key={section.element_id} className="rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
                        <p className="text-sm text-slate-700">🔒 {section.title}</p>
                        <BlockToggles blocks={blocks} hidden={custom.hiddenBlocks} disabled={readOnly} onToggle={(id, hide) => updateCustom((c) => ({ hiddenBlocks: toggleIn(c.hiddenBlocks, id, hide) }))} />
                      </li>
                    )
                  }
                  return null
                })}
              </ul>
              {optionalSections.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Bagian opsional (urutan)</p>
                  <ul className="space-y-2">
                    {optionalSections.map((section, index) => {
                      const hidden = custom.hiddenSections.includes(section.element_id)
                      const blocks = editor.blocks.filter((b) => b.section === section.element_id)
                      return (
                        <li key={section.element_id} className="rounded-xl px-3 py-2 ring-1 ring-slate-200">
                          <div className="flex items-center gap-2">
                            <label className="flex min-w-0 flex-1 items-center gap-2 text-sm text-slate-800">
                              <input
                                type="checkbox"
                                checked={!hidden}
                                disabled={readOnly}
                                onChange={(e) =>
                                  updateCustom((c) => ({
                                    hiddenSections: toggleIn(c.hiddenSections, section.element_id, !e.target.checked),
                                  }))
                                }
                                className="rounded border-slate-300 text-violet-600"
                              />
                              <span className={`truncate ${hidden ? 'text-slate-400 line-through' : ''}`}>{section.title}</span>
                            </label>
                            {!readOnly && (
                              <div className="flex shrink-0 gap-1">
                                <button
                                  type="button"
                                  onClick={() => moveSection(index, -1)}
                                  disabled={index === 0}
                                  aria-label={`Naikkan ${section.title}`}
                                  className="rounded-md border border-slate-300 px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                                >
                                  ↑
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveSection(index, 1)}
                                  disabled={index === optionalSections.length - 1}
                                  aria-label={`Turunkan ${section.title}`}
                                  className="rounded-md border border-slate-300 px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                                >
                                  ↓
                                </button>
                              </div>
                            )}
                          </div>
                          {!hidden && (
                            <BlockToggles blocks={blocks} hidden={custom.hiddenBlocks} disabled={readOnly} onToggle={(id, hide) => updateCustom((c) => ({ hiddenBlocks: toggleIn(c.hiddenBlocks, id, hide) }))} />
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
              {errors['sections.hidden'] && <p className="text-xs text-red-600">{errors['sections.hidden'][0]}</p>}
              {errors['blocks.hidden'] && <p className="text-xs text-red-600">{errors['blocks.hidden'][0]}</p>}
            </section>
          )}

          {!readOnly && (
            <div className="sticky bottom-4 z-10 flex flex-col gap-2 rounded-2xl bg-white/90 p-3 shadow-lg ring-1 ring-slate-200 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs text-slate-500">
                {dirty ? 'Ada perubahan yang belum disimpan.' : data.updated_at ? `Tersimpan ${formatDateTime(data.updated_at)}` : 'Belum disimpan'}
              </span>
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={saveDraft}
                  disabled={working}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  {busy === 'save' ? 'Menyimpan...' : 'Simpan Draft'}
                </button>
                <button
                  type="button"
                  onClick={savePreview}
                  disabled={working}
                  className="rounded-lg border border-violet-300 px-4 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-50 disabled:opacity-60"
                >
                  {busy === 'preview' || polling ? 'Memperbarui preview...' : '👁 Simpan & Preview'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmSubmit(true)}
                  disabled={working}
                  className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
                >
                  Ajukan Terbit
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={mobileView === 'preview' ? '' : 'hidden lg:block'}>
          <div className="lg:sticky lg:top-6">
            <PreviewFrame editor={editor} dirty={dirty} working={working} readOnly={readOnly} onRefresh={savePreview} />
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmSubmit}
        onClose={() => setConfirmSubmit(false)}
        onConfirm={submit}
        loading={busy === 'submit'}
        tone="emerald"
        title="Ajukan terbit sekarang?"
        description="Perubahan disimpan dan preview diperbarui, lalu undangan dikunci dan diperiksa admin. Kalau ada yang perlu diperbaiki, admin akan mengembalikannya dengan catatan."
        confirmLabel="Ya, Ajukan"
        loadingLabel="Mengajukan..."
        icon={<path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />}
      />
    </div>
  )
}

function BlockToggles({ blocks, hidden, disabled, onToggle }) {
  if (blocks.length === 0) return null
  return (
    <div className="mt-1.5 ml-6 flex flex-wrap gap-x-4 gap-y-1">
      {blocks.map((block) => (
        <label key={block.element_id} className="flex items-center gap-1.5 text-xs text-slate-600">
          <input
            type="checkbox"
            checked={!hidden.includes(block.element_id)}
            disabled={disabled}
            onChange={(e) => onToggle(block.element_id, !e.target.checked)}
            className="rounded border-slate-300 text-violet-600"
          />
          Tampilkan {block.title}
        </label>
      ))}
    </div>
  )
}

// Teks demo yang akan diganti kolom ini, supaya client tahu bagian undangan mana yang berubah.
function DemoHint({ demos }) {
  if (!demos?.length) return null
  return (
    <div className="mb-1.5 rounded-md bg-slate-50 px-2.5 py-1.5 text-xs text-slate-500 ring-1 ring-slate-200">
      <span className="font-medium text-slate-600">Mengganti teks di undangan:</span>
      {demos.map((demo) => (
        <p key={demo.text} className="mt-0.5 text-slate-700 italic">
          “{demo.text}”
          {demo.partial && <span className="ml-1 text-[11px] text-slate-400 not-italic">(sebagian teks ini)</span>}
        </p>
      ))}
    </div>
  )
}

function PhotoPicker({ field, photos, value, error, disabled, onChange }) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-slate-700">
        {field.group === 'Foto' ? field.label : `${field.label} (${field.group})`}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {field.demos?.length > 0 && (
          <div className="flex items-center gap-1.5 border-r border-slate-200 pr-2" title="Foto di undangan yang akan diganti">
            {field.demos.map((demo) => (
              <img
                key={demo.text}
                src={demo.text}
                alt="Foto demo"
                className="h-14 w-10 rounded-md object-contain opacity-70 ring-1 ring-slate-200"
              />
            ))}
            <span className="text-[10px] leading-tight text-slate-400">
              foto
              <br />
              demo →
            </span>
          </div>
        )}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(null)}
          className={`flex h-14 w-14 items-center justify-center rounded-lg text-[10px] font-semibold ring-2 ${
            !value ? 'bg-violet-50 text-violet-700 ring-violet-500' : 'bg-slate-50 text-slate-500 ring-slate-200'
          }`}
        >
          Otomatis
        </button>
        {photos.map((photo) => (
          <button
            key={photo.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(photo.id)}
            className={`overflow-hidden rounded-lg ring-2 ${value === photo.id ? 'ring-violet-500' : 'ring-transparent hover:ring-slate-300'}`}
          >
            <img src={photo.url} alt="" className="h-14 w-14 object-cover" />
          </button>
        ))}
      </div>
      {error && <p className="text-xs text-red-600">{Array.isArray(error) ? error[0] : error}</p>}
    </div>
  )
}

function PreviewFrame({ editor, dirty, working, readOnly, onRefresh }) {
  const [loadedUrl, setLoadedUrl] = useState(null)
  // synced_at ikut di key supaya iframe dimuat ulang walau URL preview sama.
  const frameKey = `${editor.preview_url}|${editor.synced_at}`

  return (
    <div className="space-y-3">
      <div className="mx-auto">
        <div className="relative mx-auto h-[min(680px,calc(100vh-8rem))] w-[min(360px,calc(100vw-3rem))] overflow-hidden rounded-[2.25rem] border-[10px] border-slate-900 bg-white shadow-xl">
          <div className="absolute top-0 left-1/2 z-10 h-5 w-28 -translate-x-1/2 rounded-b-2xl bg-slate-900" />
          {editor.preview_url ? (
            <>
              {(loadedUrl !== frameKey || working) && (
                <div className="absolute inset-0 z-[5] flex flex-col items-center justify-center gap-3 bg-slate-50/90 text-xs text-slate-400">
                  <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-violet-500" />
                  {working ? 'Memperbarui preview...' : 'Memuat preview...'}
                </div>
              )}
              <iframe
                key={frameKey}
                src={editor.preview_url}
                title="Preview undangan"
                onLoad={() => setLoadedUrl(frameKey)}
                className="h-full w-full border-0"
              />
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-xs text-slate-400">
              <span className="text-3xl">💌</span>
              {readOnly ? 'Preview belum tersedia.' : 'Isi data lalu tekan Simpan & Preview untuk melihat undanganmu.'}
            </div>
          )}
        </div>
      </div>
      <div className="space-y-1 text-center text-xs">
        {editor.sync_error && <p className="text-red-600">Preview terakhir gagal diperbarui: {editor.sync_error}</p>}
        {dirty && editor.preview_url && <p className="text-amber-700">Ada perubahan yang belum tampil di preview.</p>}
        {editor.synced_at && <p className="text-slate-500">Preview diperbarui {formatDateTime(editor.synced_at)}</p>}
        {editor.preview_url && (
          <div className="flex justify-center gap-3">
            <a href={editor.preview_url} target="_blank" rel="noopener noreferrer" className="font-medium text-violet-600 hover:underline">
              Buka di tab baru ↗
            </a>
            {!readOnly && (
              <button type="button" onClick={onRefresh} disabled={working} className="font-medium text-violet-600 hover:underline disabled:opacity-50">
                Perbarui
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
