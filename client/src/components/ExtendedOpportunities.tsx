import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Briefcase, 
  MapPin, 
  Clock, 
  ExternalLink, 
  RefreshCw, 
  Building,
  TrendingUp,
  
  Calendar,
  Users,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import { Checkbox } from './ui/checkbox';

// Updated interface matching new backend response
interface ExtendedOpportunity {
  id: number;
  title: string;
  company: string;
  location: string;
  field: string;
  type: string;
  mode: string;
  isGovernment: boolean;
  isUrgent: boolean;
  isNew: boolean;
  shortDescription: string;
  postedDate: string;
  applyLink: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  limit: number;
  nextPage: number | null;
  prevPage: number | null;
}

interface ApiResponse {
  data: ExtendedOpportunity[];
  pagination: PaginationInfo;
}

interface Filters {
  search: string;
  location: string;
  field: string;
  type: string;
  mode: string;
  isGovernment: string;
  isUrgent: string;
  isNew: string;
  page: number;
  limit: number;
}

export function ExtendedOpportunities() {
  const [opportunities, setOpportunities] = useState<ExtendedOpportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  
  const [filters, setFilters] = useState<Filters>({
    search: "",
    location: "",
    field: "all",
    type: "all",
    mode: "all",
    isGovernment: "all",
    isUrgent: "all",
    isNew: "all",
    page: 1,
    limit: 20
  });

  const fetchOpportunities = async (page = filters.page) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      
      // Add all filters
      if (filters.search) params.append("search", filters.search);
      if (filters.location) params.append("location", filters.location);
      if (filters.field && filters.field !== "all") params.append("field", filters.field);
      if (filters.type && filters.type !== "all") params.append("type", filters.type);
      if (filters.mode && filters.mode !== "all") params.append("mode", filters.mode);
      if (filters.isGovernment && filters.isGovernment !== "all") params.append("isGovernment", filters.isGovernment);
      if (filters.isUrgent && filters.isUrgent !== "all") params.append("isUrgent", filters.isUrgent);
      if (filters.isNew && filters.isNew !== "all") params.append("isNew", filters.isNew);
      
      // Add pagination
      params.append("page", page.toString());
      params.append("limit", filters.limit.toString());

      const res = await fetch(`/api/opportunities?${params}`);
      if (!res.ok) throw new Error(`Failed to fetch opportunities: ${res.status} ${res.statusText}`);

      const data = await res.json();
      console.log('API Response:', data); // Log for debugging
      
      // Handle different response structures safely
      let opportunitiesData: ExtendedOpportunity[] = [];
      let paginationData: PaginationInfo | null = null;
      
      if (Array.isArray(data)) {
        // Direct array response
        opportunitiesData = data;
      } else if (data && typeof data === 'object') {
        // Object response - handle different structures
        if (Array.isArray(data.data)) {
          opportunitiesData = data.data;
          paginationData = data.pagination || null;
        } else if (Array.isArray(data.opportunities)) {
          opportunitiesData = data.opportunities;
          paginationData = data.pagination || null;
        }
      }
      
      setOpportunities(opportunitiesData || []);
      setPagination(paginationData);
      
    } catch (err: any) {
      console.error('Error fetching opportunities:', err);
      setError(err.message || 'Failed to fetch opportunities');
      setOpportunities([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshOpportunities = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/opportunities/refresh", {
        method: "POST"
      });
      
      if (!res.ok) throw new Error("Failed to refresh opportunities");
      
      // Refetch current page after refresh
      await fetchOpportunities(filters.page);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  };

  const searchOpportunities = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.search) params.append("q", filters.search);
      params.append("page", "1");
      params.append("limit", filters.limit.toString());

      const res = await fetch(`/api/opportunities/search?${params}`);
      if (!res.ok) throw new Error(`Failed to search opportunities: ${res.status} ${res.statusText}`);

      const data = await res.json();
      console.log('Search API Response:', data); // Log for debugging
      
      // Handle different search response structures
      let opportunitiesData: ExtendedOpportunity[] = [];
      
      if (Array.isArray(data)) {
        // Direct array response
        opportunitiesData = data;
      } else if (data && typeof data === 'object') {
        // Object response - normalize to match main API
        if (Array.isArray(data.data)) {
          opportunitiesData = data.data;
        } else if (Array.isArray(data.opportunities)) {
          opportunitiesData = data.opportunities;
        }
      }
      
      setOpportunities(opportunitiesData || []);
      setPagination(null); // Search doesn't return pagination
      
    } catch (err: any) {
      console.error('Error searching opportunities:', err);
      setError(err.message || 'Failed to search opportunities');
      setOpportunities([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage });
    fetchOpportunities(newPage);
  };

  const handleFilterChange = (key: keyof Filters, value: any) => {
    setFilters({ ...filters, [key]: value, page: 1 }); // Reset to page 1 when filters change
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      location: "",
      field: "all",
      type: "all",
      mode: "all",
      isGovernment: "all",
      isUrgent: "all",
      isNew: "all",
      page: 1,
      limit: 20
    });
  };

  const getDaysAgo = (dateString: string) => {
    try {
      if (!dateString) return "Unknown";
      
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Unknown";
      
      const diff = Date.now() - date.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      if (days === 0) return "Today";
      if (days === 1) return "1 day ago";
      if (days < 7) return `${days} days ago`;
      return `${Math.floor(days / 7)} weeks ago`;
    } catch (error) {
      console.error('Error parsing date:', dateString, error);
      return "Unknown";
    }
  };

  const getFieldColor = (field: string) => {
    const colors: { [key: string]: string } = {
      'CS': 'bg-blue-100 text-blue-800',
      'Electrical': 'bg-yellow-100 text-yellow-800',
      'Mechanical': 'bg-green-100 text-green-800',
      'Civil': 'bg-purple-100 text-purple-800',
      'Chemical': 'bg-red-100 text-red-800',
      'Other': 'bg-gray-100 text-gray-800'
    };
    return colors[field] || 'bg-gray-100 text-gray-800';
  };

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'internship': 'bg-indigo-100 text-indigo-800',
      'full-time': 'bg-green-100 text-green-800',
      'part-time': 'bg-orange-100 text-orange-800',
      'remote': 'bg-cyan-100 text-cyan-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getModeColor = (mode: string) => {
    const colors: { [key: string]: string } = {
      'remote': 'bg-purple-100 text-purple-800',
      'onsite': 'bg-blue-100 text-blue-800',
      'hybrid': 'bg-green-100 text-green-800'
    };
    return colors[mode] || 'bg-gray-100 text-gray-800';
  };

  // Single controlled fetch effect
  useEffect(() => {
    const fetchData = async () => {
      if (filters.search) {
        await searchOpportunities();
      } else {
        await fetchOpportunities();
      }
    };
    
    fetchData();
  }, [filters.search, filters.location, filters.field, filters.type, filters.mode, filters.isGovernment, filters.isUrgent, filters.isNew, filters.limit, filters.page]);
  
  // Separate effect for manual page changes
  useEffect(() => {
    if (filters.page > 1) {
      fetchOpportunities(filters.page);
    }
  }, [filters.page]);

  if (loading && opportunities.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <CardTitle>
                  <Skeleton className="h-4 w-3/4" />
                </CardTitle>
                <Skeleton className="h-4 w-1/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
                <div className="flex justify-between mt-4">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Always render the UI - never return null or blank
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-3xl font-bold">Extended Opportunities</h1>
          <Badge variant="secondary" className="text-sm">
            {pagination?.totalCount || 0} Opportunities
          </Badge>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            onClick={clearFilters}
            variant="outline"
            size="sm"
          >
            <Filter className="w-4 h-4 mr-1" />
            Clear Filters
          </Button>
          
          <Button onClick={refreshOpportunities} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <div>
              <p className="text-red-700 font-medium">{error}</p>
              <p className="text-sm text-red-600 mt-1">
                Try adjusting your filters or refresh to see more opportunities.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Advanced Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search opportunities..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="City or Remote"
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Field</label>
              <Select
                value={filters.field}
                onValueChange={(value) => handleFilterChange('field', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Fields" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Fields</SelectItem>
                  <SelectItem value="CS">Computer Science</SelectItem>
                  <SelectItem value="Electrical">Electrical</SelectItem>
                  <SelectItem value="Mechanical">Mechanical</SelectItem>
                  <SelectItem value="Civil">Civil</SelectItem>
                  <SelectItem value="Chemical">Chemical</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Job Type</label>
              <Select
                value={filters.type}
                onValueChange={(value) => handleFilterChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                  <SelectItem value="full-time">Full Time</SelectItem>
                  <SelectItem value="part-time">Part Time</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Mode */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Work Mode</label>
              <Select
                value={filters.mode}
                onValueChange={(value) => handleFilterChange('mode', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Modes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modes</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="onsite">On-site</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Government Only */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Government</label>
              <Select
                value={filters.isGovernment}
                onValueChange={(value) => handleFilterChange('isGovernment', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Opportunities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Opportunities</SelectItem>
                  <SelectItem value="true">Government Only</SelectItem>
                  <SelectItem value="false">Private Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Urgent Only */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Urgency</label>
              <Select
                value={filters.isUrgent}
                onValueChange={(value) => handleFilterChange('isUrgent', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Opportunities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Opportunities</SelectItem>
                  <SelectItem value="true">Urgent Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* New Only */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Recency</label>
              <Select
                value={filters.isNew}
                onValueChange={(value) => handleFilterChange('isNew', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Opportunities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Opportunities</SelectItem>
                  <SelectItem value="true">New Only (24h)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Limit */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Results per page</label>
              <Select
                value={filters.limit.toString()}
                onValueChange={(value) => handleFilterChange('limit', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="20" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      {opportunities.length > 0 && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <span className="text-blue-700">
                Showing {opportunities.length} opportunities
                {pagination?.totalCount && ` of ${pagination.totalCount} total`}
              </span>
            </div>
            
            {pagination && (
              <div className="text-sm text-blue-600">
                Page {pagination.currentPage} of {pagination.totalPages}
              </div>
            )}
          </div>
        </div>
      )}

      {/* No Results */}
      {opportunities.length === 0 && !error && !loading && (
        <div className="text-center py-12">
          <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No opportunities found</h3>
          <p className="text-gray-500 mb-4">
            Try adjusting your filters or check back later for new opportunities.
          </p>
          <Button onClick={clearFilters} variant="outline">
            Clear All Filters
          </Button>
        </div>
      )}

      {/* Opportunities Grid */}
      {opportunities.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {opportunities.map((opportunity) => {
              // Defensive checks for required fields
              if (!opportunity || !opportunity.id) {
                console.warn('Invalid opportunity data:', opportunity);
                return null;
              }
              
              return (
              <Card key={opportunity.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start space-x-2">
                    <CardTitle className="flex-1 line-clamp-2">
                      {opportunity.title || 'Untitled Position'}
                    </CardTitle>
                    
                    <div className="flex flex-col space-y-1">
                      {opportunity.isUrgent && (
                        <Badge variant="destructive" className="text-xs">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Urgent
                        </Badge>
                      )}
                      
                      {opportunity.isNew && (
                        <Badge variant="default" className="text-xs">
                          <Calendar className="w-3 h-3 mr-1" />
                          New
                        </Badge>
                      )}
                      
                      {opportunity.isGovernment && (
                        <Badge variant="secondary" className="text-xs">
                          <Building className="w-3 h-3 mr-1" />
                          Government
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 mt-2">
                    {opportunity.company || 'Unknown Company'} • {opportunity.location || 'Unknown Location'}
                  </div>
                </CardHeader>

                <CardContent>
                  <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                    {opportunity.shortDescription || 'No description available'}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge className={getFieldColor(opportunity.field || 'Other')}>
                      {opportunity.field || 'Other'}
                    </Badge>
                    
                    <Badge className={getTypeColor(opportunity.type || 'remote')}>
                      {opportunity.type || 'remote'}
                    </Badge>
                    
                    <Badge className={getModeColor(opportunity.mode || 'remote')}>
                      {opportunity.mode || 'remote'}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="w-4 h-4 mr-1" />
                      {getDaysAgo(opportunity.postedDate)}
                    </div>

                    <Button
                      onClick={() => {
                        if (opportunity.applyLink) {
                          window.open(opportunity.applyLink, "_blank");
                        } else {
                          console.warn('No apply link available for opportunity:', opportunity.id);
                        }
                      }}
                      size="sm"
                      className="flex items-center"
                      disabled={!opportunity.applyLink}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      {opportunity.applyLink ? 'Apply Now' : 'No Link'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination?.totalPages && pagination.totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 pt-6">
              <Button
                variant="outline"
                onClick={() => handlePageChange(pagination.prevPage || 1)}
                disabled={!pagination.hasPrevPage}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>

              <div className="flex items-center space-x-2">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  const isCurrentPage = pageNum === pagination.currentPage;
                  const showPage = pageNum === 1 || 
                                   pageNum === pagination.totalPages || 
                                   (pageNum >= (pagination.currentPage - 2) && 
                                    pageNum <= (pagination.currentPage + 2));

                  if (!showPage) return null;

                  return (
                    <Button
                      key={pageNum}
                      variant={isCurrentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                onClick={() => handlePageChange(pagination.nextPage || pagination.totalPages)}
                disabled={!pagination.hasNextPage}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
