import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  GraduationCap, 
  LayoutDashboard, 
  FileText, 
  Briefcase, 
  Calendar, 
  Search,
  TrendingUp,
  Award,
  Users,
  Building2,
  Target,
  Clock
} from "lucide-react";

interface LivePreviewProps {
  className?: string;
}

export default function LivePreview({ className }: LivePreviewProps) {
  const [activeView, setActiveView] = useState<"coordinator" | "student">("student");

  const CoordinatorPreview = () => (
    <div className="w-full h-full flex items-center justify-center bg-landing-card-bg rounded-lg">
      <div className="text-center">
        <GraduationCap className="w-16 h-16 mx-auto text-landing-primary-dark mb-4" />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Coordinator Dashboard</h3>
        <p className="text-gray-600">Manage drives, track students, and analyze placement statistics</p>
      </div>
    </div>
  );

  const StudentPreview = () => (
    <div className="w-full h-full bg-landing-card-bg rounded-lg overflow-hidden">
      {/* Browser Window Controls */}
      <div className="bg-landing-primary-dark px-4 py-2 flex items-center gap-3">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <div className="flex-1 bg-landing-primary-dark/50 rounded px-3 py-1">
          <span className="text-white text-sm font-mono">uniplacement.mitsgwalior.in/student</span>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="flex flex-col lg:flex-row h-auto lg:h-[500px]">
        {/* Sidebar */}
        <div className="w-full lg:w-64 bg-landing-primary-dark p-4 lg:block">
          {/* User Info */}
          <div className="flex items-center gap-3 mb-6">
            <Avatar className="w-12 h-12 bg-landing-accent text-landing-primary-dark">
              <AvatarFallback className="font-bold">AK</AvatarFallback>
            </Avatar>
            <div>
              <h4 className="text-white font-semibold">Aditya K.</h4>
              <p className="text-gray-400 text-sm">CSE - 7.8 CGPA</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="space-y-4">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">My Portal</p>
              <div className="space-y-1">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-white bg-landing-primary-dark/50 hover:bg-landing-primary-dark/70"
                >
                  <LayoutDashboard className="w-4 h-4 mr-3" />
                  My Drives
                </Button>
                <Button variant="ghost" className="w-full justify-start text-gray-400 hover:text-white hover:bg-landing-primary-dark/50">
                  <FileText className="w-4 h-4 mr-3" />
                  My Resume
                </Button>
                <Button variant="ghost" className="w-full justify-start text-gray-400 hover:text-white hover:bg-landing-primary-dark/50">
                  <Briefcase className="w-4 h-4 mr-3" />
                  Applications
                </Button>
                <Button variant="ghost" className="w-full justify-start text-gray-400 hover:text-white hover:bg-landing-primary-dark/50">
                  <Calendar className="w-4 h-4 mr-3" />
                  Interviews
                </Button>
              </div>
            </div>

            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Explore</p>
              <Button variant="ghost" className="w-full justify-start text-gray-400 hover:text-white hover:bg-landing-primary-dark/50">
                <Search className="w-4 h-4 mr-3" />
                Job Board
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-landing-bg-light p-4 lg:p-6 overflow-auto max-h-[500px] lg:max-h-none">
          {/* Eligible Drives Section */}
          <div className="mb-6 lg:mb-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
              <div>
                <h2 className="text-xl lg:text-2xl font-bold text-gray-800">Your Eligible Drives</h2>
                <p className="text-gray-600 text-sm lg:text-base">Showing 6 of 47 drives - CSE, 4th Year, 7.8 CGPA</p>
              </div>
              <Badge className="bg-landing-success text-white mt-2 sm:mt-0 w-fit">6 eligible</Badge>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 lg:gap-4">
              {/* Drive Cards */}
              <Card className="p-3 lg:p-4 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-800 text-sm lg:text-base">TCS (Digital)</h3>
                    <p className="text-gray-600 text-xs lg:text-sm">Software Developer</p>
                  </div>
                  <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-landing-success text-white flex items-center justify-center text-xs lg:text-sm font-bold">
                    96
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-landing-success font-semibold text-sm lg:text-base">₹7.0L CTC</span>
                  <Button size="sm" className="bg-landing-primary-dark hover:bg-landing-primary-dark/90 text-xs lg:text-sm px-2 lg:px-4">Apply Now</Button>
                </div>
              </Card>

              <Card className="p-3 lg:p-4 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-800 text-sm lg:text-base">Capgemini</h3>
                    <p className="text-gray-600 text-xs lg:text-sm">Software Engineer</p>
                  </div>
                  <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-landing-success text-white flex items-center justify-center text-xs lg:text-sm font-bold">
                    89
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-landing-success font-semibold text-sm lg:text-base">₹6.5L CTC</span>
                  <Button size="sm" className="bg-landing-primary-dark hover:bg-landing-primary-dark/90 text-xs lg:text-sm px-2 lg:px-4">Apply Now</Button>
                </div>
              </Card>

              <Card className="p-3 lg:p-4 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-800 text-sm lg:text-base">Wipro</h3>
                    <p className="text-gray-600 text-xs lg:text-sm">Project Engineer</p>
                  </div>
                  <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-landing-success text-white flex items-center justify-center text-xs lg:text-sm font-bold">
                    74
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-landing-success font-semibold text-sm lg:text-base">₹5.0L CTC</span>
                  <Button variant="outline" size="sm" className="text-xs lg:text-sm px-2 lg:px-4">View Details</Button>
                </div>
              </Card>

              <Card className="p-3 lg:p-4 hover:shadow-lg transition-shadow opacity-75">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-800 text-sm lg:text-base">Goldman Sachs</h3>
                    <p className="text-gray-600 text-xs lg:text-sm">Analyst</p>
                  </div>
                  <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gray-300 text-white flex items-center justify-center text-xs lg:text-sm font-bold">
                    --
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-landing-success font-semibold text-sm lg:text-base">₹12.0L CTC</span>
                  <div className="text-center">
                    <p className="text-red-500 text-xs lg:text-sm font-medium">Needs CGPA ≥ 8.0</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* AI Resume Score Section */}
          <Card className="p-4 lg:p-6">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg lg:text-xl font-bold text-gray-800">AI Resume Score</h2>
              <Badge className="bg-landing-accent text-landing-primary-dark text-xs lg:text-sm">AI Powered</Badge>
            </div>

            <div className="space-y-3 lg:space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-700 text-sm lg:text-base">DSA & Coding</span>
                  <span className="font-semibold text-gray-800 text-sm lg:text-base">88</span>
                </div>
                <Progress value={88} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-700 text-sm lg:text-base">Projects</span>
                  <span className="font-semibold text-gray-800 text-sm lg:text-base">72</span>
                </div>
                <Progress value={72} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-700 text-sm lg:text-base">Communication</span>
                  <span className="font-semibold text-gray-800 text-sm lg:text-base">65</span>
                </div>
                <Progress value={65} className="h-2" />
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs lg:text-sm text-blue-800">
                  <span className="font-semibold">Tip:</span> Add 1-2 more projects to boost your TCS match score to 99
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`w-full max-w-6xl mx-auto ${className}`}>
      {/* Title Section */}
      <div className="text-center mb-8 px-2">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-4">
          See the <span className="text-landing-accent">platform</span> in <span className="text-landing-accent">action</span>
        </h1>
        <p className="text-base sm:text-lg text-gray-600 mb-6 px-4">
          Click between portals to preview the actual interface.
        </p>

        {/* View Toggle */}
        <div className="inline-flex bg-gray-100 rounded-lg p-1">
          <Button
            variant={activeView === "coordinator" ? "default" : "ghost"}
            className={`rounded-md px-4 sm:px-6 py-2 text-sm sm:text-base ${
              activeView === "coordinator" 
                ? "bg-landing-primary-dark text-white" 
                : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => setActiveView("coordinator")}
          >
            Coordinator View
          </Button>
          <Button
            variant={activeView === "student" ? "default" : "ghost"}
            className={`rounded-md px-4 sm:px-6 py-2 text-sm sm:text-base ${
              activeView === "student" 
                ? "bg-landing-primary-dark text-white" 
                : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => setActiveView("student")}
          >
            Student View
          </Button>
        </div>
      </div>

      {/* Live Preview Container */}
      <div className="bg-gray-50 p-2 sm:p-4 rounded-xl shadow-xl">
        <div className="bg-white rounded-lg shadow-inner">
          {activeView === "coordinator" ? <CoordinatorPreview /> : <StudentPreview />}
        </div>
      </div>
    </div>
  );
}
