import { useState, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  Upload,
  Trash2,
  Star,
  Eye,
  Loader2,
  Plus,
  Calendar,
  Download,
  ShieldCheck,
  Zap,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Resume {
  id: number;
  name: string;
  fileName: string;
  uploadedAt: Date;
  isDefault: boolean;
}

interface ResumeManagerProps {
  resumes: Resume[];
  onUpload: (file: File, name: string, isDefault: boolean) => void;
  onDelete: (id: number) => void;
  onSetDefault: (id: number) => void;
  onView: (id: number) => void;
  onDownload: (id: number) => void;
  isUploading?: boolean;
}

export default function ResumeManager({
  resumes,
  onUpload,
  onDelete,
  onSetDefault,
  onView,
  onDownload,
  isUploading = false,
}: ResumeManagerProps) {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [resumeName, setResumeName] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadZoneFlash, setUploadZoneFlash] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const stats = useMemo(() => {
    const total = resumes.length;
    const defaultCount = resumes.filter((r) => r.isDefault).length;
    let lastLabel = "—";
    if (resumes.length > 0) {
      const maxTime = Math.max(
        ...resumes.map((r) => new Date(r.uploadedAt).getTime())
      );
      lastLabel = format(new Date(maxTime), "MMM d, yyyy");
    }
    return { total, defaultCount, lastLabel };
  }, [resumes]);

  const openUploadDialog = (flashZone: boolean) => {
    if (flashZone) {
      setUploadZoneFlash(true);
      window.setTimeout(() => setUploadZoneFlash(false), 800);
    }
    setShowUploadDialog(true);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      if (handleFileSelect(e.dataTransfer.files[0])) {
        setShowUploadDialog(true);
      }
    }
  };

  /** Returns true if the file was accepted. */
  const handleFileSelect = (file: File): boolean => {
    if (file.type !== "application/pdf") {
      toast({
        title: "Invalid File Type",
        description: `"${file.name}" is not a PDF file. Please upload only PDF resumes.`,
        variant: "destructive",
      });
      return false;
    }

    const maxSizeMB = file.size / (1024 * 1024);
    if (maxSizeMB > 5) {
      toast({
        title: "File Too Large",
        description: `"${file.name}" is ${maxSizeMB.toFixed(1)}MB. Maximum allowed size is 5MB.`,
        variant: "destructive",
      });
      return false;
    }

    setSelectedFile(file);
    setResumeName((prev) =>
      prev ? prev : file.name.replace(/\.pdf$/i, "")
    );
    return true;
  };

  const handleUpload = () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a PDF file to upload.",
        variant: "destructive",
      });
      return;
    }

    if (!resumeName.trim()) {
      toast({
        title: "Missing Resume Name",
        description: "Please enter a name for your resume.",
        variant: "destructive",
      });
      return;
    }

    const existingResume = resumes.find(
      (r) => r.name.toLowerCase() === resumeName.trim().toLowerCase()
    );
    if (existingResume) {
      toast({
        title: "Duplicate Resume Name",
        description: "A resume with this name already exists. Please use a different name.",
        variant: "destructive",
      });
      return;
    }

    onUpload(selectedFile, resumeName.trim(), isDefault);
    setShowUploadDialog(false);
    setSelectedFile(null);
    setResumeName("");
    setIsDefault(false);
    toast({
      title: "Uploading Resume",
      description: `"${resumeName}" is being uploaded...`,
    });
  };

  const handleDelete = (resume: Resume) => {
    if (resume.isDefault) {
      toast({
        title: "Cannot Delete Default Resume",
        description: "Please set another resume as default before deleting this one.",
        variant: "destructive",
      });
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to delete "${resume.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    onDelete(resume.id);
    toast({
      title: "Deleting Resume",
      description: `"${resume.name}" is being deleted...`,
    });
  };

  const resetDialog = (open: boolean) => {
    setShowUploadDialog(open);
    if (!open) {
      setSelectedFile(null);
      setResumeName("");
      setIsDefault(false);
    }
  };

  return (
    <div className="student-v3-resume-page">
      <Dialog open={showUploadDialog} onOpenChange={resetDialog}>
        <DialogContent className="student-v3-resume-dialog sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="student-v3-resume-dialog-title">
              Upload Resume
            </DialogTitle>
            <DialogDescription className="student-v3-resume-dialog-desc">
              Upload a PDF resume (max 5MB)
            </DialogDescription>
          </DialogHeader>
          <div className="student-v3-resume-dialog-body">
            <div
              className={`student-v3-resume-drop ${dragActive ? "active" : ""}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileSelect(f);
                }}
                data-testid="input-file-upload"
              />
              {selectedFile ? (
                <div className="student-v3-resume-drop-inner">
                  <FileText className="student-v3-resume-drop-ico" />
                  <p className="student-v3-resume-drop-name">{selectedFile.name}</p>
                  <p className="student-v3-resume-drop-meta">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="student-v3-resume-outline-btn"
                    onClick={() => setSelectedFile(null)}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="student-v3-resume-drop-inner">
                  <Upload className="student-v3-resume-drop-ico muted" />
                  <p className="student-v3-resume-drop-hint">
                    Drag and drop your PDF here, or
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="student-v3-resume-outline-btn"
                    onClick={() => fileInputRef.current?.click()}
                    data-testid="button-browse-files"
                  >
                    Browse Files
                  </Button>
                </div>
              )}
            </div>

            <div className="student-v3-resume-field">
              <Label htmlFor="resume-name">Resume Name</Label>
              <Input
                id="resume-name"
                placeholder="e.g., Default Resume, Tech Focused"
                value={resumeName}
                onChange={(e) => setResumeName(e.target.value)}
                data-testid="input-resume-name"
                className="student-v3-resume-input"
              />
            </div>

            <div className="student-v3-resume-check-row">
              <Checkbox
                id="is-default"
                className="student-v3-resume-checkbox"
                checked={isDefault}
                onCheckedChange={(checked) => setIsDefault(checked === true)}
                data-testid="checkbox-set-default"
              />
              <Label htmlFor="is-default" className="student-v3-resume-check-label">
                Set as default resume
              </Label>
            </div>
          </div>
          <DialogFooter className="student-v3-resume-dialog-footer">
            <Button
              type="button"
              variant="outline"
              className="student-v3-resume-outline-btn"
              onClick={() => setShowUploadDialog(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="student-v3-resume-primary-solid"
              onClick={handleUpload}
              disabled={!selectedFile || !resumeName.trim() || isUploading}
              data-testid="button-confirm-upload"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Upload"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="student-v3-resume-section-head">
        <h2>My Resumes</h2>
        <button
          type="button"
          className="student-v3-resume-btn-primary"
          data-testid="button-upload-resume"
          onClick={() => openUploadDialog(false)}
        >
          <Upload className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
          <span className="student-v3-resume-btn-shimmer">Upload Resume</span>
        </button>
      </div>

      <div className="student-v3-resume-stats">
        <div className="student-v3-resume-stat">
          <div className="student-v3-resume-stat-label">Total Uploaded</div>
          <div className="student-v3-resume-stat-value">{stats.total}</div>
          <div className="student-v3-resume-stat-sub">Across this season</div>
          <div className="student-v3-resume-stat-ico">
            <FileText className="h-[18px] w-[18px]" strokeWidth={1.8} />
          </div>
        </div>
        <div className="student-v3-resume-stat">
          <div className="student-v3-resume-stat-label">Active Default</div>
          <div className="student-v3-resume-stat-value amber">
            {stats.defaultCount}
          </div>
          <div className="student-v3-resume-stat-sub">Used for applications</div>
          <div className="student-v3-resume-stat-ico">
            <svg
              className="h-[18px] w-[18px]"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div className="student-v3-resume-stat">
          <div className="student-v3-resume-stat-label">Last Updated</div>
          <div
            className={`student-v3-resume-stat-value ${stats.total ? "student-v3-resume-stat-date" : ""}`}
          >
            {stats.lastLabel}
          </div>
          <div className="student-v3-resume-stat-sub">Keep it current</div>
          <div className="student-v3-resume-stat-ico">
            <Calendar className="h-[18px] w-[18px]" strokeWidth={1.8} />
          </div>
        </div>
      </div>

      <div className="student-v3-resume-table-card">
        <div className="student-v3-resume-table-head">
          <h3>
            <FileText className="h-4 w-4 shrink-0" strokeWidth={1.8} />
            Resume Library
          </h3>
          <button
            type="button"
            className="student-v3-resume-btn-primary student-v3-resume-btn-compact"
            onClick={() => openUploadDialog(false)}
          >
            <Plus className="h-3 w-3 shrink-0" strokeWidth={2} />
            <span className="student-v3-resume-btn-shimmer">Add New</span>
          </button>
        </div>
        <div className="student-v3-resume-table-wrap">
          {resumes.length === 0 ? (
            <div className="student-v3-resume-empty">
              <div className="student-v3-resume-empty-icon">
                <FileText className="h-6 w-6" strokeWidth={1.8} />
              </div>
              <h4>No resumes uploaded</h4>
              <p>
                Upload your resume to start applying for drives. PDF only, up to 5 MB.
              </p>
              <button
                type="button"
                className="student-v3-resume-btn-primary"
                onClick={() => openUploadDialog(false)}
              >
                <Upload className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                <span className="student-v3-resume-btn-shimmer">
                  Upload Your First Resume
                </span>
              </button>
            </div>
          ) : (
            <table className="student-v3-resume-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>File</th>
                  <th>Uploaded</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {resumes.map((resume, index) => (
                  <tr
                    key={resume.id}
                    data-testid={`row-resume-${resume.id}`}
                    style={{ animationDelay: `${0.05 * index}s` }}
                  >
                    <td>
                      <div className="student-v3-resume-row-name">
                        <div className="student-v3-resume-row-ico">
                          <FileText className="h-3.5 w-3.5" strokeWidth={1.8} />
                        </div>
                        {resume.name}
                      </div>
                    </td>
                    <td>
                      <span className="student-v3-resume-filename">
                        {resume.fileName}
                      </span>
                    </td>
                    <td>
                      <div className="student-v3-resume-date-chip">
                        <Calendar className="h-3 w-3 shrink-0" strokeWidth={1.8} />
                        {format(new Date(resume.uploadedAt), "MMM d, yyyy")}
                      </div>
                    </td>
                    <td>
                      {resume.isDefault ? (
                        <div className="student-v3-resume-badge-def">
                          <Star className="h-[11px] w-[11px]" strokeWidth={2} />
                          Default
                        </div>
                      ) : null}
                    </td>
                    <td>
                      <div className="student-v3-resume-actions">
                        <button
                          type="button"
                          className="student-v3-resume-act"
                          title="Preview"
                          aria-label="Preview resume"
                          onClick={() => onView(resume.id)}
                          data-testid={`button-view-resume-${resume.id}`}
                        >
                          <Eye className="h-3.5 w-3.5" strokeWidth={1.8} />
                        </button>
                        <button
                          type="button"
                          className="student-v3-resume-act"
                          title="Download"
                          aria-label="Download resume"
                          onClick={() => onDownload(resume.id)}
                          data-testid={`button-download-resume-${resume.id}`}
                        >
                          <Download className="h-3.5 w-3.5" strokeWidth={1.8} />
                        </button>
                        {!resume.isDefault && (
                          <button
                            type="button"
                            className="student-v3-resume-act"
                            title="Set as default"
                            aria-label="Set as default resume"
                            onClick={() => onSetDefault(resume.id)}
                            data-testid={`button-set-default-${resume.id}`}
                          >
                            <Star className="h-3.5 w-3.5" strokeWidth={1.8} />
                          </button>
                        )}
                        <button
                          type="button"
                          className="student-v3-resume-act danger"
                          title="Delete"
                          aria-label="Delete resume"
                          onClick={() => handleDelete(resume)}
                          data-testid={`button-delete-resume-${resume.id}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div
        role="button"
        tabIndex={0}
        aria-label="Upload resume: open dialog or drop a PDF file"
        className={`student-v3-resume-upload-zone ${dragActive ? "active" : ""} ${uploadZoneFlash ? "flash" : ""}`}
        onClick={() => openUploadDialog(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openUploadDialog(true);
          }
        }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="student-v3-resume-upload-ico-wrap">
          <Upload className="h-5 w-5" strokeWidth={1.8} />
        </div>
        <h4>Drop your resume here</h4>
        <p>
          Drag & drop a PDF, or <strong>click to browse</strong> · Max 5 MB · PDF only
        </p>
      </div>

      <div className="student-v3-resume-tips-head">
        <h2>Resume Tips</h2>
      </div>
      <div className="student-v3-resume-tips">
        <div className="student-v3-resume-tip">
          <div className="student-v3-resume-tip-ico">
            <ShieldCheck className="h-4 w-4" strokeWidth={1.8} />
          </div>
          <h4>ATS-Friendly Format</h4>
          <p>
            Use standard section headings and avoid tables, images, or columns to pass ATS filters.
          </p>
        </div>
        <div className="student-v3-resume-tip">
          <div className="student-v3-resume-tip-ico">
            <Zap className="h-4 w-4" strokeWidth={1.8} />
          </div>
          <h4>Tailor Per Drive</h4>
          <p>
            Upload role-specific resumes and assign them per application for higher match scores.
          </p>
        </div>
        <div className="student-v3-resume-tip">
          <div className="student-v3-resume-tip-ico">
            <RefreshCw className="h-4 w-4" strokeWidth={1.8} />
          </div>
          <h4>Keep it Updated</h4>
          <p>
            Refresh your resume before each drive season — recruiters notice recent projects and skills.
          </p>
        </div>
      </div>
    </div>
  );
}
