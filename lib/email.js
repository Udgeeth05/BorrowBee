import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail({ to, subject, html }) {
  const { error } = await resend.emails.send({
    from: 'BorrowBee <notifications@borrowbee.vercel.app>',
    to,
    subject,
    html,
  })
  if (error) console.error('Email error:', error)
}

// Email templates
export const emailTemplates = {
  bookingReceived: (borrowerName, itemName, fromDate, toDate) => ({
    subject: `New booking request for "${itemName}"`,
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:20px">
        <h2 style="color:#EAB308">🐝 BorrowBee</h2>
        <h3>You have a new booking request!</h3>
        <p><strong>${borrowerName}</strong> wants to borrow your <strong>${itemName}</strong></p>
        <div style="background:#fafafa;border-radius:12px;padding:16px;margin:16px 0">
          <p style="margin:4px 0">📅 From: <strong>${fromDate}</strong></p>
          <p style="margin:4px 0">📅 Return: <strong>${toDate}</strong></p>
        </div>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/requests"
          style="background:#EAB308;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:8px">
          Review Request →
        </a>
      </div>
    `
  }),

  bookingApproved: (itemName, fromDate, toDate) => ({
    subject: `Your booking for "${itemName}" was approved! ✅`,
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:20px">
        <h2 style="color:#EAB308">🐝 BorrowBee</h2>
        <h3 style="color:#22c55e">Your booking is confirmed!</h3>
        <p>Great news! Your request to borrow <strong>${itemName}</strong> has been approved.</p>
        <div style="background:#f0fdf4;border-radius:12px;padding:16px;margin:16px 0">
          <p style="margin:4px 0">📅 Pick up from: <strong>${fromDate}</strong></p>
          <p style="margin:4px 0">📅 Return by: <strong>${toDate}</strong></p>
        </div>
        <p style="color:#888">Please contact the lender to arrange pickup.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/my-borrows"
          style="background:#EAB308;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block">
          View My Borrows →
        </a>
      </div>
    `
  }),

  bookingRejected: (itemName) => ({
    subject: `Booking update for "${itemName}"`,
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:20px">
        <h2 style="color:#EAB308">🐝 BorrowBee</h2>
        <h3>Booking not available</h3>
        <p>Unfortunately your request for <strong>${itemName}</strong> was not approved this time.</p>
        <p>Don't worry — there are many other items available!</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/browse"
          style="background:#EAB308;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block">
          Browse Other Items →
        </a>
      </div>
    `
  }),

  dueDateReminder: (itemName, dueDate) => ({
    subject: `⏰ Reminder: Return "${itemName}" tomorrow`,
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:20px">
        <h2 style="color:#EAB308">🐝 BorrowBee</h2>
        <h3>Return reminder</h3>
        <p>This is a reminder to return <strong>${itemName}</strong> by <strong>${dueDate}</strong>.</p>
        <p style="color:#ef4444">Late returns may incur extra charges.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/my-borrows"
          style="background:#EAB308;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block">
          View My Borrows →
        </a>
      </div>
    `
  }),
}