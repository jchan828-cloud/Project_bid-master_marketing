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
    const segmentId = process.env.RESEND_SEGMENT_ID;

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

    try {
      await resend.contacts.create({
        email,
        unsubscribed: false,
        firstName: '', // We don't collect names initially to minimize friction
        lastName: '',
        ...(segmentId ? { segments: [{ id: segmentId }] } : {}),
      });
    } catch (error) {
      console.error('Failed to create Resend contact:', error);
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
