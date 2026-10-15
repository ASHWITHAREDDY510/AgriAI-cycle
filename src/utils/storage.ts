import { INITIAL_DEMO_BATCHES } from '../data/jagtialData';
import { KPIStats, WasteBatch, WasteStatus } from '../types/batch';

const STORAGE_KEY = 'agricycle_ai_batches_v1';

export function normalizeBatchStatus(status: WasteStatus): WasteStatus {
  switch (status) {
    case 'Pending Pickup':
      return 'Awaiting collection';
    case 'In Transit':
      return 'Collected';
    case 'Under Processing':
      return 'Sent for processing';
    case 'Completed / Converted':
      return 'Closed';
    default:
      return status;
  }
}

export function isRestrictedFromDirectProcessing(batch: WasteBatch): boolean {
  if (!batch.latestAssessment) return true; // Unverified / not screened
  const st = batch.latestAssessment.status;
  return st === 'Potentially contaminated' || st === 'Unverified';
}

export function getStoredBatches(): WasteBatch[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let loaded: WasteBatch[];
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEMO_BATCHES));
      loaded = INITIAL_DEMO_BATCHES;
    } else {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEMO_BATCHES));
        loaded = INITIAL_DEMO_BATCHES;
      } else {
        loaded = parsed;
      }
    }

    // Ensure status is normalized and statusHistory exists for each batch
    return loaded.map((b) => {
      const normalizedStatus = normalizeBatchStatus(b.status);
      const history = Array.isArray(b.statusHistory) && b.statusHistory.length > 0
        ? b.statusHistory
        : [
            {
              status: normalizedStatus,
              timestamp: b.createdAt || new Date().toISOString(),
              notes: b.notes || 'Batch registered in Jagtial Hub',
            },
          ];

      return {
        ...b,
        status: normalizedStatus,
        statusHistory: history,
      };
    });
  } catch (err) {
    console.error('Failed to parse localStorage batches:', err);
    return INITIAL_DEMO_BATCHES;
  }
}

export function saveStoredBatches(batches: WasteBatch[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(batches));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

export function addBatch(batch: WasteBatch): WasteBatch[] {
  const current = getStoredBatches();
  const normalizedStatus = normalizeBatchStatus(batch.status || 'Registered');
  const initialHistory = Array.isArray(batch.statusHistory) && batch.statusHistory.length > 0
    ? batch.statusHistory
    : [
        {
          status: normalizedStatus,
          timestamp: batch.createdAt || new Date().toISOString(),
          notes: batch.notes || 'Initial registration logged',
        },
      ];

  const batchWithHistory: WasteBatch = {
    ...batch,
    status: normalizedStatus,
    statusHistory: initialHistory,
  };

  const updated = [batchWithHistory, ...current];
  saveStoredBatches(updated);
  return updated;
}

export interface UpdateStatusResult {
  updatedBatches: WasteBatch[];
  updatedBatch: WasteBatch | null;
  reroutedToInspection: boolean;
  finalStatus: WasteStatus;
  message: string;
}

export function updateBatchStatus(
  id: string,
  requestedStatus: WasteStatus,
  notes?: string
): UpdateStatusResult {
  const current = getStoredBatches();
  let reroutedToInspection = false;
  let finalStatus: WasteStatus = requestedStatus;
  let updatedBatch: WasteBatch | null = null;
  let message = '';

  const updated = current.map((b) => {
    if (b.id !== id) return b;

    // Rule 8: Do not allow potentially contaminated or unverified batches to be sent directly for processing.
    // Route them to inspection instead.
    if (requestedStatus === 'Sent for processing' && isRestrictedFromDirectProcessing(b)) {
      reroutedToInspection = true;
      finalStatus = 'Sent for inspection';
      const screeningReason = b.latestAssessment
        ? b.latestAssessment.status
        : 'Unverified (no screening assessment)';
      const policyNotice = `Safety Policy: Batch flagged as ${screeningReason}; direct processing prohibited. Routed to inspection.`;
      const finalNotes = notes?.trim() ? `${notes.trim()} · [${policyNotice}]` : policyNotice;

      const newHistoryItem = {
        status: finalStatus,
        timestamp: new Date().toISOString(),
        notes: finalNotes,
      };

      const newHistory = [newHistoryItem, ...(b.statusHistory || [])];
      message = `Safety Rule: Batch ${b.id} is ${screeningReason} and cannot be sent directly for processing. Routed to 'Sent for inspection' instead.`;

      updatedBatch = {
        ...b,
        status: finalStatus,
        statusHistory: newHistory,
      };
      return updatedBatch;
    }

    finalStatus = requestedStatus;
    const finalNotes = notes?.trim() || undefined;
    const newHistoryItem = {
      status: finalStatus,
      timestamp: new Date().toISOString(),
      notes: finalNotes,
    };

    const newHistory = [newHistoryItem, ...(b.statusHistory || [])];
    message = `Batch ${b.id} status updated to "${finalStatus}".`;

    updatedBatch = {
      ...b,
      status: finalStatus,
      statusHistory: newHistory,
    };
    return updatedBatch;
  });

  saveStoredBatches(updated);
  return {
    updatedBatches: updated,
    updatedBatch,
    reroutedToInspection,
    finalStatus,
    message,
  };
}

export function deleteBatch(id: string): WasteBatch[] {
  const current = getStoredBatches();
  const updated = current.filter((b) => b.id !== id);
  saveStoredBatches(updated);
  return updated;
}

export function resetDemoData(): WasteBatch[] {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEMO_BATCHES));
  const demoAssessments = INITIAL_DEMO_BATCHES.map((b) => b.latestAssessment).filter(Boolean);
  localStorage.setItem('agricycle_ai_assessments_v1', JSON.stringify(demoAssessments));
  return getStoredBatches();
}

