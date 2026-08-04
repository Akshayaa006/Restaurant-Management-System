import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle2, Clock, CookingPot, Utensils, AlertTriangle, HelpCircle } from 'lucide-react';
import { useWebSocket } from '../hooks/useWebSocket';

const STATUS_STEPS = ['PENDING', 'PREPARING', 'READY', 'SERVED'];

const STEP_DETAILS = [
  {
    label: "Order Placed",
    desc: "Kitchen has received your order.",
    icon: Clock,
  },
  {
    label: "Preparing",
    desc: "Chef is cooking your fresh ingredients.",
    icon: CookingPot,
  },
  {
    label: "Ready",
    desc: "Order is ready for serving.",
    icon: CheckCircle2,
  },
  {
    label: "Served",
    desc: "Order has been served. Enjoy!",
    icon: Utensils,
  }
];

export default function OrderTrackingPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  // Fetch initial order state
  useEffect(() => {
    if (!orderId) return;
    
    fetch(`/api/v1/orders/${orderId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Order not found");
        return res.json();
      })
      .then((data) => {
        setOrder(data);
        setFetchError(false);
      })
      .catch(() => {
        setFetchError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [orderId]);

  // Hook up real-time websocket
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = orderId ? `${wsProtocol}//${window.location.host}/ws/orders/${orderId}` : null;

  const { isConnected } = useWebSocket(wsUrl, {
    onMessage: (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.event === 'order_updated' && payload.data.id === orderId) {
          setOrder(payload.data);
        }
      } catch (e) {
        console.error("Failed to parse socket update:", e);
      }
    }
  });

  if (loading) {
    return (
      <div className="max-w-md mx-auto bg-brand-50 min-h-screen flex flex-col items-center justify-center p-6 text-brand-900/60 font-semibold text-sm">
        <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin mb-3"></div>
        Retrieving order status...
      </div>
    );
  }

  if (fetchError || !order) {
    return (
      <div className="max-w-md mx-auto bg-brand-50 min-h-screen p-6 flex flex-col justify-center items-center text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-red-500" />
        <div>
          <h3 className="font-extrabold text-brand-900 text-lg">Order Not Found</h3>
          <p className="text-xs text-brand-900/60 mt-1">We couldn't locate this order in our system.</p>
        </div>
        <button 
          onClick={() => navigate('/')}
          className="bg-brand-900 text-brand-50 text-xs font-bold px-4 py-2.5 rounded-xl shadow hover:bg-brand-900/90 transition-colors"
        >
          Return to Menu
        </button>
      </div>
    );
  }

  const currentStepIndex = STATUS_STEPS.indexOf(order.status);
  const isCancelled = order.status === 'CANCELLED';

  return (
    <div className="max-w-md mx-auto bg-brand-50 min-h-screen pb-12 shadow-xl border-x border-brand-200/40">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-brand-200/50 px-4 py-4 flex items-center justify-between">
        <button 
          onClick={() => navigate('/')}
          className="bg-brand-50 hover:bg-brand-100 p-2 rounded-full transition-colors border border-brand-200/40"
        >
          <ChevronLeft className="w-4 h-4 text-brand-900" />
        </button>
        <h2 className="font-extrabold text-sm text-brand-900 tracking-tight font-brand uppercase">Order Tracker</h2>
        <div className="flex items-center gap-1.5 bg-brand-100 text-brand-900 text-[10px] font-bold px-2.5 py-1 rounded-full border border-brand-200/30">
          <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-400'}`} />
          {isConnected ? 'Live Connected' : 'Offline'}
        </div>
      </header>

      {/* Main details Card */}
      <div className="p-4 space-y-4">
        <div className="bg-white border border-brand-200/50 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-brand-900/40 uppercase tracking-wider">Order Reference ID</span>
              <p className="text-xs font-bold text-brand-900 font-mono mt-0.5">{order.id.slice(0, 8)}...{order.id.slice(-6)}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-brand-900/40 uppercase tracking-wider text-right block">Table</span>
              <p className="text-sm font-extrabold text-brand-900 mt-0.5">#{order.table_number}</p>
            </div>
          </div>

          <div className="border-t border-brand-100 pt-3 flex justify-between items-center text-xs">
            <span className="font-semibold text-brand-900/60">Estimated wait:</span>
            <span className="font-bold text-brand-900">~ 15 - 20 mins</span>
          </div>
        </div>

        {/* Stepper tracking */}
        {isCancelled ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center space-y-2">
            <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
            <h4 className="font-extrabold text-red-900 text-sm">Order Cancelled</h4>
            <p className="text-xs text-red-950/60 leading-relaxed">
              This order has been cancelled by the kitchen staff. Please contact dining waiters for updates.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-brand-200/50 rounded-2xl p-5 shadow-sm space-y-6">
            <h3 className="font-bold text-xs uppercase tracking-wider text-brand-900 pb-2 border-b border-brand-100">Live Progress</h3>
            
            <div className="relative pl-8 space-y-6">
              {/* Stepper vertical line indicator */}
              <div className="absolute left-[13px] top-1.5 bottom-1.5 w-0.5 bg-brand-200" />
              
              {STEP_DETAILS.map((step, idx) => {
                const isPassed = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                const StepIcon = step.icon;

                return (
                  <div key={idx} className="relative flex gap-4 transition-all">
                    {/* Circle icon */}
                    <div className={`absolute -left-[30px] top-0.5 w-7 h-7 rounded-full flex items-center justify-center border z-10 transition-colors ${
                      isCurrent 
                        ? 'bg-brand-900 border-brand-900 text-brand-50' 
                        : isPassed 
                        ? 'bg-brand-500 border-brand-500 text-brand-900' 
                        : 'bg-white border-brand-200 text-brand-900/30'
                    }`}>
                      <StepIcon className="w-3.5 h-3.5" />
                    </div>

                    {/* Text description */}
                    <div className="space-y-0.5">
                      <h4 className={`font-bold text-xs ${isPassed ? 'text-brand-900' : 'text-brand-900/40'}`}>
                        {step.label}
                      </h4>
                      <p className="text-[10px] text-brand-900/50 leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Items breakdown in tracking */}
        <div className="bg-white border border-brand-200/50 rounded-2xl p-5 shadow-sm space-y-3">
          <h3 className="font-bold text-xs uppercase tracking-wider text-brand-900 pb-2 border-b border-brand-100">Items Summary</h3>
          <div className="divide-y divide-brand-100 space-y-2">
            {order.items.map((item: any, idx: number) => (
              <div key={idx} className="pt-2 flex justify-between gap-3 text-xs">
                <div>
                  <div className="font-bold text-brand-900">Qty {item.quantity} × {item.menu_item_id.slice(0,4)}...</div>
                  {Object.keys(item.selected_options).length > 0 && (
                    <div className="text-[10px] text-brand-900/50 flex flex-wrap gap-1 leading-relaxed mt-0.5">
                      {Object.entries(item.selected_options).map(([grp, opt]) => (
                        <span key={grp} className="bg-brand-100 px-1 py-0.5 rounded">
                          {grp}: {Array.isArray(opt) ? (opt as any).join(', ') : (opt as any)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="font-bold text-brand-900/75 shrink-0">${(item.item_price * item.quantity).toFixed(2)}</div>
              </div>
            ))}
          </div>

          <div className="border-t border-brand-100 pt-3 space-y-1 text-xs">
            <div className="flex justify-between text-brand-900/60">
              <span>Subtotal</span>
              <span className="font-semibold">${order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-brand-900/60">
              <span>Sales Tax (10%)</span>
              <span className="font-semibold">${order.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-brand-900 font-bold text-sm pt-2 border-t border-brand-100">
              <span>Total Price</span>
              <span>${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
