'use client';

interface MarketSummaryProps {
  summary: {
    totalUp: number;
    totalDown: number;
    limitUp: number;
    limitDown: number;
  };
  date: string;
  updateTime: string;
}

export default function MarketSummary({ summary, date, updateTime }: MarketSummaryProps) {
  const total = summary.totalUp + summary.totalDown;
  const upRatio = total > 0 ? (summary.totalUp / total * 100).toFixed(1) : '0';

  return (
    <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">市场概况</h2>
        <div className="text-sm text-gray-500">
          {date} {updateTime} 更新
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-red-950/30 rounded-lg p-4 border border-red-900/30">
          <div className="text-sm text-gray-400 mb-1">上涨家数</div>
          <div className="text-2xl font-bold text-red-400">{summary.totalUp}</div>
          <div className="text-xs text-gray-500 mt-1">占比 {upRatio}%</div>
        </div>

        <div className="bg-green-950/30 rounded-lg p-4 border border-green-900/30">
          <div className="text-sm text-gray-400 mb-1">下跌家数</div>
          <div className="text-2xl font-bold text-green-400">{summary.totalDown}</div>
        </div>

        <div className="bg-red-950/40 rounded-lg p-4 border border-red-800/40">
          <div className="text-sm text-gray-400 mb-1">涨停</div>
          <div className="text-2xl font-bold text-red-500">{summary.limitUp}</div>
        </div>

        <div className="bg-green-950/40 rounded-lg p-4 border border-green-800/40">
          <div className="text-sm text-gray-400 mb-1">跌停</div>
          <div className="text-2xl font-bold text-green-500">{summary.limitDown}</div>
        </div>
      </div>

      {/* 涨跌比例条 */}
      <div className="mt-4 h-2 rounded-full overflow-hidden bg-gray-800 flex">
        <div
          className="bg-red-500 transition-all duration-500"
          style={{ width: `${upRatio}%` }}
        />
        <div
          className="bg-green-500 transition-all duration-500"
          style={{ width: `${100 - Number(upRatio)}%` }}
        />
      </div>
    </div>
  );
}
