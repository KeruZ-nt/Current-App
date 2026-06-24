import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { parseRawList, findBestMatch } from '../lib/parser';
import { sanitizeError } from '../lib/errors';
import type { ParsedItem } from '../lib/parser';
import type { Product } from '../types';
import { useWorkspaceStore } from '../store/workspaceStore';
import { ArrowLeft, Check, AlertCircle, ShoppingCart } from 'lucide-react';

export const Sales = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const [rawText, setRawText] = useState('');
  const [items, setItems] = useState<ParsedItem[]>([]);
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const { activeWorkspace } = useWorkspaceStore();

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
    
    const mapped = parsed.map(item => {
      const bestMatch = findBestMatch(item.name, dbProducts);
      if (bestMatch) {
        const productData = dbProducts.find(p => p.id === bestMatch.id);
        return {
          ...item,
          status: 'existing' as const,
          dbProductId: bestMatch.id,
          name: productData ? productData.name : item.name, // Use DB name
          sku: productData?.sku,
          price: item.price || productData?.price || 0, // Fallback to DB price
        };
      }
      return {
        ...item,
        status: 'new' as const, // For sales, 'new' means 'unmatched'
        error: 'No encontrado'
      };
    });

    setItems(mapped);
    setStep(2);
  };

  const handleUpdateItem = (id: string, updates: Partial<ParsedItem>) => {
    const newItems = items.map(it => {
      if (it.id === id) {
        const updated = { ...it, ...updates };
        // If they manually selected a product ID, update the state
        if (updates.dbProductId) {
          const product = dbProducts.find(p => p.id === updates.dbProductId);
          if (product) {
            updated.name = product.name;
            updated.sku = product.sku;
            updated.status = 'existing';
            updated.error = undefined;
            if (!updated.price) updated.price = product.price;
          }
        }
        return updated;
      }
      return it;
    });
    setItems(newItems);
  };

  const processSale = async () => {
    // Validation
    for (const item of items) {
      if (!item.dbProductId) {
        alert(`Falta asignar el producto: "${item.rawLine}"`);
        return;
      }
      const product = dbProducts.find(p => p.id === item.dbProductId);
      if (!product) continue;
      if (product.stock < item.quantity) {
        alert(`Stock insuficiente para "${product.name}". Tienes ${product.stock} y quieres vender ${item.quantity}.`);
        return;
      }
    }

    setIsProcessing(true);
    const movementId = `VTA-${Date.now()}`;
    const transactionsToInsert: any[] = [];
    
    for (const item of items) {
      if (!item.dbProductId) continue;
      
      transactionsToInsert.push({
        workspace_id: activeWorkspace!.id,
        movement_id: movementId,
        product_id: item.dbProductId,
        product_name_snapshot: dbProducts.find(p => p.id === item.dbProductId)?.name || item.name,
        type: 'sale',
        quantity: item.quantity,
        total_price: item.price * item.quantity,
      });

      // Update stock atomically
      const product = dbProducts.find(p => p.id === item.dbProductId);
      if (product) {
        const { data: fresh } = await supabase
          .from('products')
          .select('stock')
          .eq('id', product.id)
          .single();
        if (fresh) {
          const { error: stockError } = await supabase
            .from('products')
            .update({ stock: fresh.stock - item.quantity })
            .eq('id', product.id)
            .gte('stock', item.quantity);
          if (stockError) {
            alert(sanitizeError(stockError));
            setIsProcessing(false);
            return;
          }
        }
      }
    }

    // Insert transactions
    const { error: txError } = await supabase.from('transactions').insert(transactionsToInsert);
    if (txError) {
      alert(sanitizeError(txError));
    } else {
      alert(`¡Venta procesada exitosamente! Ticket: ${movementId}`);
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
        <h1 className="text-3xl font-bold tracking-tight">Ventas Inteligentes</h1>
        <p className="text-muted-foreground">Pega tu lista de ventas del día y el sistema descontará el stock automáticamente.</p>
      </div>

      {step === 1 && (
        <div className="rounded-2xl glass p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl"></div>
          <div className="mb-4 relative z-10">
            <h3 className="text-lg font-semibold">1. Pega tu lista de ventas</h3>
            <p className="text-sm text-muted-foreground">Formato esperado por línea: <code>Cantidad | Nombre | Precio de venta c/u</code>.</p>
          </div>
          
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Ejemplo:
2  Teclados mecánicos   120
1  Mouse inalámbrico    45"
            className="w-full h-64 p-4 rounded-xl border border-black/10 bg-background/80 text-sm focus:ring-2 focus:ring-sky-500/50 mb-4 font-mono outline-none transition-all relative z-10 font-tech"
          />
          
          <div className="flex justify-end relative z-10 gap-2">
            <button
              onClick={() => setRawText('')}
              className="rounded-xl border border-black/10 bg-black/5 px-6 py-2.5 text-sm font-medium hover:bg-black/10 transition-colors"
            >
              Limpiar
            </button>
            <button
              onClick={handleAnalyze}
              disabled={!rawText.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-all hover:from-sky-400 hover:to-blue-500 hover:shadow-lg hover:shadow-sky-500/25 disabled:opacity-50"
            >
              Analizar Lista de Ventas
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="flex justify-between items-center rounded-2xl glass p-4 shadow-xl">
            <button onClick={() => setStep(1)} className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" /> Volver
            </button>
            <div className="flex items-center gap-4">
              <span className="text-sm"><strong>{items.length}</strong> ventas detectadas</span>
              <button
                onClick={processSale}
                disabled={isProcessing || items.some(i => !i.dbProductId)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-all hover:from-sky-400 hover:to-blue-500 hover:shadow-lg hover:shadow-sky-500/25 disabled:opacity-50"
              >
                {isProcessing ? 'Procesando...' : <><ShoppingCart className="h-4 w-4" /> Confirmar Venta</>}
              </button>
            </div>
          </div>

          <div className="rounded-2xl glass shadow-2xl overflow-hidden">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm min-w-[700px]">
                <thead className="[&_tr]:border-b border-black/5 bg-black/[0.02]">
                  <tr>
                    <th className="h-12 px-4 text-left font-medium w-12">Estado</th>
                    <th className="h-12 px-4 text-left font-medium">Asignar a Producto Real</th>
                    <th className="h-12 px-4 text-right font-medium w-24">Cant.</th>
                    <th className="h-12 px-4 text-right font-medium w-32">Precio (S/)</th>
                    <th className="h-12 px-4 text-right font-medium w-32">Total (S/)</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {items.map((item) => {
                    const matchedProduct = dbProducts.find(p => p.id === item.dbProductId);
                    const stockError = matchedProduct && matchedProduct.stock < item.quantity;

                    return (
                      <tr key={item.id} className="border-b border-black/5 hover:bg-black/[0.02] transition-colors">
                        <td className="p-4 align-middle">
                          {item.status === 'existing' ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-2 py-1 text-xs font-semibold text-primary border border-primary/10">
                              <Check className="h-3 w-3" /> OK
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-destructive/20 px-2 py-1 text-xs font-semibold text-destructive whitespace-nowrap border border-destructive/10">
                              <AlertCircle className="h-3 w-3" /> Sin Match
                            </span>
                          )}
                        </td>
                        <td className="p-4 align-middle">
                          <div className="space-y-1">
                            <select
                              value={item.dbProductId || ''}
                              onChange={(e) => handleUpdateItem(item.id, { dbProductId: e.target.value })}
                              className={`flex h-9 w-full rounded-xl border bg-background/80 px-3 text-sm outline-none transition-all ${!item.dbProductId ? 'border-destructive ring-1 ring-destructive' : 'border-black/10 focus:ring-2 focus:ring-sky-500/50'}`}
                            >
                              <option value="" disabled>-- Selecciona el producto --</option>
                              {dbProducts.map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.name} (Stock: {p.stock})
                                </option>
                              ))}
                            </select>
                            {stockError && (
                              <p className="text-xs text-destructive">¡Stock insuficiente! ({matchedProduct.stock} disp.)</p>
                            )}
                          </div>
                        </td>
                        <td className="p-4 align-middle text-right">
                          <input 
                            type="number" 
                            min="1"
                            value={item.quantity} 
                            onChange={(e) => handleUpdateItem(item.id, { quantity: parseInt(e.target.value) || 0 })}
                            className={`flex h-9 w-full rounded-xl border bg-background/80 px-3 text-sm text-right outline-none transition-all ${stockError ? 'border-destructive text-destructive' : 'border-black/10 focus:ring-2 focus:ring-sky-500/50'}`}
                          />
                        </td>
                        <td className="p-4 align-middle text-right">
                          <input 
                            type="number" 
                            step="0.01"
                            value={item.price} 
                            onChange={(e) => handleUpdateItem(item.id, { price: parseFloat(e.target.value) || 0 })}
                            className="flex h-9 w-full rounded-xl border border-black/10 bg-background/80 px-3 text-sm text-right outline-none transition-all focus:ring-2 focus:ring-sky-500/50 font-tech"
                          />
                        </td>
                        <td className="p-4 align-middle text-right font-bold font-tech">
                          S/ {(item.price * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
