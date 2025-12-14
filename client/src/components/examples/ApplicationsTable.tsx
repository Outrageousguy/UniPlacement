import ApplicationsTable from "../ApplicationsTable";

const mockApplications = [
  {
    id: 1,
    driveId: 1,
    companyName: "Google",
    jobRole: "Software Engineer",
    appliedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    status: "Shortlisted" as const,
    matchScore: 85,
    resumeName: "Default Resume",
  },
  {
    id: 2,
    driveId: 2,
    companyName: "Microsoft",
    jobRole: "SDE II",
    appliedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    status: "Interview" as const,
    matchScore: 78,
    resumeName: "Tech Focused",
  },
  {
    id: 3,
    driveId: 3,
    companyName: "Amazon",
    jobRole: "SDE I",
    appliedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    status: "Registered" as const,
    resumeName: "Default Resume",
  },
  {
    id: 4,
    driveId: 4,
    companyName: "Adobe",
    jobRole: "Software Developer",
    appliedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    status: "Selected" as const,
    matchScore: 92,
    resumeName: "Default Resume",
  },
  {
    id: 5,
    driveId: 5,
    companyName: "Infosys",
    jobRole: "Systems Engineer",
    appliedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    status: "Rejected" as const,
    matchScore: 45,
    resumeName: "Default Resume",
  },
];

export default function ApplicationsTableExample() {
  return (
    <div className="p-4">
      <ApplicationsTable
        applications={mockApplications}
        onWithdraw={(id) => console.log("Withdraw:", id)}
        onViewDrive={(id) => console.log("View drive:", id)}
        onAnalyze={(id) => console.log("Analyze:", id)}
      />
    </div>
  );
}
