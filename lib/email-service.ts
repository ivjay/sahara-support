import { BookingType } from "@/lib/supabase";

/**
 * MOCK Email Service
 * 
 * In a real application, you would use a service like Resend, SendGrid, or AWS SES.
 * Un-comment the code below to use Resend.
 */

// import { Resend } from 'resend';
// const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendBookingEmail(
    bookingId: string,
    type: string,
    details: any,
    userEmail: string = "user@example.com" // In real app, get from user profile
) {
    console.log(`[Email Service] 📧 Sending confirmation email for Booking ${bookingId} to ${userEmail}...`);

    // START: Real Implementation Example (Resend)
    /*
    try {
        await resend.emails.send({
            from: 'Sahara <bookings@sahara.com>',
            to: userEmail,
            subject: `Booking Confirmed: ${type.toUpperCase()} #${bookingId}`,
            html: `
                <h1>Booking Confirmed! ✅</h1>
                <p>Thank you for using Sahara Support.</p>
                <p><strong>Booking ID:</strong> ${bookingId}</p>
                <p><strong>Service:</strong> ${type}</p>
                <p><strong>Details:</strong></p>
                <pre>${JSON.stringify(details, null, 2)}</pre>
            `
        });
        console.log("[Email Service] ✓ Email sent successfully via Resend");
    } catch (error) {
        console.error("[Email Service] ❌ Failed to send email:", error);
    }
    */
    // END: Real Implementation

    // MOCK Implementation
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log(`[Email Service] ✓ MOCK Email sent to ${userEmail}`);
            resolve(true);
        }, 500);
    });
}
