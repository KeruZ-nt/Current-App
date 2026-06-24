import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { sanitizeError } from '../lib/errors';
import { useAuthStore } from '../store/authStore';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useToastStore } from '../store/toastStore';
import { Camera, Save, User, Mail, Phone, Shield, X, Trash2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DELETE_REASONS = [
  'Ya no uso la aplicacion',
  'Prefiero otra herramienta',
  'Tengo problemas tecnicos',
  'Privacidad / datos personales',
  'Cuenta duplicada',
  'Otro motivo',
];

export const ProfileSettings = () => {
  const { user, profile, setUser } = useAuthStore();
  const { clearWorkspaces, activeRole } = useWorkspaceStore();
  const navigate = useNavigate();
  const { addToast } = useToastStore();
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState(DELETE_REASONS[0]);
  const [deleteCustomReason, setDeleteCustomReason] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    avatar_url: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        avatar_url: profile.avatar_url || ''
      });
    }
  }, [profile]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user) return;
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}-${Math.random()}.${fileExt}`;
    setLoading(true);
    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
    if (uploadError) { alert(sanitizeError(uploadError)); setLoading(false); return; }
    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    setFormData({ ...formData, avatar_url: data.publicUrl });
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from('profiles').update({ full_name: formData.full_name, phone: formData.phone, avatar_url: formData.avatar_url }).eq('id', user.id);
    if (error) { alert(sanitizeError(error)); }
    else { await setUser(user); addToast({ type: 'success', message: 'Perfil actualizado correctamente.' }); }
    setLoading(false);
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleteLoading(true);
    setDeleteError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: deletePassword,
    });
    if (authError) {
      setDeleteError('Contraseña incorrecta. Intenta de nuevo.');
      setDeleteLoading(false);
      return;
    }

    const finalReason = deleteReason === 'Otro motivo' && deleteCustomReason.trim() ? deleteCustomReason.trim() : deleteReason;
    await supabase.from('profiles').update({ deletion_reason: finalReason }).eq('id', user.id);
    await supabase.auth.signOut();
    clearWorkspaces();
    navigate('/login');
  };

  return (
    <>
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in zoom-in duration-200 p-4">
          <div className="flex flex-col gap-5 rounded-2xl border border-red-500/20 bg-card p-6 shadow-2xl max-w-md w-full">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-500"><AlertTriangle className="h-6 w-6" /></div>
              <div>
                <h3 className="text-lg font-bold">Eliminar Cuenta</h3>
                <p className="text-sm text-muted-foreground mt-1">Esta accion es <span className="font-semibold text-red-500">permanente e irreversible</span>. Se eliminaran todos tus datos.</p>
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium">Por que deseas eliminar tu cuenta?</label>
              <select value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)} className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500/50 transition-all" id="delete-reason-select">
                {DELETE_REASONS.map((r) => (<option key={r} value={r}>{r}</option>))}
              </select>
              {deleteReason === 'Otro motivo' && (
                <textarea value={deleteCustomReason} onChange={(e) => setDeleteCustomReason(e.target.value)} placeholder="Cuentanos mas (opcional)..." rows={3} className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none outline-none focus:ring-2 focus:ring-red-500/50 transition-all" id="delete-custom-reason" />
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Confirma tu contraseña para eliminar</label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Tu contraseña actual"
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500/50 transition-all"
              />
            </div>
            {deleteError && (<p className="text-sm text-red-500 bg-red-500/10 rounded-lg px-3 py-2">{deleteError}</p>)}
            <div className="flex gap-3 pt-1">
              <button onClick={() => { setShowDeleteModal(false); setDeleteError(null); }} disabled={deleteLoading} className="flex-1 rounded-xl border border-black/10 bg-background px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50">Cancelar</button>
              <button onClick={handleDeleteAccount} disabled={deleteLoading || !deletePassword} className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2" id="confirm-delete-account-btn">
                {deleteLoading ? <>Eliminando...</> : <><Trash2 className="h-4 w-4" /> Eliminar mi cuenta</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto relative p-4 sm:p-8 md:p-12 mt-4 sm:mt-8">
        <button onClick={() => navigate(-1)} className="absolute right-0 top-0 p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors" title="Cerrar"><X className="h-5 w-5" /></button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mi Perfil</h1>
          <p className="text-muted-foreground">Gestiona tu informacion personal y foto de perfil.</p>
        </div>
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="p-6 border-b bg-muted/20">
            <div className="flex items-center gap-6">
              <div className="relative group cursor-pointer">
                <div className="relative h-24 w-24 rounded-full bg-secondary flex items-center justify-center overflow-hidden border-4 border-background shadow-sm transition-opacity group-hover:opacity-80">
                  {formData.avatar_url ? (<img src={formData.avatar_url} alt="Avatar" className="h-full w-full object-cover" />) : (<User className="h-10 w-10 text-secondary-foreground" />)}
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="h-6 w-6 text-primary drop-shadow-md" /></div>
                <input type="file" accept="image/*" onChange={handleFileChange} disabled={loading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" title="Cambiar foto de perfil" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{formData.full_name || profile?.email}</h2>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  <span className="capitalize">{activeRole ? (activeRole === 'admin' ? 'Administrador' : 'Colaborador') : 'Sin Almacen Activo'}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="p-6">
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /> Nombre Completo</label>
                  <input type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} placeholder="Ej: Juan Perez" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> Numero de Celular</label>
                  <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+51 987 654 321" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> Correo Electronico</label>
                <input type="email" value={profile?.email || ''} disabled className="flex h-10 w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-muted-foreground cursor-not-allowed" />
                <p className="text-xs text-muted-foreground">El correo esta vinculado a tu acceso y no se puede cambiar desde aqui.</p>
              </div>
              <div className="pt-4 flex justify-end">
                <button type="submit" disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
                  {loading ? 'Guardando...' : <><Save className="h-4 w-4" /> Guardar Cambios</>}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="rounded-xl border border-red-500/20 bg-red-500/5 overflow-hidden">
          <div className="px-6 py-4 border-b border-red-500/10">
            <h3 className="text-sm font-semibold text-red-500 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Zona de Peligro</h3>
          </div>
          <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Eliminar cuenta permanentemente</p>
              <p className="text-xs text-muted-foreground mt-0.5">Todos tus datos, accesos y configuraciones seran eliminados sin posibilidad de recuperacion.</p>
            </div>
            <button onClick={() => setShowDeleteModal(true)} id="delete-account-btn" className="shrink-0 inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-500/20 transition-colors">
              <Trash2 className="h-4 w-4" /> Eliminar Cuenta
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
