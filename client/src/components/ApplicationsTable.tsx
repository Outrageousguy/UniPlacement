import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
} from "lucide-react";
import { format } from "date-fns";
import AIAnalysis from "./AIAnalysis";

interface Application {
  id: number;
  driveId: number;
  companyName: string;
  jobRole: string;
  appliedAt: Date;
  status: "Registered" | "Shortlisted" | "Interview" | "Selected" | "Rejected";
  matchScore?: number;
  resumeName: string;
}

interface ApplicationsTableProps {
  applications: Application[];
  onWithdraw: (applicationId: number) => void;
  onViewDrive: (driveId: number) => void;
  onAnalyze: (applicationId: number) => void;
}

export default function ApplicationsTable({
  applications,
  onWithdraw,
  onViewDrive,
  onAnalyze,
}: ApplicationsTableProps) {
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      Registered: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      Shortlisted: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      Interview: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      Selected: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      Rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return <Badge className={`text-xs ${colors[status]}`}>{status}</Badge>;
  };

  const getMatchScoreBadge = (score?: number) => {
    if (!score) return null;
    const color =
      score >= 80
        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
        : score >= 60
        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    return (
      <Badge className={`text-xs ${color}`}>
        <Sparkles className="w-3 h-3 mr-1" />
        {score}%
      </Badge>
    );
  };

  const canWithdraw = (status: string) => {
    return status === "Registered" || status === "Shortlisted";
  };

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold text-xs uppercase tracking-wide">
                  Company
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide">
                  Role
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide">
                  Applied On
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide">
                  Status
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide">
                  Match Score
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    <Building2 className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="font-medium">No applications yet</p>
                    <p className="text-sm">
                      Browse available drives and start applying!
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                applications.map((app, index) => (
                  <TableRow
                    key={app.id}
                    className={index % 2 === 0 ? "bg-background" : "bg-muted/30"}
                    data-testid={`row-application-${app.id}`}
                  >
                    <TableCell className="font-medium">
                      {app.companyName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {app.jobRole}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(app.appliedAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>{getStatusBadge(app.status)}</TableCell>
                    <TableCell>
                      {app.matchScore ? (
                        getMatchScoreBadge(app.matchScore)
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onAnalyze(app.id)}
                          className="text-xs"
                          data-testid={`button-analyze-${app.id}`}
                        >
                          <Sparkles className="w-3 h-3 mr-1" />
                          Analyze
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setSelectedApplication(app)}
                          data-testid={`button-view-application-${app.id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {canWithdraw(app.status) && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-destructive"
                                data-testid={`button-withdraw-${app.id}`}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Withdraw Application?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to withdraw your
                                  application for {app.companyName} - {app.jobRole}?
                                  This action cannot be undone.
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
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
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
                  {selectedApplication.matchScore ? (
                    getMatchScoreBadge(selectedApplication.matchScore)
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Not analyzed
                    </span>
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
