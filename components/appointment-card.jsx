"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  Clock,
  User,
  Video,
  Stethoscope,
  X,
  Edit,
  Loader2,
  CheckCircle,
  FileText,
  Upload,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  cancelAppointment,
  addAppointmentNotes,
  markAppointmentCompleted,
} from "@/actions/doctor";
import { generateVideoToken } from "@/actions/appointments";
import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import UploadReport from "./UploadReport";

export function AppointmentCard({
  appointment,
  userRole,
  refetchAppointments,
}) {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState(null); // 'cancel', 'notes', 'video', 'complete', or 'upload'
  const [notes, setNotes] = useState(appointment.notes || "");
  const [reports, setReports] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  const router = useRouter();

  // UseFetch hooks for server actions
  const {
    loading: cancelLoading,
    fn: submitCancel,
    data: cancelData,
  } = useFetch(cancelAppointment);
  const {
    loading: notesLoading,
    fn: submitNotes,
    data: notesData,
  } = useFetch(addAppointmentNotes);
  const {
    loading: tokenLoading,
    fn: submitTokenRequest,
    data: tokenData,
  } = useFetch(generateVideoToken);
  const {
    loading: completeLoading,
    fn: submitMarkCompleted,
    data: completeData,
  } = useFetch(markAppointmentCompleted);

  // Fetch reports for this appointment
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch(`/api/reports?type=${userRole === "DOCTOR" ? "doctor" : "patient"}`);
        const data = await response.json();
        if (data.reports) {
          const appointmentReports = data.reports.filter(
            report => report.appointmentId === appointment.id
          );
          setReports(appointmentReports);
        }
      } catch (error) {
        console.error("Failed to fetch reports:", error);
      }
    };

    if (appointment.status === "COMPLETED") {
      fetchReports();
    }
  }, [appointment.id, appointment.status, userRole]);

  // Format date and time
  const formatDateTime = (dateString) => {
    try {
      return format(new Date(dateString), "MMMM d, yyyy 'at' h:mm a");
    } catch (e) {
      return "Invalid date";
    }
  };

  // Format time only
  const formatTime = (dateString) => {
    try {
      return format(new Date(dateString), "h:mm a");
    } catch (e) {
      return "Invalid time";
    }
  };

  // Check if appointment can be marked as completed
  const canMarkCompleted = () => {
    if (userRole !== "DOCTOR") {
      return false;
    }
    // Allow doctors to mark appointments as completed if they are scheduled or if end time has passed
    const now = new Date();
    const appointmentEndTime = new Date(appointment.endTime);
    return appointment.status === "SCHEDULED" || now > appointmentEndTime;
  };

  // Handle cancel appointment
  const handleCancelAppointment = async () => {
    if (cancelLoading) return;

    if (
      window.confirm(
        "Are you sure you want to cancel this appointment? This action cannot be undone."
      )
    ) {
      const formData = new FormData();
      formData.append("appointmentId", appointment.id);
      await submitCancel(formData);
    }
  };

  // Handle mark as completed
  const handleMarkCompleted = async () => {
    if (completeLoading) return;

    if (
      window.confirm(
        "Are you sure you want to mark this appointment as completed? This action cannot be undone."
      )
    ) {
      const formData = new FormData();
      formData.append("appointmentId", appointment.id);
      await submitMarkCompleted(formData);
    }
  };

  // Handle save notes (doctor only)
  const handleSaveNotes = async () => {
    if (notesLoading || userRole !== "DOCTOR") return;

    const formData = new FormData();
    formData.append("appointmentId", appointment.id);
    formData.append("notes", notes);
    await submitNotes(formData);
  };

  // Handle join video call
  const handleJoinVideoCall = async () => {
    if (tokenLoading) return;

    setAction("video");

    const formData = new FormData();
    formData.append("appointmentId", appointment.id);
    await submitTokenRequest(formData);
  };

  // Handle successful operations
  useEffect(() => {
    if (cancelData?.success) {
      toast.success("Appointment cancelled successfully");
      setOpen(false);
      if (refetchAppointments) {
        refetchAppointments();
      } else {
        router.refresh();
      }
    }
  }, [cancelData, refetchAppointments, router]);

  useEffect(() => {
    if (completeData?.success && userRole === "DOCTOR") {
      toast.success("Appointment marked as completed! You can now upload reports.");
      setShowUpload(true);
      setAction("upload");
      // Refresh reports list
      if (refetchAppointments) {
        refetchAppointments();
      } else {
        router.refresh();
      }
    }
  }, [completeData, userRole, refetchAppointments, router]);

  useEffect(() => {
    if (notesData?.success) {
      toast.success("Notes saved successfully");
      setAction(null);
      if (refetchAppointments) {
        refetchAppointments();
      } else {
        router.refresh();
      }
    }
  }, [notesData, refetchAppointments, router]);

  useEffect(() => {
    if (tokenData?.success) {
      // Redirect to video call page with token and session ID
      router.push(
        `/video-call?sessionId=${tokenData.videoSessionId}&token=${tokenData.token}&appointmentId=${appointment.id}`
      );
    } else if (tokenData?.error) {
      setAction(null);
    }
  }, [tokenData, appointment.id, router]);

  // Determine if appointment is active (within 30 minutes of start time)
  const isAppointmentActive = () => {
    const now = new Date();
    const appointmentTime = new Date(appointment.startTime);
    const appointmentEndTime = new Date(appointment.endTime);

    // Can join 30 minutes before start until end time
    return (
      (appointmentTime.getTime() - now.getTime() <= 30 * 60 * 1000 &&
        now < appointmentTime) ||
      (now >= appointmentTime && now <= appointmentEndTime)
    );
  };

  // Determine other party information based on user role
  const otherParty =
    userRole === "DOCTOR" ? appointment.patient : appointment.doctor;

  const otherPartyLabel = userRole === "DOCTOR" ? "Patient" : "Doctor";
  const otherPartyIcon = userRole === "DOCTOR" ? <User /> : <Stethoscope />;

  return (
    <>
      <Card className="border-emerald-900/20 hover:border-emerald-700/30 transition-all">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="bg-muted/20 rounded-full p-2 mt-1">
                {otherPartyIcon}
              </div>
              <div>
                <h3 className="font-medium text-white">
                  {userRole === "DOCTOR"
                    ? otherParty.name
                    : `Dr. ${otherParty.name}`}
                </h3>
                {userRole === "DOCTOR" && (
                  <p className="text-sm text-muted-foreground">
                    {otherParty.email}
                  </p>
                )}
                {userRole === "PATIENT" && (
                  <p className="text-sm text-muted-foreground">
                    {otherParty.specialty}
                  </p>
                )}
                <div className="flex items-center mt-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>{formatDateTime(appointment.startTime)}</span>
                </div>
                <div className="flex items-center mt-1 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>
                    {formatTime(appointment.startTime)} -{" "}
                    {formatTime(appointment.endTime)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 self-end md:self-start">
              <div className="flex gap-2">
                <Badge
                  variant="outline"
                  className={
                    appointment.status === "COMPLETED"
                      ? "bg-emerald-900/20 border-emerald-900/30 text-emerald-400"
                      : appointment.status === "CANCELLED"
                      ? "bg-red-900/20 border-red-900/30 text-red-400"
                      : "bg-amber-900/20 border-amber-900/30 text-amber-400"
                  }
                >
                  {appointment.status}
                </Badge>
                {appointment.status === "COMPLETED" && reports.length > 0 && userRole === "DOCTOR" && (
                  <Badge
                    variant="outline"
                    className="bg-blue-900/20 border-blue-900/30 text-blue-400 flex items-center gap-1"
                  >
                    <FileText className="h-3 w-3" />
                    {reports.length} Report{reports.length > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              <div className="flex gap-2 mt-2 flex-wrap">
                {userRole === "DOCTOR" && (appointment.status === "SCHEDULED" ||
                  (appointment.status !== "COMPLETED" && new Date() > new Date(appointment.endTime))) && (
                  <Button
                    size="sm"
                    onClick={handleMarkCompleted}
                    disabled={completeLoading}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {completeLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Complete
                      </>
                    )}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="border-emerald-900/30"
                  onClick={() => setOpen(true)}
                >
                  View Details
                </Button>
                {userRole === "DOCTOR" && (appointment.status === "COMPLETED" ||
                  (appointment.status !== "COMPLETED" && new Date() > new Date(appointment.endTime))) && (
                  <Button
                    size="sm"
                    onClick={() => setShowUpload(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Upload Report
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointment Details Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">
              Appointment Details
            </DialogTitle>
            <DialogDescription>
              {appointment.status === "SCHEDULED"
                ? "Manage your upcoming appointment"
                : "View appointment information"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Other Party Information */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                {otherPartyLabel}
              </h4>
              <div className="flex items-center">
                <div className="h-5 w-5 text-emerald-400 mr-2">
                  {otherPartyIcon}
                </div>
                <div>
                  <p className="text-white font-medium">
                    {userRole === "DOCTOR"
                      ? otherParty.name
                      : `Dr. ${otherParty.name}`}
                  </p>
                  {userRole === "DOCTOR" && (
                    <p className="text-muted-foreground text-sm">
                      {otherParty.email}
                    </p>
                  )}
                  {userRole === "PATIENT" && (
                    <p className="text-muted-foreground text-sm">
                      {otherParty.specialty}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Appointment Time */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Scheduled Time
              </h4>
              <div className="flex flex-col gap-1">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-emerald-400 mr-2" />
                  <p className="text-white">
                    {formatDateTime(appointment.startTime)}
                  </p>
                </div>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-emerald-400 mr-2" />
                  <p className="text-white">
                    {formatTime(appointment.startTime)} -{" "}
                    {formatTime(appointment.endTime)}
                  </p>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Status
              </h4>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={
                    appointment.status === "COMPLETED"
                      ? "bg-emerald-900/20 border-emerald-900/30 text-emerald-400"
                      : appointment.status === "CANCELLED"
                      ? "bg-red-900/20 border-red-900/30 text-red-400"
                      : "bg-amber-900/20 border-amber-900/30 text-amber-400"
                  }
                >
                  {appointment.status}
                </Badge>
                {appointment.status === "COMPLETED" && (
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                )}
              </div>
            </div>

            {/* Mark Complete Section - Show only for doctors */}
            {userRole === "DOCTOR" && (appointment.status === "SCHEDULED" ||
              (appointment.status !== "COMPLETED" && new Date() > new Date(appointment.endTime))) && (
              <div className="space-y-2 p-4 rounded-lg bg-emerald-900/10 border border-emerald-900/20">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-400" />
                  <h4 className="text-sm font-medium text-emerald-400">
                    Complete Appointment
                  </h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Mark this appointment as completed to enable report uploads and update the status.
                </p>
                <Button
                  onClick={handleMarkCompleted}
                  disabled={completeLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  size="lg"
                >
                  {completeLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Completing Appointment...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Mark Appointment as Completed
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Patient Description */}
            {appointment.patientDescription && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  {userRole === "DOCTOR"
                    ? "Patient Description"
                    : "Your Description"}
                </h4>
                <div className="p-3 rounded-md bg-muted/20 border border-emerald-900/20">
                  <p className="text-white whitespace-pre-line">
                    {appointment.patientDescription}
                  </p>
                </div>
              </div>
            )}

            {/* Join Video Call Button */}
            {appointment.status === "SCHEDULED" && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Video Consultation
                </h4>
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  disabled={
                    !isAppointmentActive() || action === "video" || tokenLoading
                  }
                  onClick={handleJoinVideoCall}
                >
                  {tokenLoading || action === "video" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Preparing Video Call...
                    </>
                  ) : (
                    <>
                      <Video className="h-4 w-4 mr-2" />
                      {isAppointmentActive()
                        ? "Join Video Call"
                        : "Video call will be available 30 minutes before appointment"}
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Upload Reports Section - Show only for doctors after completion or when appointment has ended */}
            {userRole === "DOCTOR" && (appointment.status === "COMPLETED" ||
              (userRole === "DOCTOR" && new Date() > new Date(appointment.endTime))) && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Medical Reports
                  </h4>
                  <Button
                    onClick={() => setShowUpload(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    size="sm"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Report to Cloudinary
                  </Button>
                </div>
                {reports.length > 0 ? (
                  <div className="p-3 rounded-md bg-muted/20 border border-emerald-900/20">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-emerald-400" />
                      <span className="text-white font-medium">
                        {reports.length} Report{reports.length > 1 ? 's' : ''} Available
                      </span>
                    </div>
                    <div className="space-y-1">
                      {reports.map((report) => (
                        <div key={report.id} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{report.title}</span>
                          <span className="text-xs text-emerald-400">
                            {format(new Date(report.createdAt), "MMM d, yyyy")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-md bg-muted/20 border border-emerald-900/20">
                    <p className="text-muted-foreground text-sm">
                      No reports uploaded yet. Click "Upload Report" to add medical reports for this appointment.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Show reports for patients (read-only) */}
            {userRole === "PATIENT" && appointment.status === "COMPLETED" && reports.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Medical Reports
                </h4>
                <div className="p-3 rounded-md bg-muted/20 border border-emerald-900/20">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-emerald-400" />
                    <span className="text-white font-medium">
                      {reports.length} Report{reports.length > 1 ? 's' : ''} Available
                    </span>
                  </div>
                  <div className="space-y-1">
                    {reports.map((report) => (
                      <div key={report.id} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{report.title}</span>
                        <span className="text-xs text-emerald-400">
                          {format(new Date(report.createdAt), "MMM d, yyyy")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Doctor Notes (Doctor can view/edit, Patient can only view) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Doctor Notes
                </h4>
                {userRole === "DOCTOR" &&
                  action !== "notes" &&
                  appointment.status !== "CANCELLED" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAction("notes")}
                      className="h-7 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/20"
                    >
                      <Edit className="h-3.5 w-3.5 mr-1" />
                      {appointment.notes ? "Edit" : "Add"}
                    </Button>
                  )}
              </div>

              {userRole === "DOCTOR" && action === "notes" ? (
                <div className="space-y-3">
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter your clinical notes here..."
                    className="bg-background border-emerald-900/20 min-h-[100px]"
                  />
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAction(null);
                        setNotes(appointment.notes || "");
                      }}
                      disabled={notesLoading}
                      className="border-emerald-900/30"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveNotes}
                      disabled={notesLoading}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {notesLoading ? (
                        <>
                          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Notes"
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-md bg-muted/20 border border-emerald-900/20 min-h-[80px]">
                  {appointment.notes ? (
                    <p className="text-white whitespace-pre-line">
                      {appointment.notes}
                    </p>
                  ) : (
                    <p className="text-muted-foreground italic">
                      No notes added yet
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
            <div className="flex gap-2">
              {/* Cancel Button - For scheduled appointments */}
              {appointment.status === "SCHEDULED" && (
                <Button
                  variant="outline"
                  onClick={handleCancelAppointment}
                  disabled={cancelLoading}
                  className="border-red-900/30 text-red-400 hover:bg-red-900/10"
                >
                  {cancelLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 mr-1" />
                      Cancel Appointment
                    </>
                  )}
                </Button>
              )}

              {/* Mark as Complete Button - Show only for doctors */}
              {userRole === "DOCTOR" && (appointment.status === "SCHEDULED" ||
                (appointment.status !== "COMPLETED" && new Date() > new Date(appointment.endTime))) && (
                <Button
                  onClick={handleMarkCompleted}
                  disabled={completeLoading}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {completeLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Completing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Mark Complete
                    </>
                  )}
                </Button>
              )}

              {/* Upload Report Button - Show only for doctors */}
              {userRole === "DOCTOR" && (appointment.status === "COMPLETED" ||
                (appointment.status !== "COMPLETED" && new Date() > new Date(appointment.endTime))) && (
                <Button
                  onClick={() => setShowUpload(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Report
                </Button>
              )}
            </div>

            <Button
              onClick={() => setOpen(false)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Report Dialog */}
      {showUpload && (
        <UploadReport
          appointmentId={appointment.id}
          patientName={otherParty.name}
          onClose={() => {
            setShowUpload(false);
            setAction(null);
          }}
          onSuccess={() => {
            setShowUpload(false);
            setAction(null);
            // Refresh reports
            const fetchReports = async () => {
              try {
                const response = await fetch(`/api/reports?type=doctor`);
                const data = await response.json();
                if (data.reports) {
                  const appointmentReports = data.reports.filter(
                    report => report.appointmentId === appointment.id
                  );
                  setReports(appointmentReports);
                }
              } catch (error) {
                console.error("Failed to fetch reports:", error);
              }
            };
            fetchReports();
            if (refetchAppointments) {
              refetchAppointments();
            } else {
              router.refresh();
            }
          }}
        />
      )}
    </>
  );
}
