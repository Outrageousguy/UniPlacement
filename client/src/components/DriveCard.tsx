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
import {
  Building2,
  Calendar,
  GraduationCap,
  AlertCircle,
  IndianRupee,
  Clock,
} from "lucide-react";
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
  const deadlineText = isDeadlinePassed
    ? "Deadline passed"
    : `${formatDistanceToNow(new Date(registrationDeadline))} left`;

  const getStatusBadge = () => {
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
  };

  const getRegistrationBadge = () => {
    if (!registrationStatus) return null;
    const colors: Record<string, string> = {
      Registered: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      Shortlisted: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      Interview: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      Selected: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      Rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return (
      <Badge className={`text-xs ${colors[registrationStatus]}`}>
        {registrationStatus}
      </Badge>
    );
  };

  const handleRegister = () => {
    if (selectedResume && onRegister) {
      onRegister(id, parseInt(selectedResume), notes);
      setShowRegisterDialog(false);
      setSelectedResume("");
      setNotes("");
    }
  };

  return (
    <>
      <Card className="p-5 hover-elevate transition-all duration-150" data-testid={`drive-card-${id}`}>
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <Building2 className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-lg" data-testid={`drive-company-${id}`}>
                  {companyName}
                </h3>
                <p className="text-sm text-muted-foreground">{jobRole}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              {getStatusBadge()}
              {isRegistered && getRegistrationBadge()}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <IndianRupee className="w-4 h-4" />
              <span>
                {ctcMin} - {ctcMax} LPA
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <GraduationCap className="w-4 h-4" />
              <span>Min CGPA: {minCgpa}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="w-4 h-4" />
              <span>Max Backlogs: {maxBacklogs}</span>
            </div>
            <div
              className={`flex items-center gap-2 ${
                isDeadlinePassed ? "text-destructive" : "text-muted-foreground"
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{deadlineText}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1">
            {allowedBranches.slice(0, 3).map((branch) => (
              <Badge key={branch} variant="outline" className="text-xs">
                {branch}
              </Badge>
            ))}
            {allowedBranches.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{allowedBranches.length - 3} more
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(true)}
              data-testid={`button-view-drive-${id}`}
            >
              View Details
            </Button>
            {userRole === "student" && !isRegistered && !isDeadlinePassed && status === "Active" && (
              <Button
                size="sm"
                onClick={() => setShowRegisterDialog(true)}
                data-testid={`button-register-drive-${id}`}
              >
                Register
              </Button>
            )}
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
