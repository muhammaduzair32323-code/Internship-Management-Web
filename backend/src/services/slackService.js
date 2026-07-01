'use strict';
/**
 * SlackService — outbound Slack notifications + the OAuth identity exchange
 * for the "Connect Slack" account-linking flow.
 * Uses Node's built-in `https` module; no @slack/web-api dependency required.
 * Every public method is a no-op (resolves silently) when Slack isn't
 * configured, so callers never need to guard on slackConfig.enabled.
 */
const https = require('https');
const slackConfig = require('../config/slack');

/**
 * POST to https://slack.com/api/{method}.
 * OAuth endpoints (oauth.v2.access) need form-urlencoded body + client
 * credentials, NOT a bearer token. Every other method uses JSON + bot token.
 */
function slackApiCall(method, body) {
  return new Promise((resolve, reject) => {
    const isOAuth = method.startsWith('oauth.');
    const payload = isOAuth ? new URLSearchParams(body).toString() : JSON.stringify(body);
    const headers = isOAuth
      ? {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(payload),
        }
      : {
          Authorization: `Bearer ${slackConfig.botToken}`,
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Length': Buffer.byteLength(payload),
        };
    const options = {
      hostname: 'slack.com',
      path: `/api/${method}`,
      method: 'POST',
      headers,
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(data); } catch {
          return reject(new Error('Invalid JSON from Slack API'));
        }
        if (!parsed.ok) return reject(new Error(`Slack API error [${method}]: ${parsed.error}`));
        resolve(parsed);
      });
    });

    req.on('error', reject);
    req.setTimeout(8000, () => { req.destroy(new Error('Slack API request timed out')); });
    req.write(payload);
    req.end();
  });
}

/**
 * Open (or retrieve) a DM channel with a Slack user and return the channel ID.
 * Required before chat.postMessage — posting to a bare user ID (U...)
 * without this fails with channel_not_found.
 */
async function openDmChannel(slackUserId) {
  const r = await slackApiCall('conversations.open', { users: slackUserId });
  return r.channel.id;
}

function header(text) {
  return { type: 'header', text: { type: 'plain_text', text, emoji: true } };
}
function section(mrkdwn) {
  return { type: 'section', text: { type: 'mrkdwn', text: mrkdwn } };
}
function fields(...pairs) {
  return { type: 'section', fields: pairs.map((t) => ({ type: 'mrkdwn', text: t })) };
}
function divider() { return { type: 'divider' }; }

/**
 * Post to the supervisor channel when an intern submits work for a task.
 * This one stays a channel post (by design) — a supervisor genuinely needs
 * to be told "new work is waiting," and there's no single intern to DM here.
 * @param {object} ctx { id, task_title, intern_name, notes }
 */
async function sendSubmissionCreated(ctx) {
  if (!slackConfig.enabled) return;

  const blocks = [
    header('📥 New Submission'),
    fields(
      `*Intern:* ${ctx.intern_name || 'Unknown'}`,
      `*Task:* ${ctx.task_title || 'Untitled task'}`
    ),
    ctx.notes ? section(`*Notes:*\n${String(ctx.notes).slice(0, 500)}`) : null,
    divider(),
    section(`<${slackConfig.appUrl}/tasks|🔗 Review in the portal>`),
  ].filter(Boolean);

  try {
    await slackApiCall('chat.postMessage', {
      channel: slackConfig.supervisorChannel,
      text: `📥 New submission from ${ctx.intern_name || 'an intern'}: ${ctx.task_title || ''}`,
      blocks,
    });
  } catch (err) {
    console.error('Slack submission-created notification failed:', err.message);
  }
}

/**
 * DM the intern directly when their submission is reviewed. Silently does
 * nothing if the intern hasn't connected their Slack account yet — callers
 * pass whatever InternModel.getSlackUserId() returned, including null.
 * @param {string|null} slackUserId  the intern's linked Slack user ID
 * @param {object} ctx { id, task_title, status, score, feedback }
 *   status: 'approved' | 'rejected' | 'revision_requested'
 */
async function sendSubmissionReviewed(slackUserId, ctx) {
  if (!slackConfig.enabled || !slackUserId) return;

  const meta = {
    approved: { emoji: '✅', label: 'Approved' },
    rejected: { emoji: '❌', label: 'Rejected' },
    revision_requested: { emoji: '🔄', label: 'Revision Requested' },
  }[ctx.status] || { emoji: '📝', label: ctx.status };

  const blocks = [
    header(`${meta.emoji} Submission ${meta.label}`),
    fields(`*Task:* ${ctx.task_title || 'Untitled task'}`),
    ctx.score != null ? section(`*Score:* ${ctx.score}`) : null,
    ctx.feedback ? section(`*Feedback:*\n${String(ctx.feedback).slice(0, 500)}`) : null,
    divider(),
    section(`<${slackConfig.appUrl}/tasks|🔗 View in the portal>`),
  ].filter(Boolean);

  try {
    const dmChannel = await openDmChannel(slackUserId);
    await slackApiCall('chat.postMessage', {
      channel: dmChannel,
      text: `${meta.emoji} Your submission was ${meta.label.toLowerCase()}`,
      blocks,
    });
  } catch (err) {
    console.error('Slack submission-reviewed DM failed:', err.message, { slackUserId });
  }
}

/**
 * Exchange an OAuth `code` for the intern's Slack identity.
 * Only reads authed_user.id — this app never stores a per-user Slack token,
 * DMs are always sent with the bot token above.
 * @param {string} code  OAuth code from Slack's redirect
 * @returns {Promise<string>} the intern's Slack user ID (U...)
 */
async function exchangeOAuthCode(code) {
  const result = await slackApiCall('oauth.v2.access', {
    client_id: slackConfig.clientId,
    client_secret: slackConfig.clientSecret,
    code,
    redirect_uri: slackConfig.redirectUri,
  });
  const slackUserId = result.authed_user?.id;
  if (!slackUserId) throw new Error('Slack did not return an authed_user id — check the "identify" user scope is granted');
  return slackUserId;
}

module.exports = { sendSubmissionCreated, sendSubmissionReviewed, exchangeOAuthCode };
