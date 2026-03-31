import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, Loader2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LoginFormProps {
  onLogin: (email: string, password: string, role: "coordinator" | "student") => void;
  isLoading?: boolean;
}

interface CoordinatorRegisterFormProps {
  onRegister: (data: {
    email: string;
    password: string;
    name: string;
    universityName: string;
  }) => void;
  isLoading?: boolean;
}

interface StudentRegisterFormProps {
  onRegister: (data: {
    email: string;
    password: string;
    name: string;
    rollNumber: string;
    branch: string;
    graduationYear: number;
    cgpa: number;
    activeBacklogs: number;
    inviteCode: string;
  }) => void;
  isLoading?: boolean;
}

const branches = ["CSE", "IT", "ECE", "EEE", "Mechanical", "Civil", "Other"];
const currentYear = new Date().getFullYear();
const graduationYears = Array.from({ length: 6 }, (_, i) => currentYear + i);
const authFieldClass =
  "border-[rgba(180,140,60,0.25)] focus-visible:ring-[#C8941A] bg-[linear-gradient(135deg,rgba(232,242,255,0.95)_0%,rgba(244,248,255,0.95)_100%)]";
const authToggleClass =
  "absolute inset-y-0 right-0 h-auto px-3 text-[#7A6A50] hover:text-[#0F2044] hover:bg-transparent";

export function LoginForm({ onLogin, isLoading = false }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"coordinator" | "student">("student");
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    onLogin(email, password, role);
  };

  return (
    <Card className="w-full max-w-md mx-auto border-[rgba(200,148,26,0.25)] bg-white/95 backdrop-blur-sm shadow-[0_24px_60px_rgba(15,32,68,0.18)]">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 rounded-full bg-[rgba(200,148,26,0.14)] border border-[rgba(200,148,26,0.25)]">
            <GraduationCap className="w-8 h-8 text-[#C8941A]" />
          </div>
        </div>
        <CardTitle className="text-2xl text-[#0F2044]">Welcome Back</CardTitle>
        <CardDescription className="text-[#7A6A50]">
          Sign in to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="login-email" className="text-[#3D3020]">Email</Label>
            <Input
              id="login-email"
              type="email"
              placeholder="you@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={authFieldClass}
              data-testid="input-login-email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password" className="text-[#3D3020]">Password</Label>
            <div className="relative">
              <Input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={authFieldClass}
                data-testid="input-login-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={authToggleClass}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-[#3D3020]">Signing in as</Label>
            <Select value={role} onValueChange={(value: "coordinator" | "student") => setRole(value)}>
              <SelectTrigger className={authFieldClass} data-testid="select-login-role">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="coordinator">T&P Coordinator</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            type="submit"
            className="w-full bg-[#E8B84B] text-[#0F2044] hover:bg-[#C8941A]"
            disabled={isLoading}
            data-testid="button-login"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function CoordinatorRegisterForm({
  onRegister,
  isLoading = false,
}: CoordinatorRegisterFormProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    universityName: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.values(formData).some((v) => !v)) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }
    if (formData.password.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }
    const { confirmPassword, ...data } = formData;
    onRegister(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="coord-name" className="text-[#3D3020]">Full Name</Label>
        <Input
          id="coord-name"
          placeholder="Dr. John Snow"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={authFieldClass}
          data-testid="input-coordinator-name"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="coord-email" className="text-[#3D3020]">Email</Label>
        <Input
          id="coord-email"
          type="email"
          placeholder="coordinator@university.edu"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className={authFieldClass}
          data-testid="input-coordinator-email"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="coord-university" className="text-[#3D3020]">University Name</Label>
        <Input
          id="coord-university"
          placeholder="Madhav Institute of Technology and Science, Gwalior"
          value={formData.universityName}
          onChange={(e) =>
            setFormData({ ...formData, universityName: e.target.value })
          }
          className={authFieldClass}
          data-testid="input-university-name"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="coord-password" className="text-[#3D3020]">Password</Label>
        <div className="relative">
          <Input
            id="coord-password"
            type={showPassword ? "text" : "password"}
            placeholder="Minimum 8 characters"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            className={authFieldClass}
            data-testid="input-coordinator-password"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={authToggleClass}
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="coord-confirm-password" className="text-[#3D3020]">Confirm Password</Label>
        <Input
          id="coord-confirm-password"
          type="password"
          placeholder="Confirm your password"
          value={formData.confirmPassword}
          onChange={(e) =>
            setFormData({ ...formData, confirmPassword: e.target.value })
          }
          className={authFieldClass}
          data-testid="input-coordinator-confirm-password"
        />
      </div>
      <Button
        type="submit"
        className="w-full bg-[#E8B84B] text-[#0F2044] hover:bg-[#C8941A]"
        disabled={isLoading}
        data-testid="button-register-coordinator"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Creating Account...
          </>
        ) : (
          "Create Coordinator Account"
        )}
      </Button>
    </form>
  );
}

