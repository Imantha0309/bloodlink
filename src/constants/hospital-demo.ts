/**
 * Static copy for the hospital staff dashboard.
 *
 * Everything dynamic — the request board, donor screening results, stock
 * levels, transmission progress and profile stats — is served by the API (see
 * the hospital screens). This file only holds the physical-plant telemetry and
 * staff-facing labels the backend deliberately does not carry: the cold-storage
 * temperature, duty/shift copy, clinical roles and the decorative ID-card
 * artwork. Removing or wiring it later is a presentation-level change only.
 */

import type { ComponentProps } from "react";
import { Feather } from "@expo/vector-icons";

import type { BloodGroup } from "@/constants/blood-groups";

type FeatherName = ComponentProps<typeof Feather>["name"];

/* ================= Cold storage banner ================= */

export const BLOOD_STORAGE = {
  title: "Blood Reserve & Cold Storage",
  subtitle: "NHSL Colombo Central Cold Storage",
  vaultName: "NHSL Central Blood Vault • Cryogenic",
  vaultNote: "Automated Continuous Telemetry",
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
  phenotypeNote: "Required Match",
  groupLabel: "Select ABO / Rh Factor",
  componentLabel: "Component Specificity",
  unitsLabel: "Units Requisitioned",
  mlPerUnit: 450,
  /** Units above this trip the single-ward allocation alert. */
  unitsAlertThreshold: 2,
  unitsAlert: "Critical Depletion Alert: Exceeds standard single-ward allocation",
  verificationTitle: "Verification & Cross-Match",
  complianceHeadline: "SL-NBS Medical Authority Act 2024 compliance.",
  complianceNote: "Registration logged with immutable audit hash.",
  complianceReference: "#NBTS-4921-A7",
  ctaLabel: "Broadcast Emergency Requisition Now",
} as const;

export const REQUEST_COMPONENTS = [
  "Whole Blood",
  "PRBC (Packed Red Cells)",
  "FFP Plasma",
  "Platelets (SDP)",
  "Cryoprecipitate",
] as const;

export type RequestComponent = (typeof REQUEST_COMPONENTS)[number];

export const DEFAULT_REQUEST = {
  bloodGroup: "B+" as BloodGroup,
  component: "PRBC (Packed Red Cells)" as RequestComponent,
  units: 3,
} as const;

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
    id: "consultant",
    label: "Attending Consultant Pre-Authorized",
    detail: null,
    icon: "check-circle",
    iconTone: "positive",
    confirmed: true,
  },
  {
    id: "lab-02",
    label: "Pre-Allocation to NHSL Lab 02",
    detail: "Immediate centrifuge & cross-match bench reserve",
    icon: "tool",
    iconTone: "neutral",
    confirmed: true,
  },
];

/* ================= Transmission progress ================= */

export const TRANSMISSION = {
  title: "Transmission Progress",
  livePill: "Signal Live",
  statusTitle: "Broadcasting Requisition",
  statusDetail: "Relaying to verified donors inside the Colombo district radius.",
  queuedTitle: "Signal Queued",
  queuedDetail: "The requisition is staged and waiting for the donor relay.",
  completeTitle: "Broadcast Delivered",
  completeDetail: "Donor acknowledgement is being tracked on the Requests board.",
  coverageLabel: "Network Coverage",
  stepsTitle: "Transmission Pipeline",
  metricsTitle: "Live Relay Telemetry",
  summaryTitle: "Requisition Payload",
  referenceLabel: "Audit Reference",
  unitsSuffix: "Units",
  trackCta: "Track Requisition",
  homeCta: "Back To Home",
} as const;

export type TransmissionStep = {
  id: string;
  title: string;
  detail: string;
  icon: FeatherName;
};

/** Rendered top to bottom; the screen lights one up at a time. */
export const TRANSMISSION_STEPS: readonly TransmissionStep[] = [
  {
    id: "sign",
    title: "Requisition Signed",
    detail: "SL-NBS audit hash locked to the station",
    icon: "file-text",
  },
  {
    id: "seal",
    title: "Payload Encrypted",
    detail: "Ward and phenotype details sealed for relay",
    icon: "lock",
  },
  {
    id: "relay",
    title: "Broadcasting to donors",
    detail: "Compatible donors within 12 km alerted",
    icon: "radio",
  },
  {
    id: "ack",
    title: "Donor Acknowledgement",
    detail: "Confirmations collected from matched donors",
    icon: "users",
  },
];

export type TransmissionMetric = {
  key: string;
  label: string;
  value: string;
  icon: FeatherName;
  tone: "positive" | "neutral";
};

/* ================= Verify arrived donor ================= */

