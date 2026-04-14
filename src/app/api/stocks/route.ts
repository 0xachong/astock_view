import { NextResponse } from 'next/server';
import { fetchDailyReport } from '@/lib/eastmoney';

export const revalidate = 300; // ISR: 5分钟更新一次

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
