import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { LayoutDashboard, Shield, ArrowRight, Eye, EyeOff, Wind, BarChart3, Users } from 'lucide-react';
import { LegalModals, type LegalModalType } from '../../components/auth/LegalModals';

export const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<LegalModalType>(null);
  const [awaitingCode, setAwaitingCode] = useState(false);
  const [code, setCode] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else if (data.session) {
      const checkAuth = setInterval(() => {
        if (useAuthStore.getState().user) {
          clearInterval(checkAuth);
          navigate('/welcome');
        }
      }, 100);
    } else {
      setAwaitingCode(true);
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'signup'
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/welcome');
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

      {/* Right Panel - Register Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8 sm:p-12 animate-in fade-in slide-in-from-right-8 duration-500">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col space-y-2 text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-2 mb-4 lg:hidden">
              <img src="/logo.svg" alt="Current Logo" className="h-14 w-14 object-contain" />
              <span className="text-2xl font-light tracking-[0.2em]">CURRENT</span>
            </div>
            <h2 className="text-3xl font-medium tracking-tight">Crear una cuenta</h2>
            <p className="text-muted-foreground font-light">
              Ingresa tus datos para empezar tu camino hacia la calma operativa
            </p>
          </div>

          {!awaitingCode ? (
            <form onSubmit={handleRegister} className="space-y-6">
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
                  <label className="text-sm font-medium leading-none" htmlFor="password">
                    Contraseña Segura
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="flex h-12 w-full rounded-xl border border-input bg-transparent px-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all pr-10"
                      placeholder="Mínimo 6 caracteres"
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
                {loading ? 'Procesando...' : <>Comenzar ahora <ArrowRight className="h-4 w-4" /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-6 animate-in fade-in zoom-in-95">
              {error && (
                <div className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive border border-destructive/20 font-medium">
                  {error}
                </div>
              )}
              
              <div className="space-y-4 text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Hemos enviado un código de 6 dígitos a <strong className="text-foreground">{email}</strong>.
                </p>
                
                <div className="space-y-2 text-left">
                  <label className="text-sm font-medium leading-none" htmlFor="code">
                    Código de Verificación
                  </label>
                  <input
                    id="code"
                    type="text"
                    required
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="flex h-12 w-full rounded-md border border-input bg-transparent px-3 py-2 text-center text-xl tracking-[0.5em] font-mono placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 uppercase"
                    placeholder="123456"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 disabled:pointer-events-none disabled:opacity-50 hover:shadow-lg hover:shadow-primary/20"
              >
                {loading ? 'Verificando...' : 'Verificar Código'}
              </button>
              <button
                type="button"
                onClick={() => setAwaitingCode(false)}
                className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-transparent px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50"
              >
                Volver
              </button>
            </form>
          )}

          <div className="text-center text-sm text-muted-foreground mt-8">
            ¿Ya tienes una cuenta?{' '}
            <Link to="/login" className="font-semibold text-primary hover:underline transition-all">
              Inicia sesión aquí
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
