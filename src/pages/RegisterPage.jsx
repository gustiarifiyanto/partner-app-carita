import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import welcomeAnimation from "../assets/lottie/welcome_partner.json";
import logo from "../assets/logo/logo_carita_v4.png";
import LottiePlayer from "../components/LottiePlayer";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import api from "../lib/api";
import { AVATAR_OPTIONS } from "../lib/avatarOptions";
import { homePathForRole } from "../lib/roles";

const BENEFITS = [
  "Pantau order & komisi kapan saja",
  "Proses verifikasi cepat oleh admin",
  "Kelola profil bisnis kamu sendiri",
];

const INITIAL_FORM = {
  name: "",
  company_name: "",
  email: "",
  phone: "",
  city: "",
  address: "",
  referral_source: "",
  password: "",
  password_confirmation: "",
  avatar: AVATAR_OPTIONS[0]?.id ?? "",
};

function inputClass(hasError) {
  return `w-full rounded-lg border py-2.5 px-3 text-sm text-slate-900 transition focus:outline-none focus:ring-2 ${
    hasError
      ? "border-red-400 focus:border-red-500 focus:ring-red-500/30"
      : "border-slate-300 focus:border-violet-500 focus:ring-violet-500/30"
  }`;
}

function Field({
  label,
  error,
  hint,
  required,
  delay = 0,
  children,
  className = "",
}) {
  return (
    <div
      className={`animate-fade-up ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-xs text-red-600">
          {Array.isArray(error) ? error[0] : error}
        </p>
      )}
      {!error && hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function IconInput({ icon, className = "", ...props }) {
  return (
    <div className="group relative">
      <svg
        className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-violet-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.75}
      >
        {icon}
      </svg>
      <input {...props} className={`${className} pl-10`} />
    </div>
  );
}

function AvatarDropdown({ value, onChange, error }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const selected =
    AVATAR_OPTIONS.find((a) => a.id === value) ?? AVATAR_OPTIONS[0];

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`flex w-full items-center gap-3 rounded-lg border py-2 px-3 text-left text-sm transition focus:outline-none focus:ring-2 ${
          error
            ? "border-red-400 focus:border-red-500 focus:ring-red-500/30"
            : "border-slate-300 focus:border-violet-500 focus:ring-violet-500/30"
        }`}
      >
        {selected ? (
          <img
            src={selected.src}
            alt=""
            className="h-9 w-9 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="text-slate-700">Pilih foto profil</span>
        )}
        <span className="flex-1" />
        <svg
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m19.5 8.25-7.5 7.5-7.5-7.5"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-full rounded-xl bg-white p-3 shadow-lg ring-1 ring-slate-200">
          <div className="grid max-h-56 grid-cols-5 gap-2.5 overflow-y-auto p-1 sm:grid-cols-7">
            {AVATAR_OPTIONS.map((avatar) => (
              <button
                key={avatar.id}
                type="button"
                onClick={() => {
                  onChange(avatar.id);
                  setOpen(false);
                }}
                aria-label={`Pilih foto profil ${avatar.id}`}
                aria-pressed={value === avatar.id}
                className={`aspect-square overflow-hidden rounded-full ring-2 ring-offset-2 transition ${
                  value === avatar.id
                    ? "ring-violet-600"
                    : "ring-transparent hover:ring-slate-300"
                }`}
              >
                <img
                  src={avatar.src}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const ICONS = {
  user: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
    />
  ),
  building: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 21h19.5M4.5 3v18M19.5 3v18M9 6.75h1.5M9 11.25h1.5M9 15.75h1.5m3.75-9h1.5m-1.5 4.5h1.5m-1.5 4.5h1.5M6 21V3h12v18"
    />
  ),
  mail: (
    <>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 6.75c0-.83.67-1.5 1.5-1.5h16.5c.83 0 1.5.67 1.5 1.5v10.5c0 .83-.67 1.5-1.5 1.5H3.75a1.5 1.5 0 0 1-1.5-1.5V6.75Z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="m3 7 9 6 9-6" />
    </>
  ),
  phone: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
    />
  ),
  mapPin: (
    <>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
      />
    </>
  ),
  map: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.159.69.159 1.006 0Z"
    />
  ),
  tag: (
    <>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 6h.008v.008H6V6Z"
      />
    </>
  ),
  lock: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a1.5 1.5 0 0 0 1.5-1.5v-8.25a1.5 1.5 0 0 0-1.5-1.5H6.75a1.5 1.5 0 0 0-1.5 1.5v8.25a1.5 1.5 0 0 0 1.5 1.5Z"
    />
  ),
};

export default function RegisterPage() {
  const { user, token, loading: authLoading, login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (!authLoading && token && user) {
    return <Navigate to={homePathForRole(user.role)} replace />;
  }

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setGeneralError("");
    setSubmitting(true);

    try {
      const payload = { ...form };
      if (!payload.referral_source) delete payload.referral_source;

      await api.post("/auth/register", payload);
      toast.success("Registrasi berhasil! Selamat datang di Carita Studio.");

      sessionStorage.setItem("justRegistered", "1");
      await login(form.email, form.password);
      navigate("/partner", { replace: true });
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
      } else {
        setGeneralError(
          err.response?.data?.message || "Registrasi gagal, silakan coba lagi.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 lg:h-screen lg:flex-row lg:overflow-hidden">
      <div
        className="relative hidden items-center justify-center overflow-hidden px-10 lg:flex lg:h-full lg:w-1/2"
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
            Bergabung Jadi Partner
          </h2>
          <p
            className="animate-fade-up mt-3 text-sm text-blue-100"
            style={{ animationDelay: "80ms" }}
          >
            Daftarkan bisnis kamu dan mulai kelola kemitraan dengan Carita
            Studio.
          </p>

          <ul className="mt-8 flex flex-col gap-2.5 text-left">
            {BENEFITS.map((item, i) => (
              <li
                key={item}
                className="animate-fade-up flex items-center gap-3 rounded-xl bg-white/15 px-3 py-2 text-sm font-medium text-white shadow-sm backdrop-blur-sm"
                style={{ animationDelay: `${140 + i * 90}ms` }}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex w-full flex-1 items-center justify-center px-4 py-10 lg:h-full lg:w-1/2 lg:items-start lg:overflow-y-auto">
        <div className="animate-card-in my-auto w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl ring-1 ring-slate-200 sm:p-10">
          <img
            src={logo}
            alt="Carita Studio"
            className="mx-auto mb-6 h-16 w-16 object-contain"
          />

          <h1 className="text-center text-xl font-semibold text-slate-900 lg:text-left">
            Daftar Sebagai Partner
          </h1>
          <p className="mt-1 text-center text-sm text-slate-500 lg:text-left">
            Lengkapi data berikut untuk membuat akun partner baru
          </p>

          {generalError && (
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
              <span>{generalError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Nama Lengkap"
                error={errors.name}
                required
                delay={0}
              >
                <IconInput
                  icon={ICONS.user}
                  value={form.name}
                  onChange={handleChange("name")}
                  className={inputClass(errors.name)}
                  required
                />
              </Field>
              <Field
                label="Nama Bisnis/Brand"
                error={errors.company_name}
                required
                delay={40}
              >
                <IconInput
                  icon={ICONS.building}
                  value={form.company_name}
                  onChange={handleChange("company_name")}
                  className={inputClass(errors.company_name)}
                  required
                />
              </Field>
            </div>

            <Field
              label="Foto Profil"
              error={errors.avatar}
              hint="Pilih salah satu foto profil untuk akun kamu."
              delay={60}
              className="relative z-20"
            >
              <AvatarDropdown
                value={form.avatar}
                onChange={(avatarId) =>
                  setForm((prev) => ({ ...prev, avatar: avatarId }))
                }
                error={errors.avatar}
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Email" error={errors.email} required delay={80}>
                <IconInput
                  icon={ICONS.mail}
                  type="email"
                  value={form.email}
                  onChange={handleChange("email")}
                  className={inputClass(errors.email)}
                  placeholder="nama@gmail.com"
                  required
                />
              </Field>
              <Field label="Nomor WA" error={errors.phone} required delay={120}>
                <IconInput
                  icon={ICONS.phone}
                  type="tel"
                  value={form.phone}
                  onChange={handleChange("phone")}
                  className={inputClass(errors.phone)}
                  placeholder="08xxxxxxxxxx"
                  required
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Kota" error={errors.city} required delay={160}>
                <IconInput
                  icon={ICONS.mapPin}
                  value={form.city}
                  onChange={handleChange("city")}
                  className={inputClass(errors.city)}
                  required
                />
              </Field>
              <Field
                label="Referral"
                error={errors.referral_source}
                hint="Dari mana kamu tahu Carita Studio? (opsional)"
                delay={200}
              >
                <IconInput
                  icon={ICONS.tag}
                  value={form.referral_source}
                  onChange={handleChange("referral_source")}
                  className={inputClass(errors.referral_source)}
                  placeholder="Instagram, teman, dll."
                />
              </Field>
            </div>

            <Field
              label="Alamat Lengkap"
              error={errors.address}
              required
              delay={240}
            >
              <textarea
                rows={2}
                value={form.address}
                onChange={handleChange("address")}
                className={inputClass(errors.address)}
                required
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Password"
                error={errors.password}
                required
                delay={280}
              >
                <div className="group relative">
                  <svg
                    className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-violet-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.75}
                  >
                    {ICONS.lock}
                  </svg>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange("password")}
                    className={`${inputClass(errors.password)} pr-10 pl-10`}
                    placeholder="Minimal 8 karakter"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label={
                      showPassword
                        ? "Sembunyikan password"
                        : "Tampilkan password"
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
              </Field>
              <Field label="Konfirmasi Password" required delay={320}>
                <IconInput
                  icon={ICONS.lock}
                  type={showPassword ? "text" : "password"}
                  value={form.password_confirmation}
                  onChange={handleChange("password_confirmation")}
                  className={inputClass(false)}
                  required
                />
              </Field>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="animate-fade-up flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-[0_8px_24px_rgba(109,40,217,0.35)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                backgroundImage: "linear-gradient(135deg, #4c1d95, #6d28d9)",
                animationDelay: "360ms",
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
              {submitting ? "Memproses..." : "Daftar Sekarang"}
            </button>

            <p
              className="animate-fade-up text-center text-sm text-slate-500"
              style={{ animationDelay: "400ms" }}
            >
              Sudah punya akun?{" "}
              <Link
                to="/login"
                className="font-medium text-violet-600 hover:text-violet-700 hover:underline"
              >
                Masuk di sini
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
