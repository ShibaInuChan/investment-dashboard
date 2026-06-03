const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  const filePath = path.join(__dirname, '..', 'data', 'insight.json');

  if (!fs.existsSync(filePath)) {
    return res.status(503).json({ error: 'まだinsightが生成されていません。毎月25日に自動生成されます。' });
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  res.setHeader('Cache-Control', 'public, s-maxage=86400');
  res.json(data);
};
