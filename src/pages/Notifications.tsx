import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Users, CheckCircle2, XCircle, Clock, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { useWorkspaceStore } from '../store/workspaceStore';
import type { Notification } from '../types';

function timeAgo(dateStr?: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  return `hace ${Math.floor(hrs / 24)}d`;
}

function NotificationIcon({ type }: { type: Notification['type'] }) {
  if (type === 'access_request') {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-500">
        <Users className="h-5 w-5" />
      </div>
    );
  }
  if (type === 'access_accepted') {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
        <CheckCircle2 className="h-5 w-5" />
      </div>
    );
  }
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-red-500">
      <XCircle className="h-5 w-5" />
    </div>
  );
}

export const Notifications = () => {
  const { user } = useAuthStore();
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    subscribeToNotifications,
  } = useNotificationStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchNotifications(user.id).then(() => setLoading(false));
    const unsub = subscribeToNotifications(user.id);
    return unsub;
  }, [user]);

  const handleClick = async (notif: Notification) => {
    if (!notif.read) {
      await markAsRead(notif.id);
    }
    if (notif.type === 'access_request') {
      if (notif.data?.workspace_id) {
        const { workspaces, setActiveWorkspace } = useWorkspaceStore.getState();
        const wsToSelect = workspaces.find((w: any) => w.workspace.id === notif.data.workspace_id);
        if (wsToSelect) setActiveWorkspace(wsToSelect.workspace);
      }
      navigate('/team');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-black/5 transition-colors text-muted-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notificaciones</h1>
            <p className="text-muted-foreground">Historial de solicitudes y accesos.</p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => user && markAllAsRead(user.id)}
            className="flex items-center gap-1.5 rounded-xl border border-black/10 px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-black/5 transition-colors"
          >
            <CheckCheck className="h-4 w-4" />
            Marcar todas como leídas
          </button>
        )}
      </div>

      <div className="rounded-2xl glass overflow-hidden shadow-2xl">
        {loading ? (
          <div className="flex items-center justify-center p-12 text-muted-foreground animate-pulse">
            <Clock className="h-5 w-5 mr-2" />
            <span className="text-sm">Cargando notificaciones...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center px-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Bell className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="font-semibold text-lg">Sin notificaciones</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              Aquí aparecerán las solicitudes de acceso y notificaciones del equipo.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-black/5">
            {notifications.map((notif) => (
              <button
                key={notif.id}
                onClick={() => handleClick(notif)}
                className={`w-full flex items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-black/[0.02] ${
                  !notif.read ? 'bg-indigo-500/5' : ''
                }`}
              >
                <NotificationIcon type={notif.type} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm ${!notif.read ? 'font-semibold' : 'font-medium'}`}>
                      {notif.title}
                    </p>
                    {!notif.read && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{notif.message}</p>
                  <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground/70">
                    <Clock className="h-3.5 w-3.5" />
                    {timeAgo(notif.created_at)}
                    {notif.type === 'access_request' && (
                      <span className="ml-2 rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-600">
                        Click para revisar
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
