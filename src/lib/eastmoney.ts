import { StockItem, StockWithTag, MarketReport } from './types';

const EASTMONEY_API = 'https://push2.eastmoney.com/api/qt/clist/get';

// 东方财富字段映射
const FIELDS = 'f2,f3,f4,f5,f6,f7,f8,f9,f10,f12,f14,f15,f16,f17,f18,f20,f21,f100';

async function fetchAllStocks(): Promise<StockItem[]> {
  const results: StockItem[] = [];

  for (const fs of ['m:0+t:6,m:0+t:80', 'm:1+t:2,m:1+t:23']) {
    let page = 1;
    let hasMore = true;
    while (hasMore) {
      const params = new URLSearchParams({
        cb: '',
        pn: String(page),
        pz: '5000',
        po: '1',
        np: '1',
        ut: 'bd1d9ddb04089700cf9c27f6f7426281',
        fltt: '2',
        invt: '2',
        fid: 'f3',
        fs: fs,
        fields: FIELDS,
      });

      const url = `${EASTMONEY_API}?${params.toString()}`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          'Referer': 'https://quote.eastmoney.com/',
        },
        next: { revalidate: 300 },
      });

      const data = await res.json();
      if (!data?.data?.diff) {
        hasMore = false;
        break;
      }

      const items = data.data.diff;
      for (const item of items) {
        if (!item.f12 || item.f2 === '-') continue;
        results.push({
          code: item.f12,
          name: item.f14 || '',
          price: item.f2 ?? 0,
          changePercent: item.f3 ?? 0,
          changeAmount: item.f4 ?? 0,
          volume: item.f5 ?? 0,
          volumeRatio: item.f10 ?? 0,
          turnoverRate: item.f8 ?? 0,
          marketCap: item.f20 ? item.f20 / 1e8 : 0,
          circulatingCap: item.f21 ? item.f21 / 1e8 : 0,
          amplitude: item.f7 ?? 0,
          high: item.f15 ?? 0,
          low: item.f16 ?? 0,
          open: item.f17 ?? 0,
          prevClose: item.f18 ?? 0,
          pe: item.f9 ?? 0,
          industry: item.f100 || '未知',
        });
      }

      if (items.length < 5000) {
        hasMore = false;
      } else {
        page++;
      }
    }
  }

  return results;
}

function classifyTier(marketCap: number): StockWithTag['tier'] {
  if (marketCap >= 1000) return '超大盘';
  if (marketCap >= 300) return '大盘';
  if (marketCap >= 100) return '中盘';
  if (marketCap >= 30) return '小盘';
  return '微盘';
}

function filterVolumeSurge(stocks: StockItem[]): StockWithTag[] {
  return stocks
    .filter(s =>
      s.changePercent >= 5 &&
      s.volumeRatio >= 1.5 &&
      s.price > 0 &&
      !s.name.includes('ST') &&
      !s.name.includes('退')
    )
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, 100)
    .map(s => ({
      ...s,
      tags: buildTags(s),
      tier: classifyTier(s.marketCap),
    }));
}

function filterNewHigh(stocks: StockItem[]): StockWithTag[] {
  return stocks
    .filter(s =>
      s.changePercent >= 3 &&
      s.high > 0 &&
      s.price > 0 &&
      Math.abs(s.high - s.price) / s.price < 0.005 &&
      s.turnoverRate >= 2 &&
      !s.name.includes('ST') &&
      !s.name.includes('退')
    )
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, 100)
    .map(s => ({
      ...s,
      tags: buildTags(s),
      tier: classifyTier(s.marketCap),
    }));
}

function buildTags(s: StockItem): string[] {
  const tags: string[] = [];
  if (s.changePercent >= 9.9) tags.push('涨停');
  else if (s.changePercent >= 7) tags.push('大涨');
  else if (s.changePercent >= 5) tags.push('强势');

  if (s.volumeRatio >= 3) tags.push('巨量');
  else if (s.volumeRatio >= 2) tags.push('放量');
  else if (s.volumeRatio >= 1.5) tags.push('温和放量');

  if (s.turnoverRate >= 15) tags.push('高换手');
  return tags;
}

export async function fetchAStockReport(): Promise<MarketReport> {
  const stocks = await fetchAllStocks();

  return {
    volumeSurge: filterVolumeSurge(stocks),
    newHigh: filterNewHigh(stocks),
    summary: {
      totalUp: stocks.filter(s => s.changePercent > 0).length,
      totalDown: stocks.filter(s => s.changePercent < 0).length,
      limitUp: stocks.filter(s => s.changePercent >= 9.9).length,
      limitDown: stocks.filter(s => s.changePercent <= -9.9).length,
    },
  };
}
