require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');

const app = express();
const PORT = 3000;
const FRED_API_KEY = process.env.FRED_API_KEY;

app.use(express.static('.'));

async function fredFetch(seriesId, limit) {
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${FRED_API_KEY}&file_type=json&sort_order=desc&limit=${limit}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.observations.filter(d => d.value !== '.').reverse();
}

app.get('/api/indicators', async (req, res) => {
  try {
    const [us10y, jp10y, cpi, coreCpi, unemployment, fedRate] = await Promise.all([
      fredFetch('DGS10', 30),
      fredFetch('IRLTLT01JPM156N', 24),
      fredFetch('CPIAUCSL', 25),
      fredFetch('CPILFESL', 25),
      fredFetch('UNRATE', 13),
      fredFetch('FEDFUNDS', 13),
    ]);

    function yoyPct(data, idx) {
      if (idx < 12) return null;
      const curr = parseFloat(data[idx].value);
      const prev = parseFloat(data[idx - 12].value);
      if (isNaN(curr) || isNaN(prev)) return null;
      return parseFloat(((curr - prev) / prev * 100).toFixed(2));
    }

    const cpiYoy = cpi.slice(12).map((_, i) => ({
      date: cpi[12 + i].date.slice(0, 7),
      value: yoyPct(cpi, 12 + i)
    }));

    const coreYoy = coreCpi.slice(12).map((_, i) => ({
      date: coreCpi[12 + i].date.slice(0, 7),
      value: yoyPct(coreCpi, 12 + i)
    }));

    res.json({
      us10y,
      jp10y,
      cpiYoy,
      coreYoy,
      unemployment,
      fedRate,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`サーバー起動中: http://localhost:${PORT}`);
});