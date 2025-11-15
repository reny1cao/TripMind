import React, { useState, useEffect } from 'react';
import { Itinerary, ItineraryDay } from '../types';
import { PlaneIcon } from './icons';
import TripMapImage from './GoogleMap';
import { generateOverallMapImage, generateMapImage } from '../services/geminiService';

interface ItineraryViewProps {
  itinerary: Itinerary;
  onReset: () => void;
}

const ItineraryView: React.FC<ItineraryViewProps> = ({ itinerary, onReset }) => {
  const sortedDays = Object.keys(itinerary).sort();
  
  // State to cache map images. Key can be a date or 'overall'. Value is URL, 'loading', or 'error'.
  const [mapImageCache, setMapImageCache] = useState<{ [key: string]: string | 'loading' | 'error' }>({});
  
  // 'overall' for the whole trip map, or a date string for a daily map.
  const [activeView, setActiveView] = useState<string>('overall'); 

  // Fetch the overall trip map when the component mounts
  useEffect(() => {
    const generateOverall = async () => {
        if (mapImageCache['overall']) return; // Don't refetch if already cached
        setMapImageCache(prev => ({ ...prev, overall: 'loading' }));
        try {
            const url = await generateOverallMapImage(itinerary);
            setMapImageCache(prev => ({ ...prev, overall: url }));
        } catch (e) {
            console.error("Failed to generate overall map:", e);
            setMapImageCache(prev => ({ ...prev, overall: 'error' }));
        }
    };
    generateOverall();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itinerary]);

  const handleSelectView = async (view: string) => {
    setActiveView(view);

    // If we're selecting a day and its map isn't already cached or loading
    if (view !== 'overall' && !mapImageCache[view]) {
        setMapImageCache(prev => ({ ...prev, [view]: 'loading' }));
        try {
            const url = await generateMapImage(itinerary[view]);
            setMapImageCache(prev => ({ ...prev, [view]: url }));
        } catch (e) {
            console.error(`Failed to generate map for ${view}:`, e);
            setMapImageCache(prev => ({ ...prev, [view]: 'error' }));
        }
    }
  };

  const currentImageState = mapImageCache[activeView];
  const isLoadingMap = currentImageState === 'loading';
  const mapError = currentImageState === 'error' ? "Sorry, we couldn't draw the map for this view." : null;
  const imageUrl = typeof currentImageState === 'string' && !['loading', 'error'].includes(currentImageState) ? currentImageState : null;
  
  const mapTitle = activeView === 'overall' 
    ? "Your Overall Trip" 
    : itinerary[activeView]?.title || "Daily Map";

  const mapDescription = activeView === 'overall'
    ? "An overview of your entire adventure. Select a day for details."
    : itinerary[activeView]?.summary || "A map of this day's activities.";

  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg border border-gray-200 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-800">Your Epic Journey Awaits!</h2>
        <p className="text-gray-500 mt-2 text-lg max-w-3xl mx-auto">Here is your personalized travel plan. Select an option below to see the detailed schedule and a custom-drawn map.</p>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-3/5 h-[400px] lg:h-[600px] rounded-xl overflow-hidden shadow-lg border border-gray-200">
              <TripMapImage 
                isLoading={isLoadingMap} 
                error={mapError} 
                imageUrl={imageUrl}
                title={mapTitle}
                description={mapDescription}
              />
          </div>
          <div className="lg:w-2/5">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Daily Schedule</h3>
              <div className="space-y-2 h-[540px] overflow-y-auto pr-2 custom-scrollbar">
                <OverallTripCard 
                    isSelected={activeView === 'overall'}
                    onSelect={() => handleSelectView('overall')}
                />
                {sortedDays.map((date, index) => (
                  <DayCard 
                    key={date} 
                    date={date} 
                    dayDetails={itinerary[date]} 
                    dayNumber={index + 1}
                    isSelected={date === activeView}
                    onSelect={() => handleSelectView(date)}
                  />
                ))}
              </div>
          </div>
      </div>
      
      <div className="mt-10 text-center">
        <button
          onClick={onReset}
          className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition text-lg"
        >
          Plan a New Trip
        </button>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #94a3b8;
            border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #64748b;
        }
      `}</style>
    </div>
  );
};

const OverallTripCard: React.FC<{isSelected: boolean, onSelect: () => void}> = ({ isSelected, onSelect }) => (
    <div className={`border rounded-xl overflow-hidden transition-all duration-300 ${isSelected ? 'border-blue-500 shadow-md bg-white' : 'border-gray-200 bg-gray-50'}`}>
        <button onClick={onSelect} className={`w-full text-left p-4 transition flex justify-between items-center ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-100'}`}>
            <div>
                <span className={`font-bold text-sm ${isSelected ? 'text-blue-600' : 'text-gray-500'}`}>TRIP OVERVIEW</span>
                <h3 className="text-lg font-bold text-gray-800">Your Entire Journey</h3>
                <p className="text-sm text-gray-500">View the map for all destinations</p>
            </div>
        </button>
    </div>
);

