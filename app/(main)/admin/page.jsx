import { getPendingDoctors, getVerifiedDoctors } from "@/actions/admin";
import { TabsContent } from "@/components/ui/tabs";
import React from "react";
import PendingDoctors from "./_components/pending-doctors";
import VerifiedDoctors from "./_components/verified-doctors";

const AdminPage = async () => {
  const [pendingDoctorsData, verifiedDoctrorsData] = await Promise.all([
    getPendingDoctors(),
    getVerifiedDoctors(),
  ]);
  return (
    <div>
      <TabsContent value="pending" className="border-none p-0">
        <PendingDoctors
          doctors={JSON.parse(JSON.stringify(pendingDoctorsData.doctors)) || []}
        />
      </TabsContent>
      <TabsContent className="border-none p-0" value="doctors">
        <VerifiedDoctors
          doctors={
            JSON.parse(JSON.stringify(verifiedDoctrorsData.doctors)) || []
          }
        />
      </TabsContent>
    </div>
  );
};

export default AdminPage;
