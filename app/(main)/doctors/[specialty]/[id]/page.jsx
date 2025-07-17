import { getAvailableTimeSlots, getDoctorById } from "@/actions/appointments";
import { redirect } from "next/navigation";
import React from "react";
import DoctorProfile from "./_components/doctor-profile";

const DoctorProfilePage = async ({ params }) => {
  const { id } = await params;

  try {
    // Fetch doctor data and available slots in parallel
    const [doctorData, slotsData] = await Promise.all([
      getDoctorById(id),
      getAvailableTimeSlots(id),
    ]);

    return (
      <DoctorProfile
        doctor={JSON.parse(JSON.stringify(doctorData.doctor))}
        availableDays={JSON.parse(JSON.stringify(slotsData.days)) || []}
      />
    );
  } catch (error) {
    console.error("Error loading doctor profile:", error);
    redirect("/doctors");
  }
};

export default DoctorProfilePage;
