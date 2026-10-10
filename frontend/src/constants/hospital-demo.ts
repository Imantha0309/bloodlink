/**
 * Static copy for the hospital staff dashboard.
 *
 * Two different things live here, and they are not equally fine:
 *
 *   - **Labels and navigation.** Section titles, button copy, the profile menu
 *     rows, the barcode artwork. These are presentation, the backend has no
 *     opinion about them, and they belong in a constants file.
 *
 *   - **Sample telemetry.** `BLOOD_STORAGE.temperature`, `powerValue`,
 *     `auditValue` and `COLD_STORAGE` are *readings* — they are rendered the
 *     way a live sensor readout is, but they are fixed strings. The
 *     "Last Cycle Audit — 12 mins ago" in particular will still say twelve
 *     minutes ago a week from now. Nothing in the schema stores any of it.
 *
 * To make the telemetry real it needs a collection (a `cold_storage` row per
 * vault, with `temperature`, `status`, `powerState` and `lastAuditAt` fields), a
 * route in the API, and a seed — at which point these constants collapse into
 * that route's result. Until that exists, treat every value under the
 * "Cold storage" headings as a placeholder, not as data. Nothing else in the
 * hospital dashboard is affected: the request board, donor screening results,
 * stock levels and profile stats all come from the API.
 */

import type { ComponentProps } from "react";
import { Feather } from "@expo/vector-icons";
import type { Href } from "expo-router";

import { ROUTES } from "@/constants/routes";

type FeatherName = ComponentProps<typeof Feather>["name"];

/* ================= Cold storage banner ================= */

export const BLOOD_STORAGE = {
  title: "Blood Reserve & Cold Storage",
  vaultNote: "Automated Continuous Telemetry",
  // Sample reading — see the note at the top of this file.
  temperature: "+3.8°C",
  powerLabel: "Powered Source",
  powerValue: "UPS-Dual Grid Active",
  auditLabel: "Last Cycle Audit",
  auditValue: "12 mins ago (Auto)",
} as const;

/* ================= Create request ================= */

export const CREATE_REQUEST = {
  title: "Create Request",
  phenotypeTitle: "Blood Phenotype Target",
  phenotypeNote: "Select the confirmed patient blood group",
  groupLabel: "Select ABO / Rh Factor",
  componentLabel: "Component Specificity",
  unitsLabel: "Units Requisitioned",
  verificationTitle: "Verification & Cross-Match",
  complianceHeadline: "Clinical details confirmed",
  complianceNote: "Confirm the details before saving this requisition.",
  ctaLabel: "Create Emergency Requisition",
} as const;

export const REQUEST_COMPONENTS = [
  "Whole Blood",
  "PRBC (Packed Red Cells)",
  "FFP Plasma",
  "Platelets (SDP)",
  "Cryoprecipitate",
] as const;

export type RequestComponent = (typeof REQUEST_COMPONENTS)[number];

export type VerificationTone = "positive" | "neutral";

export type VerificationItem = {
  id: string;
  label: string;
  detail: string | null;
  icon: FeatherName;
  iconTone: VerificationTone;
  confirmed: boolean;
};

export const VERIFICATION_ITEMS: readonly VerificationItem[] = [
  {
    id: "details-confirmed",
    label: "I have confirmed these details with the patient's care team",
    detail: "The selected blood group, component, units and urgency are correct.",
    icon: "check-circle",
    iconTone: "neutral",
    confirmed: false,
  },
];

/* ================= Transmission progress ================= */

export const TRANSMISSION = {
  title: "Requisition Status",
  livePill: "Live sync",
  metricsTitle: "Donor response counts",
  summaryTitle: "Saved requisition details",
  referenceLabel: "Request reference",
  unitsSuffix: "Units",
  trackCta: "Track Requisition",
  homeCta: "Back To Home",
} as const;

export type TransmissionMetric = {
  key: string;
  label: string;
  value: string;
  icon: FeatherName;
  tone: "positive" | "neutral";
};

/* ================= Verify arrived donor ================= */

