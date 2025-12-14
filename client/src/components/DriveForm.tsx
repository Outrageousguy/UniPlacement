import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface DriveFormProps {
  onSubmit: (data: DriveFormData) => void;
  initialData?: Partial<DriveFormData>;
  isLoading?: boolean;
}

export interface DriveFormData {
  companyName: string;
  jobRole: string;
  ctcMin: number;
  ctcMax: number;
  jobDescription: string;
  minCgpa: number;
  maxBacklogs: number;
  allowedBranches: string[];
  registrationDeadline: string;
}

const branches = ["CSE", "IT", "ECE", "EEE", "Mechanical", "Civil", "Other"];

export default function DriveForm({
  onSubmit,
  initialData,
  isLoading = false,
}: DriveFormProps) {
  const [formData, setFormData] = useState<DriveFormData>({
    companyName: initialData?.companyName || "",
    jobRole: initialData?.jobRole || "",
    ctcMin: initialData?.ctcMin || 0,
    ctcMax: initialData?.ctcMax || 0,
    jobDescription: initialData?.jobDescription || "",
    minCgpa: initialData?.minCgpa || 6.0,
    maxBacklogs: initialData?.maxBacklogs || 0,
    allowedBranches: initialData?.allowedBranches || [],
    registrationDeadline: initialData?.registrationDeadline || "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof DriveFormData, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof DriveFormData, string>> = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = "Company name is required";
    }
    if (!formData.jobRole.trim()) {
      newErrors.jobRole = "Job role is required";
    }
    if (formData.ctcMin <= 0) {
      newErrors.ctcMin = "Minimum CTC must be greater than 0";
    }
    if (formData.ctcMax <= 0) {
      newErrors.ctcMax = "Maximum CTC must be greater than 0";
    }
    if (formData.ctcMin >= formData.ctcMax) {
      newErrors.ctcMax = "Maximum CTC must be greater than minimum CTC";
    }
    if (formData.jobDescription.trim().length < 10) {
      newErrors.jobDescription = "Job description must be at least 10 characters";
    }
    if (formData.allowedBranches.length === 0) {
      newErrors.allowedBranches = "Select at least one branch";
    }
    if (!formData.registrationDeadline) {
      newErrors.registrationDeadline = "Registration deadline is required";
    } else if (new Date(formData.registrationDeadline) <= new Date()) {
      newErrors.registrationDeadline = "Deadline must be a future date";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const toggleBranch = (branch: string) => {
    setFormData((prev) => ({
      ...prev,
      allowedBranches: prev.allowedBranches.includes(branch)
        ? prev.allowedBranches.filter((b) => b !== branch)
        : [...prev.allowedBranches, branch],
    }));
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">Post New Drive</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">
                Company Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="companyName"
                placeholder="e.g., Google"
                value={formData.companyName}
                onChange={(e) =>
                  setFormData({ ...formData, companyName: e.target.value })
                }
                data-testid="input-company-name"
              />
              {errors.companyName && (
                <p className="text-sm text-destructive">{errors.companyName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="jobRole">
                Job Role <span className="text-destructive">*</span>
              </Label>
              <Input
                id="jobRole"
                placeholder="e.g., Software Engineer"
                value={formData.jobRole}
                onChange={(e) =>
                  setFormData({ ...formData, jobRole: e.target.value })
                }
                data-testid="input-job-role"
              />
              {errors.jobRole && (
                <p className="text-sm text-destructive">{errors.jobRole}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ctcMin">
                Minimum CTC (LPA) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ctcMin"
                type="number"
                step="0.5"
                min="0"
                placeholder="e.g., 8"
                value={formData.ctcMin || ""}
                onChange={(e) =>
                  setFormData({ ...formData, ctcMin: parseFloat(e.target.value) || 0 })
                }
                data-testid="input-ctc-min"
              />
              {errors.ctcMin && (
                <p className="text-sm text-destructive">{errors.ctcMin}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ctcMax">
                Maximum CTC (LPA) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ctcMax"
                type="number"
                step="0.5"
                min="0"
                placeholder="e.g., 12"
                value={formData.ctcMax || ""}
                onChange={(e) =>
                  setFormData({ ...formData, ctcMax: parseFloat(e.target.value) || 0 })
                }
                data-testid="input-ctc-max"
              />
              {errors.ctcMax && (
                <p className="text-sm text-destructive">{errors.ctcMax}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="jobDescription">Job Description</Label>
            <Textarea
              id="jobDescription"
              placeholder="Describe the role, responsibilities, and requirements..."
              rows={4}
              value={formData.jobDescription}
              onChange={(e) =>
                setFormData({ ...formData, jobDescription: e.target.value })
              }
              data-testid="input-job-description"
            />
            {errors.jobDescription && (
              <p className="text-sm text-destructive">{errors.jobDescription}</p>
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>
                  Minimum CGPA <span className="text-destructive">*</span>
                </Label>
                <span className="text-sm font-medium bg-muted px-2 py-1 rounded">
                  {formData.minCgpa.toFixed(1)}
                </span>
              </div>
              <Slider
                value={[formData.minCgpa]}
                onValueChange={([value]) =>
                  setFormData({ ...formData, minCgpa: value })
                }
                max={10}
                min={0}
                step={0.5}
                data-testid="slider-min-cgpa"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxBacklogs">
                Maximum Backlogs Allowed <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.maxBacklogs.toString()}
                onValueChange={(value) =>
                  setFormData({ ...formData, maxBacklogs: parseInt(value) })
                }
              >
                <SelectTrigger data-testid="select-max-backlogs">
                  <SelectValue placeholder="Select max backlogs" />
                </SelectTrigger>
                <SelectContent>
                  {[0, 1, 2, 3, 4, 5].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num === 0 ? "No backlogs" : `Up to ${num} backlog${num > 1 ? "s" : ""}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <Label>
              Allowed Branches <span className="text-destructive">*</span>
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {branches.map((branch) => (
                <div key={branch} className="flex items-center space-x-2">
                  <Checkbox
                    id={`branch-${branch}`}
                    checked={formData.allowedBranches.includes(branch)}
                    onCheckedChange={() => toggleBranch(branch)}
                    data-testid={`checkbox-branch-${branch.toLowerCase()}`}
                  />
                  <Label
                    htmlFor={`branch-${branch}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {branch}
                  </Label>
                </div>
              ))}
            </div>
            {errors.allowedBranches && (
              <p className="text-sm text-destructive">{errors.allowedBranches}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="registrationDeadline">
              Registration Deadline <span className="text-destructive">*</span>
            </Label>
            <Input
              id="registrationDeadline"
              type="datetime-local"
              value={formData.registrationDeadline}
              onChange={(e) =>
                setFormData({ ...formData, registrationDeadline: e.target.value })
              }
              data-testid="input-registration-deadline"
            />
            {errors.registrationDeadline && (
              <p className="text-sm text-destructive">
                {errors.registrationDeadline}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full md:w-auto"
            disabled={isLoading}
            data-testid="button-submit-drive"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Posting...
              </>
            ) : (
              "Post Drive"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
