import PageHeader from "@/components/page-header";
import { Stethoscope } from "lucide-react";
import React from "react";
export const metadata = {
  title: "Doctor Dashboard - MediMeet",
  description: "Manage your appointments and availability",
};

const DoctorDashboardLayout = ({ children }) => {
  return (
    <div>
      <PageHeader icon={<Stethoscope />} title={"Doctor Dashboard"} />

      {children}
    </div>
  );
};

export default DoctorDashboardLayout;
