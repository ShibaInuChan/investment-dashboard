const https = require('https');
const fs = require('fs');
const path = require('path');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  console.error('ANTHROPIC_API_KEY is not set');
  process.exit(1);
}

const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
if (!TAVILY_API_KEY) {
  console.error('TAVILY_API_KEY is not set');
  process.exit(1);
}

const indicatorsPath = path.join(__dirname, '..', 'data', 'indicators.json');
if (!fs.existsSync(indicatorsPath)) {
  console.error('data/indicators.json not found. Run fetch-indicators.js first.');
  process.exit(1);
}

const indicators = JSON.parse(fs.readFileSync(indicatorsPath, 'utf8'));

const us10y = parseFloat(indicators.us10y[indicators.us10y.length - 1].value);
const jp10y = parseFloat(indicators.jp10y[indicators.jp10y.length - 1].value);
const spread = (us10y - jp10y).toFixed(2);
const cpi = indicators.cpiYoy[indicators.cpiYoy.length - 1].value;
const coreCpi = indicators.coreYoy[indicators.coreYoy.length - 1].value;
const unemployment = parseFloat(indicators.unemployment[indicators.unemployment.length - 1].value);
const fedRate = parseFloat(indicators.fedRate[indicators.fedRate.length - 1].value);

const systemPrompt = `# 役割と目的
あなたは、先進国のマクロ経済環境を「国家システムの生存戦略」という構造的フレームワークで分析する、冷静なマクロ経済アナリストです。
分析の目的は、市場の短期的な変動に対して投資家が冷静に積立を継続できる「精神的インフラ」を提供することです。

# 文体の厳守事項
- 必ずですます調で書く。
- 読点（、）を適切に使い、文の区切りを明確にする。接続詞の後には必ず読点を入れる。
- 専門用語はそのまま使ってよいが、必ず「原因→結果」の順で因果を明示する。
- 一文に複数の意味を詰め込まない。一文一意を徹底する。
- 接続詞（「なぜなら」「したがって」「つまり」）を積極的に使い、論理の流れを明確にする。
- 一文を短くし、テンポよく読めるようにする。

# 世界観と構造的前提
1. 【先進国の構造的欠陥】: 企業が払う賃金だけでは社会の消費を支えられません。AIが労働の価値を下げ続けており、個人は投資による資産収益で消費を補うしかありません。投資は選択肢ではなく生存戦略です。
2. 【政府の本音と宿命】: 国家は借金をインフレで実質的に減らしながら、消費の土台である資産価格を維持・上昇させることを宿命づけられています。政府の本音は「資産価格を落としたくない」です。
3. 【政策の相殺力学】: 住宅ローンや中小企業への打撃を避けるため、日米ともに利上げは極力避けたいのが本音です。中央銀行が引き締めをしても、政府は関税・為替介入・財政出動で効果を相殺しにいきます。発言が矛盾して見えても、すべてこの「バランス取り」として一貫しています。
4. 【日本のデジタルジャンプアップ戦略】: 円安や積極財政は単なる衰退ではなく、人口減少の中で生産性を飛躍させるための国家戦略です。円安を梃子に海外IT企業のインフラ建設コストを下げ、AIデータセンターや半導体拠点を国内に誘致することで、人間の労働力をデジタル労働力に置き換えようとしています。

# 状況の「3段階識別」
1. 【ノイズ】: 短期的な指標のブレや過剰反応。構造は健全。
2. 【調整】: 金融引き締めの効果が一時的に上回り、政府の相殺策がまだ追いついていない状態。長期的には回復する蓋然性が高く、積立で数量を仕込める期間。
3. 【パラダイムシフト】: 世界の人口動態の不可逆的な反転、国内AI・半導体インフラの物理的な稼働不能、政府債務による通貨信用の完全な崩壊など、国家がシステムを維持できなくなる予兆。生存戦略の見直しが必要な転換点。

# 出力フォーマットの厳守事項
- マークダウン記号（#、##、**、*、---）は一切使用禁止。
- セクション見出しは「【タイトル】サブタイトル」の形式で1行にまとめる。
- 箇条書きは「・」を使用。
- 改行は段落区切りのみ。文中に不要な改行を入れない。
- 引用元を示す上付き文字や注釈は一切入れない。
- 各セクションは200字以内で簡潔にまとめる。

# 出力フォーマット

【構造的インサイト】[体言止めで10〜20字のニュース調サブタイトル。例：「日銀利上げ観測と米据え置きの綱引き」]

今週の数値・政策発言が構造的フレームワークの文脈でどのような必然性を持つか、200字以内で記述する。

【フェーズ判定】[「ノイズ」「調整」「パラダイムシフト」のいずれかを体言止めで10〜20字のニュース調に。例：「関税と金利の相殺が拮抗する調整局面」]

現在が3段階のどの状態かを明示し、その根拠を200字以内で記述する。

【今月の行動指針】[体言止めで10〜20字のニュース調サブタイトル。例：「6月日銀会合と関税期限を定点観測」]

タイミング投資を煽る記述は禁止。保有・積立継続を前提に、定点観測すべき焦点を200字以内で記述する。`;

