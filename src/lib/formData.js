// Ubah object (termasuk File) jadi FormData untuk upload multipart.
// Boolean -> '1'/'0'; null/undefined/'' dilewati.
export function toFormData(values) {
  const data = new FormData()
  Object.entries(values).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') return
    data.append(key, typeof value === 'boolean' ? (value ? '1' : '0') : value)
  })
  return data
}
