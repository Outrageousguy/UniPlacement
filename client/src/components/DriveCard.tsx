import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Building2, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface DriveCardProps {
  id: number;
  companyName: string;
  jobRole: string;
  ctcMin: number;
  ctcMax: number;
  minCgpa: number;
  maxBacklogs: number;
  allowedBranches: string[];
  registrationDeadline: Date;
  jobDescription?: string;
  status: "Active" | "Completed" | "Cancelled";
  isRegistered?: boolean;
  registrationStatus?: string;
  resumes?: { id: number; name: string }[];
  onRegister?: (driveId: number, resumeId: number, notes: string) => void;
  onViewDetails?: (driveId: number) => void;
  userRole?: "coordinator" | "student";
}

function companyInitial(name: string): string {
  const t = (name || "?").trim();
  return t ? t.charAt(0).toUpperCase() : "?";
}

export default function DriveCard({
  id,
  companyName,
  jobRole,
  ctcMin,
  ctcMax,
  minCgpa,
  maxBacklogs,
  allowedBranches,
  registrationDeadline,
  jobDescription,
  status,
  isRegistered = false,
  registrationStatus,
  resumes = [],
  onRegister,
  onViewDetails,
  userRole = "student",
}: DriveCardProps) {
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [selectedResume, setSelectedResume] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [showDetails, setShowDetails] = useState(false);

  const isDeadlinePassed = new Date(registrationDeadline) < new Date();
  const timeLeftApprox = isDeadlinePassed
    ? "—"
    : `~${formatDistanceToNow(new Date(registrationDeadline), { addSuffix: false }).replace(/^about\s+/i, "")}`;

  const driveStatusPill = () => {
    if (userRole !== "student") {
      const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
        Active: "default",
        Completed: "secondary",
        Cancelled: "destructive",
      };
      return (
        <Badge variant={variants[status] || "outline"} className="text-xs">
          {status}
        </Badge>
      );
    }
    if (status === "Active") {
      return <span className="student-v3-drive-pill-active">Active</span>;
    }
    if (status === "Completed") {
      return <span className="student-v3-drive-pill-muted">Completed</span>;
    }
    return <span className="student-v3-drive-pill-warn">Cancelled</span>;
  };

  const applicationStatusPill = () => {
    if (!isRegistered) return null;
    const label = registrationStatus || "Registered";
    if (userRole !== "student") {
      const colors: Record<string, string> = {
        Registered: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
        Shortlisted: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
        Interview: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
        Selected: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        Rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      };
      return (
        <Badge className={`text-xs ${colors[label] || colors.Registered}`}>
          {label}
        </Badge>
      );
    }
    const s = label.toLowerCase();
    let mod = "";
    if (s.includes("shortlist")) mod = " shortlisted";
    else if (s.includes("interview")) mod = " interview";
    else if (s.includes("select")) mod = " selected";
    else if (s.includes("reject")) mod = " rejected";
    return (
      <span
        className={`student-v3-drive-pill-app${mod}`}
        data-testid={`registration-status-${id}`}
      >
        {label}
      </span>
    );
  };

  const handleRegister = () => {
    if (!selectedResume) {
      alert("Please select a resume to apply");
      return;
    }
    if (onRegister) {
      onRegister(id, parseInt(selectedResume, 10), notes);
      setShowRegisterDialog(false);
      setSelectedResume("");
      setNotes("");
    }
  };

  const showRegisterButton =
    userRole === "student" && !isRegistered && !isDeadlinePassed && status === "Active";

  return (
    <>
      <Card
        className={`p-5 transition-all duration-200 ${
          userRole === "student" ? "student-drive-card no-default-hover-elevate" : "hover-elevate"
        }`}
        data-testid={`drive-card-${id}`}
      >
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={
                  userRole === "student"
                    ? "student-v3-dlogo shrink-0 w-11 h-11 text-[15px]"
                    : "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-muted text-base font-bold text-muted-foreground"
                }
                aria-hidden
              >
                {companyInitial(companyName)}
              </div>
              <div className="min-w-0">
                <h3
                  className="font-semibold text-lg truncate"
                  data-testid={`drive-company-${id}`}
                >
                  {companyName}
                </h3>
                <p className="text-sm text-muted-foreground truncate">{jobRole}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              {driveStatusPill()}
              {applicationStatusPill()}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-3 text-sm">
            <div>
              <div className="text-[11px] text-muted-foreground mb-0.5">Package</div>
              <div className="text-sm font-medium">
                ₹ {ctcMin} – {ctcMax} LPA
              </div>
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground mb-0.5">Min CGPA</div>
              <div className="text-sm font-medium">{minCgpa}</div>
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground mb-0.5">Max Backlogs</div>
              <div className="text-sm font-medium">{maxBacklogs}</div>
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground mb-0.5">Time Left</div>
              <div
                className={`text-sm font-medium ${
                  isDeadlinePassed ? "text-destructive" : ""
                }`}
              >
                {timeLeftApprox}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1">
            {allowedBranches.slice(0, 6).map((branch) => (
              <Badge key={branch} variant="outline" className="text-xs">
                {branch}
              </Badge>
            ))}
            {allowedBranches.length > 6 && (
              <Badge variant="outline" className="text-xs">
                +{allowedBranches.length - 6} more
              </Badge>
            )}
          </div>

          {/* Intentionally no "Closes &lt;date&gt;" row and no deadline progress bar — details are in View Details / dialog */}

          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(true)}
              data-testid={`button-view-drive-${id}`}
            >
              View Details
            </Button>
            {showRegisterButton ? (
              <Button
                size="sm"
                onClick={() => setShowRegisterDialog(true)}
                data-testid={`button-register-drive-${id}`}
              >
                Register
              </Button>
            ) : null}
            {userRole === "coordinator" && (
              <Button
                size="sm"
                onClick={() => onViewDetails?.(id)}
                data-testid={`button-manage-drive-${id}`}
              >
                Manage
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              {companyName} - {jobRole}
            </DialogTitle>
            <DialogDescription>
              CTC: {ctcMin} - {ctcMax} LPA
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Eligibility Criteria</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Minimum CGPA:</span>{" "}
                  {minCgpa}
                </p>
                <p>
                  <span className="text-muted-foreground">Max Backlogs:</span>{" "}
                  {maxBacklogs}
                </p>
              </div>
              <div className="mt-2">
                <span className="text-sm text-muted-foreground">Branches:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {allowedBranches.map((branch) => (
                    <Badge key={branch} variant="outline" className="text-xs">
                      {branch}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            {jobDescription && (
              <div>
                <h4 className="font-medium mb-2">Job Description</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {jobDescription}
                </p>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>
                Deadline:{" "}
                {new Date(registrationDeadline).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetails(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Register for {companyName}</DialogTitle>
            <DialogDescription>
              Select a resume and add any notes for your application.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Resume</Label>
              <Select value={selectedResume} onValueChange={setSelectedResume}>
                <SelectTrigger data-testid="select-resume">
                  <SelectValue placeholder="Choose a resume" />
                </SelectTrigger>
                <SelectContent>
                  {resumes.map((resume) => (
                    <SelectItem key={resume.id} value={resume.id.toString()}>
                      {resume.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                placeholder="Add any additional information..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                data-testid="input-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRegisterDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRegister}
              disabled={!selectedResume}
              data-testid="button-confirm-register"
            >
              Confirm Registration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
