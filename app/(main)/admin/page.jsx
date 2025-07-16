import { getPendingDoctors, getVerifiedDoctors } from "@/actions/admin";
import { TabsContent } from "@/components/ui/tabs";
import React from "react";

const AdminPage = async () => {
  const [pendingDoctorsData, verifiedDoctrorsData] = await Promise.all([
    getPendingDoctors(),
    getVerifiedDoctors(),
  ]);
  return (
    <div>
      <TabsContent value="pending" className="border-none p-0">
        Make changes to your account here.
      </TabsContent>
      <TabsContent className="border-none p-0" value="doctors">
        Change your password here.
      </TabsContent>
    </div>
  );
};

export default AdminPage;
