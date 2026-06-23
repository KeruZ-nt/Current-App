import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { parseRawList } from '../lib/parser';
import type { ParsedItem } from '../lib/parser';
import type { Product } from '../types';
import { useWorkspaceStore } from '../store/workspaceStore';
import { ArrowLeft, Check, PackagePlus, AlertCircle } from 'lucide-react';

export const Purchases = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const [rawText, setRawText] = useState('');
  const [items, setItems] = useState<ParsedItem[]>([]);
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const totalPurchases = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const { activeWorkspace } = useWorkspaceStore();

  // Load existing products to match
  useEffect(() => {
    if (activeWorkspace) {
      supabase.from('products').select('*').eq('workspace_id', activeWorkspace.id).then(({ data }) => {
        if (data) setDbProducts(data as Product[]);
      });
    }
  }, [activeWorkspace]);

  const handleAnalyze = () => {
    if (!rawText.trim()) return;
    
    const parsed = parseRawList(rawText);
    
    // Check against DB
    const mapped = parsed.map(item => {
      // Very simple text matching
      const exactMatch = dbProducts.find(p => p.name.toLowerCase() === item.name.toLowerCase());
      if (exactMatch) {
        return {
          ...item,
          status: 'existing' as const,
          dbProductId: exactMatch.id,
          sku: exactMatch.sku,
          category: exactMatch.category || '',
        };
      }
      return {
        ...item,
        status: 'new' as const,
        sku: `SKU-${Math.floor(Math.random() * 100000)}`,
        category: 'General',
      };
    });

    setItems(mapped);
    setStep(2);
  };

  const handleUpdateItem = (id: string, updates: Partial<ParsedItem>) => {
    setItems(items.map(it => it.id === id ? { ...it, ...updates } : it));
  };

  const processPurchase = async () => {
    setIsProcessing(true);
    const movementId = `MOV-${Date.now()}`;
    const newProductsToInsert: any[] = [];
    
    // 1. Prepare new products
    items.forEach(item => {
      if (item.status === 'new') {
        newProductsToInsert.push({
          workspace_id: activeWorkspace!.id,
          name: item.name,
          sku: item.sku,
          category: item.category,
          price: item.price, // using purchase price as initial sale price for simplicity
          stock: 0, // will be incremented by the transaction
          min_stock: 5,
        });
      }
    });

    let insertedProducts: Product[] = [];
    if (newProductsToInsert.length > 0) {
      const { data, error } = await supabase.from('products').insert(newProductsToInsert).select();
      if (error) {
        alert('Error creando nuevos productos: ' + error.message);
        setIsProcessing(false);
        return;
      }
      insertedProducts = data as Product[];
    }

    // 2. Prepare transactions and stock updates
    const transactionsToInsert: any[] = [];
    
    for (const item of items) {
      let productId = item.dbProductId;
      
      // If it was new, find the ID of the product we just inserted
      if (item.status === 'new') {
        const newlyInserted = insertedProducts.find(p => p.sku === item.sku);
        if (newlyInserted) productId = newlyInserted.id;
      }

      if (productId) {
        transactionsToInsert.push({
          workspace_id: activeWorkspace!.id,
          movement_id: movementId,
          product_id: productId,
          product_name_snapshot: item.name,
          type: 'purchase',
          quantity: item.quantity,
          total_price: item.price * item.quantity,
        });

        // Sum stock (Note: in a real app, an RPC function is better to avoid race conditions)
        const existingStock = dbProducts.find(p => p.id === productId)?.stock || 0;
        await supabase.from('products').update({ stock: existingStock + item.quantity }).eq('id', productId);
      }
    }

    // 3. Insert transactions
    const { error: txError } = await supabase.from('transactions').insert(transactionsToInsert);
    if (txError) {
      alert('Error guardando transacciones: ' + txError.message);
    } else {
      alert(`¡Compra procesada exitosamente! Lote: ${movementId}`);
      setStep(1);
      setRawText('');
      setItems([]);
      // Reload products
      const { data } = await supabase.from('products').select('*').eq('workspace_id', activeWorkspace!.id);
      if (data) setDbProducts(data as Product[]);
    }
    
    setIsProcessing(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ingreso Masivo (Compras)</h1>
        <p className="text-muted-foreground">Analiza y carga listas de productos enteros en un solo paso.</p>
      </div>

      {step === 1 && (
        <div className="rounded-2xl glass p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl"></div>
          <div className="mb-4 relative z-10">
            <h3 className="text-lg font-semibold">1. Pega tu lista de productos</h3>
            <p className="text-sm text-muted-foreground">Formato esperado por línea: <code>Cantidad | Nombre | Precio</code> o pegado directo desde Excel.</p>
          </div>
          
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Pega aquí el contenido de tu Excel (SKU, Cantidad, Precio Unitario, etc.)"
            className="w-full h-64 p-4 rounded-xl border border-black/10 bg-background/80 text-sm focus:ring-2 focus:ring-sky-500/50 mb-4 font-tech outline-none transition-all relative z-10"
          />
          
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setRawText('')}
              className="rounded-xl border border-black/10 bg-black/5 px-6 py-2.5 text-sm font-medium hover:bg-black/10 transition-colors"
            >
              Limpiar
            </button>
            <button
              onClick={handleAnalyze}
              disabled={!rawText.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 px-6 py-2.5 text-sm font-medium text-white transition-all hover:from-sky-400 hover:to-blue-400 hover:shadow-lg hover:shadow-sky-500/25 disabled:opacity-50 relative z-10"
            >
              Analizar Lista
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="flex justify-between items-center rounded-2xl glass p-4 shadow-xl">
            <button onClick={() => setStep(1)} className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" /> Volver a editar texto
            </button>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Total Compras Múltiples:</div>
                <div className="text-2xl font-bold text-sky-600 font-tech">S/ {totalPurchases.toFixed(2)}</div>
              </div>
              <button
                onClick={processPurchase}
                disabled={isProcessing}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 px-6 py-2.5 text-sm font-medium text-white transition-all hover:from-sky-400 hover:to-blue-400 hover:shadow-lg hover:shadow-sky-500/25 disabled:opacity-50"
              >
                {isProcessing ? 'Procesando...' : <><PackagePlus className="h-4 w-4" /> Procesar y Cargar Inventario</>}
              </button>
            </div>
          </div>

          <div className="rounded-2xl glass shadow-2xl overflow-hidden">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm min-w-[700px]">
                <thead className="[&_tr]:border-b border-black/5 bg-black/[0.02]">
                  <tr>
                    <th className="h-12 px-4 text-left font-medium">Estado</th>
                    <th className="h-12 px-4 text-left font-medium">Nombre detectado</th>
                    <th className="h-12 px-4 text-left font-medium">Categoría (Editable)</th>
                    <th className="h-12 px-4 text-left font-medium">SKU (Editable)</th>
                    <th className="h-12 px-4 text-right font-medium">Cant.</th>
                    <th className="h-12 px-4 text-right font-medium">Costo (S/)</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-black/5 hover:bg-black/[0.02] transition-colors">
                      <td className="p-4 align-middle">
                        {item.status === 'existing' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-2 py-1 text-xs font-semibold text-primary border border-primary/10">
                            <Check className="h-3 w-3" /> Existente
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-1 text-xs font-semibold text-amber-600 border border-amber-500/10">
                            <AlertCircle className="h-3 w-3" /> Nuevo
                          </span>
                        )}
                      </td>
                      <td className="p-4 align-middle font-medium">
                        <input 
                          type="text" 
                          value={item.name} 
                          onChange={(e) => handleUpdateItem(item.id, { name: e.target.value })}
                          className="flex h-10 w-full rounded-xl border border-black/10 bg-background/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all font-tech"
                        />
                      </td>
                      <td className="p-4 align-middle">
                        <input 
                          type="text" 
                          value={item.category} 
                          disabled={item.status === 'existing'}
                          onChange={(e) => handleUpdateItem(item.id, { category: e.target.value })}
                          className="flex h-9 w-full rounded-xl border border-black/10 bg-background/80 px-3 text-sm disabled:opacity-50 outline-none transition-all focus:ring-2 focus:ring-indigo-500/50"
                        />
                      </td>
                      <td className="p-4 align-middle">
                        <input 
                          type="text" 
                          value={item.sku} 
                          disabled={item.status === 'existing'}
                          onChange={(e) => handleUpdateItem(item.id, { sku: e.target.value })}
                          className="flex h-9 w-full rounded-xl border border-black/10 bg-background/80 px-3 text-sm disabled:opacity-50 outline-none transition-all focus:ring-2 focus:ring-indigo-500/50"
                        />
                      </td>
                      <td className="p-4 align-middle text-right">
                        <input 
                          type="number" 
                          value={item.quantity} 
                          onChange={(e) => handleUpdateItem(item.id, { quantity: parseInt(e.target.value) || 0 })}
                          className="flex h-9 w-20 ml-auto rounded-xl border border-black/10 bg-background/80 px-3 text-sm text-right outline-none transition-all focus:ring-2 focus:ring-indigo-500/50"
                        />
                      </td>
                      <td className="p-4 align-middle text-right">
                        <input 
                          type="number" 
                          step="0.01"
                          value={item.price} 
                          onChange={(e) => handleUpdateItem(item.id, { price: parseFloat(e.target.value) || 0 })}
                          className="flex h-9 w-24 ml-auto rounded-xl border border-black/10 bg-background/80 px-3 text-sm text-right outline-none transition-all focus:ring-2 focus:ring-indigo-500/50"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
