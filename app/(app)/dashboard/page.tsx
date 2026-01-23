'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDashboardStore, PIPELINE_STAGES, formatCurrency, getStageInfo } from '@/lib/dashboard/store';
import type { Bid, BidStage } from '@/lib/supabase/types';

// Quick stats card component
function StatCard({ label, value, subtext, color, icon }: { label: string; value: string | number; subtext?: string; color?: string; icon?: React.ReactNode }) {
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      padding: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {color && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '4px',
          height: '100%',
          background: color,
        }} />
      )}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: 0, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
          <p style={{ fontSize: '28px', fontWeight: 700, color: color || '#111827', margin: '8px 0 0 0', lineHeight: 1 }}>{value}</p>
          {subtext && <p style={{ fontSize: '13px', color: '#6b7280', margin: '6px 0 0 0' }}>{subtext}</p>}
        </div>
        {icon && (
          <div style={{ color: color || '#9ca3af', opacity: 0.6 }}>{icon}</div>
        )}
      </div>
    </div>
  );
}

// Bid card for pipeline view
function BidCard({ bid, onClick }: { bid: Bid; onClick: () => void }) {
  const dueDate = bid.bid_due_date ? new Date(bid.bid_due_date) : null;
  const now = new Date();
  const isOverdue = dueDate && dueDate < now && !['won', 'lost', 'archived'].includes(bid.stage);
  const isDueSoon = dueDate && !isOverdue && dueDate.getTime() - now.getTime() < 3 * 24 * 60 * 60 * 1000;
  const stageInfo = getStageInfo(bid.stage);
  const daysUntilDue = dueDate ? Math.ceil((dueDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)) : null;

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: 'white',
        borderRadius: '10px',
        border: '1px solid #e5e7eb',
        padding: '0',
        cursor: 'pointer',
        marginBottom: '10px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: '4px',
        background: stageInfo.color,
      }} />

      <div style={{ padding: '14px 14px 14px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <h4 style={{
            fontWeight: 600,
            color: '#111827',
            margin: 0,
            fontSize: '15px',
            lineHeight: 1.3,
            flex: 1,
            paddingRight: '8px',
          }}>
            {bid.name}
          </h4>
          {bid.estimated_value && (
            <span style={{
              fontSize: '14px',
              fontWeight: 700,
              color: '#1d4ed8',
              whiteSpace: 'nowrap',
            }}>
              {formatCurrency(bid.estimated_value)}
            </span>
          )}
        </div>

        {bid.customer_name && (
          <p style={{
            fontSize: '13px',
            color: '#6b7280',
            margin: '0 0 10px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <svg style={{ width: '14px', height: '14px', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bid.customer_name}</span>
          </p>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {dueDate && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: isOverdue ? '#dc2626' : isDueSoon ? '#d97706' : '#6b7280',
              fontWeight: isOverdue || isDueSoon ? 600 : 400,
            }}>
              <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {isOverdue ? (
                <span>Overdue</span>
              ) : daysUntilDue !== null && daysUntilDue <= 0 ? (
                <span>Due today</span>
              ) : (
                <span>Due {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              )}
            </div>
          )}

          {bid.priority && bid.priority !== 'medium' && (
            <span style={{
              padding: '3px 8px',
              fontSize: '11px',
              fontWeight: 600,
              borderRadius: '4px',
              textTransform: 'uppercase',
              backgroundColor: bid.priority === 'urgent' ? '#fef2f2' : bid.priority === 'high' ? '#fffbeb' : '#f9fafb',
              color: bid.priority === 'urgent' ? '#dc2626' : bid.priority === 'high' ? '#d97706' : '#4b5563',
            }}>
              {bid.priority}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Pipeline column
function PipelineColumn({ stage, bids, onBidClick }: {
  stage: typeof PIPELINE_STAGES[0];
  bids: Bid[];
  onBidClick: (bid: Bid) => void;
}) {
  const totalValue = bids.reduce((sum, b) => sum + (b.estimated_value || 0), 0);

  return (
    <div style={{
      flexShrink: 0,
      width: '280px',
      backgroundColor: 'white',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      minHeight: '400px',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #e5e7eb',
        background: `linear-gradient(135deg, ${stage.color}08 0%, ${stage.color}03 100%)`,
        borderRadius: '12px 12px 0 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: stage.color,
              boxShadow: `0 0 0 3px ${stage.color}30`,
            }} />
            <h3 style={{ fontWeight: 600, color: '#111827', margin: 0, fontSize: '15px' }}>{stage.label}</h3>
          </div>
          <span style={{
            backgroundColor: '#f3f4f6',
            color: '#374151',
            padding: '2px 10px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 600,
          }}>
            {bids.length}
          </span>
        </div>
        {totalValue > 0 && (
          <p style={{
            fontSize: '13px',
            color: '#6b7280',
            margin: '8px 0 0 20px',
            fontWeight: 500,
          }}>
            {formatCurrency(totalValue)} pipeline
          </p>
        )}
      </div>

      <div style={{
        flex: 1,
        padding: '12px',
        overflowY: 'auto',
        background: '#fafafa',
      }}>
        {bids.map((bid) => (
          <BidCard key={bid.id} bid={bid} onClick={() => onBidClick(bid)} />
        ))}
        {bids.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '32px 16px',
            color: '#9ca3af',
          }}>
            <p style={{ fontSize: '14px', margin: 0 }}>No bids yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Create bid modal
function CreateBidModal({ isOpen, onClose, onCreate }: {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: Partial<Bid>) => void;
}) {
  const [name, setName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    onCreate({
      name: name.trim(),
      customer_name: customerName.trim() || null,
      estimated_value: estimatedValue ? parseFloat(estimatedValue) : null,
      bid_due_date: dueDate || null,
      stage: 'lead',
      priority: 'medium',
      probability: 50,
      tags: [],
      team_members: [],
      metadata: {},
    });
    setIsSubmitting(false);
    onClose();
    setName('');
    setCustomerName('');
    setEstimatedValue('');
    setDueDate('');
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '480px',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
      }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Create New Bid</h2>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
              Bid Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Main St Parking Lot Reseal"
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
              Customer Name
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g., ABC Property Management"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
                Estimated Value
              </label>
              <input
                type="number"
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(e.target.value)}
                placeholder="$0"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                background: 'white',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              style={{
                padding: '10px 20px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                opacity: isSubmitting || !name.trim() ? 0.5 : 1,
              }}
            >
              Create Bid
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const bids = useDashboardStore((s) => s.bids);
  const addBid = useDashboardStore((s) => s.addBid);
  const getBidsByStage = useDashboardStore((s) => s.getBidsByStage);
  const getPipelineStats = useDashboardStore((s) => s.getPipelineStats);

  const bidsByStage = getBidsByStage();
  const stats = getPipelineStats();

  const handleCreateBid = useCallback((data: Partial<Bid>) => {
    const newBid: Bid = {
      id: `bid_${Date.now()}`,
      organization_id: null,
      site_id: null,
      name: data.name || 'Untitled Bid',
      description: null,
      bid_number: null,
      customer_name: data.customer_name || null,
      customer_email: null,
      customer_phone: null,
      customer_company: null,
      customer_address: null,
      stage: data.stage || 'lead',
      stage_updated_at: new Date().toISOString(),
      loss_reason: null,
      owner_id: null,
      team_members: [],
      bid_due_date: data.bid_due_date || null,
      site_visit_date: null,
      project_start_date: null,
      project_end_date: null,
      estimated_value: data.estimated_value || null,
      final_value: null,
      probability: data.probability || 50,
      priority: data.priority || 'medium',
      tags: data.tags || [],
      source: null,
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    addBid(newBid);
  }, [addBid]);

  const handleBidClick = useCallback((bid: Bid) => {
    // Navigate to the site estimator with the bid's address
    const address = bid.customer_address || bid.customer_name;
    if (address) {
      router.push(`/site?address=${encodeURIComponent(address)}`);
    } else {
      // If no address, go to the site estimator without address
      router.push('/site');
    }
  }, [router]);

  // Show only active stages (exclude archived for main view)
  const activeStages = PIPELINE_STAGES.filter(s => !['archived'].includes(s.id));

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <header style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: 0 }}>Dashboard</h1>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0' }}>
              Track your bids and manage your pipeline
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link
              href="/site"
              style={{
                padding: '10px 16px',
                background: 'white',
                border: '1px solid #d1d5db',
                color: '#374151',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Site Estimator
            </Link>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                padding: '10px 16px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Bid
            </button>
          </div>
        </div>
      </header>

      {/* Stats Row */}
      <div style={{ padding: '20px 24px', flexShrink: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <StatCard
            label="Total Pipeline"
            value={formatCurrency(stats.totalValue)}
            subtext={`${stats.totalBids} active bids`}
            color="#3b82f6"
          />
          <StatCard
            label="Due This Week"
            value={stats.dueThisWeek}
            color="#f59e0b"
          />
          <StatCard
            label="Win Rate"
            value={`${stats.winRate}%`}
            subtext="of closed bids"
            color="#10b981"
          />
          <StatCard
            label="Overdue"
            value={stats.overdueCount}
            color={stats.overdueCount > 0 ? '#ef4444' : '#6b7280'}
          />
        </div>
      </div>

      {/* Pipeline View */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 24px 24px' }}>
        <div style={{ display: 'flex', gap: '16px', paddingBottom: '16px', minWidth: 'min-content' }}>
          {activeStages.map((stage) => (
            <PipelineColumn
              key={stage.id}
              stage={stage}
              bids={bidsByStage.get(stage.id) || []}
              onBidClick={handleBidClick}
            />
          ))}
        </div>

        {bids.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'white',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            marginTop: '20px',
          }}>
            <svg style={{ width: '64px', height: '64px', margin: '0 auto 16px', color: '#d1d5db' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>No bids yet</h3>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>
              Create your first bid to start tracking your pipeline
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setShowCreateModal(true)}
                style={{
                  padding: '10px 20px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Create Bid
              </button>
              <Link
                href="/site"
                style={{
                  padding: '10px 20px',
                  background: 'white',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                Start Estimating
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Create Bid Modal */}
      <CreateBidModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateBid}
      />
    </div>
  );
}
