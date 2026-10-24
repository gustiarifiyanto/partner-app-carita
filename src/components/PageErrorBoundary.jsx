import { Component } from 'react'

// Menangkap error saat halaman dirender supaya yang tampil pesan error (bisa
// dilaporkan), bukan halaman kosong. Di-reset saat pindah halaman karena
// PageTransition memberi key per path.
export default class PageErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[PageErrorBoundary]', error, info?.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="rounded-2xl bg-white p-6 text-sm shadow-sm ring-1 ring-red-200">
        <p className="font-semibold text-red-700">Halaman ini gagal dimuat.</p>
        <p className="mt-1 text-slate-600">Coba muat ulang. Kalau masih terjadi, kirim pesan error di bawah ke admin.</p>
        <pre className="mt-3 max-h-40 overflow-auto rounded-lg bg-slate-50 p-3 text-xs whitespace-pre-wrap text-red-600 ring-1 ring-slate-200">
          {String(this.state.error?.message || this.state.error)}
        </pre>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 rounded-lg bg-violet-600 px-4 py-2 font-semibold text-white hover:bg-violet-700"
        >
          Muat Ulang
        </button>
      </div>
    )
  }
}
