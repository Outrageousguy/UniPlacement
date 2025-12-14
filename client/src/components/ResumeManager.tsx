import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  Upload,
  Trash2,
  Star,
  Eye,
  Loader2,
  Plus,
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
  isUploading?: boolean;
}

export default function ResumeManager({
  resumes,
  onUpload,
  onDelete,
  onSetDefault,
  onView,
  isUploading = false,
}: ResumeManagerProps) {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [resumeName, setResumeName] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    if (file.type !== "application/pdf") {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PDF file only.",
        variant: "destructive",
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "File size must be less than 5MB.",
        variant: "destructive",
      });
      return;
    }
    setSelectedFile(file);
    if (!resumeName) {
      setResumeName(file.name.replace(".pdf", ""));
    }
  };

  const handleUpload = () => {
    if (!selectedFile || !resumeName.trim()) {
      toast({
        title: "Error",
        description: "Please select a file and enter a name.",
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
      title: "Resume Uploaded",
      description: `"${resumeName}" has been uploaded successfully.`,
    });
  };

  const handleDelete = (resume: Resume) => {
    onDelete(resume.id);
    toast({
      title: "Resume Deleted",
      description: `"${resume.name}" has been deleted.`,
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle className="text-xl">My Resumes</CardTitle>
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogTrigger asChild>
            <Button data-testid="button-upload-resume">
              <Plus className="w-4 h-4 mr-2" />
              Upload Resume
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Resume</DialogTitle>
              <DialogDescription>
                Upload a PDF resume (max 5MB)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25"
                }`}
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
                  onChange={(e) =>
                    e.target.files?.[0] && handleFileSelect(e.target.files[0])
                  }
                  data-testid="input-file-upload"
                />
                {selectedFile ? (
                  <div className="space-y-2">
                    <FileText className="w-10 h-10 mx-auto text-primary" />
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedFile(null)}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-10 h-10 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Drag and drop your PDF here, or
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      data-testid="button-browse-files"
                    >
                      Browse Files
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="resume-name">Resume Name</Label>
                <Input
                  id="resume-name"
                  placeholder="e.g., Default Resume, Tech Focused"
                  value={resumeName}
                  onChange={(e) => setResumeName(e.target.value)}
                  data-testid="input-resume-name"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is-default"
                  checked={isDefault}
                  onCheckedChange={(checked) => setIsDefault(checked === true)}
                  data-testid="checkbox-set-default"
                />
                <Label htmlFor="is-default" className="text-sm font-normal">
                  Set as default resume
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowUploadDialog(false)}
              >
                Cancel
              </Button>
              <Button
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
      </CardHeader>
      <CardContent>
        {resumes.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No resumes uploaded</p>
            <p className="text-sm text-muted-foreground mb-4">
              Upload your resume to start applying for drives
            </p>
            <Button onClick={() => setShowUploadDialog(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Your First Resume
            </Button>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold text-xs uppercase tracking-wide">
                    Name
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wide">
                    File
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wide">
                    Uploaded
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
                {resumes.map((resume, index) => (
                  <TableRow
                    key={resume.id}
                    className={index % 2 === 0 ? "bg-background" : "bg-muted/30"}
                    data-testid={`row-resume-${resume.id}`}
                  >
                    <TableCell className="font-medium">{resume.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {resume.fileName}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(resume.uploadedAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      {resume.isDefault && (
                        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-xs">
                          <Star className="w-3 h-3 mr-1" />
                          Default
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => onView(resume.id)}
                          data-testid={`button-view-resume-${resume.id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {!resume.isDefault && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => onSetDefault(resume.id)}
                            data-testid={`button-set-default-${resume.id}`}
                          >
                            <Star className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(resume)}
                          className="text-destructive"
                          data-testid={`button-delete-resume-${resume.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
