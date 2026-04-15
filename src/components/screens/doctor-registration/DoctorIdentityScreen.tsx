import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Upload, Camera, CheckCircle, FileText, User } from 'lucide-react';

interface DoctorIdentityScreenProps {
  onSubmit: () => void;
  onBack: () => void;
  currentStep: number;
  totalSteps: number;
}

type IdType = 'aadhaar' | 'passport' | 'driving-license' | 'voter-id';

export function DoctorIdentityScreen({ onSubmit, onBack, currentStep, totalSteps }: DoctorIdentityScreenProps) {
  const [selectedIdType, setSelectedIdType] = useState<IdType | null>(null);
  const [idUploaded, setIdUploaded] = useState(false);
  const [selfieUploaded, setSelfieUploaded] = useState(false);
  const [photoUploaded, setPhotoUploaded] = useState(false);

  const idOptions: { value: IdType; label: string }[] = [
    { value: 'aadhaar', label: 'Aadhaar Card' },
    { value: 'passport', label: 'Passport' },
    { value: 'driving-license', label: 'Driving License' },
    { value: 'voter-id', label: 'Voter ID' },
  ];

  const isValid = selectedIdType && idUploaded && selfieUploaded;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-secondary">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Verify Your Identity</h1>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 flex-1 rounded-full ${i < currentStep ? 'bg-primary' : 'bg-secondary'}`}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">Step {currentStep} of {totalSteps}</p>
      </div>

      <div className="flex-1 px-5 py-6 space-y-6">
        {/* ID Type Selection */}
        <div className="space-y-3">
          <Label>Select Identity Proof</Label>
          <div className="grid grid-cols-2 gap-2">
            {idOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedIdType(option.value)}
                className={`p-3 rounded-xl border text-sm font-medium text-left transition-all ${
                  selectedIdType === option.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-foreground hover:border-primary/50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* ID Upload */}
        {selectedIdType && (
          <div className="space-y-3">
            <Label>Upload {idOptions.find(o => o.value === selectedIdType)?.label}</Label>
            <button
              onClick={() => setIdUploaded(true)}
              className={`w-full p-6 rounded-xl border-2 border-dashed transition-all ${
                idUploaded 
                  ? 'border-success bg-success/5' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex flex-col items-center gap-3">
                {idUploaded ? (
                  <>
                    <CheckCircle className="w-10 h-10 text-success" />
                    <span className="text-sm font-medium text-success">Document uploaded</span>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                      <FileText className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div className="text-center">
                      <span className="text-sm font-medium text-foreground">Tap to upload</span>
                      <p className="text-xs text-muted-foreground mt-1">JPG, PNG or PDF • Max 5MB</p>
                    </div>
                  </>
                )}
              </div>
            </button>
          </div>
        )}

        {/* Live Selfie */}
        <div className="space-y-3">
          <Label>Live Selfie Capture</Label>
          <button
            onClick={() => setSelfieUploaded(true)}
            className={`w-full p-6 rounded-xl border-2 border-dashed transition-all ${
              selfieUploaded 
                ? 'border-success bg-success/5' 
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="flex flex-col items-center gap-3">
              {selfieUploaded ? (
                <>
                  <CheckCircle className="w-10 h-10 text-success" />
                  <span className="text-sm font-medium text-success">Selfie captured</span>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                    <Camera className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <span className="text-sm font-medium text-foreground">Take a live selfie</span>
                    <p className="text-xs text-muted-foreground mt-1">Used for face verification</p>
                  </div>
                </>
              )}
            </div>
          </button>
        </div>

        {/* Passport Photo (Optional) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Passport Size Photo</Label>
            <span className="text-xs text-muted-foreground">Optional</span>
          </div>
          <button
            onClick={() => setPhotoUploaded(true)}
            className={`w-full p-4 rounded-xl border transition-all ${
              photoUploaded 
                ? 'border-success bg-success/5' 
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="flex items-center gap-3">
              {photoUploaded ? (
                <>
                  <CheckCircle className="w-8 h-8 text-success" />
                  <span className="text-sm font-medium text-success">Photo uploaded</span>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-medium text-foreground">Upload passport photo</span>
                    <p className="text-xs text-muted-foreground">For your profile display</p>
                  </div>
                </>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* CTA */}
      <div className="sticky bottom-0 bg-background border-t border-border px-5 py-4">
        <Button 
          variant="accent" 
          size="xl" 
          className="w-full" 
          onClick={onSubmit}
          disabled={!isValid}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
