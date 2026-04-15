import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Home, Navigation } from 'lucide-react';
import { useState } from 'react';
import { format, addDays } from 'date-fns';

interface AddressSlotScreenProps {
  onSubmit: (data: { address: string; date: Date; timeSlot: string }) => void;
  onBack: () => void;
}

const timeSlots = ['9:00 AM - 12:00 PM', '12:00 PM - 3:00 PM', '3:00 PM - 6:00 PM', '6:00 PM - 9:00 PM'];

export function AddressSlotScreen({ onSubmit, onBack }: AddressSlotScreenProps) {
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const dates = Array.from({ length: 5 }, (_, i) => addDays(new Date(), i));

  const handleSubmit = () => {
    if (address && selectedDate && selectedSlot) {
      const fullAddress = landmark ? `${address}, ${landmark}` : address;
      onSubmit({ address: fullAddress, date: selectedDate, timeSlot: selectedSlot });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mb-4">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-2xl font-bold text-foreground">Home Visit Details</h1>
        <p className="text-muted-foreground mt-1">Enter your address and preferred time</p>
      </div>

      <div className="flex-1 px-5 space-y-6 overflow-y-auto pb-4">
        {/* Address Section */}
        <div>
          <label className="text-sm font-medium text-foreground mb-3 block">
            Your Address
          </label>
          
          {/* Detect Location Button */}
          <button className="w-full p-3 rounded-xl border border-primary bg-primary/5 flex items-center justify-center gap-2 mb-3">
            <Navigation className="w-4 h-4 text-primary" />
            <span className="text-primary font-medium">Use Current Location</span>
          </button>

          <div className="space-y-3">
            <div className="relative">
              <MapPin className="w-5 h-5 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter full address"
                className="w-full pl-12 pr-4 py-4 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            
            <div className="relative">
              <Home className="w-5 h-5 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="Landmark (optional)"
                className="w-full pl-12 pr-4 py-4 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Date Selection */}
        <div>
          <label className="text-sm font-medium text-foreground mb-3 block">
            Preferred Date
          </label>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {dates.map((date, index) => {
              const isSelected = selectedDate && format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
              const isToday = index === 0;
              
              return (
                <button
                  key={index}
                  onClick={() => setSelectedDate(date)}
                  className={`flex-shrink-0 w-16 py-3 rounded-2xl flex flex-col items-center transition-all ${
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card border border-border hover:border-primary'
                  }`}
                >
                  <span className={`text-xs ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                    {isToday ? 'Today' : format(date, 'EEE')}
                  </span>
                  <span className="text-lg font-bold">{format(date, 'd')}</span>
                  <span className={`text-xs ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                    {format(date, 'MMM')}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Slot Selection */}
        <div>
          <label className="text-sm font-medium text-foreground mb-3 block">
            Preferred Time Slot
          </label>
          <div className="space-y-2">
            {timeSlots.map((slot) => {
              const isSelected = selectedSlot === slot;
              
              return (
                <button
                  key={slot}
                  onClick={() => setSelectedSlot(slot)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <span className={`font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                    {slot}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Note */}
        <div className="bg-accent/10 rounded-2xl p-4">
          <p className="text-sm text-muted-foreground">
            📌 The doctor will arrive within your selected time slot. You'll receive a call 30 minutes before arrival.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="p-5 pb-8">
        <Button
          variant="default"
          size="xl"
          className="w-full"
          disabled={!address || !selectedDate || !selectedSlot}
          onClick={handleSubmit}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
