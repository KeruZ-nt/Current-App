import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { LayoutDashboard, Shield, ArrowRight, Eye, EyeOff, Wind, BarChart3, Users } from 'lucide-react';

import { useAuthStore } from '../../store/authStore';
import { LegalModals, type LegalModalType } from '../../components/auth/LegalModals';

export const Login = () => {
  const { user } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<LegalModalType>(null);
  const navigate = useNavigate();

  // Forgot password
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/workspaces');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setForgotLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setForgotSent(true);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left Panel - Info (Hidden on small screens) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center relative overflow-hidden bg-slate-950 text-white p-12 lg:p-20">
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-slate-900 to-slate-950" />
        
        <div className="absolute top-8 left-8 z-20 flex items-center gap-3">
          <img src="/logo.svg" alt="Current Logo" className="h-10 w-10 object-contain drop-shadow-md" />
          <span className="text-xl font-light tracking-[0.2em] text-white drop-shadow-md">CURRENT</span>
        </div>

        <div className="relative z-10 w-full max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 flex flex-col h-full justify-center">
          <h1 className="text-3xl lg:text-4xl font-light leading-tight mb-4">
            Fluye con tu negocio.<br/><span className="font-semibold text-primary/80">Sin fricciones.</span>
          </h1>
          <p className="text-base lg:text-lg text-gray-300 mb-8 font-light">
            Current aporta calma al caos operativo. Unifica tu inventario, equipo y finanzas en un espacio de trabajo diseñado para la máxima tranquilidad y eficiencia.
          </p>
          
          <div className="space-y-3">
            <div className="flex items-center gap-4 bg-black/[0.03] p-3 rounded-2xl backdrop-blur-md border border-black/5 transition-all hover:bg-black/10">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-300">
                <Wind className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium text-white text-sm">Eficiencia Silenciosa</h3>
                <p className="text-xs text-gray-400 font-light mt-0.5">Automatiza procesos y gestiona todo en tiempo real con total fluidez.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 bg-black/[0.03] p-3 rounded-2xl backdrop-blur-md border border-black/5 transition-all hover:bg-black/10">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-500/10 text-purple-300">
                <LayoutDashboard className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium text-white text-sm">Control Centralizado</h3>
                <p className="text-xs text-gray-400 font-light mt-0.5">Supervisa infinitos puntos de venta desde la comodidad de una sola pantalla.</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-black/[0.03] p-3 rounded-2xl backdrop-blur-md border border-black/5 transition-all hover:bg-black/10">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-500/10 text-teal-300">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium text-white text-sm">Bienestar y Seguridad</h3>
                <p className="text-xs text-gray-400 font-light mt-0.5">Tus datos protegidos con infraestructura de grado empresarial para que duermas tranquilo.</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-black/[0.03] p-3 rounded-2xl backdrop-blur-md border border-black/5 transition-all hover:bg-black/10">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-300">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium text-white text-sm">Decisiones Inteligentes</h3>
                <p className="text-xs text-gray-400 font-light mt-0.5">Analíticas detalladas e informes automáticos para hacer crecer tu negocio rápidamente.</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-black/[0.03] p-3 rounded-2xl backdrop-blur-md border border-black/5 transition-all hover:bg-black/10">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-300">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium text-white text-sm">Trabajo en Equipo</h3>
                <p className="text-xs text-gray-400 font-light mt-0.5">Gestión de roles, permisos y colaboración de tu personal sincronizada al instante.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8 sm:p-12 animate-in fade-in slide-in-from-right-8 duration-500">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col space-y-2 text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-2 mb-4 lg:hidden">
              <img src="/logo.svg" alt="Current Logo" className="h-14 w-14 object-contain" />
              <span className="text-2xl font-light tracking-[0.2em]">CURRENT</span>
            </div>
            <h2 className="text-3xl font-medium tracking-tight">Bienvenido de nuevo</h2>
            <p className="text-muted-foreground font-light">
              Ingresa a tu espacio de tranquilidad operativa.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive border border-destructive/20 font-medium">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="email">
                  Correo Electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex h-12 w-full rounded-xl border border-input bg-transparent px-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all"
                  placeholder="admin@empresa.com"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium leading-none" htmlFor="password">
                    Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={() => { setForgotMode(true); setError(null); setForgotSent(false); setForgotEmail(email); }}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="flex h-12 w-full rounded-xl border border-input bg-transparent px-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 disabled:pointer-events-none disabled:opacity-50 hover:shadow-lg hover:shadow-primary/20"
            >
              {loading ? 'Iniciando sesión...' : <>Ingresar a Current <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          {/* Forgot Password Modal */}
          {forgotMode && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setForgotMode(false)} />
              <div className="relative w-full max-w-sm bg-card rounded-2xl shadow-2xl border border-border p-8 animate-in zoom-in-95 duration-200">
                {forgotSent ? (
                  <div className="text-center space-y-4">
                    <div className="h-14 w-14 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                      <ArrowRight className="h-7 w-7" />
                    </div>
                    <h3 className="text-lg font-bold">Revisa tu correo</h3>
                    <p className="text-sm text-muted-foreground">Enviamos un enlace de recuperación a <strong className="text-foreground">{forgotEmail}</strong>. Revisa tu bandeja de entrada (y spam).</p>
                    <button onClick={() => setForgotMode(false)} className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">Cerrar</button>
                  </div>
                ) : (
                  <>
                    <h3 className="text-lg font-bold mb-1">Recuperar contraseña</h3>
                    <p className="text-sm text-muted-foreground mb-6">Ingresa tu correo y te enviaremos un enlace para resetear tu contraseña.</p>
                    {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2 mb-4">{error}</p>}
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="tu@correo.com"
                        className="flex h-12 w-full rounded-xl border border-input bg-transparent px-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all"
                      />
                      <button
                        type="submit"
                        disabled={forgotLoading}
                        className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                      >
                        {forgotLoading ? 'Enviando...' : 'Enviar enlace'}
                      </button>
                      <button type="button" onClick={() => setForgotMode(false)} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors">Cancelar</button>
                    </form>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="text-center text-sm text-muted-foreground mt-8">
            ¿Aún no tienes una cuenta?{' '}
            <Link to="/register" className="font-semibold text-primary hover:underline transition-all">
              Regístrate ahora
            </Link>
          </div>


          
          <div className="mt-8 flex justify-center gap-6 text-xs text-muted-foreground font-light">
            <button type="button" onClick={() => setActiveModal('privacy')} className="hover:text-primary transition-colors">Privacidad</button>
            <button type="button" onClick={() => setActiveModal('terms')} className="hover:text-primary transition-colors">Términos</button>
          </div>
        </div>
      </div>

      <LegalModals activeModal={activeModal} onClose={() => setActiveModal(null)} />
    </div>
  );
};
