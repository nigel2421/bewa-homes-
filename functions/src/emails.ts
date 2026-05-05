import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import { Resend } from "resend";
import { defineSecret } from "firebase-functions/params";

const resendKey = defineSecret("RESEND_API_KEY");

// Initialize Admin SDK if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * Triggered when a booking status is updated.
 * If status becomes 'Confirmed', send check-in details.
 */
export const onBookingStatusUpdate = onDocumentUpdated({
  document: "bookings/{bookingId}",
  secrets: [resendKey],
}, async (event) => {
  const beforeData = event.data?.before.data();
  const afterData = event.data?.after.data();

  if (!afterData || !beforeData) return;

  // Only trigger if status changed to 'Confirmed' (case-insensitive check just in case)
  const isNowConfirmed = afterData.status?.toLowerCase() === "confirmed";
  const wasPreviouslyConfirmed = beforeData.status?.toLowerCase() === "confirmed";

  if (isNowConfirmed && !wasPreviouslyConfirmed) {
    const resend = new Resend(resendKey.value());
    const guestEmail = afterData.email || afterData.guestEmail;
    const guestName = afterData.guest || afterData.name || "Guest";
    const unitName = afterData.unitName || afterData.unit;

    if (!guestEmail) {
      console.log(`No email found for booking ${event.params.bookingId}. Skipping email.`);
      return;
    }

    try {
      // Fetch unit details to get access code and instructions
      const unitsSnap = await admin.firestore()
        .collection("units")
        .where("name", "==", unitName)
        .limit(1)
        .get();

      let accessCode = "To be provided";
      let instructions = "Instructions will be shared shortly.";

      if (!unitsSnap.empty) {
        const unitData = unitsSnap.docs[0].data();
        accessCode = unitData.accessCode || accessCode;
        instructions = unitData.checkInInstructions || instructions;
      }

      await resend.emails.send({
        from: "Bewa Homes <stay@bewahomes.com>",
        to: guestEmail,
        subject: `Your Stay at ${unitName} is Confirmed! 🗝️`,
        html: `
          <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
            <div style="background: #003028; padding: 30px; text-align: center;">
              <h1 style="color: #d4af37; margin: 0; font-size: 24px;">Bewa Homes</h1>
            </div>
            <div style="padding: 40px; color: #333; line-height: 1.6;">
              <h2 style="color: #003028; margin-top: 0;">Welcome, ${guestName}!</h2>
              <p>Your reservation for <strong>${unitName}</strong> has been confirmed. We are excited to host you!</p>
              
              <div style="background: #fcfcfc; border: 1px solid #eee; padding: 25px; border-radius: 12px; margin: 25px 0;">
                <h3 style="margin-top: 0; color: #003028; border-bottom: 1px solid #eee; padding-bottom: 10px;">Check-in Details</h3>
                
                <p style="margin: 15px 0 5px 0; font-size: 0.8rem; color: #666; text-transform: uppercase; letter-spacing: 1px;">Access Code</p>
                <p style="margin: 0; font-weight: bold; color: #d4af37; font-size: 1.5rem; letter-spacing: 2px;">${accessCode}</p>
                
                <p style="margin: 20px 0 5px 0; font-size: 0.8rem; color: #666; text-transform: uppercase; letter-spacing: 1px;">Instructions</p>
                <p style="margin: 0; color: #333; font-size: 1rem;">${instructions}</p>
              </div>

              <div style="background: #fff8e1; border-left: 4px solid #d4af37; padding: 15px; margin-bottom: 25px;">
                <p style="margin: 0; font-size: 0.9rem; color: #5d4037;">
                  <strong>Pro Tip:</strong> Screenshot this email or save your access code now to ensure a smooth check-in even without internet access.
                </p>
              </div>

              <p>If you have any questions before your arrival, feel free to reply to this email or contact us via the app.</p>
              
              <div style="text-align: center; margin-top: 35px;">
                <a href="https://bewahomes.com/dashboard/bookings/${event.params.bookingId}" 
                   style="background: #003028; color: #d4af37; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; transition: background 0.3s;">
                  View Booking Details
                </a>
              </div>
            </div>
            <div style="background: #f5f5f5; padding: 25px; text-align: center; color: #888; font-size: 12px;">
              <p>&copy; ${new Date().getFullYear()} Bewa Homes Premium Residences. All rights reserved.</p>
              <p>Luxury Living. Seamless Experience.</p>
            </div>
          </div>
        `,
      });

      console.log(`Confirmation email sent to ${guestEmail} for booking ${event.params.bookingId}`);
    } catch (error) {
      console.error("Error sending confirmation email:", error);
    }
  }
});

