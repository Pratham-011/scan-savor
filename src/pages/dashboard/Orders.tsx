import { useCallback, useEffect, useMemo, useState } from 'react';
import { BellRing, CheckCircle2, ChefHat, Clock, RefreshCcw, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { orderApi, tableApi, buildTableLabelMap, resolveTableLabel, type CustomerOrder } from '@/lib/api';

const statusOptions: CustomerOrder['status'][] = ['new', 'accepted', 'preparing', 'ready', 'served', 'cancelled'];

const statusLabel: Record<CustomerOrder['status'], string> = {
  new: 'New',
  accepted: 'Accepted',
  preparing: 'Preparing',
  ready: 'Ready',
  served: 'Served',
  cancelled: 'Cancelled',
};

const statusClass: Record<CustomerOrder['status'], string> = {
  new: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
  accepted: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
  preparing: 'bg-orange-500/15 text-orange-600 border-orange-500/30',
  ready: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
  served: 'bg-muted text-muted-foreground border-border',
  cancelled: 'bg-destructive/15 text-destructive border-destructive/30',
};

const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN')}`;

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));

export default function Orders() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [tableLabelMap, setTableLabelMap] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadOrders = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const nextOrders = await orderApi.getAll();
      setOrders(nextOrders);
    } catch (error) {
      toast({ title: 'Failed to load orders', variant: 'destructive' });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [toast]);

  const loadTableLabels = useCallback(() => {
    tableApi.getAll().then(tables => setTableLabelMap(buildTableLabelMap(tables))).catch(() => {});
  }, []);

  useEffect(() => {
    loadTableLabels();
  }, [loadTableLabels]);

  useEffect(() => {
    loadOrders();
    const interval = window.setInterval(() => loadOrders(), 10000);
    const handleOrderChange = () => loadOrders();

    window.addEventListener('oneqr-local-order-created', handleOrderChange);
    window.addEventListener('oneqr-order-status-changed', handleOrderChange);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('oneqr-local-order-created', handleOrderChange);
      window.removeEventListener('oneqr-order-status-changed', handleOrderChange);
    };
  }, [loadOrders]);

  const summary = useMemo(() => {
    const active = orders.filter(order => !['served', 'cancelled'].includes(order.status));
    return {
      newOrders: orders.filter(order => order.status === 'new').length,
      activeOrders: active.length,
      totalSales: orders
        .filter(order => order.status !== 'cancelled')
        .reduce((sum, order) => sum + order.total, 0),
    };
  }, [orders]);

  const handleStatusChange = async (order: CustomerOrder, status: CustomerOrder['status']) => {
    const previousOrders = orders;
    setOrders(current => current.map(row => row._id === order._id ? { ...row, status } : row));

    try {
      const updatedOrder = await orderApi.updateStatus(order._id, status);
      setOrders(current => current.map(row => row._id === order._id ? updatedOrder : row));
    } catch {
      setOrders(previousOrders);
      toast({ title: 'Could not update order', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-52" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map(item => <Skeleton key={item} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Orders</h1>
          <p className="text-sm text-muted-foreground">Incoming table orders from ordering QR menus.</p>
        </div>
        <Button variant="outline" onClick={() => loadOrders()} disabled={isRefreshing}>
          <RefreshCcw className={cn('mr-2 h-4 w-4', isRefreshing && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard icon={BellRing} label="New Orders" value={summary.newOrders} />
        <SummaryCard icon={ChefHat} label="Active Orders" value={summary.activeOrders} />
        <SummaryCard icon={CheckCircle2} label="Sales" value={formatCurrency(summary.totalSales)} />
      </div>

      {orders.length === 0 ? (
        <div className="glass rounded-xl p-10 text-center">
          <Clock className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">No orders yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Orders will appear here as soon as customers submit them.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order._id} className="glass rounded-xl p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold">
                      Table {resolveTableLabel(tableLabelMap, order.locationIdentifier)}
                    </h2>
                    <Badge variant="outline" className={statusClass[order.status]}>{statusLabel[order.status]}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)} · Order #{order._id.slice(-6)}</p>
                </div>
                <p className="text-2xl font-bold text-primary">{formatCurrency(order.total)}</p>
              </div>

              <div className="mt-4 space-y-3">
                {order.items.map((item, index) => (
                  <div key={`${order._id}-${item.menuItem}-${index}`} className="rounded-lg bg-secondary/40 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{item.quantity} x {item.name}</p>
                        {item.addOns.length > 0 && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Add-ons: {item.addOns.map(addOn => `${addOn.name} ${formatCurrency(addOn.price)}`).join(', ')}
                          </p>
                        )}
                        {item.note && <p className="mt-1 text-xs text-muted-foreground">Note: {item.note}</p>}
                      </div>
                      <p className="whitespace-nowrap text-sm font-semibold">{formatCurrency(item.total)}</p>
                    </div>
                  </div>
                ))}
                {order.note && (
                  <div className="rounded-lg border border-border/70 p-3 text-sm">
                    <span className="font-medium">Kitchen note:</span> {order.note}
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {statusOptions.map(status => (
                  <Button
                    key={status}
                    type="button"
                    variant={order.status === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleStatusChange(order, status)}
                  >
                    {status === 'cancelled' && <XCircle className="mr-1 h-3.5 w-3.5" />}
                    {statusLabel[status]}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value }: { icon: any; label: string; value: number | string }) {
  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
        </div>
        <div className="rounded-lg bg-primary/10 p-3">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </div>
  );
}
