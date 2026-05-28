import { useMemo, useState } from 'react';
import { Plus, Download, Search, Filter, Eye, Sparkles, Calendar, DollarSign, Tag, CheckCircle2, Copy } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import type { ColumnDef } from '@tanstack/react-table';

interface PromotionCampaignRecord {
  id: string;
  promoCode: string;
  campaignTitle: string;
  discountType: 'PERCENTAGE' | 'BUNDLE_DEAL' | 'BUY_X_GET_Y' | 'TIERED_BASKET_DISCOUNT';
  discountValue: string; // e.g., "20% OFF", "BOGO FREE", "$50 OFF > $500"
  startDate: string;
  endDate: string;
  minSpendRequired: number;
  totalOrdersApplied: number;
  totalDiscountGivenUsd: number;
  status: 'ACTIVE' | 'UPCOMING' | 'EXPIRED' | 'PAUSED';
  targetSegment: 'ALL_CUSTOMERS' | 'VIP_LOYALTY_ONLY' | 'NEW_REGISTRATIONS' | 'INACTIVE_WINBACK';
  marketingNotes?: string;
}

const MOCK_PROMOTIONS: PromotionCampaignRecord[] = [
  { id: '1', promoCode: 'SUMMER-DEAL-20', campaignTitle: 'Omnichannel Q3 Summer Apparel Markdown', discountType: 'PERCENTAGE', discountValue: '20% OFF', startDate: '2024-06-01', endDate: '2024-08-31', minSpendRequired: 150.00, totalOrdersApplied: 1840, totalDiscountGivenUsd: 14500.50, status: 'ACTIVE', targetSegment: 'ALL_CUSTOMERS', marketingNotes: 'Promoted via POS interactive displays and email newsletter blast.' },
  { id: '2', promoCode: 'BOGO-FIXTURES', campaignTitle: 'Retail Fixtures & Shelving BOGO Deal', discountType: 'BUY_X_GET_Y', discountValue: 'Buy 2 Get 1 Free', startDate: '2024-05-10', endDate: '2024-06-10', minSpendRequired: 500.00, totalOrdersApplied: 412, totalDiscountGivenUsd: 8900.00, status: 'ACTIVE', targetSegment: 'VIP_LOYALTY_ONLY', marketingNotes: 'Targeting expanding commercial franchisers and store layout designers.' },
  { id: '3', promoCode: 'WELCOME-RETAIL-10', campaignTitle: 'First Time Store POS Activation', discountType: 'PERCENTAGE', discountValue: '10% OFF', startDate: '2024-01-01', endDate: '2024-12-31', minSpendRequired: 50.00, totalOrdersApplied: 4120, totalDiscountGivenUsd: 22400.00, status: 'ACTIVE', targetSegment: 'NEW_REGISTRATIONS', marketingNotes: 'Automated welcome discount auto-applied on cash register during initial loyalty sign-up.' },
  { id: '4', promoCode: 'TIER-SPEND-SAVE', campaignTitle: 'High Basket Value Tiered Rebates', discountType: 'TIERED_BASKET_DISCOUNT', discountValue: '$100 OFF on $1000+', startDate: '2024-07-01', endDate: '2024-07-31', minSpendRequired: 1000.00, totalOrdersApplied: 0, totalDiscountGivenUsd: 0, status: 'UPCOMING', targetSegment: 'ALL_CUSTOMERS', marketingNotes: 'Pre-scheduled promotional event to drive gross merchandising volume ahead of fiscal Q3 close.' },
];

const segmentBadgeStyles = {
  ALL_CUSTOMERS: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200',
  VIP_LOYALTY_ONLY: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200',
  NEW_REGISTRATIONS: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200',
  INACTIVE_WINBACK: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200',
};

