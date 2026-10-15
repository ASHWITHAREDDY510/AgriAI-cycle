export type WasteType =
  | 'Paddy Straw'
  | 'Cotton Stalks'
  | 'Sugarcane Bagasse'
  | 'Turmeric Foliage & Rhizomes'
  | 'Maize Stover & Cobs'
  | 'Chilli Stems & Residue'
  | 'Mango Orchard Prunings';

export type WorkflowStatus =
  | 'Registered'
  | 'Awaiting assessment'
  | 'Assessment completed'
  | 'Awaiting collection'
  | 'Collected'
  | 'Segregated'
  | 'Sent for inspection'
  | 'Sent for processing'
  | 'Closed';

export const WORKFLOW_STATUSES: WorkflowStatus[] = [
  'Registered',
  'Awaiting assessment',
  'Assessment completed',
  'Awaiting collection',
  'Collected',
  'Segregated',
  'Sent for inspection',
  'Sent for processing',
  'Closed',
];

export type WasteStatus =
  | WorkflowStatus
  | 'Pending Pickup'
  | 'In Transit'
  | 'Under Processing'
  | 'Completed / Converted';

export interface StatusHistoryItem {
  status: WasteStatus;
  timestamp: string; // ISO string
  notes?: string;
}

export type ProcessingDestination =
  | 'Biomass Briquette / Pelleting'
  | 'Bio-CNG / Biogas Plant'
  | 'Vermicompost & Organic Fertilizer'
  | 'Biochar Soil Amendment'
  | 'Mushroom Cultivation Substrate';

export type MoistureLevel = 'Low (< 12%)' | 'Moderate (12-20%)' | 'High (> 20%)';

export type AssessmentStatus =
  | 'Potentially suitable for further processing'
  | 'Requires inspection'
  | 'Potentially contaminated'
  | 'Unverified';

export type ContaminationObservation =
  | 'None observed (clean residue)'
  | 'Suspected chemical / pesticide residue'
  | 'Visible mold / fungal decay'
  | 'Mixed plastic / synthetic waste'
  | 'Unknown discoloration or foreign matter';

export type StorageCondition =
  | 'Covered shed / raised pallet'
  | 'Dry open field stack'
  | 'Damp or waterlogged ground';

export type OdourProfile =
  | 'Fresh natural plant aroma'
  | 'Sour / anaerobic fermentation'
  | 'Chemical / solvent smell'
  | 'Musty / damp decay';

export interface BiomassAssessment {
  id: string;
  batchId: string;
  batchWasteType: WasteType;
  batchFarmerName: string;
  batchMandal: string;
  quantityKg: number;
  assessedAt: string; // ISO string
  status: AssessmentStatus;
  observedFactors: {
    contamination: ContaminationObservation;
    hasChemicalSuspected?: boolean;
    hasMoldReported?: boolean;
    hasPlasticMixed?: boolean;
    isInformationMissingOrUnknown?: boolean;
    storageCondition?: StorageCondition;
    odourProfile?: OdourProfile;
    visualNotes?: string;
  };
  triggeredRules: string[];
  reason: string;
  explanation: string;
  recommendedNextStep: string;
  isDemoScreening: true;
}

export interface WasteBatch {
  id: string; // e.g. "AGC-JAG-2026-0101"
  farmerName: string;
  farmerPhone: string;
  mandal: string;
  village: string;
  wasteType: WasteType;
  quantityKg: number; // in Kilograms
  moistureLevel: MoistureLevel;
  intendedUse: ProcessingDestination;
  collectionDate: string; // YYYY-MM-DD
  status: WasteStatus;
  notes?: string;
  createdAt: string;
  estimatedBiomassValueINR: number; // calculated residue market value
  carbonOffsetKg: number; // estimated CO2e emission avoided
  latestAssessment?: BiomassAssessment;
  statusHistory?: StatusHistoryItem[];
}

export type NavTab = 'dashboard' | 'register' | 'history' | 'classify';

export interface KPIStats {
  totalWasteKg: number;
  totalBatches: number;
  activeBatches: number; // Awaiting collection, pending pickup, in transit, or collected
  awaitingCollectionCount: number; // specifically batches awaiting collection
  processedWasteKg: number; // Sent for processing, under processing or closed
  carbonOffsetKg: number;
  totalFarmers: number;
  assessedBatchesCount: number;
  suitableBatchesCount: number;
}

