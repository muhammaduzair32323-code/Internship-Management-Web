const router = require('express').Router();
const { internOnly } = require('../middleware/authMiddleware');
const slackConfig = require('../config/slack');
const slackState = require('../utils/slackState');
const InternModel = require('../models/internModel');

// GET /api/intern/slack/connect — mounted with authMiddleware in server.js,
// so req.user is already set here. Returns the Slack authorize URL for the
// frontend to redirect the browser to (can't 302 directly since the caller
// is an axios fetch, not a top-level navigation).
router.get('/connect', internOnly, (req, res) => {
  if (!slackConfig.oauthEnabled) {
    return res.status(503).json({ success: false, message: 'Slack account linking is not configured yet' });
  }

  const state = slackState.sign(req.user.id);
  const params = new URLSearchParams({
    client_id: slackConfig.clientId,
    user_scope: 'identify',
    redirect_uri: slackConfig.redirectUri,
    state,
  });

  res.json({ success: true, data: { url: `https://slack.com/oauth/v2/authorize?${params.toString()}` } });
});

// POST /api/intern/slack/disconnect — clears slack_user_id so the intern can
// re-run the OAuth flow (e.g. to switch which Slack account gets their DMs)
// without needing to manually log out of Slack in the browser first.
router.post('/disconnect', internOnly, async (req, res, next) => {
  try {
    await InternModel.saveSlackUserId(req.user.id, null);
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
