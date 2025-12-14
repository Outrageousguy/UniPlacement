import StatsCard from "../StatsCard";
import { Building2, Users, TrendingUp, CheckCircle } from "lucide-react";

export default function StatsCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
      <StatsCard
        title="Active Drives"
        value={12}
        subtitle="8 closing this week"
        icon={Building2}
      />
      <StatsCard
        title="Students Placed"
        value="45/120"
        subtitle="37.5% placement rate"
        icon={CheckCircle}
        trend={{ value: 12, isPositive: true }}
      />
      <StatsCard
        title="Total Students"
        value={120}
        subtitle="Registered students"
        icon={Users}
      />
      <StatsCard
        title="Avg Package"
        value="8.5 LPA"
        subtitle="This season"
        icon={TrendingUp}
        trend={{ value: 15, isPositive: true }}
      />
    </div>
  );
}