export function generateNextBatchId(batches: WasteBatch[]): string {
  const year = new Date().getFullYear();
  let maxSeq = 100;
  for (const b of batches) {
    const match = b.id.match(/AGC-JAG-\d{4}-(\d+)/);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  }
  const nextSeq = String(maxSeq + 1).padStart(4, '0');
  return `AGC-JAG-${year}-${nextSeq}`;
}

export function calculateKPIStats(batches: WasteBatch[]): KPIStats {
  let totalWasteKg = 0;
  let activeBatches = 0;
  let awaitingCollectionCount = 0;
  let processedWasteKg = 0;
  let carbonOffsetKg = 0;
  let assessedBatchesCount = 0;
  let suitableBatchesCount = 0;
  const farmerSet = new Set<string>();

  for (const b of batches) {
    totalWasteKg += b.quantityKg;
    carbonOffsetKg += b.carbonOffsetKg;
    if (b.farmerPhone || b.farmerName) {
      farmerSet.add(b.farmerPhone ? b.farmerPhone.trim() : b.farmerName.trim().toLowerCase());
    }

    // Number of batches awaiting collection (Rule 7)
    if (b.status === 'Awaiting collection' || b.status === 'Pending Pickup') {
      awaitingCollectionCount += 1;
    }

    // Active logistics or processing pipeline
    if (
      b.status === 'Awaiting collection' ||
      b.status === 'Pending Pickup' ||
      b.status === 'Collected' ||
      b.status === 'In Transit' ||
      b.status === 'Segregated' ||
      b.status === 'Sent for inspection'
    ) {
      activeBatches += 1;
    }

    if (
      b.status === 'Sent for processing' ||
      b.status === 'Under Processing' ||
      b.status === 'Closed' ||
      b.status === 'Completed / Converted'
    ) {
      processedWasteKg += b.quantityKg;
    }

    if (b.latestAssessment) {
      assessedBatchesCount += 1;
      if (b.latestAssessment.status === 'Potentially suitable for further processing') {
        suitableBatchesCount += 1;
      }
    }
  }

  return {
    totalWasteKg,
    totalBatches: batches.length,
    activeBatches,
    awaitingCollectionCount,
    processedWasteKg,
    carbonOffsetKg,
    totalFarmers: farmerSet.size,
    assessedBatchesCount,
    suitableBatchesCount,
  };
}

export function formatWeight(kg?: number | null): { value: string; unit: string; secondary: string } {
  const safeKg = typeof kg === 'number' && !isNaN(kg) ? Math.max(0, kg) : 0;
  if (safeKg >= 1000) {
    const tonnes = (safeKg / 1000).toFixed(1);
    const quintals = (safeKg / 100).toFixed(1);
    return {
      value: tonnes,
      unit: 'MT',
      secondary: `${quintals} Quintals (${safeKg.toLocaleString()} kg)`,
    };
  }
  const quintals = (safeKg / 100).toFixed(1);
  return {
    value: quintals,
    unit: 'Qtl',
    secondary: `${safeKg.toLocaleString()} kg`,
  };
}

export function formatCurrencyINR(amount?: number | null): string {
  const safeAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(safeAmount);
}
