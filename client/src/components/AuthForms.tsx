import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Eye, EyeOff, ChevronLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import "@/styles/auth.css";

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

function BrandShieldIcon() {
  return (
    <svg width={28} height={28} viewBox="0 0 32 32" fill="none" aria-hidden>
      <path
        d="M16 4L28 10V18C28 23.5 22.6 28.4 16 30C9.4 28.4 4 23.5 4 18V10L16 4Z"
        stroke="#E8B84B"
        strokeWidth={1.5}
        fill="none"
      />
      <path
        d="M11 16L14.5 19.5L21 13"
        stroke="#E8B84B"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UserIconRing() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 12C14.21 12 16 10.21 16 8S14.21 4 12 4 8 5.79 8 8 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"
        fill="#E8B84B"
      />
    </svg>
  );
}

function CoordinatorRegistrationIcon() {
  return (
    <svg width={26} height={26} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" stroke="#E86C2C" strokeWidth={1.8} />
      <path d="M6 12v5c3.5 2 8.5 2 12 0v-5" stroke="#E86C2C" strokeWidth={1.8} />
    </svg>
  );
}

function StudentRegistrationIcon() {
  return (
    <svg width={26} height={26} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" stroke="#E86C2C" strokeWidth={1.8} />
      <path d="M6 12v5c3.5 2 8.5 2 12 0v-5" stroke="#E86C2C" strokeWidth={1.8} />
    </svg>
  );
}

