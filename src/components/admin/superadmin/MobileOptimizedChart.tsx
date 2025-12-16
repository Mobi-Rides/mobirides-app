import { useState, useEffect, useRef } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Users, 
  Shield, 
  Smartphone, 
  Tablet,
  Monitor,
  RotateCcw,
  Download,
  Maximize2,
  Minimize2
} from "lucide-react";

export interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}

export interface MobileChartProps {
  data: ChartData[];
  title: string;
  type: 'line' | 'bar' | 'pie' | 'area';
  height?: number;
  colors?: string[];
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  responsive?: boolean;
  onDataPointClick?: (data: any) => void;
  onExport?: (format: 'png' | 'svg' | 'pdf') => void;
  className?: string;
}

const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

const DEFAULT_COLORS = {
  primary: '#3B82F6',
  secondary: '#10B981',
  tertiary: '#F59E0B',
  quaternary: '#EF4444',
  quinary: '#8B5CF6'
};

const CHART_COLORS = [
  DEFAULT_COLORS.primary,
  DEFAULT_COLORS.secondary,
  DEFAULT_COLORS.tertiary,
  DEFAULT_COLORS.quaternary,
  DEFAULT_COLORS.quinary
];

export function MobileOptimizedChart({
  data,
  title,
  type,
  height = 300,
  colors = CHART_COLORS,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  responsive = true,
  onDataPointClick,
  onExport,
  className = ""
}: MobileChartProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const containerRef = useRef<HTMLDivElement>(null);

  // Detect device type and screen size
  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      setIsMobile(width < MOBILE_BREAKPOINT);
      setIsTablet(width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT);
      setOrientation(width > window.innerHeight ? 'landscape' : 'portrait');
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    window.addEventListener('orientationchange', checkDevice);

    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('orientationchange', checkDevice);
    };
  }, []);

  // Get responsive height based on device
  const getResponsiveHeight = () => {
    if (!responsive) return height;
    
    if (isMobile) {
      return orientation === 'landscape' ? 200 : 250;
    } else if (isTablet) {
      return 280;
    }
    return height;
  };

  // Get responsive font size
  const getResponsiveFontSize = () => {
    if (isMobile) return 10;
    if (isTablet) return 11;
    return 12;
  };

  // Get responsive padding
  const getResponsivePadding = () => {
    if (isMobile) return { left: 10, right: 10, top: 5, bottom: 5 };
    if (isTablet) return { left: 15, right: 15, top: 10, bottom: 10 };
    return { left: 20, right: 20, top: 10, bottom: 10 };
  };

  // Custom tooltip for mobile
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 dark:text-white text-sm">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Custom legend for mobile
  const CustomLegend = ({ payload }: any) => {
    if (!payload || payload.length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-2 justify-center mt-2">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center space-x-1">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  // Handle chart click/touch
  const handleChartClick = (data: any) => {
    if (onDataPointClick) {
      onDataPointClick(data);
    }
  };

  // Export chart
  const handleExport = (format: 'png' | 'svg' | 'pdf') => {
    if (onExport) {
      onExport(format);
    } else {
      // Default export logic
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Basic export implementation
        console.log(`Exporting chart as ${format}`);
      }
    }
  };

  // Get device icon
  const getDeviceIcon = () => {
    if (isMobile) return <Smartphone className="h-4 w-4" />;
    if (isTablet) return <Tablet className="h-4 w-4" />;
    return <Monitor className="h-4 w-4" />;
  };

  // Render different chart types
  const renderChart = () => {
    const responsiveHeight = getResponsiveHeight();
    const fontSize = getResponsiveFontSize();
    const padding = getResponsivePadding();

    const commonProps = {
      data,
      margin: padding,
      onClick: handleChartClick
    };

    switch (type) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />}
            <XAxis 
              dataKey="name" 
              tick={{ fontSize }}
              angle={isMobile ? -45 : 0}
              textAnchor={isMobile ? 'end' : 'middle'}
              height={isMobile ? 60 : 30}
            />
            <YAxis tick={{ fontSize }} />
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {showLegend && <Legend content={isMobile ? <CustomLegend /> : undefined} />}
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={colors[0]} 
              strokeWidth={isMobile ? 2 : 3}
              dot={{ r: isMobile ? 3 : 4 }}
              activeDot={{ r: isMobile ? 5 : 6 }}
            />
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />}
            <XAxis 
              dataKey="name" 
              tick={{ fontSize }}
              angle={isMobile ? -45 : 0}
              textAnchor={isMobile ? 'end' : 'middle'}
              height={isMobile ? 60 : 30}
            />
            <YAxis tick={{ fontSize }} />
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {showLegend && <Legend content={isMobile ? <CustomLegend /> : undefined} />}
            <Bar 
              dataKey="value" 
              fill={colors[0]}
              radius={isMobile ? [2, 2, 0, 0] : [4, 4, 0, 0]}
            />
          </BarChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />}
            <XAxis 
              dataKey="name" 
              tick={{ fontSize }}
              angle={isMobile ? -45 : 0}
              textAnchor={isMobile ? 'end' : 'middle'}
              height={isMobile ? 60 : 30}
            />
            <YAxis tick={{ fontSize }} />
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {showLegend && <Legend content={isMobile ? <CustomLegend /> : undefined} />}
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={colors[0]} 
              fill={colors[0]}
              fillOpacity={0.6}
              strokeWidth={isMobile ? 2 : 3}
            />
          </AreaChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={isMobile ? 80 : isTablet ? 90 : 100}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => 
                isMobile ? `${name}` : `${name} ${(percent * 100).toFixed(0)}%`
              }
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {showLegend && <Legend content={isMobile ? <CustomLegend /> : undefined} />}
          </PieChart>
        );

      default:
        return null;
    }
  };

  return (
    <Card className={`${className} ${isFullscreen ? 'fixed inset-4 z-50' : ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>{title}</span>
            <Badge variant="outline" className="text-xs">
              {getDeviceIcon()}
              {isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'}
            </Badge>
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            {onExport && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleExport('png')}
                className="h-8 w-8 p-0"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="h-8 w-8 p-0"
            >
              {isFullscreen ? 
                <Minimize2 className="h-4 w-4" /> : 
                <Maximize2 className="h-4 w-4" />
              }
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div 
          ref={containerRef}
          className="w-full"
          style={{ height: getResponsiveHeight() }}
        >
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
        
        {isMobile && (
          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
            Tap and hold on data points for details
          </div>
        )}
      </CardContent>
    </Card>
  );
}