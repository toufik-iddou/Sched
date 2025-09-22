require('dotenv').config();
const { sendBookingEmail } = require('./utils/email');

async function testEmailConfiguration() {
  console.log('Testing email configuration...');
  console.log('Email User:', process.env.EMAIL_USER);
  console.log('Email Pass configured:', !!process.env.EMAIL_PASS);
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ Email configuration missing!');
    console.error('Please set EMAIL_USER and EMAIL_PASS in your .env file');
    return;
  }

  try {
    const result = await sendBookingEmail({
      to: process.env.EMAIL_USER, // Send test to yourself
      subject: 'Test Email - Codtoop Calendar',
      text: 'This is a test email to verify your email configuration is working correctly.',
      html: `
        <h1>Test Email</h1>
        <p>This is a test email to verify your email configuration is working correctly.</p>
        <p><strong>If you receive this email, your configuration is working!</strong></p>
      `
    });

    if (result.success) {
      console.log('✅ Email sent successfully!');
      console.log('Message ID:', result.messageId);
    } else {
      console.error('❌ Email failed to send:');
      console.error(result.error);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testEmailConfiguration();
