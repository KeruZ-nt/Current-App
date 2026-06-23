import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { User, LogOut, Building2, Repeat, Menu } from 'lucide-react';

interface HeaderProps {
  hideLogo?: boolean;
  onMenuClick?: () => void;
}

export const Header = ({ hideLogo = false, onMenuClick }: HeaderProps) => {
  const { profile, signOut } = useAuthStore();
  const { activeWorkspace, activeRole, clearWorkspaces } = useWorkspaceStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    clearWorkspaces();
    await signOut();
    navigate('/login');
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between bg-background/60 backdrop-blur-xl border-b border-black/5 px-4 sm:px-6">
      <div className="flex items-center gap-2 sm:gap-4">
        {onMenuClick && (
          <button 
            onClick={onMenuClick}
            className="lg:hidden rounded-lg p-2 hover:bg-black/5 text-foreground transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        
        {!hideLogo && (
          <Link to={pathname === '/workspaces' ? '/workspaces' : '/'} className="flex items-center gap-3 transition-opacity hover:opacity-80">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-1.5 rounded-xl shadow-lg shadow-indigo-500/20">
              <img src="/logo.svg" alt="Current Logo" className="h-6 w-6 object-contain brightness-0 invert" />
            </div>
            <span className="text-xl font-bold tracking-tight hidden sm:inline-block text-foreground">Current</span>
          </Link>
        )}

        {activeWorkspace && pathname !== '/workspaces' && pathname !== '/profile' && (
          <div className={`flex items-center gap-2 ${!hideLogo ? 'hidden sm:flex ml-2 pl-4 border-l' : ''}`}>
            <Building2 className={`h-5 w-5 ${hideLogo ? 'text-primary' : 'h-4 w-4 text-muted-foreground'}`} />
            <span className={`${hideLogo ? 'font-semibold text-lg' : 'text-sm font-medium text-muted-foreground'} truncate max-w-[150px] sm:max-w-[200px]`}>
              {activeWorkspace.name}
            </span>
          </div>
        )}
      </div>

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-3 rounded-full border border-transparent p-1 transition-colors hover:bg-muted"
        >
          <div className="flex flex-col items-end hidden sm:flex gap-1">
            <span className="text-sm font-medium leading-none">{profile?.full_name || 'Usuario'}</span>
            {pathname !== '/workspaces' && pathname !== '/profile' && activeRole && (
              <span className="text-xs text-muted-foreground capitalize">
                {activeRole === 'admin' ? 'Administrador' : 'Colaborador'}
              </span>
            )}
          </div>
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-muted border">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-muted-foreground">{getInitials(profile?.full_name)}</span>
            )}
          </div>
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl bg-card/95 backdrop-blur-2xl border border-black/10 text-popover-foreground shadow-2xl outline-none animate-in fade-in zoom-in-95">
            <div className="px-4 py-3 border-b border-black/5">
              <p className="text-sm font-medium leading-none">{profile?.full_name || 'Usuario'}</p>
              <p className="text-xs text-muted-foreground mt-1 truncate">{profile?.email}</p>
            </div>
            <div className="p-1">
              <Link
                to="/profile"
                onClick={() => setDropdownOpen(false)}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-sm hover:bg-muted"
              >
                <User className="h-4 w-4" />
                Mi Perfil
              </Link>
              <Link
                to="/workspaces"
                onClick={() => setDropdownOpen(false)}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-sm hover:bg-muted"
              >
                <Repeat className="h-4 w-4" />
                Cambiar de Almacén
              </Link>
            </div>
            <div className="border-t p-1">
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-sm text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" />
                Cerrar Sesión
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
