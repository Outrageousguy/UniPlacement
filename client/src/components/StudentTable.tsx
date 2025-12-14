import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, User, Eye } from "lucide-react";

interface Student {
  id: number;
  name: string;
  email: string;
  rollNumber: string;
  branch: string;
  graduationYear: number;
  cgpa: number;
  activeBacklogs: number;
  placementStatus: "Not Placed" | "Placed" | "Opted Out";
  placedCompany?: string;
  placedPackage?: number;
  registrationsCount: number;
}

interface StudentTableProps {
  students: Student[];
  onViewProfile?: (studentId: number) => void;
}

export default function StudentTable({
  students,
  onViewProfile,
}: StudentTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const branches = ["CSE", "IT", "ECE", "EEE", "Mechanical", "Civil", "Other"];
  const statuses = ["Not Placed", "Placed", "Opted Out"];

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBranch =
      branchFilter === "all" || student.branch === branchFilter;
    const matchesStatus =
      statusFilter === "all" || student.placementStatus === statusFilter;
    return matchesSearch && matchesBranch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      "Not Placed": "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
      Placed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      "Opted Out": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    };
    return <Badge className={`text-xs ${colors[status]}`}>{status}</Badge>;
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, roll number, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-students"
            />
          </div>
          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="w-full sm:w-40" data-testid="filter-branch">
              <SelectValue placeholder="All Branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map((branch) => (
                <SelectItem key={branch} value={branch}>
                  {branch}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40" data-testid="filter-status">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {statuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
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
                    Backlogs
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wide">
                    Status
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wide">
                    Registrations
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wide text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No students found matching your criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student, index) => (
                    <TableRow
                      key={student.id}
                      className={index % 2 === 0 ? "bg-background" : "bg-muted/30"}
                      data-testid={`row-student-${student.id}`}
                    >
                      <TableCell className="font-medium">
                        {student.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {student.rollNumber}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {student.branch}
                        </Badge>
                      </TableCell>
                      <TableCell>{student.cgpa.toFixed(2)}</TableCell>
                      <TableCell>{student.activeBacklogs}</TableCell>
                      <TableCell>{getStatusBadge(student.placementStatus)}</TableCell>
                      <TableCell>{student.registrationsCount}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setSelectedStudent(student)}
                          data-testid={`button-view-student-${student.id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          Showing {filteredStudents.length} of {students.length} students
        </p>
      </div>

      <Dialog
        open={!!selectedStudent}
        onOpenChange={() => setSelectedStudent(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Student Profile
            </DialogTitle>
            <DialogDescription>
              View detailed student information
            </DialogDescription>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Name</p>
                  <p className="font-medium">{selectedStudent.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedStudent.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Roll Number</p>
                  <p className="font-medium">{selectedStudent.rollNumber}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Branch</p>
                  <p className="font-medium">{selectedStudent.branch}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Graduation Year</p>
                  <p className="font-medium">{selectedStudent.graduationYear}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">CGPA</p>
                  <p className="font-medium">{selectedStudent.cgpa.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Active Backlogs</p>
                  <p className="font-medium">{selectedStudent.activeBacklogs}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Placement Status</p>
                  {getStatusBadge(selectedStudent.placementStatus)}
                </div>
                {selectedStudent.placedCompany && (
                  <>
                    <div>
                      <p className="text-muted-foreground">Placed Company</p>
                      <p className="font-medium">{selectedStudent.placedCompany}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Package</p>
                      <p className="font-medium">{selectedStudent.placedPackage} LPA</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
