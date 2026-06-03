const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  const filePath = path.join(__dirname, '..', 'data', 'indicators.json');

  if (!fs.existsSync(filePath)) {
    return res.status(503).json({ error: 'Data not yet available. Please wait for the next scheduled fetch.' });
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=3600');
  res.json(data);
};
