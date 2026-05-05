import { onDocumentWritten } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * Automatically aggregates property stats whenever a unit is created, updated, or deleted.
 * Scales O(1) by using atomic increments rather than full-collection recounts.
 */
export const onUnitWritten = onDocumentWritten({
  document: "units/{unitId}",
  region: "africa-south1"
}, async (event) => {
  const beforeData = event.data?.before.data();
  const afterData = event.data?.after.data();

  // Determine ownerId (should be the same in before/after if document exists)
  const ownerId = afterData?.ownerId || beforeData?.ownerId;
  if (!ownerId) return;

  const statsRef = admin.firestore().doc(`tenants/${ownerId}/aggregates/stats`);
  const globalStatsRef = admin.firestore().doc(`tenants/global/aggregates/stats`);

  let countDelta = 0;
  let occupiedDelta = 0;
  let revenueDelta = 0;

  // 1. Handle Deletion
  if (!afterData) {
    // Only count as active if it was active
    if (beforeData?.subscriptionStatus === 'active') {
      countDelta = -1;
      if (beforeData?.occupancy === 'Occupied') {
        occupiedDelta = -1;
        revenueDelta = -Number(beforeData.price || 0);
      }
    }
  } 
  // 2. Handle Creation
  else if (!beforeData) {
    if (afterData.subscriptionStatus === 'active') {
      countDelta = 1;
      if (afterData.occupancy === 'Occupied') {
        occupiedDelta = 1;
        revenueDelta = Number(afterData.price || 0);
      }
    }
  } 
  // 3. Handle Update
  else {
    const oldActive = beforeData.subscriptionStatus === 'active';
    const newActive = afterData.subscriptionStatus === 'active';
    const oldPrice = Number(beforeData.price || 0);
    const newPrice = Number(afterData.price || 0);
    const oldOcc = beforeData.occupancy;
    const newOcc = afterData.occupancy;

    // Active Status Change
    if (!oldActive && newActive) {
      countDelta = 1;
      if (newOcc === 'Occupied') {
        occupiedDelta = 1;
        revenueDelta = newPrice;
      }
    } else if (oldActive && !newActive) {
      countDelta = -1;
      if (oldOcc === 'Occupied') {
        occupiedDelta = -1;
        revenueDelta = -oldPrice;
      }
    } 
    // Remaining Active - check occupancy/price changes
    else if (oldActive && newActive) {
      if (oldOcc !== 'Occupied' && newOcc === 'Occupied') {
        occupiedDelta = 1;
        revenueDelta = newPrice;
      } else if (oldOcc === 'Occupied' && newOcc !== 'Occupied') {
        occupiedDelta = -1;
        revenueDelta = -oldPrice;
      } else if (oldOcc === 'Occupied' && newOcc === 'Occupied' && oldPrice !== newPrice) {
        revenueDelta = newPrice - oldPrice;
      }
    }
  }

  // Apply changes atomically
  if (countDelta !== 0 || occupiedDelta !== 0 || revenueDelta !== 0) {
    const incrementObj = {
      activeUnits: admin.firestore.FieldValue.increment(countDelta),
      occupiedUnits: admin.firestore.FieldValue.increment(occupiedDelta),
      revenue: admin.firestore.FieldValue.increment(revenueDelta),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await Promise.all([
      statsRef.set(incrementObj, { merge: true }),
      globalStatsRef.set(incrementObj, { merge: true })
    ]);
  }
});

/**
 * Aggregates leads count for each host and globally.
 */
export const onLeadWritten = onDocumentWritten({
  document: "leads/{leadId}",
  region: "africa-south1"
}, async (event) => {
  const beforeData = event.data?.before.data();
  const afterData = event.data?.after.data();

  const tenantId = afterData?.tenantId || beforeData?.tenantId;
  const globalStatsRef = admin.firestore().doc(`tenants/global/aggregates/stats`);

  let leadsDelta = 0;
  if (!afterData) leadsDelta = -1; // Deletion
  else if (!beforeData) leadsDelta = 1; // Creation

  if (leadsDelta !== 0) {
    const incrementObj = {
      leads: admin.firestore.FieldValue.increment(leadsDelta),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const tasks = [globalStatsRef.set(incrementObj, { merge: true })];
    
    if (tenantId && tenantId !== 'global') {
      const statsRef = admin.firestore().doc(`tenants/${tenantId}/aggregates/stats`);
      tasks.push(statsRef.set(incrementObj, { merge: true }));
    }

    await Promise.all(tasks);
  }
});
