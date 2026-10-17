import FormField from '../FormField'
import { fieldClass } from '../../lib/formStyles'
import { formatCurrency } from '../../lib/format'
import ThemeDemoButton from './ThemeDemoButton'

// Pilih paket + tema dalam bentuk dropdown (dipakai form order partner & client).
// Harga hanya ditampilkan; server tetap menghitung harga dari paket.
export default function CatalogPicker({ catalog, packageId, themeId, onChange, errors = {} }) {
  const { packages, themes, categories, loading, error } = catalog

  const selectedPackage = packages.find((p) => String(p.id) === String(packageId))
  const selectedTheme = themes.find((t) => String(t.id) === String(themeId))

  const groups = Object.entries(categories)
    .map(([value, label]) => ({ value, label, themes: themes.filter((t) => t.category === value) }))
    .filter((g) => g.themes.length > 0)

  if (error) return <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>

  return (
    <div className="space-y-3">
      <FormField label="Paket" error={errors.package_id}>
        <select
          value={packageId}
          onChange={(e) => onChange({ package_id: e.target.value })}
          className={fieldClass(errors.package_id)}
          disabled={loading}
          required
        >
          <option value="">{loading ? 'Memuat paket...' : 'Pilih paket'}</option>
          {packages.map((pkg) => (
            <option key={pkg.id} value={pkg.id}>
              {pkg.name} — {formatCurrency(pkg.price)} ({pkg.validity_label})
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Tema" error={errors.theme_id}>
        <select
          value={themeId}
          onChange={(e) => onChange({ theme_id: e.target.value })}
          className={fieldClass(errors.theme_id)}
          disabled={loading}
          required
        >
          <option value="">{loading ? 'Memuat tema...' : 'Pilih tema'}</option>
          {groups.map((group) => (
            <optgroup key={group.value} label={group.label}>
              {group.themes.map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {theme.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </FormField>

      {(selectedPackage || selectedTheme) && (
        <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">
          {selectedTheme?.thumbnail && (
            <img
              src={selectedTheme.thumbnail}
              alt={selectedTheme.name}
              className="h-16 w-12 shrink-0 rounded object-cover ring-1 ring-slate-200"
            />
          )}
          <div className="min-w-0 flex-1 text-sm">
            <p className="truncate font-medium text-slate-900">
              {selectedPackage?.name || 'Pilih paket'} · {selectedTheme?.name || 'Pilih tema'}
            </p>
            <p className="text-slate-500">
              Total: <span className="font-semibold text-slate-900">{selectedPackage ? formatCurrency(selectedPackage.price) : '-'}</span>
            </p>
          </div>
          {selectedTheme?.demo_url && (
            <div className="shrink-0">
              <ThemeDemoButton
                theme={selectedTheme}
                align="right"
                className="text-xs font-medium text-violet-600 hover:underline"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
