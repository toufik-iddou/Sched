const nodemailer = require('nodemailer');

// Create transporter with better error handling
const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('Email configuration missing: EMAIL_USER and EMAIL_PASS environment variables required');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    // Add timeout and other options for better reliability
    connectionTimeout: 60000,
    greetingTimeout: 30000,
    socketTimeout: 60000,
  });
};

async function sendBookingEmail({ to, subject, text, html }) {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.error('Email transporter not available - check environment variables');
    return { success: false, error: 'Email configuration missing' };
  }

  try {
    console.log('Sending email to:', to);
    console.log('Subject:', subject);
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
      html: html || text, // Use HTML if provided, otherwise use text
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error: error.message };
  }
}

// Test email function for debugging
async function testEmail() {
  const result = await sendBookingEmail({
    to: process.env.EMAIL_USER, // Send to self for testing
    subject: 'Test Email from Codtoop Calendar',
    text: 'This is a test email to verify email configuration is working.',
    html: '<h1>Test Email</h1><p>This is a test email to verify email configuration is working.</p>'
  });
  return result;
}

module.exports = { sendBookingEmail, testEmail }; 