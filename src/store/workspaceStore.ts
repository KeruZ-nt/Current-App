import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Workspace, WorkspaceMember } from '../types';

interface WorkspaceState {
  activeWorkspace: Workspace | null;
  activeRole: 'admin' | 'collaborator' | null;
  workspaces: (WorkspaceMember & { workspace: Workspace })[];
  loading: boolean;
  setActiveWorkspace: (workspace: Workspace | null) => void;
  fetchWorkspaces: (userId: string, background?: boolean) => Promise<void>;
  clearWorkspaces: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  activeWorkspace: null,
  activeRole: null,
  workspaces: [],
  loading: false,
  setActiveWorkspace: (workspace) => {
    set((state) => {
      const member = state.workspaces.find(w => w.workspace_id === workspace?.id);
      return { 
        activeWorkspace: workspace,
        activeRole: member ? member.role : null
      };
    });
  },
  fetchWorkspaces: async (userId, background = false) => {
    if (!background) {
      set({ loading: true });
    }
    const { data, error } = await supabase
      .from('workspace_members')
      .select('*, workspace:workspaces(*)')
      .eq('user_id', userId);

    if (!error && data) {
      set({ 
        workspaces: data as any[], 
        loading: false 
      });
      // Set active workspace automatically if there's only one or none selected
      const currentActive = useWorkspaceStore.getState().activeWorkspace;
      if (data.length > 0 && (!currentActive || !data.find(d => d.workspace_id === currentActive.id))) {
        set({ 
          activeWorkspace: data[0].workspace,
          activeRole: data[0].role
        });
      }
    } else {
      set({ loading: false });
    }
  },
  clearWorkspaces: () => {
    set({ activeWorkspace: null, activeRole: null, workspaces: [], loading: false });
  }
}));
