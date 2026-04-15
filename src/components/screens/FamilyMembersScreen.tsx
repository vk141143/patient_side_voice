import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, User, Edit2, Trash2 } from 'lucide-react';
import { FamilyMember } from '@/types/app';
import { useState } from 'react';

interface FamilyMembersScreenProps {
  members: FamilyMember[];
  onAddMember: (member: Omit<FamilyMember, 'id'>) => void;
  onBack: () => void;
}

const sampleMembers: FamilyMember[] = [
  { id: '1', name: 'Rahul Kumar', relation: 'Self', age: '28', gender: 'male' },
  { id: '2', name: 'Priya Kumar', relation: 'Wife', age: '26', gender: 'female' },
  { id: '3', name: 'Aryan Kumar', relation: 'Son', age: '5', gender: 'male' },
];

export function FamilyMembersScreen({ members = sampleMembers, onAddMember, onBack }: FamilyMembersScreenProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMember, setNewMember] = useState<{ name: string; relation: string; age: string; gender: 'male' | 'female' | 'other' }>({ name: '', relation: '', age: '', gender: 'male' });

  const handleAdd = () => {
    if (newMember.name && newMember.relation && newMember.age) {
      onAddMember(newMember);
      setNewMember({ name: '', relation: '', age: '', gender: 'male' });
      setShowAddForm(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getGenderColor = (gender: string) => {
    return gender === 'male' ? 'bg-blue-500' : gender === 'female' ? 'bg-pink-500' : 'bg-purple-500';
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="px-5 pt-12 pb-6">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mb-4">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-2xl font-bold text-foreground">Family Members</h1>
        <p className="text-muted-foreground mt-1">Manage profiles for your family</p>
      </div>

      <div className="flex-1 px-5 space-y-4 overflow-y-auto pb-4">
        {/* Members List */}
        {members.map((member) => (
          <div
            key={member.id}
            className="bg-card rounded-2xl p-4 border border-border flex items-center gap-4"
          >
            <div className={`w-14 h-14 rounded-full ${getGenderColor(member.gender)} flex items-center justify-center`}>
              <span className="text-lg font-bold text-white">{getInitials(member.name)}</span>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">{member.name}</h3>
              <p className="text-sm text-muted-foreground">
                {member.relation} • {member.age} years • {member.gender}
              </p>
            </div>
            <div className="flex gap-2">
              <button className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
                <Edit2 className="w-4 h-4 text-foreground" />
              </button>
              {member.relation !== 'Self' && (
                <button className="w-9 h-9 rounded-full bg-destructive/10 flex items-center justify-center">
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Add Member Form */}
        {showAddForm && (
          <div className="bg-card rounded-2xl p-5 border border-primary space-y-4">
            <h3 className="font-semibold text-foreground">Add Family Member</h3>
            
            <input
              type="text"
              value={newMember.name}
              onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
              placeholder="Full Name"
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={newMember.relation}
                onChange={(e) => setNewMember({ ...newMember, relation: e.target.value })}
                placeholder="Relation"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="number"
                value={newMember.age}
                onChange={(e) => setNewMember({ ...newMember, age: e.target.value })}
                placeholder="Age"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex gap-2">
              {(['male', 'female', 'other'] as const).map((gender) => (
                <button
                  key={gender}
                  onClick={() => setNewMember({ ...newMember, gender: gender as 'male' | 'female' | 'other' })}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium capitalize ${
                    newMember.gender === gender
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-foreground'
                  }`}
                >
                  {gender}
                </button>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                className="flex-1"
                onClick={handleAdd}
                disabled={!newMember.name || !newMember.relation || !newMember.age}
              >
                Add Member
              </Button>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="bg-accent/10 rounded-2xl p-4">
          <p className="text-sm text-muted-foreground">
            👨‍👩‍👧‍👦 Add family members to quickly switch profiles during consultations and manage their health records.
          </p>
        </div>
      </div>

      {/* CTA */}
      {!showAddForm && (
        <div className="p-5 pb-8">
          <Button
            variant="default"
            size="xl"
            className="w-full"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Family Member
          </Button>
        </div>
      )}
    </div>
  );
}
