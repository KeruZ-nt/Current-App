import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { sanitizeError } from '../../lib/errors';
import { useAuthStore } from '../../store/authStore';
import { Camera, User, ArrowRight } from 'lucide-react';

export const WelcomeProfile = () => {
  const { user, setUser } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    avatar_url: ''
  });

  // Ya no usamos useEffect para auto-redirigir. 
  // ProtectedRoute se encarga de verificar si el usuario tiene nombre o no.

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
      alert(sanitizeError(uploadError));
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
      alert(sanitizeError(error));
      setLoading(false);
    } else {
      await setUser(user);
      navigate('/workspaces');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-xl space-y-8 animate-in fade-in duration-500">
        
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
            <User className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">¡Cuenta verificada con éxito!</h1>
          <p className="text-muted-foreground">Antes de empezar, completemos la información de tu perfil.</p>
        </div>

        <div className="rounded-2xl border bg-card p-8 shadow-sm">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="flex flex-col items-center justify-center space-y-4 mb-8">
              <div className="relative h-28 w-28 rounded-full bg-secondary flex items-center justify-center overflow-hidden border-4 border-background shadow-sm">
                {formData.avatar_url ? (
                  <img src={formData.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-12 w-12 text-secondary-foreground" />
                )}
              </div>
              <div className="relative">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileChange} 
                  disabled={loading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  title="Subir foto"
                />
                <button type="button" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                  <Camera className="h-4 w-4" />
                  Subir Foto de Perfil
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre Completo</label>
                <input 
                  type="text" 
                  required
                  value={formData.full_name} 
                  onChange={e => setFormData({...formData, full_name: e.target.value})} 
                  placeholder="Ej: Juan Pérez"
                  className="flex h-12 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:ring-2 focus:ring-ring" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Número de Celular (Opcional)</label>
                <input 
                  type="tel" 
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})} 
                  placeholder="+51 987 654 321"
                  className="flex h-12 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:ring-2 focus:ring-ring" 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading || !formData.full_name}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : <>Continuar <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
