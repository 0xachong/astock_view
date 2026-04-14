import { StockItem, StockWithTag } from './types';

// ==================== 港股 ====================

interface SinaHKItem {
  symbol: string;
  name: string;
  lasttrade: string;
  prevclose: string;
  open: string;
  high: string;
  low: string;
  volume: string;
  amount: string;
  changepercent: string;
  pricechange: string;
  high_52week: string;
  low_52week: string;
  pe_ratio: string;
  market_value: string;
}

export async function fetchHKStocks(): Promise<StockItem[]> {
  const results: StockItem[] = [];

  // 获取涨幅前200只港股
  for (let page = 1; page <= 4; page++) {
    const url = `https://vip.stock.finance.sina.com.cn/quotes_service/api/json_v2.php/Market_Center.getHKStockData?page=${page}&num=50&sort=changepercent&asc=0&node=qbgg_hk`;
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          'Referer': 'https://finance.sina.com.cn/',
        },
      });
      const data: SinaHKItem[] = await res.json();
      if (!Array.isArray(data)) break;

      for (const item of data) {
        const price = parseFloat(item.lasttrade) || 0;
        const changePercent = parseFloat(item.changepercent) || 0;
        const volume = parseInt(item.volume) || 0;

        if (price <= 0 || changePercent <= 0) continue;

        results.push({
          code: item.symbol,
          name: item.name,
          price,
          changePercent,
          changeAmount: parseFloat(item.pricechange) || 0,
          volume: Math.round(volume / 100), // 转为手(100股)
          volumeRatio: 0, // 新浪港股无量比
          turnoverRate: 0,
          marketCap: 0,
          circulatingCap: 0,
          amplitude: price > 0 ? ((parseFloat(item.high) - parseFloat(item.low)) / parseFloat(item.prevclose) * 100) : 0,
          high: parseFloat(item.high) || 0,
          low: parseFloat(item.low) || 0,
          open: parseFloat(item.open) || 0,
          prevClose: parseFloat(item.prevclose) || 0,
          pe: parseFloat(item.pe_ratio) || 0,
          industry: '',
        });
      }
    } catch {
      break;
    }
  }

  return results;
}

// ==================== 美股 ====================

interface SinaUSRawData {
  count: string;
  data: SinaUSItem[];
}

interface SinaUSItem {
  symbol: string;
  cname: string;
  name: string;
  price: string;
  diff: string;
  chg: string;
  preclose: string;
  open: string;
  high: string;
  low: string;
  volume: string;
  mktcap: string;
  pe: string;
  category: string | null;
  market: string;
  amplitude: string;
}

export async function fetchUSStocks(): Promise<StockItem[]> {
  const results: StockItem[] = [];

  // 新浪美股排行 - JSONP 格式，需要解析
  for (let page = 1; page <= 4; page++) {
    const url = `https://stock.finance.sina.com.cn/usstock/api/jsonp.php/data/US_CategoryService.getList?page=${page}&num=50&sort=chgper&asc=0&market=&id=`;
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          'Referer': 'https://stock.finance.sina.com.cn/usstock/',
        },
      });
      const text = await res.text();

      // 解析 JSONP: /*<script>...</script>*/\ndata({...})
      const jsonMatch = text.match(/data\((\{[\s\S]*\})\)/);
      if (!jsonMatch) break;

      const raw: SinaUSRawData = JSON.parse(jsonMatch[1]);
      if (!raw.data || !Array.isArray(raw.data)) break;

      for (const item of raw.data) {
        const price = parseFloat(item.price) || 0;
        const changePercent = parseFloat(item.chg) || 0;
        const mktcap = parseFloat(item.mktcap) || 0;

        if (price <= 0 || changePercent <= 0) continue;

        results.push({
          code: item.symbol,
          name: item.cname || item.name,
          price,
          changePercent,
          changeAmount: parseFloat(item.diff) || 0,
          volume: parseInt(item.volume) || 0,
          volumeRatio: 0,
          turnoverRate: 0,
          marketCap: mktcap / 1e8, // 转为亿(美元)
          circulatingCap: 0,
          amplitude: parseFloat(item.amplitude) || 0,
          high: parseFloat(item.high) || 0,
          low: parseFloat(item.low) || 0,
          open: parseFloat(item.open) || 0,
          prevClose: parseFloat(item.preclose) || 0,
          pe: parseFloat(item.pe) || 0,
          industry: item.category || '',
        });
      }
    } catch {
      break;
    }
  }

  return results;
}

// ==================== 筛选与分类 ====================

function classifyTierHK(marketCap: number): StockWithTag['tier'] {
  // 港股无市值数据时按价格粗略分（新浪接口无市值）
  // 这里先返回统一分类
  if (marketCap >= 1000) return '超大盘';
  if (marketCap >= 300) return '大盘';
  if (marketCap >= 100) return '中盘';
  if (marketCap >= 30) return '小盘';
  return '微盘';
}

function classifyTierUS(marketCapUSD: number): StockWithTag['tier'] {
  // 美股市值单位：亿美元
  if (marketCapUSD >= 10000) return '超大盘';   // ≥1万亿美元
  if (marketCapUSD >= 1000) return '大盘';      // 1000亿-1万亿美元
  if (marketCapUSD >= 100) return '中盘';       // 100-1000亿美元
  if (marketCapUSD >= 10) return '小盘';        // 10-100亿美元
  return '微盘';
}

function buildTagsHKUS(s: StockItem): string[] {
  const tags: string[] = [];
  if (s.changePercent >= 20) tags.push('暴涨');
  else if (s.changePercent >= 10) tags.push('大涨');
  else if (s.changePercent >= 5) tags.push('强势');

  return tags;
}

export function filterHKVolumeSurge(stocks: StockItem[]): StockWithTag[] {
  return stocks
    .filter(s => s.changePercent >= 5 && s.price > 0)
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, 80)
    .map(s => ({
      ...s,
      tags: buildTagsHKUS(s),
      tier: classifyTierHK(s.marketCap),
    }));
}

export function filterHKNewHigh(stocks: StockItem[]): StockWithTag[] {
  return stocks
    .filter(s =>
      s.changePercent >= 3 &&
      s.high > 0 &&
      s.price > 0 &&
      Math.abs(s.high - s.price) / s.price < 0.005
    )
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, 80)
    .map(s => ({
      ...s,
      tags: buildTagsHKUS(s),
      tier: classifyTierHK(s.marketCap),
    }));
}

export function filterUSVolumeSurge(stocks: StockItem[]): StockWithTag[] {
  return stocks
    .filter(s => s.changePercent >= 5 && s.price > 0)
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, 80)
    .map(s => ({
      ...s,
      tags: buildTagsHKUS(s),
      tier: classifyTierUS(s.marketCap),
    }));
}

export function filterUSNewHigh(stocks: StockItem[]): StockWithTag[] {
  return stocks
    .filter(s =>
      s.changePercent >= 3 &&
      s.high > 0 &&
      s.price > 0 &&
      Math.abs(s.high - s.price) / s.price < 0.005
    )
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, 80)
    .map(s => ({
      ...s,
      tags: buildTagsHKUS(s),
      tier: classifyTierUS(s.marketCap),
    }));
}
