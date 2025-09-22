"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Upload,
  FileText,
  X,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";

export default function UploadReport({ appointmentId, onReportUploaded }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    file: null,
  });
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileSelect = (file) => {
    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
      "image/gif",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Allowed: PDF, DOC, DOCX, JPEG, PNG, GIF");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size too large. Maximum 10MB allowed");
      return;
    }

    setFormData(prev => ({
      ...prev,
      file: file,
    }));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.file) {
      toast.error("Please provide a title and select a file");
      return;
    }

    setLoading(true);

    try {
      const submitFormData = new FormData();
      submitFormData.append("appointmentId", appointmentId);
      submitFormData.append("title", formData.title);
      submitFormData.append("description", formData.description);
      submitFormData.append("file", formData.file);

      const response = await fetch("/api/reports", {
        method: "POST",
        body: submitFormData,
      });

      const data = await response.json();

      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success("✅ Report uploaded to Cloudinary successfully! Patient can now access it.");
        setFormData({
          title: "",
          description: "",
          file: null,
        });
        if (onReportUploaded) {
          onReportUploaded();
        }
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload report");
    } finally {
      setLoading(false);
    }
  };

  const removeFile = () => {
    setFormData(prev => ({
      ...prev,
      file: null,
    }));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Card className="border-emerald-900/30 bg-gradient-to-br from-emerald-900/10 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-emerald-400">
          <Upload className="h-6 w-6" />
          Upload Medical Report to Cloudinary
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Upload patient reports, test results, or medical documents. Files are securely stored on Cloudinary and will be available to the patient.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Report Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="e.g., Blood Test Results, X-Ray Report"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Add any additional notes or context about this report..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>File Upload *</Label>

            {!formData.file ? (
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragActive
                    ? "border-emerald-500 bg-emerald-900/10"
                    : "border-emerald-900/30 hover:border-emerald-700/50"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="h-8 w-8 mx-auto mb-2 text-emerald-400" />
                <p className="text-sm text-muted-foreground mb-2">
                  Drag and drop your medical file here, or click to browse
                </p>
                <p className="text-xs text-emerald-400 font-medium mb-1">
                  📤 Files will be securely uploaded to Cloudinary
                </p>
                <p className="text-xs text-muted-foreground">
                  Supported: PDF, DOC, DOCX, JPEG, PNG, GIF (Max 10MB)
                </p>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                  id="file-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3 border-emerald-900/30"
                  onClick={() => document.getElementById("file-upload").click()}
                >
                  Choose File
                </Button>
              </div>
            ) : (
              <div className="border rounded-lg p-4 bg-muted/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-emerald-400" />
                    <div>
                      <p className="text-sm font-medium">{formData.file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(formData.file.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeFile}
                    className="text-red-400 hover:text-red-300"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading || !formData.title || !formData.file}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Uploading to Cloudinary...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-5 w-5" />
                Upload Report to Cloudinary
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
