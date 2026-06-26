const DashboardModel = require('../models/dashboardModel');

const getStats = async (req, res, next) => {
  try {
    const data = await DashboardModel.getStats();
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

module.exports = { getStats };