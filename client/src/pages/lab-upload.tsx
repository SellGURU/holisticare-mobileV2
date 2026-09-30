import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/lib/auth";
import { formatRelativeDate, formatFileSize } from "@/lib/utils";
import { 
  ArrowLeft,
  Camera, 
  Upload, 
  Mail,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react";
import { Link } from "wouter";

export default function LabUpload() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dragActive, setDragActive] = useState(false);

  const { data: recentUploads = [] } = useQuery({
    queryKey: ["/api/recent-uploads"],
    queryFn: async () => {
      // This would fetch recent file uploads - for now return empty array
      return [];
    }
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: authService.getAuthHeaders(),
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "File uploaded successfully",
        description: `Your lab results are being processed. File ID: ${data.fileId}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/recent-uploads"] });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select a PDF, JPG, or PNG file.",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const triggerFileInput = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png';
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        handleFileSelect(files[0]);
      }
    };
    input.click();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'processing':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'error':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 p-4">
        <div className="flex items-center">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mr-4">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Upload Lab Results</h2>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Upload Options */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Choose Upload Method</h3>
          
          <div className="space-y-4">
            {/* Camera Upload - Mobile only */}
            <Card className="cursor-pointer hover:shadow-md transition-all border-2 hover:border-primary md:hidden">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Camera className="w-8 h-8 text-primary" />
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Take Photo</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Use your camera to capture lab reports</p>
                </div>
              </CardContent>
            </Card>

            {/* File Upload */}
            <Card 
              className={`ui-press cursor-pointer transition-all duration-200 border-2 ${
                dragActive 
                  ? 'border-primary bg-primary/5 scale-[1.01]' 
                  : 'border-dashed border-gray-300 hover:border-primary'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={triggerFileInput}
            >
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-8 h-8 text-secondary" />
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {uploadMutation.isPending ? 'Uploading...' : 'Upload Files'}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {dragActive ? 'Drop your file here' : 'PDF, JPG, PNG formats supported (max 10MB)'}
                  </p>
                  {uploadMutation.isPending && (
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                      <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Email Import */}
            <Card className="ui-press cursor-pointer hover:shadow-md transition-all border-2 hover:border-primary">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-accent" />
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Email Import</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Forward lab results from your email</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Coming soon</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Uploads */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Uploads</h3>
          
          {recentUploads.length > 0 ? (
            <div className="space-y-3">
              {recentUploads.map((upload: any) => (
                <Card key={upload.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
                        <FileText className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">{upload.originalName}</h4>
                        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                          <span>{formatFileSize(upload.size)}</span>
                          <span>•</span>
                          <span>{formatRelativeDate(upload.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(upload.processed ? 'processed' : 'processing')}
                        <Badge className={getStatusColor(upload.processed ? 'processed' : 'processing')}>
                          {upload.processed ? 'Processed' : 'Processing'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-gray-400 mb-2">📄</div>
                <p className="text-gray-600 dark:text-gray-400">No uploads yet</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  Upload your first lab results to get started
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Upload Tips */}
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-blue-900 dark:text-blue-100 text-base">Upload Tips</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Ensure text is clear and readable in photos</li>
              <li>• Include all pages of multi-page reports</li>
              <li>• PDF files are processed faster than images</li>
              <li>• Files are encrypted and securely stored</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
