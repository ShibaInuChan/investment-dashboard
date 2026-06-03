const https = require('https');
const fs = require('fs');
const path = require('path');

const FRED_API_KEY = process.env.FRED_API_KEY;
if (!FRED_API_KEY) {
  console.error('FRED_API_KEY is not set');
  process.exit(1);
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function fredFetch(seriesId, limit) {
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${FRED_API_KEY}&file_type=json&sort_order=desc&limit=${limit}`;
  const data = await fetchJson(url);
  if (!data.observations) {
    throw new Error(`FRED error for ${seriesId}: ${JSON.stringify(data)}`);
  }
  return data.observations.filter(d => d.value !== '.').reverse();
}

function yoyPct(data, idx) {
  if (idx < 12) return null;
  const curr = parseFloat(data[idx].value);
  const prev = parseFloat(data[idx - 12].value);
  if (isNaN(curr) || isNaN(prev)) return null;
  return parseFloat(((curr - prev) / prev * 100).toFixed(2));
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  const us10y      = await fredFetch('DGS10', 30);           await sleep(500);
  const jp10y      = await fredFetch('IRLTLT01JPM156N', 24); await sleep(500);
  const cpi        = await fredFetch('CPIAUCSL', 25);        await sleep(500);
  const coreCpi    = await fredFetch('CPILFESL', 25);        await sleep(500);
  const unemployment = await fredFetch('UNRATE', 13);        await sleep(500);
  const fedRate    = await fredFetch('FEDFUNDS', 13);

  const cpiYoy = cpi.slice(12).map((_, i) => ({
    date: cpi[12 + i].date.slice(0, 7),
    value: yoyPct(cpi, 12 + i)
  }));

  const coreYoy = coreCpi.slice(12).map((_, i) => ({
    date: coreCpi[12 + i].date.slice(0, 7),
    value: yoyPct(coreCpi, 12 + i)
  }));

  const result = { us10y, jp10y, cpiYoy, coreYoy, unemployment, fedRate, fetchedAt: new Date().toISOString() };

  const outPath = path.join(__dirname, '..', 'data', 'indicators.json');
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
  console.log('Saved to', outPath);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
