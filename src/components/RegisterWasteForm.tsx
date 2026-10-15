import React, { useState } from 'react';
import {
  Sprout,
  CheckCircle2,
  RefreshCw,
  Info,
  Calendar,
  IndianRupee,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import {
  WasteBatch,
  WasteType,
  ProcessingDestination,
  MoistureLevel,
} from '../types/batch';
import {
  JAGTIAL_MANDALS,
  WASTE_TYPES,
  PROCESSING_DESTINATIONS,
  MOISTURE_LEVELS,
  ESTIMATED_RATES_PER_KG,
  CO2_FACTOR,
} from '../data/jagtialData';
import { generateNextBatchId, formatCurrencyINR } from '../utils/storage';

interface RegisterWasteFormProps {
  existingBatches: WasteBatch[];
  onAddBatch: (batch: WasteBatch) => void;
  onNavigateToHistory: () => void;
}

type QuantityUnit = 'kg' | 'quintals' | 'tonnes';

interface FormErrors {
  farmerName?: string;
  farmerPhone?: string;
  mandal?: string;
  village?: string;
  quantity?: string;
  wasteType?: string;
  collectionDate?: string;
}

export const RegisterWasteForm: React.FC<RegisterWasteFormProps> = ({
  existingBatches,
  onAddBatch,
  onNavigateToHistory,
}) => {
  const [batchId, setBatchId] = useState<string>(() => generateNextBatchId(existingBatches));
  const [farmerName, setFarmerName] = useState('');
  const [farmerPhone, setFarmerPhone] = useState('');
  const [mandal, setMandal] = useState<string>(JAGTIAL_MANDALS[0]);
  const [village, setVillage] = useState('');
  const [wasteType, setWasteType] = useState<WasteType>(WASTE_TYPES[0]);
  const [rawQuantity, setRawQuantity] = useState<string>('2000');
  const [unit, setUnit] = useState<QuantityUnit>('kg');
  const [moistureLevel, setMoistureLevel] = useState<MoistureLevel>('Low (< 12%)');
  const [intendedUse, setIntendedUse] = useState<ProcessingDestination>(PROCESSING_DESTINATIONS[0]);
  
  // Default to today's date formatted as YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];
  const [collectionDate, setCollectionDate] = useState<string>(todayStr);
  const [notes, setNotes] = useState('');

  const [errors, setErrors] = useState<FormErrors>({});
  const [submittedBatch, setSubmittedBatch] = useState<WasteBatch | null>(null);

  // Convert entered quantity to kg
  const numericQuantity = parseFloat(rawQuantity) || 0;
  const quantityKg =
    unit === 'tonnes'
      ? Math.round(numericQuantity * 1000)
      : unit === 'quintals'
      ? Math.round(numericQuantity * 100)
      : Math.round(numericQuantity);

  const rate = ESTIMATED_RATES_PER_KG[wasteType] || 2.2;
  const estimatedValue = Math.round(quantityKg * rate);
  const estimatedCO2 = Math.round(quantityKg * CO2_FACTOR);

  const handleRegenerateId = () => {
    setBatchId(generateNextBatchId(existingBatches));
  };

  const validate = (): boolean => {
    const errs: FormErrors = {};

    if (!farmerName.trim() || farmerName.trim().length < 2) {
      errs.farmerName = 'Farmer name must be at least 2 characters';
    }

    const cleanPhone = farmerPhone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      errs.farmerPhone = 'Please enter a valid 10-digit mobile number';
    }

    if (!village.trim()) {
      errs.village = 'Village / Gram Panchayat is required';
    }

    if (!rawQuantity || numericQuantity <= 0) {
      errs.quantity = 'Please enter a positive waste quantity';
    } else if (quantityKg > 100000) {
      errs.quantity = 'Quantity exceeds maximum single batch capacity (100 tonnes)';
    }

    if (!collectionDate) {
      errs.collectionDate = 'Collection date is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }

    const newBatch: WasteBatch = {
      id: batchId,
      farmerName: farmerName.trim(),
      farmerPhone: farmerPhone.replace(/\D/g, ''),
      mandal,
      village: village.trim(),
      wasteType,
      quantityKg,
      moistureLevel,
      intendedUse,
      collectionDate,
      status: 'Registered',
      statusHistory: [
        {
          status: 'Registered',
          timestamp: new Date().toISOString(),
          notes: notes.trim() || 'Initial registration logged',
        },
      ],
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
      estimatedBiomassValueINR: estimatedValue,
      carbonOffsetKg: estimatedCO2,
    };

    onAddBatch(newBatch);
    setSubmittedBatch(newBatch);
  };

  const handleResetForAnother = () => {
    setSubmittedBatch(null);
    setBatchId(generateNextBatchId([...existingBatches, submittedBatch!]));
    setFarmerName('');
    setFarmerPhone('');
    setVillage('');
    setRawQuantity('2000');
    setUnit('kg');
    setNotes('');
    setErrors({});
  };

  if (submittedBatch) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-emerald-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-stone-900">
            Batch Registered Successfully!
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            Agricultural waste batch record has been created and saved in local storage.
          </p>

          <div className="mt-6 w-full rounded-xl border border-stone-200 bg-stone-50 p-5 text-left text-xs space-y-2">
            <div className="flex justify-between border-b border-stone-200 pb-2">
              <span className="text-stone-500">Batch ID</span>
              <span className="font-mono font-bold text-emerald-900">{submittedBatch.id}</span>
            </div>
            <div className="flex justify-between border-b border-stone-200 pb-2">
              <span className="text-stone-500">Farmer</span>
              <span className="font-medium text-stone-900">{submittedBatch.farmerName} (+91 {submittedBatch.farmerPhone})</span>
            </div>
            <div className="flex justify-between border-b border-stone-200 pb-2">
              <span className="text-stone-500">Location</span>
              <span className="text-stone-900">{submittedBatch.village}, {submittedBatch.mandal} Mandal</span>
            </div>
            <div className="flex justify-between border-b border-stone-200 pb-2">
              <span className="text-stone-500">Residue Type & Weight</span>
              <span className="font-semibold text-stone-900">{submittedBatch.wasteType} · {(submittedBatch.quantityKg ?? 0).toLocaleString()} kg</span>
            </div>
            <div className="flex justify-between border-b border-stone-200 pb-2">
              <span className="text-stone-500">Conversion Route</span>
              <span className="text-stone-900">{submittedBatch.intendedUse}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-stone-500">CO2e Emissions Avoided</span>
              <span className="font-bold text-emerald-800">{(submittedBatch.carbonOffsetKg ?? 0).toLocaleString()} kg CO2e</span>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full justify-center">
            <button
              type="button"
              onClick={onNavigateToHistory}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-800 transition-colors"
            >
              <span>View In Batch History</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleResetForAnother}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-5 py-2.5 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors"
            >
              <span>Register Another Batch</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-6xl mx-auto">
      {/* Main Registration Form */}
      <div className="lg:col-span-8 rounded-2xl border border-stone-200 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div>
            <h2 className="text-lg font-bold text-stone-900">Crop Residue Intake Form</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Enter farmer and waste specifications for Jagtial collection hubs
            </p>
          </div>
          <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
            <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wide">ID:</span>
            <span className="font-mono text-xs font-bold text-emerald-950">{batchId}</span>
            <button
              type="button"
              onClick={handleRegenerateId}
              title="Regenerate unique ID"
              className="text-emerald-700 hover:text-emerald-900 ml-1"
            >
              <RefreshCw className="h-3 w-3" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6" noValidate>
          {/* Section 1: Farmer & Location */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-800 pb-2 border-b border-stone-100">
              1. Farmer & Field Location
            </div>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="farmerName" className="block text-xs font-medium text-stone-700 mb-1">
                  Farmer Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="farmerName"
                  type="text"
                  value={farmerName}
                  onChange={(e) => setFarmerName(e.target.value)}
                  placeholder="e.g. Ramesh Reddy M."
                  className={`w-full rounded-lg border px-3 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 ${
                    errors.farmerName ? 'border-red-400 bg-red-50/30' : 'border-stone-300'
                  }`}
                />
                {errors.farmerName && (
                  <p className="mt-1 text-[11px] text-red-600">{errors.farmerName}</p>
                )}
              </div>

              <div>
                <label htmlFor="farmerPhone" className="block text-xs font-medium text-stone-700 mb-1">
                  Mobile Number (10 digits) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-xs text-stone-400 font-mono">
                    +91
                  </span>
                  <input
                    id="farmerPhone"
                    type="tel"
                    maxLength={10}
                    value={farmerPhone}
                    onChange={(e) => setFarmerPhone(e.target.value)}
                    placeholder="9848012345"
                    className={`w-full rounded-lg border pl-11 pr-3 py-2 text-xs text-stone-900 font-mono placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 ${
                      errors.farmerPhone ? 'border-red-400 bg-red-50/30' : 'border-stone-300'
                    }`}
                  />
                </div>
                {errors.farmerPhone && (
                  <p className="mt-1 text-[11px] text-red-600">{errors.farmerPhone}</p>
                )}
              </div>

              <div>
                <label htmlFor="mandal" className="block text-xs font-medium text-stone-700 mb-1">
                  Jagtial Mandal <span className="text-red-500">*</span>
                </label>
                <select
                  id="mandal"
                  value={mandal}
                  onChange={(e) => setMandal(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                >
                  {JAGTIAL_MANDALS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="village" className="block text-xs font-medium text-stone-700 mb-1">
                  Village / Gram Panchayat <span className="text-red-500">*</span>
                </label>
                <input
                  id="village"
                  type="text"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  placeholder="e.g. Polasa / Hasnabad / Thimmapur"
                  className={`w-full rounded-lg border px-3 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 ${
                    errors.village ? 'border-red-400 bg-red-50/30' : 'border-stone-300'
                  }`}
                />
                {errors.village && (
                  <p className="mt-1 text-[11px] text-red-600">{errors.village}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Agricultural Waste Details */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-800 pb-2 border-b border-stone-100">
              2. Crop Residue Specifications
            </div>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="wasteType" className="block text-xs font-medium text-stone-700 mb-1">
                  Crop Residue Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="wasteType"
                  value={wasteType}
                  onChange={(e) => setWasteType(e.target.value as WasteType)}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                >
                  {WASTE_TYPES.map((wt) => (
                    <option key={wt} value={wt}>
                      {wt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="quantity" className="block text-xs font-medium text-stone-700 mb-1">
                  Quantity & Unit <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    id="quantity"
                    type="number"
                    min="1"
                    step="any"
                    value={rawQuantity}
                    onChange={(e) => setRawQuantity(e.target.value)}
                    placeholder="2000"
                    className={`flex-1 rounded-lg border px-3 py-2 text-xs text-stone-900 tabular-nums focus:outline-hidden focus:ring-2 focus:ring-emerald-600 ${
                      errors.quantity ? 'border-red-400 bg-red-50/30' : 'border-stone-300'
                    }`}
                  />
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as QuantityUnit)}
                    className="w-28 rounded-lg border border-stone-300 bg-stone-50 px-2.5 py-2 text-xs font-medium text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="kg">kg</option>
                    <option value="quintals">Quintals</option>
                    <option value="tonnes">Tonnes (MT)</option>
                  </select>
                </div>
                {errors.quantity ? (
                  <p className="mt-1 text-[11px] text-red-600">{errors.quantity}</p>
                ) : (
                  <p className="mt-1 text-[11px] text-stone-500 tabular-nums">
                    Calculated: <strong>{quantityKg.toLocaleString()} kg</strong> ({ (quantityKg / 100).toFixed(1) } Quintals)
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="moistureLevel" className="block text-xs font-medium text-stone-700 mb-1">
                  Moisture Level
                </label>
                <select
                  id="moistureLevel"
                  value={moistureLevel}
                  onChange={(e) => setMoistureLevel(e.target.value as MoistureLevel)}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                >
                  {MOISTURE_LEVELS.map((ml) => (
                    <option key={ml} value={ml}>
                      {ml}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="intendedUse" className="block text-xs font-medium text-stone-700 mb-1">
                  Target Bio-Conversion Route
                </label>
                <select
                  id="intendedUse"
                  value={intendedUse}
                  onChange={(e) => setIntendedUse(e.target.value as ProcessingDestination)}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                >
                  {PROCESSING_DESTINATIONS.map((pd) => (
                    <option key={pd} value={pd}>
                      {pd}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Logistics & Notes */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-800 pb-2 border-b border-stone-100">
              3. Logistics Schedule & Notes
            </div>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="collectionDate" className="block text-xs font-medium text-stone-700 mb-1">
                  Pickup / Ready Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="collectionDate"
                    type="date"
                    value={collectionDate}
                    onChange={(e) => setCollectionDate(e.target.value)}
                    className={`w-full rounded-lg border px-3 py-2 text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 ${
                      errors.collectionDate ? 'border-red-400' : 'border-stone-300'
                    }`}
                  />
                </div>
                {errors.collectionDate && (
                  <p className="mt-1 text-[11px] text-red-600">{errors.collectionDate}</p>
                )}
              </div>

              <div>
                <label htmlFor="notes" className="block text-xs font-medium text-stone-700 mb-1">
                  Field Landmark / Access Notes (Optional)
                </label>
                <input
                  id="notes"
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Near substation, tractor trailer accessible"
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-6 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-800 transition-colors"
            >
              <Sprout className="h-4 w-4" />
              <span>Register & Save Batch</span>
            </button>
          </div>
        </form>
      </div>

      {/* Side Impact Preview Card */}
      <div className="lg:col-span-4 space-y-4">
        <div className="rounded-2xl border border-emerald-200/80 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-800">
            <Info className="h-4 w-4 text-emerald-700" />
            <span>Batch Impact Assessment</span>
          </div>

          <div className="mt-4 space-y-4">
            <div className="rounded-xl bg-[#f4f8f5] p-4 border border-emerald-100">
              <span className="text-[11px] text-stone-500 font-medium block">
                Normalized Weight
              </span>
              <div className="text-xl font-bold text-stone-900 tabular-nums mt-0.5">
                {(quantityKg ?? 0).toLocaleString()} <span className="text-xs font-normal text-stone-600">kg</span>
              </div>
              <span className="text-[11px] text-stone-500 block">
                {((quantityKg ?? 0) / 100).toFixed(1)} Quintals · {((quantityKg ?? 0) / 1000).toFixed(2)} MT
              </span>
            </div>

            <div className="rounded-xl bg-stone-50 p-4 border border-stone-200">
              <div className="flex items-center gap-1.5 text-xs text-stone-600 font-medium">
                <IndianRupee className="h-3.5 w-3.5 text-emerald-700" />
                <span>Estimated Biomass Value</span>
              </div>
              <div className="text-xl font-bold text-emerald-800 tabular-nums mt-0.5">
                {formatCurrencyINR(estimatedValue)}
              </div>
              <span className="text-[11px] text-stone-500">
                At ₹{rate.toFixed(1)}/kg for {wasteType}
              </span>
            </div>

            <div className="rounded-xl bg-stone-50 p-4 border border-stone-200">
              <div className="flex items-center gap-1.5 text-xs text-stone-600 font-medium">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
                <span>CO2e Burning Emissions Avoided</span>
              </div>
              <div className="text-xl font-bold text-stone-900 tabular-nums mt-0.5">
                {(estimatedCO2 ?? 0).toLocaleString()} <span className="text-xs font-normal text-stone-600">kg CO2e</span>
              </div>
              <span className="text-[11px] text-stone-500">
                Prevented from open burning in Jagtial airshed
              </span>
            </div>
          </div>

          <div className="mt-5 border-t border-stone-100 pt-4 text-xs text-stone-500 leading-relaxed">
            <strong className="text-stone-700 font-medium block mb-1">Jagtial Hub Logistics:</strong>
            Batches logged here enter the local biomass dispatch queue. Local aggregators in Raikal, Kodimial, and Korutla dispatch tractors based on registered date.
          </div>
        </div>
      </div>
    </div>
  );
};
