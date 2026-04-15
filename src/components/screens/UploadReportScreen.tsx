import { Button } from '@/components/ui/button';
import { ArrowLeft, Upload, FileText, Image, X, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

interface UploadReportScreenProps {
  onUpload: (data: { name: string; type: string }) => void;
  onBack: () => void;
}

interface UploadedFile {
  id: string;
  name: string;
  type: 'report' | 'image';
  size: string;
}

export function UploadReportScreen({ onUpload, onBack }: UploadReportScreenProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleUpload = (type: 'report' | 'image') => {
    setUploading(true);
    
    // Simulate upload
    setTimeout(() => {
      const newFile: UploadedFile = {
        id: Date.now().toString(),
        name: type === 'report' ? `Blood_Test_Report_${Date.now()}.pdf` : `Medical_Image_${Date.now()}.jpg`,
        type,
        size: type === 'report' ? '2.4 MB' : '1.8 MB',
      };
      setFiles((prev) => [...prev, newFile]);
      setUploading(false);
    }, 1500);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSave = () => {
    setSuccess(true);
    setTimeout(() => {
      onUpload({ name: 'Report', type: 'report' });
    }, 1500);
  };

  if (success) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center px-5">
        <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-12 h-12 text-success" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Upload Successful!</h2>
        <p className="text-muted-foreground mt-1 text-center">
          Your reports have been saved to health records
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="px-5 pt-12 pb-6">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mb-4">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-2xl font-bold text-foreground">Upload Report</h1>
        <p className="text-muted-foreground mt-1">Add medical reports to your health records</p>
      </div>

      <div className="flex-1 px-5 space-y-6">
        {/* Upload Options */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleUpload('report')}
            disabled={uploading}
            className="p-6 rounded-2xl border-2 border-dashed border-border hover:border-primary bg-card flex flex-col items-center gap-3 transition-all disabled:opacity-50"
          >
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="w-7 h-7 text-primary" />
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground">Upload Report</p>
              <p className="text-xs text-muted-foreground">PDF, DOC files</p>
            </div>
          </button>

          <button
            onClick={() => handleUpload('image')}
            disabled={uploading}
            className="p-6 rounded-2xl border-2 border-dashed border-border hover:border-primary bg-card flex flex-col items-center gap-3 transition-all disabled:opacity-50"
          >
            <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center">
              <Image className="w-7 h-7 text-accent" />
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground">Take Photo</p>
              <p className="text-xs text-muted-foreground">JPG, PNG files</p>
            </div>
          </button>
        </div>

        {/* Uploading State */}
        {uploading && (
          <div className="bg-card rounded-2xl p-4 border border-border flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
              <Upload className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">Uploading...</p>
              <div className="h-1 bg-secondary rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '60%' }} />
              </div>
            </div>
          </div>
        )}

        {/* Uploaded Files */}
        {files.length > 0 && (
          <div>
            <h3 className="font-semibold text-foreground mb-3">Uploaded Files</h3>
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="bg-card rounded-xl p-4 border border-border flex items-center gap-3"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    file.type === 'report' ? 'bg-primary/10' : 'bg-accent/10'
                  }`}>
                    {file.type === 'report' ? (
                      <FileText className="w-5 h-5 text-primary" />
                    ) : (
                      <Image className="w-5 h-5 text-accent" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{file.size}</p>
                  </div>
                  <button
                    onClick={() => removeFile(file.id)}
                    className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center"
                  >
                    <X className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="bg-accent/10 rounded-2xl p-4">
          <p className="text-sm text-muted-foreground">
            🔒 Your reports are securely stored and only shared with doctors during consultations.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="p-5 pb-8">
        <Button
          variant="default"
          size="xl"
          className="w-full"
          disabled={files.length === 0}
          onClick={handleSave}
        >
          Save to Health Records
        </Button>
      </div>
    </div>
  );
}
