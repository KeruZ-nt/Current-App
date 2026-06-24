import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { sanitizeError } from '../lib/errors';
import type { Transaction } from '../types';
import { useWorkspaceStore } from '../store/workspaceStore';
import { Clock, ArrowUpRight, ArrowDownRight, Edit2, Plus, Trash2, Calendar as CalendarIcon, Save, X, Loader2 } from 'lucide-react';

/**
 * Componente History (Historial de Movimientos)
 * Muestra un registro cronológico de todas las transacciones (ventas, compras, ajustes).
 * Los movimientos generados en una misma operación (ej. venta múltiple) se agrupan por movement_id.
 */

// Define how we want to group the transactions
interface MovementGroup {
  id: string; // The movement_id
  type: Transaction['type'];
  date: string;
  items: Transaction[];
  totalValue: number;
}

export const History = () => {
  const { activeWorkspace, activeRole } = useWorkspaceStore();
  const [loading, setLoading] = useState(true);
  const [movements, setMovements] = useState<MovementGroup[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Edit state
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState<number>(0);
  const [editTotal, setEditTotal] = useState<number>(0);

  useEffect(() => {
    /**
     * Obtiene el historial de transacciones desde Supabase.
     * Agrupa los items devueltos según su movement_id para mostrar ventas/compras de múltiples productos como un solo bloque.
     */
    const fetchHistory = async () => {
      if (!activeWorkspace) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select('*, product:products(*)')
        .eq('workspace_id', activeWorkspace.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching history:', error);
      } else if (data) {
        // Group by movement_id
        const grouped = new Map<string, MovementGroup>();
        
        data.forEach((tx: any) => {
          // If it doesn't have a movement_id (legacy data), use its own id
          const mId = tx.movement_id || tx.id;
          
          if (!grouped.has(mId)) {
            grouped.set(mId, {
              id: mId,
              type: tx.type,
              date: tx.created_at,
              items: [],
              totalValue: 0
            });
          }
          
          const group = grouped.get(mId)!;
          group.items.push(tx);
          // We calculate total value if it's a purchase or sale
          if (tx.type === 'sale' || tx.type === 'purchase') {
            group.totalValue += Number(tx.total_price || 0);
          }
        });

        setMovements(Array.from(grouped.values()));
      }
      setLoading(false);
    };

    if (activeWorkspace) {
      fetchHistory();
    }
  }, [activeWorkspace]);

  /**
   * Refresca manualmente la lista de historial (ej. post eliminación/edición).
   */
  const refreshHistory = async () => {
    if (!activeWorkspace) return;
    const { data, error } = await supabase
      .from('transactions')
      .select('*, product:products(*)')
      .eq('workspace_id', activeWorkspace.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const grouped = new Map<string, MovementGroup>();
      data.forEach((tx: any) => {
        const mId = tx.movement_id || tx.id;
        if (!grouped.has(mId)) {
          grouped.set(mId, { id: mId, type: tx.type, date: tx.created_at, items: [], totalValue: 0 });
        }
        const group = grouped.get(mId)!;
        group.items.push(tx);
        if (tx.type === 'sale' || tx.type === 'purchase') {
          group.totalValue += Number(tx.total_price || 0);
        }
      });
      setMovements(Array.from(grouped.values()));
    }
  };

  /**
   * Retorna información visual (ícono, color) basado en el tipo de transacción.
   */
  const getTypeInfo = (type: string) => {
    switch (type) {
      case 'sale': return { label: 'Venta', icon: <ArrowUpRight className="h-4 w-4" />, color: 'bg-sky-500/20 text-sky-600 border border-sky-500/10', borderColor: 'border-sky-500/20' };
      case 'purchase': return { label: 'Compra Masiva', icon: <ArrowDownRight className="h-4 w-4" />, color: 'bg-blue-500/20 text-blue-600 border border-blue-500/10', borderColor: 'border-blue-500/20' };
      case 'creation': return { label: 'Nuevo Producto', icon: <Plus className="h-4 w-4" />, color: 'bg-blue-500/20 text-blue-600 border border-blue-500/10', borderColor: 'border-blue-500/20' };
      case 'adjustment': return { label: 'Ajuste de Stock', icon: <Edit2 className="h-4 w-4" />, color: 'bg-amber-500/20 text-amber-600 border border-amber-500/10', borderColor: 'border-amber-500/20' };
      case 'deletion': return { label: 'Eliminación', icon: <Trash2 className="h-4 w-4" />, color: 'bg-destructive/20 text-destructive border border-destructive/10', borderColor: 'border-destructive/20' };
      default: return { label: type, icon: <Clock className="h-4 w-4" />, color: 'bg-black/5 text-muted-foreground border border-black/10', borderColor: 'border-black/10' };
    }
  };

  const handleDeleteTx = async (txId: string) => {
    if (activeRole !== 'admin') return;
    if (!window.confirm("¿Seguro que deseas eliminar esta transacción visualmente? (El stock NO se devolverá automáticamente)")) return;

    const { error } = await supabase.from('transactions').delete().eq('id', txId);
    if (error) {
      alert(sanitizeError(error));
    } else {
      refreshHistory();
    }
  };

  const handleSaveEdit = async (txId: string) => {
    if (activeRole !== 'admin') return;
    
    const { error } = await supabase
      .from('transactions')
      .update({ quantity: editQuantity, total_price: editTotal })
      .eq('id', txId);

    if (error) {
      alert(sanitizeError(error));
    } else {
      setEditingTxId(null);
      refreshHistory();
    }
  };

  const startEdit = (tx: Transaction) => {
    setEditingTxId(tx.id);
    setEditQuantity(tx.quantity);
    setEditTotal(tx.total_price || 0);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Historial de Movimientos</h1>
        <p className="text-muted-foreground">Registro cronológico de todas las actividades en el inventario.</p>
      </div>

      <div className="rounded-2xl glass shadow-2xl overflow-hidden relative">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-muted-foreground animate-pulse gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-sky-600" />
            <p>Cargando historial...</p>
          </div>
        ) : movements.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No hay movimientos registrados aún.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {movements.map((group) => {
              const info = getTypeInfo(group.type);
              const isExpanded = expandedId === group.id;

              return (
                <div key={group.id} className="flex flex-col">
                  {/* Summary Row */}
                  <div 
                    className="flex cursor-pointer items-center justify-between p-4 transition-colors hover:bg-black/[0.03]"
                    onClick={() => setExpandedId(isExpanded ? null : group.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${info.color}`}>
                        {info.icon}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold">{info.label}</span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-tech">
                          <CalendarIcon className="h-3 w-3" />
                          {new Date(group.date).toLocaleString('es-PE', {
                            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                          <span>• ID: {group.id}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">{group.items.length} item(s)</div>
                        {group.totalValue > 0 && (
                          <div className={`font-bold font-tech ${group.type === 'sale' ? 'text-sky-600' : 'text-foreground'}`}>
                            {group.type === 'sale' ? '+' : '-'} S/ {group.totalValue.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className={`border-l-4 ${info.borderColor} bg-black/[0.02] p-4`}>
                      <div className="w-full overflow-x-auto">
                        <table className="w-full text-sm min-w-[500px]">
                        <thead className="text-left text-muted-foreground">
                          <tr>
                            <th className="pb-2 font-medium">Producto</th>
                            <th className="pb-2 font-medium">SKU</th>
                            <th className="pb-2 font-medium text-right">Cant.</th>
                            {(group.type === 'sale' || group.type === 'purchase') && (
                              <th className="pb-2 font-medium text-right">Total (S/)</th>
                            )}
                            {activeRole === 'admin' && (
                              <th className="pb-2 font-medium text-right">Acciones</th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {group.items.map((item) => {
                            const isEditing = editingTxId === item.id;
                            
                            return (
                            <tr key={item.id}>
                              <td className="py-2">{item.product?.name || item.product_name_snapshot || 'Producto Eliminado'}</td>
                              <td className="py-2 text-muted-foreground font-tech">{item.product?.sku || '-'}</td>
                              <td className="py-2 text-right font-medium font-tech">
                                {isEditing ? (
                                  <input 
                                    type="number" 
                                    className="w-16 h-8 text-right rounded-md border border-black/10 bg-background/80 px-2 outline-none focus:ring-2 focus:ring-sky-500/50 font-tech" 
                                    value={editQuantity} 
                                    onChange={e => setEditQuantity(Number(e.target.value))} 
                                  />
                                ) : (
                                  item.quantity
                                )}
                              </td>
                              {(group.type === 'sale' || group.type === 'purchase') && (
                                <td className="py-2 text-right font-tech">
                                  {isEditing ? (
                                    <input 
                                      type="number" 
                                      step="0.01"
                                      className="w-20 h-8 text-right rounded-md border border-black/10 bg-background/80 px-2 outline-none focus:ring-2 focus:ring-sky-500/50 font-tech" 
                                      value={editTotal} 
                                      onChange={e => setEditTotal(Number(e.target.value))} 
                                    />
                                  ) : (
                                    `S/ ${Number(item.total_price || 0).toFixed(2)}`
                                  )}
                                </td>
                              )}
                              {activeRole === 'admin' && (
                                <td className="py-2 text-right">
                                  {isEditing ? (
                                    <div className="flex justify-end gap-1">
                                      <button onClick={() => handleSaveEdit(item.id)} className="p-1.5 text-emerald-400 hover:bg-emerald-500/20 rounded-md transition-colors">
                                        <Save className="h-4 w-4" />
                                      </button>
                                      <button onClick={() => setEditingTxId(null)} className="p-1.5 text-muted-foreground hover:bg-black/10 rounded-md transition-colors">
                                        <X className="h-4 w-4" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex justify-end gap-1">
                                      <button onClick={() => startEdit(item)} className="p-1.5 text-muted-foreground hover:bg-black/10 rounded-md transition-colors">
                                        <Edit2 className="h-4 w-4" />
                                      </button>
                                      <button onClick={() => handleDeleteTx(item.id)} className="p-1.5 text-destructive hover:bg-destructive/20 rounded-md transition-colors">
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  )}
                                </td>
                              )}
                            </tr>
                          )})}
                        </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