export const VERIFY_DONOR = {
  headerSubtitle: "Donor • Arrival Bay 1",
  title: "Verify Arrived Donor",
  station: "National Blood Transfusion Service • Unit Desk 02",
  livePill: "Reception Live",
  identificationTitle: "Donor Identification / Dispatch Token",
  syncLabel: "Instant Sync",
  token: "LK-9021",
  scanLabel: "Scan donor dispatch code",
  matchLabel: "BIO-METRIC MATCHED",
  donorName: "Dr. Ruwan Wickramasinghe",
  bloodGroup: "B+",
  verifiedLabel: "Live Verified",
  requisition: "Requisition #REQ-2094",
  ward: "Ward 14 ICU Emergency Recipient",
  arrival: "Present at Blood Bank. 10:32 AM (14m ago)",
  screeningTitle: "Rapid Clinical Screening Protocol",
  screeningCount: "3/3 Cleared",
  noticeLead: "Immediate Recipient Notification:",
  noticeBody:
    " Approving this transfer triggers a hospital-wide staff and patient's family alert",
  bedTitle: "Assign Phlebotomy Extraction Bed",
  approveCta: "Approve for Phlebotomy / Extraction",
  deferCta: "Flag Health Deferral",
} as const;

export type BedState = "occupied" | "sanitizing" | "ready" | "free";

export type BedSlot = {
  id: string;
  label: string;
  state: BedState;
  /** Chip suffix — "(Occupied)", "Ready", "(Free)". */
  caption: string;
};

/** Occupied and sanitising bays are shown but cannot be assigned. */
export const BED_SLOTS: readonly BedSlot[] = [
  { id: "bay-1", label: "Bay 1", state: "occupied", caption: "(Occupied)" },
  { id: "bay-2", label: "Bay 2", state: "sanitizing", caption: "(Sanitizing)" },
  { id: "bay-3", label: "Bay 3", state: "ready", caption: "Ready" },
  { id: "bay-4", label: "Bay 4", state: "free", caption: "(Free)" },
];

/** Bay the screen opens on — the one already turned over for this donor. */
export const DEFAULT_BED_ID = "bay-3";

/* ================= Extraction session ================= */

export const EXTRACTION = {
  suite: "Phlebotomy Suite 04 • Bed A",
  livePill: "Live Protocol",
  telemetryLabel: "Session Telemetry",
  unitTitle: "Whole Blood Unit (CPDA-1)",
  isoLabel: "Iso-group",
  bloodGroup: "B+",
  collectedMl: 320,
  totalMl: 450,
  eta: "~2m 45s left",
  rfidCode: "NBTS-BPLUS-9042",
  rfidDetail: "RFID Verified • Tri-pack Bag",
  caseLabel: "Linked Recipient Case",
  caseStat: "STAT #EQ-9042",
  patientName: "Ananda Perera",
  patientMeta: "64 Yrs • Male",
  patientWard: "ICU Bed 04 • NHSL Colombo General",
  patientNote: "Cross-match lab standing by for PRBC spin",
  phlebotomistName: "Sister Priyanthi R.",
  phlebotomistMeta: "SLMC #48291 • Lead Phlebotomist",
  buzzerLabel: "Buzzer",
  sealCta: "Seal Unit & Complete Extraction",
  haltCta: "Halt Session • Donor Discomfort",
} as const;

/* ================= Profile ================= */

export const HOSPITAL_PROFILE = {
  title: "Profile",
  dutyLabel: "On Duty // Live Sync Active",
  shiftLabel: "Shift 01 • 07:00 - 15:30",
  fallbackName: "Sister Priyanthi",
  role: "Nurse Supervisor // Shift 01 Lead",
  facility: "National Hospital of Sri Lanka (NHSL)",
  idActionLabel: "Open credential options",
  idBank: "National Blood Bank",
  idTier: "Gold Tier Hero",
  idIdentifierLabel: "Donor Identifier",
  idIdentifier: "LK-9021-B48",
  idGroup: "B+",
  idGroupLabel: "Group",
  idBarcodeCaption: "Scan at NBTS desk",
  footer: "Transfusion Medicine Information System v4.8 • Station COL-NHSL-01",
} as const;

/** Barcode bar widths, in points — the pattern is decorative and static. */
export const BARCODE_BARS: readonly number[] = [
  2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 1, 2, 3, 1, 2, 2, 1, 3, 1, 2, 4, 1, 3,
];

export const COLD_STORAGE = {
  title: "Cold Storage CH-04A",
  detail: "Main Whole Blood & PRBC Vault",
  temperature: "3.8°C",
  status: "Optimal",
  lines: ["Platelet Agitator 01: 22.1°C", "FFP Freezer Unit B: -28.4°C"],
  /** Normalised 0-1 readings for the trend sparkline, oldest first. */
  trend: [0.55, 0.68, 0.42, 0.6, 0.46, 0.74, 0.52, 0.66],
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
};

export const PROFILE_MENU: readonly ProfileMenuItem[] = [
  {
    id: "handover",
    title: "Shift Handover Log",
    detail: "View nurse handover notes & pending cross-matches",
    icon: "check-square",
    iconTone: "blue",
  },
  {
    id: "guidelines",
    title: "NBTS Transfusion Guidelines",
    detail: "Edition 2024.2 • Clinical protocols",
    icon: "book",
    iconTone: "blue",
  },
  {
    id: "discrepancy",
    title: "Report Discrepancy",
    detail: "Log bag labeling, volume or hemolysis error",
    icon: "alert-triangle",
    iconTone: "red",
  },
  {
    id: "reassignment",
    title: "Station Reassignment",
    detail: "Switch ward, blood bank desk, or transfer lead",
    icon: "user",
    iconTone: "blue",
  },
];
