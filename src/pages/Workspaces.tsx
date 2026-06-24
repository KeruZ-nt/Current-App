import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { sanitizeError } from '../lib/errors';
import { useAuthStore } from '../store/authStore';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useToastStore } from '../store/toastStore';
import { Building2, Plus, Users, ArrowRight, Loader2, Pencil, Trash2, LogOut, AlertTriangle } from 'lucide-react';

export const Workspaces = () => {
  const { user, profile } = useAuthStore();
  const { workspaces, setActiveWorkspace, fetchWorkspaces } = useWorkspaceStore();
  const navigate = useNavigate();
  const { addToast } = useToastStore();

  const [loading, setLoading] = useState(true);
  const [createMode, setCreateMode] = useState(false);
  const [joinMode, setJoinMode] = useState(false);
  const [showAddOptions, setShowAddOptions] = useState(false);
  
  // Create form
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  // Join form
  const [inviteCode, setInviteCode] = useState('');

  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit form
  const [editingWorkspaceId, setEditingWorkspaceId] = useState<string | null>(null);
  const [editingWorkspaceName, setEditingWorkspaceName] = useState('');

  // Confirm modal
  const [confirmModal, setConfirmModal] = useState<{
    type: 'leave' | 'delete';
    workspaceId: string;
    workspaceName: string;
  } | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowAddOptions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (user) {
        await fetchWorkspaces(user.id, true);
        setLoading(false);
      }
    };

    if (user) {
      loadData();
    }
  }, [user, fetchWorkspaces]);

  const refreshData = async () => {
    if (user) {
      await fetchWorkspaces(user.id, true);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setActionLoading(true);
    setError(null);

    const generatedCode = 'CRNT-' + crypto.randomUUID().split('-')[0].toUpperCase();

    const { data: newWs, error: createError } = await supabase
      .from('workspaces')
      .insert({
        name: newWorkspaceName,
        invite_code: generatedCode,
        created_by: user.id
      })
      .select()
      .single();

    if (createError) {
      setError(sanitizeError(createError));
      setActionLoading(false);
      return;
    }

    const { error: memberError } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: newWs.id,
        user_id: user.id,
        role: 'admin'
      });

    if (memberError) {
      setError(sanitizeError(memberError));
    } else {
      await refreshData();
      setCreateMode(false);
      setNewWorkspaceName('');
    }
    setActionLoading(false);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setActionLoading(true);
    setError(null);

    // 1. Find workspace by code
    const { data: wsData, error: wsError } = await supabase
      .from('workspaces')
      .select('id, name')
      .eq('invite_code', inviteCode.trim().toUpperCase())
      .single();

    if (wsError || !wsData) {
      setError('Código de invitación inválido o no existe.');
      setActionLoading(false);
      return;
    }

    // 2. Check if already a member
    const { data: existingMember } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', wsData.id)
      .eq('user_id', user.id)
      .single();

    if (existingMember) {
      setError('Ya eres miembro de este almacén.');
      setActionLoading(false);
      return;
    }

    // 3. Check if already has a pending request
    const { data: existingRequest } = await supabase
      .from('access_requests')
      .select('id, status')
      .eq('workspace_id', wsData.id)
      .eq('user_id', user.id)
      .single();

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        setError('Ya tienes una solicitud pendiente para este almacén. Espera la aprobación del administrador.');
      } else if (existingRequest.status === 'rejected') {
        setError('Tu solicitud fue rechazada. Contacta al administrador del almacén.');
      }
      setActionLoading(false);
      return;
    }

    // 4. Create access request
    const { error: reqError } = await supabase
      .from('access_requests')
      .insert({ workspace_id: wsData.id, user_id: user.id, status: 'pending' });

    if (reqError) {
      setError(reqError.message);
      setActionLoading(false);
      return;
    }

    // 5. Notify workspace admins
    const { data: admins } = await supabase
      .from('workspace_members')
      .select('user_id')
      .eq('workspace_id', wsData.id)
      .eq('role', 'admin');

    if (admins && admins.length > 0) {
      const userName = profile?.full_name || profile?.email || user.email || 'Un usuario';
      const notifications = admins.map((admin) => ({
        user_id: admin.user_id,
        type: 'access_request',
        title: 'Nueva solicitud de acceso',
        message: `${userName} quiere unirse al almacén "${wsData.name}".`,
        data: { workspace_id: wsData.id, workspace_name: wsData.name, requester_id: user.id },
        read: false,
      }));
      await supabase.from('notifications').insert(notifications);
    }

    setJoinMode(false);
    setInviteCode('');
    setError(null);
    addToast({ type: 'success', message: 'Solicitud enviada. El administrador revisará tu acceso y recibirás una notificación con el resultado.' });
    setActionLoading(false);
  };


  const handleSelectWorkspace = (workspace: any) => {
    // Si estamos editando, no queremos que el click seleccione el almacén
    if (editingWorkspaceId === workspace.id) return;
    setActiveWorkspace(workspace);
    navigate('/');
  };

  const handleDeleteWorkspace = async (e: React.MouseEvent, workspaceId: string, workspaceName: string) => {
    e.stopPropagation();
    setConfirmModal({ type: 'delete', workspaceId, workspaceName });
  };

  const handleLeaveWorkspace = async (e: React.MouseEvent, workspaceId: string, workspaceName: string) => {
    e.stopPropagation();
    setConfirmModal({ type: 'leave', workspaceId, workspaceName });
  };

  const executeConfirm = async (type: 'leave' | 'delete', workspaceId: string) => {
    if (!user) return;
    setActionLoading(true);
    setError(null);

    const { error } = type === 'delete'
      ? await supabase.from('workspaces').delete().eq('id', workspaceId)
      : await supabase.from('workspace_members').delete().eq('workspace_id', workspaceId).eq('user_id', user.id);

    if (error) {
      setError(sanitizeError(error));
      setActionLoading(false);
    } else {
      setConfirmModal(null);
      setActionLoading(false);
      await refreshData();
    }
  };

  const handleStartEdit = (e: React.MouseEvent, workspace: any) => {
    e.stopPropagation();
    setEditingWorkspaceId(workspace.id);
    setEditingWorkspaceName(workspace.name);
  };

  const handleSaveEdit = async (e: React.FormEvent, workspaceId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    setActionLoading(true);
    const { error } = await supabase
      .from('workspaces')
      .update({ name: editingWorkspaceName })
      .eq('id', workspaceId);
      
    if (error) {
      setError(sanitizeError(error));
    } else {
      await refreshData();
      setEditingWorkspaceId(null);
    }
    setActionLoading(false);
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 w-full flex-col items-center justify-center bg-muted/30 py-8 px-4">
      <div className="w-full max-w-xl flex flex-col gap-6" style={{ maxHeight: 'calc(100dvh - 4rem)' }}>
        
        <div className="flex flex-col items-center text-center shrink-0 animate-in slide-in-from-top-4 fade-in duration-500">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600 mb-4 shadow-sm border border-sky-500/20">
            <Building2 className="h-8 w-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight px-4">Bienvenido, {profile?.full_name || profile?.email || user?.email}</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">Selecciona un almacén para continuar o crea uno nuevo.</p>
        </div>

        {error && (
          <div className="rounded-lg bg-destructive/15 p-4 text-sm text-destructive text-center font-medium shrink-0 shadow-sm border border-destructive/20 animate-in fade-in">
            {error}
          </div>
        )}

        {createMode ? (
          <div className="rounded-2xl glass p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-300 shrink-0 max-w-md w-full mx-auto relative overflow-hidden">
            <div className="absolute top-0 left-0 h-full w-1 bg-gradient-to-b from-sky-400 to-blue-500"></div>
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-sky-500/10 blur-3xl"></div>
            <h3 className="text-lg font-bold mb-4 relative z-10">Crear Nuevo Almacén</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre del Almacén</label>
                <input
                  type="text"
                  required
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  placeholder="Ej: Tienda Principal"
                  className="flex h-10 w-full rounded-xl border border-black/10 bg-background/80 px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500/50 transition-all outline-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateMode(false)}
                  className="flex-1 rounded-xl border border-black/10 bg-background/80 px-4 py-2 text-sm font-medium hover:bg-black/5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 px-4 py-2 text-sm font-medium text-white hover:from-sky-400 hover:to-blue-400 transition-all hover:shadow-lg hover:shadow-sky-500/25 disabled:opacity-50"
                >
                  {actionLoading ? 'Creando...' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        ) : joinMode ? (
          <div className="rounded-2xl glass p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-300 shrink-0 max-w-md w-full mx-auto relative overflow-hidden">
            <div className="absolute top-0 left-0 h-full w-1 bg-gradient-to-b from-blue-400 to-cyan-500"></div>
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl"></div>
            <h3 className="text-lg font-bold mb-4 relative z-10">Unirse a un Almacén</h3>
            <form onSubmit={handleJoin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Código de Invitación</label>
                <input
                  type="text"
                  required
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Ej: CRNT-ABC123"
                  className="flex h-10 w-full rounded-xl border border-black/10 bg-background/80 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/50 uppercase transition-all outline-none font-tech"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setJoinMode(false)}
                  className="flex-1 rounded-xl border border-black/10 bg-background/80 px-4 py-2 text-sm font-medium hover:bg-black/5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2 text-sm font-medium text-white hover:from-blue-400 hover:to-cyan-400 transition-all hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50"
                >
                  {actionLoading ? 'Verificando...' : 'Unirse'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="flex flex-col shrink min-h-0 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
            <div className="flex flex-col rounded-2xl glass overflow-hidden shrink min-h-0">
              <div className="px-4 sm:px-6 py-4 border-b border-black/5 bg-black/[0.02] shrink-0 flex items-center justify-between">
                <h3 className="font-semibold text-xs sm:text-sm text-muted-foreground uppercase tracking-wider">Mis Almacenes</h3>
                
                <div className="relative" ref={menuRef}>
                  <button 
                    onClick={() => setShowAddOptions(!showAddOptions)} 
                    className="flex items-center gap-1 text-xs font-semibold text-sky-600 hover:bg-sky-500/10 px-2 py-1 rounded-md transition-colors"
                  >
                    <Plus className="h-4 w-4" /> Agregar Almacén
                  </button>
                  
                  {showAddOptions && (
                    <div className="absolute right-0 mt-2 w-48 bg-card border rounded-md shadow-lg overflow-hidden z-10 animate-in fade-in zoom-in-95 origin-top-right">
                      <button 
                        onClick={() => { setCreateMode(true); setShowAddOptions(false); }} 
                        className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors flex items-center gap-2"
                      >
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        Crear Nuevo
                      </button>
                      <button 
                        onClick={() => { setJoinMode(true); setShowAddOptions(false); }} 
                        className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors flex items-center gap-2"
                      >
                        <Users className="h-4 w-4 text-muted-foreground" />
                        Tengo un Código
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="overflow-y-auto shrink divide-y custom-scrollbar">
                {workspaces.length > 0 ? workspaces.map((member) => (
                  <button
                    key={member.workspace_id}
                    onClick={() => handleSelectWorkspace(member.workspace)}
                    className="w-full flex items-center justify-between p-4 sm:p-6 hover:bg-muted/50 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                      <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 group-hover:scale-105 transition-transform border border-sky-500/20">
                        <Building2 className="h-5 w-5 sm:h-6 sm:w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        {editingWorkspaceId === member.workspace.id ? (
                          <form 
                            onSubmit={(e) => handleSaveEdit(e, member.workspace.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1"
                          >
                            <input 
                              type="text"
                              required
                              value={editingWorkspaceName}
                              onChange={(e) => setEditingWorkspaceName(e.target.value)}
                              className="h-8 w-full max-w-[200px] rounded-md border border-input bg-background px-2 text-sm focus:ring-2 focus:ring-ring"
                              autoFocus
                            />
                            <div className="flex items-center gap-2">
                              <button type="submit" disabled={actionLoading} className="text-sky-600 text-xs sm:text-sm font-semibold hover:underline">
                                Guardar
                              </button>
                              <button type="button" onClick={(e) => { e.stopPropagation(); setEditingWorkspaceId(null); }} className="text-muted-foreground text-xs sm:text-sm hover:underline">
                                Cancelar
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-base sm:text-lg truncate">{member.workspace.name}</h4>
                            {member.role === 'admin' && (
                              <button
                                onClick={(e) => handleStartEdit(e, member.workspace)}
                                className="text-muted-foreground sm:opacity-0 group-hover:opacity-100 hover:text-sky-600 transition-all p-1 rounded-md hover:bg-muted"
                                title="Renombrar almacén"
                              >
                                <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                              </button>
                            )}
                          </div>
                        )}
                        <span className="text-xs sm:text-sm text-muted-foreground capitalize flex items-center gap-1 mt-0.5">
                          <Users className="h-3 w-3" />
                          <span className="truncate">Rol: {member.role === 'admin' ? 'Administrador' : 'Colaborador'}</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {member.role === 'admin' ? (
                        <button
                          onClick={(e) => handleDeleteWorkspace(e, member.workspace.id, member.workspace.name)}
                          disabled={actionLoading}
                          title="Eliminar almacén"
                          className="p-2 rounded-lg text-muted-foreground sm:opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-500/10 transition-all duration-200 disabled:opacity-30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          onClick={(e) => handleLeaveWorkspace(e, member.workspace.id, member.workspace.name)}
                          disabled={actionLoading}
                          title="Salir del almacén"
                          className="p-2 rounded-lg text-muted-foreground sm:opacity-0 group-hover:opacity-100 hover:text-orange-500 hover:bg-orange-500/10 transition-all duration-200 disabled:opacity-30"
                        >
                          <LogOut className="h-4 w-4" />
                        </button>
                      )}
                      <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground sm:opacity-0 group-hover:opacity-100 transition-all sm:-translate-x-4 group-hover:translate-x-0 duration-300" />
                    </div>
                  </button>
                )) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <Building2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>Aún no tienes almacenes.</p>
                    <p className="text-sm mt-1">Haz clic en <strong>Agregar Almacén</strong> para empezar.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Confirm Modal */}
        {confirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div className="w-full max-w-md rounded-2xl glass border-black/10 p-6 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className={`flex h-16 w-16 items-center justify-center rounded-full border ${
                  confirmModal.type === 'delete'
                    ? 'bg-destructive/10 border-destructive/20 text-destructive'
                    : 'bg-orange-500/10 border-orange-500/20 text-orange-500'
                }`}>
                  <AlertTriangle className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">
                    {confirmModal.type === 'delete' ? 'Eliminar almacén' : 'Salir del almacén'}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {confirmModal.type === 'delete' ? (
                      <>Estás a punto de eliminar <strong className="text-foreground">{confirmModal.workspaceName}</strong>. Esta acción no se puede deshacer.</>
                    ) : (
                      <>¿Estás seguro de que quieres salir de <strong className="text-foreground">{confirmModal.workspaceName}</strong>?</>
                    )}
                  </p>
                </div>
              </div>
              {error && (
                <div className="mt-4 rounded-lg bg-destructive/15 p-3 text-sm text-destructive text-center font-medium border border-destructive/20">
                  {error}
                </div>
              )}
              <div className="mt-6 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmModal(null)}
                  disabled={actionLoading}
                  className="rounded-xl border border-black/10 bg-black/5 px-4 py-2 text-sm font-medium hover:bg-black/10 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => executeConfirm(confirmModal.type, confirmModal.workspaceId)}
                  disabled={actionLoading}
                  className={`rounded-xl px-4 py-2 text-sm font-medium text-white transition-all disabled:opacity-50 ${
                    confirmModal.type === 'delete'
                      ? 'bg-destructive hover:bg-destructive/90 hover:shadow-lg hover:shadow-destructive/25'
                      : 'bg-orange-500 hover:bg-orange-600 hover:shadow-lg hover:shadow-orange-500/25'
                  }`}
                >
                  {actionLoading ? 'Procesando...' : confirmModal.type === 'delete' ? 'Sí, eliminar' : 'Sí, salir'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
