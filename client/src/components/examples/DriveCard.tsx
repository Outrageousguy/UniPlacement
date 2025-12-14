import DriveCard from "../DriveCard";

export default function DriveCardExample() {
  const mockResumes = [
    { id: 1, name: "Default Resume" },
    { id: 2, name: "Tech Focused" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 max-w-4xl">
      <DriveCard
        id={1}
        companyName="Google"
        jobRole="Software Engineer"
        ctcMin={25}
        ctcMax={35}
        minCgpa={8.0}
        maxBacklogs={0}
        allowedBranches={["CSE", "IT", "ECE"]}
        registrationDeadline={new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)}
        jobDescription="Join Google's engineering team to build products that help billions of users..."
        status="Active"
        resumes={mockResumes}
        onRegister={(driveId, resumeId, notes) => 
          console.log("Register:", { driveId, resumeId, notes })
        }
        userRole="student"
      />
      <DriveCard
        id={2}
        companyName="Microsoft"
        jobRole="SDE II"
        ctcMin={18}
        ctcMax={28}
        minCgpa={7.5}
        maxBacklogs={1}
        allowedBranches={["CSE", "IT", "ECE", "EEE"]}
        registrationDeadline={new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)}
        jobDescription="Work on Azure cloud services..."
        status="Active"
        isRegistered={true}
        registrationStatus="Shortlisted"
        resumes={mockResumes}
        userRole="student"
      />
    </div>
  );
}
