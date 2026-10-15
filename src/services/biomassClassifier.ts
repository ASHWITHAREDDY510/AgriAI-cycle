/**
 * Biomass Classification Engine (TypeScript Service)
 * 
 * Implements deterministic rule-based demo screening logic for agricultural residues in Jagtial, Telangana.
 * 
 * TRANSPARENCY NOTICE:
 * Demo screening logic, not a trained ML model.
 * Never claim that a batch is medically safe or suitable for fertilizer without further testing.
 * 
 * Rules executed in strict priority order:
 * 1. If pesticide or chemical contamination is suspected, classify as "Potentially contaminated".
 *    (Chemical contamination takes priority over all other rules).
 * 2. If mold or fungal growth is reported, classify as "Requires inspection".
 * 3. If plastic or synthetic waste is mixed in, classify as "Requires inspection".
 * 4. If contamination information is missing or unknown, classify as "Unverified".
 * 5. Otherwise, classify as "Potentially suitable for further processing".
 */

import {
  WasteBatch,
  BiomassAssessment,
  AssessmentStatus,
  ContaminationObservation,
  StorageCondition,
  OdourProfile,
} from '../types/batch';
import { getStoredBatches, saveStoredBatches } from '../utils/storage';

const ASSESSMENTS_STORAGE_KEY = 'agricycle_ai_assessments_v1';

export interface ClassificationFactors {
  hasChemicalSuspected: boolean; // Rule 1: Suspected pesticide / chemical contamination
  hasMoldReported: boolean;       // Rule 2: Mold or fungal growth reported
  hasPlasticMixed: boolean;       // Rule 3: Plastic or synthetic waste mixed in
  isInformationMissingOrUnknown: boolean; // Rule 4: Contamination information missing or unknown
  storageCondition?: StorageCondition;
  odourProfile?: OdourProfile;
  visualNotes?: string;
  contaminationCategory?: ContaminationObservation;
}

/**
 * Retrieve all preserved past assessments from localStorage
 */
