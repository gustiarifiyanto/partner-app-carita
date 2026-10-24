import { useEffect } from 'react'
import { formatDate } from '../../lib/format'

const DEFAULT_TEMPLATE = {
  colors: { primary: '#b45309', background: '#fbf7f2', text: '#44403c', accent: '#e11d48' },
  fonts: {},
  sections: ['cover', 'couple', 'quote', 'events', 'gallery', 'closing'],
  defaults: {},
}

const FALLBACK_TEXT = {
  opening_text: 'Dengan memohon rahmat dan ridho Tuhan, kami bermaksud menyelenggarakan pernikahan putra-putri kami:',
  closing_text:
    'Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.',
}

// Muat Google Fonts yang dipakai template (sekali per nama font).
function useGoogleFonts(fonts) {
  const families = [fonts?.heading, fonts?.body].filter(Boolean).join('|')
  useEffect(() => {
    families.split('|').filter(Boolean).forEach((family) => {
      const id = `gf-${family.replace(/\s+/g, '-')}`
      if (document.getElementById(id)) return
      const link = document.createElement('link')
      link.id = id
      link.rel = 'stylesheet'
      link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@400;600;700&display=swap`
      document.head.appendChild(link)
    })
  }, [families])
}

// Preview undangan Self Editing di bingkai HP, dirender dari template JSON tema
// (diupload admin) + isi form client. Berubah langsung saat client mengetik.
export default function InvitationPreview({ form, photos = [], template, themeName }) {
  const tpl = { ...DEFAULT_TEMPLATE, ...template, colors: { ...DEFAULT_TEMPLATE.colors, ...template?.colors } }
  useGoogleFonts(tpl.fonts)

  const groom = form.groom ?? {}
  const bride = form.bride ?? {}
  // Isian client diutamakan, lalu teks bawaan template, lalu teks umum.
  const text = (field) => form.content?.[field] || tpl.defaults?.[field] || FALLBACK_TEXT[field] || ''
  const events = (form.events ?? []).filter((e) => e.name || e.date || e.venue_name)
  const cover = photos.find((p) => p.is_cover) ?? photos[0]
  const coverUrl = cover?.url ?? tpl.cover_image
  const gallery = photos.filter((p) => p.id !== cover?.id)
  const groomName = groom.nickname || 'Mempelai Pria'
  const brideName = bride.nickname || 'Mempelai Wanita'
  const { primary, background, text: textColor, accent } = tpl.colors
  const heading = { fontFamily: tpl.fonts?.heading ? `'${tpl.fonts.heading}', serif` : undefined }

  const sections = {
    cover: (
      <section className="relative -mt-5 flex h-[560px] flex-col items-center justify-end overflow-hidden px-6 pb-14 text-white">
        {coverUrl ? (
          <img src={coverUrl} alt="Foto sampul" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${primary}, ${accent})` }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="relative">
          <p className="text-[10px] tracking-[0.3em] uppercase opacity-80">The Wedding of</p>
          <p className="mt-2 text-3xl leading-tight" style={heading}>
            {groomName}
            <span className="mx-2 text-xl opacity-80">&amp;</span>
            {brideName}
          </p>
          {events[0]?.date && <p className="mt-3 text-xs tracking-widest opacity-90">{formatDate(events[0].date)}</p>}
        </div>
      </section>
    ),
    couple: (
      <section className="space-y-5 px-6 py-10">
        <p className="text-[11px] leading-relaxed whitespace-pre-line opacity-80">{text('opening_text')}</p>
        <Person person={groom} fallback="Nama Mempelai Pria" label="Putra dari" heading={heading} />
        <p className="text-2xl" style={{ ...heading, color: accent }}>
          &amp;
        </p>
        <Person person={bride} fallback="Nama Mempelai Wanita" label="Putri dari" heading={heading} />
      </section>
    ),
    quote: text('quote') ? (
      <section className="px-6 py-8" style={{ backgroundColor: `${primary}14` }}>
        <p className="text-sm leading-relaxed whitespace-pre-line italic" style={heading}>
          “{text('quote')}”
        </p>
        {text('quote_source') && <p className="mt-2 text-[11px] font-semibold opacity-70">{text('quote_source')}</p>}
      </section>
    ) : null,
    events: (
      <section className="space-y-3 px-5 py-10">
        <p className="text-xl" style={{ ...heading, color: primary }}>
          Save the Date
        </p>
        {events.length === 0 && <p className="text-[11px] opacity-50">Detail acara tampil di sini.</p>}
        {events.map((event, i) => (
          <div key={i} className="rounded-2xl bg-white/80 px-4 py-4 shadow-sm ring-1 ring-black/5">
            <p className="text-base" style={{ ...heading, color: accent }}>
              {event.name || `Acara ${i + 1}`}
            </p>
            {event.date && <p className="mt-1 text-xs font-semibold">{formatDate(event.date)}</p>}
            {event.time_start && (
              <p className="text-[11px] opacity-70">
                Pukul {event.time_start}
                {event.time_end ? ` – ${event.time_end}` : ''}
              </p>
            )}
            {event.venue_name && <p className="mt-2 text-xs font-semibold">{event.venue_name}</p>}
            {event.address && <p className="text-[11px] whitespace-pre-line opacity-70">{event.address}</p>}
            {event.maps_url && (
              <span
                className="mt-2 inline-block rounded-full px-3 py-1 text-[10px] font-semibold text-white"
                style={{ backgroundColor: primary }}
              >
                Lihat Lokasi
              </span>
            )}
          </div>
        ))}
      </section>
    ),
    gallery:
      gallery.length > 0 ? (
        <section className="px-5 pb-10">
          <p className="mb-3 text-xl" style={{ ...heading, color: primary }}>
            Galeri
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {gallery.map((photo) => (
              <img key={photo.id} src={photo.url} alt="" className="aspect-square w-full rounded-lg object-cover" />
            ))}
          </div>
        </section>
      ) : null,
    closing: (
      <section className="px-6 py-10 text-white" style={{ backgroundColor: primary }}>
        <p className="text-[11px] leading-relaxed whitespace-pre-line opacity-90">{text('closing_text')}</p>
        <p className="mt-4 text-lg" style={heading}>
          {groomName} &amp; {brideName}
        </p>
        {themeName && <p className="mt-6 text-[9px] tracking-widest uppercase opacity-60">Tema: {themeName}</p>}
      </section>
    ),
  }

  return (
    <div className="mx-auto w-full max-w-[300px]">
      <div className="rounded-[2.5rem] bg-slate-900 p-2.5 shadow-2xl ring-1 ring-slate-700">
        <div
          className="relative h-[580px] overflow-x-hidden overflow-y-auto rounded-[2rem] text-center [scrollbar-width:thin]"
          style={{
            backgroundColor: background,
            color: textColor,
            fontFamily: tpl.fonts?.body ? `'${tpl.fonts.body}', sans-serif` : undefined,
            backgroundImage: tpl.background_image ? `url(${tpl.background_image})` : undefined,
            backgroundSize: 'cover',
          }}
        >
          <div className="sticky top-0 z-10 mx-auto h-5 w-24 rounded-b-xl bg-slate-900" />
          {tpl.sections.map((key) => (
            <div key={key}>{sections[key]}</div>
          ))}
          {form.content?.music_url && (
            <div className="sticky bottom-3 mr-3 ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-sm shadow-md">
              🎵
            </div>
          )}
        </div>
      </div>
      <p className="mt-3 text-center text-[11px] leading-relaxed text-slate-400">
        {template
          ? `Preview memakai template tema ${themeName ?? ''}.`
          : 'Preview memakai template dasar. Tampilan akhir mengikuti tema pilihan kamu.'}
      </p>
    </div>
  )
}

function Person({ person, fallback, label, heading }) {
  const parents = [person.father_name, person.mother_name].filter(Boolean).join(' & ')
  return (
    <div>
      <p className="text-xl" style={heading}>
        {person.full_name || fallback}
      </p>
      {parents && (
        <p className="mt-1 text-[11px] opacity-70">
          {label} {parents}
        </p>
      )}
    </div>
  )
}
