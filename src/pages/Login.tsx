import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Plane, Satellite, Shield, User } from "lucide-react";
import { startSession, hasSession } from "@/lib/auth";
import { api } from "@/services/api";

interface LoginResponse {
  access_token: string;
  token_type: "Bearer";
  usuario: unknown;
}

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
    <main className="flex min-h-screen font-sans antialiased">
      <section className="relative hidden min-h-screen w-1/2 items-center justify-center overflow-hidden bg-slate-950 lg:flex">
        <style>{`
          @keyframes fly-1 { 0% { transform: translate(0, 0) scale(1); } 100% { transform: translate(120px, -80px) scale(1.1); } }
          @keyframes fly-2 { 0% { transform: translate(0, 0); } 100% { transform: translate(-100px, 90px); } }
          @keyframes fly-3 { 0% { transform: translate(0, 0); } 100% { transform: translate(150px, 50px); } }
        `}</style>

        <div className="absolute top-1/2 left-1/2 size-[600px] -translate-x-1/2 -translate-y-1/2">
          <div className="absolute inset-0 rounded-full border border-slate-800/50" />
          <div className="absolute inset-[12.5%] rounded-full border border-slate-800/50" />
          <div className="absolute inset-[25%] rounded-full border border-slate-800/50" />
          <div className="absolute h-full w-px bg-slate-800/50" />
          <div className="absolute h-px w-full bg-slate-800/50" />
          <div
            className="absolute inset-0 z-10 size-full animate-[spin_4s_linear_infinite] rounded-full"
            style={{ background: "conic-gradient(from 0deg, transparent 70%, rgba(14, 165, 233, 0.2) 100%)" }}
          />
          <div className="absolute top-1/2 left-1/2 z-20 flex size-20 -translate-x-1/2 -translate-y-1/2 animate-pulse items-center justify-center rounded-full border border-orange-500/30 bg-orange-500/10 shadow-[0_0_30px_rgba(249,115,22,0.3)]">
            <Plane className="size-8 -rotate-45 text-orange-500" />
          </div>
          <div className="absolute top-[30%] left-[30%] z-30 flex items-center gap-2" style={{ animation: "fly-1 25s linear infinite alternate" }}>
            <Plane className="size-4 rotate-45 text-sky-400" />
            <span className="text-[10px] font-mono font-bold tracking-wider text-sky-300">SU-7155</span>
          </div>
          <div className="absolute top-[20%] right-[25%] z-30 flex items-center gap-2" style={{ animation: "fly-2 30s linear infinite alternate" }}>
            <Plane className="size-4 -rotate-12 text-emerald-400" />
            <span className="text-[10px] font-mono font-bold tracking-wider text-emerald-300">TST-G5</span>
          </div>
          <div className="absolute bottom-[35%] left-[20%] z-30 flex items-center gap-2" style={{ animation: "fly-3 35s linear infinite alternate" }}>
            <Plane className="size-4 -rotate-90 text-amber-400" />
            <span className="text-[10px] font-mono font-bold tracking-wider text-amber-300">AC-901</span>
          </div>
        </div>

        <div className="absolute bottom-12 left-12 z-40 flex max-w-md flex-col gap-4">

          <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight text-white">
            <br />
            <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent"> </span> 
          </h1>
          <p className="text-sm leading-relaxed text-slate-400">
            Plataforma unificada para operaciones Administrativas
          </p>
          <div className="flex flex-wrap gap-2">
            <div className="inline-flex items-center gap-2 rounded-lg border border-slate-700/50 bg-slate-900/80 px-3 py-2 text-[10px] text-slate-300 backdrop-blur-sm">
              <Satellite className="size-3 text-sky-400" />
              
            </div>
            <div className="inline-flex items-center gap-2 rounded-lg border border-slate-700/50 bg-slate-900/80 px-3 py-2 text-[10px] text-slate-300 backdrop-blur-sm">
              <Shield className="size-3 text-emerald-400" />
              TLS 1.3 Cifrado activo
            </div>
          </div>
        </div>
      </section>

      <section className="relative flex min-h-screen w-full items-center justify-center bg-slate-50 px-5 py-10 lg:w-1/2">
        <div className="relative mt-12 w-full max-w-sm">
          <div className="absolute -top-10 left-1/2 z-10 flex size-20 -translate-x-1/2 items-center justify-center rounded-full border-4 border-slate-50 bg-orange-600 text-white shadow-lg">
            <User className="size-9" strokeWidth={1.75} />
          </div>

          <div className="flex flex-col gap-5 rounded-[2rem] bg-white p-8 pt-14 text-center shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)]">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Acceso Operativo</h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <label className="block">
                <span className="sr-only">Usuario</span>
                <div className="relative">
                  <User className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    name="username"
                    value={credentials.username}
                    onChange={(event) => setCredentials((current) => ({ ...current, username: event.target.value }))}
                    autoComplete="username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    placeholder="Usuario"
                    required
                    className="w-full rounded-2xl border border-transparent bg-slate-100 px-4 py-3.5 pl-11 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-slate-200"
                  />
                </div>
              </label>
              <label className="block">
                <span className="sr-only">Contraseña</span>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type={isPasswordVisible ? "text" : "password"}
                    name="password"
                    value={credentials.password}
                    onChange={(event) => setCredentials((current) => ({ ...current, password: event.target.value }))}
                    autoComplete="current-password"
                    placeholder="Contraseña"
                    required
                    className="w-full rounded-2xl border border-transparent bg-slate-100 px-4 py-3.5 pl-11 pr-11 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-slate-200"
                  />
                  <button
                    type="button"
                    onClick={() => setIsPasswordVisible((visible) => !visible)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition-colors hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
                    aria-label={isPasswordVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {isPasswordVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </label>
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3.5 font-bold tracking-wide text-white shadow-md transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting && <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
                AUTENTICAR
              </button>
            </form>

            <p className="mt-4 text-[10px] font-medium uppercase tracking-wide text-slate-400">
              Sesión auditada · Acceso restringido
            </p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Login;
