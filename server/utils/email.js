const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendBookingEmail({ to, subject, text }) {
  // In production, improve HTML and error handling
  console.log("send email")
  console.log({ to, subject, text })
  const res = await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
  });
  console.log(res)
}

module.exports = { sendBookingEmail }; 