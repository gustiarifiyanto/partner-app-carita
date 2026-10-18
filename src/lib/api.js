import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL,
  headers: { Accept: 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Endpoint auth yang 401-nya memang berarti gagal (mis. password salah), bukan token kedaluwarsa.
const NO_REFRESH_URLS = ['/auth/login', '/auth/refresh', '/auth/register', '/auth/logout']

// Satu proses refresh dipakai bersama oleh semua request yang gagal bersamaan.
let refreshPromise = null

function refreshToken() {
  if (!refreshPromise) {
    const token = localStorage.getItem('auth_token')
    refreshPromise = axios
      .post(`${baseURL}/auth/refresh`, null, {
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      })
      .then(({ data }) => {
        localStorage.setItem('auth_token', data.token)
        return data.token
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

function forceLogout() {
  localStorage.removeItem('auth_token')
  localStorage.removeItem('auth_user')
  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const status = error.response?.status
    const skipRefresh = NO_REFRESH_URLS.some((url) => original?.url?.startsWith(url))

    // Token kedaluwarsa (JWT_TTL): perpanjang diam-diam lalu ulangi request,
    // supaya user tidak tiba-tiba logout di tengah pekerjaan.
    if (status === 401 && original && !original._retried && !skipRefresh && localStorage.getItem('auth_token')) {
      original._retried = true
      try {
        const token = await refreshToken()
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      } catch {
        forceLogout()
        return Promise.reject(error)
      }
    }

    if (status === 401 && !skipRefresh) {
      forceLogout()
    }
    return Promise.reject(error)
  },
)

export default api
