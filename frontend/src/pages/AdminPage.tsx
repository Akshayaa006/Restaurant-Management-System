import { useState, useEffect } from 'react';
import { Play, Check, CheckSquare, Trash, BarChart3, TrendingUp, ShoppingBag, Loader, ArrowRight } from 'lucide-react';
import { useWebSocket } from '../hooks/useWebSocket';

export default function AdminPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeTick, setTimeTick] = useState(new Date());

  // Periodically refresh timers on KDS cards every 30s
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeTick(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Fetch initial orders
  useEffect(() => {
    fetch('/api/v1/admin/orders')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setOrders(data);
        }
      })
      .catch((e) => console.error("Error fetching orders:", e))
      .finally(() => setLoading(false));
  }, []);

  // Real-time updates via WebSocket (Kitchen endpoint)
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${wsProtocol}//${window.location.host}/ws/kitchen`;

  useWebSocket(wsUrl, {
    onMessage: (event) => {
      try {
        const payload = JSON.parse(event.data);
        const eventType = payload.event;
        const orderData = payload.data;

        if (eventType === 'order_created') {
          // Add new order if not already in list
          setOrders((prev) => {
            if (prev.some((o) => o.id === orderData.id)) return prev;
            return [...prev, orderData];
          });
        } else if (eventType === 'order_updated') {
          // Update existing order status
          setOrders((prev) =>
            prev.map((o) => (o.id === orderData.id ? orderData : o))
          );
        }
      } catch (e) {
        console.error("Error parsing kitchen socket payload:", e);
      }
    }
  });

  // Advance Order Status Trigger
  const handleUpdateStatus = async (orderId: string, nextStatus: string) => {
    try {
      const response = await fetch(`/api/v1/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (response.ok) {
        const updated = await response.json();
        setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      }
    } catch (e) {
      console.error("Error updating order status:", e);
    }
  };

  // Helper to determine elapsed minutes
  const getElapsedMinutes = (createdTime: string) => {
    const diff = timeTick.getTime() - new Date(createdTime).getTime();
    return Math.floor(diff / 60000);
  };

  // Helper to color-code KDS timer cards
  const getTimerStyles = (mins: number) => {
    if (mins < 10) return "bg-green-50 text-green-700 border-green-200";
    if (mins < 20) return "bg-amber-50 text-amber-700 border-amber-200 animate-pulse";
    return "bg-red-50 text-red-700 border-red-200 animate-bounce";
  };

  // Filter lists for Kanban columns
  const pendingOrders = orders.filter((o) => o.status === 'PENDING');
  const preparingOrders = orders.filter((o) => o.status === 'PREPARING');
  const readyOrders = orders.filter((o) => o.status === 'READY');

  // Compute analytics metrics
  const activeOrdersCount = orders.filter(
    (o) => o.status === 'PENDING' || o.status === 'PREPARING' || o.status === 'READY'
  ).length;

  const servedOrders = orders.filter((o) => o.status === 'SERVED');
  const dailyRevenue = servedOrders.reduce((sum, o) => sum + o.total, 0);

  // Calculate top items counts
  const itemCounts: Record<string, number> = {};
  orders.forEach((o) => {
    o.items.forEach((item: any) => {
      // Since MongoDB ID is stored, count by ID
      const name = item.menu_item_id.slice(0, 8); // fallback to ID snippet for identification
      itemCounts[name] = (itemCounts[name] || 0) + item.quantity;
    });
  });
  const topItems = Object.entries(itemCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-50 flex flex-col items-center justify-center text-brand-900/60 font-semibold text-sm">
        <Loader className="w-6 h-6 animate-spin mb-2" />
        Loading Kitchen Display System...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-50 p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-brand-200/50 pb-6">
        <div>
          <h1 className="font-extrabold text-3xl font-brand text-brand-900 tracking-tight">KITCHEN DISPLAY BOARD</h1>
          <p className="text-sm text-brand-900/60 font-semibold mt-0.5">Real-time KDS Kanban & Store Metrics Control</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => window.open('/', '_blank')}
            className="bg-white border border-brand-200 hover:bg-brand-100 text-brand-900 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
          >
            Open Menu <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Analytics widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Gross Revenue widget */}
        <div className="bg-white border border-brand-200/50 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-brand-100 rounded-xl text-brand-900">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-brand-900/40 uppercase tracking-wider block">Today's Revenue</span>
            <span className="text-xl font-extrabold text-brand-900">${dailyRevenue.toFixed(2)}</span>
          </div>
        </div>

        {/* Active Orders Count widget */}
        <div className="bg-white border border-brand-200/50 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-brand-100 rounded-xl text-brand-900">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-brand-900/40 uppercase tracking-wider block">Active Queue</span>
            <span className="text-xl font-extrabold text-brand-900">{activeOrdersCount} orders</span>
          </div>
        </div>

        {/* Top Selling Items widget */}
        <div className="bg-white border border-brand-200/50 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-brand-100 rounded-xl text-brand-900">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div className="flex-grow">
            <span className="text-[10px] font-bold text-brand-900/40 uppercase tracking-wider block">Popular Items</span>
            <div className="flex gap-2 mt-1">
              {topItems.length > 0 ? (
                topItems.map(([id, qty]) => (
                  <span key={id} className="bg-brand-50 text-brand-900/70 border border-brand-200/40 text-[10px] font-bold px-2 py-0.5 rounded">
                    ID {id}: {qty} sold
                  </span>
                ))
              ) : (
                <span className="text-[10px] text-brand-900/40 font-semibold">No sales recorded today</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column 1: Pending */}
        <div className="bg-brand-100/40 border border-brand-200/40 rounded-2xl p-4 flex flex-col min-h-[60vh] space-y-4">
          <div className="flex items-center justify-between border-b border-brand-200/50 pb-2">
            <h3 className="font-bold text-sm text-brand-900/80 uppercase tracking-wider">Pending</h3>
            <span className="bg-brand-900 text-brand-50 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {pendingOrders.length}
            </span>
          </div>
          <div className="space-y-3 overflow-y-auto flex-grow">
            {pendingOrders.map((order) => {
              const elapsed = getElapsedMinutes(order.created_at);
              return (
                <div key={order.id} className="bg-white border border-brand-200/50 rounded-xl p-4 shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-sm text-brand-900">Table #{order.table_number}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getTimerStyles(elapsed)}`}>
                      {elapsed} mins ago
                    </span>
                  </div>
                  
                  {/* Items list */}
                  <ul className="text-xs space-y-1.5 border-y border-dashed border-brand-100 py-2.5">
                    {order.items.map((item: any, idx: number) => (
                      <li key={idx} className="text-brand-900/80 font-medium">
                        <span className="font-bold text-brand-900">×{item.quantity}</span> {item.menu_item_id.slice(0, 8)}
                        {Object.keys(item.selected_options).length > 0 && (
                          <div className="text-[9px] text-brand-900/40 font-semibold pl-4">
                            {Object.entries(item.selected_options).map(([grp, opt]) => (
                              <span key={grp} className="mr-1">{grp}: {Array.isArray(opt) ? (opt as any).join(', ') : (opt as any)}</span>
                            ))}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                      className="flex-grow bg-brand-900 hover:bg-brand-900/90 text-brand-50 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-sm"
                    >
                      <Play className="w-3.5 h-3.5" /> Start Cooking
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'CANCELLED')}
                      className="border border-red-200 hover:bg-red-50 text-red-500 p-2 rounded-lg transition-colors"
                      title="Cancel Order"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 2: Preparing */}
        <div className="bg-brand-100/40 border border-brand-200/40 rounded-2xl p-4 flex flex-col min-h-[60vh] space-y-4">
          <div className="flex items-center justify-between border-b border-brand-200/50 pb-2">
            <h3 className="font-bold text-sm text-brand-900/80 uppercase tracking-wider">Preparing</h3>
            <span className="bg-brand-900 text-brand-50 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {preparingOrders.length}
            </span>
          </div>
          <div className="space-y-3 overflow-y-auto flex-grow">
            {preparingOrders.map((order) => {
              const elapsed = getElapsedMinutes(order.created_at);
              return (
                <div key={order.id} className="bg-white border border-brand-200/50 rounded-xl p-4 shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-sm text-brand-900">Table #{order.table_number}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getTimerStyles(elapsed)}`}>
                      {elapsed} mins ago
                    </span>
                  </div>
                  
                  {/* Items list */}
                  <ul className="text-xs space-y-1.5 border-y border-dashed border-brand-100 py-2.5">
                    {order.items.map((item: any, idx: number) => (
                      <li key={idx} className="text-brand-900/80 font-medium">
                        <span className="font-bold text-brand-900">×{item.quantity}</span> {item.menu_item_id.slice(0, 8)}
                        {Object.keys(item.selected_options).length > 0 && (
                          <div className="text-[9px] text-brand-900/40 font-semibold pl-4">
                            {Object.entries(item.selected_options).map(([grp, opt]) => (
                              <span key={grp} className="mr-1">{grp}: {Array.isArray(opt) ? (opt as any).join(', ') : (opt as any)}</span>
                            ))}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleUpdateStatus(order.id, 'READY')}
                    className="w-full bg-brand-500 hover:bg-brand-600 text-brand-900 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" /> Set Ready
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 3: Ready */}
        <div className="bg-brand-100/40 border border-brand-200/40 rounded-2xl p-4 flex flex-col min-h-[60vh] space-y-4">
          <div className="flex items-center justify-between border-b border-brand-200/50 pb-2">
            <h3 className="font-bold text-sm text-brand-900/80 uppercase tracking-wider">Ready</h3>
            <span className="bg-brand-900 text-brand-50 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {readyOrders.length}
            </span>
          </div>
          <div className="space-y-3 overflow-y-auto flex-grow">
            {readyOrders.map((order) => {
              const elapsed = getElapsedMinutes(order.created_at);
              return (
                <div key={order.id} className="bg-white border border-brand-200/50 rounded-xl p-4 shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-sm text-brand-900">Table #{order.table_number}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getTimerStyles(elapsed)}`}>
                      {elapsed} mins ago
                    </span>
                  </div>
                  
                  {/* Items list */}
                  <ul className="text-xs space-y-1.5 border-y border-dashed border-brand-100 py-2.5">
                    {order.items.map((item: any, idx: number) => (
                      <li key={idx} className="text-brand-900/80 font-medium">
                        <span className="font-bold text-brand-900">×{item.quantity}</span> {item.menu_item_id.slice(0, 8)}
                        {Object.keys(item.selected_options).length > 0 && (
                          <div className="text-[9px] text-brand-900/40 font-semibold pl-4">
                            {Object.entries(item.selected_options).map(([grp, opt]) => (
                              <span key={grp} className="mr-1">{grp}: {Array.isArray(opt) ? (opt as any).join(', ') : (opt as any)}</span>
                            ))}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleUpdateStatus(order.id, 'SERVED')}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-sm"
                  >
                    <CheckSquare className="w-3.5 h-3.5" /> Serve Order
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
