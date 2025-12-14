import StudentTable from "../StudentTable";

const mockStudents = [
  {
    id: 1,
    name: "Rahul Sharma",
    email: "rahul@university.edu",
    rollNumber: "2021CSE001",
    branch: "CSE",
    graduationYear: 2025,
    cgpa: 8.75,
    activeBacklogs: 0,
    placementStatus: "Placed" as const,
    placedCompany: "Google",
    placedPackage: 32,
    registrationsCount: 5,
  },
  {
    id: 2,
    name: "Priya Patel",
    email: "priya@university.edu",
    rollNumber: "2021IT002",
    branch: "IT",
    graduationYear: 2025,
    cgpa: 9.2,
    activeBacklogs: 0,
    placementStatus: "Not Placed" as const,
    registrationsCount: 8,
  },
  {
    id: 3,
    name: "Amit Kumar",
    email: "amit@university.edu",
    rollNumber: "2021ECE003",
    branch: "ECE",
    graduationYear: 2025,
    cgpa: 7.8,
    activeBacklogs: 1,
    placementStatus: "Not Placed" as const,
    registrationsCount: 3,
  },
  {
    id: 4,
    name: "Sneha Gupta",
    email: "sneha@university.edu",
    rollNumber: "2021CSE004",
    branch: "CSE",
    graduationYear: 2025,
    cgpa: 8.4,
    activeBacklogs: 0,
    placementStatus: "Placed" as const,
    placedCompany: "Microsoft",
    placedPackage: 24,
    registrationsCount: 6,
  },
  {
    id: 5,
    name: "Vikram Singh",
    email: "vikram@university.edu",
    rollNumber: "2021ME005",
    branch: "Mechanical",
    graduationYear: 2025,
    cgpa: 7.2,
    activeBacklogs: 2,
    placementStatus: "Opted Out" as const,
    registrationsCount: 0,
  },
];

export default function StudentTableExample() {
  return (
    <div className="p-4">
      <StudentTable
        students={mockStudents}
        onViewProfile={(id) => console.log("View profile:", id)}
      />
    </div>
  );
}
