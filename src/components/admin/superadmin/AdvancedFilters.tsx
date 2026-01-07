import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Filter, 
  X, 
  Calendar, 
  User, 
  Shield, 
  Activity,
  Search,
  RefreshCw
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface FilterOptions {
  dateRange: {
    start: string;
    end: string;
  };
  severityLevels: string[];
  eventTypes: string[];
  actorIds: string[];
  resourceTypes: string[];
  searchTerm: string;
  status: 'active' | 'completed' | 'cancelled' | 'all';
  userStatus: 'active' | 'suspended' | 'all';
}

interface Props {
  onFiltersChange: (filters: FilterOptions) => void;
  onClearFilters: () => void;
  initialFilters?: Partial<FilterOptions>;
  availableEventTypes?: string[];
  availableResourceTypes?: string[];
  availableActors?: Array<{ id: string; name: string }>;
}

const SEVERITY_LEVELS = [
  { value: 'critical', label: 'Critical', color: 'bg-red-500' },
  { value: 'high', label: 'High', color: 'bg-orange-500' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
  { value: 'low', label: 'Low', color: 'bg-blue-500' }
];

const EVENT_TYPES = [
  'login',
  'logout',
  'role_assigned',
  'role_removed',
  'capability_granted',
  'capability_revoked',
  'user_created',
  'user_updated',
  'user_suspended',
  'user_reactivated',
  'booking_created',
  'booking_completed',
  'booking_cancelled',
  'payment_processed',
  'security_alert',
  'system_error',
  'api_access',
  'data_export',
  'admin_action'
];

const RESOURCE_TYPES = [
  'user',
  'booking',
  'payment',
  'role',
  'capability',
  'system',
  'api',
  'admin',
  'analytics',
  'security'
];

export function AdvancedFilters({ 
  onFiltersChange, 
  onClearFilters, 
  initialFilters,
  availableEventTypes = EVENT_TYPES,
  availableResourceTypes = RESOURCE_TYPES,
  availableActors = []
}: Props) {
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
      end: new Date().toISOString().split('T')[0]
    },
    severityLevels: [],
    eventTypes: [],
    actorIds: [],
    resourceTypes: [],
    searchTerm: '',
    status: 'all',
    userStatus: 'all',
    ...initialFilters
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFilters, setActiveFilters] = useState(0);

  useEffect(() => {
    // Count active filters
    let count = 0;
    if (filters.severityLevels.length > 0) count++;
    if (filters.eventTypes.length > 0) count++;
    if (filters.actorIds.length > 0) count++;
    if (filters.resourceTypes.length > 0) count++;
    if (filters.searchTerm) count++;
    if (filters.status !== 'all') count++;
    if (filters.userStatus !== 'all') count++;
    
    setActiveFilters(count);
  }, [filters]);

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleArrayFilterToggle = (key: 'severityLevels' | 'eventTypes' | 'actorIds' | 'resourceTypes', value: string) => {
    const currentArray = filters[key] as string[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    handleFilterChange(key, newArray);
  };

  const handleClearAllFilters = () => {
    const clearedFilters: FilterOptions = {
      dateRange: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
      },
      severityLevels: [],
      eventTypes: [],
      actorIds: [],
      resourceTypes: [],
      searchTerm: '',
      status: 'all',
      userStatus: 'all'
    };
    setFilters(clearedFilters);
    onClearFilters();
  };

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    handleFilterChange('dateRange', {
      ...filters.dateRange,
      [field]: value
    });
  };

  const handleQuickDateRange = (days: number) => {
    const end = new Date();
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    handleFilterChange('dateRange', {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    });
  };

  const hasActiveFilters = activeFilters > 0;

  return (
    <div className="space-y-4">
      {/* Filter Toggle */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2"
        >
          <Filter className="h-4 w-4" />
          <span>Advanced Filters</span>
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-2">
              {activeFilters}
            </Badge>
          )}
        </Button>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAllFilters}
            className="text-red-600 hover:text-red-700"
          >
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {/* Expanded Filter Panel */}
      {isExpanded && (
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Advanced Filters</span>
            </CardTitle>
            <CardDescription>
              Refine your analytics data with advanced filtering options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Date Range Section */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <Label className="text-sm font-medium">Date Range</Label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-gray-500">From</Label>
                  <Input
                    type="date"
                    value={filters.dateRange.start}
                    onChange={(e) => handleDateRangeChange('start', e.target.value)}
                    className="text-sm"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs text-gray-500">To</Label>
                  <Input
                    type="date"
                    value={filters.dateRange.end}
                    onChange={(e) => handleDateRangeChange('end', e.target.value)}
                    className="text-sm"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs text-gray-500">Quick Select</Label>
                  <div className="flex flex-wrap gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickDateRange(7)}
                      className="text-xs"
                    >
                      7d
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickDateRange(30)}
                      className="text-xs"
                    >
                      30d
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickDateRange(90)}
                      className="text-xs"
                    >
                      90d
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Search Section */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-gray-500" />
                <Label className="text-sm font-medium">Search</Label>
              </div>
              <Input
                type="text"
                placeholder="Search events, users, or resources..."
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                className="text-sm"
              />
            </div>

            {/* Severity Levels */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-gray-500" />
                <Label className="text-sm font-medium">Severity Levels</Label>
              </div>
              <div className="flex flex-wrap gap-2">
                {SEVERITY_LEVELS.map((level) => (
                  <Badge
                    key={level.value}
                    variant={filters.severityLevels.includes(level.value) ? "default" : "outline"}
                    className={`cursor-pointer transition-colors ${
                      filters.severityLevels.includes(level.value) 
                        ? `${level.color} text-white` 
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => handleArrayFilterToggle('severityLevels', level.value)}
                  >
                    {level.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Event Types */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-gray-500" />
                <Label className="text-sm font-medium">Event Types</Label>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                {availableEventTypes.map((type) => (
                  <Badge
                    key={type}
                    variant={filters.eventTypes.includes(type) ? "default" : "outline"}
                    className="cursor-pointer transition-colors text-xs"
                    onClick={() => handleArrayFilterToggle('eventTypes', type)}
                  >
                    {type.replace(/_/g, ' ')}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Resource Types */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500" />
                <Label className="text-sm font-medium">Resource Types</Label>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableResourceTypes.map((type) => (
                  <Badge
                    key={type}
                    variant={filters.resourceTypes.includes(type) ? "default" : "outline"}
                    className="cursor-pointer transition-colors text-xs"
                    onClick={() => handleArrayFilterToggle('resourceTypes', type)}
                  >
                    {type}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Status Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Booking Status</Label>
                <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">User Status</Label>
                <Select value={filters.userStatus} onValueChange={(value) => handleFilterChange('userStatus', value)}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="active">Active Users</SelectItem>
                    <SelectItem value="suspended">Suspended Users</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAllFilters}
                className="text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
              
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  // Trigger refresh with current filters
                  onFiltersChange(filters);
                }}
                className="flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Apply Filters</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}