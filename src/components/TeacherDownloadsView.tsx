"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRight, Upload, Check, Copy, Video, FileText, File, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface SavedUpload {
  id: number;
  teacherId: number;
  fileName: string;
  fileType: 'video' | 'pdf' | 'homework';
  fileSize: number;
  filePath: string;
  fileUrl: string;
  mimeType: string | null;
  createdAt: string;
}

interface UploadProgress {
  id: string;
  fileName: string;
  progress: number;
  url: string | null;
  type: 'video' | 'pdf' | 'homework';
  savedId?: number;
}

interface TeacherDownloadsViewProps {
  onBack: () => void;
}

export function TeacherDownloadsView({ onBack }: TeacherDownloadsViewProps) {
  const { user } = useAuth();
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchSavedUploads();
    }
  }, [user?.id]);

  const fetchSavedUploads = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/teacher-uploads?teacherId=${user?.id}`);
      if (response.ok) {
        const savedUploads: SavedUpload[] = await response.json();
        const convertedUploads: UploadProgress[] = savedUploads.map(upload => ({
          id: `saved_${upload.id}`,
          fileName: upload.fileName,
          progress: 100,
          url: upload.fileUrl,
          type: upload.fileType,
          savedId: upload.id,
        }));
        setUploads(convertedUploads);
      }
    } catch (error) {
      console.error('Error fetching uploads:', error);
      toast.error('خطأ في تحميل الملفات المحفوظة');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: 'video' | 'pdf' | 'homework') => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user?.id) return;

    for (const file of Array.from(files)) {
      const uploadId = `${Date.now()}_${Math.random()}`;
      const newUpload: UploadProgress = {
        id: uploadId,
        fileName: file.name,
        progress: 0,
        url: null,
        type,
      };

      setUploads((prev) => [...prev, newUpload]);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('teacherId', user.id.toString());
        formData.append('fileType', type);

        const progressInterval = setInterval(() => {
          setUploads((prev) =>
            prev.map((u) =>
              u.id === uploadId && u.progress < 90
                ? { ...u, progress: u.progress + 10 }
                : u
            )
          );
        }, 200);

        const response = await fetch('/api/teacher-uploads', {
          method: 'POST',
          body: formData,
        });

        clearInterval(progressInterval);

        if (response.ok) {
          const savedUpload: SavedUpload = await response.json();
          setUploads((prev) =>
            prev.map((u) =>
              u.id === uploadId
                ? {
                    ...u,
                    progress: 100,
                    url: savedUpload.fileUrl,
                    savedId: savedUpload.id,
                    id: `saved_${savedUpload.id}`,
                  }
                : u
            )
          );
          toast.success('تم رفع الملف بنجاح!');
        } else {
          const error = await response.json();
          toast.error(error.error || 'خطأ في رفع الملف');
          setUploads((prev) => prev.filter((u) => u.id !== uploadId));
        }
      } catch (error) {
        console.error('Upload error:', error);
        toast.error('خطأ في رفع الملف');
        setUploads((prev) => prev.filter((u) => u.id !== uploadId));
      }
    }

    e.target.value = '';
  };

  const copyToClipboard = (url: string) => {
    const fullUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}${url}`
      : url;
    navigator.clipboard.writeText(fullUrl);
    toast.success('تم نسخ الرابط!');
  };

  const deleteFile = async (upload: UploadProgress) => {
    if (!user?.id || !upload.savedId) {
      setUploads((prev) => prev.filter((u) => u.id !== upload.id));
      return;
    }

    try {
      const response = await fetch(
        `/api/teacher-uploads?id=${upload.savedId}&teacherId=${user.id}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        setUploads((prev) => prev.filter((u) => u.id !== upload.id));
        toast.success('تم حذف الملف');
      } else {
        toast.error('خطأ في حذف الملف');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('خطأ في حذف الملف');
    }
  };

  const getFileIcon = (type: 'video' | 'pdf' | 'homework') => {
    switch (type) {
      case 'video':
        return <Video className="w-5 h-5 text-primary" />;
      case 'pdf':
        return <FileText className="w-5 h-5 text-primary" />;
      case 'homework':
        return <File className="w-5 h-5 text-primary" />;
    }
  };

  const videoUploads = uploads.filter(u => u.type === 'video');
  const pdfUploads = uploads.filter(u => u.type === 'pdf');
  const homeworkUploads = uploads.filter(u => u.type === 'homework');

  const renderUploadsList = (uploadsList: UploadProgress[]) => {
    if (uploadsList.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          لا توجد ملفات مرفوعة
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {uploadsList.map((upload) => (
          <div key={upload.id} className="border border-border rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                {upload.progress === 100 ? (
                  <Check className="w-5 h-5 text-green-500" />
                ) : (
                  getFileIcon(upload.type)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-foreground truncate">
                    {upload.fileName}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {upload.progress}%
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteFile(upload)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                {upload.progress < 100 && (
                  <Progress value={upload.progress} className="h-2 mb-2" />
                )}
                {upload.url && (
                  <div className="flex items-center gap-2 mt-3">
                    <Input
                      value={typeof window !== 'undefined' ? `${window.location.origin}${upload.url}` : upload.url}
                      readOnly
                      className="text-xs"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(upload.url!)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowRight className="w-4 h-4 ml-2" />
            رجوع
          </Button>
          <h1 className="text-2xl font-bold text-foreground">رفع الملفات</h1>
          <p className="text-sm text-muted-foreground mt-1">
            قم برفع الفيديوهات وملفات PDF والواجبات - الملفات محفوظة ولن تختفي
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Video className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">فيديو</h3>
                <p className="text-xs text-muted-foreground">MP4, AVI, MOV</p>
              </div>
            </div>
            <Label htmlFor="video-upload" className="cursor-pointer">
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">اضغط لرفع فيديو</p>
              </div>
              <Input
                id="video-upload"
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => handleFileSelect(e, 'video')}
                multiple
              />
            </Label>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">PDF المذاكرة</h3>
                <p className="text-xs text-muted-foreground">ملفات PDF</p>
              </div>
            </div>
            <Label htmlFor="pdf-upload" className="cursor-pointer">
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">اضغط لرفع PDF</p>
              </div>
              <Input
                id="pdf-upload"
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => handleFileSelect(e, 'pdf')}
                multiple
              />
            </Label>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <File className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">واجبات</h3>
                <p className="text-xs text-muted-foreground">PDF الواجبات</p>
              </div>
            </div>
            <Label htmlFor="homework-upload" className="cursor-pointer">
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">اضغط لرفع واجب</p>
              </div>
              <Input
                id="homework-upload"
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => handleFileSelect(e, 'homework')}
                multiple
              />
            </Label>
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">الملفات المرفوعة</h2>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">
                الكل ({uploads.length})
              </TabsTrigger>
              <TabsTrigger value="video">
                فيديوهات ({videoUploads.length})
              </TabsTrigger>
              <TabsTrigger value="pdf">
                PDFs ({pdfUploads.length})
              </TabsTrigger>
              <TabsTrigger value="homework">
                واجبات ({homeworkUploads.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-4">
              {renderUploadsList(uploads)}
            </TabsContent>
            
            <TabsContent value="video" className="mt-4">
              {renderUploadsList(videoUploads)}
            </TabsContent>
            
            <TabsContent value="pdf" className="mt-4">
              {renderUploadsList(pdfUploads)}
            </TabsContent>
            
            <TabsContent value="homework" className="mt-4">
              {renderUploadsList(homeworkUploads)}
            </TabsContent>
          </Tabs>
        </Card>
      </main>
    </div>
  );
}