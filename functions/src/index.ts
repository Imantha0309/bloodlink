/**
 * BloodLink Firebase Cloud Functions.
 *
 * notifyDonors — HTTPS Callable function.
 *   Called by the app immediately after a blood request is created.
 *   Queries Firestore for all users with a push token whose blood group is
 *   compatible with the request and who are marked available, then fans out
 *   an FCM multicast notification to all of them.
 *
 * savePushToken — HTTPS Callable function.
 *   Called by the app on sign-in to save/update the device push token and
 *   blood group metadata to the `push_tokens` Firestore collection, so
 *   notifyDonors can query it without touching Data Connect.
 */

import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";

admin.initializeApp();
const db = admin.firestore();

// Deploy to the same region as Data Connect to reduce latency.
setGlobalOptions({ region: "us-east4" });

// ---------------------------------------------------------------------------
// Blood group compatibility map.
// Key = requested blood group (what the patient needs).
// Value = donor blood groups that CAN donate to the patient.
// ---------------------------------------------------------------------------
const COMPATIBLE_DONORS: Record<string, string[]> = {
  "O-":  ["O-"],
  "O+":  ["O-", "O+"],
  "A-":  ["O-", "A-"],
  "A+":  ["O-", "O+", "A-", "A+"],
  "B-":  ["O-", "B-"],
  "B+":  ["O-", "O+", "B-", "B+"],
  "AB-": ["O-", "A-", "B-", "AB-"],
  "AB+": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
};

// ---------------------------------------------------------------------------
// notifyDonors
// ---------------------------------------------------------------------------
export const notifyDonors = onCall(async (request) => {
  const { bloodGroup, urgency, requestId, patientName, district } = request.data as {
    bloodGroup: string;
    urgency: string;
    requestId: string;
    patientName: string;
    district?: string | null;
  };

  if (!bloodGroup || !requestId || !patientName) {
    throw new HttpsError("invalid-argument", "bloodGroup, requestId and patientName are required.");
  }

  const compatibleGroups = COMPATIBLE_DONORS[bloodGroup] ?? [];

  if (compatibleGroups.length === 0) {
    return { sent: 0, skipped: "unknown blood group" };
  }

  // Firestore can only do `in` queries with up to 10 values — split if needed.
  const chunks: string[][] = [];
  for (let i = 0; i < compatibleGroups.length; i += 10) {
    chunks.push(compatibleGroups.slice(i, i + 10));
  }

  const tokenDocs: admin.firestore.QueryDocumentSnapshot[] = [];
  for (const chunk of chunks) {
    const snap = await db
      .collection("push_tokens")
      .where("bloodGroup", "in", chunk)
      .where("isAvailable", "==", true)
      .get();
    tokenDocs.push(...snap.docs);
  }

  const tokens = tokenDocs
    .map((doc) => doc.data().token as string)
    .filter((t) => typeof t === "string" && t.length > 0);

  if (tokens.length === 0) {
    return { sent: 0 };
  }

  const urgencyEmoji =
    urgency === "critical" ? "🚨" : urgency === "urgent" ? "⚡" : "🩸";
  const locationLabel = district ? ` in ${district}` : "";

  const message: admin.messaging.MulticastMessage = {
    tokens,
    notification: {
      title: `${urgencyEmoji} ${urgency.charAt(0).toUpperCase() + urgency.slice(1)} request: ${bloodGroup}`,
      body: `${patientName} needs ${bloodGroup} blood${locationLabel}. Tap to respond.`,
    },
    data: {
      requestId,
      bloodGroup,
      urgency,
      type: "new_blood_request",
    },
    android: {
      priority: "high",
      notification: {
        channelId: "blood_requests",
        color: "#D32F2F",
        priority: urgency === "critical" ? "max" : "high",
      },
    },
    apns: {
      payload: {
        aps: {
          sound: "default",
          badge: 1,
          "content-available": 1,
        },
      },
    },
  };

  // sendEachForMulticast handles up to 500 tokens per call; batch if needed.
  const BATCH = 500;
  let successCount = 0;
  for (let i = 0; i < tokens.length; i += BATCH) {
    const batch = tokens.slice(i, i + BATCH);
    const result = await admin.messaging().sendEachForMulticast({ ...message, tokens: batch });
    successCount += result.successCount;
  }

  return { sent: successCount, total: tokens.length };
});

// ---------------------------------------------------------------------------
// savePushToken
// ---------------------------------------------------------------------------
export const savePushToken = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in.");
  }

  const { token, bloodGroup, isAvailable } = request.data as {
    token: string;
    bloodGroup?: string | null;
    isAvailable?: boolean;
  };

  if (!token) {
    throw new HttpsError("invalid-argument", "token is required.");
  }

  const uid = request.auth.uid;

  await db.collection("push_tokens").doc(uid).set(
    {
      token,
      bloodGroup: bloodGroup ?? null,
      // Default to available; the app updates this when the donor pauses.
      isAvailable: isAvailable !== false,
      userId: uid,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return { ok: true };
});

// ---------------------------------------------------------------------------
// updateAvailability — called when donor toggles availability
// ---------------------------------------------------------------------------
export const updateTokenAvailability = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in.");
  }

  const { isAvailable } = request.data as { isAvailable: boolean };
  const uid = request.auth.uid;

  await db.collection("push_tokens").doc(uid).set(
    { isAvailable, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
    { merge: true },
  );

  return { ok: true };
});
