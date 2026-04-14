'use client';

import { useState, useEffect, useCallback } from 'react';
import { DailyReport } from '@/lib/types';
import MarketSummary from '@/components/MarketSummary';
import StockTable from '@/components/StockTable';

type TabKey = 'volumeSurge' | 'newHigh';

export default function Home() {
  const [report, setReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('volumeSurge');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/stocks');
      if (!res.ok) throw new Error('数据获取失败');
      const data: DailyReport = await res.json();
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // 每5分钟自动刷新
    const timer = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, [fetchData]);

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'volumeSurge', label: '放量大涨', icon: '🔥' },
    { key: 'newHigh', label: '创新高', icon: '📈' },
  ];

  return (
    <main className="min-h-screen bg-[#0a0e17] text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#0d1321]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center font-bold text-sm">
              A
            </div>
            <div>
              <h1 className="text-lg font-bold">A股每日热点监控</h1>
              <p className="text-xs text-gray-500">放量大涨 · 创新高 · 按市值分梯队</p>
            </div>
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-gray-500 border-t-white rounded-full animate-spin" />
            ) : (
              <span>↻</span>
            )}
            刷新数据
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Error */}
        {error && (
          <div className="bg-red-950/50 border border-red-800 rounded-xl p-4 text-red-300">
            ⚠ {error}
            <button onClick={fetchData} className="ml-3 underline hover:text-red-200">
              重试
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && !report && (
          <div className="space-y-4">
            <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6 animate-pulse">
              <div className="h-6 bg-gray-800 rounded w-32 mb-4" />
              <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-20 bg-gray-800 rounded-lg" />
                ))}
              </div>
            </div>
            <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6 animate-pulse">
              <div className="h-6 bg-gray-800 rounded w-48 mb-4" />
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-10 bg-gray-800 rounded mb-2" />
              ))}
            </div>
          </div>
        )}

        {/* Data loaded */}
        {report && (
          <>
            <MarketSummary
              summary={report.summary}
              date={report.date}
              updateTime={report.updateTime}
            />

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-800 pb-0">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                    activeTab === tab.key
                      ? 'border-red-500 text-white'
                      : 'border-transparent text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {tab.icon} {tab.label}
                  <span className="ml-1.5 text-xs opacity-60">
                    ({report[tab.key]?.length || 0})
                  </span>
                </button>
              ))}
            </div>

            {/* Content */}
            {activeTab === 'volumeSurge' && (
              <StockTable
                stocks={report.volumeSurge}
                title="放量大涨"
                icon="🔥"
              />
            )}
            {activeTab === 'newHigh' && (
              <StockTable
                stocks={report.newHigh}
                title="创新高"
                icon="📈"
              />
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-12 py-6 text-center text-xs text-gray-600">
        数据来源：东方财富 · 仅供参考，不构成投资建议 · 每5分钟自动刷新
      </footer>
    </main>
  );
}
