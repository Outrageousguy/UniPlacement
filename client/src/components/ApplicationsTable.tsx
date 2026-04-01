import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Building2,
  Eye,
  XCircle,
  Sparkles,
  Calendar,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";

interface Application {
  id: number;
  driveId: number;
  companyName: string;
  jobRole: string;
  appliedAt: Date | string;
  status: "Registered" | "Shortlisted" | "Interview" | "Selected" | "Rejected";
  matchScore?: number | null;
  resumeName: string;
}

interface ApplicationsTableProps {
  applications: Application[];
  onWithdraw: (applicationId: number) => void;
  onViewDrive: (driveId: number) => void;
  onAnalyze: (applicationId: number) => void | Promise<void>;
  analyzingApplicationId?: number | null;
}

function companyInitial(name: string): string {
  const t = (name || "?").trim();
  return t ? t.charAt(0).toUpperCase() : "?";
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case "Registered":
      return "student-v3-sr";
    case "Shortlisted":
      return "student-v3-ss";
    case "Interview":
      return "student-v3-sint";
    case "Selected":
      return "student-v3-sel";
    case "Rejected":
      return "student-v3-srej";
    default:
      return "student-v3-sr";
  }
}

export default function ApplicationsTable({
  applications,
  onWithdraw,
  onViewDrive,
  onAnalyze,
  analyzingApplicationId = null,
}: ApplicationsTableProps) {
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [sortBy, setSortBy] = useState("Sort: Newest");

  const stats = useMemo(() => {
    const list = applications;
    const total = list.length;
    const registered = list.filter((a) => a.status === "Registered").length;
    const shortlisted = list.filter((a) => a.status === "Shortlisted").length;
    const offers = list.filter((a) => a.status === "Selected").length;
    return { total, registered, shortlisted, offers };
  }, [applications]);

  const filteredApplications = useMemo(() => {
    let list = [...applications];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (a) =>
          (a.companyName || "").toLowerCase().includes(q) ||
          (a.jobRole || "").toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "All Status") {
      list = list.filter((a) => a.status === statusFilter);
    }
    switch (sortBy) {
      case "Sort: Oldest":
        list.sort(
          (a, b) =>
            new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime()
        );
        break;
      case "Sort: Match ↑":
        list.sort(
          (a, b) =>
            (Number(a.matchScore) || 0) - (Number(b.matchScore) || 0)
        );
        break;
      case "Sort: Match ↓":
        list.sort(
          (a, b) =>
            (Number(b.matchScore) || 0) - (Number(a.matchScore) || 0)
        );
        break;
      case "Sort: Newest":
      default:
        list.sort(
          (a, b) =>
            new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
        );
        break;
    }
    return list;
  }, [applications, search, statusFilter, sortBy]);

  const getStatusBadge = (status: string) => (
    <span className={`student-v3-sb2 ${statusBadgeClass(status)}`}>{status}</span>
  );

  const matchScoreNum = (app: Application) => {
    const n = Number(app.matchScore);
    return Number.isFinite(n) && n > 0 ? n : null;
  };

  const canWithdraw = (status: string) => {
    return status === "Registered" || status === "Shortlisted";
  };

  return (
    <>
      <div className="student-v3-apps-page">
        <div className="student-v3-page-top">
          <div>
            <div className="student-v3-page-title">My Applications</div>
            <div className="student-v3-drive-count">
              All placement drive applications for this season
            </div>
          </div>
        </div>

        <div className="student-v3-stats-bar student-v3-stats-bar--4">
          <div className="student-v3-stat-card student-v3-stat-card--elevate">
            <div className="student-v3-sc-label">Total Applied</div>
            <div className="student-v3-sc-val">{stats.total}</div>
            <div className="student-v3-sc-sub">This season</div>
          </div>
          <div className="student-v3-stat-card student-v3-stat-card--elevate">
            <div className="student-v3-sc-label">Registered</div>
            <div className="student-v3-sc-val">{stats.registered}</div>
            <div className="student-v3-sc-sub">Awaiting shortlist</div>
          </div>
          <div className="student-v3-stat-card student-v3-stat-card--elevate">
            <div className="student-v3-sc-label">Shortlisted</div>
            <div className="student-v3-sc-val">{stats.shortlisted}</div>
            <div className="student-v3-sc-sub">Interview stage</div>
          </div>
          <div className="student-v3-stat-card student-v3-stat-card--elevate">
            <div className="student-v3-sc-label">Offers</div>
            <div className="student-v3-sc-val">{stats.offers}</div>
            <div className="student-v3-sc-sub">This season</div>
          </div>
        </div>

        <div className="student-v3-filter-strip">
          <input
            className="student-v3-fi student-v3-fi-search"
            type="search"
            placeholder="Search company or role…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search applications"
          />
          <select
            className="student-v3-fi"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
          >
            <option>All Status</option>
            <option>Registered</option>
            <option>Shortlisted</option>
            <option>Interview</option>
            <option>Selected</option>
            <option>Rejected</option>
          </select>
          <select
            className="student-v3-fi"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort applications"
          >
            <option>Sort: Newest</option>
            <option>Sort: Oldest</option>
            <option>Sort: Match ↑</option>
            <option>Sort: Match ↓</option>
          </select>
        </div>

        <div className="student-v3-apps-scroll">
          <div className="student-v3-apps-scroll-inner">
        <div className="student-v3-apps-table-card">
          <div className="student-v3-apps-grid-head">
            <div className="student-v3-apps-th">Company</div>
            <div className="student-v3-apps-th">Role</div>
            <div className="student-v3-apps-th">Applied On</div>
            <div className="student-v3-apps-th">Status</div>
            <div className="student-v3-apps-th">Match Score</div>
            <div className="student-v3-apps-th student-v3-apps-th-actions">Actions</div>
          </div>

          {filteredApplications.length === 0 ? (
            <div className="student-v3-empty student-v3-apps-empty">
              <Building2 className="student-v3-apps-empty-icon" strokeWidth={1.5} />
              <p>No applications match your filters</p>
              <small>
                {applications.length === 0
                  ? "Browse available drives and start applying to see them here."
                  : "Try adjusting search or status filters."}
              </small>
            </div>
          ) : (
            filteredApplications.map((app, index) => {
              const score = matchScoreNum(app);
              const analyzing = analyzingApplicationId === app.id;
              return (
                <div
                  key={app.id}
                  className="student-v3-app-row"
                  style={{ animationDelay: `${Math.min(index, 6) * 0.05}s` }}
                  data-testid={`row-application-${app.id}`}
                >
                  <div className="student-v3-apps-co-cell">
                    <div className="student-v3-dlogo" aria-hidden>
                      {companyInitial(app.companyName)}
                    </div>
                    <div>
                      <div className="student-v3-apps-co-name">{app.companyName}</div>
                      <div className="student-v3-apps-co-meta">Placement Drive</div>
                    </div>
                  </div>
                  <div className="student-v3-apps-role">{app.jobRole}</div>
                  <div className="student-v3-apps-date">
                    {format(new Date(app.appliedAt), "MMM d, yyyy")}
                  </div>
                  <div>{getStatusBadge(app.status)}</div>
                  <div className="student-v3-apps-match">
                    {score != null ? (
                      <div className="student-v3-mw">
                        <span className="student-v3-mp">{score}%</span>
                        <div className="student-v3-mt">
                          <div
                            className="student-v3-mf"
                            style={{ width: `${Math.max(0, Math.min(score, 100))}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="student-v3-apps-match-na">— awaiting</span>
                    )}
                  </div>
                  <div className="student-v3-apps-actions">
                    {!score && (
                      <button
                        type="button"
                        className="student-v3-apps-analyze"
                        disabled={analyzing}
                        onClick={() => onAnalyze(app.id)}
                        data-testid={`button-analyze-${app.id}`}
                      >
                        {analyzing ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="h-3 w-3" strokeWidth={2} />
                        )}
                        Analyze
                      </button>
                    )}
                    <button
                      type="button"
                      className="student-v3-app-act"
                      title="View details"
                      onClick={() => setSelectedApplication(app)}
                      data-testid={`button-view-application-${app.id}`}
                    >
                      <Eye className="h-3.5 w-3.5" strokeWidth={1.8} />
                    </button>
                    {canWithdraw(app.status) && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            type="button"
                            className="student-v3-app-act danger"
                            title="Withdraw"
                            data-testid={`button-withdraw-${app.id}`}
                          >
                            <XCircle className="h-3.5 w-3.5" strokeWidth={1.8} />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Withdraw Application?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to withdraw your application for{" "}
                              {app.companyName} — {app.jobRole}? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onWithdraw(app.id)}
                              className="bg-destructive text-destructive-foreground"
                            >
                              Withdraw
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
          </div>
        </div>
      </div>

      <Dialog
        open={!!selectedApplication}
        onOpenChange={() => setSelectedApplication(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Application Details
            </DialogTitle>
            <DialogDescription>
              View your application status and details
            </DialogDescription>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Company</p>
                  <p className="font-medium">{selectedApplication.companyName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Role</p>
                  <p className="font-medium">{selectedApplication.jobRole}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Applied On</p>
                  <p className="font-medium flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(selectedApplication.appliedAt), "PPP")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Resume Used</p>
                  <p className="font-medium">{selectedApplication.resumeName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  {getStatusBadge(selectedApplication.status)}
                </div>
                <div>
                  <p className="text-muted-foreground">Match Score</p>
                  {matchScoreNum(selectedApplication) != null ? (
                    <div className="student-v3-mw max-w-[220px] mt-1">
                      <span className="student-v3-mp">{matchScoreNum(selectedApplication)}%</span>
                      <div className="student-v3-mt">
                        <div
                          className="student-v3-mf"
                          style={{
                            width: `${Math.max(0, Math.min(matchScoreNum(selectedApplication)!, 100))}%`,
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Not analyzed</span>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedApplication(null)}
            >
              Close
            </Button>
            {selectedApplication && (
              <Button
                onClick={() => {
                  onViewDrive(selectedApplication.driveId);
                  setSelectedApplication(null);
                }}
              >
                View Drive Details
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
