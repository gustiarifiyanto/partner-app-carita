import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ConfirmDialog from "../../components/ConfirmDialog";
import DetailPageSkeleton from "../../components/DetailPageSkeleton";
import SegmentedTabs from "../../components/SegmentedTabs";
import { usePageHeader } from "../../hooks/usePageHeader";
import { useToast } from "../../hooks/useToast";
import api from "../../lib/api";

// Kustom percobaan kosong di Tes Preview.
const EMPTY_TRIAL = { colors: {}, fonts: {}, hidden: {}, blocks: {} };

// Blok di Tes Preview: pilihan percobaan, atau bawaan admin kalau belum dicoba.
const trialBlockHidden = (trial, blocks, id) =>
  trial.blocks[id] ?? !!blocks[id]?.hidden;

// Jenis konten Elementor => jenis field yang boleh dipasang (sama dengan SelfEditFields::KIND_TYPES).
const KIND_TYPES = {
  text: ["text", "date"],
  link: ["link"],
  image: ["image"],
  gallery: ["gallery"],
  datetime: ["date"],
};

const KIND_LABELS = {
  text: "Teks",
  link: "Link",
  image: "Gambar",
  gallery: "Galeri",
  datetime: "Tanggal countdown",
};

const TABS = [
  { value: "content", label: "Konten" },
  { value: "style", label: "Warna & Font" },
  { value: "sections", label: "Section" },
];

const PATTERN = "__pattern__";

// Demo tema di lokcreative.com dibuat sebagai Post, jadi Post ditaruh paling atas.
const SOURCE_TYPES = {
  post: "Post (demo tema)",
  page: "Halaman",
  template: "Template Elementor",
};

