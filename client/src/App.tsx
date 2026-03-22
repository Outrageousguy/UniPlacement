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
import AIAnalysis from "@/components/AIAnalysis";
import ApplicationsTable from "@/components/ApplicationsTable";
import DriveManagement from "@/components/DriveManagement";
import Community from "@/components/Community";
import { useWebSocket } from "@/hooks/use-websocket";
import {
  Building2,
  Users,
  TrendingUp,
  CheckCircle,
  Plus,
  GraduationCap,
  Target,
  Clock,
  Copy,
} from "lucide-react";

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
                <p className="text-muted-foreground">ABC University of Technology</p>
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
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [viewingResume, setViewingResume] = useState<{ id: number; name: string; content: string } | null>(null);
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

  // Community queries
  const { data: discussions = [] } = useQuery<any[]>({
    queryKey: ["/api/discussions"],
    enabled: !!user,
  });

  const { data: students = [] } = useQuery<any[]>({
    queryKey: ["/api/students"],
    enabled: !!user,
  });

  // Messages query - only fetch when a student is selected
  const { data: messages = [] } = useQuery<{
    id: number;
    senderId: number;
    receiverId: number;
    content: string;
    isRead: boolean;
    createdAt: string;
    isOwn: boolean;
  }[]>({
    queryKey: ["/api/messages", selectedStudent?.id],
    queryFn: async () => {
      if (!selectedStudent) return [];
      const response = await apiRequest("GET", `/api/messages/${selectedStudent.id}`);
      return response.json();
    },
    enabled: !!user && !!selectedStudent,
  });

  // WebSocket for real-time chat
  const {
    isConnected: wsConnected,
    onlineUsers,
    sendChatMessage,
    sendTyping
  } = useWebSocket({
    userId: user?.id,
    userType: 'student',
    onNewMessage: (message) => {
      // Add new message to current conversation if it's with the selected student
      if (selectedStudent && (message.senderId === selectedStudent.id || message.receiverId === selectedStudent.id)) {
        // Invalidate messages query to refetch
        queryClient.invalidateQueries({ queryKey: ["/api/messages", selectedStudent.id] });
      }
    },
    onOnlineStatusUpdate: (onlineUsers) => {
      // Update online status in students list
      // This will be handled by the Community component
    }
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

  // Delete discussion mutation
  const deleteDiscussionMutation = useMutation({
    mutationFn: async (discussionId: number) => {
      await apiRequest("DELETE", `/api/discussions/${discussionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/discussions"] });
      toast({
        title: "Discussion Deleted Successfully",
        description: "The discussion has been permanently deleted",
      });
    },
    onError: (error: Error) => {
      console.error("Delete discussion error:", error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete discussion. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Community mutations
  const createDiscussionMutation = useMutation({
    mutationFn: async ({ title, content, tags }: { title: string; content: string; tags: string[] }) => {
      const response = await apiRequest("POST", "/api/discussions", {
        title,
        content,
        tags,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/discussions"] });
    },
    onError: (error) => {
      console.error("Create discussion error:", error);
      toast({
        title: "Failed to Create Discussion",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const likeDiscussionMutation = useMutation({
    mutationFn: async (discussionId: number) => {
      const response = await apiRequest("POST", `/api/discussions/${discussionId}/like`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/discussions"] });
    },
    onError: (error) => {
      console.error("Like discussion error:", error);
      toast({
        title: "Failed to Like Discussion",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ receiverId, content }: { receiverId: number; content: string }) => {
      const response = await apiRequest("POST", "/api/messages", {
        receiverId,
        content,
      });
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Send via WebSocket for real-time delivery
      sendChatMessage(variables.receiverId, variables.content);

      // Invalidate messages query to ensure local state is updated
      queryClient.invalidateQueries({ queryKey: ["/api/messages", selectedStudent?.id] });
    },
    onError: (error) => {
      console.error("Send message error:", error);
      toast({
        title: "Failed to Send Message",
        description: "Please try again.",
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

  return (
    <div className="min-h-screen bg-background">
      <Header
        userName={currentStudent.name}
        userRole="student"
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={onLogout}
      />

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {activeTab === "Dashboard" && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">
                  Welcome, {currentStudent.name.split(" ")[0]}!
                </h1>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline">{currentStudent.rollNumber}</Badge>
                  <Badge variant="outline">{currentStudent.branch}</Badge>
                </div>
              </div>
              <Card className="p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">CGPA</p>
                    <p className="font-semibold text-lg">{currentStudent.cgpa}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Backlogs</p>
                    <p className="font-semibold text-lg">{currentStudent.activeBacklogs}</p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatsCard
                title="Eligible Drives"
                value={eligibleDrives.length}
                subtitle="Based on your profile"
                icon={Target}
                variant="primary"
              />
              <StatsCard
                title="My Applications"
                value={activeApplications.length}
                subtitle="Active applications"
                icon={Building2}
                variant="secondary"
              />
              <StatsCard
                title="Upcoming Deadlines"
                value={eligibleDrives.filter((d) => {
                  const days = Math.ceil(
                    (new Date(d.registrationDeadline).getTime() - Date.now()) /
                      (1000 * 60 * 60 * 24)
                  );
                  return days <= 7;
                }).length}
                subtitle="Within 7 days"
                icon={Clock}
                variant="accent"
              />
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Eligible Drives ({eligibleDrives.length})
              </h2>
              {eligibleDrives.length === 0 ? (
                <Card className="p-8 text-center">
                  <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="font-medium">No eligible drives available</p>
                  <p className="text-sm text-muted-foreground">
                    Check back later for new opportunities
                  </p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {eligibleDrives.map((drive) => (
                    <DriveCard
                      key={drive.id}
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
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">My Recent Applications</h2>
              <ApplicationsTable
                applications={activeApplications.slice(0, 3)}
                onWithdraw={async (id) => {
                try {
                  await withdrawApplicationMutation.mutateAsync(id);
                  toast({
                    title: "Application Withdrawn",
                    description: "Your application has been withdrawn",
                  });
                } catch (error) {
                  // Error handling is done in the mutation
                }
              }}
                onViewDrive={(id) => console.log("View drive:", id)}
                onAnalyze={(id) => console.log("Analyze:", id)}
              />
            </div>
          </div>
        )}

        {activeTab === "Drives" && (
          <div className="space-y-6">
            <h1 className="text-3xl font-semibold tracking-tight">Browse Drives</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {activeDrives
                .filter((d: any) => d.status === "Active")
                .map((drive: any) => {
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
            </div>
          </div>
        )}

        {activeTab === "My Applications" && (
          <div className="space-y-6">
            <h1 className="text-3xl font-semibold tracking-tight">My Applications</h1>
            <ApplicationsTable
              applications={activeApplications}
              onWithdraw={async (id) => {
                try {
                  await withdrawApplicationMutation.mutateAsync(id);
                  toast({
                    title: "Application Withdrawn",
                    description: "Your application has been withdrawn",
                  });
                } catch (error) {
                  // Error handling is done in the mutation
                }
              }}
              onViewDrive={(id) => console.log("View drive:", id)}
              onAnalyze={(id) => console.log("Analyze:", id)}
            />
          </div>
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

        {activeTab === "Community" && (
          <div className="space-y-6">
            <h1 className="text-3xl font-semibold tracking-tight">Community</h1>
            <Community
              discussions={discussions}
              students={students}
              messages={messages}
              onlineUsers={onlineUsers}
              user={user}
              onCreateDiscussion={async (title, content, tags) => {
                try {
                  await createDiscussionMutation.mutateAsync({ title, content, tags });
                  toast({
                    title: "Discussion Posted Successfully",
                    description: "Your discussion is now visible to everyone",
                  });
                } catch (error) {
                  // Error handling is done in the mutation
                }
              }}
              onSendMessage={async (studentId, message) => {
                try {
                  await sendMessageMutation.mutateAsync({ receiverId: studentId, content: message });
                  // Toast is handled in WebSocket message handler
                } catch (error) {
                  // Error handling is done in the mutation
                }
              }}
              onLikeDiscussion={async (discussionId) => {
                try {
                  await likeDiscussionMutation.mutateAsync(discussionId);
                  // Toast is handled in mutation
                } catch (error) {
                  // Error handling is done in the mutation
                }
              }}
              onDeleteDiscussion={async (discussionId) => {
                try {
                  await deleteDiscussionMutation.mutateAsync(discussionId);
                  // Toast is handled in mutation
                } catch (error) {
                  // Error handling is done in the mutation
                }
              }}
              onSelectStudent={setSelectedStudent}
              selectedStudent={selectedStudent}
            />
          </div>
        )}

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
      </main>
    </div>
  );
}

function LandingPage({ onSelectRole }: { onSelectRole: (role: "coordinator" | "student" | "auth") => void }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            className="flex items-center gap-2.5 px-2"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            data-testid="button-logo-landing"
          >
            <GraduationCap className="w-7 h-7 text-foreground" />
            <span className="font-semibold text-lg">UniPlacement</span>
          </Button>
          <Button variant="ghost" onClick={() => onSelectRole("auth")} data-testid="button-login-header">
            Sign In
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6">
        <div className="text-center py-24 md:py-32">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight mb-6 leading-[1.1]">
            Campus placements,
            <br />
            <span className="text-muted-foreground">simplified.</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            The modern platform for university placement cells. AI-powered matching, seamless tracking, and beautiful insights.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="h-12 px-8 text-base" onClick={() => onSelectRole("auth")} data-testid="button-get-started">
              Get Started
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base" onClick={() => onSelectRole("student")} data-testid="button-demo-student">
              Try Demo
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-24">
          <Card className="p-8 border-0 bg-muted/50 hover-elevate transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-foreground/5 flex items-center justify-center mb-6">
              <Building2 className="w-6 h-6 text-foreground" />
            </div>
            <h3 className="font-semibold text-xl mb-3">Drive Management</h3>
            <p className="text-muted-foreground leading-relaxed">
              Post drives, set eligibility criteria, and track registrations in real-time with an intuitive dashboard.
            </p>
          </Card>
          <Card className="p-8 border-0 bg-muted/50 hover-elevate transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-foreground/5 flex items-center justify-center mb-6">
              <Target className="w-6 h-6 text-foreground" />
            </div>
            <h3 className="font-semibold text-xl mb-3">Smart Matching</h3>
            <p className="text-muted-foreground leading-relaxed">
              Students see only eligible opportunities. No confusion, no missed chances, just clarity.
            </p>
          </Card>
          <Card className="p-8 border-0 bg-muted/50 hover-elevate transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-foreground/5 flex items-center justify-center mb-6">
              <TrendingUp className="w-6 h-6 text-foreground" />
            </div>
            <h3 className="font-semibold text-xl mb-3">AI Insights</h3>
            <p className="text-muted-foreground leading-relaxed">
              Get intelligent resume analysis and personalized suggestions to improve placement success.
            </p>
          </Card>
        </div>

        <div className="text-center pb-16">
          <p className="text-sm text-muted-foreground">
            Trusted by universities worldwide
          </p>
        </div>
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
        <div className="relative">
          <Button
            variant="ghost"
            className="absolute top-4 left-4 z-10 flex items-center gap-2 px-2"
            onClick={() => setCurrentView("landing")}
            data-testid="button-logo-auth"
          >
            <GraduationCap className="w-5 h-5" />
            <span className="font-semibold">UniPlacement</span>
          </Button>
          <AuthPage
            onLogin={handleLogin}
            onCoordinatorRegister={handleCoordinatorRegister}
            onStudentRegister={handleStudentRegister}
            isLoading={isAuthPending}
          />
        </div>
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
