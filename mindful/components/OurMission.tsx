interface OurMissionProps {
  onGetStarted: () => void;
}

export function OurMission({ onGetStarted }: OurMissionProps) {
  return (
    <div className="min-h-[calc(100vh-150px)] flex flex-col items-center justify-center py-12 px-4">
      <div className="max-w-5xl w-full space-y-16">
        {/* Hero Section */}
        <div className="text-center space-y-8">
          <h1 className="text-5xl md:text-6xl font-bold text-[#06402B] font-serif">
            Our Mission
          </h1>
          
          <p className="text-xl md:text-2xl text-[#06402B]/80 leading-relaxed font-serif max-w-4xl mx-auto">
            Long gone are the days of clicking ads, immediately purchasing the product, and forgetting about its existence within days. With personalized guidance and restraints on impulsive spending, our mission is to help users practice intentional, mindful consumption to both instill financial responsibility and also minimize fashion's significant contributions to carbon emissions.
          </p>
          
          <button
            onClick={onGetStarted}
            className="inline-flex items-center gap-3 bg-primary text-primary-foreground px-10 py-5 rounded-full hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl text-xl font-semibold mt-8"
          >
            Get Started
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>

        {/* Why We Care Section */}
        <div className="bg-card rounded-3xl shadow-xl border border-border p-10 md:p-12">
          <h2 className="text-3xl md:text-4xl text-[#06402B] font-serif font-bold mb-6 text-center">
            Why We Care
          </h2>
          
          <p className="text-lg text-[#06402B]/80 leading-relaxed font-serif mb-6 text-center">
            We care about both the online shoppers who cannot help but 'add to cart' when they see an item they just cannot resist, as well as the planet! Why?
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 mt-8">
            <div className="bg-primary/5 rounded-2xl p-6 border-2 border-primary/20">
              <div className="text-4xl mb-4 text-center">🌍</div>
              <p className="text-[#06402B] leading-relaxed font-serif text-center">
                The fashion industry is responsible for roughly <strong>10% of global carbon emissions</strong> and for roughly <strong>20% of wastewater!</strong>
              </p>
            </div>
            
            <div className="bg-primary/5 rounded-2xl p-6 border-2 border-primary/20">
              <div className="text-4xl mb-4 text-center">💰</div>
              <p className="text-[#06402B] leading-relaxed font-serif text-center">
                Consumers are spending an average of <strong>$5,400 on impulsive purchases</strong> every year!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
