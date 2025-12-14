import ResumeManager from "../ResumeManager";

const mockResumes = [
  {
    id: 1,
    name: "Default Resume",
    fileName: "rahul_resume_v3.pdf",
    uploadedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    isDefault: true,
  },
  {
    id: 2,
    name: "Tech Focused",
    fileName: "rahul_tech_resume.pdf",
    uploadedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    isDefault: false,
  },
  {
    id: 3,
    name: "Consulting Resume",
    fileName: "rahul_consulting.pdf",
    uploadedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    isDefault: false,
  },
];

export default function ResumeManagerExample() {
  return (
    <div className="p-4 max-w-4xl mx-auto">
      <ResumeManager
        resumes={mockResumes}
        onUpload={(file, name, isDefault) =>
          console.log("Upload:", { file: file.name, name, isDefault })
        }
        onDelete={(id) => console.log("Delete:", id)}
        onSetDefault={(id) => console.log("Set default:", id)}
        onView={(id) => console.log("View:", id)}
      />
    </div>
  );
}
