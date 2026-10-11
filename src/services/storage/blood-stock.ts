/**
 * Live blood-bank stock for the hospital storage monitor.
 *
 * The storage screen's figures were frozen fixtures in
 * `@/constants/hospital-demo`, so a unit sealed on the collection telemetry
 * never moved them — the reserve stayed stale no matter how many donations
 * were completed. This module seeds from those same fixtures and then owns
 * the running totals: `recordDonatedUnit` bumps the bank stock, the group's
 * cylinder gauge and the refrigerated intake vault, and `useBloodStock` lets
 * any screen subscribe.
 *
 * There is no storage API yet, so the state lives for the session — the same
 * offline pattern `services/dashboard` uses for donor availability.
 */

import { useSyncExternalStore } from "react";

import type { BloodGroup } from "@/constants/blood-groups";
import {
  BLOOD_STORAGE,
  CRITICAL_RESERVE,
  RESERVE_GAUGES,
  STORAGE_FRACTIONS,
  VAULT_COMPARTMENTS,
  type ReserveGauge,
  type ReserveTone,
  type StorageFraction,
  type VaultCompartment,
} from "@/constants/hospital-demo";

/** Vault that receives fresh whole-blood intake; its counter moves on seal. */
const INTAKE_COMPARTMENT_ID = "vault-a";

/** Fill at or above this reads as surplus; at or below, as critical. */
const SURPLUS_AT_PCT = 85;
const CRITICAL_AT_PCT = 25;

/** Cylinder capacity assumed for a group the fixtures never gauged. */
const DEFAULT_GAUGE_CAPACITY = 250;

/** Bank capacity implied by the fixture stock/capacity pair. */
const BANK_CAPACITY = Math.round(
  BLOOD_STORAGE.totalUnits / (BLOOD_STORAGE.capacityPct / 100),
);

/** Intake vault capacity implied by that compartment's fixture levels. */
const INTAKE_SEED =
  VAULT_COMPARTMENTS.find((item) => item.id === INTAKE_COMPARTMENT_ID) ?? VAULT_COMPARTMENTS[0];
const INTAKE_CAPACITY = Math.round(INTAKE_SEED.units / (INTAKE_SEED.capacityPct / 100));

/** Cylinder capacity per group, implied by each fixture gauge's units/fill. */
const GAUGE_CAPACITY = new Map<BloodGroup, number>(
  RESERVE_GAUGES.map((gauge) => [gauge.group, Math.round(gauge.units / (gauge.fillPct / 100))]),
);

/** Live line under the critical-reserve card. */
export type CriticalReserveLine = {
  group: BloodGroup;
  label: string;
  tag: string;
  /** Units read from the running gauge, not the fixture string. */
  detail: string;
};

export type BloodStock = {
  /** Units held across every fraction, as the banner reports. */
  totalUnits: number;
  capacityPct: number;
  gauges: ReserveGauge[];
  compartments: VaultCompartment[];
  fractions: StorageFraction[];
  critical: CriticalReserveLine;
  /** Latest sealed intake; `null` until a unit has been banked this session. */
  lastIntake: { group: BloodGroup; units: number } | null;
};

function fillPercent(units: number, capacity: number): number {
  return Math.min(100, Math.round((units / capacity) * 100));
}

/** Tag and tone for a cylinder at the given fill level. */
function gaugePresentation(fillPct: number): { tag: string; tone: ReserveTone } {
  if (fillPct >= SURPLUS_AT_PCT) {
    return { tag: "Surplus", tone: "surplus" };
  }

  if (fillPct <= CRITICAL_AT_PCT) {
    return { tag: `Crit ${fillPct}%`, tone: "critical" };
  }

  return { tag: "Safe", tone: "safe" };
}

