import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, ClipboardList, MessageSquare, Users, Download, Plus, ChevronRight } from 'lucide-react';
import { HealthRecord, FamilyMember, Prescription } from '@/types/app';
import doctorFemale from '@/assets/doctor-female.jpg';

interface RecordsScreenProps {
  onBack: () => void;
  onViewPrescription: (prescription: Prescription) => void;
}

const tabs = [
  { id: 'prescriptions', label: 'Prescriptions', icon: FileText },
  { id: 'reports', label: 'Reports', icon: ClipboardList },
  { id: 'consultations', label: 'History', icon: MessageSquare },
  // { id: 'family', label: 'Family', icon: Users },
];

const sampleRecords: HealthRecord[] = [
  { id: '1', type: 'prescription', title: 'Fever & Cold Treatment', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
  { id: '2', type: 'prescription', title: 'Skin Rash Medication', date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
  { id: '3', type: 'report', title: 'Blood Test Report', date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
];

const sampleFamily: FamilyMember[] = [
  { id: '1', name: 'Priya Sharma', relation: 'Wife', age: '32', gender: 'female' },
  { id: '2', name: 'Arjun Sharma', relation: 'Son', age: '8', gender: 'male' },
];

export function RecordsScreen({ onBack, onViewPrescription }: RecordsScreenProps) {
  const [activeTab, setActiveTab] = useState('prescriptions');

  const filteredRecords = sampleRecords.filter(r => 
    activeTab === 'prescriptions' ? r.type === 'prescription' :
    activeTab === 'reports' ? r.type === 'report' :
    activeTab === 'consultations' ? r.type === 'consultation' : false
  );

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="gradient-primary px-5 pt-12 pb-6">
        <div className="flex items-center gap-4 mb-4">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-primary-foreground" />
          </button>
          <h1 className="text-xl font-bold text-primary-foreground">Health Records</h1>
        </div>
        <p className="text-primary-foreground/80 text-sm">Your digital medical locker</p>
      </div>

      {/* Tabs */}
      <div className="px-5 -mt-3">
        <div className="bg-card rounded-2xl p-1.5 shadow-md border border-border/50 flex gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === tab.id 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 py-6">
        {activeTab === 'family' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">Family Members</h2>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4" />
                Add Member
              </Button>
            </div>
            <div className="space-y-3">
              {sampleFamily.map(member => (
                <div key={member.id} className="bg-card rounded-xl p-4 border border-border/50 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">{member.name[0]}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{member.name}</h3>
                    <p className="text-sm text-muted-foreground">{member.relation} • {member.age} years</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-4">
              Add family members to manage their health records and book consultations on their behalf.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRecords.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">No {activeTab} yet</h3>
                <p className="text-sm text-muted-foreground">Your {activeTab} will appear here</p>
              </div>
            ) : (
              filteredRecords.map(record => (
                <div key={record.id} className="bg-card rounded-xl p-4 border border-border/50">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      record.type === 'prescription' ? 'bg-primary/10' : 'bg-success/10'
                    }`}>
                      {record.type === 'prescription' ? (
                        <FileText className="w-5 h-5 text-primary" />
                      ) : (
                        <ClipboardList className="w-5 h-5 text-success" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{record.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(record.date).toLocaleDateString('en-IN', { 
                          day: 'numeric', 
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
