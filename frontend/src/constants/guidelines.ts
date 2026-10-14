/**
 * NBTS transfusion protocol reference.
 *
 * Static clinical guidance with no row data behind it — this is a document the
 * app carries, not something an account edits — so it lives in constants rather
 * than in the database. Everything else on the hospital Profile menu is a real
 * record written by staff.
 *
 * Edition and review date are stated on the screen so a clinician can tell how
 * old the guidance on their handset is.
 */

export const GUIDELINES_EDITION = "2024.2";

export type GuidelineSection = {
  id: string;
  title: string;
  summary: string;
  points: readonly string[];
  /** Shown as a caution strip under the points. */
  caution?: string;
};

export const GUIDELINE_SECTIONS: readonly GuidelineSection[] = [
  {
    id: "identity",
    title: "Patient & Product Identity",
    summary: "Two checks at the bedside, by two people, before any unit is connected.",
    points: [
      "Match the request, the bag label and the patient's wristband against each other — all three, every time.",
      "Confirm the ABO and Rh of the unit against the patient's group on the cross-match report.",
      "Any mismatch in patient name, hospital number or group is a hard stop. Do not correct it at the bedside.",
    ],
    caution: "A discrepancy is reported, not resolved at the point of care.",
  },
  {
    id: "storage",
    title: "Storage & Expiry",
    summary: "Cold chain is a precondition, not a precaution.",
    points: [
      "Red cells: 2–6 °C, shelf life 35 days from collection.",
      "Platelets: 20–24 °C with agitation, shelf life 5 days.",
      "Fresh frozen plasma: −18 °C or colder for one year; thaw at 37 °C and transfuse within 24 hours.",
      "Any unit that has left validated storage without a recorded excursion is quarantined, not issued.",
    ],
  },
  {
    id: "rate",
    title: "Administration Rate",
    summary: "Slow to start is deliberate; the rate increases only as the patient tolerates it.",
    points: [
      "First 15 minutes: 1 unit over 4 hours, and stay with the patient for the first 15 minutes.",
      "Adults: complete one unit within 4 hours of starting. Never exceed that window.",
      "Paediatric and critically ill patients: consult the transfusion officer before starting.",
    ],
    caution: "A rate beyond the four-hour window is a reportable event.",
  },
  {
    id: "reaction",
    title: "Recognising a Reaction",
    summary: "Stop the transfusion, keep the line open with saline, and call the blood bank.",
    points: [
      "Symptoms within 15 minutes of starting are treated as a possible acute reaction until proven otherwise.",
      "Stop the unit. Do not flush the line. Replace with saline and keep the giving set for investigation.",
      "Recheck identity first — a true febrile reaction and a wrong-unit transfusion look identical at the bedside.",
      "Return the bag, giving set and a post-transfusion sample with the reaction form.",
    ],
    caution: "Never restart the unit while a reaction is unresolved.",
  },
  {
    id: "records",
    title: "Documentation",
    summary: "An unrecorded transfusion is treated as an unadministered one.",
    points: [
      "Record unit number, component, group, volume, start and finish times, and the staff member who checked identity.",
      "Cross-match failures and near misses are logged as discrepancy reports, with no blame attached to the reporter.",
      "Discharge summaries carry the transfusion history forward, not just the most recent unit.",
    ],
  },
];
