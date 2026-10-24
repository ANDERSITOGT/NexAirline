import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Plane,
  Radio,
  ShieldCheck,
  User,
} from "lucide-react";
import { startSession, hasSession } from "@/lib/auth";
import { api } from "@/services/api";

interface LoginResponse {
  access_token: string;
  token_type: "Bearer";
  usuario: unknown;
}

const flightVectors = [
  { label: "▲ AX-204 | FL320 | 440kt", className: "left-[21%] top-[28%]", trail: "w-16 -rotate-12" },
  { label: "▲ 5U-7155 | FL280 | GUA-BOG", className: "right-[12%] top-[37%]", trail: "w-20 rotate-12" },
  { label: "▲ IN-082 | FL190 | MEX-MGGT", className: "left-[15%] bottom-[25%]", trail: "w-12 rotate-[-25deg]" },
];

const rangeRings = [
  { size: "size-[min(42vw,520px)]", label: "300 NM", position: "left-1/2 top-[8%]" },
  { size: "size-[min(30vw,370px)]", label: "200 NM", position: "left-1/2 top-[20%]" },
  { size: "size-[min(18vw,220px)]", label: "100 NM", position: "left-1/2 top-[32%]" },
];

export const Login = () => {
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const destination =
    (location.state as { from?: string } | null)?.from || "/operaciones/dashboard";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      // The UI uses the operator-facing username while the API expects nombreUsuario.
      const data = await api.post<LoginResponse>("/login", {
        nombreUsuario: credentials.username,
        password: credentials.password,
      });
      startSession(data.access_token, data.usuario);
      setCredentials({ username: "", password: "" });
      navigate(destination, { replace: true });
    } catch (error) {
      console.error("Error logging in", error);
      alert("Las credenciales son incorrectas");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasSession()) return <Navigate replace to="/dashboard" />;

  return (
    <main className="flex min-h-screen bg-[#07111d] font-mono text-slate-100">
      <section className="relative hidden min-h-screen w-[62%] overflow-hidden border-r border-slate-700/60 bg-[#07111d] lg:block">
        <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(56,189,248,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.12)_1px,transparent_1px)] [background-size:48px_48px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(8,47,73,0.55),transparent_68%)]" />

        <div className="relative z-10 flex min-h-screen flex-col px-8 py-7 xl:px-14">
          <header className="flex items-center justify-between border-b border-slate-700/60 pb-5">
            <div className="flex items-center gap-3 text-sm font-bold tracking-[0.28em] text-slate-200">
              <span className="flex size-9 items-center justify-center rounded-md border border-orange-500/60 bg-orange-500/10">
                <Plane className="size-4 -rotate-45 text-orange-400" />
              </span>
              air<span className="text-orange-400">INex</span>
            </div>
            <span className="text-[10px] tracking-[0.18em] text-slate-500">OCC / SECURE TERMINAL</span>
          </header>

          <div className="mt-7">
            <p className="text-[10px] font-bold tracking-[0.17em] text-orange-400">
              CENTRO DE CONTROL DE OPERACIONES (OCC) · AIRINEX INTERNAL
            </p>
            <h1 className="mt-4 max-w-3xl font-sans text-3xl font-semibold leading-tight tracking-tight text-slate-100 xl:text-4xl">
              Gestión Centralizada de Vuelos, Flota y Despacho Aeroportuario
            </h1>
            <p className="mt-3 max-w-2xl font-sans text-sm leading-6 text-slate-400">
              Terminal restringida para personal operativo, supervisión de cabina, despacho en pista y auditoría.
            </p>
          </div>

          <div className="relative mt-5 flex min-h-0 flex-1 items-center justify-center overflow-hidden">
            <div className="absolute left-1/2 top-1/2 h-px w-[92%] -translate-x-1/2 bg-sky-400/20" />
            <div className="absolute left-1/2 top-1/2 h-[92%] w-px -translate-y-1/2 bg-sky-400/20" />
            <div className="absolute left-1/2 top-1/2 h-[65%] w-[65%] -translate-x-1/2 -translate-y-1/2 rotate-45 border-l border-sky-400/10" />
            <div className="absolute left-1/2 top-1/2 h-[65%] w-[65%] -translate-x-1/2 -translate-y-1/2 -rotate-45 border-l border-sky-400/10" />
            {rangeRings.map(({ size, label, position }) => (
              <div
                key={label}
                className={`absolute ${position} -translate-x-1/2 rounded-full border border-sky-400/25 ${size}`}
              >
                <span className="absolute left-2 top-1 text-[9px] text-sky-400/60">{label}</span>
              </div>
            ))}
            <span className="absolute left-1/2 top-[3%] -translate-x-1/2 text-[10px] text-sky-400/70">000°</span>
            <span className="absolute right-[1%] top-1/2 -translate-y-1/2 text-[10px] text-sky-400/70">090°</span>
            <span className="absolute bottom-[3%] left-1/2 -translate-x-1/2 text-[10px] text-sky-400/70">180°</span>
            <span className="absolute left-[1%] top-1/2 -translate-y-1/2 text-[10px] text-sky-400/70">270°</span>

            <div className="animate-radar absolute left-1/2 top-1/2 h-1/2 w-1/2 origin-left -translate-y-1/2 border-t border-cyan-300/70 bg-gradient-to-r from-cyan-400/20 to-transparent" />
            <div className="absolute left-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300 shadow-[0_0_20px_7px_rgba(34,211,238,0.5)]" />

            {flightVectors.map(({ label, className, trail }) => (
              <div key={label} className={`absolute ${className} flex items-center gap-2 text-[9px] text-cyan-300`}>
                <span className="relative flex size-2 shrink-0">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-cyan-300 opacity-60" />
                  <span className="relative inline-flex size-2 rounded-full bg-cyan-200" />
                </span>
                <span className={`border-t border-dashed border-cyan-400/50 ${trail}`} />
                <span className="whitespace-nowrap">{label}</span>
              </div>
            ))}

            <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2 border border-sky-400/30 bg-[#07111d]/80 px-3 py-2 text-center text-[10px] tracking-wider text-sky-300 backdrop-blur-sm">
              <Radio className="mx-auto mb-1 size-3 text-orange-400" />
              MGGT / GUA · CONTROL DE SUPERFICIE
            </div>
          </div>

          <div className="grid gap-2 border-t border-slate-700/60 pt-4 text-[10px] text-slate-400 sm:grid-cols-3">
            <span><b className="text-emerald-400">●</b> ESTACIÓN: MGGT-T1</span>
            <span><b className="text-emerald-400">●</b> PROTOCOLO: WSS-APIFLY NOMINAL</span>
            <span><b className="text-emerald-400">●</b> CANAL: ENCRIPTADO</span>
          </div>
        </div>
      </section>

      <section className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#0b1827] px-5 py-10 lg:w-[38%]">
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:32px_32px]" />
        <div className="relative w-full max-w-md border border-slate-600/70 bg-[#0d1d2d] p-7 shadow-2xl shadow-black/30 sm:p-9">
          <div className="mb-8 border-b border-slate-700/70 pb-6">
            <div className="mb-5 flex size-10 items-center justify-center border border-orange-500/50 bg-orange-500/10 text-orange-400">
              <ShieldCheck className="size-5" />
            </div>
            <p className="mb-2 text-[10px] tracking-[0.18em] text-slate-500">AUTH / OPERATOR</p>
            <h2 className="font-sans text-2xl font-semibold tracking-tight text-white">Control de Acceso</h2>
            <p className="mt-2 font-sans text-sm text-slate-400">Ingrese sus credenciales de operador asignadas.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold text-slate-300">Usuario</span>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  name="username"
                  value={credentials.username}
                  onChange={(event) => setCredentials((current) => ({ ...current, username: event.target.value }))}
                  placeholder="Ej. mramirez o admin"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  required
                  className="h-10 w-full border border-slate-600 bg-slate-950/50 pl-10 pr-3 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30"
                />
              </div>
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-semibold text-slate-300">Contraseña</span>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                <input
                  type={isPasswordVisible ? "text" : "password"}
                  name="password"
                  value={credentials.password}
                  onChange={(event) => setCredentials((current) => ({ ...current, password: event.target.value }))}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  required
                  className="h-10 w-full border border-slate-600 bg-slate-950/50 pl-10 pr-10 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30"
                />
                <button
                  type="button"
                  onClick={() => setIsPasswordVisible((visible) => !visible)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                  aria-label={isPasswordVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {isPasswordVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </label>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-orange-600 text-sm font-medium text-white shadow-md transition-colors hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Validando operador...
                </>
              ) : (
                <>
                  Autenticar Operador
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 border-t border-slate-700/70 pt-5 text-[10px] leading-5 text-slate-500">
            Acceso restringido. Cada inicio de sesión y operación queda registrado en la bitácora del sistema según normativas DGAC.
          </p>
        </div>
      </section>
    </main>
  );
};

export default Login;
