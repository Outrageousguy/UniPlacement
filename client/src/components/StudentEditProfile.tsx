import {
  useCallback,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useRef,
  useState,
} from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import "@/styles/edit-profile.css";

export type StudentEditProfileProps = {
  user: {
    name: string;
    email: string;
    rollNumber?: string;
    branch?: string;
    graduationYear?: number;
    universityName?: string;
  };
  eligibleDriveCount: number;
};

type ProfileTab = "a" | "b" | "c" | "d";

type StudentProfileResponse = {
  id: number;
  email: string;
  name: string;
  rollNumber: string;
  branch: string;
  graduationYear: number;
  cgpa: string;
  activeBacklogs: number;
  placementStatus: string;
  firstName: string;
  lastName: string;
  profileCompletion: number;
  personalEmail: string | null;
  phone: string | null;
  whatsapp: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  professionalSummary: string | null;
  homeCity: string | null;
  willingToRelocate: string | null;
  preferredWorkCities: string | null;
  tenthPercentage: string | null;
  twelfthPercentage: string | null;
  graduationGapYears: string | null;
  placementCategory: string | null;
  certificationsText: string | null;
  achievementsText: string | null;
  skillsProgramming: string[];
  skillsFrameworks: string[];
  skillsTools: string[];
  preferredRoleType: string | null;
  expectedCtcRange: string | null;
  preferredWorkMode: string | null;
  openToInternship: string | null;
  preferredIndustries: string | null;
  notifyNewDrives: boolean;
  notifyApplicationStatus: boolean;
  notifyDeadlines: boolean;
  notifyInterviewTips: boolean;
  notifyTpAnnouncements: boolean;
  visibleToRecruiters: boolean;
  showCgpaOnProfile: boolean;
  showContactToCompanies: boolean;
};

type FormState = {
  firstName: string;
  lastName: string;
  personalEmail: string;
  phone: string;
  whatsapp: string;
  linkedinUrl: string;
  portfolioUrl: string;
  professionalSummary: string;
  homeCity: string;
  willingToRelocate: string;
  preferredWorkCities: string;
  activeBacklogsBand: 0 | 1 | 2;
  tenthPercentage: string;
  twelfthPercentage: string;
  graduationGapYears: string;
  placementCategory: string;
  certificationsText: string;
  achievementsText: string;
  skillsProgramming: string[];
  skillsFrameworks: string[];
  skillsTools: string[];
  preferredRoleType: string;
  expectedCtcRange: string;
  preferredWorkMode: string;
  openToInternship: string;
  preferredIndustries: string;
  notifyNewDrives: boolean;
  notifyApplicationStatus: boolean;
  notifyDeadlines: boolean;
  notifyInterviewTips: boolean;
  notifyTpAnnouncements: boolean;
  visibleToRecruiters: boolean;
  showCgpaOnProfile: boolean;
  showContactToCompanies: boolean;
};

function profileToForm(p: StudentProfileResponse): FormState {
  const band: 0 | 1 | 2 =
    p.activeBacklogs >= 2 ? 2 : ((p.activeBacklogs as 0 | 1) ?? 0);
  return {
    firstName: p.firstName ?? "",
    lastName: p.lastName ?? "",
    personalEmail: p.personalEmail ?? "",
    phone: p.phone ?? "",
    whatsapp: p.whatsapp ?? "",
    linkedinUrl: p.linkedinUrl ?? "",
    portfolioUrl: p.portfolioUrl ?? "",
    professionalSummary: p.professionalSummary ?? "",
    homeCity: p.homeCity ?? "",
    willingToRelocate: p.willingToRelocate ?? "Yes, anywhere",
    preferredWorkCities: p.preferredWorkCities ?? "",
    activeBacklogsBand: band,
    tenthPercentage:
      p.tenthPercentage != null ? String(p.tenthPercentage) : "",
    twelfthPercentage:
      p.twelfthPercentage != null ? String(p.twelfthPercentage) : "",
    graduationGapYears: p.graduationGapYears ?? "None",
    placementCategory: p.placementCategory ?? "General",
    certificationsText: p.certificationsText ?? "",
    achievementsText: p.achievementsText ?? "",
    skillsProgramming: [...(p.skillsProgramming ?? [])],
    skillsFrameworks: [...(p.skillsFrameworks ?? [])],
    skillsTools: [...(p.skillsTools ?? [])],
    preferredRoleType: p.preferredRoleType ?? "Software Development",
    expectedCtcRange: p.expectedCtcRange ?? "4 – 8 LPA",
    preferredWorkMode: p.preferredWorkMode ?? "In-office",
    openToInternship: p.openToInternship ?? "Yes, PPO-eligible ones",
    preferredIndustries: p.preferredIndustries ?? "",
    notifyNewDrives: p.notifyNewDrives ?? true,
    notifyApplicationStatus: p.notifyApplicationStatus ?? true,
    notifyDeadlines: p.notifyDeadlines ?? true,
    notifyInterviewTips: p.notifyInterviewTips ?? false,
    notifyTpAnnouncements: p.notifyTpAnnouncements ?? true,
    visibleToRecruiters: p.visibleToRecruiters ?? true,
    showCgpaOnProfile: p.showCgpaOnProfile ?? true,
    showContactToCompanies: p.showContactToCompanies ?? false,
  };
}

