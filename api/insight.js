const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  const dataDir = path.join(__dirname, '..', 'data');
  const { month } = req.query;

  // 特定月のアーカイブを返す
  if (month) {
    const archivePath = path.join(dataDir, `insight-${month}.json`);
    if (!fs.existsSync(archivePath)) {
      return res.status(404).json({ error: `${month} のデータが見つかりません` });
    }
    const data = JSON.parse(fs.readFileSync(archivePath, 'utf8'));
    res.setHeader('Cache-Control', 'public, s-maxage=86400');
    return res.json(data);
  }

  // 最新を返す（アーカイブ一覧も付与）
  const latestPath = path.join(dataDir, 'insight.json');
  if (!fs.existsSync(latestPath)) {
    return res.status(503).json({ error: 'まだinsightが生成されていません。毎月25日に自動生成されます。' });
  }

  const data = JSON.parse(fs.readFileSync(latestPath, 'utf8'));

  // data/ にある insight-YYYY-MM.json を列挙
  const archives = fs.readdirSync(dataDir)
    .filter(f => /^insight-\d{4}-\d{2}\.json$/.test(f))
    .map(f => f.replace('insight-', '').replace('.json', ''))
    .sort()
    .reverse();

  res.setHeader('Cache-Control', 'public, s-maxage=86400');
  res.json({ ...data, archives });
};
