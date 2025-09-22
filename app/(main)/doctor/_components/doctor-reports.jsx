"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  Calendar,
  User,
  Clock,
  FileText,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import UploadReport from "@/components/UploadReport";

export function DoctorReports() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await fetch("/api/appointments/doctor");
      const data = await response.json();

      if (data.error) {
        toast.error(data.error);
      } else {
        // Filter appointments that are completed or have ended (ready for reports)
        const eligibleAppointments = data.appointments.filter(appointment => {
          const now = new Date();
          const appointmentEndTime = new Date(appointment.endTime);
          return appointment.status === "COMPLETED" || now > appointmentEndTime;
        });
        setAppointments(eligibleAppointments);
      }
    } catch (error) {
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusIcon = (appointment) => {
    if (appointment.status === "COMPLETED") {
      return <CheckCircle className="h-4 w-4 text-green-400" />;
    }
    return <AlertCircle className="h-4 w-4 text-yellow-400" />;
  };

  const getStatusText = (appointment) => {
    if (appointment.status === "COMPLETED") {
      return "Completed";
    }
    return "Ready for Report";
  };

  const handleUploadClick = (appointment) => {
    setSelectedAppointment(appointment);
    setShowUpload(true);
  };

  const handleReportUploaded = () => {
    setShowUpload(false);
    setSelectedAppointment(null);
    fetchAppointments(); // Refresh the list
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Medical Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (showUpload && selectedAppointment) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Report for {selectedAppointment.patient?.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 bg-muted/20 rounded-lg border border-emerald-900/20">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(selectedAppointment.startTime)}</span>
              <Clock className="h-4 w-4 ml-2" />
              <span>{formatTime(selectedAppointment.startTime)} - {formatTime(selectedAppointment.endTime)}</span>
            </div>
          </div>
          <UploadReport
            appointmentId={selectedAppointment.id}
            onReportUploaded={handleReportUploaded}
          />
          <Button
            variant="outline"
            onClick={() => setShowUpload(false)}
            className="mt-4"
          >
            Back to Reports
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Medical Reports
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Upload medical reports for completed appointments. Files are securely stored on Cloudinary and become available to patients.
        </p>
      </CardHeader>
      <CardContent>
        {appointments.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              No appointments ready for reports
            </h3>
            <p className="text-sm text-muted-foreground">
              Completed appointments will appear here for report uploads.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="p-4 border rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{appointment.patient?.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {getStatusText(appointment)}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(appointment.startTime)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                      </div>
                    </div>

                    {appointment.notes && (
                      <p className="text-sm text-muted-foreground mt-2">
                        <strong>Notes:</strong> {appointment.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {getStatusIcon(appointment)}
                    <Button
                      onClick={() => handleUploadClick(appointment)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      size="sm"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Report
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
