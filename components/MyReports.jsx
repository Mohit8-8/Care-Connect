"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  Eye,
  Calendar,
  User,
  ExternalLink,
  ImageIcon,
} from "lucide-react";

export default function MyReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await fetch("/api/reports?type=patient");
      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setReports(data.reports || []);
      }
    } catch (err) {
      setError("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (report) => {
    try {
      // Fetch the file
      const response = await fetch(report.fileUrl);
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Set filename from report title or use default
      const filename = report.title ? `${report.title}.${report.fileType.split('/')[1]}` : 'report';
      link.download = filename;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback to opening in new tab if download fails
      window.open(report.fileUrl, "_blank");
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith("image/")) {
      return <ImageIcon className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600">
            <p>{error}</p>
            <Button
              onClick={fetchReports}
              variant="outline"
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          My Reports ({reports.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {reports.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No reports available yet.</p>
            <p className="text-sm">
              Reports from your completed appointments will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getFileIcon(report.fileType)}
                      <h3 className="font-medium">{report.title}</h3>
                      <Badge variant="outline" className="text-xs">
                        {report.status}
                      </Badge>
                    </div>

                    {report.description && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {report.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Dr. {report.doctor.name}
                        {report.doctor.specialty && (
                          <span className="text-emerald-600">
                            ({report.doctor.specialty})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(report.createdAt)}
                      </div>

                      <div className="text-xs">
                        {formatFileSize(report.fileSize)}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(report)}
                      className="flex items-center gap-1"
                    >
                      <Download className="h-3 w-3" />
                      Download
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(report.fileUrl, "_blank")}
                      className="flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View
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