export function PromotionsPage() {
  const [data] = useState<PromotionCampaignRecord[]>(MOCK_PROMOTIONS);
  const [search, setSearch] = useState('');
  const [selectedPromo, setSelectedPromo] = useState<PromotionCampaignRecord | null>(null);

  const filtered = data.filter((item) =>
    item.promoCode.toLowerCase().includes(search.toLowerCase()) ||
    item.campaignTitle.toLowerCase().includes(search.toLowerCase()) ||
    item.targetSegment.toLowerCase().includes(search.toLowerCase())
  );

  const columns = useMemo<ColumnDef<PromotionCampaignRecord>[]>(
    () => [
      {
        accessorKey: 'promoCode',
        header: 'Promo Code',
        cell: (info) => (
          <span className="font-mono font-bold text-primary px-2 py-0.5 bg-primary/10 rounded border border-primary/20 hover:underline">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'campaignTitle',
        header: 'Campaign Title & Type',
        cell: ({ row }) => (
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{row.original.campaignTitle}</p>
            <p className="text-xs text-gray-500 font-mono">Type: {row.original.discountType.replace(/_/g, ' ')}</p>
          </div>
        ),
      },
      {
        accessorKey: 'discountValue',
        header: 'Discount Structure',
        cell: (info) => <span className="font-bold text-gray-900 dark:text-white text-sm">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'minSpendRequired',
        header: 'Min Basket Spend',
        cell: (info) => <span className="font-mono text-gray-700 dark:text-gray-300">${(info.getValue() as number).toFixed(2)}</span>,
      },
      {
        accessorKey: 'targetSegment',
        header: 'Customer Segment',
        cell: (info) => {
          const seg = info.getValue() as keyof typeof segmentBadgeStyles;
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${segmentBadgeStyles[seg]}`}>
              {seg.replace(/_/g, ' ')}
            </span>
          );
        },
      },
      {
        accessorKey: 'totalOrdersApplied',
        header: 'Applied Orders',
        cell: ({ row }) => (
          <div>
            <span className="font-bold text-gray-900 dark:text-white font-mono">{row.original.totalOrdersApplied} tx</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 block font-mono font-semibold">${row.original.totalDiscountGivenUsd.toFixed(2)} rebated</span>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: (info) => {
          const status = info.getValue() as string;
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
              status === 'UPCOMING' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' :
              status === 'PAUSED' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' :
              'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
            }`}>
              {status}
            </span>
          );
        },
      },
      {
        accessorKey: 'endDate',
        header: 'Cutoff Date',
        cell: (info) => <span className="text-gray-500 text-sm font-mono">{info.getValue() as string}</span>,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedPromo(row.original); }}
            className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
        ),
      },
    ],
    []
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Promotions & Marketing Campaigns Matrix</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure retail discount campaigns, bundle deals, BOGO structures and evaluate overall promotional margin rebates. Click any promo for details.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm">
              <Download className="w-4 h-4" /> Export Campaign Log
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors text-sm font-semibold shadow-sm">
              <Plus className="w-4 h-4" /> Launch Campaign
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search campaigns by promo code, title or target segment..."
              className="block w-full sm:max-w-xs pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm transition-all"
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors text-sm">
            <Filter className="w-4 h-4" /> Filter Promos
          </button>
        </div>

        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelectedPromo(row)} />
      </div>

      <Drawer
        isOpen={!!selectedPromo}
        onClose={() => setSelectedPromo(null)}
        title={selectedPromo ? `Campaign Dossier: ${selectedPromo.promoCode}` : 'Promotion Specification'}
        width="max-w-lg"
      >
        {selectedPromo && (
          <div className="space-y-6">
            <div className={`flex items-center justify-between p-4 rounded-xl border ${
              selectedPromo.status === 'ACTIVE'
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                : selectedPromo.status === 'UPCOMING'
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                : 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${
                  selectedPromo.status === 'ACTIVE' ? 'bg-emerald-600' : selectedPromo.status === 'UPCOMING' ? 'bg-blue-600' : 'bg-gray-600'
                }`}>
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Discount Structure Formula</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{selectedPromo.discountValue}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                selectedPromo.status === 'ACTIVE' ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100' :
                selectedPromo.status === 'UPCOMING' ? 'bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100' :
                'bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
              }`}>
                {selectedPromo.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Tag className="w-4 h-4 text-primary" /> Total Applied Invoices
                </div>
                <p className="text-xl font-mono font-bold text-gray-900 dark:text-white truncate">{selectedPromo.totalOrdersApplied} orders</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <DollarSign className="w-4 h-4 text-emerald-600" /> Total Net Rebated
                </div>
                <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 truncate">${selectedPromo.totalDiscountGivenUsd.toFixed(2)}</p>
              </div>
            </div>

            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800 text-sm">
              <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Marketing Campaign Name</span>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">{selectedPromo.campaignTitle}</h3>
                <span className={`inline-block mt-1 text-xs px-2.5 py-0.5 rounded-full font-bold border ${segmentBadgeStyles[selectedPromo.targetSegment]}`}>
                  Target Segment: {selectedPromo.targetSegment.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="grid grid-cols-2 pt-2 text-xs font-mono">
                <div>
                  <span className="text-gray-400 block mb-0.5 font-sans font-semibold">Start Window:</span>
                  <span className="text-gray-800 dark:text-gray-200">{selectedPromo.startDate}</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5 font-sans font-semibold">Expiry Cutoff:</span>
                  <span className="text-red-500 font-semibold">{selectedPromo.endDate}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700 text-sm font-mono">
                <span className="text-gray-500 dark:text-gray-400 font-sans">Min Order Basket Qualification:</span>
                <span className="font-bold text-gray-900 dark:text-white">${selectedPromo.minSpendRequired.toFixed(2)}</span>
              </div>

              {selectedPromo.marketingNotes && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-800 mt-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Omnichannel Marketing Notes</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 italic">{selectedPromo.marketingNotes}</p>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex gap-3">
              {selectedPromo.status === 'UPCOMING' && (
                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow transition-colors text-sm">
                  <CheckCircle2 className="w-4 h-4" /> Force Immediate Launch
                </button>
              )}
              <button
                onClick={() => navigator.clipboard.writeText(selectedPromo.promoCode)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg shadow transition-colors text-sm"
              >
                <Copy className="w-4 h-4" /> Copy Promo Tag
              </button>
              <button className="px-4 py-2.5 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg border border-gray-300 dark:border-gray-700 transition-colors text-sm">
                <Calendar className="w-4 h-4 inline mr-1" /> Extend Expiry Window
              </button>
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}
