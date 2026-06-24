import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { sanitizeError } from '../lib/errors';
import type { Supplier } from '../types';
import { useWorkspaceStore } from '../store/workspaceStore';
import { Plus, Search, Edit2, Trash2, Globe, Phone, FileText, AlertTriangle, Loader2 } from 'lucide-react';

/**
 * Componente Suppliers (Proveedores)
 * Permite gestionar el directorio de proveedores del almacén.
 * Incluye funcionalidades de crear, editar, eliminar y buscar proveedores.
 */

export const Suppliers = () => {
  const { activeWorkspace, activeRole } = useWorkspaceStore();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Supplier>>({
    name: '',
    website: '',
    contact_info: '',
    category: '',
    notes: '',
  });

  // Delete Modal State
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

  useEffect(() => {
    /**
     * Obtiene la lista de proveedores desde la base de datos para el almacén activo.
     */
    const fetchSuppliers = async () => {
      if (!activeWorkspace) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('workspace_id', activeWorkspace.id)
        .order('name');
      
      if (error) {
        console.error('Error fetching suppliers:', error);
      } else if (data) {
        setSuppliers(data as Supplier[]);
      }
      setLoading(false);
    };

    if (activeWorkspace) {
      fetchSuppliers();
    }
  }, [activeWorkspace]);

  /**
   * Abre el modal de creación o edición de proveedor.
   * @param supplier Objeto proveedor si se va a editar, undefined si es nuevo.
   */
  const openModal = (supplier?: Supplier) => {
    if (supplier) {
      setEditingId(supplier.id);
      setFormData(supplier);
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        website: '',
        contact_info: '',
        category: '',
        notes: '',
      });
    }
    setIsModalOpen(true);
  };

  /**
   * Maneja el guardado del formulario (Creación o Actualización).
   */
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeRole !== 'admin') {
      alert('Acceso Denegado: Solo los administradores pueden gestionar proveedores.');
      return;
    }
    
    if (editingId) {
      const { data, error } = await supabase
        .from('suppliers')
        .update(formData)
        .eq('id', editingId)
        .select();

      if (error) {
        alert(sanitizeError(error));
      } else if (data) {
        setSuppliers(suppliers.map(s => s.id === editingId ? data[0] : s));
        setIsModalOpen(false);
      }
    } else {
      const { data, error } = await supabase
        .from('suppliers')
        .insert([{ ...formData, workspace_id: activeWorkspace!.id }])
        .select();

      if (error) {
        alert(sanitizeError(error));
      } else if (data) {
        setSuppliers([...suppliers, data[0]].sort((a, b) => a.name.localeCompare(b.name)));
        setIsModalOpen(false);
      }
    }
  };

  const confirmDelete = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
  };

  const executeDelete = async () => {
    if (!supplierToDelete) return;
    if (activeRole !== 'admin') {
      alert('Acceso Denegado: Solo los administradores pueden eliminar proveedores.');
      return;
    }
    
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', supplierToDelete.id);

    if (error) {
      alert(sanitizeError(error));
    } else {
      setSuppliers(suppliers.filter(s => s.id !== supplierToDelete.id));
      setSupplierToDelete(null);
    }
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.category && s.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Proveedores</h1>
          <p className="text-muted-foreground">Gestiona tu directorio de empresas y e-commerce.</p>
        </div>
        {activeRole === 'admin' && (
          <button
            onClick={() => openModal()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 px-4 py-2 text-sm font-medium text-white transition-all hover:from-sky-400 hover:to-blue-400 hover:shadow-lg hover:shadow-sky-500/25"
          >
            <Plus className="h-4 w-4" />
            Nuevo Proveedor
          </button>
        )}
      </div>

      <div className="rounded-2xl glass overflow-hidden shadow-2xl relative">
        <div className="p-4 border-b border-black/5 bg-black/[0.02]">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar proveedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-black/10 bg-background/80 pl-10 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all font-tech"
            />
          </div>
        </div>
        
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm min-w-[700px]">
            <thead className="[&_tr]:border-b border-black/5">
              <tr className="border-b border-black/5 transition-colors hover:bg-black/5 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Nombre / Empresa</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Categoría</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Contacto</th>
                {activeRole === 'admin' && (
                  <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Acciones</th>
                )}
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-muted-foreground animate-pulse">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <p>Cargando directorio...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">No se encontraron proveedores.</td>
                </tr>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="border-b border-black/5 transition-colors hover:bg-black/[0.03] group">
                    <td className="p-4 align-middle">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">{supplier.name}</span>
                        {supplier.website && (
                          <a 
                            href={supplier.website.startsWith('http') ? supplier.website : `https://${supplier.website}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-sky-600 hover:text-cyan-300 hover:underline mt-1 transition-colors"
                          >
                            <Globe className="h-3 w-3" /> Abrir Web
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      {supplier.category ? (
                        <span className="inline-flex items-center rounded-full border border-black/10 px-2.5 py-0.5 text-xs font-medium bg-black/5 text-muted-foreground">
                          {supplier.category}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="p-4 align-middle">
                      <div className="flex flex-col gap-1">
                        {supplier.contact_info && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3 shrink-0" />
                            <span className="truncate max-w-[200px]">{supplier.contact_info}</span>
                          </div>
                        )}
                        {supplier.notes && (
                          <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                            <FileText className="h-3 w-3 shrink-0 mt-0.5" />
                            <span className="truncate max-w-[200px]" title={supplier.notes}>{supplier.notes}</span>
                          </div>
                        )}
                        {!supplier.contact_info && !supplier.notes && '-'}
                      </div>
                    </td>
                    {activeRole === 'admin' && (
                      <td className="p-4 align-middle text-center">
                        <div className="flex items-center justify-center gap-2 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                          <button
                            onClick={() => openModal(supplier)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-black/10 bg-transparent hover:bg-black/10 text-muted-foreground hover:text-foreground transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => confirmDelete(supplier)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-destructive/20 text-destructive hover:bg-destructive/20 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Formulario */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl glass border-black/10 p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? 'Editar Proveedor' : 'Nuevo Proveedor'}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre / Empresa *</label>
                <input 
                  required 
                  value={formData.name || ''} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  placeholder="Ej. Temu, AliExpress, Empresa Local"
                  className="flex h-10 w-full rounded-xl border border-black/10 bg-background/80 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" 
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Sitio Web / Plataforma (Opcional)</label>
                <input 
                  type="text"
                  value={formData.website || ''} 
                  onChange={e => setFormData({...formData, website: e.target.value})} 
                  placeholder="Ej. temu.com"
                  className="flex h-10 w-full rounded-xl border border-black/10 bg-background/80 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Categoría (Opcional)</label>
                  <input 
                    value={formData.category || ''} 
                    onChange={e => setFormData({...formData, category: e.target.value})} 
                    placeholder="Ej. E-commerce"
                    className="flex h-10 w-full rounded-xl border border-black/10 bg-background/80 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Contacto (Opcional)</label>
                  <input 
                    value={formData.contact_info || ''} 
                    onChange={e => setFormData({...formData, contact_info: e.target.value})} 
                    placeholder="Teléfono, email, etc."
                    className="flex h-10 w-full rounded-xl border border-black/10 bg-background/80 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Notas Adicionales (Opcional)</label>
                <textarea 
                  value={formData.notes || ''} 
                  onChange={e => setFormData({...formData, notes: e.target.value})} 
                  placeholder="Ej. Envío demora 2 semanas, usar cupón ABC..."
                  className="flex min-h-[80px] w-full rounded-xl border border-black/10 bg-background/80 px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500/50 outline-none transition-all resize-none font-tech" 
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-xl border border-black/10 bg-black/5 px-4 py-2 text-sm font-medium hover:bg-black/10 transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 px-4 py-2 text-sm font-medium text-white hover:from-sky-400 hover:to-blue-400 transition-all hover:shadow-lg hover:shadow-sky-500/25">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Eliminación */}
      {supplierToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl glass border-black/10 p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="mb-4 flex items-center gap-3 text-destructive">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 border border-destructive/20">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-bold">Eliminar Proveedor</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              ¿Estás seguro de que deseas eliminar a <strong className="text-foreground">{supplierToDelete.name}</strong> del directorio? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setSupplierToDelete(null)} 
                className="rounded-xl border border-black/10 bg-black/5 px-4 py-2 text-sm font-medium hover:bg-black/10 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={executeDelete} 
                className="rounded-xl bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 transition-all hover:shadow-lg hover:shadow-destructive/25"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
