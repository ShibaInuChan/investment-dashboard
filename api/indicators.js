const fetch = require('node-fetch');

// 系列ごとに個別キャッシュ
const seriesCache = {};
let resultCache = null;
let resultCacheTime = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1時間

module.exports = async (req, res) => {
  const FRED_API_KEY = process.env.FRED_API_KEY;

  if (!FRED_API_KEY) {
    return res.status(500).json({ error: 'FRED_API_KEY is not set' });
  }

  // 全体キャッシュが有効なら即返す
  if (resultCache && Date.now() - resultCacheTime < CACHE_TTL) {
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=600');
    return res.json(resultCache);
  }

  async function fredFetch(seriesId, limit) {
    const cached = seriesCache[seriesId];

    // 個別キャッシュが有効なら使う
    if (cached && Date.now() - cached.time < CACHE_TTL) {
      return cached.data;
    }

    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${FRED_API_KEY}&file_type=json&sort_order=desc&limit=${limit}`;
    const r = await fetch(url);
    const data = await r.json();

    if (!data.observations) {
      // 429等の場合、古い個別キャッシュで代替
      if (cached) {
        console.warn(`FRED error for ${seriesId}, using stale cache:`, data.error_message);
        return cached.data;
      }
      console.error(`FRED error for ${seriesId}:`, JSON.stringify(data));
      throw new Error(`FRED API error for ${seriesId}: ${JSON.stringify(data)}`);
    }

    const result = data.observations.filter(d => d.value !== '.').reverse();
    seriesCache[seriesId] = { data: result, time: Date.now() };
    return result;
  }

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

    const result = { us10y, jp10y, cpiYoy, coreYoy, unemployment, fedRate };

    resultCache = result;
    resultCacheTime = Date.now();

    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=600');
    res.json(result);
  } catch (error) {
    if (resultCache) {
      console.warn('Using stale result cache due to error:', error.message);
      res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=3600');
      return res.json(resultCache);
    }
    console.error('indicators error:', error.message);
    res.status(500).json({ error: error.message });
  }
};
