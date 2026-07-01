'use strict';
/**
 * Slack integration configuration.
 * All values are optional-at-boot — Slack sends silently no-op when the bot
 * token/signing secret are absent, so nothing breaks in local dev.
 *
 * IMPORTANT: these channel defaults match this workspace's ACTUAL channels
 * (confirmed against the Slack sidebar), not generic placeholder names:
 *   #supervisor, #attendance, #all-intern-communication
 * If you rename a channel in Slack, update the matching env var here —
 * chat.postMessage fails with channel_not_found otherwise, and the bot must
 * also be invited into each channel with /invite @YourBotName.
 */
const slackConfig = {
  // Bot token (xoxb-…). Required for posting messages.
  botToken: process.env.SLACK_BOT_TOKEN || '',

  // Signing secret — only needed if/when inbound webhooks are added later.
  signingSecret: process.env.SLACK_SIGNING_SECRET || '',

  // OAuth credentials for the "Connect Slack" per-intern account-linking flow.
  // Only used to identify who an intern is on Slack (user_scope=identify) —
  // actually sending DMs still uses the bot token above.
  clientId: process.env.SLACK_CLIENT_ID || '',
  clientSecret: process.env.SLACK_CLIENT_SECRET || '',
  redirectUri: process.env.SLACK_REDIRECT_URI || 'http://localhost:5000/api/slack/oauth/callback',

  // Real channel names for this workspace (see comment above).
  defaultChannel: process.env.SLACK_DEFAULT_CHANNEL || '#all-intern-communication',
  supervisorChannel: process.env.SLACK_SUPERVISOR_CHANNEL || '#supervisor',
  attendanceChannel: process.env.SLACK_ATTENDANCE_CHANNEL || '#attendance',

  // Public base URL of the frontend (CRA dev server defaults to :3000).
  appUrl: (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, ''),

  // Convenience flag: true only when the minimum credentials are present.
  get enabled() {
    return Boolean(this.botToken);
  },

  // True only when the OAuth linking flow can actually run.
  get oauthEnabled() {
    return Boolean(this.clientId && this.clientSecret);
  },
};

module.exports = slackConfig;
