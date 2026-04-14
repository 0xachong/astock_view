import { NextResponse } from 'next/server';
import { DailyReport } from '@/lib/types';
import { fetchAStockReport } from '@/lib/eastmoney';
import {
  fetchHKStocks, fetchUSStocks,
  filterHKVolumeSurge, filterHKNewHigh,
  filterUSVolumeSurge, filterUSNewHigh,
} from '@/lib/sina';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const preferredRegion = 'hkg1';

export async function GET() {
  try {
    // 并行获取三个市场数据
    const [aReport, hkStocks, usStocks] = await Promise.all([
      fetchAStockReport(),
      fetchHKStocks(),
      fetchUSStocks(),
    ]);

    const report: DailyReport = {
      date: new Date().toISOString(),
      updateTime: new Date().toISOString(),
      markets: {
        a: aReport,
        hk: {
          volumeSurge: filterHKVolumeSurge(hkStocks),
          newHigh: filterHKNewHigh(hkStocks),
          summary: {
            totalUp: hkStocks.filter(s => s.changePercent > 0).length,
            totalDown: hkStocks.filter(s => s.changePercent < 0).length,
            limitUp: 0,
            limitDown: 0,
          },
        },
        us: {
          volumeSurge: filterUSVolumeSurge(usStocks),
          newHigh: filterUSNewHigh(usStocks),
          summary: {
            totalUp: usStocks.filter(s => s.changePercent > 0).length,
            totalDown: usStocks.filter(s => s.changePercent < 0).length,
            limitUp: 0,
            limitDown: 0,
          },
        },
      },
    };

    return NextResponse.json(report);
  } catch (error) {
    console.error('Failed to fetch stock data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock data' },
      { status: 500 }
    );
  }
}