/** One group's cylinder at its current unit count. */
function gaugeFor(group: BloodGroup, units: number): ReserveGauge {
  const capacity = GAUGE_CAPACITY.get(group) ?? DEFAULT_GAUGE_CAPACITY;
  GAUGE_CAPACITY.set(group, capacity);

  // A sliver of fill whenever anything is banked, so 1 U never reads "0% full".
  const fillPct = Math.max(units > 0 ? 1 : 0, fillPercent(units, capacity));
  const { tag, tone } = gaugePresentation(fillPct);

  return { group, tag, tone, units, fillPct };
}

/** The critical-reserve card, with its unit count taken from live stock. */
function criticalLine(gauges: readonly ReserveGauge[]): CriticalReserveLine {
  const units = gauges.find((gauge) => gauge.group === CRITICAL_RESERVE.group)?.units ?? 0;

  return {
    group: CRITICAL_RESERVE.group,
    label: CRITICAL_RESERVE.label,
    tag: CRITICAL_RESERVE.tag,
    detail: `Current: ${units} Units • Daily Burn: ${CRITICAL_RESERVE.burnPerDay} Units • Est.`,
  };
}

/** The active-fraction chip always mirrors the live bank total. */
function fractionsWithTotal(
  fractions: readonly StorageFraction[],
  totalUnits: number,
): StorageFraction[] {
  return fractions.map((fraction) =>
    fraction.active
      ? { ...fraction, label: `All Fractions (${totalUnits.toLocaleString("en-US")})` }
      : { ...fraction },
  );
}

/** Banked units land in the refrigerated vault, raising its count and fill. */
function compartmentsWithIntake(
  compartments: readonly VaultCompartment[],
  units: number,
): VaultCompartment[] {
  return compartments.map((item) =>
    item.id === INTAKE_COMPARTMENT_ID
      ? {
          ...item,
          units: item.units + units,
          capacityPct: fillPercent(item.units + units, INTAKE_CAPACITY),
        }
      : { ...item },
  );
}

/** Stock as it stands before any session donation. */
function seedStock(): BloodStock {
  const gauges = RESERVE_GAUGES.map((gauge) => gaugeFor(gauge.group, gauge.units));

  return {
    totalUnits: BLOOD_STORAGE.totalUnits,
    capacityPct: BLOOD_STORAGE.capacityPct,
    gauges,
    compartments: VAULT_COMPARTMENTS.map((item) => ({ ...item })),
    fractions: STORAGE_FRACTIONS.map((fraction) => ({ ...fraction })),
    critical: criticalLine(gauges),
    lastIntake: null,
  };
}

let stock: BloodStock = seedStock();
const listeners = new Set<() => void>();

/**
 * Latest snapshot. The reference is stable between donations so subscribed
 * screens can bail out of re-renders.
 */
export function getBloodStock(): BloodStock {
  return stock;
}

/** Subscribe to stock changes; returns the unsubscribe function. */
export function subscribeBloodStock(listener: () => void): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

/** Live stock for any hospital-side screen. */
export function useBloodStock(): BloodStock {
  return useSyncExternalStore(subscribeBloodStock, getBloodStock);
}

/**
 * Bank units that have just been collected. Bumps the bank total, the
 * group's cylinder (adding one when the group was not gauged yet) and the
 * refrigerated intake vault, then notifies subscribers.
 */
export function recordDonatedUnit(group: BloodGroup, units = 1): BloodStock {
  const gauges = stock.gauges.some((gauge) => gauge.group === group)
    ? stock.gauges.map((gauge) =>
        gauge.group === group ? gaugeFor(group, gauge.units + units) : gauge,
      )
    : [...stock.gauges, gaugeFor(group, units)];

  const totalUnits = stock.totalUnits + units;

  stock = {
    totalUnits,
    capacityPct: fillPercent(totalUnits, BANK_CAPACITY),
    gauges,
    compartments: compartmentsWithIntake(stock.compartments, units),
    fractions: fractionsWithTotal(stock.fractions, totalUnits),
    critical: criticalLine(gauges),
    lastIntake: { group, units },
  };

  listeners.forEach((listener) => listener());

  return stock;
}
