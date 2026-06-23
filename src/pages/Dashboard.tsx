import { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { 
  DollarSign, 
  ArrowRightLeft, 
  AlertTriangle,
  Calendar as CalendarIcon,
  TrendingUp,
  TrendingDown,
  Loader2
} from 'lucide-react';

/**
 * Componente Dashboard
 * Vista principal del almacén activo que muestra un resumen ejecutivo.
 * Calcula ingresos, gastos, métricas en tiempo real y gráficos.
 */
import { supabase } from '../lib/supabase';
import type { Product, Transaction } from '../types';
import { useWorkspaceStore } from '../store/workspaceStore';

export const Dashboard = () => {
  const { activeWorkspace } = useWorkspaceStore();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  
  // Resumen del mes actual
  const [currentMonthSales, setCurrentMonthSales] = useState(0);
  const [currentMonthPurchases, setCurrentMonthPurchases] = useState(0);

  // Lista reciente
  const [recentMovements, setRecentMovements] = useState<any[]>([]);

  useEffect(() => {
    /**
     * Obtiene los productos (para calcular stock crítico) y 
     * las transacciones (para calcular ingresos/gastos y poblar el gráfico).
     */
    const fetchData = async () => {
      if (!activeWorkspace) return;
      setLoading(true);
      
      // 1. Obtener productos
      const { data: prodData } = await supabase.from('products').select('*').eq('workspace_id', activeWorkspace.id);
      if (prodData) setProducts(prodData as Product[]);

      // 2. Obtener transacciones
      const { data: txData } = await supabase.from('transactions').select('*, product:products(*)').eq('workspace_id', activeWorkspace.id).order('created_at', { ascending: false });
      
      if (txData) {
        const txs = txData as Transaction[];

        // Calcular mes actual
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        let mSales = 0;
        let mPurchases = 0;

        txs.forEach(tx => {
          const d = new Date(tx.created_at || '');
          if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
            if (tx.type === 'sale') mSales += Number(tx.total_price || 0);
            if (tx.type === 'purchase') mPurchases += Number(tx.total_price || 0);
          }
        });

        setCurrentMonthSales(mSales);
        setCurrentMonthPurchases(mPurchases);

        // Construir data del gráfico (Agrupado por mes)
        const monthlyData = new Map<string, { name: string, Ventas: number, Compras: number }>();
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        
        // Inicializar últimos 6 meses
        for(let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = `${d.getFullYear()}-${d.getMonth()}`;
          monthlyData.set(key, { name: monthNames[d.getMonth()], Ventas: 0, Compras: 0 });
        }

        txs.forEach(tx => {
          const d = new Date(tx.created_at || '');
          const key = `${d.getFullYear()}-${d.getMonth()}`;
          if (monthlyData.has(key)) {
            const entry = monthlyData.get(key)!;
            if (tx.type === 'sale') entry.Ventas += Number(tx.total_price || 0);
            if (tx.type === 'purchase') entry.Compras += Number(tx.total_price || 0);
          }
        });

        setChartData(Array.from(monthlyData.values()));

        // Obtener movimientos recientes agrupados (Lotes) filtrados
        const grouped = new Map<string, any>();
        txData.forEach((tx: any) => { 
          if (!['sale', 'purchase', 'creation'].includes(tx.type)) return;
          
          const mId = tx.movement_id || tx.id;
          if (!grouped.has(mId)) {
            grouped.set(mId, {
              id: mId,
              type: tx.type,
              date: tx.created_at,
              itemsCount: 0,
              totalValue: 0
            });
          }
          const group = grouped.get(mId)!;
          group.itemsCount += 1;
          if (tx.type === 'sale' || tx.type === 'purchase') {
            group.totalValue += Number(tx.total_price || 0);
          }
        });
        // Sort by date descending and take top 10
        const sortedMovements = Array.from(grouped.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setRecentMovements(sortedMovements.slice(0, 10)); // Mostrar 10 en el dashboard
      }
      
      setLoading(false);
    };

    if (activeWorkspace) {
      fetchData();
    }
  }, [activeWorkspace]);

  const lowStockItems = products.filter(p => p.stock <= p.min_stock);
  const balance = currentMonthSales - currentMonthPurchases;

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-12 text-muted-foreground animate-pulse gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p>Calculando métricas del dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="absolute inset-0 bg-grid pointer-events-none opacity-[0.03]"></div>
      <div className="relative z-10">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Resumen general de tu inventario y movimientos.
        </p>
      </div>

      {/* Tarjetas de Métricas */}
      <div className="relative z-10 grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div className="group relative overflow-hidden rounded-2xl rounded-tl-[2rem] glass glass-hover p-5 sm:p-6 border-t-2 border-t-cyan-500/20">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-sky-500/10 transition-transform group-hover:scale-150 blur-2xl"></div>
          <div className="relative flex items-center justify-between space-y-0 pb-4">
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground uppercase tracking-widest text-xs">Ingresos Totales</h3>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-500/20">
              <DollarSign className="h-5 w-5 text-sky-600" />
            </div>
          </div>
          <div className="relative text-3xl font-bold text-foreground font-tech">S/ {currentMonthSales.toFixed(2)}</div>
          <p className="relative mt-1 text-xs text-muted-foreground">Dinero entrante este mes</p>
        </div>

        <div className="group relative overflow-hidden rounded-2xl glass glass-hover p-5 sm:p-6 border-t-2 border-t-blue-500/20">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-blue-500/10 transition-transform group-hover:scale-150 blur-2xl"></div>
          <div className="relative flex items-center justify-between space-y-0 pb-4">
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground uppercase tracking-widest text-xs">Gastos Totales</h3>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20">
              <ArrowRightLeft className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <div className="relative text-3xl font-bold text-foreground font-tech">S/ {currentMonthPurchases.toFixed(2)}</div>
          <p className="relative mt-1 text-xs text-muted-foreground">Dinero gastado en compras</p>
        </div>

        <div className="group relative overflow-hidden rounded-2xl glass glass-hover p-5 sm:p-6 border-t-2 border-t-emerald-500/20">
          <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full transition-transform group-hover:scale-150 blur-2xl ${balance >= 0 ? 'bg-emerald-500/10' : 'bg-destructive/10'}`}></div>
          <div className="relative flex items-center justify-between space-y-0 pb-4">
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground uppercase tracking-widest text-xs">Balance del Mes</h3>
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl border border-black/5 ${balance >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-destructive/10 border-destructive/20'}`}>
              {balance >= 0 ? <TrendingUp className="h-5 w-5 text-emerald-400" /> : <TrendingDown className="h-5 w-5 text-destructive" />}
            </div>
          </div>
          <div className={`relative text-3xl font-bold font-tech ${balance >= 0 ? 'text-emerald-400' : 'text-destructive'}`}>
            {balance >= 0 ? '+' : ''}S/ {balance.toFixed(2)}
          </div>
          <p className="relative mt-1 text-xs text-muted-foreground">{balance >= 0 ? 'El mes es rentable' : 'Más gastos que ingresos'}</p>
        </div>

        <div className="group relative overflow-hidden rounded-2xl rounded-br-[2rem] glass glass-hover border-t-2 border-t-amber-500/20 p-5 sm:p-6">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-amber-500/20 transition-transform group-hover:scale-150 blur-2xl"></div>
          <div className="relative flex items-center justify-between space-y-0 pb-4">
            <h3 className="tracking-tight text-sm font-medium text-amber-600 uppercase tracking-widest text-xs">Alertas de Stock</h3>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
          </div>
          <div className="relative text-3xl font-bold text-amber-600 font-tech">{lowStockItems.length}</div>
          <p className="relative mt-1 text-xs text-muted-foreground">Productos por debajo del mínimo</p>
        </div>
      </div>

      <div className="relative z-10 grid gap-4 grid-cols-1 lg:grid-cols-5">
        
        {/* Gráfico Comparativo Mensual */}
        <div className="rounded-2xl rounded-bl-[2rem] glass p-4 sm:p-6 lg:col-span-3 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-3xl rounded-full"></div>
          <div className="mb-4 relative z-10">
            <h3 className="font-semibold leading-none tracking-tight">Comparativa de Ventas vs Compras (Últimos 6 meses)</h3>
            <p className="text-sm text-muted-foreground">Tendencia de ingresos y gastos</p>
          </div>
          <div className="h-[300px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `S/ ${value}`} style={{ fontFamily: 'Space Grotesk' }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(12px)', borderColor: 'rgba(0,0,0,0.1)', borderRadius: '12px', color: '#0f172a', fontFamily: 'Space Grotesk' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="Ventas" fill="url(#colorVentas)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Compras" fill="url(#colorCompras)" radius={[4, 4, 0, 0]} />
                <defs>
                  <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f2fe" stopOpacity={1}/>
                    <stop offset="95%" stopColor="#4facfe" stopOpacity={0.4}/>
                  </linearGradient>
                  <linearGradient id="colorCompras" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4facfe" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#00f2fe" stopOpacity={0.2}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Panel de Alertas y Balance */}
        <div className="rounded-2xl glass p-4 sm:p-6 lg:col-span-2 space-y-6 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-primary/10 blur-3xl"></div>
          
          {/* Calendario de Movimientos Recientes */}
          <div className="flex-1 relative">
            <div className="mb-4">
              <h3 className="font-semibold leading-none tracking-tight flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                  <CalendarIcon className="h-4 w-4 text-foreground" />
                </div>
                Últimos Movimientos
              </h3>
            </div>
            <div className="space-y-4">
              {recentMovements.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No hay movimientos recientes.</p>
              ) : (
                recentMovements.map((mov) => (
                  <div key={mov.id} className="group flex items-center justify-between rounded-xl p-3 hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${mov.type === 'sale' ? 'bg-primary/10 text-primary' : mov.type === 'purchase' ? 'bg-secondary/20 text-secondary-foreground' : 'bg-blue-500/10 text-blue-600'}`}>
                        {mov.type === 'sale' ? <TrendingUp className="h-4 w-4" /> : mov.type === 'purchase' ? <TrendingDown className="h-4 w-4" /> : <CalendarIcon className="h-4 w-4" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold capitalize">
                          {mov.type === 'sale' ? 'Venta' : mov.type === 'purchase' ? 'Compra Masiva' : 'Ingreso Nuevo'}
                        </span>
                        <span className="text-xs text-muted-foreground font-medium">
                          {new Date(mov.date).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })} - {mov.itemsCount} item(s)
                        </span>
                      </div>
                    </div>
                    {(mov.type === 'sale' || mov.type === 'purchase') && (
                      <span className={`text-sm font-bold font-tech ${mov.type === 'sale' ? 'text-sky-600' : 'text-foreground'}`}>
                        {mov.type === 'sale' ? '+' : '-'} S/ {mov.totalValue.toFixed(2)}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="border-t pt-6">
            <div className="mb-4">
              <h3 className="font-semibold leading-none tracking-tight">Stock Crítico</h3>
            </div>
            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
              {lowStockItems.length === 0 ? (
                <div className="text-center text-xs text-muted-foreground py-4">
                  Inventario en niveles óptimos.
                </div>
              ) : (
                lowStockItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-xl border border-black/5 p-3 bg-black/[0.02]">
                    <div className="flex flex-col truncate pr-2">
                      <span className="text-sm font-medium truncate">{item.name}</span>
                    </div>
                    <div className="flex h-7 px-2 min-w-7 shrink-0 items-center justify-center rounded bg-amber-500/20 text-amber-600 text-xs font-bold border border-amber-500/20 font-tech">
                      {item.stock}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};
