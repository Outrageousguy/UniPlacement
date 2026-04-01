import { useState, useEffect } from 'react';
import { 
  Search,
  RefreshCw,
  ExternalLink,
  Bell
} from 'lucide-react';
import "@/styles/external-opportunities-v3.css";

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

  return (
    <div className="ext-v3-content">
      <div className="ext-v3-page-header">
        <div className="ext-v3-page-title">
          External Opportunities
          <span>{pagination?.totalCount || opportunities.length} opportunities</span>
        </div>
        <div className="ext-v3-page-actions">
          <button className="ext-v3-btn-outline" type="button" onClick={clearFilters}>
            Clear Filters
          </button>
          <button className="ext-v3-btn-gold" type="button" onClick={refreshOpportunities} disabled={refreshing}>
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "ext-v3-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="ext-v3-filter-panel">
        <div className="ext-v3-filter-grid">
          <div className="ext-v3-fg">
            <span className="ext-v3-fl">Search</span>
            <div className="ext-v3-fi-wrap">
              <Search className="ext-v3-fi-icon h-3.5 w-3.5" />
              <input
                className="ext-v3-fi ext-v3-fi-icon-pad"
                type="text"
                placeholder="Search opportunities..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
            </div>
          </div>
          <div className="ext-v3-fg">
            <span className="ext-v3-fl">Location</span>
            <input
              className="ext-v3-fi"
              type="text"
              placeholder="City or Remote"
              value={filters.location}
              onChange={(e) => handleFilterChange("location", e.target.value)}
            />
          </div>
          <div className="ext-v3-fg">
            <span className="ext-v3-fl">Field</span>
            <select className="ext-v3-fi" value={filters.field} onChange={(e) => handleFilterChange("field", e.target.value)}>
              <option value="all">All Fields</option>
              <option value="CS">Computer Science</option>
              <option value="Electrical">Electrical</option>
              <option value="Mechanical">Mechanical</option>
              <option value="Civil">Civil</option>
              <option value="Chemical">Chemical</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="ext-v3-fg">
            <span className="ext-v3-fl">Job Type</span>
            <select className="ext-v3-fi" value={filters.type} onChange={(e) => handleFilterChange("type", e.target.value)}>
              <option value="all">All Types</option>
              <option value="internship">Internship</option>
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="remote">Remote</option>
            </select>
          </div>
        </div>
        <div className="ext-v3-filter-grid ext-v3-row2">
          <div className="ext-v3-fg">
            <span className="ext-v3-fl">Work Mode</span>
            <select className="ext-v3-fi" value={filters.mode} onChange={(e) => handleFilterChange("mode", e.target.value)}>
              <option value="all">All Modes</option>
              <option value="remote">Remote</option>
              <option value="onsite">Onsite</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
          <div className="ext-v3-fg">
            <span className="ext-v3-fl">Government</span>
            <select className="ext-v3-fi" value={filters.isGovernment} onChange={(e) => handleFilterChange("isGovernment", e.target.value)}>
              <option value="all">All Opportunities</option>
              <option value="true">Government Only</option>
              <option value="false">Private Only</option>
            </select>
          </div>
          <div className="ext-v3-fg">
            <span className="ext-v3-fl">Urgency</span>
            <select className="ext-v3-fi" value={filters.isUrgent} onChange={(e) => handleFilterChange("isUrgent", e.target.value)}>
              <option value="all">All Opportunities</option>
              <option value="true">Urgent</option>
              <option value="false">Normal</option>
            </select>
          </div>
          <div className="ext-v3-fg">
            <span className="ext-v3-fl">Results per page</span>
            <select className="ext-v3-fi" value={String(filters.limit)} onChange={(e) => handleFilterChange("limit", Number(e.target.value))}>
              <option value="20">20</option>
              <option value="40">40</option>
              <option value="60">60</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>
      </div>

      <div className="ext-v3-results-bar">
        <span>
          Showing {opportunities.length} opportunities
          {pagination?.totalCount ? ` of ${pagination.totalCount} total` : ""}
        </span>
        <small>
          {pagination ? `Page ${pagination.currentPage} of ${pagination.totalPages}` : "Search results"}
        </small>
      </div>

      {error && <div className="ext-v3-error">{error}</div>}

      {loading && opportunities.length === 0 && <div className="ext-v3-empty">Loading opportunities...</div>}

      {!loading && opportunities.length === 0 && !error && (
        <div className="ext-v3-empty">
          No opportunities found
          <small>Try adjusting your filters or refresh.</small>
        </div>
      )}

      {opportunities.length > 0 && (
        <>
          <div className="ext-v3-cards-grid">
            {opportunities.map((opportunity) => (
              <div key={opportunity.id} className="ext-v3-opp-card">
                <div className="ext-v3-oc-top">
                  <div className="ext-v3-oc-title">{opportunity.title || "Untitled Position"}</div>
                  <div className="ext-v3-oc-type">{opportunity.isGovernment ? "Government" : "Private"}</div>
                </div>
                <div className="ext-v3-oc-org">
                  {opportunity.company || "Unknown Company"} · {opportunity.location || "Unknown Location"}
                </div>
                <div className="ext-v3-oc-desc">
                  {opportunity.shortDescription || "No description available"}
                </div>
                <div className="ext-v3-oc-tags">
                  <span className="ext-v3-oc-tag">{opportunity.field || "Other"}</span>
                  <span className="ext-v3-oc-tag">{opportunity.type || "N/A"}</span>
                  <span className="ext-v3-oc-tag">{opportunity.mode || "N/A"}</span>
                  {opportunity.isUrgent && <span className="ext-v3-oc-tag">Urgent</span>}
                  {opportunity.isNew && <span className="ext-v3-oc-tag">New</span>}
                </div>
                <div className="ext-v3-oc-footer">
                  <span className="ext-v3-oc-date">{getDaysAgo(opportunity.postedDate)}</span>
                  <button
                    className="ext-v3-apply-btn"
                    type="button"
                    onClick={() => opportunity.applyLink && window.open(opportunity.applyLink, "_blank")}
                    disabled={!opportunity.applyLink}
                  >
                    <ExternalLink className="h-3 w-3" />
                    {opportunity.applyLink ? "Apply Now" : "No Link"}
                  </button>
                </div>
              </div>
            ))}
          </div>
          {pagination?.totalPages && pagination.totalPages > 1 && (
            <div className="ext-v3-pagination">
              <button
                className="ext-v3-pg-btn"
                onClick={() => pagination.hasPrevPage && handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrevPage}
                type="button"
              >
                ‹
              </button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === pagination.totalPages || Math.abs(pagination.currentPage - p) <= 2)
                .slice(0, 9)
                .map((pageNum) => (
                  <button
                    key={pageNum}
                    className={`ext-v3-pg-btn ${pageNum === pagination.currentPage ? "active" : ""}`}
                    onClick={() => handlePageChange(pageNum)}
                    type="button"
                  >
                    {pageNum}
                  </button>
                ))}
              <button
                className="ext-v3-pg-btn"
                onClick={() => pagination.hasNextPage && handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage}
                type="button"
              >
                ›
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
