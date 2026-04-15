import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { Doctor } from '@/types/app';
import { useState } from 'react';
import { format, addDays } from 'date-fns';

interface SelectTimeSlotScreenProps {
  doctor: Doctor;
  onSelect: (date: Date, timeSlot: string) => void;
  onBack: () => void;
}

const timeSlots = {
  morning: ['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM'],
  afternoon: ['12:00 PM', '12:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM'],
  evening: ['4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM'],
};

const unavailableSlots = ['10:00 AM', '2:30 PM', '5:00 PM'];

export function SelectTimeSlotScreen({ doctor, onSelect, onBack }: SelectTimeSlotScreenProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const dates = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

  const isSlotAvailable = (slot: string) => !unavailableSlots.includes(slot);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mb-4">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-2xl font-bold text-foreground">Select Time Slot</h1>
        <p className="text-muted-foreground mt-1">Choose a convenient time with {doctor.name}</p>
      </div>

      {/* Date Selection */}
      <div className="px-5 pb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground">Select Date</h3>
          <div className="flex gap-2">
            <button className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <ChevronLeft className="w-4 h-4 text-foreground" />
            </button>
            <button className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <ChevronRight className="w-4 h-4 text-foreground" />
            </button>
          </div>
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2">
          {dates.map((date, index) => {
            const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
            const isToday = index === 0;
            
            return (
              <button
                key={index}
                onClick={() => {
                  setSelectedDate(date);
                  setSelectedSlot(null);
                }}
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

      {/* Time Slots */}
      <div className="flex-1 px-5 overflow-y-auto space-y-6 pb-4">
        {/* Morning */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">🌅 Morning</h4>
          <div className="grid grid-cols-3 gap-2">
            {timeSlots.morning.map((slot) => {
              const available = isSlotAvailable(slot);
              const isSelected = selectedSlot === slot;
              
              return (
                <button
                  key={slot}
                  disabled={!available}
                  onClick={() => setSelectedSlot(slot)}
                  className={`py-3 rounded-xl text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : available
                      ? 'bg-card border border-border hover:border-primary text-foreground'
                      : 'bg-muted text-muted-foreground line-through cursor-not-allowed'
                  }`}
                >
                  {slot}
                </button>
              );
            })}
          </div>
        </div>

        {/* Afternoon */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">☀️ Afternoon</h4>
          <div className="grid grid-cols-3 gap-2">
            {timeSlots.afternoon.map((slot) => {
              const available = isSlotAvailable(slot);
              const isSelected = selectedSlot === slot;
              
              return (
                <button
                  key={slot}
                  disabled={!available}
                  onClick={() => setSelectedSlot(slot)}
                  className={`py-3 rounded-xl text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : available
                      ? 'bg-card border border-border hover:border-primary text-foreground'
                      : 'bg-muted text-muted-foreground line-through cursor-not-allowed'
                  }`}
                >
                  {slot}
                </button>
              );
            })}
          </div>
        </div>

        {/* Evening */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">🌆 Evening</h4>
          <div className="grid grid-cols-3 gap-2">
            {timeSlots.evening.map((slot) => {
              const available = isSlotAvailable(slot);
              const isSelected = selectedSlot === slot;
              
              return (
                <button
                  key={slot}
                  disabled={!available}
                  onClick={() => setSelectedSlot(slot)}
                  className={`py-3 rounded-xl text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : available
                      ? 'bg-card border border-border hover:border-primary text-foreground'
                      : 'bg-muted text-muted-foreground line-through cursor-not-allowed'
                  }`}
                >
                  {slot}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="p-5 pb-8">
        <Button
          variant="default"
          size="xl"
          className="w-full"
          disabled={!selectedSlot}
          onClick={() => selectedSlot && onSelect(selectedDate, selectedSlot)}
        >
          Confirm Appointment
        </Button>
      </div>
    </div>
  );
}
