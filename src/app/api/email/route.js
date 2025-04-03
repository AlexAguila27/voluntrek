import nodemailer from 'nodemailer';

// Configure email transporter with improved deliverability settings
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
    // Add DKIM/SPF compatibility settings
    secure: true,
    pool: true,
    maxConnections: 5,
    // Improve deliverability with rate limiting
    rateLimit: true,
    maxMessages: 100,
    rateDelta: 1000
  });
};

// API route handler for sending NGO status notification emails
export async function POST(request) {
  try {
    const { data } = await request.json();
    const { email, organizationName, status, rejectionReason } = data;
    
    if (!email || !organizationName || !status) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create email transporter
    const transporter = createTransporter();
    
    // Configure email content based on status
    let subject, text, html;
    
    if (status === 'approved') {
      subject = 'Your NGO Account Has Been Approved';
      text = `Dear ${organizationName},\n\nCongratulations! Your NGO account has been approved. You can now access all features of the VolunTrek platform.\n\nThank you for joining our community.\n\nBest regards,\nThe VolunTrek Team`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4CAF50;">Your NGO Account Has Been Approved!</h2>
          <p>Dear ${organizationName},</p>
          <p>Congratulations! Your NGO account has been approved. You can now access all features of the VolunTrek platform.</p>
          <p>Thank you for joining our community.</p>
          <p>Best regards,<br>The VolunTrek Team</p>
        </div>
      `;
    } else if (status === 'rejected') {
      subject = 'Your NGO Account Application Status';
      
      const reasonText = rejectionReason 
        ? `\n\nReason: ${rejectionReason}` 
        : '';
      
      text = `Dear ${organizationName},\n\nWe regret to inform you that your NGO account application has been rejected.${reasonText}\n\nIf you believe this is an error or would like to provide additional information, please contact our support team.\n\nBest regards,\nThe VolunTrek Team`;
      
      const reasonHtml = rejectionReason 
        ? `<p><strong>Reason:</strong> ${rejectionReason}</p>` 
        : '';
      
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #F44336;">Your NGO Account Application Status</h2>
          <p>Dear ${organizationName},</p>
          <p>We regret to inform you that your NGO account application has been rejected.</p>
          ${reasonHtml}
          <p>If you believe this is an error or would like to provide additional information, please contact our support team.</p>
          <p>Best regards,<br>The VolunTrek Team</p>
        </div>
      `;
    } else {
      return Response.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }
    
    // Send email with improved headers for better deliverability
    const mailOptions = {
      from: `"VolunTrek" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      text,
      html,
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high',
        'X-Mailer': 'VolunTrek Notification System',
        'List-Unsubscribe': `<mailto:${process.env.EMAIL_USER}?subject=unsubscribe>`
      }
    };
    
    await transporter.sendMail(mailOptions);
    
    return Response.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    
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