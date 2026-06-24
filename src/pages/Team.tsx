import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { sanitizeError } from '../lib/errors';
import { useAuthStore } from '../store/authStore';
import { useWorkspaceStore } from '../store/workspaceStore';
import {
  ShieldAlert, User, Check, Trash2, ShieldCheck, Loader2,
  UserCheck, UserX, Clock, ChevronDown
} from 'lucide-react';
import type { AccessRequest } from '../types';

/**
 * Componente Team
 * Permite a los administradores visualizar y gestionar los miembros del almacén activo.
 * Funcionalidades: ver miembros, ver solicitudes pendientes, aceptar/rechazar con rol, cambiar roles y eliminar usuarios.
 */

export const Team = () => {
  const { profile } = useAuthStore();
  const { activeWorkspace, activeRole } = useWorkspaceStore();

  const [members, setMembers] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(false);
  // role selection per request id
  const [requestRoles, setRequestRoles] = useState<Record<string, 'admin' | 'collaborator'>>({});

  const fetchMembers = async () => {
    if (!activeWorkspace) return;
    setLoading(true);

    // Step 1: Get workspace members
    const { data: membersData, error: membersError } = await supabase
      .from('workspace_members')
      .select('*')
      .eq('workspace_id', activeWorkspace.id);

    if (membersError || !membersData) {
      console.error('Error fetching members:', membersError);
      setLoading(false);
      return;
    }

    if (membersData.length === 0) {
      setMembers([]);
      setLoading(false);
      return;
    }

    // Step 2: Get profiles separately (avoids FK join dependency)
    const userIds = membersData.map((m) => m.user_id);
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', userIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
    }

    // Step 3: Merge
    const merged = membersData.map((m) => ({
      ...m,
      profile: profilesData?.find((p) => p.id === m.user_id) ?? null,
    }));

    setMembers(merged);
    setLoading(false);
  };

  const fetchPendingRequests = async () => {
    if (!activeWorkspace) return;
    setRequestsLoading(true);

    const { data: requestsData, error } = await supabase
      .from('access_requests')
      .select('*')
      .eq('workspace_id', activeWorkspace.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error || !requestsData) {
      setRequestsLoading(false);
      return;
    }

    if (requestsData.length === 0) {
      setPendingRequests([]);
      setRequestsLoading(false);
      return;
    }

    // Fetch profiles for requesters
    const requesterIds = requestsData.map((r) => r.user_id);
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('*')
      .in('id', requesterIds);

    const merged = requestsData.map((r) => ({
      ...r,
      profile: profilesData?.find((p) => p.id === r.user_id) ?? null,
    }));

    setPendingRequests(merged as AccessRequest[]);

    // Initialize default roles
    const defaultRoles: Record<string, 'admin' | 'collaborator'> = {};
    requestsData.forEach((r) => { defaultRoles[r.id] = 'collaborator'; });
    setRequestRoles((prev) => ({ ...defaultRoles, ...prev }));

    setRequestsLoading(false);
  };

  useEffect(() => {
    if (activeWorkspace) {
      fetchMembers();
      if (activeRole === 'admin') fetchPendingRequests();
    }
  }, [activeWorkspace]);

  /**
   * Acepta una solicitud: inserta en workspace_members y notifica al usuario.
   */
  const handleAcceptRequest = async (request: AccessRequest) => {
    const role = requestRoles[request.id] ?? 'collaborator';

    // Insert as member
    const { error: memberError } = await supabase
      .from('workspace_members')
      .insert({ workspace_id: request.workspace_id, user_id: request.user_id, role });

    if (memberError) {
      alert(sanitizeError(memberError));
      return;
    }

    // Update request status
    await supabase
      .from('access_requests')
      .update({ status: 'accepted' })
      .eq('id', request.id);

    // Notify the user
    const workspaceName = activeWorkspace?.name ?? 'el almacén';
    const rolLabel = role === 'admin' ? 'Administrador' : 'Colaborador';
    await supabase.from('notifications').insert({
      user_id: request.user_id,
      type: 'access_accepted',
      title: '¡Acceso aprobado! 🎉',
      message: `Tu solicitud para unirte a "${workspaceName}" fue aceptada. Tu rol es: ${rolLabel}.`,
      data: { workspace_id: request.workspace_id, workspace_name: workspaceName, role },
      read: false,
    });

    // Refresh
    await Promise.all([fetchMembers(), fetchPendingRequests()]);
  };

  /**
   * Rechaza una solicitud y notifica al usuario.
   */
  const handleRejectRequest = async (request: AccessRequest) => {
    await supabase
      .from('access_requests')
      .update({ status: 'rejected' })
      .eq('id', request.id);

    const workspaceName = activeWorkspace?.name ?? 'el almacén';
    await supabase.from('notifications').insert({
      user_id: request.user_id,
      type: 'access_rejected',
      title: 'Solicitud rechazada',
      message: `Tu solicitud para unirte a "${workspaceName}" fue rechazada por el administrador.`,
      data: { workspace_id: request.workspace_id, workspace_name: workspaceName },
      read: false,
    });

    setPendingRequests((prev) => prev.filter((r) => r.id !== request.id));
  };

  /**
   * Actualiza el rol de un miembro específico (admin o colaborador).
   */
  const handleUpdateRole = async (memberId: string, newRole: 'admin' | 'collaborator') => {
    if (activeRole !== 'admin') return;

    // Optimistic UI
    setMembers(members.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)));

    const { error } = await supabase
      .from('workspace_members')
      .update({ role: newRole })
      .eq('id', memberId);

    if (error) {
      alert(sanitizeError(error));
      fetchMembers(); // rollback
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (activeRole !== 'admin') return;

    const confirmed = window.confirm('¿Seguro que deseas eliminar a este usuario del almacén?');
    if (!confirmed) return;

    const { error } = await supabase
      .from('workspace_members')
      .delete()
      .eq('id', memberId);

    if (error) {
      alert(sanitizeError(error));
    } else {
      setMembers(members.filter((m) => m.id !== memberId));
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

      {/* Pending Requests Section */}
      {(requestsLoading || pendingRequests.length > 0) && (
        <div className="rounded-2xl glass overflow-hidden shadow-xl border border-amber-500/20">
          <div className="flex items-center gap-2 px-5 py-3.5 bg-amber-500/5 border-b border-amber-500/10">
            <Clock className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-semibold text-amber-600">
              Solicitudes de Acceso Pendientes
            </span>
            <span className="ml-auto rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-bold text-amber-600">
              {pendingRequests.length}
            </span>
          </div>

          {requestsLoading ? (
            <div className="flex items-center justify-center gap-2 p-8 text-muted-foreground animate-pulse">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Cargando solicitudes...</span>
            </div>
          ) : (
            <div className="divide-y divide-black/5">
              {pendingRequests.map((req) => (
                <div key={req.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 hover:bg-black/[0.02] transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-black/5 overflow-hidden shrink-0">
                      {(req as any).profile?.avatar_url ? (
                        <img src={(req as any).profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {(req as any).profile?.full_name || (req as any).profile?.email || req.user_id}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{(req as any).profile?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Role selector */}
                    <div className="relative">
                      <select
                        value={requestRoles[req.id] ?? 'collaborator'}
                        onChange={(e) =>
                          setRequestRoles((prev) => ({
                            ...prev,
                            [req.id]: e.target.value as 'admin' | 'collaborator',
                          }))
                        }
                        className="appearance-none h-9 rounded-xl border border-black/10 bg-background/80 pl-3 pr-7 text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all cursor-pointer"
                      >
                        <option value="collaborator">Colaborador</option>
                        <option value="admin">Administrador</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    </div>

                    {/* Accept */}
                    <button
                      onClick={() => handleAcceptRequest(req)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-500/20 transition-colors border border-emerald-500/20"
                      title="Aceptar solicitud"
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                      Aceptar
                    </button>

                    {/* Reject */}
                    <button
                      onClick={() => handleRejectRequest(req)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-500/20 transition-colors border border-red-500/20"
                      title="Rechazar solicitud"
                    >
                      <UserX className="h-3.5 w-3.5" />
                      Rechazar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Members Table */}
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
                          <p className="text-foreground">{m.profile?.full_name || m.profile?.email || m.user_id}</p>
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

