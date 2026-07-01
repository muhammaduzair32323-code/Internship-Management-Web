const router = require('express').Router();
const slackConfig = require('../config/slack');
const slackState = require('../utils/slackState');
const slackService = require('../services/slackService');
const InternModel = require('../models/internModel');

// GET /api/slack/oauth/callback — public route, NOT behind authMiddleware.
// Slack redirects the bare browser here with no Authorization header, so the
// signed `state` param is what tells us which intern initiated this.
router.get('/callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    return res.redirect(`${slackConfig.appUrl}/intern/dashboard?slack=denied`);
  }
  const internId = slackState.verify(state);
  if (!internId || !code) {
    return res.redirect(`${slackConfig.appUrl}/intern/dashboard?slack=invalid_state`);
  }

  try {
    const slackUserId = await slackService.exchangeOAuthCode(code);
    const intern = await InternModel.getById(internId);
    if (!intern) {
      return res.redirect(`${slackConfig.appUrl}/intern/dashboard?slack=error`);
    }
    await InternModel.saveSlackUserId(internId, slackUserId);
    return res.redirect(`${slackConfig.appUrl}/intern/dashboard?slack=connected`);
  } catch (err) {
    console.error('Slack OAuth callback failed:', err.message);
    return res.redirect(`${slackConfig.appUrl}/intern/dashboard?slack=error`);
  }
});

module.exports = router;
