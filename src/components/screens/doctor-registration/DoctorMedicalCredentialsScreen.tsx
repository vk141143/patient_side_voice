import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Upload, CheckCircle, FileText, Info, GraduationCap } from 'lucide-react';

interface DoctorMedicalCredentialsScreenProps {
  onSubmit: () => void;
  onBack: () => void;
  currentStep: number;
  totalSteps: number;
}

export function DoctorMedicalCredentialsScreen({ onSubmit, onBack, currentStep, totalSteps }: DoctorMedicalCredentialsScreenProps) {
  const [mbbsUploaded, setMbbsUploaded] = useState(false);
  const [pgUploaded, setPgUploaded] = useState(false);
  const [internshipUploaded, setInternshipUploaded] = useState(false);
  const [regNumber, setRegNumber] = useState('');
  const [councilName, setCouncilName] = useState('');
  const [regYear, setRegYear] = useState('');

  const isValid = mbbsUploaded && regNumber && councilName && regYear;

  const UploadCard = ({ 
    uploaded, 
    onUpload, 
    title, 
    description, 
    required = true 
  }: { 
    uploaded: boolean; 
    onUpload: () => void; 
    title: string; 
    description: string;
    required?: boolean;
  }) => (
    <button
      onClick={onUpload}
      className={`w-full p-4 rounded-xl border transition-all ${
        uploaded 
          ? 'border-success bg-success/5' 
          : 'border-border hover:border-primary/50'
      }`}
    >
      <div className="flex items-center gap-3">
        {uploaded ? (
          <CheckCircle className="w-8 h-8 text-success flex-shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-5 h-5 text-muted-foreground" />
          </div>
        )}
        <div className="text-left flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{title}</span>
            {!required && <span className="text-xs text-muted-foreground">(Optional)</span>}
          </div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        {!uploaded && <Upload className="w-5 h-5 text-muted-foreground" />}
      </div>
    </button>
  );

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-secondary">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Medical Credentials</h1>
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
        {/* Upload Section */}
        <div className="space-y-3">
          <Label>Upload Certificates</Label>
          
          <UploadCard
            uploaded={mbbsUploaded}
            onUpload={() => setMbbsUploaded(true)}
            title="MBBS Degree Certificate"
            description="Mandatory for verification"
          />
          
          <UploadCard
            uploaded={pgUploaded}
            onUpload={() => setPgUploaded(true)}
            title="MD/MS/DNB/Diploma Certificate"
            description="If applicable"
            required={false}
          />
          
          <UploadCard
            uploaded={internshipUploaded}
            onUpload={() => setInternshipUploaded(true)}
            title="Internship Completion Certificate"
            description="Proof of internship completion"
            required={false}
          />
        </div>

        {/* Info Box */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Certificate Guidelines</p>
              <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                <li>• Clear, readable scan or photo</li>
                <li>• All corners should be visible</li>
                <li>• File size: Max 5MB per file</li>
                <li>• Formats: JPG, PNG, PDF</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Registration Details */}
        <div className="space-y-4">
          <Label className="text-base">Medical Registration Details</Label>
          
          <div className="space-y-2">
            <Label htmlFor="regNumber" className="text-sm">Medical Registration Number</Label>
            <Input
              id="regNumber"
              placeholder="e.g., MH/12345/2020"
              value={regNumber}
              onChange={(e) => setRegNumber(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="councilName" className="text-sm">State Medical Council Name</Label>
            <Input
              id="councilName"
              placeholder="e.g., Maharashtra Medical Council"
              value={councilName}
              onChange={(e) => setCouncilName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="regYear" className="text-sm">Year of Registration</Label>
            <Input
              id="regYear"
              placeholder="e.g., 2020"
              type="number"
              value={regYear}
              onChange={(e) => setRegYear(e.target.value)}
            />
          </div>
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
          Continue
        </Button>
      </div>
    </div>
  );
}
