import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardSidebar } from './DashboardSidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { useCallback, useEffect, useRef, useState } from 'react';
import { orderApi, tableApi, buildTableLabelMap, resolveTableLabel } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const RING_REPEAT_MS = 3500;

const ringOrderTone = () => {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return;

  const audioContext = new AudioContextClass();
  const notes = [740, 988, 740, 988];

  notes.forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime + index * 0.16);
    gain.gain.exponentialRampToValueAtTime(0.18, audioContext.currentTime + index * 0.16 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + index * 0.16 + 0.12);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(audioContext.currentTime + index * 0.16);
    oscillator.stop(audioContext.currentTime + index * 0.16 + 0.13);
  });
};

export function DashboardLayout() {
  const { user, isLoading } = useAuth();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const seenOrderIds = useRef<Set<string>>(new Set());
  const hasLoadedOnce = useRef(false);
  const ringIntervalRef = useRef<number | null>(null);
  const [tableLabelMap, setTableLabelMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!user) return;
    tableApi.getAll().then(tables => setTableLabelMap(buildTableLabelMap(tables))).catch(() => {});
  }, [user]);

  const stopRinging = useCallback(() => {
    if (ringIntervalRef.current !== null) {
      window.clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
  }, []);

  const startRinging = useCallback(() => {
    if (ringIntervalRef.current !== null) return;
    ringOrderTone();
    ringIntervalRef.current = window.setInterval(ringOrderTone, RING_REPEAT_MS);
  }, []);

  const checkForNewOrders = useCallback(async (notify = true) => {
    if (!user) return;

    const orders = await orderApi.getAll().catch(() => []);
    const freshOrders = orders.filter(order => order.status === 'new' && !seenOrderIds.current.has(order._id));

    if (notify && hasLoadedOnce.current && freshOrders.length > 0) {
      const firstOrder = freshOrders[0];
      toast({
        title: 'New order arrived',
        description: `Table ${resolveTableLabel(tableLabelMap, firstOrder.locationIdentifier)} · ₹${firstOrder.total.toLocaleString('en-IN')}`,
      });
    }

    seenOrderIds.current = new Set(orders.map(order => order._id));
    hasLoadedOnce.current = true;

    // Keep ringing for as long as any order is still sitting unhandled ("new") —
    // it only stops once the admin accepts/cancels/updates it, not on a timer.
    const hasUnhandledOrders = orders.some(order => order.status === 'new');
    if (hasUnhandledOrders) {
      startRinging();
    } else {
      stopRinging();
    }
  }, [tableLabelMap, startRinging, stopRinging, toast, user]);

  useEffect(() => {
    if (!user) return;

    checkForNewOrders(false);
    const interval = window.setInterval(() => checkForNewOrders(true), 8000);
    const handleNewOrder = () => checkForNewOrders(true);
    const handleOrderChange = () => checkForNewOrders(false);

    window.addEventListener('oneqr-local-order-created', handleNewOrder);
    window.addEventListener('oneqr-local-order-updated', handleOrderChange);
    window.addEventListener('oneqr-order-status-changed', handleOrderChange);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('oneqr-local-order-created', handleNewOrder);
      window.removeEventListener('oneqr-local-order-updated', handleOrderChange);
      window.removeEventListener('oneqr-order-status-changed', handleOrderChange);
      stopRinging();
    };
  }, [checkForNewOrders, stopRinging, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col md:flex-row w-full">
        {/* Sidebar skeleton */}
        <div className="hidden md:block w-64 border-r border-border p-4 space-y-4">
          <Skeleton className="h-8 w-32 mb-6" />
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
        {/* Content skeleton */}
        <div className="flex-1 p-6 lg:p-8 space-y-6">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-28 rounded-lg" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row w-full">
      <DashboardSidebar />
      <main 
        className={cn(
          "flex-1 p-4 sm:p-6 lg:p-8 w-full min-w-0",
          !isMobile && "md:ml-64"
        )}
      >
        <Outlet />
      </main>
    </div>
  );
}
