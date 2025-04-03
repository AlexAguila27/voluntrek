import nodemailer from 'nodemailer';

// Configure email transporter
const createTransporter = () => {
  // You should store these in environment variables in production
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  
  // Validate email credentials
  if (!user || user === 'your-gmail-account@gmail.com' || 
      !pass || pass === 'your-app-specific-password') {
    throw new Error('Invalid email credentials. Please configure EMAIL_USER and EMAIL_PASS in .env.local file.');
  }
  
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
    // Add timeout settings to prevent hanging connections
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
};

// API route handler for sending event creation notification emails
export async function POST(request) {
  try {
    const { data } = await request.json();
    const { email, organizationName, eventTitle, eventDate, eventTime, eventLocation } = data;
    
    if (!email || !organizationName || !eventTitle) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create email transporter
    const transporter = createTransporter();
    
    // Configure email content
    const subject = `New Event Created: ${eventTitle}`;
    const text = `Dear ${organizationName},\n\nA new event has been created for your organization on the VolunTrek platform.\n\nEvent Details:\nTitle: ${eventTitle}\nDate: ${eventDate}\nTime: ${eventTime}\nLocation: ${eventLocation}\n\nYou can log in to the VolunTrek platform to view the complete details and manage this event.\n\nThank you for using VolunTrek!\n\nBest regards,\nThe VolunTrek Team`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">New Event Created</h2>
        <p>Dear ${organizationName},</p>
        <p>A new event has been created for your organization on the VolunTrek platform.</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Event Details:</h3>
          <p><strong>Title:</strong> ${eventTitle}</p>
          <p><strong>Date:</strong> ${eventDate}</p>
          <p><strong>Time:</strong> ${eventTime}</p>
          <p><strong>Location:</strong> ${eventLocation}</p>
        </div>
        <p>You can log in to the VolunTrek platform to view the complete details and manage this event.</p>
        <p>Thank you for using VolunTrek!</p>
        <p>Best regards,<br>The VolunTrek Team</p>
      </div>
    `;
    
    // Send email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject,
      text,
      html,
    };
    
    await transporter.sendMail(mailOptions);
    
    return Response.json({ success: true, message: 'Event notification email sent successfully' });
  } catch (error) {
    console.error('Error sending event notification email:', error);
    
    // Provide more specific error messages based on error type
    let errorMessage = error.message;
    let statusCode = 500;
    
    if (errorMessage.includes('Invalid email credentials')) {
      statusCode = 401;
      errorMessage = 'Email authentication failed: Please check your EMAIL_USER and EMAIL_PASS environment variables.';
    } else if (errorMessage.includes('Invalid login')) {
      statusCode = 401;
      errorMessage = 'Invalid login: Email username or password rejected by Gmail. If using Gmail, ensure you have set up an app password.';
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'ESOCKET') {
      statusCode = 503;
      errorMessage = 'Connection to email server failed: Please check your network connection and email server settings.';
    }
    
    return Response.json(
      { error: 'Failed to send email', details: errorMessage, code: error.code || 'UNKNOWN' },
      { status: statusCode }
    );
  }
}