import { useState } from "react";
import Header from "../layout/Header";

export default function HeaderExample() {
  const [activeTab, setActiveTab] = useState("Dashboard");
  
  return (
    <Header
      userName="Dr. Priya Sharma"
      userRole="coordinator"
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onLogout={() => console.log("Logout clicked")}
    />
  );
}
