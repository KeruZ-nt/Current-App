import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useWorkspaceStore } from '../store/workspaceStore';
import { Camera, Save, User, Mail, Phone, Shield, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ProfileSettings = () => {
  const { user, profile, setUser } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
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

  const { activeRole } = useWorkspaceStore();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user) {
      return;
    }
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}-${Math.random()}.${fileExt}`;

    setLoading(true);

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      alert('Error subiendo imagen: ' + uploadError.message);
      setLoading(false);
      return;
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    
    setFormData({ ...formData, avatar_url: data.publicUrl });
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: formData.full_name,
        phone: formData.phone,
        avatar_url: formData.avatar_url
      })
      .eq('id', user.id);

    if (error) {
      alert('Error guardando perfil: ' + error.message);
    } else {
      setShowSuccessModal(true);
      // Refetch user to update global state
      await setUser(user);
      setTimeout(() => setShowSuccessModal(false), 3000);
    }
    setLoading(false);
  };

  return (
    <>
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
          <div className="flex flex-col items-center gap-4 rounded-2xl border bg-card p-8 shadow-lg max-w-sm w-full text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Save className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">¡Perfil Actualizado!</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Tus cambios se han guardado correctamente.
              </p>
            </div>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="mt-4 w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Aceptar
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto relative p-4 sm:p-8 md:p-12 mt-4 sm:mt-8">
      <button 
        onClick={() => navigate(-1)}
        className="absolute right-0 top-0 p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
        title="Cerrar"
      >
        <X className="h-5 w-5" />
      </button>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mi Perfil</h1>
        <p className="text-muted-foreground">Gestiona tu información personal y foto de perfil.</p>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="p-6 border-b bg-muted/20">
          <div className="flex items-center gap-6">
            <div className="relative group cursor-pointer">
              <div className="relative h-24 w-24 rounded-full bg-secondary flex items-center justify-center overflow-hidden border-4 border-background shadow-sm transition-opacity group-hover:opacity-80">
                {formData.avatar_url ? (
                  <img src={formData.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-10 w-10 text-secondary-foreground" />
                )}
              </div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-6 w-6 text-primary drop-shadow-md" />
              </div>
              <input 
                type="file" 
                accept="image/*"
                onChange={handleFileChange} 
                disabled={loading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                title="Cambiar foto de perfil"
              />
            </div>
            <div>
              <h2 className="text-xl font-bold">{formData.full_name || profile?.email}</h2>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span className="capitalize">{activeRole ? (activeRole === 'admin' ? 'Administrador' : 'Colaborador') : 'Sin Almacén Activo'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" /> 
                  Nombre Completo
                </label>
                  <input 
                    type="text" 
                    value={formData.full_name} 
                    onChange={e => setFormData({...formData, full_name: e.target.value})} 
                    placeholder="Ej: Juan Pérez"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring" 
                  />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" /> 
                  Número de Celular
                </label>
                  <input 
                    type="tel" 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})} 
                    placeholder="+51 987 654 321"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring" 
                  />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" /> 
                Correo Electrónico
              </label>
              <input 
                type="email" 
                value={profile?.email || ''} 
                disabled
                className="flex h-10 w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-muted-foreground cursor-not-allowed" 
              />
              <p className="text-xs text-muted-foreground">El correo está vinculado a tu acceso y no se puede cambiar desde aquí.</p>
            </div>

            <div className="pt-4 flex justify-end">
              <button 
                type="submit" 
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? 'Guardando...' : <><Save className="h-4 w-4" /> Guardar Cambios</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    </>
  );
};
