"use client";

import { useEffect, useState } from "react";
import { getDoctorAppointments } from "@/actions/doctor";
import { AppointmentCard } from "@/components/appointment-card";
import UploadReport from "@/components/UploadReport";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useFetch from "@/hooks/use-fetch";

export default function DoctorAppointmentsList() {
  const {
    loading,
    data,
    fn: fetchAppointments,
  } = useFetch(getDoctorAppointments);

  const [completedAppointments, setCompletedAppointments] = useState([]);

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    if (data?.appointments) {
      const completed = data.appointments.filter(
        (appointment) => appointment.status === "COMPLETED"
      );
      setCompletedAppointments(completed);
    }
  }, [data]);

  const appointments = data?.appointments || [];

  const handleReportUploaded = () => {
    // Refresh appointments to show updated report indicators
    fetchAppointments();
  };

  return (
    <Tabs defaultValue="upcoming" className="w-full">
      <TabsList className="grid w-full grid-cols-2 bg-muted/30 border">
        <TabsTrigger value="upcoming" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Upcoming Appointments
        </TabsTrigger>
        <TabsTrigger value="reports" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Upload Reports
        </TabsTrigger>
      </TabsList>

      <TabsContent value="upcoming" className="mt-6">
        <Card className="border-emerald-900/20">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-emerald-400" />
              Upcoming Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading appointments...</p>
              </div>
            ) : appointments.length > 0 ? (
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    userRole="DOCTOR"
                    refetchAppointments={fetchAppointments}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="text-xl font-medium text-white mb-2">
                  No upcoming appointments
                </h3>
                <p className="text-muted-foreground">
                  You don&apos;t have any scheduled appointments yet. Make sure
                  you&apos;ve set your availability to allow patients to book.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="reports" className="mt-6">
        <div className="space-y-4">
          {completedAppointments.length > 0 ? (
            completedAppointments.map((appointment) => (
              <div key={appointment.id} className="space-y-4">
                <Card className="border-emerald-900/20">
                  <CardHeader>
                    <CardTitle className="text-lg text-white">
                      Upload Report for: {appointment.patient.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Appointment on{" "}
                      {new Date(appointment.startTime).toLocaleDateString()} at{" "}
                      {new Date(appointment.startTime).toLocaleTimeString()}
                    </p>
                  </CardHeader>
                </Card>
                <UploadReport
                  appointmentId={appointment.id}
                  onReportUploaded={handleReportUploaded}
                />
              </div>
            ))
          ) : (
            <Card className="border-emerald-900/20">
              <CardContent className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="text-xl font-medium text-white mb-2">
                  No completed appointments
                </h3>
                <p className="text-muted-foreground">
                  You need to complete appointments before you can upload reports.
                  Mark appointments as completed to enable report uploads.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}
