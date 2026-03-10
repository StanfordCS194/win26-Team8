import { useEffect, useState } from 'react';
import { 
  Sparkles, 
  TrendingDown, 
  DollarSign, 
  Target, 
  Clock,
  MessageSquare,
  Download,
  ChevronRight,
  Check
} from 'lucide-react';
import { Auth } from './Auth';
import { useAuth } from '../contexts/AuthContext';

interface OurMissionProps {
  onGetStarted: () => void;
  userEmail?: string;
}

export function OurMission({ onGetStarted, userEmail }: OurMissionProps) {
  const { signIn, signUp } = useAuth();
  const [animatedTitle, setAnimatedTitle] = useState('');
  const [isTypingTitle, setIsTypingTitle] = useState(true);

  useEffect(() => {
    const title = 'Second Thought';
    setAnimatedTitle('');
    setIsTypingTitle(true);
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setAnimatedTitle(title.slice(0, index));
      if (index >= title.length) {
        window.clearInterval(timer);
        setIsTypingTitle(false);
      }
    }, 90);
    return () => window.clearInterval(timer);
  }, []);

  const scrollToOnboarding = () => {
    const onboardingSection = document.getElementById('onboarding-section');
    if (onboardingSection) {
      onboardingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToWhyWeCare = () => {
    const whyWeCareSection = document.getElementById('why-we-care-section');
    if (whyWeCareSection) {
      whyWeCareSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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
          <Auth onSignIn={signIn} onSignUp={signUp} embedded />
        </div>
      ),
    },
    {
      title: 'Get the Browser Extension',
      description: 'Install our browser extension to add items with one click while shopping online!',
      icon: Download,
      content: (
        <div className="text-center space-y-4">
          <div className="space-y-3 max-w-2xl mx-auto">
            
            
            <div className="bg-muted/30 rounded-xl p-4 space-y-3">
              <h4 className="font-semibold text-foreground text-lg text-left">Extension Features:</h4>
              <ul className="text-base text-foreground/70 space-y-3 text-left">
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
                  <span>Reflect on your decision right away</span>
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
    {
      title: 'How to Add an Item',
      description: 'Add items you\'re considering purchasing',
      icon: Sparkles,
      content: (
        <div className="space-y-5">
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg border-2 border-primary text-primary flex items-center justify-center font-semibold flex-shrink-0 text-sm">
                1
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-1 text-base">Enter Product Link or Use the Browser Extension</h4>
                <p className="text-base text-foreground/70">
                  Tell us what you're thinking about buying
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg border-2 border-primary text-primary flex items-center justify-center font-semibold flex-shrink-0 text-sm">
                2
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-1 text-base">Answer Reflection Questions</h4>
                <p className="text-base text-foreground/70">
                  Respond to 5 personalized questions to help you reflect on your decision with a mindfulness score
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg border-2 border-primary text-primary flex items-center justify-center font-semibold flex-shrink-0 text-sm">
                3
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-1 text-base">Choose Your Constraint</h4>
                <p className="text-base text-foreground/70">
                  Select time-based (wait X days) or goals-based (complete a challenge first) constraint
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg border-2 border-primary text-primary flex items-center justify-center font-semibold flex-shrink-0 text-sm">
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
          
          {/* Add Item Button */}
          {userEmail && (
            <div className="text-center pt-4">
              <button
                onClick={onGetStarted}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-full hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl font-semibold text-lg"
              >
                Add Your First Item
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <div className="text-center py-16 px-4">
        <h1 className="text-5xl md:text-6xl font-bold text-[#06402B] mb-6 font-serif min-h-[1.2em]">
          {animatedTitle}
          {isTypingTitle && <span className="ml-1 animate-pulse">|</span>}
        </h1>
        
        <p className="text-xl md:text-2xl text-[#255736] leading-relaxed max-w-4xl mx-auto mb-12 font-serif">
          Long gone are the days of clicking ads, immediately purchasing the product, and forgetting about its existence within days. With personalized guidance and restraints on impulsive spending, our mission is to help users practice{' '}
          <span className="relative inline-block">
            <span className="relative z-10">intentional, mindful consumption</span>
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-primary/30 origin-left animate-[subtleSlide_1.5s_ease-in-out_1s_forwards] scale-x-0"></span>
          </span>
          {' '}to both instill{' '}
          <span className="relative inline-block">
            <span className="relative z-10">financial responsibility</span>
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-primary/30 origin-left animate-[subtleSlide_1.5s_ease-in-out_2s_forwards] scale-x-0"></span>
          </span>
          {' '}and also minimize fashion's significant contributions to{' '}
          <span className="relative inline-block">
            <span className="relative z-10">carbon emissions</span>
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-primary/30 origin-left animate-[subtleSlide_1.5s_ease-in-out_3s_forwards] scale-x-0"></span>
          </span>
          .
        </p>
        
        <style>{`
          @keyframes subtleSlide {
            0% {
              transform: scaleX(0);
              opacity: 0;
            }
            50% {
              opacity: 1;
            }
            100% {
              transform: scaleX(1);
              opacity: 0.7;
            }
          }
        `}</style>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={scrollToWhyWeCare}
            className="inline-flex items-center gap-3 bg-muted text-foreground px-12 py-5 rounded-full hover:bg-muted/80 transition-all shadow-lg hover:shadow-xl text-xl font-semibold"
          >
            Why We Care
          </button>
          <button
            onClick={scrollToOnboarding}
            className="inline-flex items-center gap-3 bg-primary text-primary-foreground px-12 py-5 rounded-full hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl text-xl font-semibold"
          >
            <Sparkles className="w-6 h-6" />
            Get Started
          </button>
        </div>
      </div>

      {/* Why We Care Section */}
      <div id="why-we-care-section" className="max-w-6xl mx-auto scroll-mt-8">
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
        <h2 className="text-4xl md:text-5xl font-bold text-[#06402B] mb-4 text-center font-serif">
          Get Started
        </h2>
        
        <p className="text-xl text-[#255736] text-center mb-12 font-serif max-w-3xl mx-auto">
          From setting up your account to adding your first item—your journey to mindful shopping starts here!
        </p>
        
        {/* Vertical Walkthrough Cards */}
        <div className="max-w-4xl mx-auto space-y-6 mb-16">
          {walkthroughSteps.map((step, index) => (
            <div key={index} className="bg-card rounded-3xl shadow-xl border border-border p-6 md:p-8">
              {/* Step Number */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-2xl">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                    {step.title}
                  </h2>
                  <p className="text-base text-muted-foreground mt-1">
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Step Content */}
              <div>
                {step.content}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