const DayCard: React.FC<{
  date: string, 
  dayDetails: ItineraryDay, 
  dayNumber: number,
  isSelected: boolean,
  onSelect: () => void,
}> = ({ date, dayDetails, dayNumber, isSelected, onSelect }) => {
    const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    return (
        <div className={`border rounded-xl overflow-hidden transition-all duration-300 ${isSelected ? 'border-blue-500 shadow-md bg-white' : 'border-gray-200 bg-gray-50'}`}>
            <button onClick={onSelect} className={`w-full text-left p-4 transition flex justify-between items-center ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-100'}`}>
                <div>
                    <span className={`font-bold text-sm ${isSelected ? 'text-blue-600' : 'text-gray-500'}`}>DAY {dayNumber}</span>
                    <h3 className="text-lg font-bold text-gray-800">{dayDetails.title}</h3>
                    <p className="text-sm text-gray-500">{formattedDate}</p>
                </div>
                 <svg className={`w-6 h-6 text-gray-500 transform transition-transform ${isSelected ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isSelected && (
                 <div className="p-6 border-t border-gray-200 space-y-6 animate-fade-in-down">
                    <p className="text-gray-600 pb-4 border-b border-gray-200 italic">{dayDetails.summary}</p>
                    <ActivityBlock title="Morning" activities={dayDetails.morning} />
                    <ActivityBlock title="Afternoon" activities={dayDetails.afternoon} />
                    <ActivityBlock title="Evening" activities={dayDetails.evening} />
                </div>
            )}
        </div>
    );
};


const ActivityBlock: React.FC<{title: string, activities: Itinerary['any']['morning']}> = ({title, activities}) => {
    if(!activities || activities.length === 0) return null;
    return (
        <div>
            <h4 className="text-lg font-semibold text-blue-700 mb-3">{title}</h4>
            <div className="relative border-l-2 border-blue-200 pl-6 space-y-6">
                 {activities.map((activity, index) => (
                    <div key={index} className="relative">
                        <div className="absolute -left-[34px] top-1 h-4 w-4 bg-blue-500 rounded-full border-4 border-white"></div>
                        <p className="font-bold text-gray-800">{activity.time}: {activity.activity}</p>
                        <p className="text-sm text-gray-600">{activity.description}</p>
                        <p className="text-xs text-gray-500 mt-1">Location: {activity.location}</p>
                        {activity.details && <p className="text-xs text-blue-600 mt-1">{activity.details}</p>}
                        {activity.travelToNext && (
                            <div className="mt-3 flex items-center text-xs text-gray-500 italic">
                                <PlaneIcon className="w-4 h-4 mr-2" />
                                <span>{activity.travelToNext.mode} ({activity.travelToNext.duration}) to next activity</span>
                            </div>
                        )}
                    </div>
                 ))}
            </div>
        </div>
    );
}

export default ItineraryView;