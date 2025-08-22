import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  Users, 
  QrCode, 
  TrendingUp, 
  Calendar,
  Store,
  Zap,
  Gift
} from 'lucide-react';
import { useMerchantProfile } from '@/hooks/useMerchantProfile';
import { useMerchantQRCodes } from '@/hooks/useMerchantQRCodes';
import { useMerchantCustomers } from '@/hooks/useMerchantCustomers';

interface AnalyticsData {
  totalScans: number;
  totalCustomers: number;
  activeQRCodes: number;
  conversionRate: number;
  topPerformingQR: {
    name: string;
    scans: number;
    type: string;
  } | null;
  dailyScans: Array<{
    date: string;
    scans: number;
  }>;
  qrTypeBreakdown: Array<{
    type: string;
    scans: number;
    count: number;
  }>;
}

const QRTypeConfig = {
  store_entry: { icon: Store, label: 'Store Entry', color: 'bg-blue-500' },
  loyalty_program: { icon: Zap, label: 'Loyalty Program', color: 'bg-purple-500' },
  special_offer: { icon: Gift, label: 'Special Offer', color: 'bg-green-500' },
  event_checkin: { icon: Calendar, label: 'Event Check-in', color: 'bg-orange-500' },
};

export default function MerchantAnalyticsDashboard() {
  const { merchantProfile } = useMerchantProfile();
  const { qrCodes, totalScans, activeCodes } = useMerchantQRCodes();
  const { totalCustomers, getCustomerStats } = useMerchantCustomers(merchantProfile?.id);
  const [timeRange, setTimeRange] = useState('7days');
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalScans: 0,
    totalCustomers: 0,
    activeQRCodes: 0,
    conversionRate: 0,
    topPerformingQR: null,
    dailyScans: [],
    qrTypeBreakdown: []
  });

  useEffect(() => {
    if (qrCodes.length > 0) {
      calculateAnalytics();
    }
  }, [qrCodes, totalCustomers, timeRange]);

  const calculateAnalytics = () => {
    // Demo analytics calculation
    const topQR = qrCodes.reduce((prev, current) => 
      (prev.scan_count > current.scan_count) ? prev : current
    );

    // Generate demo daily scans data
    const dailyScans = generateDemoDataForRange(timeRange);

    // QR Type breakdown
    const qrTypeBreakdown = Object.entries(
      qrCodes.reduce((acc, qr) => {
        const type = qr.qr_type;
        if (!acc[type]) {
          acc[type] = { scans: 0, count: 0 };
        }
        acc[type].scans += qr.scan_count;
        acc[type].count += 1;
        return acc;
      }, {} as Record<string, { scans: number; count: number }>)
    ).map(([type, data]) => ({
      type,
      scans: data.scans,
      count: data.count
    }));

    setAnalytics({
      totalScans,
      totalCustomers,
      activeQRCodes: activeCodes,
      conversionRate: totalScans > 0 ? Math.round((totalCustomers / totalScans) * 100) : 0,
      topPerformingQR: qrCodes.length > 0 ? {
        name: topQR.display_name || `${topQR.qr_type} QR`,
        scans: topQR.scan_count,
        type: topQR.qr_type
      } : null,
      dailyScans,
      qrTypeBreakdown
    });
  };

  const generateDemoDataForRange = (range: string) => {
    const days = range === '7days' ? 7 : range === '30days' ? 30 : 90;
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Generate realistic demo data with some randomness
      const baseScans = Math.floor(totalScans / days);
      const variance = Math.floor(Math.random() * 10) - 5;
      const scans = Math.max(0, baseScans + variance);
      
      data.push({
        date: date.toLocaleDateString(),
        scans
      });
    }
    
    return data;
  };

  const customerStats = getCustomerStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">Last 7 days</SelectItem>
            <SelectItem value="30days">Last 30 days</SelectItem>
            <SelectItem value="90days">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Demo Mode Notice */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-4">
          <p className="text-sm text-yellow-800">
            <strong>Demo Mode:</strong> Analytics shown are simulated. In Alpha Testing, you'll see real customer interaction data and conversion metrics.
          </p>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total QR Scans</CardTitle>
            <QrCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalScans}</div>
            <p className="text-xs text-muted-foreground">
              +{Math.floor(Math.random() * 20)}% from last {timeRange === '7days' ? 'week' : 'month'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              {customerStats.byStatus.active} active this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Scans to customer signup
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active QR Codes</CardTitle>
            <QrCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.activeQRCodes}</div>
            <p className="text-xs text-muted-foreground">
              {qrCodes.length} total created
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing QR Code */}
      {analytics.topPerformingQR && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Performing QR Code</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <QrCode className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">{analytics.topPerformingQR.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {QRTypeConfig[analytics.topPerformingQR.type as keyof typeof QRTypeConfig]?.label || analytics.topPerformingQR.type}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{analytics.topPerformingQR.scans}</div>
                <div className="text-sm text-muted-foreground">total scans</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* QR Type Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">QR Code Performance by Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.qrTypeBreakdown.map((item) => {
              const config = QRTypeConfig[item.type as keyof typeof QRTypeConfig];
              const IconComponent = config?.icon || QrCode;
              const percentage = analytics.totalScans > 0 ? Math.round((item.scans / analytics.totalScans) * 100) : 0;
              
              return (
                <div key={item.type} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${config?.color || 'bg-gray-500'} text-white`}>
                    <IconComponent className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{config?.label || item.type}</span>
                      <span className="text-sm text-muted-foreground">{item.scans} scans</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground">{percentage}%</span>
                    </div>
                  </div>
                  <Badge variant="outline">{item.count} QR{item.count !== 1 ? 's' : ''}</Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Daily Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Daily QR Scan Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {analytics.dailyScans.map((day, index) => {
              const maxScans = Math.max(...analytics.dailyScans.map(d => d.scans));
              const percentage = maxScans > 0 ? (day.scans / maxScans) * 100 : 0;
              
              return (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-20 text-sm text-muted-foreground">{day.date}</div>
                  <div className="flex-1 bg-muted rounded-full h-6 relative">
                    <div 
                      className="bg-primary h-6 rounded-full transition-all duration-300 flex items-center justify-end pr-2"
                      style={{ width: `${Math.max(percentage, 5)}%` }}
                    >
                      <span className="text-xs text-primary-foreground font-medium">
                        {day.scans}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}