export const VERIFY_DONOR = {
  headerSubtitle: "Hospital Staff • Donor Intake",
  title: "Verify Arrived Donor",
  station: "Hospital donor intake",
  livePill: "Live sync",
  identificationTitle: "Donor Identification / Dispatch Token",
  syncLabel: "Instant Sync",
  scanLabel: "Scan donor dispatch code",
  matchLabel: "REGISTERED DONOR",
  screeningTitle: "Donor screening",
  noticeLead: "Case record: ",
  noticeBody: "Arrival and screening updates are saved to the case record.",
  bedTitle: "Assign Phlebotomy Extraction Bed",
  approveCta: "Approve for Phlebotomy / Extraction",
  deferCta: "Flag Health Deferral",
} as const;

/* ================= Extraction session ================= */

export const EXTRACTION = {
  livePill: "Collection in progress",
  telemetryLabel: "Collection record",
  isoLabel: "Iso-group",
  sealCta: "Seal Unit & Complete Extraction",
} as const;

/* ================= Profile ================= */

export const HOSPITAL_PROFILE = {
  title: "Profile",
  dutyLabel: "On Duty // Live Sync Active",
  shiftLabel: "Shift 01 • 07:00 - 15:30",
  idActionLabel: "Open credential options",
  idTier: "Gold Tier Hero",
  idBarcodeCaption: "Scan at NBTS desk",
  footer: "Transfusion Medicine Information System v4.8 • Station COL-NHSL-01",
} as const;

/** Barcode bar widths, in points — the pattern is decorative and static. */
export const BARCODE_BARS: readonly number[] = [
  2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 1, 2, 3, 1, 2, 2, 1, 3, 1, 2, 4, 1, 3,
];

export const COLD_STORAGE = {
  // Sample readings — see the note at the top of this file.
  temperature: "3.8°C",
  status: "Optimal",
} as const;

export type ClinicalRole = {
  id: string;
  label: string;
  icon: FeatherName;
};

export const CLINICAL_ROLES: {
  title: string;
  level: string;
  items: readonly ClinicalRole[];
} = {
  title: "Verified Clinical Roles",
  level: "NBTS Level IV",
  items: [
    { id: "dispatch", label: "Emergency Dispatcher", icon: "volume-2" },
    { id: "intake", label: "Barcode & Blood Intake", icon: "maximize" },
    { id: "reserve", label: "Provincial Reserve Allocation", icon: "share-2" },
    { id: "override", label: "Physician Signature Override", icon: "pen-tool" },
  ],
};

export const AUTO_DISPATCH = {
  title: "Shift Auto-Dispatch Accept",
  detail: "Route rare O-neg & platelets directly",
} as const;

export type ProfileMenuIconTone = "blue" | "red";

export type ProfileMenuItem = {
  id: string;
  title: string;
  detail: string;
  icon: FeatherName;
  iconTone: ProfileMenuIconTone;
  /** Destination opened by the row. Every row here navigates somewhere real. */
  href: Href;
};

export const PROFILE_MENU: readonly ProfileMenuItem[] = [
  {
    id: "handover",
    title: "Shift Handover Log",
    detail: "View nurse handover notes & pending cross-matches",
    icon: "check-square",
    iconTone: "blue",
    href: ROUTES.hospitalHandover,
  },
  {
    id: "guidelines",
    title: "NBTS Transfusion Guidelines",
    detail: "Edition 2024.2 • Clinical protocols",
    icon: "book",
    iconTone: "blue",
    href: ROUTES.hospitalGuidelines,
  },
  {
    id: "discrepancy",
    title: "Report Discrepancy",
    detail: "Log bag labeling, volume or hemolysis error",
    icon: "alert-triangle",
    iconTone: "red",
    href: ROUTES.hospitalDiscrepancy,
  },
  {
    id: "reassignment",
    title: "Station Reassignment",
    detail: "Switch ward, blood bank desk, or transfer lead",
    icon: "user",
    iconTone: "blue",
    href: ROUTES.hospitalReassignment,
  },
];
