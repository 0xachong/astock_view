export interface StockItem {
  code: string;        // 股票代码
  name: string;        // 股票名称
  price: number;       // 最新价
  changePercent: number; // 涨跌幅 %
  changeAmount: number;  // 涨跌额
  volume: number;      // 成交量（手）
  volumeRatio: number; // 量比
  turnoverRate: number; // 换手率 %
  marketCap: number;   // 总市值（亿）
  circulatingCap: number; // 流通市值（亿）
  amplitude: number;   // 振幅 %
  high: number;        // 最高价
  low: number;         // 最低价
  open: number;        // 开盘价
  prevClose: number;   // 昨收
  pe: number;          // 市盈率
  industry: string;    // 所属行业
}

export interface StockWithTag extends StockItem {
  tags: string[];       // 标签：放量大涨、创新高等
  tier: '超大盘' | '大盘' | '中盘' | '小盘' | '微盘';
  event?: string;       // 事件驱动简介
}

export type MarketTier = StockWithTag['tier'];

export type MarketType = 'a' | 'hk' | 'us';

export interface MarketReport {
  volumeSurge: StockWithTag[];
  newHigh: StockWithTag[];
  summary: {
    totalUp: number;
    totalDown: number;
    limitUp: number;
    limitDown: number;
  };
}

export interface DailyReport {
  date: string;
  updateTime: string;
  markets: Record<MarketType, MarketReport>;
}
