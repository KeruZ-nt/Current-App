import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useWorkspaceStore } from '../store/workspaceStore';
import { ShieldAlert, User, Check, Trash2, ShieldCheck, Loader2 } from 'lucide-react';

/**
 * Componente Team
 * Permite a los administradores visualizar y gestionar los miembros del almacén activo.
 * Funcionalidades: ver miembros, invitar mediante código, cambiar roles y eliminar usuarios.
 */

export const Team = () => {
  const { profile } = useAuthStore();
  const { activeWorkspace, activeRole } = useWorkspaceStore();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    /**
     * Obtiene la lista de miembros del almacén activo desde Supabase,
     * incluyendo el perfil asociado a cada usuario.
     */
    const fetchMembers = async () => {
      if (!activeWorkspace) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('workspace_members')
        .select('*, profile:profiles(*)')
        .eq('workspace_id', activeWorkspace.id)
        .order('joined_at', { ascending: false });
        
      if (!error && data) {
        setMembers(data);
      }
      setLoading(false);
    };

    if (activeWorkspace) {
      fetchMembers();
    }
  }, [activeWorkspace]);

  /**
   * Refresca manualmente la tabla (por ejemplo después de un update/delete fallido).
   */
  const refreshMembers = async () => {
    if (!activeWorkspace) return;
    const { data, error } = await supabase
      .from('workspace_members')
      .select('*, profile:profiles(*)')
      .eq('workspace_id', activeWorkspace.id)
      .order('joined_at', { ascending: false });
      
    if (!error && data) {
      setMembers(data);
    }
  };

  /**
   * Actualiza el rol de un miembro específico (admin o colaborador).
   * Solo los administradores pueden ejecutar esta acción.
   * Utiliza UI optimista (actualiza estado local antes de BD).
   * 
   * @param memberId ID del registro en workspace_members
   * @param newRole El nuevo rol a asignar
   */
  const handleUpdateRole = async (memberId: string, newRole: 'admin' | 'collaborator') => {
    if (activeRole !== 'admin') return;
    
    // Optimistic UI
    setMembers(members.map(m => m.id === memberId ? { ...m, role: newRole } : m));
    
    const { error } = await supabase
      .from('workspace_members')
      .update({ role: newRole })
      .eq('id', memberId);
      
    if (error) {
      alert('Error actualizando rol: ' + error.message);
      refreshMembers(); // rollback
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (activeRole !== 'admin') return;
    
    const confirm = window.confirm("¿Seguro que deseas eliminar a este usuario del almacén?");
    if (!confirm) return;

    const { error } = await supabase
      .from('workspace_members')
      .delete()
      .eq('id', memberId);

    if (error) {
      alert('Error eliminando miembro: ' + error.message);
    } else {
      setMembers(members.filter(m => m.id !== memberId));
    }
  };

  if (activeRole !== 'admin') {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center text-center">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold">Acceso Denegado</h1>
        <p className="text-muted-foreground mt-2 max-w-md">Solo los administradores pueden ver y gestionar los roles del equipo.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Equipo y Colaboradores</h1>
          <p className="text-muted-foreground">Gestiona los accesos y roles de tu personal.</p>
        </div>
        
        {activeWorkspace?.invite_code && (
          <div className="flex items-center gap-2 rounded-2xl glass p-2 shadow-xl border border-black/10">
            <div className="flex flex-col px-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Código de Invitación</span>
              <span className="font-mono text-lg font-bold tracking-widest text-indigo-400">{activeWorkspace.invite_code}</span>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(activeWorkspace.invite_code);
                alert('¡Código copiado al portapapeles!');
              }}
              className="flex h-10 items-center justify-center rounded-xl bg-indigo-500/10 px-4 text-sm font-medium text-indigo-400 hover:bg-indigo-500/20 transition-colors"
            >
              Copiar
            </button>
          </div>
        )}
      </div>

      <div className="rounded-2xl glass overflow-hidden shadow-2xl relative">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm min-w-[700px]">
            <thead className="[&_tr]:border-b border-black/5 bg-black/[0.02]">
              <tr className="border-b border-black/5 transition-colors hover:bg-black/5 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Usuario (Email)</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Rol Actual</th>
                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Acciones (Administrar)</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {loading ? (
                <tr>
                  <td colSpan={3} className="p-12 text-center text-muted-foreground animate-pulse">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <p>Cargando equipo...</p>
                    </div>
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-muted-foreground">No hay miembros en este almacén.</td>
                </tr>
              ) : (
                members.map((m) => (
                  <tr key={m.id} className="border-b border-black/5 transition-colors hover:bg-black/[0.03]">
                    <td className="p-4 align-middle font-medium">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-black/5 overflow-hidden">
                          {m.profile?.avatar_url ? (
                            <img src={m.profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                          ) : (
                            <User className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="text-foreground">{m.profile?.full_name || m.profile?.email}</p>
                          <p className="text-xs text-muted-foreground">{m.profile?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      {m.role === 'admin' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-xs font-semibold text-indigo-400 border border-indigo-500/10">
                          <ShieldCheck className="h-3 w-3" /> Admin
                        </span>
                      )}
                      {m.role === 'collaborator' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/10">
                          <Check className="h-3 w-3" /> Colaborador
                        </span>
                      )}
                    </td>
                    <td className="p-4 align-middle text-right">
                      {m.user_id !== profile?.id ? (
                        <div className="flex justify-end gap-2">
                          <select 
                            value={m.role} 
                            onChange={(e) => handleUpdateRole(m.id, e.target.value as any)}
                            className="h-9 rounded-xl border border-black/10 bg-background/80 px-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                          >
                            <option value="admin">Administrador</option>
                            <option value="collaborator">Colaborador</option>
                          </select>
                          <button
                            onClick={() => handleDeleteMember(m.id)}
                            className="inline-flex items-center rounded-xl p-2 text-destructive hover:bg-destructive/20 transition-colors"
                            title="Eliminar miembro del almacén"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">Tú (Actual)</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
