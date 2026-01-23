'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Bid } from '@/lib/supabase/types';

// Job status
export type JobStatus = 'planned' | 'active' | 'completed' | 'cancelled';

// Phase status
export type PhaseStatus = 'pending' | 'in_progress' | 'completed';

// Task status
export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done';

// Job phase
export interface JobPhase {
  id: string;
  jobId: string;
  name: string;
  description?: string;
  sortOrder: number;
  status: PhaseStatus;
  createdAt: string;
}

// Job task
export interface JobTask {
  id: string;
  jobId: string;
  phaseId?: string;
  name: string;
  description?: string;
  status: TaskStatus;
  assignee?: string;
  dueDate?: string;
  estimatedHours?: number;
  sortOrder: number;
  notes?: string;
  createdAt: string;
}

// Job material (from estimate)
export interface JobMaterial {
  id: string;
  jobId: string;
  name: string;
  quantity?: number;
  unit?: string;
  unitCost?: number;
  vendor?: string;
  notes?: string;
  createdAt: string;
}

// Job line item (from estimate)
export interface JobLineItem {
  id: string;
  jobId: string;
  serviceId: string;
  serviceName: string;
  quantity: number;
  unit: string;
  rate: number;
  subtotal: number;
  laborHours?: number;
  laborCost?: number;
  materialCost?: number;
  equipmentCost?: number;
}

// Main Job type (Site Sense compatible)
export interface Job {
  id: string;
  userId?: string;
  name: string;

  // Link to original bid
  bidId?: string;

  // Client info
  clientId?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;

  // Industry
  industryId?: string;

  // Status
  status: JobStatus;

  // Address (from bid)
  propertyAddress?: string;
  city?: string;
  state?: string;
  zip?: string;

  // Measurements from estimate
  totalArea?: number;
  totalPerimeter?: number;

  // Financials from estimate
  estimatedValue?: number;
  actualCost?: number;
  margin?: number;

  // Line items from estimate
  lineItems: JobLineItem[];

  // Dates
  startDate?: string;
  endDate?: string;
  wonDate?: string;

  // Phases and tasks
  phases: JobPhase[];
  tasks: JobTask[];

  // Materials
  materials: JobMaterial[];

  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Statistics
export interface JobStats {
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  totalRevenue: number;
  averageJobValue: number;
}

interface JobsState {
  jobs: Job[];
  activeJobId: string | null;

  // Actions
  setJobs: (jobs: Job[]) => void;
  addJob: (job: Job) => void;
  updateJob: (id: string, updates: Partial<Job>) => void;
  removeJob: (id: string) => void;
  setActiveJob: (id: string | null) => void;

  // Phase actions
  addPhase: (jobId: string, phase: Omit<JobPhase, 'id' | 'createdAt'>) => void;
  updatePhase: (jobId: string, phaseId: string, updates: Partial<JobPhase>) => void;
  removePhase: (jobId: string, phaseId: string) => void;

  // Task actions
  addTask: (jobId: string, task: Omit<JobTask, 'id' | 'createdAt'>) => void;
  updateTask: (jobId: string, taskId: string, updates: Partial<JobTask>) => void;
  removeTask: (jobId: string, taskId: string) => void;

  // Conversion
  createJobFromBid: (bid: Bid, lineItems?: JobLineItem[]) => Job;