function parsePercent(s: string): number | null | undefined {
  const t = s.trim();
  if (t === "") return null;
  const n = Number(t);
  if (Number.isNaN(n)) return undefined;
  return n;
}

function buildPayload(form: FormState) {
  const tenth = parsePercent(form.tenthPercentage);
  const twelfth = parsePercent(form.twelfthPercentage);
  if (tenth === undefined || twelfth === undefined) {
    throw new Error("10th / 12th percentage must be valid numbers or empty");
  }
  return {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    personalEmail: form.personalEmail.trim() || undefined,
    phone: form.phone.trim() || null,
    whatsapp: form.whatsapp.trim() || null,
    linkedinUrl: form.linkedinUrl.trim() || undefined,
    portfolioUrl: form.portfolioUrl.trim() || undefined,
    professionalSummary: form.professionalSummary.trim() || null,
    homeCity: form.homeCity.trim() || null,
    willingToRelocate: form.willingToRelocate || null,
    preferredWorkCities: form.preferredWorkCities.trim() || null,
    activeBacklogs: form.activeBacklogsBand,
    tenthPercentage: tenth,
    twelfthPercentage: twelfth,
    graduationGapYears: form.graduationGapYears || null,
    placementCategory: form.placementCategory || null,
    certificationsText: form.certificationsText.trim() || null,
    achievementsText: form.achievementsText.trim() || null,
    skillsProgramming: form.skillsProgramming,
    skillsFrameworks: form.skillsFrameworks,
    skillsTools: form.skillsTools,
    preferredRoleType: form.preferredRoleType || null,
    expectedCtcRange: form.expectedCtcRange || null,
    preferredWorkMode: form.preferredWorkMode || null,
    openToInternship: form.openToInternship || null,
    preferredIndustries: form.preferredIndustries.trim() || null,
    notifyNewDrives: form.notifyNewDrives,
    notifyApplicationStatus: form.notifyApplicationStatus,
    notifyDeadlines: form.notifyDeadlines,
    notifyInterviewTips: form.notifyInterviewTips,
    notifyTpAnnouncements: form.notifyTpAnnouncements,
    visibleToRecruiters: form.visibleToRecruiters,
    showCgpaOnProfile: form.showCgpaOnProfile,
    showContactToCompanies: form.showContactToCompanies,
  };
}

export const StudentEditProfile = forwardRef<
  { save: () => Promise<void> },
  StudentEditProfileProps
