import { Button } from '@/components/ui/button';
import { FileText, User, GraduationCap, CheckCircle, Clock, Shield, Mail, Phone, Edit, HelpCircle } from 'lucide-react';

interface DoctorVerificationStatusScreenProps {
  onEditDetails: () => void;
  onContactSupport: () => void;
  onRefresh: () => void;
}

const verificationSteps = [
  { id: 'documents', icon: FileText, title: 'Documents submitted', status: 'completed' as const },
  { id: 'identity', icon: User, title: 'Identity verified', status: 'in-progress' as const },
  { id: 'medical', icon: GraduationCap, title: 'Medical credentials verified', status: 'pending' as const },
  { id: 'admin', icon: Shield, title: 'Admin approval', status: 'pending' as const },
];

export function DoctorVerificationStatusScreen({ onEditDetails, onContactSupport, onRefresh }: DoctorVerificationStatusScreenProps) {
  const getStatusIcon = (status: 'completed' | 'in-progress' | 'pending') => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-success" />;
      case 'in-progress':
        return <Clock className="w-6 h-6 text-warning animate-pulse" />;
      case 'pending':
        return <Clock className="w-6 h-6 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: 'completed' | 'in-progress' | 'pending') => {
    switch (status) {
      case 'completed':
        return 'border-success bg-success/10';
      case 'in-progress':
        return 'border-warning bg-warning/10';
      case 'pending':
        return 'border-border bg-secondary/50';
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-primary px-5 pt-12 pb-8 text-center">
        <div className="w-20 h-20 rounded-full bg-primary-foreground/20 flex items-center justify-center mx-auto mb-4">
          <Clock className="w-10 h-10 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-primary-foreground mb-2">Verification in Progress</h1>
        <p className="text-primary-foreground/80">Your profile is under review</p>
      </div>

      <div className="flex-1 px-5 py-6 space-y-6 -mt-4">
        {/* Verification Steps */}
        <div className="bg-card rounded-2xl border border-border/50 p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground mb-4">Verification Progress</h2>
          <div className="space-y-3">
            {verificationSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div 
                  key={step.id} 
                  className={`p-4 rounded-xl border ${getStatusColor(step.status)}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center">
                      <Icon className="w-5 h-5 text-foreground" />
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-foreground">{step.title}</span>
                      <p className="text-xs text-muted-foreground">
                        {step.status === 'completed' && 'Completed'}
                        {step.status === 'in-progress' && 'In progress...'}
                        {step.status === 'pending' && 'Pending'}
                      </p>
                    </div>
                    {getStatusIcon(step.status)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ETA */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
          <Clock className="w-8 h-8 text-primary mx-auto mb-2" />
          <p className="text-sm font-medium text-foreground">Estimated verification time</p>
          <p className="text-2xl font-bold text-primary">24-48 hours</p>
          <p className="text-xs text-muted-foreground mt-1">You'll receive updates via SMS and email</p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button 
            variant="outline" 
            size="lg" 
            className="w-full" 
            onClick={onEditDetails}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Submitted Details
          </Button>
          
          <Button 
            variant="outline" 
            size="lg" 
            className="w-full" 
            onClick={onContactSupport}
          >
            <HelpCircle className="w-4 h-4 mr-2" />
            Contact Support
          </Button>
        </div>

        {/* Contact Info */}
        <div className="bg-secondary/30 rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium text-foreground">Need help?</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="w-4 h-4" />
            <span>support@docplatform.com</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="w-4 h-4" />
            <span>1800-XXX-XXXX</span>
          </div>
        </div>
      </div>

      {/* Refresh */}
      <div className="sticky bottom-0 bg-background border-t border-border px-5 py-4">
        <Button 
          variant="accent" 
          size="xl" 
          className="w-full" 
          onClick={onRefresh}
        >
          Refresh Status
        </Button>
      </div>
    </div>
  );
}
