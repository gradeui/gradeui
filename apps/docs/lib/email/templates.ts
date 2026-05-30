import "server-only";

/**
 * Email body templates.
 *
 * Plain-text only — see lib/email/resend.ts for the rationale.
 * Each template is a pure function: takes a context object,
 * returns subject + text. Easy to unit-test and easy to swap into
 * a templating engine later if we add HTML.
 */

export interface InvitationEmail {
  subject: string;
  text: string;
}

export function projectInvitationEmail(input: {
  inviterName: string;
  projectName: string;
  acceptUrl: string;
}): InvitationEmail {
  return {
    subject: `${input.inviterName} invited you to ${input.projectName} on Grade`,
    text: [
      `${input.inviterName} invited you to collaborate on "${input.projectName}" in Grade.`,
      ``,
      `Open this link to accept and start collaborating:`,
      input.acceptUrl,
      ``,
      `If you weren't expecting this, you can ignore this email — nothing will be created on your behalf until you sign in.`,
      ``,
      `Grade — gradeui.com`,
    ].join("\n"),
  };
}
