import { useState } from 'react'
import { useToast } from '../../hooks/useToast'
import api from '../../lib/api'
import { downloadFile } from '../../lib/marketingKit'

// Plugin wajib. Widget tambahan (mis. Luxee WidgetKit) dicek per tema saat
// halaman sumber dipilih, bukan di sini.
const PLUGINS = [
  { key: 'elementor', label: 'Elementor' },
  { key: 'elementor_pro', label: 'Elementor Pro' },
]

// Koneksi ke plugin Carita Bridge di WordPress (Self Editing): unduh plugin
// untuk dipasang di WP, lalu tes apakah secret & plugin pendukung sudah benar.
export default function WordpressConnectionCard() {
  const toast = useToast()
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState(null) // { ok, message, info }

  const test = async () => {
    setTesting(true)
    try {
      const [status, pages] = await Promise.all([api.get('/admin/wordpress/status'), api.get('/admin/wordpress/pages')])
      setResult({ ok: true, message: status.data.message, info: status.data.data, pageCount: pages.data.data.length })
    } catch (err) {
      setResult({ ok: false, message: err.response?.data?.message || 'Gagal menghubungi server.' })
    } finally {
      setTesting(false)
    }
  }

  const download = async () => {
    try {
      await downloadFile('/admin/wordpress/plugin', 'carita-bridge.zip')
    } catch {
      toast.error('Gagal mengunduh plugin.')
    }
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800">Koneksi WordPress (Self Editing)</p>
          <p className="text-xs text-slate-500">
            Pasang plugin Carita Bridge di WP Admin → Plugins → Upload, lalu salin secret-nya ke .env aplikasi.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={download}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Unduh Plugin
          </button>
          <button
            type="button"
            onClick={test}
            disabled={testing}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {testing ? 'Menguji…' : 'Tes Koneksi'}
          </button>
        </div>
      </div>

      {result && (
        <div
          className={`mt-3 rounded-lg px-3 py-2.5 text-xs ${
            result.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'
          }`}
        >
          <p className="font-medium">{result.ok ? `✓ ${result.message}` : `✗ ${result.message}`}</p>
          {result.ok && (
            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
              <span>{result.info.site_url}</span>
              <span>Plugin v{result.info.plugin_version}</span>
              {PLUGINS.map((p) => (
                <span key={p.key} className={result.info[p.key] ? '' : 'font-medium text-red-600'}>
                  {result.info[p.key] ? `✓ ${p.label} ${result.info[p.key]}` : `✗ ${p.label} tidak aktif`}
                </span>
              ))}
              <span>{result.pageCount} halaman Elementor</span>
            </div>
          )}
          {/* Bantu diagnosa kalau ada plugin pendukung yang tidak terdeteksi. */}
          {result.ok && PLUGINS.some((p) => !result.info[p.key]) && result.info.active_plugins?.length > 0 && (
            <p className="mt-2 text-slate-600">Plugin aktif di WordPress: {result.info.active_plugins.join(', ')}</p>
          )}
        </div>
      )}
    </div>
  )
}
