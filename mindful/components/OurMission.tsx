import logoImage from '../assets/logo.png';

export function OurMission() {
  return (
    <div>
      <div className="flex flex-col items-center mb-12">
        <img 
          src={typeof logoImage === 'string' ? logoImage : (logoImage as any).default || (logoImage as any).uri || logoImage}
          alt="Logo" 
          className="h-80 w-auto"
        />
      </div>

      <div className="mb-8">
        <h2 className="text-2xl text-[#06402B] font-serif">Our Mission</h2>
      </div>

      <p className="text-[#06402B] leading-relaxed font-serif">
        Long gone are the days of clicking ads, immediately purchasing the product, and forgetting about its existence within days. With personalized guidance and restraints on impulsive spending, our mission is to help users practice intentional, mindful consumption to both instill financial responsibility and also minimize fashion's significant contributions to carbon emissions.
      </p>

      <div className="mt-12 mb-8">
        <h2 className="text-2xl text-[#06402B] font-serif">Why We Care</h2>
      </div>

      <p className="text-[#06402B] leading-relaxed font-serif mb-4">
        We care about both the online shoppers who cannot help but 'add to cart' when they see an item they just cannot resist, as well as the planet! Why?
      </p>
      <ul className="text-[#06402B] leading-relaxed font-serif list-disc list-inside space-y-2">
        <li>The fashion industry is responsible for roughly 10% of global carbon emissions and for roughly 20% of wastewater!</li>
        <li>Consumers are spending an average of $5400 on impulsive purchases every year!</li>
      </ul>

      <div className="mt-12 mb-8">
        <h2 className="text-2xl text-[#06402B] font-serif">Get Started</h2>
      </div>

      <p className="text-[#06402B] leading-relaxed font-serif">
        Add items to purchase after a time constraint goes by or after you complete a goal!
      </p>
    </div>
  );
}
