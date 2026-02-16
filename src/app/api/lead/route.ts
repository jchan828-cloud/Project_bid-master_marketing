import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { z } from 'zod';

// Schema for the "Air-Gap" Handshake
const leadSchema = z.object({
  email: z.string().email('Invalid email address'),
  source_id: z.string().optional(), // e.g., "RFP-123" or "linkedin"
  tier: z.enum(['enterprise', 'smb', 'set-aside']).optional(),
});

export async function POST(request: Request) {
  try {
    // 1. Validate Input (The "Bot Handshake" part 1 - structural)
    const body = await request.json();
    const result = leadSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { email, source_id, tier } = result.data;

    // 2. Initialize Resend
    // We use process.env directly for Vercel integration
    const apiKey = process.env.RESEND_API_KEY;
    const audienceId = process.env.RESEND_AUDIENCE_ID;

    if (!apiKey) {
      console.error('RESEND_API_KEY is missing');
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    const resend = new Resend(apiKey);

    // 3. The "Air-Gap" Write
    // We strictly *push* to Resend. We do NOT read from the SaaS DB.

    // If audienceId is present, add to specific audience (Lead DB)
    if (audienceId) {
      try {
        await resend.contacts.create({
          email,
          audienceId,
          unsubscribed: false,
          firstName: '', // We don't collect names initially to minimize friction
          lastName: '',
        });
      } catch (error) {
        console.error('Failed to add to Resend Audience:', error);
        // Fallback: Just send a notification email to admin?
        // For now, we assume Audience is the primary "Lead DB".
        // We don't fail the request if audience add fails, but we should log it.
      }
    } else {
        console.warn('RESEND_AUDIENCE_ID is missing. Lead not saved to audience.');
    }

    // 4. Send Confirmation / Notification (Optional)
    // We might want to send a "Magic Link" or welcome email here.
    // For the "Air-Gap" protocol, we just acknowledge receipt.

    return NextResponse.json(
      { message: 'Lead captured successfully', success: true },
      { status: 200 }
    );

  } catch (error) {
    console.error('Lead capture error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