export function StudentRegisterForm({
  onRegister,
  isLoading = false,
}: StudentRegisterFormProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    rollNumber: "",
    branch: "",
    graduationYear: currentYear + 1,
    cgpa: 0,
    activeBacklogs: 0,
    inviteCode: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.name || !formData.rollNumber || !formData.branch || !formData.inviteCode) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }
    if (formData.cgpa < 0 || formData.cgpa > 10) {
      toast({
        title: "Error",
        description: "CGPA must be between 0 and 10",
        variant: "destructive",
      });
      return;
    }
    const { confirmPassword, ...data } = formData;
    onRegister(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="student-name" className="text-[#3D3020]">Full Name</Label>
          <Input
            id="student-name"
            placeholder="Rahul Sharma"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={authFieldClass}
            data-testid="input-student-name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="student-email" className="text-[#3D3020]">Email</Label>
          <Input
            id="student-email"
            type="email"
            placeholder="rahul@university.edu"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className={authFieldClass}
            data-testid="input-student-email"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="student-roll" className="text-[#3D3020]">Roll Number</Label>
          <Input
            id="student-roll"
            placeholder="2021CSE001"
            value={formData.rollNumber}
            onChange={(e) =>
              setFormData({ ...formData, rollNumber: e.target.value })
            }
            className={authFieldClass}
            data-testid="input-student-roll"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="student-branch" className="text-[#3D3020]">Branch</Label>
          <Select
            value={formData.branch}
            onValueChange={(value) =>
              setFormData({ ...formData, branch: value })
            }
          >
            <SelectTrigger className={authFieldClass} data-testid="select-student-branch">
              <SelectValue placeholder="Select branch" />
            </SelectTrigger>
            <SelectContent>
              {branches.map((branch) => (
                <SelectItem key={branch} value={branch}>
                  {branch}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="student-year" className="text-[#3D3020]">Graduation Year</Label>
          <Select
            value={formData.graduationYear.toString()}
            onValueChange={(value) =>
              setFormData({ ...formData, graduationYear: parseInt(value) })
            }
          >
            <SelectTrigger className={authFieldClass} data-testid="select-graduation-year">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {graduationYears.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="student-cgpa" className="text-[#3D3020]">CGPA</Label>
          <Input
            id="student-cgpa"
            type="number"
            step="0.01"
            min="0"
            max="10"
            placeholder="8.50"
            value={formData.cgpa || ""}
            onChange={(e) =>
              setFormData({ ...formData, cgpa: parseFloat(e.target.value) || 0 })
            }
            className={authFieldClass}
            data-testid="input-student-cgpa"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="student-backlogs" className="text-[#3D3020]">Active Backlogs</Label>
          <Select
            value={formData.activeBacklogs.toString()}
            onValueChange={(value) =>
              setFormData({ ...formData, activeBacklogs: parseInt(value) })
            }
          >
            <SelectTrigger className={authFieldClass} data-testid="select-active-backlogs">
              <SelectValue placeholder="Select backlogs">
                {formData.activeBacklogs}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {[0, 1, 2, 3, 4, 5].map((num) => (
                <SelectItem key={num} value={num.toString()}>
                  {num}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="student-invite" className="text-[#3D3020]">University Invite Code</Label>
        <Input
          id="student-invite"
          placeholder="Enter the invite code from your T&P cell"
          value={formData.inviteCode}
          onChange={(e) =>
            setFormData({ ...formData, inviteCode: e.target.value })
          }
          className={authFieldClass}
          data-testid="input-invite-code"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="student-password" className="text-[#3D3020]">Password</Label>
        <div className="relative">
          <Input
            id="student-password"
            type={showPassword ? "text" : "password"}
            placeholder="Minimum 8 characters"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            className={authFieldClass}
            data-testid="input-student-password"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={authToggleClass}
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="student-confirm-password" className="text-[#3D3020]">Confirm Password</Label>
        <Input
          id="student-confirm-password"
          type="password"
          placeholder="Confirm your password"
          value={formData.confirmPassword}
          onChange={(e) =>
            setFormData({ ...formData, confirmPassword: e.target.value })
          }
          className={authFieldClass}
          data-testid="input-student-confirm-password"
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-[#E8B84B] text-[#0F2044] hover:bg-[#C8941A]"
        disabled={isLoading}
        data-testid="button-register-student"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Creating Account...
          </>
        ) : (
          "Create Student Account"
        )}
      </Button>
    </form>
  );
}

export function AuthPage({
  onLogin,
  onCoordinatorRegister,
  onStudentRegister,
  isLoading,
}: {
  onLogin: (email: string, password: string, role: "coordinator" | "student") => void;
  onCoordinatorRegister: (data: {
    email: string;
    password: string;
    name: string;
    universityName: string;
  }) => void;
  onStudentRegister: (data: {
    email: string;
    password: string;
    name: string;
    rollNumber: string;
    branch: string;
    graduationYear: number;
    cgpa: number;
    activeBacklogs: number;
    inviteCode: string;
  }) => void;
  isLoading?: boolean;
}) {
  const [activeTab, setActiveTab] = useState("login");

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0F2044] relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(200,148,26,0.18),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(232,108,44,0.14),transparent_45%)] pointer-events-none" />
      <div className="w-full max-w-4xl relative z-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(200,148,26,0.35)] bg-[rgba(200,148,26,0.12)] px-4 py-1.5 text-xs text-[#E8B84B]">
            MITS Gwalior · T&amp;P Portal
          </div>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/10 border border-[rgba(200,148,26,0.25)] h-12 rounded-2xl p-1">
            <TabsTrigger value="login" className="rounded-xl text-white/80 data-[state=active]:bg-[#E8B84B] data-[state=active]:text-[#0F2044]" data-testid="tab-login">
              Sign In
            </TabsTrigger>
            <TabsTrigger value="coordinator" className="rounded-xl text-white/80 data-[state=active]:bg-[#E8B84B] data-[state=active]:text-[#0F2044]" data-testid="tab-coordinator">
              Coordinator
            </TabsTrigger>
            <TabsTrigger value="student" className="rounded-xl text-white/80 data-[state=active]:bg-[#E8B84B] data-[state=active]:text-[#0F2044]" data-testid="tab-student">
              Student
            </TabsTrigger>
          </TabsList>
          <TabsContent value="login" className="mt-6">
            <LoginForm onLogin={onLogin} isLoading={isLoading} />
          </TabsContent>
          <TabsContent value="coordinator" className="mt-6">
            <Card className="border-[rgba(200,148,26,0.25)] bg-white/95 backdrop-blur-sm shadow-[0_24px_60px_rgba(15,32,68,0.18)]">
              <CardHeader className="text-center">
                <CardTitle className="text-xl text-[#0F2044]">Coordinator Registration</CardTitle>
                <CardDescription>
                  Create a new T&P Coordinator account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CoordinatorRegisterForm onRegister={onCoordinatorRegister} isLoading={isLoading} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="student" className="mt-6">
            <Card className="border-[rgba(200,148,26,0.25)] bg-white/95 backdrop-blur-sm shadow-[0_24px_60px_rgba(15,32,68,0.18)]">
              <CardHeader className="text-center">
                <CardTitle className="text-xl text-[#0F2044]">Student Registration</CardTitle>
                <CardDescription>
                  Join the T&P portal of MITS Gwalior
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StudentRegisterForm onRegister={onStudentRegister} isLoading={isLoading} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