export function getAllAssessments(): BiomassAssessment[] {
  try {
    const raw = localStorage.getItem(ASSESSMENTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    
    // Safely normalize legacy items
    const batches = getStoredBatches();
    const batchMap = new Map(batches.map((b) => [b.id, b]));
    
    return parsed.map((item: any) => {
      const b = batchMap.get(item.batchId);
      return {
        ...item,
        quantityKg: typeof item.quantityKg === 'number' ? item.quantityKg : (b?.quantityKg ?? 0),
        reason: item.reason || item.explanation || 'Screening criteria evaluated.',
        status: item.status || 'Unverified',
        triggeredRules: Array.isArray(item.triggeredRules) ? item.triggeredRules : [],
      };
    });
  } catch (err) {
    console.error('Failed to read assessments from storage:', err);
    return [];
  }
}

/**
 * Save assessment record with timestamp and preserve previous assessments
 */
export function saveAssessmentRecord(assessment: BiomassAssessment): void {
  try {
    const history = getAllAssessments();
    const updated = [assessment, ...history];
    localStorage.setItem(ASSESSMENTS_STORAGE_KEY, JSON.stringify(updated));

    // Update the corresponding batch in localStorage with the latest assessment
    const batches = getStoredBatches();
    const batchIndex = batches.findIndex((b) => b.id === assessment.batchId);
    if (batchIndex !== -1) {
      const b = batches[batchIndex];
      let newStatus = b.status;
      let newHistory = b.statusHistory || [];

      if (b.status === 'Registered' || b.status === 'Awaiting assessment') {
        newStatus = 'Assessment completed';
        newHistory = [
          {
            status: 'Assessment completed',
            timestamp: new Date().toISOString(),
            notes: `Biomass screening completed: ${assessment.status}`,
          },
          ...newHistory,
        ];
      }

      batches[batchIndex] = {
        ...b,
        status: newStatus,
        statusHistory: newHistory,
        latestAssessment: assessment,
      };
      saveStoredBatches(batches);
    }
  } catch (err) {
    console.error('Failed to save assessment record:', err);
  }
}

export function getAssessmentsForBatch(batchId: string): BiomassAssessment[] {
  return getAllAssessments().filter((a) => a.batchId === batchId);
}

/**
 * Classifies a registered agricultural waste batch using the strict 5-tier priority rules.
 * Chemical contamination takes priority over all other rules.
 */
export function classifyBiomassBatch(
  batch: WasteBatch,
  factors: ClassificationFactors
): BiomassAssessment {
  const triggeredRules: string[] = [];
  let status: AssessmentStatus;
  let reason: string;
  let explanation: string;
  let recommendedNextStep: string;

  // RULE 1 (Highest Priority): Pesticide or chemical contamination suspected
  if (factors.hasChemicalSuspected || factors.odourProfile === 'Chemical / solvent smell') {
    status = 'Potentially contaminated';
    reason =
      'Pesticide or chemical contamination is suspected. Under screening rules, suspected chemical contamination takes priority over all other rules.';
    explanation =
      'Pesticide overspray, industrial solvent odor, or chemical adulteration make residue unsafe for boiler combustion (toxic flue gas release) and completely disqualify it from biochar or compost without laboratory chemical clearance.';
    recommendedNextStep =
      'Recommend keeping the batch isolated from other biomass and arranging suitable contamination assessment. Do not assign it directly to fertilizer or healthcare-material processing.';
    triggeredRules.push(
      'Rule 1 (Priority 1): Pesticide or chemical contamination suspected -> Potentially contaminated'
    );
    if (factors.hasMoldReported) {
      triggeredRules.push('Overridden: Mold was also reported, but superseded by Priority 1 chemical hazard.');
    }
    if (factors.hasPlasticMixed) {
      triggeredRules.push('Overridden: Plastic waste was also reported, but superseded by Priority 1 chemical hazard.');
    }
  }

  // RULE 2 (Priority 2): Mold or fungal growth reported
  else if (factors.hasMoldReported || factors.odourProfile === 'Musty / damp decay') {
    status = 'Requires inspection';
    reason =
      'Mold or fungal growth is reported on the agricultural residue.';
    explanation =
      'Visible fungal mycelia, mildew, or sour fermentation indicate biological decomposition of lignocellulosic fibers, posing spore dust inhalation hazards and potential loss of calorific value in briquettes.';
    recommendedNextStep =
      'Recommend keeping the batch segregated and arranging an appropriate inspection.';
    triggeredRules.push(
      'Rule 2 (Priority 2): Mold or fungal growth reported -> Requires inspection'
    );
    if (factors.hasPlasticMixed) {
      triggeredRules.push('Notice: Plastic debris was also reported; physical sorting will be needed during inspection.');
    }
  }

  // RULE 3 (Priority 3): Plastic or synthetic waste mixed in
  else if (factors.hasPlasticMixed) {
    status = 'Requires inspection';
    reason =
      'Plastic or synthetic waste (mulch film, drip irrigation tape, or nylon twine) is mixed into the residue.';
    explanation =
      'Inorganic plastic polymers melt inside biomass briquetting extruders, causing equipment clogging and releasing toxic dioxin compounds when burned.';
    recommendedNextStep =
      'Recommend keeping the batch segregated and arranging an appropriate inspection.';
    triggeredRules.push(
      'Rule 3 (Priority 3): Plastic or synthetic waste mixed in -> Requires inspection'
    );
  }

  // RULE 4 (Priority 4): Contamination information missing or unknown
  else if (factors.isInformationMissingOrUnknown) {
    status = 'Unverified';
    reason =
      'Contamination information is missing, incomplete, or unknown.';
    explanation =
      'The batch lacks field verification logs or exhibits unknown discolouration that cannot be identified from visual screening. Intake cannot be approved without on-site confirmation.';
    recommendedNextStep =
      'Explain which required information is missing and request further assessment. Required field contamination observation and sensory verification records are missing. Request further physical assessment before intake.';
    triggeredRules.push(
      'Rule 4 (Priority 4): Contamination information missing or unknown -> Unverified'
    );
  }

  // RULE 5 (Priority 5): Otherwise -> Potentially suitable for further processing
  else {
    status = 'Potentially suitable for further processing';
    reason =
      'No pesticide/chemical contamination, mold growth, synthetic waste, or unknown factors reported. Baseline physical screening criteria satisfied.';
    explanation =
      `Physical screening criteria for this ${batch.wasteType} batch are nominal and meet baseline intake guidelines for ${batch.intendedUse}. Free from detectable chemical smells, mold colonies, or synthetic inclusions.`;
    recommendedNextStep =
      'Recommend preliminary feedstock review and appropriate verification before reuse.';
    triggeredRules.push(
      'Rule 5 (Priority 5): Default clean baseline -> Potentially suitable for further processing'
    );
  }

  // Generate unique assessment ID with timestamp
  const now = new Date();
  const assessmentId = `ASM-${now.getFullYear()}-${now.getTime().toString().slice(-6)}`;

  // Determine contamination category representation
  const contaminationCategory: ContaminationObservation = factors.hasChemicalSuspected
    ? 'Suspected chemical / pesticide residue'
    : factors.hasMoldReported
    ? 'Visible mold / fungal decay'
    : factors.hasPlasticMixed
    ? 'Mixed plastic / synthetic waste'
    : factors.isInformationMissingOrUnknown
    ? 'Unknown discoloration or foreign matter'
    : 'None observed (clean residue)';

  const assessment: BiomassAssessment = {
    id: assessmentId,
    batchId: batch.id,
    batchWasteType: batch.wasteType,
    batchFarmerName: batch.farmerName,
    batchMandal: batch.mandal,
    quantityKg: batch.quantityKg,
    assessedAt: now.toISOString(),
    status,
    observedFactors: {
      contamination: contaminationCategory,
      hasChemicalSuspected: factors.hasChemicalSuspected,
      hasMoldReported: factors.hasMoldReported,
      hasPlasticMixed: factors.hasPlasticMixed,
      isInformationMissingOrUnknown: factors.isInformationMissingOrUnknown,
      storageCondition: factors.storageCondition,
      odourProfile: factors.odourProfile,
      visualNotes: factors.visualNotes?.trim() || undefined,
    },
    triggeredRules,
    reason,
    explanation,
    recommendedNextStep,
    isDemoScreening: true,
  };

  // Save assessment to persistent history
  saveAssessmentRecord(assessment);

  return assessment;
}

export interface NextActionGuidance {
  status: AssessmentStatus;
  primaryRecommendation: string;
  actionDetails: string;
  missingInformationExplanation?: string;
  cautionNotes?: string;
}

export function getRecommendedNextAction(
  status: AssessmentStatus,
  observedFactors?: BiomassAssessment['observedFactors']
): NextActionGuidance {
  switch (status) {
    case 'Potentially suitable for further processing':
      return {
        status,
        primaryRecommendation:
          'Recommend preliminary feedstock review and appropriate verification before reuse.',
        actionDetails:
          'Conduct preliminary feedstock review at the destination bio-energy or composting facility. Confirm residue moisture content and physical cleanliness remain nominal during handling and transit before reuse.',
      };

    case 'Requires inspection':
      return {
        status,
        primaryRecommendation:
          'Recommend keeping the batch segregated and arranging an appropriate inspection.',
        actionDetails:
          'Maintain this residue lot strictly segregated from other inventory in a designated holding buffer. Arrange an appropriate physical inspection to evaluate fungal/mold decay severity or coordinate segregation of mixed synthetic plastic debris.',
        cautionNotes:
          'Do not mix with general processing lines until physical inspection confirms segregation or drying requirements are fulfilled.',
      };

    case 'Potentially contaminated':
      return {
        status,
        primaryRecommendation:
          'Recommend keeping the batch isolated from other biomass and arranging suitable contamination assessment. Do not assign it directly to fertilizer or healthcare-material processing.',
        actionDetails:
          'Quarantine this lot in an isolated containment perimeter away from waterways and other biomass lots. Arrange a suitable laboratory contamination assessment (gas chromatography / pesticide residue screen).',
        cautionNotes:
          'Mandatory restriction: Do not assign this batch directly to fertilizer or healthcare-material processing under any circumstances.',
      };

    case 'Unverified': {
      const missingItems: string[] = [];
      if (!observedFactors || observedFactors.isInformationMissingOrUnknown) {
        missingItems.push('Field contamination observation is missing or reported unknown foreign matter/discoloration');
      }
      if (!observedFactors?.storageCondition) {
        missingItems.push('Storage environment confirmation (covered shed vs. open field) has not been verified');
      }
      if (!observedFactors?.odourProfile) {
        missingItems.push('Sensory verification (odor profile check for chemical volatiles or fermentation)');
      }
      const missingExplanation =
        missingItems.length > 0
          ? `Missing required information: ${missingItems.join('; ')}.`
          : 'Missing required information: Field contamination observation records, sensory inspection, and verified storage conditions are missing.';

      return {
        status,
        primaryRecommendation:
          'Explain which required information is missing and request further assessment.',
        missingInformationExplanation: missingExplanation,
        actionDetails:
          'Field contamination information is incomplete or unknown. Request further on-site physical assessment and verification before authorizing batch intake, transport, or reuse.',
      };
    }
  }
}
