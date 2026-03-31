import nodemailer from 'nodemailer';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const config = useRuntimeConfig();

  // Gmail SMTP 설정
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: config.gmailUser,
      pass: config.gmailAppPassword,
    },
  });

  try {
    const { to, subject, html } = body;

    const mailOptions = {
      from: `"읽어줄래요" <${config.gmailUser}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('Email sending failed:', error);
    return createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to send email',
    });
  }
});