// "https://lokcreative.com/minimalist-1#showlink" dan ".../minimalist-1/" dianggap sama.
const normalizeUrl = (url) =>
  (url || "").split(/[#?]/)[0].replace(/\/+$/, "").toLowerCase();

const itemKey = (item) => `${item.element_id}|${item.setting}`;
const sameMapping = (a, b) =>
  !!a && !!b && a.field === b.field && a.pattern === b.pattern;

// Pemetaan halaman demo Elementor (WordPress) untuk Self Editing v2: konten →
// field data undangan, slot warna/font yang boleh diganti client, dan section
// yang wajib tampil. Halaman demo hanya dibaca, tidak pernah diubah.
export default function ThemeWordpressPage() {
  const { id } = useParams();
  const toast = useToast();

  const [theme, setTheme] = useState(null);
  const [fields, setFields] = useState([]);
  const [saved, setSaved] = useState(null); // pemetaan tersimpan
  const [pages, setPages] = useState([]);
  const [pageId, setPageId] = useState("");
  const [source, setSource] = useState(null);
  const [mappings, setMappings] = useState({}); // itemKey => { field } | { pattern }
  const [colors, setColors] = useState({}); // hex => { label, locked }
  const [fonts, setFonts] = useState({});
  const [sections, setSections] = useState({}); // element_id => required
  const [blocks, setBlocks] = useState({}); // element_id blok opsional => { title, hidden (bawaan disembunyikan) }
  const [tab, setTab] = useState("content");
  const [onlyMapped, setOnlyMapped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reading, setReading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [preview, setPreview] = useState(null); // hasil Tes Preview terakhir
  const [previewing, setPreviewing] = useState(false);
  const [trial, setTrial] = useState(EMPTY_TRIAL); // kustom percobaan di Tes Preview

  usePageHeader(
    "Pemetaan Self Editing",
    theme
      ? `Tema ${theme.name}`
      : "Hubungkan tema ke halaman demo di WordPress",
  );

  const fieldsByKey = useMemo(
    () => Object.fromEntries(fields.map((f) => [f.key, f])),
    [fields],
  );

  // Isi state form dari hasil baca halaman + pemetaan tersimpan (kalau halaman sama).
  const applySource = useCallback((data, template) => {
    const useSaved = template && template.source_page_id === data.page.id;
    const nextMappings = {};
    if (useSaved) {
      template.mappings.forEach((m) => {
        nextMappings[`${m.element_id}|${m.setting}`] = m.pattern
          ? { pattern: m.pattern }
          : { field: m.field };
      });
    } else {
      data.items.forEach((item) => {
        if (item.suggestion) nextMappings[itemKey(item)] = item.suggestion;
      });
    }
    setMappings(nextMappings);

    const slotState = (list, savedList) =>
      Object.fromEntries(
        list.map(({ value }) => {
          const slot = useSaved
            ? savedList?.find(
                (s) => s.value.toUpperCase() === value.toUpperCase(),
              )
            : null;
          return [
            value,
            { label: slot?.label || "", locked: slot ? slot.locked : true },
          ];
        }),
      );
    setColors(slotState(data.colors, template?.colors));
    setFonts(slotState(data.fonts, template?.fonts));
    setSections(
      Object.fromEntries(
        data.sections.map((s, i) => {
          const savedSection = useSaved
            ? template.sections.find((x) => x.element_id === s.element_id)
            : null;
          return [s.element_id, savedSection ? savedSection.required : i === 0];
        }),
      ),
    );
    const blockIds = new Set(
      data.sections.flatMap((s) => (s.blocks || []).map((b) => b.element_id)),
    );
    setBlocks(
      Object.fromEntries(
        (useSaved ? template.blocks || [] : [])
          .filter((b) => blockIds.has(b.element_id))
          .map((b) => [
            b.element_id,
            { title: b.title, hidden: !!b.hidden_default },
          ]),
      ),
    );
    setSource(data);
  }, []);

  const readSource = useCallback(
    async (targetId, template) => {
      if (!targetId) return;
      setReading(true);
      setErrors([]);
      try {
        const { data } = await api.get(`/admin/wordpress/source/${targetId}`);
        applySource(data.data, template);
      } catch (err) {
        toast.error(
          err.response?.data?.message || "Gagal membaca halaman WordPress.",
        );
      } finally {
        setReading(false);
      }
    },
    [applySource, toast],
  );

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [templateRes, pagesRes] = await Promise.all([
          api.get(`/admin/catalog/themes/${id}/wp-template`),
          api.get("/admin/wordpress/pages").catch((err) => ({ error: err })),
        ]);
        if (!active) return;
        const { theme: t, template, fields: f } = templateRes.data.data;
        setTheme(t);
        setFields(f);
        setSaved(template);
        const list = pagesRes.error ? [] : pagesRes.data.data;
        if (pagesRes.error) {
          setError(
            pagesRes.error.response?.data?.message ||
              "Gagal memuat daftar halaman WordPress.",
          );
        }
        setPages(list);
        if (template) {
          setPageId(String(template.source_page_id));
          readSource(template.source_page_id, template);
        } else {
          // Belum dipetakan: pilihkan halaman yang alamatnya sama dengan link Demo tema.
          const demo = normalizeUrl(t.demo_url);
          const match = demo && list.find((p) => normalizeUrl(p.link) === demo);
          if (match) setPageId(String(match.id));
        }
      } catch (err) {
        if (active)
          setError(err.response?.data?.message || "Gagal memuat tema.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id, readSource]);

  // Konten dengan nilai sama persis (mis. nama di sampul & penutup) ikut dipasangkan.
  const setMapping = (item, mapping) => {
    const twins = source.items.filter(
      (other) =>
        other !== item &&
        other.kind === item.kind &&
        other.value === item.value &&
        !mappings[itemKey(other)],
    );
    setMappings((current) => {
      const next = { ...current };
      if (mapping) next[itemKey(item)] = mapping;
      else delete next[itemKey(item)];
      if (mapping) twins.forEach((t) => (next[itemKey(t)] = mapping));
      return next;
    });
    if (mapping && twins.length > 0) {
      toast.success(
        `Juga dipasang ke ${twins.length} konten lain yang isinya sama.`,
      );
    }
  };

  const applySuggestions = () => {
    const next = { ...mappings };
    let count = 0;
    source.items.forEach((item) => {
      if (item.suggestion && !next[itemKey(item)]) {
        next[itemKey(item)] = item.suggestion;
        count++;
      }
    });
    setMappings(next);
    toast.success(
      count ? `${count} saran diterapkan.` : "Semua saran sudah terpasang.",
    );
  };

  // Manifest dari isian saat ini, dipakai untuk Simpan maupun Tes Preview.
  const buildManifest = () => {
    const items = Object.fromEntries(
      source.items.map((item) => [itemKey(item), item]),
    );
    return {
      source_page_id: source.page.id,
      source_title: source.page.title,
      source_hash: source.page.hash,
      mappings: Object.entries(mappings)
        .filter(([key]) => items[key])
        .map(([key, m]) => ({
          element_id: items[key].element_id,
          setting: items[key].setting,
          kind: items[key].kind,
          field: m.field || null,
          pattern: m.pattern || null,
          original: items[key].value.slice(0, 2000),
        })),
      colors: Object.entries(colors).map(([value, s]) => ({
        value,
        label: s.label || null,
        locked: s.locked,
      })),
      fonts: Object.entries(fonts).map(([value, s]) => ({
        value,
        label: s.label || null,
        locked: s.locked,
      })),
      sections: source.sections.map((s) => ({
        element_id: s.element_id,
        title: s.title,
        required: !!sections[s.element_id],
      })),
      blocks: source.sections.flatMap((s) =>
        (s.blocks || [])
          .filter((b) => blocks[b.element_id] !== undefined)
          .map((b) => ({
            element_id: b.element_id,
            title: blocks[b.element_id].title.trim() || b.title,
            section: s.element_id,
            hidden_default: blocks[b.element_id].hidden,
          })),
      ),
    };
  };

  const showErrors = (err, fallback) => {
    if (err.response?.status === 422 && err.response.data.errors) {
      setErrors(Object.values(err.response.data.errors).flat());
      toast.error("Pemetaan belum valid, cek pesan di atas.");
    } else {
      toast.error(err.response?.data?.message || fallback);
    }
  };

  // Kirim pemetaan (belum perlu disimpan) + data contoh ke WordPress, lalu tampilkan hasilnya.
  const testPreview = async () => {
    setPreviewing(true);
    setErrors([]);
    const pick = (map) =>
      Object.fromEntries(Object.entries(map).filter(([, v]) => v));
    try {
      const { data } = await api.post(
        `/admin/catalog/themes/${id}/wp-template/preview`,
        {
          ...buildManifest(),
          customization: {
            colors: pick(trial.colors),
            fonts: pick(trial.fonts),
            sections: {
              hidden: Object.keys(pick(trial.hidden)).filter(
                (sid) => !sections[sid],
              ),
            },
            blocks: {
              hidden: Object.keys(blocks).filter((bid) =>
                trialBlockHidden(trial, blocks, bid),
              ),
              shown: Object.keys(blocks).filter(
                (bid) => !trialBlockHidden(trial, blocks, bid),
              ),
            },
          },
        },
      );
      setPreview(data.data);
      toast.success(data.message);
    } catch (err) {
      showErrors(err, "Gagal membuat preview.");
    } finally {
      setPreviewing(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setErrors([]);
    try {
      const { data } = await api.put(
        `/admin/catalog/themes/${id}/wp-template`,
        buildManifest(),
      );
      setSaved(data.data.template);
      setTheme(data.data.theme);
      toast.success(data.message);
    } catch (err) {
      showErrors(err, "Gagal menyimpan pemetaan.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setSaving(true);
    try {
      const { data } = await api.delete(
        `/admin/catalog/themes/${id}/wp-template`,
      );
      setSaved(null);
      setTheme(data.data.theme);
      setConfirmDelete(false);
      toast.success(data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menghapus pemetaan.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <DetailPageSkeleton />;

  const mappedCount = source
    ? source.items.filter((item) => mappings[itemKey(item)]).length
    : 0;
  const sourceChanged =
    saved &&
    source &&
    saved.source_page_id === source.page.id &&
    saved.source_hash !== source.page.hash;
  const missingSaved =
    saved && source && saved.source_page_id === source.page.id
      ? saved.mappings.filter(
          (m) =>
            !source.items.some(
              (i) => i.element_id === m.element_id && i.setting === m.setting,
            ),
        )
      : [];

  return (
    <div className="space-y-6">
      <Link
        to="/admin/catalog"
        className="animate-fade-up group inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        <svg
          className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
          />
        </svg>
        Kembali ke katalog
      </Link>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <section className="animate-fade-up space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-800">
            1. Halaman sumber di WordPress
          </p>
          {saved && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-600/20">
              ✓ Tersimpan: {saved.source_title}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            value={pageId}
            onChange={(e) => setPageId(e.target.value)}
            aria-label="Halaman sumber"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
          >
            <option value="">Pilih halaman demo tema ini…</option>
            {Object.entries(SOURCE_TYPES).map(([type, label]) => (
              <optgroup key={type} label={label}>
                {pages
                  .filter((p) => p.type === type)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title || `(tanpa judul #${p.id})`}
                      {p.status !== "publish" ? ` · ${p.status}` : ""}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
          <button
            type="button"
            disabled={!pageId || reading}
            onClick={() => readSource(Number(pageId), saved)}
            className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {reading ? "Membaca…" : "Baca Halaman"}
          </button>
        </div>
        {source?.page.link && (
          <a
            href={source.page.link}
            target="_blank"
            rel="noreferrer"
            className="inline-block text-xs text-indigo-600 hover:underline"
          >
            Buka halaman demo ↗
          </a>
        )}
        {source?.missing_widgets.length > 0 && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            ⚠ Widget berikut tidak terdaftar di Elementor, kemungkinan plugin
            pembuatnya tidak aktif: <b>{source.missing_widgets.join(", ")}</b>.
            Bagian itu bisa tidak tampil di undangan client.
          </p>
        )}
        {sourceChanged && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            ⚠ Halaman demo sudah diubah di WordPress sejak pemetaan disimpan.
            Cek ulang pemetaan lalu simpan lagi.
            {missingSaved.length > 0 &&
              ` ${missingSaved.length} konten yang dipetakan sudah tidak ada di halaman.`}
          </p>
        )}
      </section>

      {source && (
        <>
          <div className="animate-fade-up flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="w-full sm:w-auto">
              <SegmentedTabs tabs={TABS} value={tab} onChange={setTab} />
            </div>
            <p className="text-xs text-slate-500">
              {mappedCount} dari {source.items.length} konten dipetakan
            </p>
          </div>

          {errors.length > 0 && (
            <ul className="list-inside list-disc rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}

          {tab === "content" && (
            <ContentTab
              source={source}
              fields={fields}
              fieldsByKey={fieldsByKey}
              mappings={mappings}
              onlyMapped={onlyMapped}
              setOnlyMapped={setOnlyMapped}
              setMapping={setMapping}
              applySuggestions={applySuggestions}
              clearAll={() => setMappings({})}
            />
          )}
          {tab === "style" && (
            <div className="grid gap-4 lg:grid-cols-2">
              <SlotList
                title="Warna"
                hint="Centang warna yang boleh diganti client, lalu beri nama yang mudah dipahami (mis. Warna utama)."
                slots={source.colors}
                state={colors}
                setState={setColors}
                renderSwatch={(value) => (
                  <span
                    className="h-6 w-6 shrink-0 rounded-md ring-1 ring-slate-300"
                    style={{ backgroundColor: value }}
                  />
                )}
              />
              <SlotList
                title="Font"
                hint="Centang font yang boleh diganti client."
                slots={source.fonts}
                state={fonts}
                setState={setFonts}
                renderSwatch={(value) => (
                  <span
                    className="w-6 shrink-0 text-center text-base text-slate-700"
                    style={{ fontFamily: value }}
                  >
                    Aa
                  </span>
                )}
              />
            </div>
          )}
          {tab === "sections" && (
            <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <p className="mb-3 text-xs text-slate-500">
                Section <b>wajib</b> selalu tampil dan tidak bisa dipindah.
                Section lain bisa disembunyikan atau diurutkan ulang oleh
                client. Buka <b>Blok di dalam section</b> untuk menandai bagian
                kecil (mis. Live Streaming) yang boleh disembunyikan client.
                Pilih <b>Bawaan: disembunyikan</b> kalau blok itu tersembunyi
                sejak awal (client tetap bisa memunculkannya).
              </p>
              <ul className="divide-y divide-slate-100">
                {source.sections.map((s) => (
                  <li key={s.element_id} className="py-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-slate-700">
                        <span className="mr-2 text-xs text-slate-400">
                          {s.index + 1}.
                        </span>
                        {s.title}
                      </span>
                      <label className="flex shrink-0 items-center gap-2 text-xs text-slate-600">
                        <input
                          type="checkbox"
                          checked={!!sections[s.element_id]}
                          onChange={(e) =>
                            setSections((c) => ({
                              ...c,
                              [s.element_id]: e.target.checked,
                            }))
                          }
                          className="rounded border-slate-300 text-indigo-600"
                        />
                        Wajib
                      </label>
                    </div>
                    <BlockList
                      section={s}
                      blocks={blocks}
                      setBlocks={setBlocks}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {preview && (
            <PreviewPanel
              preview={preview}
              source={source}
              colors={colors}
              fonts={fonts}
              sections={sections}
              blocks={blocks}
              trial={trial}
              setTrial={setTrial}
              previewing={previewing}
              onRefresh={testPreview}
            />
          )}

          <div className="sticky bottom-4 z-10 flex flex-col-reverse gap-2 rounded-2xl bg-white/90 p-3 shadow-lg ring-1 ring-slate-200 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            {saved ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Hapus Pemetaan
              </button>
            ) : (
              <span className="text-xs text-slate-500">Belum disimpan</span>
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <button
                type="button"
                onClick={testPreview}
                disabled={previewing || saving || mappedCount === 0}
                title="Buat halaman preview di WordPress dengan data contoh (Romeo & Juliet)"
                className="rounded-lg border border-violet-300 px-4 py-2 text-sm font-medium text-violet-700 hover:bg-violet-50 disabled:opacity-50"
              >
                {previewing ? "Membuat preview…" : "👁 Tes Preview"}
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving || mappedCount === 0}
                className="rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:shadow-md disabled:opacity-50"
              >
                {saving ? "Menyimpan…" : "Simpan Pemetaan"}
              </button>
            </div>
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={remove}
        loading={saving}
        title="Hapus Pemetaan?"
        description="Tema ini tidak bisa lagi dipakai untuk Self Editing versi WordPress. Halaman demo di WordPress tidak terpengaruh."
        confirmLabel="Ya, Hapus"
        loadingLabel="Menghapus..."
        icon={
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
          />
        }
      />
    </div>
  );
}

// Hasil Tes Preview di bingkai HP + percobaan kustom (slot warna/font yang tidak
// dikunci, section opsional) supaya admin bisa memastikan penggantiannya benar.
function PreviewPanel({
  preview,
  source,
  colors,
  fonts,
  sections,
  blocks,
  trial,
  setTrial,
  previewing,
  onRefresh,
}) {
  const [loadedAt, setLoadedAt] = useState(null); // synced_at preview yang iframe-nya sudah selesai dimuat
  const openColors = Object.keys(colors).filter(
    (value) => !colors[value].locked,
  );
  const openFonts = Object.keys(fonts).filter((value) => !fonts[value].locked);
  const optionalSections = source.sections.filter(
    (s) => !sections[s.element_id],
  );
  const optionalBlocks = Object.entries(blocks);
  const setTrialValue = (group, key, value) =>
    setTrial((t) => ({ ...t, [group]: { ...t[group], [key]: value } }));

  return (
    <section className="animate-fade-up grid gap-5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5 lg:grid-cols-[auto_minmax(0,1fr)]">
      <div className="mx-auto">
        <div className="relative h-[min(680px,calc(100vh-10rem))] w-[min(360px,calc(100vw-4rem))] overflow-hidden rounded-[2.25rem] border-[10px] border-slate-900 bg-white shadow-xl">
          <div className="absolute top-0 left-1/2 z-10 h-5 w-28 -translate-x-1/2 rounded-b-2xl bg-slate-900" />
          {loadedAt !== preview.synced_at && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-50 text-xs text-slate-400">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-violet-500" />
              Memuat preview...
            </div>
          )}
          <iframe
            key={preview.synced_at}
            src={preview.preview_url}
            title="Tes Preview"
            onLoad={() => setLoadedAt(preview.synced_at)}
            className="h-full w-full border-0"
          />
        </div>
      </div>

      <div className="min-w-0 space-y-4">
        <div>
          <p className="text-sm font-semibold text-slate-800">Tes Preview</p>
          <p className="mt-1 text-xs text-slate-500">
            Halaman demo disalin ke halaman tersembunyi di WordPress lalu diisi
            data contoh (Romeo &amp; Juliet). {preview.replaced} konten diganti.
            Foto tetap memakai gambar demo. Halaman demo asli tidak berubah.
          </p>
          <a
            href={preview.preview_url}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-xs font-medium text-indigo-600 hover:underline"
          >
            Buka di tab baru ↗
          </a>
        </div>

        {preview.missing?.length > 0 && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            ⚠ {preview.missing.length} elemen yang dipetakan tidak ditemukan di
            halaman demo (mungkin sudah dihapus). Baca ulang halaman lalu cek
            pemetaannya.
          </p>
        )}

        <div className="space-y-3 rounded-xl bg-slate-50 p-3">
          <div>
            <p className="text-xs font-semibold text-slate-700">
              Coba kustom client (opsional)
            </p>
            <p className="mt-0.5 rounded-md bg-amber-50 px-2 py-1 text-[11px] text-amber-800">
              Percobaan saja: pilihan di sini <b>tidak disimpan</b> dan{" "}
              <b>tidak berlaku ke client</b>. Untuk client, atur blok di tab
              Section (Bawaan: disembunyikan) lalu klik Simpan Pemetaan.
            </p>
          </div>
          {openColors.length +
            openFonts.length +
            optionalSections.length +
            optionalBlocks.length ===
            0 && (
            <p className="text-xs text-slate-400">
              Belum ada warna/font yang dibuka atau section/blok opsional.
            </p>
          )}
          {openColors.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {openColors.map((value) => (
                <label
                  key={value}
                  className="flex items-center gap-1.5 text-xs text-slate-600"
                >
                  <span
                    className="h-5 w-5 rounded ring-1 ring-slate-300"
                    style={{ backgroundColor: value }}
                  />
                  →
                  <input
                    type="color"
                    value={
                      trial.colors[value] ||
                      (value.length === 4
                        ? `#${[...value.slice(1)].map((c) => c + c).join("")}`
                        : value)
                    }
                    onChange={(e) =>
                      setTrialValue(
                        "colors",
                        value,
                        e.target.value.toUpperCase(),
                      )
                    }
                    className="h-6 w-8 cursor-pointer rounded border border-slate-300 bg-white"
                  />
                  {colors[value].label || value}
                </label>
              ))}
            </div>
          )}
          {openFonts.map((value) => (
            <label
              key={value}
              className="flex items-center gap-2 text-xs text-slate-600"
            >
              <span className="w-28 shrink-0 truncate" title={value}>
                {fonts[value].label || value}
              </span>
              <input
                type="text"
                value={trial.fonts[value] || ""}
                onChange={(e) => setTrialValue("fonts", value, e.target.value)}
                placeholder={`${value} → mis. Playfair Display`}
                className="min-w-0 flex-1 rounded-md border border-slate-300 px-2 py-1 text-xs"
              />
            </label>
          ))}
          {optionalSections.length > 0 && (
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {optionalSections.map((s) => (
                <label
                  key={s.element_id}
                  className="flex items-center gap-1.5 text-xs text-slate-600"
                >
                  <input
                    type="checkbox"
                    checked={!!trial.hidden[s.element_id]}
                    onChange={(e) =>
                      setTrialValue("hidden", s.element_id, e.target.checked)
                    }
                    className="rounded border-slate-300 text-indigo-600"
                  />
                  Sembunyikan {s.title}
                </label>
              ))}
            </div>
          )}
          {optionalBlocks.length > 0 && (
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {optionalBlocks.map(([bid, block]) => (
                <label
                  key={bid}
                  className="flex items-center gap-1.5 text-xs text-slate-600"
                >
                  <input
                    type="checkbox"
                    checked={trialBlockHidden(trial, blocks, bid)}
                    onChange={(e) =>
                      setTrialValue("blocks", bid, e.target.checked)
                    }
                    className="rounded border-slate-300 text-indigo-600"
                  />
                  Sembunyikan blok {block.title || bid}
                </label>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onRefresh}
              disabled={previewing}
              className="rounded-md bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-50"
            >
              {previewing ? "Memperbarui…" : "Perbarui Preview"}
            </button>
            <button
              type="button"
              onClick={() => setTrial(EMPTY_TRIAL)}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-white"
            >
              Reset kustom
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// Blok di dalam satu section (inner section/kolom) yang bisa ditandai opsional.
function BlockList({ section, blocks, setBlocks }) {
  const list = section.blocks || [];
  if (list.length === 0) return null;
  const chosen = list.filter((b) => blocks[b.element_id] !== undefined).length;

  const toggle = (block, checked) =>
    setBlocks((current) => {
      const next = { ...current };
      if (checked)
        next[block.element_id] = { title: block.title, hidden: false };
      else delete next[block.element_id];
      return next;
    });

  return (
    <details className="mt-1 ml-5" open={chosen > 0}>
      <summary className="cursor-pointer text-xs text-slate-500 hover:text-slate-700">
        Blok di dalam section ({list.length})
        {chosen > 0 && (
          <span className="ml-1 font-medium text-indigo-600">
            · {chosen} opsional
          </span>
        )}
      </summary>
      <ul className="mt-1 space-y-1">
        {list.map((b) => {
          const optional = blocks[b.element_id] !== undefined;
          return (
            <li
              key={b.element_id}
              className="flex flex-wrap items-center gap-2"
              style={{ paddingLeft: `${b.depth * 16}px` }}
            >
              <label className="flex min-w-0 items-center gap-2 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={optional}
                  onChange={(e) => toggle(b, e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600"
                />
                <span className="truncate" title={b.title}>
                  {b.title}
                </span>
              </label>
              {optional && (
                <>
                  <input
                    type="text"
                    value={blocks[b.element_id].title}
                    maxLength={100}
                    onChange={(e) =>
                      setBlocks((c) => ({
                        ...c,
                        [b.element_id]: {
                          ...c[b.element_id],
                          title: e.target.value,
                        },
                      }))
                    }
                    placeholder="Nama untuk client, mis. Live Streaming"
                    className="min-w-0 flex-1 rounded-md border border-slate-300 px-2 py-0.5 text-xs"
                  />
                  <select
                    value={blocks[b.element_id].hidden ? "hidden" : "shown"}
                    onChange={(e) =>
                      setBlocks((c) => ({
                        ...c,
                        [b.element_id]: {
                          ...c[b.element_id],
                          hidden: e.target.value === "hidden",
                        },
                      }))
                    }
                    title="Tampilan awal untuk client. Client tetap bisa mengubahnya."
                    className="rounded-md border border-slate-300 px-2 py-0.5 text-xs"
                  >
                    <option value="shown">Bawaan: tampil</option>
                    <option value="hidden">Bawaan: disembunyikan</option>
                  </select>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </details>
  );
}

function ContentTab({
  source,
  fields,
  fieldsByKey,
  mappings,
  onlyMapped,
  setOnlyMapped,
  setMapping,
  applySuggestions,
  clearAll,
}) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={applySuggestions}
          className="rounded-md border border-violet-300 px-3 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-50"
        >
          ✨ Terapkan Semua Saran
        </button>
        <button
          type="button"
          onClick={clearAll}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
        >
          Kosongkan Semua
        </button>
        <label className="ml-auto flex items-center gap-2 text-xs text-slate-600">
          <input
            type="checkbox"
            checked={onlyMapped}
            onChange={(e) => setOnlyMapped(e.target.checked)}
            className="rounded border-slate-300 text-indigo-600"
          />
          Hanya yang dipetakan
        </label>
      </div>
      <p className="text-xs text-slate-500">
        Pasangkan konten demo ke data undangan. Konten yang dibiarkan{" "}
        <i>Tidak diubah</i> tetap seperti demo dan tidak bisa diganti client.
      </p>

      {source.sections.map((section) => {
        const items = source.items.filter(
          (item) =>
            item.section === section.index &&
            (!onlyMapped || mappings[itemKey(item)]),
        );
        if (items.length === 0) return null;
        const mapped = items.filter((item) => mappings[itemKey(item)]).length;
        return (
          <details
            key={section.element_id}
            open
            className="group rounded-2xl bg-white shadow-sm ring-1 ring-slate-200"
          >
            <summary className="flex cursor-pointer items-center justify-between gap-2 px-4 py-3 text-sm font-semibold text-slate-800">
              <span>
                {section.index + 1}. {section.title}
              </span>
              <span className="text-xs font-normal text-slate-500">
                {mapped}/{items.length} dipetakan
              </span>
            </summary>
            <ul className="divide-y divide-slate-100 border-t border-slate-100">
              {items.map((item) => (
                <ContentRow
                  key={itemKey(item)}
                  item={item}
                  fields={fields}
                  fieldsByKey={fieldsByKey}
                  mapping={mappings[itemKey(item)]}
                  onChange={(m) => setMapping(item, m)}
                />
              ))}
            </ul>
          </details>
        );
      })}
    </section>
  );
}

function ContentRow({ item, fields, fieldsByKey, mapping, onChange }) {
  const allowed = KIND_TYPES[item.kind] || [];
  const options = fields.filter((f) => allowed.includes(f.type));
  const groups = [...new Set(options.map((f) => f.group))];
  const selectValue =
    mapping?.pattern !== undefined ? PATTERN : mapping?.field || "";
  const isSuggested = sameMapping(mapping, item.suggestion);

  const handleSelect = (value) => {
    if (value === "") onChange(null);
    else if (value === PATTERN)
      onChange({ pattern: mapping?.pattern || item.suggestion?.pattern || "" });
    else onChange({ field: value });
  };

  return (
    <li className="grid gap-2 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,18rem)] sm:items-start">
      <div className="min-w-0">
        <Preview item={item} />
        <p className="mt-1 text-[11px] text-slate-400">
          {KIND_LABELS[item.kind]} · {item.widget}
        </p>
      </div>
      <div className="space-y-1.5">
        <select
          value={selectValue}
          onChange={(e) => handleSelect(e.target.value)}
          aria-label="Pasangkan ke field"
          className={`w-full rounded-lg border bg-white px-2.5 py-1.5 text-xs focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none ${
            mapping
              ? "border-indigo-300 font-medium text-indigo-700"
              : "border-slate-300 text-slate-500"
          }`}
        >
          <option value="">— Tidak diubah —</option>
          {item.kind === "text" && (
            <option value={PATTERN}>
              ✎ Pola teks (gabungan beberapa field)…
            </option>
          )}
          {groups.map((group) => (
            <optgroup key={group} label={group}>
              {options
                .filter((f) => f.group === group)
                .map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.label}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
        {selectValue === PATTERN && (
          <>
            <input
              type="text"
              value={mapping.pattern}
              onChange={(e) => onChange({ pattern: e.target.value })}
              placeholder="{groom_nickname} & {bride_nickname}"
              className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 font-mono text-xs focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
            />
            <PatternHint pattern={mapping.pattern} fieldsByKey={fieldsByKey} />
          </>
        )}
        {item.suggestion && !isSuggested && (
          <button
            type="button"
            onClick={() => onChange(item.suggestion)}
            className="text-[11px] text-violet-600 hover:underline"
          >
            Saran: {describe(item.suggestion, fieldsByKey)}
          </button>
        )}
        {isSuggested && (
          <p className="text-[11px] text-violet-500">✨ dari saran otomatis</p>
        )}
      </div>
    </li>
  );
}

function Preview({ item }) {
  if (item.kind === "image") {
    return (
      <div className="flex items-center gap-2">
        <img
          src={item.value}
          alt=""
          loading="lazy"
          className="h-12 w-12 shrink-0 rounded-md object-cover ring-1 ring-slate-200"
        />
        <span className="truncate text-xs text-slate-500">
          {item.value.split("/").pop()}
        </span>
      </div>
    );
  }
  if (item.kind === "gallery") {
    return (
      <div className="flex flex-wrap items-center gap-1">
        {item.images.map((src) => (
          <img
            key={src}
            src={src}
            alt=""
            loading="lazy"
            className="h-10 w-10 rounded object-cover ring-1 ring-slate-200"
          />
        ))}
        <span className="ml-1 text-xs text-slate-500">{item.value}</span>
      </div>
    );
  }
  return (
    <p className="line-clamp-3 text-sm break-words text-slate-700">
      {item.value}
    </p>
  );
}

function PatternHint({ pattern, fieldsByKey }) {
  const keys = [...(pattern || "").matchAll(/\{([a-z0-9_]+)\}/g)].map(
    (m) => m[1],
  );
  if (keys.length === 0) {
    return (
      <p className="text-[11px] text-slate-500">
        Tulis nama field dalam kurung kurawal, mis. {"{groom_nickname}"}.
      </p>
    );
  }
  return (
    <p className="text-[11px] text-slate-500">
      {keys.map((k, i) => (
        <span
          key={`${k}-${i}`}
          className={fieldsByKey[k] ? "" : "font-medium text-red-600"}
        >
          {i > 0 && ", "}
          {fieldsByKey[k]
            ? `${fieldsByKey[k].group}: ${fieldsByKey[k].label}`
            : `{${k}} tidak dikenal`}
        </span>
      ))}
    </p>
  );
}

function describe(mapping, fieldsByKey) {
  if (mapping.pattern) return `pola "${mapping.pattern}"`;
  const f = fieldsByKey[mapping.field];
  return f ? `${f.group} · ${f.label}` : mapping.field;
}

function SlotList({ title, hint, slots, state, setState, renderSwatch }) {
  const update = (value, patch) =>
    setState((c) => ({ ...c, [value]: { ...c[value], ...patch } }));
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <p className="mb-3 text-xs text-slate-500">{hint}</p>
      {slots.length === 0 ? (
        <p className="text-xs text-slate-400">Tidak ada.</p>
      ) : (
        <ul className="space-y-2">
          {slots.map(({ value, count }) => {
            const slot = state[value] || { label: "", locked: true };
            return (
              <li key={value} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!slot.locked}
                  onChange={(e) => update(value, { locked: !e.target.checked })}
                  aria-label={`Client boleh ganti ${value}`}
                  className="rounded border-slate-300 text-indigo-600"
                />
                {renderSwatch(value)}
                <span
                  className="w-32 shrink-0 truncate font-mono text-xs text-slate-600"
                  title={value}
                >
                  {value} <span className="text-slate-400">×{count}</span>
                </span>
                <input
                  type="text"
                  value={slot.label}
                  disabled={slot.locked}
                  onChange={(e) => update(value, { label: e.target.value })}
                  placeholder={slot.locked ? "Dikunci" : "Nama untuk client"}
                  maxLength={50}
                  className="min-w-0 flex-1 rounded-md border border-slate-300 px-2 py-1 text-xs disabled:bg-slate-50 disabled:text-slate-400"
                />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
