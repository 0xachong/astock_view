import { NextResponse } from 'next/server';
import { fetchDailyReport } from '@/lib/eastmoney';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
// 使用香港节点，确保能访问东方财富 API
export const preferredRegion = 'hkg1';

export async function GET() {
  try {
    const report = await fetchDailyReport();
    return NextResponse.json(report);
  } catch (error) {
    console.error('Failed to fetch stock data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock data' },
      { status: 500 }
    );
  }
}
