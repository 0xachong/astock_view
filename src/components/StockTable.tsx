'use client';

import { StockWithTag, MarketTier, MarketType } from '@/lib/types';

const TIER_ORDER: MarketTier[] = ['超大盘', '大盘', '中盘', '小盘', '微盘'];
const TIER_COLORS: Record<MarketTier, string> = {
  '超大盘': 'bg-red-900/30 text-red-300 border-red-700/50',
  '大盘': 'bg-orange-900/30 text-orange-300 border-orange-700/50',
  '中盘': 'bg-yellow-900/30 text-yellow-300 border-yellow-700/50',
  '小盘': 'bg-blue-900/30 text-blue-300 border-blue-700/50',
  '微盘': 'bg-gray-800/30 text-gray-400 border-gray-700/50',
};

const TAG_COLORS: Record<string, string> = {
  '涨停': 'bg-red-600 text-white',
  '暴涨': 'bg-red-600 text-white',
  '大涨': 'bg-red-500/80 text-white',
  '强势': 'bg-orange-500/80 text-white',
  '巨量': 'bg-purple-500/80 text-white',
  '放量': 'bg-purple-400/60 text-white',
  '温和放量': 'bg-purple-300/40 text-purple-100',
  '高换手': 'bg-cyan-500/60 text-white',
};

function formatMarketCap(cap: number, market: MarketType): string {
  if (cap <= 0) return '-';
  if (market === 'us') {
    // 美股市值单位是亿美元
    if (cap >= 10000) return `${(cap / 10000).toFixed(1)}万亿$`;
    if (cap >= 1) return `${cap.toFixed(0)}亿$`;
    return `${(cap * 10000).toFixed(0)}万$`;
  }
  if (cap >= 10000) return `${(cap / 10000).toFixed(1)}万亿`;
  if (cap >= 1) return `${cap.toFixed(0)}亿`;
  return `${(cap * 10000).toFixed(0)}万`;
}

function formatVolume(vol: number): string {
  if (vol <= 0) return '-';
  if (vol >= 10000) return `${(vol / 10000).toFixed(1)}万手`;
  return `${vol}手`;
}

function getStockUrl(code: string, market: MarketType): string {
  if (market === 'hk') {
    return `https://finance.sina.com.cn/stock/hkstock/${code}/detail.shtml`;
  }
  if (market === 'us') {
    return `https://finance.sina.com.cn/stock/usstock/${code}/detail.shtml`;
  }
  const prefix = code.startsWith('6') ? '1.' : '0.';
  return `https://quote.eastmoney.com/${prefix}${code}.html`;
}

interface StockTableProps {
  stocks: StockWithTag[];
  title: string;
  icon: string;
  market: MarketType;
}

export default function StockTable({ stocks, title, icon, market }: StockTableProps) {
  const showVolumeRatio = market === 'a';
  const showTurnover = market === 'a';

  const grouped = TIER_ORDER.reduce((acc, tier) => {
    const items = stocks.filter(s => s.tier === tier);
    if (items.length > 0) acc.push({ tier, items });
    return acc;
  }, [] as { tier: MarketTier; items: StockWithTag[] }[]);

  if (stocks.length === 0) {
    return (
      <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-8 text-center">
        <p className="text-gray-500">暂无数据（可能非交易时段）</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <span>{icon}</span>
        <span>{title}</span>
        <span className="text-sm font-normal text-gray-500">({stocks.length}只)</span>
      </h2>

      {grouped.map(({ tier, items }) => (
        <div key={tier} className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
          <div className={`px-4 py-2 border-b ${TIER_COLORS[tier]} flex items-center justify-between`}>
            <span className="font-semibold">{tier}</span>
            <span className="text-sm opacity-70">{items.length}只</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-gray-800">
                  <th className="text-left px-4 py-2 font-medium">代码/名称</th>
                  <th className="text-right px-3 py-2 font-medium">最新价</th>
                  <th className="text-right px-3 py-2 font-medium">涨跌幅</th>
                  {showVolumeRatio && <th className="text-right px-3 py-2 font-medium">量比</th>}
                  {showTurnover && <th className="text-right px-3 py-2 font-medium">换手率</th>}
                  <th className="text-right px-3 py-2 font-medium">成交量</th>
                  <th className="text-right px-3 py-2 font-medium">总市值</th>
                  <th className="text-left px-3 py-2 font-medium">行业</th>
                  <th className="text-left px-3 py-2 font-medium">标签</th>
                </tr>
              </thead>
              <tbody>
                {items.map((stock) => (
                  <tr
                    key={stock.code}
                    className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="px-4 py-2.5">
                      <a
                        href={getStockUrl(stock.code, market)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        <div className="font-mono text-gray-400 text-xs">{stock.code}</div>
                        <div className="font-medium text-white">{stock.name}</div>
                      </a>
                    </td>
                    <td className="text-right px-3 py-2.5 font-mono text-red-400">
                      {stock.price.toFixed(2)}
                    </td>
                    <td className="text-right px-3 py-2.5">
                      <span className={`font-mono font-semibold ${
                        stock.changePercent >= 20
                          ? 'text-red-500'
                          : stock.changePercent >= 10
                          ? 'text-red-500'
                          : stock.changePercent >= 5
                          ? 'text-red-400'
                          : 'text-orange-400'
                      }`}>
                        +{stock.changePercent.toFixed(2)}%
                      </span>
                    </td>
                    {showVolumeRatio && (
                      <td className="text-right px-3 py-2.5 font-mono">
                        <span className={stock.volumeRatio >= 3 ? 'text-purple-400 font-semibold' : 'text-gray-300'}>
                          {stock.volumeRatio.toFixed(2)}
                        </span>
                      </td>
                    )}
                    {showTurnover && (
                      <td className="text-right px-3 py-2.5 font-mono text-gray-300">
                        {stock.turnoverRate.toFixed(1)}%
                      </td>
                    )}
                    <td className="text-right px-3 py-2.5 font-mono text-gray-400 text-xs">
                      {formatVolume(stock.volume)}
                    </td>
                    <td className="text-right px-3 py-2.5 text-gray-300 text-xs">
                      {formatMarketCap(stock.marketCap, market)}
                    </td>
                    <td className="px-3 py-2.5 text-gray-400 text-xs">
                      {stock.industry || '-'}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-1 flex-wrap">
                        {stock.tags.map(tag => (
                          <span
                            key={tag}
                            className={`px-1.5 py-0.5 rounded text-xs ${TAG_COLORS[tag] || 'bg-gray-700 text-gray-300'}`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
