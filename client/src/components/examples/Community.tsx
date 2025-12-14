import Community from "../Community";

const mockDiscussions = [
  {
    id: 1,
    title: "Tips for Google SDE Interview - My Experience",
    content: "Just completed my Google interview rounds. Sharing some insights that helped me prepare. Focus heavily on data structures, especially trees and graphs. The interviewers were friendly and gave hints when I was stuck. Practice explaining your thought process out loud!",
    author: { name: "Priya Patel", branch: "CSE" },
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    repliesCount: 12,
    likesCount: 45,
    tags: ["Interview", "Google"],
  },
  {
    id: 2,
    title: "Best resources for System Design preparation?",
    content: "I have interviews coming up with companies that ask system design. What resources did you all use? Books, YouTube channels, or courses? Looking for beginner-friendly content that builds up gradually.",
    author: { name: "Amit Kumar", branch: "IT" },
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    repliesCount: 8,
    likesCount: 23,
    tags: ["System Design", "Resources"],
  },
  {
    id: 3,
    title: "Microsoft vs Amazon - Which one to choose?",
    content: "Got offers from both Microsoft and Amazon. Package is similar but the roles are slightly different. Microsoft is Azure cloud team and Amazon is AWS. Anyone who has experience with either company's work culture?",
    author: { name: "Sneha Gupta", branch: "CSE" },
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    repliesCount: 34,
    likesCount: 67,
    tags: ["Career Advice"],
  },
];

const mockStudentContacts = [
  { id: 1, name: "Priya Patel", branch: "CSE", graduationYear: 2025, placementStatus: "Placed", placedCompany: "Google", isOnline: true },
  { id: 2, name: "Amit Kumar", branch: "IT", graduationYear: 2025, placementStatus: "Not Placed", isOnline: true },
  { id: 3, name: "Sneha Gupta", branch: "CSE", graduationYear: 2025, placementStatus: "Placed", placedCompany: "Microsoft", isOnline: false },
  { id: 4, name: "Vikram Singh", branch: "ECE", graduationYear: 2025, placementStatus: "Not Placed", isOnline: false },
  { id: 5, name: "Ananya Sharma", branch: "CSE", graduationYear: 2025, placementStatus: "Placed", placedCompany: "Amazon", isOnline: true },
];

export default function CommunityExample() {
  return (
    <div className="p-4">
      <Community
        discussions={mockDiscussions}
        students={mockStudentContacts}
        onCreateDiscussion={(title, content, tags) =>
          console.log("Create discussion:", { title, content, tags })
        }
        onSendMessage={(studentId, message) =>
          console.log("Send message:", { studentId, message })
        }
        onLikeDiscussion={(id) => console.log("Like discussion:", id)}
      />
    </div>
  );
}
