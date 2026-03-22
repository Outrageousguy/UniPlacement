import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building2,
  Users,
  Calendar,
  Search,
  Edit,
  CheckCircle,
  Eye,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Drive {
  id: number;
  companyName: string;
  jobRole: string;
  ctcMin: number;
  ctcMax: number;
  registrationDeadline: Date;
  status: "Active" | "Completed" | "Cancelled";
  registrationsCount: number;
}

interface RegisteredStudent {
  id: number;
  studentId: number;
  name: string;
  rollNumber: string;
  branch: string;
  cgpa: number;
  status: "Registered" | "Shortlisted" | "Interview" | "Selected" | "Rejected";
  matchScore?: number;
}

interface DriveManagementProps {
  drives: Drive[];
  onViewDrive: (driveId: number) => void;
  onEditDrive: (driveId: number) => void;
  onCompleteDrive: (driveId: number) => void;
  completingDriveId?: number | null;
  isCompleting?: boolean;
}

export default function DriveManagement({
  drives,
  onViewDrive,
  onEditDrive,
  onCompleteDrive,
  completingDriveId = null,
  isCompleting = false,
}: DriveManagementProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deletingDriveId, setDeletingDriveId] = useState<number | null>(null);
  const { toast } = useToast();

  const deleteDriveMutation = useMutation({
    mutationFn: async (driveId: number) => {
      await apiRequest("DELETE", `/api/drives/${driveId}`);
      return driveId;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/drives"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/coordinator/stats"] });
      toast({ title: "Deleted", description: "Drive deleted successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description: error.message.replace(/^\d+:\s*/, ""),
        variant: "destructive",
      });
    },
    onSettled: () => {
      setDeletingDriveId(null);
    },
  });

  const filteredDrives = drives.filter((drive) => {
    const matchesSearch =
      drive.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      drive.jobRole.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || drive.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      Active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      Completed: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
      Cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return <Badge className={`text-xs ${colors[status]}`}>{status}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search drives..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-drives"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40" data-testid="filter-drive-status">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

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
                  CTC
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide">
                  Deadline
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide">
                  Registrations
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide">
                  Status
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDrives.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No drives found
                  </TableCell>
                </TableRow>
              ) : (
                filteredDrives.map((drive, index) => (
                  <TableRow
                    key={drive.id}
                    className={index % 2 === 0 ? "bg-background" : "bg-muted/30"}
                    data-testid={`row-drive-${drive.id}`}
                  >
                    <TableCell className="font-medium">
                      {drive.companyName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {drive.jobRole}
                    </TableCell>
                    <TableCell>
                      {drive.ctcMin} - {drive.ctcMax} LPA
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(drive.registrationDeadline), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        <Users className="w-3 h-3 mr-1" />
                        {drive.registrationsCount}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(drive.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => onViewDrive(drive.id)}
                          data-testid={`button-view-drive-${drive.id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {drive.status === "Active" && (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => onEditDrive(drive.id)}
                              data-testid={`button-edit-drive-${drive.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => onCompleteDrive(drive.id)}
                              disabled={isCompleting && completingDriveId === drive.id}
                              className="text-green-600"
                              data-testid={`button-complete-drive-${drive.id}`}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              disabled={deleteDriveMutation.isPending}
                              className="text-red-600"
                              data-testid={`button-delete-drive-${drive.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete this drive?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will also remove all registrations for it.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => {
                                  setDeletingDriveId(drive.id);
                                  deleteDriveMutation.mutate(drive.id);
                                }}
                                disabled={
                                  deleteDriveMutation.isPending && deletingDriveId === drive.id
                                }
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

export function DriveRegistrationsModal({
  drive,
  students,
  onUpdateStatus,
  onClose,
}: {
  drive: Drive;
  students: RegisteredStudent[];
  onUpdateStatus: (studentId: number, status: string) => void;
  onClose: () => void;
}) {
  const { toast } = useToast();

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

  const handleStatusChange = (studentId: number, newStatus: string) => {
    onUpdateStatus(studentId, newStatus);
    toast({
      title: "Updating Status",
      description: "Student status is being updated...",
    });
  };

  return (
    <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          {drive.companyName} - {drive.jobRole}
        </DialogTitle>
        <DialogDescription>
          Manage registered students for this drive
        </DialogDescription>
      </DialogHeader>

      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold text-xs uppercase tracking-wide">
                Name
              </TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide">
                Roll No.
              </TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide">
                Branch
              </TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide">
                CGPA
              </TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide">
                Match Score
              </TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide">
                Status
              </TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide">
                Update
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-muted-foreground"
                >
                  No students registered for this drive
                </TableCell>
              </TableRow>
            ) : (
              students.map((student, index) => (
                <TableRow
                  key={student.id}
                  className={index % 2 === 0 ? "bg-background" : "bg-muted/30"}
                >
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {student.rollNumber}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {student.branch}
                    </Badge>
                  </TableCell>
                  <TableCell>{student.cgpa.toFixed(2)}</TableCell>
                  <TableCell>
                    {student.matchScore ? (
                      <Badge
                        className={`text-xs ${
                          student.matchScore >= 80
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : student.matchScore >= 60
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                      >
                        {student.matchScore}%
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(student.status)}</TableCell>
                  <TableCell>
                    <Select
                      value={student.status}
                      onValueChange={(value) =>
                        handleStatusChange(student.studentId, value)
                      }
                    >
                      <SelectTrigger className="h-8 w-28 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Registered">Registered</SelectItem>
                        <SelectItem value="Shortlisted">Shortlisted</SelectItem>
                        <SelectItem value="Interview">Interview</SelectItem>
                        <SelectItem value="Selected">Selected</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <DialogFooter className="pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
