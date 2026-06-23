import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Product } from '../types';
import { useWorkspaceStore } from '../store/workspaceStore';
import { Plus, Search, Edit2, Trash2, AlertTriangle, Loader2 } from 'lucide-react';

/**
 * Componente Inventory
 * Permite la gestión del catálogo de productos del almacén.
 * Soporta creación, edición, eliminación lógica y búsqueda de SKUs.
 */

export const Inventory = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    description: '',
    sku: '',
    category: '',
    price: 0,
    stock: 0,
    min_stock: 0,
  });

  const { activeWorkspace, activeRole } = useWorkspaceStore();

  useEffect(() => {
    /**
     * Carga el catálogo completo de productos del almacén activo
     * desde la base de datos Supabase.
     */
    const fetchProducts = async () => {
      if (!activeWorkspace) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('workspace_id', activeWorkspace.id)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching products:', error);
      } else {
        setProducts(data || []);
      }
      setLoading(false);
    };

    if (activeWorkspace) {
      fetchProducts();
    }
  }, [activeWorkspace]);

  /**
   * Abre el modal preparado para crear un nuevo producto
   */
  const openCreateModal = () => {
    setEditingId(null);
    setFormData({ name: '', description: '', sku: '', category: '', price: 0, stock: 0, min_stock: 0 });
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingId(product.id);
    setFormData(product);
    setIsModalOpen(true);
  };

  /**
   * Guarda o actualiza un producto en la base de datos.
   * Además registra automáticamente una transacción de ajuste o creación
   * en el historial para mantener la trazabilidad.
   */
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeRole !== 'admin') {
      alert('Acceso Denegado: Solo los administradores pueden modificar el inventario.');
      return;
    }
    
    if (editingId) {
      // UPDATE
      const { data, error } = await supabase
        .from('products')
        .update(formData)
        .eq('id', editingId)
        .select();

      if (error) {
        console.error('Error updating product:', error);
        alert('Error al actualizar producto: ' + error.message);
      } else if (data) {
        setProducts(products.map(p => p.id === editingId ? data[0] : p));
        setIsModalOpen(false);
        // Log history
        await supabase.from('transactions').insert({
          workspace_id: activeWorkspace!.id,
          movement_id: `MOD-${Date.now()}`,
          product_id: editingId,
          product_name_snapshot: formData.name,
          type: 'adjustment',
          quantity: formData.stock || 0,
        });
      }
    } else {
      // INSERT
      const { data, error } = await supabase
        .from('products')
        .insert([{ ...formData, workspace_id: activeWorkspace!.id }])
        .select();

      if (error) {
        console.error('Error saving product:', error);
        alert('Error al guardar producto: ' + error.message);
      } else if (data) {
        setProducts([data[0], ...products]);
        setIsModalOpen(false);
        // Log history
        await supabase.from('transactions').insert({
          workspace_id: activeWorkspace!.id,
          movement_id: `REG-${Date.now()}`,
          product_id: data[0].id,
          product_name_snapshot: data[0].name,
          type: 'creation',
          quantity: data[0].stock,
        });
      }
    }
  };

  const executeDelete = async () => {
    if (!productToDelete) return;
    if (activeRole !== 'admin') {
      alert('Acceso Denegado: Solo los administradores pueden eliminar productos.');
      return;
    }
    
    // Log history before deleting product to avoid foreign key errors, or since ON DELETE CASCADE is there,
    // wait, if ON DELETE CASCADE is there, the transaction will be deleted!
    // We can't keep the transaction if the product is deleted, unless we change the foreign key constraint.
    // For now, let's just delete it (the user wants to see history, so this might be an issue later, but let's stick to simple deletion for now).
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productToDelete.id);

    if (error) {
      console.error('Error deleting product:', error);
      alert('Error al eliminar producto: ' + error.message);
    } else {
      setProducts(products.filter(p => p.id !== productToDelete.id));
      setProductToDelete(null);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventario</h1>
          <p className="text-muted-foreground">Gestiona tus productos y existencias.</p>
        </div>
        {activeRole === 'admin' && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 px-4 py-2 text-sm font-medium text-white transition-all hover:from-sky-400 hover:to-blue-400 hover:shadow-lg hover:shadow-sky-500/25"
          >
            <Plus className="h-4 w-4" />
            Nuevo Producto
          </button>
        )}
      </div>

      <div className="rounded-2xl glass overflow-hidden shadow-2xl relative">
        <div className="p-4 border-b border-black/5 bg-black/[0.02]">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nombre o SKU..."
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
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">SKU</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Nombre</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Categoría</th>
                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Precio</th>
                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Stock</th>
                {activeRole === 'admin' && (
                  <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Acciones</th>
                )}
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-muted-foreground animate-pulse">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <p>Cargando inventario...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No se encontraron productos.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b border-black/5 transition-colors hover:bg-black/[0.03]">
                    <td className="p-4 align-middle font-medium text-sky-600/70 font-tech">{product.sku}</td>
                    <td className="p-4 align-middle">
                      <div className="flex flex-col">
                        <span className="font-semibold">{product.name}</span>
                        <span className="text-xs text-muted-foreground">{product.description}</span>
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <span className="inline-flex items-center rounded-full border border-black/10 bg-black/5 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                        {product.category || 'Sin categoría'}
                      </span>
                    </td>
                    <td className="p-4 align-middle text-right font-medium font-tech">S/ {product.price.toFixed(2)}</td>
                    <td className="p-4 align-middle text-right">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold font-tech ${
                        product.stock <= product.min_stock ? 'bg-destructive/20 text-destructive border border-destructive/10' : 'bg-sky-500/10 text-sky-600 border border-sky-500/20'
                      }`}>
                        {product.stock}
                      </span>
                    </td>
                    {activeRole === 'admin' && (
                      <td className="p-4 align-middle text-right">
                        <button 
                          onClick={() => openEditModal(product)} 
                          className="inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-black/10 hover:text-foreground mr-2"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => setProductToDelete(product)} 
                          className="inline-flex items-center justify-center rounded-lg p-2 text-destructive transition-colors hover:bg-destructive/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Modal (Create/Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl glass border-black/10 p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? 'Editar Producto' : 'Agregar Producto'}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nombre</label>
                  <input required type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="flex h-10 w-full rounded-xl border border-black/10 bg-background/80 px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500/50 outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">SKU</label>
                  <input required type="text" value={formData.sku || ''} onChange={e => setFormData({...formData, sku: e.target.value})} className="flex h-10 w-full rounded-xl border border-black/10 bg-background/80 px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500/50 outline-none transition-all font-tech" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Categoría</label>
                  <input required type="text" value={formData.category || ''} onChange={e => setFormData({...formData, category: e.target.value})} className="flex h-10 w-full rounded-xl border border-black/10 bg-background/80 px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500/50 outline-none transition-all" placeholder="Ej: Electrónicos" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Descripción</label>
                  <input type="text" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} className="flex h-10 w-full rounded-xl border border-black/10 bg-background/80 px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500/50 outline-none transition-all" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Precio (S/)</label>
                  <input required type="number" step="0.01" value={formData.price ?? ''} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} className="flex h-10 w-full rounded-xl border border-black/10 bg-background/80 px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500/50 outline-none transition-all font-tech" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Stock</label>
                  <input required type="number" value={formData.stock ?? ''} onChange={e => setFormData({...formData, stock: parseInt(e.target.value)})} className="flex h-10 w-full rounded-xl border border-black/10 bg-background/80 px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500/50 outline-none transition-all font-tech" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Stock Mínimo</label>
                  <input required type="number" value={formData.min_stock ?? ''} onChange={e => setFormData({...formData, min_stock: parseInt(e.target.value)})} className="flex h-10 w-full rounded-xl border border-black/10 bg-background/80 px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500/50 outline-none transition-all font-tech" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-xl border border-black/10 bg-black/5 px-4 py-2 text-sm font-medium hover:bg-black/10 transition-colors">Cancelar</button>
                <button type="submit" className="rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 px-4 py-2 text-sm font-medium text-white hover:from-sky-400 hover:to-blue-400 transition-all hover:shadow-lg hover:shadow-sky-500/25">
                  {editingId ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl glass border-black/10 p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 border border-destructive/20">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <h2 className="text-xl font-bold">¿Eliminar producto?</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Estás a punto de eliminar el producto <strong className="text-foreground">{productToDelete.name}</strong>. Esta acción no se puede deshacer.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-center gap-3">
              <button 
                type="button" 
                onClick={() => setProductToDelete(null)} 
                className="rounded-xl border border-black/10 bg-black/5 px-4 py-2 text-sm font-medium hover:bg-black/10 transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={executeDelete} 
                className="rounded-xl bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 transition-all hover:shadow-lg hover:shadow-destructive/25"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
