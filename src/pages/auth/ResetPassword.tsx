import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { sanitizeError } from '../../lib/errors';
import { Loader2, KeyRound, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

export const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Check if we actually have an active session (user clicked email link)
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // If they just navigated here manually without a token, redirect to login
        navigate('/login');
      }
    };
    checkSession();
  }, [navigate]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    setError(null);

    const { error: updateError } = await supabase.auth.updateUser({
      password: password
    });

    setLoading(false);

    if (updateError) {
      setError(sanitizeError(updateError));
    } else {
      setSuccess(true);
      setTimeout(() => {
        navigate('/'); // Redirect to dashboard
      }, 3000);
    }
  };

  return (
    <div className="flex min-h-screen bg-background relative overflow-hidden">
      {/* Decorative gradient blur background */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/20 blur-[120px] rounded-full pointer-events-none" />

      {/* Left Panel - Hero/Brand (hidden on small screens) */}
      <div className="hidden lg:flex w-1/2 bg-black relative flex-col justify-between p-12 overflow-hidden border-r border-white/10">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
        
        <div className="relative z-20 flex items-center gap-3">
          <img src="/logo.svg" alt="Current Logo" className="h-10 w-10 object-contain invert brightness-0" />
          <span className="text-xl font-light tracking-[0.2em] text-white">CURRENT</span>
        </div>

        <div className="relative z-20 max-w-lg mb-20 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          <h1 className="text-4xl xl:text-5xl font-medium text-white leading-tight tracking-tight mb-6">
            Asegura tu cuenta<br />
            <span className="text-gray-400">Protege tu negocio</span>
          </h1>
          <p className="text-lg text-gray-400 font-light leading-relaxed">
            Crea una nueva contraseña segura para recuperar el acceso a tu plataforma de inventarios y seguir gestionando tus operaciones.
          </p>
        </div>
      </div>

      {/* Right Panel - Reset Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8 sm:p-12 animate-in fade-in slide-in-from-right-8 duration-500">
        <div className="w-full max-w-md space-y-8 relative z-10">
          <div className="flex flex-col space-y-2 text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-2 mb-4 lg:hidden">
              <img src="/logo.svg" alt="Current Logo" className="h-14 w-14 object-contain" />
              <span className="text-2xl font-light tracking-[0.2em]">CURRENT</span>
            </div>
            
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 mx-auto lg:mx-0 mb-2">
              <KeyRound className="h-6 w-6 text-indigo-500" />
            </div>

            <h2 className="text-3xl font-medium tracking-tight">Nueva Contraseña</h2>
            <p className="text-muted-foreground font-light">
              Ingresa tu nueva contraseña para recuperar el acceso.
            </p>
          </div>

          {success ? (
            <div className="rounded-2xl glass p-8 text-center animate-in zoom-in-95 duration-500 border border-emerald-500/20 bg-emerald-500/5">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500 mb-6">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-semibold mb-2">¡Contraseña Actualizada!</h3>
              <p className="text-muted-foreground mb-8">
                Tu contraseña ha sido cambiada exitosamente. Te estamos redirigiendo al almacén...
              </p>
              <Loader2 className="h-6 w-6 animate-spin text-emerald-500 mx-auto" />
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-6">
              {error && (
                <div className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive border border-destructive/20 font-medium">
                  {error}
                </div>
              )}
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none" htmlFor="password">
                    Nueva Contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="flex h-11 w-full rounded-xl border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all pr-10"
                      placeholder="Mínimo 6 caracteres"
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none" htmlFor="confirmPassword">
                    Confirmar Contraseña
                  </label>
                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="flex h-11 w-full rounded-xl border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                    placeholder="Repite tu nueva contraseña"
                    minLength={6}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center w-full rounded-xl bg-foreground px-4 py-3 text-sm font-semibold text-background hover:bg-foreground/90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none shadow-xl shadow-black/10"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  'Actualizar Contraseña'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