function AuthBrandPanel() {
  return (
    <div className="auth-left">
      <div className="auth-left-bg1" />
      <div className="auth-left-bg2" />
      <div className="auth-badge-l">MITS Gwalior · T&amp;P Portal</div>
      <div className="auth-brand-icon">
        <BrandShieldIcon />
      </div>
      <div className="auth-brand-name">UniPlacement</div>
      <div className="auth-brand-tag">Placement management made simple</div>
      <div className="auth-gold-line" />
      <div className="auth-stat-row">
        <div className="auth-stat">
          <div className="auth-stat-num">500+</div>
          <div className="auth-stat-lbl">Students</div>
        </div>
        <div className="auth-stat-sep" />
        <div className="auth-stat">
          <div className="auth-stat-num">120+</div>
          <div className="auth-stat-lbl">Companies</div>
        </div>
        <div className="auth-stat-sep" />
        <div className="auth-stat">
          <div className="auth-stat-num">95%</div>
          <div className="auth-stat-lbl">Placed</div>
        </div>
      </div>
      <div className="auth-left-foot">UniPlacement · MITS Gwalior</div>
    </div>
  );
}

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
    <div className="auth-card auth-card--signin">
      <div className="auth-icon-ring">
        <UserIconRing />
      </div>
      <div className="auth-card-title">Welcome Back</div>
      <div className="auth-card-sub">Sign in to your T&amp;P Portal account</div>
      <div className="auth-divider" />
      <form onSubmit={handleSubmit}>
        <div className="auth-fg">
          <Label htmlFor="login-email" className="auth-fl">
            Email
          </Label>
          <Input
            id="login-email"
            type="email"
            placeholder="you@university.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-fi"
            data-testid="input-login-email"
          />
        </div>
        <div className="auth-fg auth-pw-field">
          <Label htmlFor="login-password" className="auth-fl">
            Password
          </Label>
          <div className="auth-sw">
            <Input
              id="login-password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-fi"
              data-testid="input-login-password"
            />
            <button
              type="button"
              className="auth-pw-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
            </button>
          </div>
        </div>
        <div className="auth-fg">
          <Label htmlFor="login-role" className="auth-fl">
            I am a
          </Label>
          <div className="auth-sw">
            <Select value={role} onValueChange={(value: "coordinator" | "student") => setRole(value)}>
              <SelectTrigger id="login-role" className="auth-fs" data-testid="select-login-role">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="coordinator">Coordinator</SelectItem>
              </SelectContent>
            </Select>
            <span className="auth-sa">▼</span>
          </div>
        </div>
        <button type="submit" className="auth-btn" disabled={isLoading} data-testid="button-login">
          {isLoading ? (
            <>
              <Loader2 className="inline h-4 w-4 animate-spin align-middle mr-2" />
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </button>
      </form>
    </div>
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
    <div className="auth-card">
      <div className="auth-icon-ring">
        <CoordinatorRegistrationIcon />
      </div>
      <div className="auth-card-title">Coordinator Registration</div>
      <div className="auth-card-sub">Create a new university T&amp;P account</div>
      <div className="auth-divider" />
      <form onSubmit={handleSubmit}>
        <div className="auth-form-row">
          <div>
            <Label htmlFor="coord-name" className="auth-fl">
              Full Name
            </Label>
            <Input
              id="coord-name"
              placeholder="Dr. John Smith"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="auth-fi"
              data-testid="input-coordinator-name"
            />
          </div>
          <div>
            <Label htmlFor="coord-email" className="auth-fl">
              Email
            </Label>
            <Input
              id="coord-email"
              type="email"
              placeholder="coordinator@university.edu"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="auth-fi"
              data-testid="input-coordinator-email"
            />
          </div>
        </div>
        <div className="auth-fg">
          <Label htmlFor="coord-university" className="auth-fl">
            University Name
          </Label>
          <Input
            id="coord-university"
            placeholder="Madhav Institute of Technology and Science, Gwalior"
            value={formData.universityName}
            onChange={(e) => setFormData({ ...formData, universityName: e.target.value })}
            className="auth-fi"
            data-testid="input-university-name"
          />
        </div>
        <div className="auth-form-row">
          <div className="auth-pw-field">
            <Label htmlFor="coord-password" className="auth-fl">
              Password
            </Label>
            <div className="auth-sw">
              <Input
                id="coord-password"
                type={showPassword ? "text" : "password"}
                placeholder="Min 8 characters"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="auth-fi"
                data-testid="input-coordinator-password"
              />
              <button
                type="button"
                className="auth-pw-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
              </button>
            </div>
          </div>
          <div>
            <Label htmlFor="coord-confirm-password" className="auth-fl">
              Confirm Password
            </Label>
            <Input
              id="coord-confirm-password"
              type="password"
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="auth-fi"
              data-testid="input-coordinator-confirm-password"
            />
          </div>
        </div>
        <button
          type="submit"
          className="auth-btn auth-btn--coord"
          disabled={isLoading}
          data-testid="button-register-coordinator"
        >
          {isLoading ? (
            <>
              <Loader2 className="inline h-4 w-4 animate-spin align-middle mr-2" />
              Creating Account...
            </>
          ) : (
            "Create Coordinator Account"
          )}
        </button>
      </form>
    </div>
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
    if (
      !formData.email ||
      !formData.password ||
      !formData.name ||
      !formData.rollNumber ||
      !formData.branch ||
      !formData.inviteCode
    ) {
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
    <div className="auth-card auth-card--student">
      <div className="auth-icon-ring">
        <StudentRegistrationIcon />
      </div>
      <div className="auth-card-title">Student Registration</div>
      <div className="auth-card-sub">Join your university&apos;s placement portal</div>
      <div className="auth-divider" />
      <form onSubmit={handleSubmit}>
        <div className="auth-sec-lbl">Personal Info</div>
        <div className="auth-form-row">
          <div>
            <Label htmlFor="student-name" className="auth-fl">
              Full Name
            </Label>
            <Input
              id="student-name"
              placeholder="Rahul Sharma"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="auth-fi"
              data-testid="input-student-name"
            />
          </div>
          <div>
            <Label htmlFor="student-email" className="auth-fl">
              Email
            </Label>
            <Input
              id="student-email"
              type="email"
              placeholder="rahul@university.edu"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="auth-fi"
              data-testid="input-student-email"
            />
          </div>
        </div>

        <div className="auth-sec-lbl">Academic Details</div>
        <div className="auth-form-row">
          <div>
            <Label htmlFor="student-roll" className="auth-fl">
              Roll Number
            </Label>
            <Input
              id="student-roll"
              placeholder="2021CSE001"
              value={formData.rollNumber}
              onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
              className="auth-fi"
              data-testid="input-student-roll"
            />
          </div>
          <div>
            <Label htmlFor="student-branch" className="auth-fl">
              Branch
            </Label>
            <div className="auth-sw">
              <Select
                value={formData.branch}
                onValueChange={(value) => setFormData({ ...formData, branch: value })}
              >
                <SelectTrigger id="student-branch" className="auth-fs" data-testid="select-student-branch">
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
              <span className="auth-sa">▼</span>
            </div>
          </div>
        </div>

        <div className="auth-three">
          <div>
            <Label htmlFor="student-year" className="auth-fl">
              Grad Year
            </Label>
            <div className="auth-sw">
              <Select
                value={formData.graduationYear.toString()}
                onValueChange={(value) =>
                  setFormData({ ...formData, graduationYear: parseInt(value, 10) })
                }
              >
                <SelectTrigger id="student-year" className="auth-fs" data-testid="select-graduation-year">
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
              <span className="auth-sa">▼</span>
            </div>
          </div>
          <div>
            <Label htmlFor="student-cgpa" className="auth-fl">
              CGPA
            </Label>
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
              className="auth-fi"
              data-testid="input-student-cgpa"
            />
          </div>
          <div>
            <Label htmlFor="student-backlogs" className="auth-fl">
              Backlogs
            </Label>
            <div className="auth-sw">
              <Select
                value={formData.activeBacklogs.toString()}
                onValueChange={(value) =>
                  setFormData({ ...formData, activeBacklogs: parseInt(value, 10) })
                }
              >
                <SelectTrigger id="student-backlogs" className="auth-fs" data-testid="select-active-backlogs">
                  <SelectValue placeholder="Select backlogs" />
                </SelectTrigger>
                <SelectContent>
                  {[0, 1, 2, 3, 4, 5].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="auth-sa">▼</span>
            </div>
          </div>
        </div>

        <div className="auth-sec-lbl">Account Setup</div>
        <div className="auth-fg">
          <Label htmlFor="student-invite" className="auth-fl">
            University Invite Code
          </Label>
          <Input
            id="student-invite"
            placeholder="Enter invite code from T&P cell"
            value={formData.inviteCode}
            onChange={(e) => setFormData({ ...formData, inviteCode: e.target.value })}
            className="auth-fi"
            data-testid="input-invite-code"
          />
        </div>

        <div className="auth-form-row">
          <div className="auth-pw-field">
            <Label htmlFor="student-password" className="auth-fl">
              Password
            </Label>
            <div className="auth-sw">
              <Input
                id="student-password"
                type={showPassword ? "text" : "password"}
                placeholder="Min 8 characters"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="auth-fi"
                data-testid="input-student-password"
              />
              <button
                type="button"
                className="auth-pw-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
              </button>
            </div>
          </div>
          <div>
            <Label htmlFor="student-confirm-password" className="auth-fl">
              Confirm Password
            </Label>
            <Input
              id="student-confirm-password"
              type="password"
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              className="auth-fi"
              data-testid="input-student-confirm-password"
            />
          </div>
        </div>

        <button type="submit" className="auth-btn" disabled={isLoading} data-testid="button-register-student">
          {isLoading ? (
            <>
              <Loader2 className="inline h-4 w-4 animate-spin align-middle mr-2" />
              Creating Account...
            </>
          ) : (
            "Create Student Account"
          )}
        </button>
      </form>
    </div>
  );
}

export function AuthPage({
  onLogin,
  onCoordinatorRegister,
  onStudentRegister,
  isLoading,
  onBack,
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
  onBack?: () => void;
}) {
  const [activeTab, setActiveTab] = useState("login");

  return (
    <div className="uni-auth">
      <div className="auth-backdrop" aria-hidden>
        <div className="auth-backdrop__bubble auth-backdrop__bubble--1" />
        <div className="auth-backdrop__bubble auth-backdrop__bubble--2" />
        <div className="auth-backdrop__bubble auth-backdrop__bubble--3" />
        <div className="auth-backdrop__bubble auth-backdrop__bubble--4" />
        <div className="auth-backdrop__bubble auth-backdrop__bubble--5" />
      </div>
      {onBack ? (
        <button
          type="button"
          className="auth-back"
          onClick={onBack}
          data-testid="button-back-to-landing"
        >
          <ChevronLeft className="auth-back-icon" aria-hidden />
          Back
        </button>
      ) : null}
      <div className="auth-shell">
        <AuthBrandPanel />
        <div className="auth-right">
          <div className="auth-right-inner">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="auth-tabs-root flex w-full flex-col items-stretch"
            >
              <TabsList className="auth-tabs">
                <TabsTrigger value="login" className="auth-tab" data-testid="tab-login">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="coordinator" className="auth-tab" data-testid="tab-coordinator">
                  Coordinator
                </TabsTrigger>
                <TabsTrigger value="student" className="auth-tab" data-testid="tab-student">
                  Student
                </TabsTrigger>
              </TabsList>
              <TabsContent value="login" className="auth-tab-panel w-full">
                <div className="auth-panel">
                  <LoginForm onLogin={onLogin} isLoading={isLoading} />
                </div>
              </TabsContent>
              <TabsContent value="coordinator" className="auth-tab-panel w-full">
                <div className="auth-panel">
                  <CoordinatorRegisterForm onRegister={onCoordinatorRegister} isLoading={isLoading} />
                </div>
              </TabsContent>
              <TabsContent value="student" className="auth-tab-panel w-full">
                <div className="auth-panel">
                  <StudentRegisterForm onRegister={onStudentRegister} isLoading={isLoading} />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
