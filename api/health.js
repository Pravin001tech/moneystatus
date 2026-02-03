// Health check endpoint
module.exports = async (req, res) => {
  res.json({ status: 'ok', message: 'Wealth Ranker API is running' });
};
