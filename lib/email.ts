/**
 * Bewa Homes Email Notification Service
 * Handles multi-stakeholder alerts for digital contracts and system events.
 */

interface EmailParams {
  to: string;
  subject: string;
  body: string;
  html?: string;
}

import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendEmail({ to, subject, body, html }: EmailParams) {
  if (!resend) {
    console.log(`[EmailService - SIMULATED] Sending to: ${to}`);
    console.log(`[EmailService - SIMULATED] Subject: ${subject}`);
    return { success: true, messageId: `sim_${Math.random().toString(36).substr(2, 9)}` };
  }
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'Bewa Homes <no-reply@bewahomes.com>',
      to,
      subject,
      text: body,
      html: html || body,
    });

    if (error) {
      console.error('[EmailService] Error:', error);
      return { success: false, error };
    }

    return { success: true, messageId: data?.id };
  } catch (err) {
    console.error('[EmailService] Fatal Error:', err);
    return { success: false, error: err };
  }
}

export async function sendContractNotification(data: {
  to?: string | string[];
  stakeholderEmail?: string; // Legacy support
  stakeholderName?: string;  // Legacy support
  title?: string;            // Legacy support
  contractTitle?: string;
  signerName?: string;
  status?: string;
  contractUrl?: string;
}) {
  const recipients = data.to || data.stakeholderEmail || '';
  const title = data.contractTitle || data.title || 'Digital Document';
  const signer = data.signerName || data.stakeholderName || 'A party';
  const status = data.status || 'Signed';
  const url = data.contractUrl || `${process.env.NEXT_PUBLIC_BASE_URL || 'https://bewa-homes.vercel.app'}/dashboard/contracts`;
  
  const subject = `[Bewa Homes] Document Alert: ${title}`;
  const body = `Hello,\n\nThe digital contract "${title}" has been updated: ${status}.\n\nSigner: ${signer}\n\nYou can view the document here: ${url}`;
  
  const html = `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden;">
      <div style="background: #003028; padding: 30px; text-align: center;">
        <h1 style="color: #d4af37; margin: 0; font-size: 24px;">Bewa Homes E-Files</h1>
      </div>
      <div style="padding: 40px; color: #333; line-height: 1.6;">
        <h2 style="color: #003028; margin-top: 0;">Document Notification</h2>
        <p>This is an automated alert regarding a digital agreement on Bewa Homes:</p>
        <div style="background: #fcfcfc; border: 1px solid #eee; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 0.8rem; color: #666; text-transform: uppercase; letter-spacing: 1px;">Document</p>
          <p style="margin: 5px 0 15px 0; font-weight: bold; color: #003028; font-size: 1.1rem;">${title}</p>
          
          <p style="margin: 0; font-size: 0.8rem; color: #666; text-transform: uppercase; letter-spacing: 1px;">Event</p>
          <p style="margin: 5px 0 15px 0; font-weight: bold; color: #059669;">${status}</p>
          
          <p style="margin: 0; font-size: 0.8rem; color: #666; text-transform: uppercase; letter-spacing: 1px;">Signer / Initiator</p>
          <p style="margin: 5px 0 0 0; font-weight: bold; color: #333;">${signer}</p>
        </div>
        <p>The document is now available for review, signature, or archival in the secure Bewa Homes portal.</p>
        <div style="text-align: center; margin-top: 30px;">
          <a href="${url}" 
             style="background: #003028; color: #d4af37; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            View Document
          </a>
        </div>
      </div>
      <div style="background: #f5f5f5; padding: 20px; text-align: center; color: #888; font-size: 12px;">
        <p>&copy; ${new Date().getFullYear()} Bewa Homes Premium. All rights reserved.</p>
        <p>This is a legally binding notification sent via Bewa Secure Signatures.</p>
      </div>
    </div>
  `;

  // Handle multiple recipients if provided as array
  if (Array.isArray(recipients)) {
    return Promise.all(recipients.map(r => sendEmail({ to: r, subject, body, html })));
  }

  return sendEmail({ to: recipients, subject, body, html });
}