  // Getters
  getActiveJob: () => Job | null;
  getJobsByStatus: (status: JobStatus) => Job[];
  getJobStats: () => JobStats;
}

// Generate unique ID
function generateId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Default phases for a new job
const DEFAULT_PHASES: Omit<JobPhase, 'id' | 'jobId' | 'createdAt'>[] = [
  { name: 'Pre-Job', description: 'Setup and preparation', sortOrder: 0, status: 'pending' },
  { name: 'Mobilization', description: 'Equipment and crew arrival', sortOrder: 1, status: 'pending' },
  { name: 'Execution', description: 'Main work activities', sortOrder: 2, status: 'pending' },
  { name: 'Quality Check', description: 'Inspection and punch list', sortOrder: 3, status: 'pending' },
  { name: 'Closeout', description: 'Final cleanup and documentation', sortOrder: 4, status: 'pending' },
];

export const useJobsStore = create<JobsState>()(
  persist(
    (set, get) => ({
      jobs: [],
      activeJobId: null,

      setJobs: (jobs) => set({ jobs }),

      addJob: (job) => set((state) => ({
        jobs: [...state.jobs, job],
      })),

      updateJob: (id, updates) => set((state) => ({
        jobs: state.jobs.map((job) =>
          job.id === id ? { ...job, ...updates, updatedAt: new Date().toISOString() } : job
        ),
      })),

      removeJob: (id) => set((state) => ({
        jobs: state.jobs.filter((job) => job.id !== id),
        activeJobId: state.activeJobId === id ? null : state.activeJobId,
      })),

      setActiveJob: (id) => set({ activeJobId: id }),

      // Phase actions
      addPhase: (jobId, phase) => set((state) => ({
        jobs: state.jobs.map((job) => {
          if (job.id !== jobId) return job;
          const newPhase: JobPhase = {
            ...phase,
            id: generateId(),
            jobId,
            createdAt: new Date().toISOString(),
          };
          return {
            ...job,
            phases: [...job.phases, newPhase],
            updatedAt: new Date().toISOString(),
          };
        }),
      })),

      updatePhase: (jobId, phaseId, updates) => set((state) => ({
        jobs: state.jobs.map((job) => {
          if (job.id !== jobId) return job;
          return {
            ...job,
            phases: job.phases.map((phase) =>
              phase.id === phaseId ? { ...phase, ...updates } : phase
            ),
            updatedAt: new Date().toISOString(),
          };
        }),
      })),

      removePhase: (jobId, phaseId) => set((state) => ({
        jobs: state.jobs.map((job) => {
          if (job.id !== jobId) return job;
          return {
            ...job,
            phases: job.phases.filter((phase) => phase.id !== phaseId),
            updatedAt: new Date().toISOString(),
          };
        }),
      })),

      // Task actions
      addTask: (jobId, task) => set((state) => ({
        jobs: state.jobs.map((job) => {
          if (job.id !== jobId) return job;
          const newTask: JobTask = {
            ...task,
            id: generateId(),
            jobId,
            createdAt: new Date().toISOString(),
          };
          return {
            ...job,
            tasks: [...job.tasks, newTask],
            updatedAt: new Date().toISOString(),
          };
        }),
      })),

      updateTask: (jobId, taskId, updates) => set((state) => ({
        jobs: state.jobs.map((job) => {
          if (job.id !== jobId) return job;
          return {
            ...job,
            tasks: job.tasks.map((task) =>
              task.id === taskId ? { ...task, ...updates } : task
            ),
            updatedAt: new Date().toISOString(),
          };
        }),
      })),

      removeTask: (jobId, taskId) => set((state) => ({
        jobs: state.jobs.map((job) => {
          if (job.id !== jobId) return job;
          return {
            ...job,
            tasks: job.tasks.filter((task) => task.id !== taskId),
            updatedAt: new Date().toISOString(),
          };
        }),
      })),

      // Create job from won bid
      createJobFromBid: (bid, lineItems = []) => {
        const now = new Date().toISOString();
        const jobId = generateId();

        // Create default phases with proper IDs
        const phases: JobPhase[] = DEFAULT_PHASES.map((phase, index) => ({
          ...phase,
          id: `phase_${jobId}_${index}`,
          jobId,
          createdAt: now,
        }));

        // Convert bid line items to job line items
        const jobLineItems: JobLineItem[] = lineItems.map((item, index) => ({
          ...item,
          id: `li_${jobId}_${index}`,
          jobId,
        }));

        const job: Job = {
          id: jobId,
          name: bid.name,
          bidId: bid.id,
          clientName: bid.customer_name || undefined,
          status: 'planned',
          propertyAddress: bid.customer_address || undefined,
          estimatedValue: bid.estimated_value || 0,
          margin: 0.25, // Default margin
          lineItems: jobLineItems,
          phases,
          tasks: [],
          materials: [],
          wonDate: now,
          notes: bid.description || undefined,
          createdAt: now,
          updatedAt: now,
        };

        // Add to store
        get().addJob(job);

        return job;
      },

      // Getters
      getActiveJob: () => {
        const { jobs, activeJobId } = get();
        return jobs.find((job) => job.id === activeJobId) || null;
      },

      getJobsByStatus: (status) => {
        return get().jobs.filter((job) => job.status === status);
      },

      getJobStats: () => {
        const { jobs } = get();
        const activeJobs = jobs.filter((j) => j.status === 'active').length;
        const completedJobs = jobs.filter((j) => j.status === 'completed').length;
        const totalRevenue = jobs
          .filter((j) => j.status === 'completed')
          .reduce((sum, j) => sum + (j.estimatedValue || 0), 0);

        return {
          totalJobs: jobs.length,
          activeJobs,
          completedJobs,
          totalRevenue,
          averageJobValue: jobs.length > 0 ? totalRevenue / Math.max(completedJobs, 1) : 0,
        };
      },
    }),
    {
      name: 'job-sense-jobs-storage',
      partialize: (state) => ({
        jobs: state.jobs,
        activeJobId: state.activeJobId,
      }),
    }
  )
);

// Helper to format job status
export function getJobStatusInfo(status: JobStatus) {
  const statusMap = {
    planned: { label: 'Planned', color: '#6b7280', icon: '📋' },
    active: { label: 'Active', color: '#3b82f6', icon: '🔨' },
    completed: { label: 'Completed', color: '#10b981', icon: '✅' },
    cancelled: { label: 'Cancelled', color: '#ef4444', icon: '❌' },
  };
  return statusMap[status];
}