const userMessage = `以下の最新マクロ経済指標と直近ニュースを元に分析してください。

厳守事項：
・分析の冒頭に前置きは一切不要です。フォーマット通りに直接出力してください。
・各セクションは必ず200字以内で完結させてください。200字を超えた時点で文を終わらせてください。
・引用元を示す上付き文字・注釈・出典リンクは一切不要です。
・文中にスペースを挿入しないでください。

【現在の指標】
- 米10年債利回り: ${us10y}%（日次最新）
- 日本10年債利回り: ${jp10y}%（月次最新）
- 日米金利差スプレッド: ${spread}%pt
- 米CPI（前年比）: ${cpi}%
- 米コアCPI（前年比）: ${coreCpi}%
- 米失業率: ${unemployment}%
- FFレート: ${fedRate}%`;

function tavilySearch(query) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ api_key: TAVILY_API_KEY, query, search_depth: 'basic', max_results: 5 });
    const options = {
      hostname: 'api.tavily.com',
      path: '/search',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function fetchNewsContext() {
  const now = new Date();
  const ym = `${now.getFullYear()}年${now.getMonth() + 1}月`;
  const queries = [
    `FRB 金融政策 ${ym}`,
    `日銀 政策金利 ${ym}`,
    `トランプ 関税 経済政策 最新`,
    `ドル円 為替 ${ym}`,
  ];

  console.log('Fetching news context via Tavily...');
  const results = await Promise.all(queries.map(q => tavilySearch(q)));

  return results.map((r, i) => {
    const snippets = (r.results || []).map(item => `・${item.title}: ${item.content?.slice(0, 200) ?? ''}`).join('\n');
    return `【検索: ${queries[i]}】\n${snippets}`;
  }).join('\n\n');
}

function callAnthropic(body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(data),
      },
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  const newsContext = await fetchNewsContext();

  const messageWithNews = `${userMessage}

【直近ニュース（Tavilyによる検索結果）】
${newsContext}`;

  console.log('Calling Anthropic API...');
  const response = await callAnthropic({
    model: 'claude-sonnet-4-5',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: messageWithNews }],
  });

  if (response.error) {
    throw new Error(JSON.stringify(response.error));
  }

  const insight = response.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('\n');

  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const payload = { insight, generatedAt: now.toISOString() };

  const dataDir = path.join(__dirname, '..', 'data');
  fs.mkdirSync(dataDir, { recursive: true });

  // 最新（常に上書き）
  fs.writeFileSync(path.join(dataDir, 'insight.json'), JSON.stringify(payload, null, 2));
  // 月次アーカイブ
  fs.writeFileSync(path.join(dataDir, `insight-${yearMonth}.json`), JSON.stringify(payload, null, 2));
  console.log(`Saved insight.json and insight-${yearMonth}.json`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
