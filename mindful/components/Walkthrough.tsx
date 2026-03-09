// Walkthrough for New Users
import { useState } from 'react';
import { 
  Sparkles, 
  Clock, 
  Target, 
  MessageSquare, 
  Download,
  ChevronRight,
  ChevronLeft,
  Check
} from 'lucide-react';

interface WalkthroughProps {
  onComplete: () => void;
  userEmail?: string;
}

export function Walkthrough({ onComplete, userEmail }: WalkthroughProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Welcome to Second Thought!',
      description: 'Your journey to mindful consumption starts here.',
      icon: Sparkles,
      content: (
        <div className="text-center space-y-6">
          <p className="text-lg text-foreground/80">
            Second Thought helps you make intentional purchasing decisions by:
          </p>
          <div className="space-y-4 max-w-xl mx-auto text-left">
            <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-xl">
              <MessageSquare className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-foreground mb-1">Reflection Questions</h4>
                <p className="text-sm text-foreground/70">
                  Answer thoughtful questions about each item you want to buy
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-xl">
              <Clock className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-foreground mb-1">Time Constraints</h4>
                <p className="text-sm text-foreground/70">
                  Wait a period of time before purchasing to reduce impulse buying
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-xl">
              <Target className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-foreground mb-1">Goal Challenges</h4>
                <p className="text-sm text-foreground/70">
                  Complete personal goals before earning your purchase
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'How to Add an Item',
      description: 'Add items you\'re considering purchasing',
      icon: Sparkles,
      content: (
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">Enter Product Name</h4>
                <p className="text-sm text-foreground/70">
                  Tell us what you're thinking about buying
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">Answer Reflection Questions</h4>
                <p className="text-sm text-foreground/70">
                  We'll generate personalized questions to help you reflect on your decision
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">Choose Your Constraint</h4>
                <p className="text-sm text-foreground/70">
                  Select time-based (wait X days) or goals-based (complete a challenge first)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                4
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">Track Your Progress</h4>
                <p className="text-sm text-foreground/70">
                  View your items in Timeline or Goals view and watch your mindfulness grow
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Get the Browser Extension',
      description: 'Add items directly while shopping online',
      icon: Download,
      content: (
        <div className="text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <Download className="w-10 h-10 text-primary" />
          </div>
          
          <div className="space-y-4 max-w-2xl mx-auto">
            <p className="text-lg text-foreground/80">
              Install our browser extension to add items with one click while shopping online!
            </p>
            
            <div className="bg-muted/30 rounded-xl p-6 space-y-3">
              <h4 className="font-semibold text-foreground">Extension Features:</h4>
              <ul className="text-sm text-foreground/70 space-y-2 text-left">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Add items directly from product pages</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Automatic product name and image detection</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Quick access to your reflection list</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Works on Amazon, eBay, Nike, and more</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-4 items-center">
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => {
                    alert('Extension download coming soon! For now, use the web app to add items.');
                  }}
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full hover:bg-primary/90 transition-all shadow-md"
                >
                  <Download className="w-5 h-5" />
                  Download for Chrome
                </button>
                <button
                  onClick={() => {
                    alert('Extension download coming soon! For now, use the web app to add items.');
                  }}
                  className="inline-flex items-center gap-2 bg-muted text-foreground px-6 py-3 rounded-full hover:bg-muted/80 transition-all"
                >
                  <Download className="w-5 h-5" />
                  Download for Firefox
                </button>
              </div>
              
              <button
                onClick={onComplete}
                className="text-foreground/80 hover:text-foreground px-6 py-2 rounded-full hover:bg-muted/30 transition-all text-sm font-medium"
              >
                Skip - I'll add items in the app
              </button>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex justify-center gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep
                    ? 'w-8 bg-primary'
                    : index < currentStep
                    ? 'w-2 bg-primary/50'
                    : 'w-2 bg-border'
                }`}
              />
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-3">
            Step {currentStep + 1} of {steps.length}
          </p>
        </div>

        {/* Main Content Card */}
        <div className="bg-card rounded-3xl shadow-xl border border-border p-8 md:p-12">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <currentStepData.icon className="w-8 h-8 text-primary" />
            </div>
          </div>

          {/* Title & Description */}
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              {currentStepData.title}
            </h2>
            <p className="text-lg text-muted-foreground">
              {currentStepData.description}
            </p>
          </div>

          {/* Step Content */}
          <div className="mb-8">
            {currentStepData.content}
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-3 justify-between">
            {currentStep > 0 ? (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="inline-flex items-center gap-2 px-6 py-3 border border-border text-foreground rounded-full hover:bg-muted/30 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                Back
              </button>
            ) : (
              <div /> // Spacer
            )}

            {isLastStep ? (
              <button
                onClick={onComplete}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-full hover:bg-primary/90 transition-all shadow-md hover:shadow-lg font-semibold"
              >
                Start Using Second Thought
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full hover:bg-primary/90 transition-all shadow-md"
              >
                Next
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Skip Option */}
          {!isLastStep && (
            <div className="text-center mt-4">
              <button
                onClick={onComplete}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip tutorial
              </button>
            </div>
          )}
        </div>

        {/* Welcome Message for New Users */}
        {userEmail && currentStep === 0 && (
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Welcome, <span className="font-medium text-foreground">{userEmail}</span>!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