>(function StudentEditProfile({ user, eligibleDriveCount }, ref) {
  const { toast } = useToast();
  const [tab, setTab] = useState<ProfileTab>("a");
  const [form, setForm] = useState<FormState | null>(null);
  const formRef = useRef<FormState | null>(null);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [skillBucket, setSkillBucket] = useState<
    null | "programming" | "frameworks" | "tools"
  >(null);
  const [skillInput, setSkillInput] = useState("");

  const { data: profile, isLoading } = useQuery<StudentProfileResponse>({
    queryKey: ["/api/student/profile"],
  });

  useEffect(() => {
    if (!profile) return;
    const next = profileToForm(profile);
    setForm(next);
    formRef.current = next;
  }, [profile]);

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  const updateForm = useCallback((patch: Partial<FormState>) => {
    setForm((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      formRef.current = next;
      return next;
    });
  }, []);

  const saveMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await apiRequest("PATCH", "/api/student/profile", body);
      return res.json() as Promise<{
        profile: StudentProfileResponse;
        user: Record<string, unknown>;
      }>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/student/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.setQueryData(["/api/auth/me"], { user: data.user });
      queryClient.invalidateQueries({ queryKey: ["/api/drives"] });
      queryClient.invalidateQueries({ queryKey: ["/api/student/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/student/stats"] });
      if (data.profile) {
        const next = profileToForm(data.profile);
        setForm(next);
        formRef.current = next;
      }
      toast({ title: "Saved", description: "Your profile has been updated." });
    },
    onError: (err: Error) => {
      toast({
        title: "Save failed",
        description: err.message.replace(/^\d+:\s*/, "") || "Could not save profile.",
        variant: "destructive",
      });
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", "/api/student/profile", {
        withdrawPlacement: true,
      });
      return res.json() as Promise<{ user: Record<string, unknown> }>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/student/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.setQueryData(["/api/auth/me"], { user: data.user });
      queryClient.invalidateQueries({ queryKey: ["/api/drives"] });
      queryClient.invalidateQueries({ queryKey: ["/api/student/applications"] });
      setWithdrawOpen(false);
      toast({
        title: "Withdrawn",
        description: "You have been removed from active placement drives. Contact T&P to rejoin.",
      });
    },
    onError: (err: Error) => {
      toast({
        title: "Could not withdraw",
        description: err.message.replace(/^\d+:\s*/, ""),
        variant: "destructive",
      });
    },
  });

  const save = useCallback(async () => {
    const f = formRef.current;
    if (!f) return;
    try {
      const body = buildPayload(f);
      await saveMutation.mutateAsync(body);
    } catch (e) {
      if (e instanceof Error && !e.message.includes("status code")) {
        toast({
          title: "Invalid input",
          description: e.message,
          variant: "destructive",
        });
      }
    }
  }, [saveMutation, toast]);

  useImperativeHandle(ref, () => ({ save }), [save]);

  const addSkill = () => {
    if (!skillBucket || !form) return;
    const v = skillInput.trim();
    if (!v) return;
    const key =
      skillBucket === "programming"
        ? "skillsProgramming"
        : skillBucket === "frameworks"
          ? "skillsFrameworks"
          : "skillsTools";
    const cur = form[key];
    if (cur.some((x) => x.toLowerCase() === v.toLowerCase())) {
      setSkillInput("");
      return;
    }
    updateForm({ [key]: [...cur, v] } as Partial<FormState>);
    setSkillInput("");
  };

  const removeSkill = (
    key: "skillsProgramming" | "skillsFrameworks" | "skillsTools",
    label: string,
  ) => {
    if (!form) return;
    updateForm({
      [key]: form[key].filter((x) => x !== label),
    } as Partial<FormState>);
  };

  if (isLoading || !profile || !form) {
    return (
      <div className="student-ep">
        <div className="ep-loading">Loading profile…</div>
      </div>
    );
  }

  const initials = user.name
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const cgpaNum = Number(profile.cgpa);
  const cgpaBarPct = Math.min(100, Math.max(0, (cgpaNum / 10) * 100));
  const batchLabel = user.graduationYear
    ? `${user.graduationYear - 4} – ${user.graduationYear}`
    : "—";
  const completion = profile.profileCompletion ?? 0;
  const placementHint =
    completion >= 85
      ? `${completion}% — profile looks strong`
      : `${completion}% — add skills & preferences to finish`;

  const canWithdraw =
    profile.placementStatus !== "Placed" &&
    profile.placementStatus !== "Opted Out";

  return (
    <div className="student-ep">
      <div className="ep-content">
        <div className="ep-tabs">
          {(
            [
              ["a", "Personal Info"],
              ["b", "Academic Details"],
              ["c", "Skills & Preferences"],
              ["d", "Privacy & Notifications"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`ep-tab ${tab === id ? "on" : ""}`}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="ep-profile-hero">
          <div className="ep-hero-ava">{initials}</div>
          <div className="ep-hero-info">
            <h2>{user.name}</h2>
            <p>
              {user.email} · {user.branch}, {user.graduationYear ?? ""} Batch
            </p>
            <div className="ep-hero-tags">
              <span className="ep-htag">Roll No: {profile.rollNumber}</span>
              <span className="ep-htag">CGPA: {profile.cgpa}</span>
              <span className="ep-htag gold">
                Eligible: {eligibleDriveCount} drives
              </span>
            </div>
          </div>
          <div className="ep-hero-completion">
            <div className="ep-comp-label">Profile complete</div>
            <div className="ep-comp-bar-wrap">
              <div
                className="ep-comp-bar"
                style={{ width: `${completion}%` }}
              />
            </div>
            <div className="ep-comp-hint">{placementHint}</div>
          </div>
        </div>

        <div className={`ep-tab-panel ${tab === "a" ? "on" : ""}`}>
          <div className="ep-section-card">
            <div className="ep-sc-head">
              <h3>Basic Information</h3>
              <p>Your name and contact details visible to T&amp;P coordinators</p>
            </div>
            <div className="ep-sc-body">
              <div className="ep-form-row">
                <div className="ep-field">
                  <label>First Name</label>
                  <input
                    value={form.firstName}
                    onChange={(e) => updateForm({ firstName: e.target.value })}
                  />
                </div>
                <div className="ep-field">
                  <label>Last Name</label>
                  <input
                    value={form.lastName}
                    onChange={(e) => updateForm({ lastName: e.target.value })}
                  />
                </div>
              </div>
              <div className="ep-form-row">
                <div className="ep-field">
                  <label>College Email</label>
                  <input type="email" value={profile.email} disabled />
                  <div className="ep-field-note">
                    Assigned by institution · cannot be changed
                  </div>
                </div>
                <div className="ep-field">
                  <label>Personal Email</label>
                  <input
                    type="email"
                    placeholder="personal@gmail.com"
                    value={form.personalEmail}
                    onChange={(e) =>
                      updateForm({ personalEmail: e.target.value })
                    }
                  />
                  <div className="ep-field-note">
                    Used for offer letters and external comms
                  </div>
                </div>
              </div>
              <div className="ep-form-row">
                <div className="ep-field">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={(e) => updateForm({ phone: e.target.value })}
                  />
                </div>
                <div className="ep-field">
                  <label>WhatsApp Number</label>
                  <input
                    type="tel"
                    placeholder="Same as phone"
                    value={form.whatsapp}
                    onChange={(e) => updateForm({ whatsapp: e.target.value })}
                  />
                  <div className="ep-field-note">
                    Used by recruiters for coordination
                  </div>
                </div>
              </div>
              <div className="ep-form-row one">
                <div className="ep-field">
                  <label>LinkedIn Profile URL</label>
                  <input
                    type="url"
                    placeholder="https://linkedin.com/in/your-profile"
                    value={form.linkedinUrl}
                    onChange={(e) =>
                      updateForm({ linkedinUrl: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="ep-form-row one">
                <div className="ep-field">
                  <label>GitHub / Portfolio URL</label>
                  <input
                    type="url"
                    placeholder="https://github.com/username"
                    value={form.portfolioUrl}
                    onChange={(e) =>
                      updateForm({ portfolioUrl: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="ep-section-card">
            <div className="ep-sc-head">
              <h3>About You</h3>
              <p>Shown on your placement profile — keep it professional</p>
            </div>
            <div className="ep-sc-body">
              <div className="ep-form-row one">
                <div className="ep-field">
                  <label>Professional Summary</label>
                  <textarea
                    placeholder="A brief intro about your background, interests, and career goals (2–3 sentences)"
                    value={form.professionalSummary}
                    onChange={(e) =>
                      updateForm({ professionalSummary: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="ep-form-row">
                <div className="ep-field">
                  <label>Home City</label>
                  <input
                    placeholder="e.g. Indore"
                    value={form.homeCity}
                    onChange={(e) => updateForm({ homeCity: e.target.value })}
                  />
                </div>
                <div className="ep-field">
                  <label>Willing to Relocate</label>
                  <select
                    value={form.willingToRelocate}
                    onChange={(e) =>
                      updateForm({ willingToRelocate: e.target.value })
                    }
                  >
                    <option>Yes, anywhere</option>
                    <option>Yes, preferred cities only</option>
                    <option>No, local only</option>
                  </select>
                </div>
              </div>
              <div className="ep-form-row one">
                <div className="ep-field">
                  <label>Preferred Work Cities</label>
                  <input
                    placeholder="e.g. Bangalore, Pune, Hyderabad (comma-separated)"
                    value={form.preferredWorkCities}
                    onChange={(e) =>
                      updateForm({ preferredWorkCities: e.target.value })
                    }
                  />
                  <div className="ep-field-note">
                    Helps recruiters match you to relevant openings
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={`ep-tab-panel ${tab === "b" ? "on" : ""}`}>
          <div className="ep-section-card">
            <div className="ep-sc-head">
              <h3>Academic Details</h3>
              <p>Core eligibility criteria — verified by T&amp;P cell</p>
            </div>
            <div className="ep-sc-body">
              <div className="ep-form-row three">
                <div className="ep-field">
                  <label>Enrollment No.</label>
                  <input value={profile.rollNumber} readOnly disabled />
                </div>
                <div className="ep-field">
                  <label>Department</label>
                  <input value={profile.branch} readOnly disabled />
                </div>
                <div className="ep-field">
                  <label>Batch Year</label>
                  <input value={batchLabel} readOnly disabled />
                </div>
              </div>
              <div className="ep-divider" />
              <div className="ep-form-row">
                <div className="ep-field">
                  <label>Current CGPA</label>
                  <div className="ep-cgpa-display">{profile.cgpa}</div>
                  <div className="ep-cgpa-bar-wrap">
                    <div
                      className="ep-cgpa-bar"
                      style={{ width: `${cgpaBarPct}%` }}
                    />
                  </div>
                  <div className="ep-field-note" style={{ marginTop: 6 }}>
                    Auto-synced from ERP · contact academics office to update
                  </div>
                </div>
                <div className="ep-field">
                  <label>Active Backlogs</label>
                  <div className="ep-radio-row" style={{ marginTop: 4 }}>
                    {([0, 1, 2] as const).map((b) => {
                      const labels = ["0", "1", "2+"];
                      return (
                        <button
                          key={b}
                          type="button"
                          className={`ep-radio-opt ${form.activeBacklogsBand === b ? "sel" : ""}`}
                          onClick={() =>
                            updateForm({ activeBacklogsBand: b })
                          }
                        >
                          {labels[b]}
                        </button>
                      );
                    })}
                  </div>
                  <div className="ep-field-note" style={{ marginTop: 8 }}>
                    Affects drive eligibility — must be accurate
                  </div>
                </div>
              </div>
              <div className="ep-form-row">
                <div className="ep-field">
                  <label>10th Percentage</label>
                  <input
                    type="number"
                    placeholder="e.g. 92.4"
                    step="0.1"
                    value={form.tenthPercentage}
                    onChange={(e) =>
                      updateForm({ tenthPercentage: e.target.value })
                    }
                  />
                </div>
                <div className="ep-field">
                  <label>12th Percentage</label>
                  <input
                    type="number"
                    placeholder="e.g. 88.6"
                    step="0.1"
                    value={form.twelfthPercentage}
                    onChange={(e) =>
                      updateForm({ twelfthPercentage: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="ep-form-row">
                <div className="ep-field">
                  <label>Graduation Gap Years</label>
                  <select
                    value={form.graduationGapYears}
                    onChange={(e) =>
                      updateForm({ graduationGapYears: e.target.value })
                    }
                  >
                    <option>None</option>
                    <option>1 year</option>
                    <option>2 years</option>
                    <option>More than 2 years</option>
                  </select>
                  <div className="ep-field-note">
                    Some companies ask about this during screening
                  </div>
                </div>
                <div className="ep-field">
                  <label>Placement Category</label>
                  <select
                    value={form.placementCategory}
                    onChange={(e) =>
                      updateForm({ placementCategory: e.target.value })
                    }
                  >
                    <option>General</option>
                    <option>OBC</option>
                    <option>SC / ST</option>
                    <option>EWS</option>
                    <option>PwD</option>
                  </select>
                  <div className="ep-field-note">
                    Certain drives have reserved seats by category
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="ep-section-card">
            <div className="ep-sc-head">
              <h3>Certifications &amp; Achievements</h3>
              <p>Shown on your profile to recruiters during shortlisting</p>
            </div>
            <div className="ep-sc-body">
              <div className="ep-form-row one">
                <div className="ep-field">
                  <label>Notable Certifications</label>
                  <textarea
                    placeholder="e.g. AWS Cloud Practitioner (2024), Google Data Analytics Certificate…"
                    value={form.certificationsText}
                    onChange={(e) =>
                      updateForm({ certificationsText: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="ep-form-row one">
                <div className="ep-field">
                  <label>Competitions &amp; Achievements</label>
                  <textarea
                    placeholder="e.g. 2nd place, Smart India Hackathon 2023 · CodeChef rating 1800+…"
                    value={form.achievementsText}
                    onChange={(e) =>
                      updateForm({ achievementsText: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={`ep-tab-panel ${tab === "c" ? "on" : ""}`}>
          <div className="ep-section-card">
            <div className="ep-sc-head">
              <h3>Technical Skills</h3>
              <p>Used to calculate match score against placement drives</p>
            </div>
            <div className="ep-sc-body">
              {(
                [
                  ["skillsProgramming", "Programming Languages"] as const,
                  ["skillsFrameworks", "Frameworks & Libraries"] as const,
                  ["skillsTools", "Tools & Platforms"] as const,
                ] as const
              ).map(([key, label]) => (
                <div className="ep-field" key={key}>
                  <label>{label}</label>
                  <div className="ep-skill-wrap">
                    {form[key].map((s) => (
                      <span key={s} className="ep-skill-tag">
                        {s}
                        <button
                          type="button"
                          className="ep-rm"
                          aria-label={`Remove ${s}`}
                          onClick={() => removeSkill(key, s)}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {skillBucket ===
                    (key === "skillsProgramming"
                      ? "programming"
                      : key === "skillsFrameworks"
                        ? "frameworks"
                        : "tools") ? (
                      <>
                        <input
                          className="ep-skill-input"
                          autoFocus
                          value={skillInput}
                          onChange={(e) => setSkillInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addSkill();
                            }
                            if (e.key === "Escape") {
                              setSkillBucket(null);
                              setSkillInput("");
                            }
                          }}
                          placeholder="Add skill"
                        />
                        <button
                          type="button"
                          className="ep-skill-add"
                          onClick={addSkill}
                        >
                          Add
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="ep-skill-add"
                        onClick={() => {
                          setSkillBucket(
                            key === "skillsProgramming"
                              ? "programming"
                              : key === "skillsFrameworks"
                                ? "frameworks"
                                : "tools",
                          );
                          setSkillInput("");
                        }}
                      >
                        + Add
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="ep-section-card">
            <div className="ep-sc-head">
              <h3>Placement Preferences</h3>
              <p>Helps the system prioritise which drives to show first</p>
            </div>
            <div className="ep-sc-body">
              <div className="ep-form-row">
                <div className="ep-field">
                  <label>Preferred Role Type</label>
                  <select
                    value={form.preferredRoleType}
                    onChange={(e) =>
                      updateForm({ preferredRoleType: e.target.value })
                    }
                  >
                    <option>Software Development</option>
                    <option>Data / Analytics</option>
                    <option>Product Management</option>
                    <option>Core Engineering</option>
                    <option>Consulting</option>
                    <option>Any</option>
                  </select>
                </div>
                <div className="ep-field">
                  <label>Expected CTC Range (LPA)</label>
                  <select
                    value={form.expectedCtcRange}
                    onChange={(e) =>
                      updateForm({ expectedCtcRange: e.target.value })
                    }
                  >
                    <option>4 – 8 LPA</option>
                    <option>8 – 15 LPA</option>
                    <option>15 – 25 LPA</option>
                    <option>25+ LPA</option>
                  </select>
                </div>
              </div>
              <div className="ep-form-row">
                <div className="ep-field">
                  <label>Preferred Work Mode</label>
                  <select
                    value={form.preferredWorkMode}
                    onChange={(e) =>
                      updateForm({ preferredWorkMode: e.target.value })
                    }
                  >
                    <option>In-office</option>
                    <option>Hybrid</option>
                    <option>Remote</option>
                    <option>No preference</option>
                  </select>
                </div>
                <div className="ep-field">
                  <label>Open to Internship Offers</label>
                  <select
                    value={form.openToInternship}
                    onChange={(e) =>
                      updateForm({ openToInternship: e.target.value })
                    }
                  >
                    <option>Yes, PPO-eligible ones</option>
                    <option>Yes, all</option>
                    <option>No, full-time only</option>
                  </select>
                </div>
              </div>
              <div className="ep-form-row one">
                <div className="ep-field">
                  <label>Preferred Industries</label>
                  <input
                    placeholder="e.g. FinTech, EdTech, Healthcare, E-commerce (comma-separated)"
                    value={form.preferredIndustries}
                    onChange={(e) =>
                      updateForm({ preferredIndustries: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={`ep-tab-panel ${tab === "d" ? "on" : ""}`}>
          <div className="ep-section-card">
            <div className="ep-sc-head">
              <h3>Notification Preferences</h3>
              <p>Choose how and when you hear about placement activity</p>
            </div>
            <div className="ep-sc-body" style={{ gap: 0 }}>
              {(
                [
                  ["notifyNewDrives", "New drive alerts", "Notify when a new placement drive opens matching your profile"] as const,
                  ["notifyApplicationStatus", "Application status updates", "Shortlisted, interview scheduled, offer received"] as const,
                  ["notifyDeadlines", "Deadline reminders", "48 hrs and 24 hrs before a drive closes"] as const,
                  ["notifyInterviewTips", "Interview prep tips", "Weekly curated tips for companies you've applied to"] as const,
                  ["notifyTpAnnouncements", "T&P announcements", "General notices from the Training & Placement cell"] as const,
                ] as const
              ).map(([key, title, desc]) => (
                <div className="ep-toggle-row" key={key}>
                  <div className="ep-toggle-info">
                    <strong>{title}</strong>
                    <span>{desc}</span>
                  </div>
                  <label className="ep-toggle">
                    <input
                      type="checkbox"
                      checked={form[key]}
                      onChange={() =>
                        updateForm({ [key]: !form[key] } as Partial<FormState>)
                      }
                    />
                    <span className="ep-toggle-slider" />
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="ep-section-card">
            <div className="ep-sc-head">
              <h3>Profile Visibility</h3>
              <p>Control who can see your placement profile data</p>
            </div>
            <div className="ep-sc-body" style={{ gap: 0 }}>
              {(
                [
                  ["visibleToRecruiters", "Visible to visiting recruiters", "Recruiters from drives you've applied to can view your profile"] as const,
                  ["showCgpaOnProfile", "Show CGPA on profile", "Recruiters see your CGPA during shortlisting"] as const,
                  ["showContactToCompanies", "Show contact number to companies", "Recruiters can see your phone after offer stage only"] as const,
                ] as const
              ).map(([key, title, desc]) => (
                <div className="ep-toggle-row" key={key}>
                  <div className="ep-toggle-info">
                    <strong>{title}</strong>
                    <span>{desc}</span>
                  </div>
                  <label className="ep-toggle">
                    <input
                      type="checkbox"
                      checked={form[key]}
                      onChange={() =>
                        updateForm({ [key]: !form[key] } as Partial<FormState>)
                      }
                    />
                    <span className="ep-toggle-slider" />
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="ep-danger-card">
            <div>
              <strong>Withdraw from placement season</strong>
              <span>
                {profile.placementStatus === "Opted Out"
                  ? "You are not enrolled in campus placement. Contact T&P to participate again."
                  : "Removes you from all active drives. This action is irreversible without T&P approval."}
              </span>
            </div>
            <button
              type="button"
              className="ep-btn-danger"
              disabled={!canWithdraw || withdrawMutation.isPending}
              onClick={() => setWithdrawOpen(true)}
            >
              {profile.placementStatus === "Opted Out" ? "Withdrawn" : "Withdraw"}
            </button>
          </div>
        </div>
      </div>

      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw from placement?</DialogTitle>
            <DialogDescription>
              You will not be able to apply to new drives until T&amp;P restores
              your account. Existing applications may remain on record.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={withdrawMutation.isPending}
              onClick={() => void withdrawMutation.mutateAsync()}
            >
              Confirm withdraw
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});
