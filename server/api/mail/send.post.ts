import { Resend } from 'resend';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const config = useRuntimeConfig();

  const resend = new Resend(config.resendApiKey);

  try {
    const { to, subject, html } = body;

    // Resend requires a verified domain to send from, 
    // or onboarding@resend.dev which only sends to the verified email address.
    const data = await resend.emails.send({
      from: 'onboarding@resend.dev', 
      to: [to],
      subject: subject,
      html: html,
    });

    if (data.error) {
      throw data.error;
    }

    return { success: true, data };
  } catch (error: any) {
    return createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to send email',
    });
  }
});
