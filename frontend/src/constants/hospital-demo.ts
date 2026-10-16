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
 * vault, with `temperature`, `status`, `powerState` and `lastAuditAt` fields),
 * a route in the API, and a seed — at which point these constants collapse into
 * that route's result. Until that exists, treat every value under the
 * "Cold storage" headings as a placeholder, not as data. Nothing else in the
 * hospital dashboard is affected: the request board, donor screening results,
 * stock levels and profile stats all come from the API.
 */

import type { ComponentProps } from "react";
import { Feather } from "@expo/vector-icons";
import type { BloodGroup } from "@/constants/blood-groups";
import type { Href } from "expo-router";

import { ROUTES } from "@/constants/routes";

type FeatherName = ComponentProps<typeof Feather>["name"];

/** Station the signed-in hospital is operating from. */
export const HOSPITAL_CENTER = "Colombo Center";

export type TriageStatKey = "critical" | "transit" | "reserve";

export type TriageStat = {
  key: TriageStatKey;
  label: string;
  /** Headline figure — a count, or a blood-group pair for the reserve card. */
  value: string;
  /** Small unit rendered next to the value; `null` when the value stands alone. */
  unit: string | null;
  caption: string;
  icon: FeatherName;
};

export const TRIAGE_STATS: readonly TriageStat[] = [
  {
    key: "critical",
    label: "Active Critical",
    value: "3",
    unit: "cases",
    caption: "Immediate action",
    icon: "alert-triangle",
  },
  {
    key: "transit",
    label: "In Transit",
    value: "18",
    unit: "donors",
    caption: "Avg ETA 14m",
    icon: "truck",
  },
  {
    key: "reserve",
    label: "Low Reserve",
    value: "B+ & O−",
    unit: null,
    caption: "Deficit Alert",
    icon: "alert-octagon",
  },
];

export type RequisitionStatus = "in-transit" | "broadcast";

export type Requisition = {
  /** Human reference shown at the top of the card, e.g. `#REQ-2094`. */
  reference: string;
  ward: string;
  bloodGroup: BloodGroup;
  units: number;
  /** Secondary line — who reported it, or the location detail. */
  subtitle: string;
  status: RequisitionStatus;
  statusTitle: string;
  statusDetail: string;
  /** Monograms for the overlapping avatars; only the transit state shows them. */
  donorInitials: readonly string[];
  /** Red attention pill on the panel; `null` when there is nothing to flag. */
  urgency: string | null;
  /** Relative age, already formatted for display. */
  createdAt: string;
};

/*
 * The board's cards are no longer fed from a fixture list: they render the live
 * emergency-request queue through `use-hospital-requisitions`, which maps each
 * request onto the `Requisition` shape above.
 */

export const STORAGE_CARD = {
  label: "Whole Blood Storage",
} as const;

/* ================= Blood reserve & cold storage ================= */

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

export type ReserveTone = "surplus" | "critical" | "safe";

export type ReserveGauge = {
  group: BloodGroup;
  tag: string;
  tone: ReserveTone;
  units: number;
  fillPct: number;
};

export const RESERVE_GAUGES: readonly ReserveGauge[] = [
  { group: "O+", tag: "Surplus", tone: "surplus", units: 340, fillPct: 92 },
  { group: "O-", tag: "Crit 12%", tone: "critical", units: 24, fillPct: 12 },
  { group: "A+", tag: "Safe", tone: "safe", units: 285, fillPct: 68 },
];

/** The one group the gauges single out as running out. */
export const CRITICAL_RESERVE = {
  group: "O-" as BloodGroup,
  label: "O Negative Reserve",
  tag: "Critical Low",
  /**
   * Assumed daily draw-down. The live "Current: N Units" line is composed
   * from the running stock, so only the burn rate is fixture state.
   */
  burnPerDay: 18,
} as const;

export type StorageFraction = {
  label: string;
  active: boolean;
};

export const STORAGE_FRACTIONS: readonly StorageFraction[] = [
  { label: "All Fractions (1,420)", active: true },
  { label: "PRBC Red Cells (820)", active: false },
  { label: "FFP Plasma (180)", active: false },
];

export type VaultCompartment = {
  id: string;
  name: string;
  temperature: string;
  capacityPct: number;
  /** Units held — the live counter, bumped as units are banked. */
  units: number;
  /** What the units are; rendered after the count in the detail line. */
  stockLabel: string;
  status: string;
  tone: "optimal" | "alert";
  icon: FeatherName;
};

export const VAULT_COMPARTMENTS: readonly VaultCompartment[] = [
  {
    id: "vault-a",
    name: "Refrigerated Vault A",
    temperature: "+4°C",
    capacityPct: 58,
    units: 820,
    stockLabel: "Packed Red Cell Cryo",
    status: "Optimal",
    tone: "optimal",
    icon: "archive",
  },
  {
    id: "vault-b",
    name: "Ultra-Cold Freezer B",
    temperature: "−30°C",
    capacityPct: 27,
    units: 380,
    stockLabel: "Fresh Plasma (FFP)",
    status: "Optimal",
    tone: "optimal",
    icon: "thermometer",
  },
  {
    id: "rack-c",
    name: "Platelet Agitator Rack",
    temperature: "+22°C",
    capacityPct: 15,
    units: 220,
    stockLabel: "Live Platelets [5-D]",
    status: "5-D Active Shake",
    tone: "alert",
    icon: "activity",
  },
];

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
  patientTitle: "Patient & Requisition Contact",
  patientLabel: "Patient Name",
  contactLabel: "Contact Person",
  mobileLabel: "Contact Mobile",
  urgencyLabel: "Urgency",
  verificationTitle: "Verification & Cross-Match",
  complianceHeadline: "SL-NBS Medical Authority Act 2024 compliance.",
  complianceNote: "Registration logged with immutable audit hash.",
  complianceReference: "#NBTS-4921-A7",
  ctaLabel: "Broadcast Emergency Requisition Now",
  ctaBusyLabel: "Broadcasting Requisition…",
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
  /**
   * Clock the collection dial runs on.
   *
   * The draw is played back rather than wall-clocked: `nominalSeconds` is how
   * long a real 130 mL draw takes, `speedFactor` is how much faster the demo
   * plays it so the ring visibly fills during a walkthrough. The ETA pill is
   * computed from both, so it always agrees with the fill.
   */
  collection: {
    nominalSeconds: 165,
    speedFactor: 8,
  },
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
  {
    id: "settings",
    title: "Account Settings",
    detail: "Manage staff profile, notifications & district",
    icon: "settings",
    iconTone: "blue",
    href: ROUTES.settings,
  },
];
