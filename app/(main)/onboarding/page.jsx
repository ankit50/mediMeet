"use client";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { min } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Stethoscope, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import useFetch from "@/hooks/use-fetch";
import { setUserRole } from "@/actions/onboarding";
import { Router } from "next/router";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
const doctorFormSchema = z.object({
  speciality: z.string().min(1, "Speciality is required"),
  experience: z.number().min(1, "Experience must be at least one year"),
  credentialUrl: z.url().min(1),
  description: z
    .string()
    .min(20, "Description must be at least 20 Characters")
    .max(2000, "Description must be at most 2000 Characters"),
});

const OnboardingPage = () => {
  const [step, setStep] = useState("choose-role");
  const router = useRouter();
  const { data, fn: submitUserRole, loading } = useFetch(setUserRole);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(doctorFormSchema),
  });

  const handlePatientSelection = async () => {
    if (loading) return;
    const formData = new FormData();
    formData.append("role", "PATIENT");
    await submitUserRole(formData);
  };

  useEffect(() => {
    if (data && data?.success) {
      toast.success("Role Selected");
      router.push(data.redirect);
    }
  }, [data]);

  // Role selection screen
  if (step === "choose-role") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card
          onClick={() => !loading && handlePatientSelection()}
          className="border-emerald-900/20 hover:border-emerald-700/40 cursor-pointer transition-all"
        >
          <CardContent className="pt-6 pb-6 flex flex-col items-center text-center">
            <div className="p-4 bg-emerald-900/20 rounded-full mb-4">
              <User className="h-8 w-8 text-emerald-400" />
            </div>
            <CardTitle className="text-xl font-semibold text-white mb-2">
              Join as a Patient
            </CardTitle>
            <CardDescription className="mb-4">
              Book appointments, consult with doctors, and manage your
              healthcare journey
            </CardDescription>
            <Button
              className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing....
                </>
              ) : (
                "Conitnue as Patient"
              )}
            </Button>
          </CardContent>
        </Card>

        <Card
          onClick={() => {
            !loading && setStep("doctor-form");
          }}
          className="border-emerald-900/20 hover:border-emerald-700/40 cursor-pointer transition-all"
        >
          <CardContent className="pt-6 pb-6 flex flex-col items-center text-center">
            <div className="p-4 bg-emerald-900/20 rounded-full mb-4">
              <Stethoscope className="h-8 w-8 text-emerald-400" />
            </div>
            <CardTitle className="text-xl font-semibold text-white mb-2">
              Join as a Doctor
            </CardTitle>
            <CardDescription className="mb-4">
              Create your professional profile, set your availability, and
              provide consultations
            </CardDescription>
            <Button className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700">
              Continue as Doctor
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  if (step == "doctor-form") {
    return <>dsfdgsdrfg</>;
  }
};

export default OnboardingPage;
