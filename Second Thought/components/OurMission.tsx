import { useEffect, useState } from 'react';
import { 
  Sparkles, 
  TrendingDown, 
  DollarSign, 
  Heart,
  Target, 
  Clock,
  MessageSquare,
  Download,
  PlayCircle,
  ChevronRight,
  Check
} from 'lucide-react';
import { Auth } from './Auth';
import { useAuth } from '../contexts/AuthContext';
import promoVideo from '../assets/Second Thought Demo.mp4';

interface OurMissionProps {
  onGetStarted: () => void;
  userEmail?: string;
}

export function OurMission({ onGetStarted, userEmail }: OurMissionProps) {
  const { signIn, signUp } = useAuth();
  const [animatedTitle, setAnimatedTitle] = useState('');
  const [isTypingTitle, setIsTypingTitle] = useState(true);
  const [showYellowHighlights, setShowYellowHighlights] = useState(false);
  const [showGreenHighlights, setShowGreenHighlights] = useState(false);

  useEffect(() => {
    const title = 'Second Thought';
    setAnimatedTitle('');
    setIsTypingTitle(true);
    setShowYellowHighlights(false);
    setShowGreenHighlights(false);
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setAnimatedTitle(title.slice(0, index));
      if (index >= title.length) {
        window.clearInterval(timer);
        setIsTypingTitle(false);
        window.setTimeout(() => setShowYellowHighlights(true), 250);
        window.setTimeout(() => setShowGreenHighlights(true), 1650);
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

  const scrollToPromoVideo = () => {
    const promoVideoSection = document.getElementById('promo-video-section');
    if (promoVideoSection) {
      promoVideoSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
      description: 'Follow these steps to install the Second Thought extension.',
      icon: Download,
      content: (
        <div className="space-y-5 max-w-2xl mx-auto">
          <ol className="text-base text-foreground/80 space-y-4 list-none pl-0">
            <li className="flex items-start gap-3">
              <span className="w-7 h-7 rounded-lg border-2 border-primary text-primary flex items-center justify-center font-semibold flex-shrink-0 text-sm">1</span>
              <div className="space-y-2">
                <span className="block">Download the Second Thought Extension, and unzip the file.</span>
                <a
                  href="/second-thought-extension.zip"
                  download="second-thought-extension.zip"
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  Download extension (zip)
                </a>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-7 h-7 rounded-lg border-2 border-primary text-primary flex items-center justify-center font-semibold flex-shrink-0 text-sm">2</span>
              <span>Navigate to <code className="bg-muted px-1.5 py-0.5 rounded text-sm">chrome://extensions/</code>.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-7 h-7 rounded-lg border-2 border-primary text-primary flex items-center justify-center font-semibold flex-shrink-0 text-sm">3</span>
              <span>Enable Developer Mode in the top right corner.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-7 h-7 rounded-lg border-2 border-primary text-primary flex items-center justify-center font-semibold flex-shrink-0 text-sm">4</span>
              <span>Select &quot;Load Unpacked&quot; in the top left corner, and select the folder containing the unzipped Second Thought Extension. This folder should contain "dist" and "src" subfolders.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-7 h-7 rounded-lg border-2 border-primary text-primary flex items-center justify-center font-semibold flex-shrink-0 text-sm">5</span>
              <span>The Second Thought extension will activate whenever you click "Add to Cart", or equivalent, when online shopping in your Chrome browser. You can also activate it manually through the Chrome Extension toolbar, located to the right of the URL bar.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-7 h-7 rounded-lg border-2 border-primary text-primary flex items-center justify-center font-semibold flex-shrink-0 text-sm">6</span>
              <span>Enjoy!</span>
            </li>
          </ol>
        </div>
      ),
    },
    {
      title: 'How to Add an Item',
      description: 'Add items you\'re considering purchasing',
      icon: Sparkles,
      content: (
        <div className="space-y-5 max-w-2xl mx-auto">
          <ol className="text-base text-foreground/80 space-y-4 list-none pl-0">
            <li className="flex items-start gap-3">
              <span className="w-7 h-7 rounded-lg border-2 border-primary text-primary flex items-center justify-center font-semibold flex-shrink-0 text-sm">1</span>
              <div className="space-y-2">
                <span className="block font-semibold text-foreground">Enter Product Link or Use the Browser Extension</span>
                <span className="block">Tell us what you&apos;re thinking about buying</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-7 h-7 rounded-lg border-2 border-primary text-primary flex items-center justify-center font-semibold flex-shrink-0 text-sm">2</span>
              <div className="space-y-2">
                <span className="block font-semibold text-foreground">Answer Reflection Questions</span>
                <span className="block">Respond to personalized questions to help you reflect on your decision with a mindfulness score</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-7 h-7 rounded-lg border-2 border-primary text-primary flex items-center justify-center font-semibold flex-shrink-0 text-sm">3</span>
              <div className="space-y-2">
                <span className="block font-semibold text-foreground">Choose Your Constraint</span>
                <span className="block">Select time-based (wait X days) or goals-based (complete a challenge first) constraint</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-7 h-7 rounded-lg border-2 border-primary text-primary flex items-center justify-center font-semibold flex-shrink-0 text-sm">4</span>
              <div className="space-y-2">
                <span className="block font-semibold text-foreground">Track Your Progress</span>
                <span className="block">View your items in Timeline or Goals view and watch your mindfulness grow</span>
              </div>
            </li>
          </ol>
          {userEmail && (
            <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center items-center">
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
      <div className="text-center px-4 pt-18 pb-28 min-h-[92vh] flex flex-col items-center justify-center">
        <h1 className="text-5xl md:text-6xl font-bold text-[#06402B] mb-6 font-serif min-h-[1.2em]">
          {animatedTitle}
          {isTypingTitle && <span className="ml-1 animate-pulse">|</span>}
        </h1>
        
        <p className="text-xl md:text-2xl text-[#255736] leading-relaxed max-w-4xl mx-auto mb-12 font-serif">
          Long gone are the days of clicking ads, immediately purchasing the product, and forgetting about its existence within days. With{' '}
          <span className={`inline-block px-1 rounded-md ${
            showYellowHighlights
              ? 'animate-[yellowFocus_0.9s_ease-out_forwards]'
              : 'bg-transparent text-[#255736]'
          }`}>
            personalized reflection questions 
          </span>
          {' '}and{' '}
          <span className={`inline-block px-1 rounded-md ${
            showYellowHighlights
              ? 'animate-[yellowFocus_0.9s_ease-out_0.2s_forwards]'
              : 'bg-transparent text-[#255736]'
          }`}>
            tailored constraints 🔒
          </span>
          {' '}on impulsive spending, our mission is to help users practice{' '}
          <span className="relative inline-block">
            <span className={`relative z-10 inline-block px-1 rounded-md ${
              showGreenHighlights
                ? 'animate-[phraseFocus_1.2s_ease-in-out_forwards]'
                : 'bg-transparent'
            }`}>
              intentional, mindful consumption 💭
            </span>
            <span className={`absolute bottom-0 left-0 w-full h-[2px] bg-primary/30 origin-left ${
              showGreenHighlights
                ? 'animate-[subtleSlide_1s_ease-in-out_forwards]'
                : 'scale-x-0 opacity-0'
            }`}></span>
          </span>
          .
        </p>
        
        <style>{`
          @keyframes yellowFocus {
            0% {
              background-color: rgba(252, 240, 225, 0);
              color: #255736;
            }
            100% {
              background-color: #fcf0e1;
              color: #6b4e16;
            }
          }
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
          @keyframes phraseFocus {
            0% {
              background-color: rgba(37, 87, 54, 0);
              color: #255736;
            }
            35% {
              background-color: rgba(37, 87, 54, 0.14);
              color: #06402B;
            }
            100% {
              background-color: rgba(37, 87, 54, 0.08);
              color: #06402B;
            }
          }
        `}</style>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={scrollToWhyWeCare}
            className="inline-flex items-center gap-3 bg-muted text-foreground px-12 py-5 rounded-full hover:bg-muted/80 transition-all shadow-lg hover:shadow-xl text-xl font-semibold"
          >
            <Heart className="w-6 h-6" />
            Why We Care
          </button>
          <button
            onClick={scrollToPromoVideo}
            className="inline-flex items-center gap-3 bg-[#e0ca92] text-[#5B4A00] px-12 py-5 rounded-full hover:bg-[#e0ca92] transition-all shadow-lg hover:shadow-xl text-xl font-semibold"
          >
            <PlayCircle className="w-6 h-6" />
            Promo Video
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
      <div id="why-we-care-section" className="max-w-6xl mx-auto scroll-mt-8 md:pb-6">
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
                <p className="text-4xl font-bold text-accent mb-2">80%</p>
                <p className="text-[#255736] font-serif">
                  Nearly 80% of consumers admit to making impulse purchases online
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Promo Video Section */}
      <div id="promo-video-section" className="max-w-6xl mx-auto scroll-mt-8">
        <h2 className="text-4xl md:text-5xl font-bold text-[#06402B] mb-4 text-center font-serif">
          Promo Video
        </h2>

        <div className="rounded-3xl border-2 border-primary/20 bg-card shadow-lg p-4 md:p-6 max-w-[1030px] mx-auto">
          <video
            className="w-full rounded-2xl"
            controls
            preload="metadata"
          >
            <source src={promoVideo} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
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
