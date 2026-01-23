'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Bid,
  BidActivity,
  BidRFI,
  BidAddendum,
  BidNotification,
  BidDocument,
  BidStage,
  BidPriority,
} from '@/lib/supabase/types';

// Pipeline stage configuration
export const PIPELINE_STAGES: Array<{
  id: BidStage;
  label: string;
  color: string;
  description: string;
}> = [
  { id: 'lead', label: 'Lead', color: '#6b7280', description: 'New opportunity' },
  { id: 'qualifying', label: 'Qualifying', color: '#8b5cf6', description: 'Evaluating fit' },
  { id: 'proposal', label: 'Proposal', color: '#3b82f6', description: 'Preparing bid' },
  { id: 'submitted', label: 'Submitted', color: '#f59e0b', description: 'Awaiting response' },
  { id: 'negotiation', label: 'Negotiation', color: '#ec4899', description: 'In discussion' },
  { id: 'won', label: 'Won', color: '#10b981', description: 'Deal closed' },
  { id: 'lost', label: 'Lost', color: '#ef4444', description: 'Did not win' },
  { id: 'archived', label: 'Archived', color: '#9ca3af', description: 'No longer active' },
];

// Filter options
export interface BidFilters {
  stage: BidStage | null;
  owner: string | null;
  priority: BidPriority | null;
  dateRange: { start: string; end: string } | null;
  search: string;
  tags: string[];
}

// Pipeline statistics
export interface PipelineStats {
  totalBids: number;
  totalValue: number;
  byStage: Record<BidStage, { count: number; value: number }>;
  overdueCount: number;
  dueThisWeek: number;
  winRate: number;
}

interface DashboardState {
  // Bids
  bids: Bid[];
  activeBidId: string | null;

  // Bid details (loaded when viewing single bid)
  activities: BidActivity[];
  rfis: BidRFI[];
  addenda: BidAddendum[];
  documents: BidDocument[];

  // Notifications
  notifications: BidNotification[];
  unreadCount: number;

  // UI State
  viewMode: 'pipeline' | 'list' | 'calendar';
  filters: BidFilters;
  isSidebarOpen: boolean;
  isLoading: boolean;

  // Actions - Bids
  setBids: (bids: Bid[]) => void;
  addBid: (bid: Bid) => void;
  updateBid: (id: string, updates: Partial<Bid>) => void;
  removeBid: (id: string) => void;
  setActiveBid: (id: string | null) => void;

  // Actions - UI
  setViewMode: (mode: 'pipeline' | 'list' | 'calendar') => void;
  setFilters: (filters: Partial<BidFilters>) => void;
  clearFilters: () => void;
  setLoading: (loading: boolean) => void;

  // Computed getters
  getFilteredBids: () => Bid[];
  getBidsByStage: () => Map<BidStage, Bid[]>;
  getPipelineStats: () => PipelineStats;
  getActiveBid: () => Bid | null;
}

const DEFAULT_FILTERS: BidFilters = {
  stage: null,
  owner: null,
  priority: null,
  dateRange: null,
  search: '',
  tags: [],
};

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      // Initial state
      bids: [],
      activeBidId: null,
      activities: [],
      rfis: [],
      addenda: [],
      documents: [],
      notifications: [],
      unreadCount: 0,
      viewMode: 'pipeline',
      filters: DEFAULT_FILTERS,
      isSidebarOpen: true,
      isLoading: false,

      // Bid actions
      setBids: (bids) => set({ bids }),

      addBid: (bid) => set((state) => ({
        bids: [...state.bids, bid],
      })),

      updateBid: (id, updates) => set((state) => ({
        bids: state.bids.map((bid) =>
          bid.id === id ? { ...bid, ...updates, updated_at: new Date().toISOString() } : bid
        ),
      })),

      removeBid: (id) => set((state) => ({
        bids: state.bids.filter((bid) => bid.id !== id),
        activeBidId: state.activeBidId === id ? null : state.activeBidId,
      })),

      setActiveBid: (id) => set({
        activeBidId: id,
        activities: [],
        rfis: [],
        addenda: [],
        documents: [],
      }),

      // UI actions
      setViewMode: (mode) => set({ viewMode: mode }),

      setFilters: (filters) => set((state) => ({
        filters: { ...state.filters, ...filters },
      })),

      clearFilters: () => set({ filters: DEFAULT_FILTERS }),

      setLoading: (loading) => set({ isLoading: loading }),

      // Computed getters
      getFilteredBids: () => {
        const { bids, filters } = get();

        return bids.filter((bid) => {
          if (filters.stage && bid.stage !== filters.stage) return false;
          if (filters.owner && bid.owner_id !== filters.owner) return false;
          if (filters.priority && bid.priority !== filters.priority) return false;

          if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            const matchName = bid.name.toLowerCase().includes(searchLower);
            const matchCustomer = bid.customer_name?.toLowerCase().includes(searchLower);
            const matchDescription = bid.description?.toLowerCase().includes(searchLower);
            if (!matchName && !matchCustomer && !matchDescription) return false;
          }

          if (filters.tags.length > 0) {
            const hasAllTags = filters.tags.every((tag) => bid.tags.includes(tag));
            if (!hasAllTags) return false;
          }

          return true;
        });
      },

      getBidsByStage: () => {
        const filteredBids = get().getFilteredBids();
        const byStage = new Map<BidStage, Bid[]>();

        for (const stage of PIPELINE_STAGES) {
          byStage.set(stage.id, []);
        }

        for (const bid of filteredBids) {
          const stageBids = byStage.get(bid.stage) || [];
          stageBids.push(bid);
          byStage.set(bid.stage, stageBids);
        }

        return byStage;
      },

      getPipelineStats: () => {
        const { bids } = get();
        const now = new Date();
        const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const byStage: Record<BidStage, { count: number; value: number }> = {} as any;
        for (const stage of PIPELINE_STAGES) {
          byStage[stage.id] = { count: 0, value: 0 };
        }

        let totalValue = 0;
        let overdueCount = 0;
        let dueThisWeek = 0;
        let wonCount = 0;
        let closedCount = 0;

        for (const bid of bids) {
          byStage[bid.stage].count++;
          byStage[bid.stage].value += bid.estimated_value || 0;
          totalValue += bid.estimated_value || 0;

          if (bid.bid_due_date) {
            const dueDate = new Date(bid.bid_due_date);
            if (dueDate < now && !['won', 'lost', 'archived'].includes(bid.stage)) {
              overdueCount++;
            }
            if (dueDate >= now && dueDate <= weekFromNow) {
              dueThisWeek++;
            }
          }

          if (bid.stage === 'won') wonCount++;
          if (bid.stage === 'won' || bid.stage === 'lost') closedCount++;
        }

        const winRate = closedCount > 0 ? (wonCount / closedCount) * 100 : 0;

        return {
          totalBids: bids.length,
          totalValue,
          byStage,
          overdueCount,
          dueThisWeek,
          winRate: Math.round(winRate),
        };
      },

      getActiveBid: () => {
        const { bids, activeBidId } = get();
        return bids.find((bid) => bid.id === activeBidId) || null;
      },
    }),
    {
      name: 'job-sense-dashboard-storage',
      partialize: (state) => ({
        viewMode: state.viewMode,
        filters: state.filters,
        isSidebarOpen: state.isSidebarOpen,
      }),
    }
  )
);

// Helper to format currency
export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// Helper to get stage info
export function getStageInfo(stage: BidStage) {
  return PIPELINE_STAGES.find((s) => s.id === stage) || PIPELINE_STAGES[0];
}
