import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient, apiRequest } from "./lib/queryClient";
import { QueryClientProvider, useQuery, useMutation } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Header from "@/components/layout/Header";
import StatsCard from "@/components/StatsCard";
import DriveCard from "@/components/DriveCard";
import StudentTable from "@/components/StudentTable";
import DriveForm from "@/components/DriveForm";
import { AuthPage } from "@/components/AuthForms";
import ResumeManager from "@/components/ResumeManager";
import ApplicationsTable from "@/components/ApplicationsTable";
import DriveManagement from "@/components/DriveManagement";
import { ExtendedOpportunities } from "@/components/ExtendedOpportunities";
import {
  Building2,
  Users,
  TrendingUp,
  CheckCircle,
  Plus,
  Target,
  Clock,
  Copy,
  Search,
  LayoutDashboard,
  BriefcaseBusiness,
  FileText,
  ExternalLink,
  BookOpen,
  Bell,
  UserCircle2,
  Settings2,
  MoreVertical,
  Upload,
  LayoutGrid,
  List,
} from "lucide-react";
import "./styles/mits-landing.css";
import "./styles/student-dashboard-v3.css";

function CoordinatorDashboard({ onLogout, user }: { onLogout: () => void; user?: any }) {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [showDriveForm, setShowDriveForm] = useState(false);
  const [viewDriveId, setViewDriveId] = useState<number | null>(null);
  const [editDriveId, setEditDriveId] = useState<number | null>(null);
  const [completingDriveId, setCompletingDriveId] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: stats } = useQuery<{ activeDrives: number; totalStudents: number; placedStudents: number; placementRate: number; avgPackage: string; inviteCode: string }>({
    queryKey: ["/api/coordinator/stats"],
    enabled: !!user,
  });

  const { data: drives = [] } = useQuery<any[]>({
    queryKey: ["/api/drives"],
    enabled: !!user,
  });

  const { data: students = [] } = useQuery<any[]>({
    queryKey: ["/api/coordinator/students"],
    enabled: !!user,
  });

  const createDriveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/drives", data);
      return res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/drives"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/coordinator/stats"] });
      setShowDriveForm(false);
      toast({ title: "Success", description: "Drive posted successfully!" });
    },
    onError: (error: Error) => {
      toast({
        title: "Post failed",
        description: error.message.replace(/^\d+:\s*/, ""),
        variant: "destructive",
      });
    },
  });

  const completeDriveMutation = useMutation({
    mutationFn: async (driveId: number) => {
      const res = await apiRequest("PATCH", `/api/drives/${driveId}`, {
        status: "Completed",
      });
      return res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/drives"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/coordinator/stats"] });
      toast({ title: "Completed", description: "Drive marked as completed" });
    },
    onError: (error: Error) => {
      toast({
        title: "Complete failed",
        description: error.message.replace(/^\d+:\s*/, ""),
        variant: "destructive",
      });
    },
    onSettled: () => {
      setCompletingDriveId(null);
    },
  });

  const updateDriveMutation = useMutation({
    mutationFn: async ({ driveId, data }: { driveId: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/drives/${driveId}`, data);
      return res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/drives"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/coordinator/stats"] });
      setEditDriveId(null);
      toast({ title: "Updated", description: "Drive updated successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message.replace(/^\d+:\s*/, ""),
        variant: "destructive",
      });
    },
  });

  const selectedViewDrive = viewDriveId ? drives.find((d: any) => d.id === viewDriveId) : null;
  const selectedEditDrive = editDriveId ? drives.find((d: any) => d.id === editDriveId) : null;

  const toDateTimeLocalValue = (value: unknown) => {
    const date = value instanceof Date ? value : new Date(value as any);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 16);
  };

  const inviteCode = stats?.inviteCode || user?.inviteCode || "Loading...";

  const copyInviteCode = async () => {
    try {
      if (!navigator.clipboard) {
        throw new Error("Clipboard API not available");
      }
      await navigator.clipboard.writeText(inviteCode);
      toast({
        title: "Copied!",
        description: "Invite code copied to clipboard",
      });
    } catch {
      toast({
        title: "Copy failed",
        description: "Could not copy invite code. Please copy it manually.",
        variant: "destructive",
      });
    }
  };

  const activeDrives = stats?.activeDrives || 0;
  const placedStudents = stats?.placedStudents || 0;
  const totalStudents = stats?.totalStudents || 0;
  const placementRate = stats?.placementRate || 0;
  const avgPackage = stats?.avgPackage || "0";

  return (
    <div className="min-h-screen bg-background">
      <Header
        userName={user?.name || "Coordinator"}
        userRole="coordinator"
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={onLogout}
      />

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {activeTab === "Dashboard" && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">Madhav Institute of Technology and Science, Gwalior</p>
              </div>
              <Card className="p-4 flex items-center gap-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Student Invite Code</p>
                  <p className="font-mono font-semibold">{inviteCode}</p>
                </div>
                <Button size="icon" variant="outline" onClick={copyInviteCode} data-testid="button-copy-invite">
                  <Copy className="w-4 h-4" />
                </Button>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard title="Active Drives" value={activeDrives} subtitle="Currently recruiting" icon={Building2} variant="primary" />
              <StatsCard title="Students Placed" value={`${placedStudents}/${totalStudents}`} subtitle={`${placementRate}% placement rate`} icon={CheckCircle} trend={{ value: 12, isPositive: true }} variant="secondary" />
              <StatsCard title="Total Students" value={totalStudents} subtitle="Registered students" icon={Users} variant="accent" />
              <StatsCard title="Avg Package" value={`${avgPackage} LPA`} subtitle="This season" icon={TrendingUp} trend={{ value: 15, isPositive: true }} variant="primary" />
            </div>

            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Recent Drives</h2>
              <Button onClick={() => setShowDriveForm(true)} data-testid="button-post-drive">
                <Plus className="w-4 h-4 mr-2" />
                Post New Drive
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {drives.length === 0 ? (
                <Card className="p-6">
                  <p className="text-sm text-muted-foreground">No drives yet. Click “Post New Drive” to create one.</p>
                </Card>
              ) : (
                drives.slice(0, 4).map((drive: any) => (
                  <DriveCard
                    key={drive.id}
                    {...drive}
                    userRole="coordinator"
                    onViewDetails={(id) => {
                      setActiveTab("Drives");
                      setViewDriveId(id);
                    }}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "Drives" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-semibold tracking-tight">Manage Drives</h1>
              <Button onClick={() => setShowDriveForm(true)} data-testid="button-new-drive">
                <Plus className="w-4 h-4 mr-2" />
                Post New Drive
              </Button>
            </div>
            <DriveManagement
              drives={drives}
              onViewDrive={(id) => setViewDriveId(id)}
              onEditDrive={(id) => setEditDriveId(id)}
              onCompleteDrive={(id) => {
                setCompletingDriveId(id);
                completeDriveMutation.mutate(id);
              }}
              completingDriveId={completingDriveId}
              isCompleting={completeDriveMutation.isPending}
            />
          </div>
        )}

        {activeTab === "Students" && (
          <div className="space-y-6">
            <h1 className="text-3xl font-semibold tracking-tight">Students</h1>
            <StudentTable
              students={students}
              onViewProfile={() => {
                toast({
                  title: "Coming soon",
                  description: "Student profile view is not available yet.",
                });
              }}
            />
          </div>
        )}

        {showDriveForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="text-lg font-semibold">Post New Drive</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowDriveForm(false)}>
                  Close
                </Button>
              </div>
              <div className="p-4">
                <DriveForm
                  onSubmit={(data) => {
                    createDriveMutation.mutate({
                      companyName: data.companyName,
                      jobRole: data.jobRole,
                      ctcMin: data.ctcMin.toString(),
                      ctcMax: data.ctcMax.toString(),
                      jobDescription: data.jobDescription,
                      minCgpa: data.minCgpa.toString(),
                      maxBacklogs: data.maxBacklogs,
                      allowedBranches: data.allowedBranches,
                      registrationDeadline: data.registrationDeadline,
                    });
                  }}
                  isLoading={createDriveMutation.isPending}
                />
              </div>
            </div>
          </div>
        )}

        <Dialog open={!!viewDriveId} onOpenChange={(open) => !open && setViewDriveId(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Drive Details</DialogTitle>
            </DialogHeader>

            {!selectedViewDrive ? (
              <div className="text-sm text-muted-foreground">Drive not found.</div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="text-lg font-semibold">
                    {selectedViewDrive.companyName} - {selectedViewDrive.jobRole}
                  </div>
                  <div className="text-sm text-muted-foreground">Status: {selectedViewDrive.status}</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-muted-foreground">CTC</div>
                    <div>
                      {selectedViewDrive.ctcMin} - {selectedViewDrive.ctcMax} LPA
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Min CGPA</div>
                    <div>{selectedViewDrive.minCgpa}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Max Backlogs</div>
                    <div>{selectedViewDrive.maxBacklogs}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Deadline</div>
                    <div>{new Date(selectedViewDrive.registrationDeadline).toLocaleString()}</div>
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-muted-foreground">Allowed Branches</div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {(selectedViewDrive.allowedBranches || []).map((b: string) => (
                        <Badge key={b} variant="secondary">
                          {b}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-muted-foreground">Job Description</div>
                    <div className="whitespace-pre-wrap">{selectedViewDrive.jobDescription}</div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (!selectedViewDrive) return;
                      setViewDriveId(null);
                      setEditDriveId(selectedViewDrive.id);
                    }}
                  >
                    Edit
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={!!editDriveId} onOpenChange={(open) => !open && setEditDriveId(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Edit Drive</DialogTitle>
            </DialogHeader>

            {!selectedEditDrive ? (
              <div className="text-sm text-muted-foreground">Drive not found.</div>
            ) : (
              <DriveForm
                initialData={{
                  companyName: selectedEditDrive.companyName,
                  jobRole: selectedEditDrive.jobRole,
                  ctcMin: Number(selectedEditDrive.ctcMin),
                  ctcMax: Number(selectedEditDrive.ctcMax),
                  jobDescription: selectedEditDrive.jobDescription,
                  minCgpa: Number(selectedEditDrive.minCgpa),
                  maxBacklogs: Number(selectedEditDrive.maxBacklogs),
                  allowedBranches: selectedEditDrive.allowedBranches || [],
                  registrationDeadline: toDateTimeLocalValue(selectedEditDrive.registrationDeadline),
                }}
                onSubmit={(data) => {
                  updateDriveMutation.mutate({
                    driveId: selectedEditDrive.id,
                    data: {
                      companyName: data.companyName,
                      jobRole: data.jobRole,
                      ctcMin: data.ctcMin.toString(),
                      ctcMax: data.ctcMax.toString(),
                      jobDescription: data.jobDescription,
                      minCgpa: data.minCgpa.toString(),
                      maxBacklogs: data.maxBacklogs,
                      allowedBranches: data.allowedBranches,
                      registrationDeadline: data.registrationDeadline,
                    },
                  });
                }}
                isLoading={updateDriveMutation.isPending}
              />
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

function StudentDashboard({ onLogout, user }: { onLogout: () => void; user?: any }) {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [viewingResume, setViewingResume] = useState<{ id: number; name: string; content: string } | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [drivesSearch, setDrivesSearch] = useState("");
  const [drivesBranchFilter, setDrivesBranchFilter] = useState("All Branches");
  const [drivesCgpaFilter, setDrivesCgpaFilter] = useState("Any CGPA");
  const [drivesStatusFilter, setDrivesStatusFilter] = useState("All Status");
  const [drivesSortBy, setDrivesSortBy] = useState("Sort: Deadline");
  const [drivesViewMode, setDrivesViewMode] = useState<"grid" | "list">("grid");
  const [viewStudentDriveId, setViewStudentDriveId] = useState<number | null>(null);
  const [analyzingApplicationId, setAnalyzingApplicationId] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: drives = [] } = useQuery<any[]>({
    queryKey: ["/api/drives"],
    enabled: !!user,
  });

  const { data: applications = [] } = useQuery<any[]>({
    queryKey: ["/api/student/applications"],
    enabled: !!user,
  });

  const { data: resumes = [] } = useQuery<any[]>({
    queryKey: ["/api/resumes"],
    enabled: !!user,
  });


  // Resume view handler
  const handleViewResume = async (resumeId: number) => {
    try {
      const response = await apiRequest("GET", `/api/resumes/${resumeId}/content`);
      const data = await response.json();
      
      // Find resume name from the resumes list
      const resume = activeResumes.find(r => r.id === resumeId);
      setViewingResume({
        id: resumeId,
        name: resume?.name || "Resume",
        content: data.fileContent
      });
    } catch (error) {
      console.error("Failed to view resume:", error);
      toast({
        title: "Failed to View Resume",
        description: "Could not load resume content. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  // Resume upload mutation
  const uploadResumeMutation = useMutation({
    mutationFn: async ({ file, name, isDefault }: { file: File; name: string; isDefault: boolean }) => {
      const fileContent = await fileToBase64(file);
      const response = await apiRequest("POST", "/api/resumes", {
        name,
        fileName: file.name,
        fileContent,
        isDefault,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resumes"] });
    },
    onError: (error) => {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload resume. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Resume delete mutation
  const deleteResumeMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/resumes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resumes"] });
    },
    onError: (error) => {
      console.error("Delete error:", error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete resume. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Set default resume mutation
  const setDefaultResumeMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("PATCH", `/api/resumes/${id}/default`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resumes"] });
    },
    onError: (error) => {
      console.error("Set default error:", error);
      toast({
        title: "Update Failed",
        description: "Failed to set default resume. Please try again.",
        variant: "destructive",
      });
    },
  });

  


  // Apply to drive mutation
  const applyToDriveMutation = useMutation({
    mutationFn: async ({ driveId, resumeId, notes }: { driveId: number; resumeId: number; notes?: string }) => {
      const response = await apiRequest("POST", "/api/student/apply", {
        driveId,
        resumeId,
        notes,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/student/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/drives"] });
    },
    onError: (error: Error) => {
      console.error("Apply to drive error:", error);
      toast({
        title: "Application Failed",
        description: error.message || "Failed to apply to drive. Please try again.",
        variant: "destructive",
      });
    },
  });

  const analyzeApplicationMutation = useMutation({
    mutationFn: async (applicationId: number) => {
      const res = await apiRequest("POST", "/api/analyze", { applicationId });
      return res.json();
    },
    onMutate: (applicationId) => setAnalyzingApplicationId(applicationId),
    onSettled: () => setAnalyzingApplicationId(null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/student/applications"] });
      toast({
        title: "Analysis complete",
        description: "Your match score has been updated for this application.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Analysis failed",
        description: error.message.replace(/^\d+:\s*/, "") || "Could not analyze resume.",
        variant: "destructive",
      });
    },
  });

  // Withdraw application mutation
  const withdrawApplicationMutation = useMutation({
    mutationFn: async (applicationId: number) => {
      await apiRequest("DELETE", `/api/student/applications/${applicationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/student/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/drives"] });
    },
    onError: (error) => {
      console.error("Withdraw application error:", error);
      toast({
        title: "Withdrawal Failed",
        description: "Failed to withdraw application. Please try again.",
        variant: "destructive",
      });
    },
  });

  const currentStudent = user ? {
    name: user.name,
    rollNumber: user.rollNumber,
    branch: user.branch,
    cgpa: user.cgpa,
    activeBacklogs: user.activeBacklogs,
    placementStatus: user.placementStatus as "Not Placed" | "Placed" | "Opted Out",
  } : {
    name: "Student",
    rollNumber: "",
    branch: "CSE",
    cgpa: 0,
    activeBacklogs: 0,
    placementStatus: "Not Placed" as "Not Placed" | "Placed" | "Opted Out",
  };

  const activeDrives = drives;
  const activeApplications = applications;
  const activeResumes = resumes;
  const selectedStudentViewDrive =
    viewStudentDriveId != null ? drives.find((d: any) => d.id === viewStudentDriveId) : null;

  const eligibleDrives = activeDrives.filter((drive: any) => {
    return (
      drive.status === "Active" &&
      currentStudent.cgpa >= drive.minCgpa &&
      currentStudent.activeBacklogs <= drive.maxBacklogs &&
      drive.allowedBranches?.includes(currentStudent.branch) &&
      new Date(drive.registrationDeadline) > new Date()
    );
  });

  const registeredDriveIds = activeApplications.map((a: any) => a.driveId);
  const initials = currentStudent.name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const firstName = currentStudent.name.split(" ")[0] || "Student";
  const batchShort = (() => {
    const y = user?.graduationYear;
    if (typeof y === "number") return `'${String(y).slice(-2)}`;
    return "Batch";
  })();
  const formatShortDate = (dateValue: string | Date) =>
    new Date(dateValue).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const dashboardEligibleDrives = eligibleDrives.slice(0, 4);
  const dashboardRecentApplications = activeApplications.slice(0, 3);
  const dashboardDeadlines = [...eligibleDrives]
    .sort(
      (a, b) =>
        new Date(a.registrationDeadline).getTime() -
        new Date(b.registrationDeadline).getTime()
    )
    .slice(0, 4);
  const allActiveDrives = activeDrives.filter((d: any) => d.status === "Active");
  const eligibleDriveCount = allActiveDrives.filter(
    (drive: any) =>
      currentStudent.cgpa >= drive.minCgpa &&
      currentStudent.activeBacklogs <= drive.maxBacklogs &&
      drive.allowedBranches?.includes(currentStudent.branch)
  ).length;
  const registeredDrivesCount = allActiveDrives.filter((drive: any) =>
    registeredDriveIds.includes(drive.id)
  ).length;
  const drivesFiltered = [...allActiveDrives]
    .filter((drive: any) => {
      const query = drivesSearch.trim().toLowerCase();
      if (!query) return true;
      return (
        String(drive.companyName).toLowerCase().includes(query) ||
        String(drive.jobRole).toLowerCase().includes(query)
      );
    })
    .filter((drive: any) => {
      if (drivesBranchFilter === "All Branches") return true;
      return (drive.allowedBranches || []).includes(drivesBranchFilter);
    })
    .filter((drive: any) => {
      if (drivesCgpaFilter === "Any CGPA") return true;
      const min = Number(drivesCgpaFilter.replace("+", ""));
      return Number(drive.minCgpa) >= min;
    })
    .filter((drive: any) => {
      if (drivesStatusFilter === "All Status") return true;
      if (drivesStatusFilter === "Registered") return registeredDriveIds.includes(drive.id);
      return String(drive.status) === drivesStatusFilter;
    })
    .sort((a: any, b: any) => {
      if (drivesSortBy === "Sort: Package ↑") return Number(a.ctcMax) - Number(b.ctcMax);
      if (drivesSortBy === "Sort: Package ↓") return Number(b.ctcMax) - Number(a.ctcMax);
      if (drivesSortBy === "Sort: Newest") {
        return (
          new Date(b.registrationDeadline).getTime() -
          new Date(a.registrationDeadline).getTime()
        );
      }
      return (
        new Date(a.registrationDeadline).getTime() -
        new Date(b.registrationDeadline).getTime()
      );
    });

  return (
    <div className="student-v3-root">
      <aside className="student-v3-sb">
        <div className="student-v3-logo">
          <div className="student-v3-logo-icon">U</div>
          <div>
            <div className="student-v3-title">UniPlacement</div>
            <div className="student-v3-subtitle">MITS · T&P Cell</div>
          </div>
        </div>

        <div className="student-v3-search-wrap">
          <button type="button" className="student-v3-search-btn" onClick={() => setActiveTab("Dashboard")}>
            <Search className="h-3.5 w-3.5" />
            <span>Search...</span>
            <kbd>Cmd+K</kbd>
          </button>
        </div>

        <nav className="student-v3-nav">
          <div className="student-v3-nav-label">Main</div>
          <button type="button" className={`student-v3-nav-item ${activeTab === "Dashboard" ? "on" : ""}`} onClick={() => setActiveTab("Dashboard")}>
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </button>
          <button type="button" className={`student-v3-nav-item ${activeTab === "Drives" ? "on" : ""}`} onClick={() => setActiveTab("Drives")}>
            <BriefcaseBusiness className="h-4 w-4" />
            Placement Drives
            <span className="student-v3-badge">{eligibleDrives.length}</span>
          </button>
          <button type="button" className={`student-v3-nav-item ${activeTab === "My Applications" ? "on" : ""}`} onClick={() => setActiveTab("My Applications")}>
            <FileText className="h-4 w-4" />
            My Applications
          </button>
          <button type="button" className={`student-v3-nav-item ${activeTab === "Resumes" ? "on" : ""}`} onClick={() => setActiveTab("Resumes")}>
            <FileText className="h-4 w-4" />
            My Resumes
          </button>

          <div className="student-v3-divider" />
          <div className="student-v3-nav-label">Explore</div>
          <button type="button" className={`student-v3-nav-item ${activeTab === "External Opportunities" ? "on" : ""}`} onClick={() => setActiveTab("External Opportunities")}>
            <ExternalLink className="h-4 w-4" />
            External Opportunities
          </button>
          <button
            type="button"
            className="student-v3-nav-item"
            onClick={() => toast({ title: "Coming soon", description: "Interview Prep will be available soon." })}
          >
            <BookOpen className="h-4 w-4" />
            Interview Prep
          </button>

          <div className="student-v3-divider" />
          <div className="student-v3-nav-label">Account</div>
          <button
            type="button"
            className="student-v3-nav-item"
            onClick={() => toast({ title: "Coming soon", description: "Profile editing is not available yet." })}
          >
            <UserCircle2 className="h-4 w-4" />
            Edit Profile
          </button>
          <button
            type="button"
            className="student-v3-nav-item"
            onClick={() => toast({ title: "Coming soon", description: "Settings screen is not available yet." })}
          >
            <Settings2 className="h-4 w-4" />
            Settings
          </button>
          <button
            type="button"
            className="student-v3-nav-item"
            onClick={() => toast({ title: "Coming soon", description: "Notifications center is not available yet." })}
          >
            <Bell className="h-4 w-4" />
            Notifications
            <span className="student-v3-badge">{activeApplications.length}</span>
          </button>
        </nav>

        <div className="student-v3-footer">
          {isProfileMenuOpen && (
            <div className="student-v3-profile-menu">
              <button
                type="button"
                className="student-v3-profile-item"
                onClick={() => toast({ title: "Coming soon", description: "Profile page is not available yet." })}
              >
                View Profile
              </button>
              <button
                type="button"
                className="student-v3-profile-item"
                onClick={() => toast({ title: "Coming soon", description: "Account settings are not available yet." })}
              >
                Account Settings
              </button>
              <button
                type="button"
                className="student-v3-profile-item"
                onClick={() => toast({ title: "Thanks!", description: "Feedback feature will be enabled soon." })}
              >
                Feedback
              </button>
              <div className="student-v3-profile-sep" />
              <button type="button" className="student-v3-profile-item red" onClick={onLogout}>
                Sign Out
              </button>
            </div>
          )}
          <div className="student-v3-profile-card">
            <div className="student-v3-avatar">{initials}</div>
            <div>
              <div className="student-v3-profile-name">{currentStudent.name}</div>
              <div className="student-v3-profile-role">
                {currentStudent.branch} · {user?.graduationYear || "Batch"}
              </div>
            </div>
            <button
              type="button"
              className="student-v3-profile-more"
              onClick={() => setIsProfileMenuOpen((prev) => !prev)}
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="student-v3-main">
        <div className="student-v3-topbar">
          <div>
            <div className="student-v3-topbar-title">{activeTab}</div>
            <div className="student-v3-topbar-subtitle">
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · Placement Season 2025-26
            </div>
          </div>
          <div className="student-v3-topbar-right">
            <button
              type="button"
              className="student-v3-icon-btn"
              onClick={() => toast({ title: "Coming soon", description: "Notifications panel is not available yet." })}
            >
              <Bell className="h-4 w-4" />
              <span className="student-v3-dot" />
            </button>
            <button type="button" className="student-v3-primary-btn" onClick={() => setActiveTab("Resumes")}>
              <Upload className="h-3.5 w-3.5" />
              Upload Resume
            </button>
          </div>
        </div>

        <div className="student-v3-content">
        {activeTab === "Dashboard" && (
          <div className="space-y-8">
            <div className="student-v3-wb">
              <div>
                <h1>
                  Welcome back, <em>{firstName}!</em>
                </h1>
                <p>
                  Your placement profile is active · Keep your resume updated to maximise match scores.
                </p>
              </div>
              <div className="student-v3-sp">
                <div className="student-v3-pill">
                  <span className="v">{currentStudent.cgpa}</span>
                  <span className="l">CGPA</span>
                </div>
                <div className="student-v3-pill">
                  <span className="v">{currentStudent.branch}</span>
                  <span className="l">Branch</span>
                </div>
                <div className="student-v3-pill">
                  <span className="v">{batchShort}</span>
                  <span className="l">Batch</span>
                </div>
              </div>
            </div>

            <div className="student-v3-kg">
              <div className="student-v3-kc">
                <div className="student-v3-kl">Eligible Drives</div>
                <div className="student-v3-kv">{eligibleDrives.length}</div>
                <div className="student-v3-ks">Based on your profile</div>
              </div>
              <div className="student-v3-kc">
                <div className="student-v3-kl">My Applications</div>
                <div className="student-v3-kv">{activeApplications.length}</div>
                <div className="student-v3-ks">Active applications</div>
              </div>
              <div className="student-v3-kc">
                <div className="student-v3-kl">Upcoming Deadlines</div>
                <div className="student-v3-kv">
                  {
                    eligibleDrives.filter((d) => {
                      const days = Math.ceil(
                        (new Date(d.registrationDeadline).getTime() - Date.now()) /
                          (1000 * 60 * 60 * 24)
                      );
                      return days <= 7;
                    }).length
                  }
                </div>
                <div className="student-v3-ks">Within 7 days</div>
              </div>
            </div>

            <div className="student-v3-tc">
              <div>
                <div className="student-v3-card">
                  <div className="student-v3-ch">
                    <span className="student-v3-ct">
                      <Clock className="h-3.5 w-3.5" />
                      Eligible Drives
                    </span>
                    <button type="button" className="student-v3-ca" onClick={() => setActiveTab("Drives")}>
                      View all →
                    </button>
                  </div>
                  {dashboardEligibleDrives.length === 0 ? (
                    <div className="student-v3-empty">
                      No eligible drives available
                      <small>Check back later for new opportunities.</small>
                    </div>
                  ) : (
                    dashboardEligibleDrives.map((drive: any) => (
                      <div key={drive.id} className="student-v3-dr" onClick={() => setActiveTab("Drives")}>
                        <div className="student-v3-dr-left">
                          <div className="student-v3-dlogo">
                            {String(drive.companyName || "?").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="student-v3-dco">{drive.companyName}</div>
                            <div className="student-v3-drole">{drive.jobRole}</div>
                          </div>
                        </div>
                        <div className="student-v3-dr-right">
                          <div className="student-v3-dpkg">
                            ₹ {Number(drive.ctcMax || drive.ctcMin || 0)} LPA
                          </div>
                          <div className="student-v3-ddl">
                            Closes {formatShortDate(drive.registrationDeadline)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="student-v3-card">
                  <div className="student-v3-ch">
                    <span className="student-v3-ct">
                      <FileText className="h-3.5 w-3.5" />
                      Recent Applications
                    </span>
                    <button type="button" className="student-v3-ca" onClick={() => setActiveTab("My Applications")}>
                      All applications →
                    </button>
                  </div>
                  {dashboardRecentApplications.length === 0 ? (
                    <div className="student-v3-empty">
                      No applications yet
                      <small>Apply to eligible drives to see updates here.</small>
                    </div>
                  ) : (
                    <table className="student-v3-at">
                      <thead>
                        <tr>
                          <th>Company</th>
                          <th>Role</th>
                          <th>Applied</th>
                          <th>Status</th>
                          <th>Match</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboardRecentApplications.map((application: any) => {
                          const score = Number(application.matchScore || 0);
                          const status = String(application.status || "Under Review");
                          const statusClass =
                            status.toLowerCase().includes("short") ? "student-v3-ss" :
                            status.toLowerCase().includes("reject") || status.toLowerCase().includes("not") ? "student-v3-srej" :
                            "student-v3-sr";
                          return (
                            <tr key={application.id}>
                              <td>{application.companyName || "-"}</td>
                              <td>{application.jobRole || "-"}</td>
                              <td>{application.createdAt ? formatShortDate(application.createdAt) : "-"}</td>
                              <td>
                                <span className={`student-v3-sb2 ${statusClass}`}>{status}</span>
                              </td>
                              <td>
                                <div className="student-v3-mw">
                                  <span className="student-v3-mp">{score}%</span>
                                  <div className="student-v3-mt">
                                    <div className="student-v3-mf" style={{ width: `${Math.max(0, Math.min(score, 100))}%` }} />
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              <div>
                <div className="student-v3-card">
                  <div className="student-v3-ch">
                    <span className="student-v3-ct">
                      <Clock className="h-3.5 w-3.5" />
                      Upcoming Deadlines
                    </span>
                  </div>
                  {dashboardDeadlines.length === 0 ? (
                    <div className="student-v3-empty">
                      No upcoming deadlines
                      <small>Deadlines will appear when drives are active.</small>
                    </div>
                  ) : (
                    dashboardDeadlines.map((drive: any) => {
                      const days = Math.ceil(
                        (new Date(drive.registrationDeadline).getTime() - Date.now()) /
                          (1000 * 60 * 60 * 24)
                      );
                      const urgent = days <= 3;
                      return (
                        <div key={drive.id} className="student-v3-dli">
                          <div className="student-v3-dld" style={{ background: urgent ? "#f87171" : "var(--gold)" }} />
                          <div>
                            <div className="student-v3-dli-co">{drive.companyName}</div>
                            <div className="student-v3-dli-role">{drive.jobRole}</div>
                          </div>
                          <div className={`student-v3-dli-date ${urgent ? "hot" : ""}`}>
                            {formatShortDate(drive.registrationDeadline)}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Drives" && (
          <div>
            <div className="student-v3-page-top">
              <div>
                <div className="student-v3-page-title">Browse Drives</div>
                <div className="student-v3-drive-count">
                  {allActiveDrives.length} drives · {eligibleDriveCount} eligible for your profile
                </div>
              </div>
              <div className="student-v3-view-toggle">
                <button
                  type="button"
                  className={`student-v3-vt ${drivesViewMode === "grid" ? "on" : ""}`}
                  onClick={() => setDrivesViewMode("grid")}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  className={`student-v3-vt ${drivesViewMode === "list" ? "on" : ""}`}
                  onClick={() => setDrivesViewMode("list")}
                >
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="student-v3-filter-strip">
              <input
                className="student-v3-fi student-v3-fi-search"
                type="text"
                placeholder="Search company or role..."
                value={drivesSearch}
                onChange={(e) => setDrivesSearch(e.target.value)}
              />
              <select className="student-v3-fi" value={drivesBranchFilter} onChange={(e) => setDrivesBranchFilter(e.target.value)}>
                <option>All Branches</option>
                <option>CSE</option>
                <option>IT</option>
                <option>EEE</option>
                <option>ECE</option>
                <option>ME</option>
              </select>
              <select className="student-v3-fi" value={drivesCgpaFilter} onChange={(e) => setDrivesCgpaFilter(e.target.value)}>
                <option>Any CGPA</option>
                <option>6.0+</option>
                <option>7.0+</option>
                <option>7.5+</option>
                <option>8.0+</option>
              </select>
              <select className="student-v3-fi" value={drivesStatusFilter} onChange={(e) => setDrivesStatusFilter(e.target.value)}>
                <option>All Status</option>
                <option>Active</option>
                <option>Registered</option>
              </select>
              <select className="student-v3-fi" value={drivesSortBy} onChange={(e) => setDrivesSortBy(e.target.value)}>
                <option>Sort: Deadline</option>
                <option>Sort: Package ↑</option>
                <option>Sort: Package ↓</option>
                <option>Sort: Newest</option>
              </select>
              {drivesBranchFilter !== "All Branches" && (
                <button type="button" className="student-v3-active-filter" onClick={() => setDrivesBranchFilter("All Branches")}>
                  {drivesBranchFilter} ✕
                </button>
              )}
            </div>

            <div className="student-v3-stats-bar">
              <div className="student-v3-stat-card">
                <div className="student-v3-sc-label">Total Drives</div>
                <div className="student-v3-sc-val">{allActiveDrives.length}</div>
                <div className="student-v3-sc-sub">This season</div>
              </div>
              <div className="student-v3-stat-card">
                <div className="student-v3-sc-label">Eligible for You</div>
                <div className="student-v3-sc-val">{eligibleDriveCount}</div>
                <div className="student-v3-sc-sub">Matches your profile</div>
              </div>
              <div className="student-v3-stat-card">
                <div className="student-v3-sc-label">Already Registered</div>
                <div className="student-v3-sc-val">{registeredDrivesCount}</div>
                <div className="student-v3-sc-sub">Applications submitted</div>
              </div>
            </div>

            <div className={`student-v3-drives-grid ${drivesViewMode === "list" ? "list" : ""}`}>
              {drivesFiltered.map((drive: any) => {
                const isEligible =
                  currentStudent.cgpa >= drive.minCgpa &&
                  currentStudent.activeBacklogs <= drive.maxBacklogs &&
                  drive.allowedBranches?.includes(currentStudent.branch);
                return (
                  <div key={drive.id} className={!isEligible ? "opacity-60" : ""}>
                    <DriveCard
                      {...drive}
                      isRegistered={registeredDriveIds.includes(drive.id)}
                      registrationStatus={
                        activeApplications.find((a: any) => a.driveId === drive.id)?.status
                      }
                      resumes={activeResumes}
                      onRegister={async (driveId, resumeId, notes) => {
                        try {
                          await applyToDriveMutation.mutateAsync({ driveId, resumeId, notes });
                          toast({
                            title: "Registration Successful",
                            description: `You have registered for ${drive.companyName}`,
                          });
                        } catch (error) {
                          // Error handling is done in the mutation
                        }
                      }}
                      userRole="student"
                    />
                    {!isEligible && (
                      <p className="text-xs text-destructive mt-2 text-center">
                        You do not meet the eligibility criteria for this drive
                      </p>
                    )}
                  </div>
                );
              })}
              {drivesFiltered.length === 0 && (
                <div className="student-v3-empty">
                  No drives found
                  <small>Try changing filters or search term.</small>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "My Applications" && (
          <ApplicationsTable
            applications={activeApplications}
            analyzingApplicationId={analyzingApplicationId}
            onWithdraw={async (id) => {
              try {
                await withdrawApplicationMutation.mutateAsync(id);
                toast({
                  title: "Application Withdrawn",
                  description: "Your application has been withdrawn",
                });
              } catch {
                /* mutation handles toast */
              }
            }}
            onViewDrive={(id) => setViewStudentDriveId(id)}
            onAnalyze={(id) => analyzeApplicationMutation.mutateAsync(id)}
          />
        )}

        {activeTab === "Resumes" && (
          <div className="space-y-6">
            <h1 className="text-3xl font-semibold tracking-tight">My Resumes</h1>
            <ResumeManager
              resumes={activeResumes}
              onUpload={async (file, name, isDefault) => {
                try {
                  await uploadResumeMutation.mutateAsync({ file, name, isDefault });
                  toast({
                    title: "Resume Uploaded",
                    description: `"${name}" has been uploaded successfully`,
                  });
                } catch (error) {
                  // Error handling is done in the mutation
                }
              }}
              onDelete={async (id) => {
                try {
                  await deleteResumeMutation.mutateAsync(id);
                  toast({
                    title: "Resume Deleted Successfully",
                    description: "The resume has been permanently deleted",
                  });
                } catch (error) {
                  // Error handling is done in the mutation
                }
              }}
              onSetDefault={async (id) => {
                try {
                  await setDefaultResumeMutation.mutateAsync(id);
                  toast({
                    title: "Default Resume Updated",
                    description: "Your default resume has been changed",
                  });
                } catch (error) {
                  // Error handling is done in the mutation
                }
              }}
              onView={handleViewResume}
              isUploading={uploadResumeMutation.isPending}
            />
          </div>
        )}

        {activeTab === "External Opportunities" && (
          <div className="space-y-6">
            <ExtendedOpportunities />
          </div>
        )}

        <Dialog open={!!viewStudentDriveId} onOpenChange={(open) => !open && setViewStudentDriveId(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Drive Details</DialogTitle>
            </DialogHeader>
            {!selectedStudentViewDrive ? (
              <div className="text-sm text-muted-foreground">Drive not found.</div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="text-lg font-semibold">
                    {selectedStudentViewDrive.companyName} — {selectedStudentViewDrive.jobRole}
                  </div>
                  <div className="text-sm text-muted-foreground">Status: {selectedStudentViewDrive.status}</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-muted-foreground">CTC</div>
                    <div>
                      {selectedStudentViewDrive.ctcMin} – {selectedStudentViewDrive.ctcMax} LPA
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Min CGPA</div>
                    <div>{selectedStudentViewDrive.minCgpa}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Max Backlogs</div>
                    <div>{selectedStudentViewDrive.maxBacklogs}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Deadline</div>
                    <div>{new Date(selectedStudentViewDrive.registrationDeadline).toLocaleString()}</div>
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-muted-foreground">Allowed Branches</div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {(selectedStudentViewDrive.allowedBranches || []).map((b: string) => (
                        <Badge key={b} variant="secondary">
                          {b}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-muted-foreground">Job Description</div>
                    <div className="whitespace-pre-wrap mt-1">{selectedStudentViewDrive.jobDescription}</div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setViewStudentDriveId(null)}>
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      setViewStudentDriveId(null);
                      setActiveTab("Drives");
                    }}
                  >
                    Browse drives
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Resume Viewer Dialog */}
        <Dialog open={!!viewingResume} onOpenChange={(open) => !open && setViewingResume(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>{viewingResume?.name}</DialogTitle>
            </DialogHeader>
            <div className="w-full h-[70vh] border rounded-lg overflow-hidden">
              {viewingResume && (
                <iframe
                  src={`data:application/pdf;base64,${viewingResume.content}`}
                  className="w-full h-full"
                  title={viewingResume.name}
                />
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setViewingResume(null)}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  if (viewingResume) {
                    const link = document.createElement('a');
                    link.href = `data:application/pdf;base64,${viewingResume.content}`;
                    link.download = `${viewingResume.name}.pdf`;
                    link.click();
                  }
                }}
              >
                Download
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </main>
    </div>
  );
}

function LandingPage({ onSelectRole }: { onSelectRole: (role: "coordinator" | "student" | "auth") => void }) {
  return (
    <div className="landing-page">
      <nav id="navbar">
        <a
          href="#top"
          className="nav-brand"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <div className="nav-logo-box">M</div>
          <div className="nav-institute">
            <span className="nav-title">UniPlacement</span>
            <span className="nav-sub">MITS Gwalior · T&amp;P Cell</span>
          </div>
        </a>
        <div className="nav-links">
          <a href="#portals">Portals</a>
          <a href="#how">How it works</a>
          <a href="https://web.mitsgwalior.in" target="_blank" rel="noreferrer">
            MITS Website ↗
          </a>
        </div>
        <div className="nav-actions">
          <button
            className="btn-nav-ghost"
            type="button"
            onClick={() => onSelectRole("auth")}
          >
            Sign In
          </button>
          <button
            className="btn-nav-gold"
            type="button"
            onClick={() => onSelectRole("auth")}
          >
            Get Started
          </button>
        </div>
      </nav>

      <main id="top">
        {/* HERO */}
        <section className="hero">
          <div className="hero-grid-bg" />
          <div className="hero-glow" />
          <div className="hero-glow-2" />

          <div className="mits-badge">
            <div className="mits-badge-dot" />
            Madhav Institute of Technology &amp; Science, Gwalior — NAAC A++
          </div>

          <h1 className="hero-headline">
            Campus placements,
            <br />
            <em>reimagined</em> for <span>MITS.</span>
          </h1>
          <p className="hero-sub">
            The dedicated T&amp;P management platform for MITS Gwalior — built for
            coordinators who manage drives and students who deserve every opportunity.
          </p>

          <div className="hero-actions">
            <button
              className="btn-hero-primary"
              type="button"
              onClick={() => onSelectRole("auth")}
            >
              Coordinator Login
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
            <button
              className="btn-hero-outline"
              type="button"
              onClick={() => onSelectRole("auth")}
            >
              Student Login →
            </button>
          </div>

          <p className="hero-note">
            For all MITS students · Managed by the T&amp;P Cell
          </p>

          <div className="stats-bar">
            <div className="stat-cell">
              <span className="stat-n">94</span>
              <span className="stat-n">%</span>
              <div className="stat-l">placement rate</div>
            </div>
            <div className="stat-cell">
              <span className="stat-n">500</span>
              <span className="stat-n">+</span>
              <div className="stat-l">companies visit</div>
            </div>
            <div className="stat-cell">
              <span className="stat-n">12 LPA+</span>
              <div className="stat-l">highest package</div>
            </div>
            <div className="stat-cell">
              <span className="stat-n">A++</span>
              <div className="stat-l">NAAC grade</div>
            </div>
          </div>
        </section>

        {/* WAVE */}
        <div className="wave-divider">
          <svg
            viewBox="0 0 1440 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0,40 C360,0 1080,80 1440,20 L1440,60 L0,60 Z"
              fill="#FAFAF7"
            />
          </svg>
        </div>

        {/* MARQUEE */}
        <div className="marquee-section">
          <div className="marquee-label">
            Companies that recruit from MITS Gwalior
          </div>
          <div className="marquee-wrap">
            <div className="marquee-track">
              {[
                "TCS",
                "Infosys",
                "Wipro",
                "HCL Technologies",
                "Cognizant",
                "Capgemini",
                "Tech Mahindra",
                "IBM India",
                "Accenture",
                "L&T Infotech",
                "Mphasis",
                "Mindtree",
                "NIIT Technologies",
                "Persistent Systems",
                // Duplicate set for seamless infinite loop.
                "TCS",
                "Infosys",
                "Wipro",
                "HCL Technologies",
                "Cognizant",
                "Capgemini",
                "Tech Mahindra",
                "IBM India",
                "Accenture",
                "L&T Infotech",
                "Mphasis",
                "Mindtree",
                "NIIT Technologies",
                "Persistent Systems",
              ].map((company, index) => (
                <div key={`${company}-${index}`} className="marquee-item">
                  {company}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PORTALS */}
        <section className="portals-section" id="portals">
          <div className="portals-inner">
            <div className="portals-header">
              <div className="section-eyebrow">Two Portals. One Platform.</div>
              <h2 className="section-title">
                Choose your <em>portal</em>
              </h2>
              <p className="section-sub">
                Each portal is purpose-built for your role in the placement
                ecosystem.
              </p>
            </div>
            <div className="portal-grid">
              <div className="portal-card coord">
                <div className="portal-icon">
                  <svg
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#C8941A"
                    strokeWidth="1.8"
                  >
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <path d="M8 21h8M12 17v4" />
                    <path d="M7 8h10M7 11h6" />
                  </svg>
                </div>
                <h3 className="portal-name">
                  Coordinator Dashboard
                </h3>
                <p className="portal-desc">
                  Full control over placement drives, student eligibility, company
                  coordination, and analytics — all in one place.
                </p>
                <ul className="portal-features">
                  <li>Create and manage placement drives with custom eligibility criteria</li>
                  <li>Track applications, shortlists, and offer letters</li>
                  <li>Monitor recruitment pipeline with real-time charts</li>
                  <li>AI-powered shortlisting and resume analysis</li>
                  <li>Export reports for management and NAAC</li>
                </ul>
                <button
                  className="portal-cta"
                  type="button"
                  onClick={() => onSelectRole("auth")}
                >
                  Enter Coordinator Portal
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />  
                  </svg>
                </button>
              </div>

              <div className="portal-card student">
                <div className="portal-icon">
                  <svg
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#E86C2C"
                    strokeWidth="1.8"
                  >
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c3.5 2 8.5 2 12 0v-5" />
                  </svg>
                </div>
                <h3 className="portal-name">
                  Student Dashboard
                </h3>
                <p className="portal-desc">
                  Browse drives you&apos;re eligible for, upload and optimize your
                  resume with AI, track applications, and find external opportunities.
                </p>
                <ul className="portal-features">
                  <li>See only drives matching your branch, CGPA, and year</li>
                  <li>Upload multiple resumes — AI scores and suggests improvements</li>
                  <li>Real-time application status and interview schedule</li>
                  <li>Match score for each drive with AI explanation</li>
                  <li>External job board with curated opportunities</li>
                </ul>
                <button
                  className="portal-cta"
                  type="button"
                  onClick={() => onSelectRole("auth")}
                >
                  Enter Student Portal
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="how-section" id="how">
          <div className="how-inner">
            <div style={{ textAlign: "center", marginBottom: "0.5rem" }}>
              <div className="section-eyebrow">Process</div>
              <h2 className="section-title">
                How it works for <em>everyone</em>
              </h2>
            </div>
            <div className="how-flow">
              <div>
                <div className="how-coord-label how-side-label">
                 <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#C8941A"
                    strokeWidth="1.8"
                   >
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <path d="M8 21h8M12 17v4" />
                    <path d="M7 8h10M7 11h6" />
                  </svg>
                  T&amp;P Coordinator Flow
                </div>
                <div className="how-step">
                  <div className="how-step-num coord-num">1</div>
                  <div>
                    <div className="how-step-title">Create a Drive</div>
                    <div className="how-step-desc">
                      Set company, role, CTC, date, eligibility rules (CGPA, branch,
                      year, backlogs). Takes under 5 minutes.
                    </div>
                  </div>
                </div>
                <div className="how-step">
                  <div className="how-step-num coord-num">2</div>
                  <div>
                    <div className="how-step-title">Students Auto-notified</div>
                    <div className="how-step-desc">
                      Eligible students instantly receive notification. Ineligible
                      students see the drive as locked.
                    </div>
                  </div>
                </div>
                <div className="how-step">
                  <div className="how-step-num coord-num">3</div>
                  <div>
                    <div className="how-step-title">AI Shortlists Candidates</div>
                    <div className="how-step-desc">
                      AI ranks applicants by fit, highlights standouts, and flags gaps.
                      You review and approve.
                    </div>
                  </div>
                </div>
                <div className="how-step">
                  <div className="how-step-num coord-num">4</div>
                  <div>
                    <div className="how-step-title">Track, Report &amp; Close</div>
                    <div className="how-step-desc">
                      Live pipeline view. Digital offer letters. One-click NAAC-ready
                      reports exportable as PDF or Excel.
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div className="how-student-label how-side-label">
                 <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#E86C2C"
                    strokeWidth="1.8"
                   >
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c3.5 2 8.5 2 12 0v-5" />
                 </svg>
                  Student Flow
                </div>
                <div className="how-step">
                  <div className="how-step-num student-num">1</div>
                  <div>
                    <div className="how-step-title">Set Up Profile Once</div>
                    <div className="how-step-desc">
                      Enter branch, CGPA, skills, and upload your resume. AI enriches
                      your profile and gives you an instant score.
                    </div>
                  </div>
                </div>
                <div className="how-step">
                  <div className="how-step-num student-num">2</div>
                  <div>
                    <div className="how-step-title">See Your Drives</div>
                    <div className="how-step-desc">
                      Only eligible drives appear, filtered automatically. No
                      scrolling through irrelevant postings. No missed deadlines.
                    </div>
                  </div>
                </div>
                <div className="how-step">
                  <div className="how-step-num student-num">3</div>
                  <div>
                    <div className="how-step-title">Apply with AI Edge</div>
                    <div className="how-step-desc">
                      View your AI match score before applying. See exactly why you
                      rank high or what to improve to rank higher.
                    </div>
                  </div>
                </div>
                <div className="how-step">
                  <div className="how-step-num student-num">4</div>
                  <div>
                    <div className="how-step-title">Track &amp; Get Placed</div>
                    <div className="how-step-desc">
                      Real-time status: Applied → Shortlisted → Interview → Offer.
                      Receive digital offer letter directly in the portal.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="stats-banner">
          <div className="stats-inner">
            <div className="sb-cell">
              <div className="sb-n">94%</div>
              <div className="sb-l">avg. placement rate</div>
              <div className="sb-d">Industry avg: 68%</div>
            </div>
            <div className="sb-cell">
              <div className="sb-n">500+</div>
              <div className="sb-l">companies recruiting</div>
              <div className="sb-d">↑ 47 vs last season</div>
            </div>
            <div className="sb-cell">
              <div className="sb-n">8.4L</div>
              <div className="sb-l">average package (₹)</div>
              <div className="sb-d">↑ ₹1.2L vs 2024</div>
            </div>
            <div className="sb-cell">
              <div className="sb-n">1200</div>
              <div className="sb-l">students on platform</div>
              <div className="sb-d">All 4 years active</div>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="testi-section">
          <div className="testi-inner">
            <div style={{ textAlign: "center" }}>
              <div className="section-eyebrow">From the Platform</div>
              <h2 className="section-title">
                What MITS says about <em>UniPlacement</em>
              </h2>
            </div>
            <div className="testi-grid">
              <div className="testi-card">
                <div className="testi-mark">"</div>
                <p className="testi-q">
                  Running 40+ drives simultaneously used to mean daily chaos. Now
                  everything is tracked in one dashboard — I can actually sleep
                  during placement season.
                </p>
                <div className="testi-result">
                  ⏱ Drive setup time cut from 3 hours to 25 minutes
                </div>
                <div className="testi-author">
                  <div className="testi-av">RS</div>
                  <div>
                    <div className="testi-name">Dr. R. Sharma</div>
                    <div className="testi-role">
                      T&amp;P Coordinator, MITS Gwalior
                    </div>
                  </div>
                </div>
              </div>
              <div className="testi-card">
                <p className="testi-q">
                  I used to apply to every drive I could find. Now I only see drives
                  I actually qualify for, and my AI match score tells me where I
                  stand before I even apply.
                </p>
                <div className="testi-result">
                  🎯 Applied to 4 drives, got 2 offers
                </div>
                <div className="testi-author">
                  <div className="testi-av">AK</div>
                  <div>
                    <div className="testi-name">Aditya Kumar</div>
                    <div className="testi-role">
                      CSE Final Year, MITS Gwalior
                    </div>
                  </div>
                </div>
              </div>
              <div className="testi-card">
                <p className="testi-q">
                  The resume AI flagged things my faculty never told me. I improved my
                  score from 62 to 89 in a week — and got shortlisted for TCS Digital
                  the same month.
                </p>
                <div className="testi-result">
                  📈 Resume score 62 → 89, shortlisted in 1 week
                </div>
                <div className="testi-author">
                  <div className="testi-av">PM</div>
                  <div>
                    <div className="testi-name">Priya Mishra</div>
                    <div className="testi-role">
                      ECE Final Year, MITS Gwalior
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="cta-section">
          <div className="cta-mits">
            MITS Gwalior · Training &amp; Placement Cell
          </div>
          <h2 className="cta-headline">
            Ready for your <em>best placement season</em> yet?
          </h2>
          <p className="cta-sub">
            Join every MITS student and coordinator on the platform built for you.
          </p>
          <div className="cta-actions">
            <button
              className="btn-cta-gold"
              type="button"
              onClick={() => onSelectRole("auth")}
            >
              Coordinator Login
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
            <button
              className="btn-cta-outline"
              type="button"
              onClick={() => onSelectRole("auth")}
            >
              Student Login →
            </button>
          </div>
          <p className="cta-note">
            For all MITS students · Questions? Contact the T&amp;P Cell at
            tp@mitsgwalior.in
          </p>
        </div>

        {/* FOOTER */}
        <footer>
          <div className="footer-top">
            <div>
              <div className="footer-brand-title">UniPlacement</div>
              <div className="footer-brand-sub">
                MITS Gwalior · T&amp;P Management System
              </div>
              <div className="footer-brand-desc">
                The official campus placement platform for Madhav Institute of
                Technology &amp; Science, Gwalior. NAAC A++ Deemed University.
              </div>
            </div>
            <div className="footer-col">
              <div className="footer-col-title">Platform</div>
              <a href="#portals">Coordinator Portal</a>
              <a href="#portals">Student Portal</a>
            </div>
            <div className="footer-col">
              <div className="footer-col-title">MITS</div>
              <a href="https://web.mitsgwalior.in" target="_blank" rel="noreferrer">
                MITS Website
              </a>
              <a
                href="https://web.mitsgwalior.in/index.php/recruitment"
                target="_blank"
                rel="noreferrer"
              >
                Recruitment Page
              </a>
              <a href="https://web.mitsgwalior.in/training-internship/about-training-internship" target="_blank" rel="noreferrer">T&amp;P Cell</a>
              <a href="https://web.mitsgwalior.in/training-internship/contact-person" target="_blank" rel="noreferrer">Contact Us</a>
            </div>
            <div className="footer-col">
              <div className="footer-col-title">Support</div>
              <a href="#top">Help &amp; FAQ</a>
              <a href="#top">Privacy Policy</a>
              <a href="#top">Terms of Use</a>
              <a href="mailto:tnp@mitsgwalior.in">tnp@mitsgwalior.in</a>
            </div>
          </div>
          <div className="footer-bottom">
            <div className="footer-copy">
              © 2026 UniPlacement · Madhav Institute of Technology &amp; Science,
              Gwalior
            </div>
            <a
              href="https://web.mitsgwalior.in"
              target="_blank"
              rel="noreferrer"
              className="footer-mits-link"
            >
              web.mitsgwalior.in ↗
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
}

function AppContent() {
  const [currentView, setCurrentView] = useState<"landing" | "auth" | "coordinator" | "student">("landing");
  const { toast } = useToast();

  const { data: authData, isLoading: authLoading } = useQuery<{ user: any } | null>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
  });

  useEffect(() => {
    if (authData?.user) {
      if (authData.user.role === "coordinator") {
        setCurrentView("coordinator");
      } else {
        setCurrentView("student");
      }
    }
  }, [authData]);

  const loginMutation = useMutation({
    mutationFn: async ({ email, password, role }: { email: string; password: string; role: "coordinator" | "student" }) => {
      const res = await apiRequest("POST", "/api/auth/login", { email, password, role });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Welcome back!", description: `Signed in as ${data.user.name}` });
      if (data.user.role === "coordinator") {
        setCurrentView("coordinator");
      } else {
        setCurrentView("student");
      }
    },
    onError: (error: Error) => {
      toast({ title: "Login failed", description: error.message.replace(/^\d+:\s*/, ""), variant: "destructive" });
    },
  });

  const coordinatorRegisterMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; name: string; universityName: string }) => {
      const res = await apiRequest("POST", "/api/auth/register/coordinator", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Account created!", description: "Welcome to the T&P Portal" });
      setCurrentView("coordinator");
    },
    onError: (error: Error) => {
      toast({ title: "Registration failed", description: error.message.replace(/^\d+:\s*/, ""), variant: "destructive" });
    },
  });

  const studentRegisterMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; name: string; rollNumber: string; branch: string; graduationYear: number; cgpa: number; activeBacklogs: number; inviteCode: string }) => {
      const res = await apiRequest("POST", "/api/auth/register/student", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Account created!", description: "Welcome to the T&P Portal" });
      setCurrentView("student");
    },
    onError: (error: Error) => {
      toast({ title: "Registration failed", description: error.message.replace(/^\d+:\s*/, ""), variant: "destructive" });
    },
  });

  const handleLogin = (email: string, password: string, role: "coordinator" | "student") => {
    loginMutation.mutate({ email, password, role });
  };

  const handleCoordinatorRegister = (data: { email: string; password: string; name: string; universityName: string }) => {
    coordinatorRegisterMutation.mutate(data);
  };

  const handleStudentRegister = (data: { email: string; password: string; name: string; rollNumber: string; branch: string; graduationYear: number; cgpa: number; activeBacklogs: number; inviteCode: string }) => {
    studentRegisterMutation.mutate(data);
  };

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout", {});
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setCurrentView("landing");
      toast({ title: "Signed out", description: "You have been logged out" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to logout", variant: "destructive" });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const isAuthPending = loginMutation.isPending || coordinatorRegisterMutation.isPending || studentRegisterMutation.isPending;

  return (
    <>
      <Toaster />
      {currentView === "landing" && (
        <LandingPage
          onSelectRole={(role) => {
            if (role === "auth") {
              setCurrentView("auth");
            } else {
              setCurrentView(role);
            }
          }}
        />
      )}
      {currentView === "auth" && (
        <AuthPage
          onBack={() => setCurrentView("landing")}
          onLogin={handleLogin}
          onCoordinatorRegister={handleCoordinatorRegister}
          onStudentRegister={handleStudentRegister}
          isLoading={isAuthPending}
        />
      )}
      {currentView === "coordinator" && authData?.user && <CoordinatorDashboard onLogout={handleLogout} user={authData.user} />}
      {currentView === "student" && <StudentDashboard onLogout={handleLogout} user={authData?.user} />}
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
