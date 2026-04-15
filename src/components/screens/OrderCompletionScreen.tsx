import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Star, MessageSquare, Home } from 'lucide-react';

interface OrderCompletionScreenProps {
  orderId: string;
  onRateExperience: (rating: number) => void;
  onConsultAgain: () => void;
  onGoHome: () => void;
}

export function OrderCompletionScreen({ 
  orderId, 
  onRateExperience, 
  onConsultAgain, 
  onGoHome 
}: OrderCompletionScreenProps) {
  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitRating = () => {
    if (rating > 0) {
      onRateExperience(rating);
      setSubmitted(true);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Success Header */}
      <div className="gradient-primary px-5 pt-16 pb-12 text-center">
        <div className="w-24 h-24 rounded-full bg-primary-foreground/20 mx-auto mb-6 flex items-center justify-center">
          <CheckCircle className="w-14 h-14 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-primary-foreground mb-2">Order Delivered!</h1>
        <p className="text-primary-foreground/80">Your medicines have been delivered successfully</p>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 py-6 -mt-4">
        {/* Order ID Card */}
        <div className="bg-card rounded-2xl p-5 shadow-lg border border-border/50 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Order ID</span>
            <span className="font-mono font-semibold text-foreground">{orderId}</span>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
            <span className="text-sm text-muted-foreground">Delivered by</span>
            <span className="font-semibold text-foreground">MOM Pharmacy</span>
          </div>
        </div>

        {/* Rating Section */}
        <div className="bg-card rounded-2xl p-5 border border-border/50 mb-6">
          <h2 className="font-semibold text-foreground mb-2">Rate Your Experience</h2>
          <p className="text-sm text-muted-foreground mb-4">How was the pharmacy service?</p>
          
          {!submitted ? (
            <>
              <div className="flex justify-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star 
                      className={`w-10 h-10 ${
                        star <= rating 
                          ? 'text-accent fill-accent' 
                          : 'text-muted-foreground'
                      }`} 
                    />
                  </button>
                ))}
              </div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleSubmitRating}
                disabled={rating === 0}
              >
                Submit Rating
              </Button>
            </>
          ) : (
            <div className="text-center py-4">
              <CheckCircle className="w-10 h-10 text-success mx-auto mb-2" />
              <p className="text-success font-medium">Thank you for your feedback!</p>
            </div>
          )}
        </div>

        {/* Health Tip */}
        <div className="bg-primary/5 rounded-2xl p-5 border border-primary/20 mb-6">
          <h3 className="font-semibold text-foreground mb-2">💊 Medicine Reminder</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Remember to take your medicines as prescribed. Set reminders to never miss a dose. 
            If symptoms persist, consult your doctor again.
          </p>
        </div>
      </div>

      {/* CTAs */}
      <div className="px-5 pb-8 pt-4 bg-card border-t border-border space-y-3">
        <Button 
          variant="hero" 
          size="xl" 
          className="w-full"
          onClick={onConsultAgain}
        >
          <MessageSquare className="w-5 h-5" />
          Consult Doctor Again
        </Button>
        <Button 
          variant="heroSecondary" 
          size="lg" 
          className="w-full"
          onClick={onGoHome}
        >
          <Home className="w-5 h-5" />
          Go to Home
        </Button>
      </div>
    </div>
  );
}
