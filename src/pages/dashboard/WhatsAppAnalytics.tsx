import { useState, useEffect } from 'react';
import { MessageCircle, Search, Loader2, ChevronLeft, ChevronRight, Copy, Check, User } from 'lucide-react';
import { whatsappApi, Customer } from '@/lib/api';
import { cn } from '@/lib/utils';

interface WhatsAppAnalyticsProps {
  restaurantId: string;
}

export default function WhatsAppAnalytics({ restaurantId }: WhatsAppAnalyticsProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    fetchCustomers();
  }, [restaurantId, page, searchQuery]);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await whatsappApi.getCustomers(
        restaurantId,
        page,
        ITEMS_PER_PAGE,
        searchQuery
      );
      setCustomers(response.customers);
      setTotalPages(response.pagination.totalPages);
      setTotal(response.pagination.total);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch customers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  const formatDate = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gradient-gold">WhatsApp Customers</h1>
        <p className="text-muted-foreground mt-2">
          View and manage customer interactions from WhatsApp
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border/50 bg-card/50 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Total Customers</p>
            <User className="h-5 w-5 text-primary" />
          </div>
          <p className="text-3xl font-bold">{total}</p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card/50 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">This Page</p>
            <MessageCircle className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold">{customers.length}</p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card/50 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Page</p>
            <div className="text-sm font-medium">
              {page} / {totalPages || 1}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Showing {(page - 1) * ITEMS_PER_PAGE + 1} to {Math.min(page * ITEMS_PER_PAGE, total)} of {total}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by phone number or name..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border/60 bg-background/50 text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary/40 outline-none transition-all"
          />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/10">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-muted-foreground">Loading customers...</p>
          </div>
        </div>
      ) : customers.length === 0 ? (
        <div className="text-center py-12 rounded-lg border border-border/30 bg-card/50">
          <MessageCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">
            {searchQuery ? 'No customers found matching your search' : 'No customers yet'}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border/50 bg-card/50 overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/30 bg-background/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                    Phone Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                    Interactions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                    Last Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer, idx) => (
                  <tr
                    key={customer._id}
                    className={cn(
                      'border-b border-border/20 transition-colors',
                      idx % 2 === 0 ? 'bg-background/30' : 'hover:bg-background/50'
                    )}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono text-primary">
                          {customer.whatsappNumber}
                        </code>
                        <button
                          onClick={() => handleCopyPhone(customer.whatsappNumber)}
                          className="p-1 hover:bg-secondary rounded transition-colors"
                        >
                          {copiedPhone === customer.whatsappNumber ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {customer.customerProfileImage ? (
                          <img
                            src={customer.customerProfileImage}
                            alt={customer.customerName || customer.customerProfileName || 'Customer'}
                            className="h-6 w-6 rounded-full object-cover"
                          />
                        ) : (
                          <span className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-semibold">
                            {(customer.customerName || customer.customerProfileName || 'U').charAt(0).toUpperCase()}
                          </span>
                        )}
                        <p className="text-sm">{customer.customerName || customer.customerProfileName || 'Unknown'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1 flex-wrap">
                        {customer.interactionTypes.map((type, i) => (
                          <span
                            key={i}
                            className={cn(
                              'px-2 py-1 rounded-full text-[10px] font-semibold',
                              type === 'qr_scan' && 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
                              type === 'whatsapp_message' && 'bg-green-500/15 text-green-600 dark:text-green-400',
                              type === 'menu_view' && 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
                              type === 'whatsapp_auto_reply' && 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                            )}
                          >
                            {type === 'qr_scan' && 'QR Scan'}
                            {type === 'whatsapp_message' && 'Message'}
                            {type === 'menu_view' && 'Menu View'}
                            {type === 'whatsapp_auto_reply' && 'Auto Reply'}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          {formatDate(customer.lastInteraction)}
                        </p>
                        {customer.latestDeliveryStatus === 'failed' && (
                          <div className="rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-[11px] text-red-300">
                            <p className="font-semibold">Latest auto-reply failed</p>
                            {customer.latestDeliveryErrorMessage && <p>{customer.latestDeliveryErrorMessage}</p>}
                            {customer.latestDeliveryErrorDetails && <p>{customer.latestDeliveryErrorDetails}</p>}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          const waUrl = `https://wa.me/${customer.whatsappNumber}?text=Hello%20${encodeURIComponent(customer.customerName || 'Customer')}`;
                          window.open(waUrl, '_blank');
                        }}
                        className="px-3 py-1 text-xs font-semibold bg-gradient-to-r from-green-400 to-green-600 text-white rounded-lg hover:shadow-lg hover:shadow-green-500/30 transition-all"
                      >
                        Chat
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3 p-4">
            {customers.map(customer => (
              <div
                key={customer._id}
                className="rounded-lg border border-border/30 bg-background/50 p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-1">Phone</p>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono text-primary truncate">
                        {customer.whatsappNumber}
                      </code>
                      <button
                        onClick={() => handleCopyPhone(customer.whatsappNumber)}
                        className="p-1 hover:bg-secondary rounded transition-colors flex-shrink-0"
                      >
                        {copiedPhone === customer.whatsappNumber ? (
                          <Check className="h-3 w-3 text-green-600" />
                        ) : (
                          <Copy className="h-3 w-3 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Name</p>
                  <p className="text-sm font-medium">{customer.customerName || customer.customerProfileName || 'Unknown'}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Interactions</p>
                  <p className="text-sm font-semibold text-primary">{customer.interactionCount}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Last Contact</p>
                  <p className="text-sm">{formatDate(customer.lastInteraction)}</p>
                  {customer.latestDeliveryStatus === 'failed' && (
                    <div className="mt-2 rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-[11px] text-red-300">
                      {customer.latestDeliveryErrorMessage || 'Latest auto-reply failed'}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    const waUrl = `https://wa.me/${customer.whatsappNumber}?text=Hello%20${encodeURIComponent(customer.customerName || 'Customer')}`;
                    window.open(waUrl, '_blank');
                  }}
                  className="w-full px-3 py-2 text-sm font-semibold bg-gradient-to-r from-green-400 to-green-600 text-white rounded-lg hover:shadow-lg hover:shadow-green-500/30 transition-all"
                >
                  Send Message
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && customers.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className={cn(
              'p-2 rounded-lg border border-border/60 transition-all',
              page === 1
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-secondary'
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pageNum = i + 1;
              if (totalPages > 5 && pageNum === 5) {
                return (
                  <span key="dots" className="px-2 py-1 text-muted-foreground">
                    ...
                  </span>
                );
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={cn(
                    'w-8 h-8 rounded-lg border transition-all',
                    page === pageNum
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border/60 hover:bg-secondary'
                  )}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className={cn(
              'p-2 rounded-lg border border-border/60 transition-all',
              page >= totalPages
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-secondary'
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