/**
 * Daily reminder for guests checking in today.
 * Runs every day at 9:00 AM EAT (approx 6:00 AM UTC).
 */
export const scheduledCheckInReminder = onSchedule({
  schedule: "0 6 * * *", // 6:00 AM UTC
  secrets: [resendKey],
}, async (event) => {
  const resend = new Resend(resendKey.value());
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  try {
    const bookingsSnap = await admin.firestore()
      .collection("bookings")
      .where("checkIn", "==", today)
      .where("status", "in", ["Confirmed", "confirmed"])
      .get();

    if (bookingsSnap.empty) {
      console.log("No check-ins scheduled for today.");
      return;
    }

    const emailPromises = bookingsSnap.docs.map(async (doc) => {
      const data = doc.data();
      const guestEmail = data.email || data.guestEmail;
      const guestName = data.guest || data.name || "Guest";
      const unitName = data.unitName || data.unit;

      if (!guestEmail) return;

      // Fetch unit details
      const unitsSnap = await admin.firestore()
        .collection("units")
        .where("name", "==", unitName)
        .limit(1)
        .get();

      let accessCode = "To be provided";
      let instructions = "Instructions will be shared shortly.";

      if (!unitsSnap.empty) {
        const unitData = unitsSnap.docs[0].data();
        accessCode = unitData.accessCode || accessCode;
        instructions = unitData.checkInInstructions || instructions;
      }

      return resend.emails.send({
        from: "Bewa Homes <stay@bewahomes.com>",
        to: guestEmail,
        subject: `Your check-in at ${unitName} is today! 🏨`,
        html: `
          <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
            <div style="background: #003028; padding: 30px; text-align: center;">
              <h1 style="color: #d4af37; margin: 0; font-size: 24px;">Bewa Homes</h1>
            </div>
            <div style="padding: 40px; color: #333; line-height: 1.6;">
              <h2 style="color: #003028; margin-top: 0;">Arrival Today!</h2>
              <p>Hello ${guestName}, we are looking forward to your arrival today at <strong>${unitName}</strong>.</p>
              
              <div style="background: #f9f9f9; border: 1px solid #eee; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; font-weight: bold; color: #003028;">Reminder: Access Details</p>
                <p style="margin: 10px 0 5px 0; font-size: 0.8rem; color: #666; text-transform: uppercase;">Access Code</p>
                <p style="margin: 0; font-weight: bold; color: #d4af37; font-size: 1.2rem;">${accessCode}</p>
                <p style="margin: 15px 0 5px 0; font-size: 0.8rem; color: #666; text-transform: uppercase;">Instructions</p>
                <p style="margin: 0; font-size: 0.95rem;">${instructions}</p>
              </div>

              <p>Safe travels! We hope you have a wonderful stay.</p>
            </div>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; color: #888; font-size: 12px;">
              <p>&copy; ${new Date().getFullYear()} Bewa Homes. All rights reserved.</p>
            </div>
          </div>
        `,
      });
    });

    await Promise.all(emailPromises);
    console.log(`Sent ${bookingsSnap.size} check-in reminders for today.`);
  } catch (error) {
    console.error("Error in scheduled check-in reminder:", error);
  }
});
