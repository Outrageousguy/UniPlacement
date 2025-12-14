import DriveManagement from "../DriveManagement";

const mockDrives = [
  {
    id: 1,
    companyName: "Google",
    jobRole: "Software Engineer",
    ctcMin: 25,
    ctcMax: 35,
    registrationDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    status: "Active" as const,
    registrationsCount: 45,
  },
  {
    id: 2,
    companyName: "Microsoft",
    jobRole: "SDE II",
    ctcMin: 18,
    ctcMax: 28,
    registrationDeadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    status: "Active" as const,
    registrationsCount: 62,
  },
  {
    id: 3,
    companyName: "Amazon",
    jobRole: "SDE I",
    ctcMin: 16,
    ctcMax: 24,
    registrationDeadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    status: "Completed" as const,
    registrationsCount: 78,
  },
  {
    id: 4,
    companyName: "Infosys",
    jobRole: "Systems Engineer",
    ctcMin: 4,
    ctcMax: 6,
    registrationDeadline: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    status: "Completed" as const,
    registrationsCount: 120,
  },
  {
    id: 5,
    companyName: "TCS",
    jobRole: "Developer",
    ctcMin: 3.5,
    ctcMax: 5,
    registrationDeadline: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    status: "Cancelled" as const,
    registrationsCount: 25,
  },
];

export default function DriveManagementExample() {
  return (
    <div className="p-4">
      <DriveManagement
        drives={mockDrives}
        onViewDrive={(id) => console.log("View drive:", id)}
        onEditDrive={(id) => console.log("Edit drive:", id)}
        onCompleteDrive={(id) => console.log("Complete drive:", id)}
      />
    </div>
  );
}
