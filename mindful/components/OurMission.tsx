import { Sparkles, TrendingDown, DollarSign, Target, Clock } from 'lucide-react';

interface OurMissionProps {
  onGetStarted: () => void;
}

export function OurMission({ onGetStarted }: OurMissionProps) {
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
          onClick={onGetStarted}
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

      {/* How It Works Section */}
      <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-3xl p-12 border border-primary/10">
        <h2 className="text-3xl md:text-4xl font-bold text-[#06402B] mb-8 text-center font-serif">
          How It Works
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Time-Based Constraint */}
          <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-[#06402B] font-serif">Time-Based</h3>
            </div>
            <p className="text-[#255736] font-serif">
              Set a waiting period before purchasing. Take time to reflect and ensure it's something you truly need.
            </p>
          </div>

          {/* Goals-Based Constraint */}
          <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <Target className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-bold text-[#06402B] font-serif">Goals-Based</h3>
            </div>
            <p className="text-[#255736] font-serif">
              Complete a personal goal before making your purchase. Turn shopping into a reward system!
            </p>
          </div>
        </div>

        <div className="text-center mt-8">
          <button
            onClick={onGetStarted}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-full hover:bg-primary/90 transition-all shadow-md hover:shadow-lg text-lg font-semibold"
          >
            Start Your Journey
          </button>
        </div>
      </div>
    </div>
  );
}
