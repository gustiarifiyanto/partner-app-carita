const modules = import.meta.glob('../assets/avatars/*.png', { eager: true, import: 'default' })

export const AVATAR_OPTIONS = Object.entries(modules)
  .map(([path, src]) => ({ id: path.split('/').pop(), src }))
  .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))

export function getAvatarSrc(id) {
  return AVATAR_OPTIONS.find((a) => a.id === id)?.src ?? null
}
