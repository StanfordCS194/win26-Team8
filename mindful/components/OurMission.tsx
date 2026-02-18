import { useState } from 'react';
import { 
  Sparkles, 
  TrendingDown, 
  DollarSign, 
  Target, 
  Clock,
  MessageSquare,
  Download,
  ChevronRight,
  ChevronLeft,
  Check
} from 'lucide-react';
import { Auth } from './Auth';

interface OurMissionProps {
  onGetStarted: () => void;
  userEmail?: string;
}

export function OurMission({ onGetStarted, userEmail }: OurMissionProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const scrollToOnboarding = () => {
    const onboardingSection = document.getElementById('onboarding-section');
    if (onboardingSection) {
      onboardingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const onComplete = () => {
    onGetStarted();
  };

  const walkthroughSteps = [
    {
      title: userEmail ? 'Welcome to Second Thought!' : 'Create Your Account',
      description: userEmail 
        ? 'Your journey to mindful consumption starts here.' 
        : 'Sign up to start your mindful shopping journey',
      icon: Sparkles,
      content: userEmail ? (
        <div className="text-center space-y-4">
          <p className="text-lg text-foreground/80">
            Second Thought helps you make intentional purchasing decisions by:
          </p>
          <div className="space-y-3 max-w-xl mx-auto text-left">
            <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-xl">
              <MessageSquare className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-foreground mb-1 text-base">Reflection Questions</h4>
                <p className="text-base text-foreground/70">
                  Answer thoughtful questions about each item you want to buy
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-xl">
              <Clock className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-foreground mb-1 text-base">Time Constraints</h4>
                <p className="text-base text-foreground/70">
                  Wait a period of time before purchasing to reduce impulse buying
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-xl">
              <Target className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-foreground mb-1 text-base">Goal Challenges</h4>
                <p className="text-base text-foreground/70">
                  Complete personal goals before earning your purchase
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-md mx-auto">
          <Auth embedded />
        </div>
      ),
    },
    {
      title: 'How to Add an Item',
      description: 'Add items you\'re considering purchasing',
      icon: Sparkles,
      content: (
        <div className="space-y-3">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-1 text-base">Enter Product Name</h4>
                <p className="text-base text-foreground/70">
                  Tell us what you're thinking about buying
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-1 text-base">Answer Reflection Questions</h4>
                <p className="text-base text-foreground/70">
                  We'll generate personalized questions to help you reflect on your decision
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-1 text-base">Choose Your Constraint</h4>
                <p className="text-base text-foreground/70">
                  Select time-based (wait X days) or goals-based (complete a challenge first)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                4
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-1 text-base">Track Your Progress</h4>
                <p className="text-base text-foreground/70">
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
        <div className="text-center space-y-4">
          <div className="space-y-3 max-w-2xl mx-auto">
            <p className="text-lg text-foreground/80">
              Install our browser extension to add items with one click while shopping online!
            </p>
            
            <div className="bg-muted/30 rounded-xl p-4 space-y-2">
              <h4 className="font-semibold text-foreground text-base">Extension Features:</h4>
              <ul className="text-base text-foreground/70 space-y-1.5 text-left">
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
          </div>
        </div>
      ),
    },
  ];

  const currentStepData = walkthroughSteps[currentStep];
  const isLastStep = currentStep === walkthroughSteps.length - 1;

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <div className="text-center py-16 px-4">
        <h1 className="text-5xl md:text-6xl font-bold text-[#06402B] mb-6 font-serif">
          Our Mission
        </h1>
        
        <p className="text-xl md:text-2xl text-[#255736] leading-relaxed max-w-4xl mx-auto mb-12 font-serif">
          Long gone are the days of clicking ads, immediately purchasing the product, and forgetting about its existence within days. With personalized guidance and restraints on impulsive spending, our mission is to help users practice intentional, mindful consumption to both instill financial responsibility and also minimize fashion's significant contributions to carbon emissions.
        </p>
        
        <button
          onClick={scrollToOnboarding}
          className="inline-flex items-center gap-3 bg-primary text-primary-foreground px-12 py-5 rounded-full hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl text-xl font-semibold"
        >
          <Sparkles className="w-6 h-6" />
          Get Started
        </button>
      </div>

      {/* Why We Care Section */}
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-[#06402B] mb-4 text-center font-serif">
          Why We Care
        </h2>
        
        <p className="text-xl text-[#255736] text-center mb-12 font-serif max-w-3xl mx-auto">
          We care about both the online shoppers who cannot help but 'add to cart' when they see an item they just cannot resist, as well as the planet!
        </p>

        {/* Impact Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Environmental Impact Card */}
          <div className="bg-card rounded-3xl shadow-lg border-2 border-primary/20 p-8 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <TrendingDown className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-[#06402B] font-serif">Environmental Impact</h3>
            </div>
            
            <div className="space-y-4">
              <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                <p className="text-4xl font-bold text-primary mb-2">10%</p>
                <p className="text-[#255736] font-serif">
                  The fashion industry is responsible for roughly 10% of global carbon emissions
                </p>
              </div>
              
              <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                <p className="text-4xl font-bold text-primary mb-2">20%</p>
                <p className="text-[#255736] font-serif">
                  Fashion accounts for roughly 20% of global wastewater
                </p>
              </div>
            </div>
          </div>

          {/* Financial Impact Card */}
          <div className="bg-card rounded-3xl shadow-lg border-2 border-accent/20 p-8 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center">
                <DollarSign className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-2xl font-bold text-[#06402B] font-serif">Financial Impact</h3>
            </div>
            
            <div className="space-y-4">
              <div className="bg-accent/5 rounded-xl p-4 border border-accent/20">
                <p className="text-4xl font-bold text-accent mb-2">$5,400</p>
                <p className="text-[#255736] font-serif">
                  Consumers are spending an average of $5,400 on impulsive purchases every year
                </p>
              </div>
              
              <div className="bg-accent/5 rounded-xl p-4 border border-accent/20">
                <p className="text-lg font-semibold text-[#06402B] mb-2 font-serif">Take Back Control</p>
                <p className="text-[#255736] font-serif">
                  Make intentional decisions and save money while helping the planet
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Onboarding Section (replaces How It Works) */}
      <div id="onboarding-section" className="scroll-mt-4 pt-4 pb-16">
        {/* Walkthrough Card */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="bg-card rounded-3xl shadow-xl border border-border p-6 md:p-8">
            {/* Progress Indicator */}
            <div className="mb-4">
              <div className="flex justify-center gap-2">
                {walkthroughSteps.map((_, index) => (
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
              <p className="text-center text-base text-muted-foreground mt-3">
                Step {currentStep + 1} of {walkthroughSteps.length}
              </p>
            </div>

            {/* Title & Description */}
            <div className="text-center mb-5">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                {currentStepData.title}
              </h2>
              <p className="text-lg text-muted-foreground">
                {currentStepData.description}
              </p>
            </div>

            {/* Step Content */}
            <div className="mb-1 min-h-[320px]">
              {currentStepData.content}
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-3 justify-between">
              {currentStep > 0 ? (
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="inline-flex items-center gap-2 px-6 py-3 border border-border text-foreground rounded-full hover:bg-muted/30 transition-colors text-base"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Back
                </button>
              ) : (
                <div />
              )}

              {isLastStep ? (
                <button
                  onClick={onGetStarted}
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-full hover:bg-primary/90 transition-all shadow-md hover:shadow-lg font-semibold text-base"
                >
                  Start Using Second Thought
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                // Hide Next button on first step if user is not logged in
                currentStep === 0 && !userEmail ? (
                  <div />
                ) : (
                  <button
                    onClick={() => setCurrentStep(currentStep + 1)}
                    className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full hover:bg-primary/90 transition-all shadow-md text-base"
                  >
                    Next
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
