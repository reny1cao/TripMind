
import React, { useState, useCallback, useMemo } from 'react';
import { AppStep, Destination, Selections, Itinerary, DateRange } from './types';
import DestinationSelector from './components/DestinationSelector';
import ItineraryBuilder from './components/ItineraryBuilder';
import ItineraryView from './components/ItineraryView';
import { generateItinerary } from './services/geminiService';
import { Header } from './components/Header';
import { LoadingSpinner } from './components/LoadingSpinner';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>('CONFIG');
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>({ start: '', end: '' });
  const [selections, setSelections] = useState<Selections>({});
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDestinationsSubmit = (dests: Destination[], dates: DateRange) => {
    setDestinations(dests);
    setDateRange(dates);
    setSelections(dests.reduce((acc, curr) => ({ ...acc, [curr.name]: [] }), {}));
    setStep('BUILDING');
  };

  const handleGenerateItinerary = useCallback(async () => {
    setError(null);
    setLoading('Generating your personalized itinerary... This may take a minute for complex trips.');
    try {
      const generatedItinerary = await generateItinerary(destinations, dateRange, selections);
      setItinerary(generatedItinerary);
      setStep('RESULT');
    } catch (e) {
      console.error(e);
      setError('Sorry, something went wrong while generating your itinerary. Please try again.');
    } finally {
      setLoading(null);
    }
  }, [destinations, dateRange, selections]);
  
  const handleReset = () => {
    setStep('CONFIG');
    setDestinations([]);
    setDateRange({ start: '', end: '' });
    setSelections({});
    setItinerary(null);
    setError(null);
    setLoading(null);
  }

  const progress = useMemo(() => {
    if (step === 'CONFIG') return 25;
    if (step === 'BUILDING') return 50;
    if (step === 'RESULT') return 100;
    return 0;
  }, [step]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onReset={handleReset} />
      <main className="container mx-auto p-4 md:p-8 max-w-7xl">
        <div className="w-full bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Your Progress</h2>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
            </div>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center text-center p-8 bg-white rounded-xl shadow-lg border border-gray-200">
            <LoadingSpinner />
            <p className="mt-4 text-lg font-semibold text-blue-600">{loading}</p>
            <p className="mt-2 text-gray-500 max-w-md">Our AI is crafting the perfect trip, optimizing routes and checking details just for you.</p>
          </div>
        )}

        {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-md" role="alert">
                <p className="font-bold">Error</p>
                <p>{error}</p>
            </div>
        )}

        {!loading && (
          <>
            {step === 'CONFIG' && <DestinationSelector onSubmit={handleDestinationsSubmit} />}
            {step === 'BUILDING' && (
              <ItineraryBuilder
                destinations={destinations}
                selections={selections}
                setSelections={setSelections}
                onGenerate={handleGenerateItinerary}
              />
            )}
            {step === 'RESULT' && itinerary && <ItineraryView itinerary={itinerary} onReset={handleReset}/>}
          </>
        )}
      </main>
    </div>
  );
};

export default App;
