import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import ForgotPasswordModal from "../components/ForgotPasswordModal";
import welcomeAnimation from "../assets/lottie/welcome_partner.json";
import logo from "../assets/logo/logo_carita_v4.png";
import LottiePlayer from "../components/LottiePlayer";
import { useAuth } from "../hooks/useAuth";
import { homePathForRole } from "../lib/roles";
import { clientLandingPath } from "../lib/orderLink";
import { useToast } from "../hooks/useToast";

const FEATURES = [
  {
    label: "Pantau order & komisi real-time",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 3v18h18M7 14l4-4 3 3 5-6"
      />
    ),
  },
  {
    label: "Verifikasi partner dengan mudah",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    ),
  },
  {
    label: "Laporan & analitik yang lengkap",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 17.25v-6.75m4.5 6.75V6.75M18 17.25v-3.75M4.5 5.25h15A.75.75 0 0 1 20.25 6v13.5a.75.75 0 0 1-.75.75h-15a.75.75 0 0 1-.75-.75V6a.75.75 0 0 1 .75-.75Z"
      />
    ),
  },
];

export default function LoginPage() {
  const { user, token, loading, login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  if (!loading && token && user) {
    return <Navigate to={homePathForRole(user.role)} replace />;
  }

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const loggedInUser = await login(form.email, form.password);
      toast.welcome("Login berhasil.", "Selamat datang di Carita Studio!");
      navigate(
        loggedInUser.role === "client"
          ? clientLandingPath()
          : homePathForRole(loggedInUser.role),
        {
          replace: true,
        },
      );
    } catch (err) {
      setError(
        err.response?.data?.message || "Login gagal, silakan coba lagi.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 lg:flex-row">
      <div
        className="relative hidden items-center justify-center overflow-hidden px-10 lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-1/2 lg:self-start"
        style={{
          backgroundImage:
            "linear-gradient(135deg, #3B82F6 0%, #2563EB 60%, #1D4ED8 100%)",
        }}
      >
        <div
          className="animate-blob absolute -top-20 -left-20 h-96 w-96 rounded-full blur-3xl"
          style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
        />
        <div
          className="animate-blob absolute -right-14 -bottom-20 h-80 w-80 rounded-full blur-3xl"
          style={{
            backgroundColor: "rgba(191,219,254,0.25)",
            animationDelay: "3s",
          }}
        />

        <div className="relative z-10 w-full max-w-md text-center">
          <LottiePlayer
            animationData={welcomeAnimation}
            className="mx-auto w-full max-w-sm"
          />
          <h2 className="animate-fade-up mt-6 text-2xl font-semibold text-white">
            Partner Management System
          </h2>
          <p
            className="animate-fade-up mt-3 text-sm text-blue-100"
            style={{ animationDelay: "80ms" }}
          >
            Kelola kemitraan, order, dan komisi partner Carita Studio dalam satu
            tempat.
          </p>

          <ul className="mt-8 flex flex-col gap-2.5 text-left">
            {FEATURES.map((feature, i) => (
              <li
                key={feature.label}
                className="animate-fade-up flex items-center gap-3 rounded-xl bg-white/15 px-3 py-2 text-sm font-medium text-white shadow-sm backdrop-blur-sm"
                style={{ animationDelay: `${140 + i * 90}ms` }}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    {feature.icon}
                  </svg>
                </span>
                {feature.label}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex w-full flex-1 items-center justify-center px-4 py-10 lg:w-1/2">
        <div className="animate-card-in w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl ring-1 ring-slate-200 sm:p-10">
          <img
            src={logo}
            alt="Carita Studio"
            className="mx-auto mb-6 h-16 w-16 object-contain"
          />

          <h1 className="text-center text-xl font-semibold text-slate-900 lg:text-left">
            Selamat Datang
          </h1>
          <p className="mt-1 text-center text-sm text-slate-500 lg:text-left">
            Masuk ke akun Partner atau client kamu.
          </p>

          {error && (
            <div className="animate-error-in mt-5 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-600">
              <svg
                className="mt-0.5 h-4 w-4 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m0 3.75h.008v.008H12v-.008ZM21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="animate-fade-up" style={{ animationDelay: "80ms" }}>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Email
              </label>
              <div className="group relative">
                <svg
                  className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-violet-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.75}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 6.75c0-.83.67-1.5 1.5-1.5h16.5c.83 0 1.5.67 1.5 1.5v10.5c0 .83-.67 1.5-1.5 1.5H3.75a1.5 1.5 0 0 1-1.5-1.5V6.75Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m3 7 9 6 9-6"
                  />
                </svg>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={form.email}
                  onChange={handleChange("email")}
                  placeholder="nama@gmail.com"
                  className="w-full rounded-lg border border-slate-300 py-2.5 pr-3 pl-10 text-sm text-slate-900 transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30 focus:outline-none"
                />
              </div>
            </div>

            <div
              className="animate-fade-up"
              style={{ animationDelay: "140ms" }}
            >
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-xs font-medium text-violet-600 hover:text-violet-700 hover:underline"
                >
                  Lupa password?
                </button>
              </div>
              <div className="group relative">
                <svg
                  className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-violet-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.75}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a1.5 1.5 0 0 0 1.5-1.5v-8.25a1.5 1.5 0 0 0-1.5-1.5H6.75a1.5 1.5 0 0 0-1.5 1.5v8.25a1.5 1.5 0 0 0 1.5 1.5Z"
                  />
                </svg>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={form.password}
                  onChange={handleChange("password")}
                  placeholder="********"
                  className="w-full rounded-lg border border-slate-300 py-2.5 pr-10 pl-10 text-sm text-slate-900 transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={
                    showPassword ? "Sembunyikan password" : "Tampilkan password"
                  }
                >
                  {showPassword ? (
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.75}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.243L9.88 9.88"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.75}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="animate-fade-up flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-[0_8px_24px_rgba(109,40,217,0.35)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                backgroundImage: "linear-gradient(135deg, #4c1d95, #6d28d9)",
                animationDelay: "200ms",
              }}
            >
              {submitting && (
                <svg
                  className="h-4 w-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth={4}
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              )}
              {submitting ? "Memproses..." : "Masuk"}
            </button>

            <div
              className="animate-fade-up space-y-3"
              style={{ animationDelay: "260ms" }}
            >
              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-slate-200" />
                <span className="text-xs font-medium text-slate-400">
                  Belum punya akun? Daftar sebagai
                </span>
                <span className="h-px flex-1 bg-slate-200" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Link
                  to="/daftar"
                  className="group flex flex-col items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50/60 px-3 py-3 text-center transition hover:-translate-y-0.5 hover:border-violet-400 hover:bg-violet-50 hover:shadow-[0_6px_18px_rgba(109,40,217,0.15)]"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-600 text-white transition group-hover:scale-110">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.75}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                      />
                    </svg>
                  </span>
                  <span className="text-sm font-semibold text-violet-700">
                    Client
                  </span>
                  <span className="text-[11px] leading-tight text-slate-500">
                    Pesan undangan digital
                  </span>
                </Link>

                <Link
                  to="/register"
                  className="group flex flex-col items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-3 text-center transition hover:-translate-y-0.5 hover:border-amber-400 hover:bg-amber-50 hover:shadow-[0_6px_18px_rgba(217,119,6,0.15)]"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500 text-white transition group-hover:scale-110">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.75}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0"
                      />
                    </svg>
                  </span>
                  <span className="text-sm font-semibold text-amber-700">
                    Partner
                  </span>
                  <span className="text-[11px] leading-tight text-slate-500">
                    Jual &amp; dapat komisi
                  </span>
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>

      <ForgotPasswordModal
        open={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        initialEmail={form.email}
      />
    </div>
  );
}
