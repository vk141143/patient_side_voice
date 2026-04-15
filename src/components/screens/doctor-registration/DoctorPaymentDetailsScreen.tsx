import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CreditCard, Building, Upload, CheckCircle, FileText, Shield } from 'lucide-react';

interface DoctorPaymentDetailsScreenProps {
  onSubmit: () => void;
  onBack: () => void;
  currentStep: number;
  totalSteps: number;
}

export function DoctorPaymentDetailsScreen({ onSubmit, onBack, currentStep, totalSteps }: DoctorPaymentDetailsScreenProps) {
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [chequeUploaded, setChequeUploaded] = useState(false);
  const [panNumber, setPanNumber] = useState('');
  const [gstNumber, setGstNumber] = useState('');

  const accountsMatch = accountNumber === confirmAccountNumber && accountNumber.length > 0;
  const isValid = accountHolder && accountNumber && accountsMatch && ifscCode && chequeUploaded;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-secondary">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Payment Information</h1>
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

      <div className="flex-1 px-5 py-6 space-y-6 pb-24">
        {/* Security Notice */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-foreground">Your payment details are encrypted and secure</span>
          </div>
        </div>

        {/* Bank Account Details */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-primary" />
            <Label className="text-base font-semibold">Bank Account Details</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountHolder">Account Holder Name</Label>
            <Input
              id="accountHolder"
              placeholder="Name as per bank account"
              value={accountHolder}
              onChange={(e) => setAccountHolder(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountNumber">Account Number</Label>
            <Input
              id="accountNumber"
              placeholder="Enter account number"
              type="password"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmAccountNumber">Confirm Account Number</Label>
            <Input
              id="confirmAccountNumber"
              placeholder="Re-enter account number"
              value={confirmAccountNumber}
              onChange={(e) => setConfirmAccountNumber(e.target.value)}
            />
            {confirmAccountNumber && (
              <p className={`text-sm ${accountsMatch ? 'text-success' : 'text-destructive'}`}>
                {accountsMatch ? '✓ Account numbers match' : '✗ Account numbers do not match'}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ifscCode">IFSC Code</Label>
            <Input
              id="ifscCode"
              placeholder="e.g., HDFC0001234"
              className="uppercase"
              value={ifscCode}
              onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
            />
          </div>
        </div>

        {/* Cheque Upload */}
        <div className="space-y-3">
          <Label>Cancelled Cheque / Passbook Photo</Label>
          <button
            onClick={() => setChequeUploaded(true)}
            className={`w-full p-4 rounded-xl border transition-all ${
              chequeUploaded 
                ? 'border-success bg-success/5' 
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="flex items-center gap-3">
              {chequeUploaded ? (
                <>
                  <CheckCircle className="w-8 h-8 text-success flex-shrink-0" />
                  <span className="text-sm font-medium text-success">Document uploaded</span>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="text-left flex-1">
                    <span className="text-sm font-medium text-foreground">Upload cancelled cheque</span>
                    <p className="text-xs text-muted-foreground">Or first page of bank passbook</p>
                  </div>
                  <Upload className="w-5 h-5 text-muted-foreground" />
                </>
              )}
            </div>
          </button>
        </div>

        {/* Optional Fields */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-muted-foreground" />
            <Label className="text-base">Optional Information</Label>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="panNumber">PAN Card Number</Label>
              <span className="text-xs text-muted-foreground">Optional</span>
            </div>
            <Input
              id="panNumber"
              placeholder="e.g., ABCDE1234F"
              className="uppercase"
              value={panNumber}
              onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="gstNumber">GST Number</Label>
              <span className="text-xs text-muted-foreground">If applicable</span>
            </div>
            <Input
              id="gstNumber"
              placeholder="e.g., 22AAAAA0000A1Z5"
              className="uppercase"
              value={gstNumber}
              onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
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
