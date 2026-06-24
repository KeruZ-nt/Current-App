import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Users, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import type { Notification } from '../../types';

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
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-500">
        <Users className="h-4 w-4" />
      </div>
    );
  }
  if (type === 'access_accepted') {
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
        <CheckCircle2 className="h-4 w-4" />
      </div>
    );
  }
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-red-500">
      <XCircle className="h-4 w-4" />
    </div>
  );
}

export const NotificationBell = () => {
  const { user } = useAuthStore();
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead, subscribeToNotifications } =
    useNotificationStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Fetch + realtime on mount
  useEffect(() => {
    if (!user) return;
    fetchNotifications(user.id);
    const unsub = subscribeToNotifications(user.id);
    return unsub;
  }, [user]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.read) {
      await markAsRead(notif.id);
    }
    // Admin: solicitud de acceso → redirige a /team
    if (notif.type === 'access_request') {
      setOpen(false);
      navigate('/team');
    }
    // Usuario: aceptado/rechazado → solo marcar leído (ya visible en el panel)
  };

  const handleMarkAll = async () => {
    if (!user) return;
    await markAllAsRead(user.id);
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        id="notification-bell-btn"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-black/5 transition-colors text-muted-foreground hover:text-foreground"
        aria-label="Notificaciones"
      >
        <Bell className={`h-5 w-5 transition-transform ${open ? 'scale-110' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-60" />
            <span className="relative flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white leading-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 origin-top-right rounded-2xl bg-card/95 backdrop-blur-2xl border border-black/10 shadow-2xl animate-in fade-in zoom-in-95 duration-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-black/5 px-4 py-3 bg-black/[0.02]">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-indigo-500" />
              <span className="text-sm font-semibold">Notificaciones</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-xs font-medium text-indigo-500">
                  {unreadCount} nuevas
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAll}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                title="Marcar todas como leídas"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Leer todo
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-black/5">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-center px-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">Sin notificaciones</p>
                <p className="text-xs text-muted-foreground">Las novedades aparecerán aquí.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60 ${
                    !notif.read ? 'bg-indigo-500/5' : ''
                  }`}
                >
                  <NotificationIcon type={notif.type} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm leading-snug ${!notif.read ? 'font-semibold' : 'font-medium'}`}>
                        {notif.title}
                      </p>
                      {!notif.read && (
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground leading-snug">{notif.message}</p>
                    <div className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground/70">
                      <Clock className="h-3 w-3" />
                      {timeAgo(notif.created_at)}
                      {notif.type === 'access_request' && (
                        <span className="ml-1.5 rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600">
                          Click para revisar → Equipo
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
