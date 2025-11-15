import React, { useState, useEffect, useCallback } from 'react';
import { Destination, Selections, District, Attraction, Restaurant, PointOfInterest } from '../types';
import { fetchDistricts, fetchPois } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import { PlusIcon } from './icons';

interface ItineraryBuilderProps {
  destinations: Destination[];
  selections: Selections;
  setSelections: React.Dispatch<React.SetStateAction<Selections>>;
  onGenerate: () => void;
}

const ItineraryBuilder: React.FC<ItineraryBuilderProps> = ({ destinations, selections, setSelections, onGenerate }) => {
  const [activeDestination, setActiveDestination] = useState<Destination>(destinations[0]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [activeDistrict, setActiveDistrict] = useState<District | null>(null);
  const [pois, setPois] = useState<{ attractions: Attraction[], restaurants: Restaurant[] } | null>(null);
  const [loading, setLoading] = useState<'districts' | 'pois' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadDistricts = useCallback(async (destination: Destination) => {
    setLoading('districts');
    setError(null);
    setDistricts([]);
    setActiveDistrict(null);
    setPois(null);
    try {
      const fetchedDistricts = await fetchDistricts(destination.name);
      setDistricts(fetchedDistricts);
    } catch (e) {
      setError(`Failed to load districts for ${destination.name}.`);
      console.error(e);
    } finally {
      setLoading(null);
    }
  }, []);

  useEffect(() => {
    loadDistricts(activeDestination);
  }, [activeDestination, loadDistricts]);

  const handleSelectDistrict = async (district: District) => {
    setActiveDistrict(district);
    setLoading('pois');
    setError(null);
    setPois(null);
    try {
      const fetchedPois = await fetchPois(activeDestination.name, district.name);
      setPois(fetchedPois);
    } catch (e) {
      setError(`Failed to load points of interest for ${district.name}.`);
      console.error(e);
    } finally {
      setLoading(null);
    }
  };
  
  const toggleSelection = (poi: PointOfInterest) => {
    const citySelections = selections[activeDestination.name] || [];
    const isSelected = citySelections.some(s => s.name === poi.name);
    
    let newSelections;
    if (isSelected) {
        newSelections = citySelections.filter(s => s.name !== poi.name);
    } else {
        newSelections = [...citySelections, poi];
    }
    setSelections(prev => ({ ...prev, [activeDestination.name]: newSelections }));
  };

  const isPoiSelected = (name: string) => {
    return selections[activeDestination.name]?.some(s => s.name === name);
  };
  
  // FIX: Replaced reduce with flat() and length to fix a potential typing issue with Object.values and for better readability.
  const totalSelections = Object.values(selections).flat().length;

  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg border border-gray-200">
      <h2 className="text-3xl font-bold text-gray-800 mb-2">Craft Your Adventure</h2>
      <p className="text-gray-500 mb-8">Select attractions and restaurants for each destination.</p>

      <div className="flex flex-wrap border-b border-gray-200 mb-6">
        {destinations.map(dest => (
          <button
            key={dest.id}
            onClick={() => setActiveDestination(dest)}
            className={`px-4 py-3 font-semibold text-lg transition ${activeDestination.id === dest.id ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-blue-500'}`}
          >
            {dest.name} ({selections[dest.name]?.length || 0})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <h3 className="font-bold text-xl text-gray-800 mb-4">Neighborhoods in {activeDestination.name}</h3>
          {loading === 'districts' && <div className="flex justify-center p-4"><LoadingSpinner /></div>}
          <ul className="space-y-2">
            {districts.map(district => (
              <li key={district.name}>
                <button
                  onClick={() => handleSelectDistrict(district)}
                  className={`w-full text-left p-3 rounded-lg transition ${activeDistrict?.name === district.name ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  <p className="font-semibold">{district.name}</p>
                  <p className="text-sm text-gray-600">{district.description}</p>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="md:col-span-2">
           <h3 className="font-bold text-xl text-gray-800 mb-4">
             {activeDistrict ? `Discover ${activeDistrict.name}` : "Select a neighborhood"}
           </h3>
           {loading === 'pois' && <div className="flex justify-center p-4"><LoadingSpinner /></div>}
           {error && <div className="bg-red-100 text-red-700 p-3 rounded-md">{error}</div>}
           {pois && (
            <div className="space-y-6">
                <div>
                    <h4 className="text-lg font-semibold text-gray-700 mb-3">Attractions</h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        {pois.attractions.map(attraction => (
                            <PoiCard key={attraction.name} onToggle={() => toggleSelection({name: attraction.name, type: 'attraction'})} isSelected={isPoiSelected(attraction.name)}>
                                <h5 className="font-bold">{attraction.name}</h5>
                                <p className="text-sm text-gray-500">{attraction.description}</p>
                                <div className="text-xs mt-2 flex justify-between text-gray-600">
                                    <span>Duration: {attraction.duration}</span>
                                    <span className="font-semibold">Rating: {attraction.rating}/5</span>
                                </div>
                            </PoiCard>
                        ))}
                    </div>
                </div>
                <div>
                    <h4 className="text-lg font-semibold text-gray-700 mb-3">Restaurants</h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        {pois.restaurants.map(restaurant => (
                             <PoiCard key={restaurant.name} onToggle={() => toggleSelection({name: restaurant.name, type: 'restaurant'})} isSelected={isPoiSelected(restaurant.name)}>
                                <h5 className="font-bold">{restaurant.name}</h5>
                                <p className="text-sm text-gray-500">{restaurant.cuisine}</p>
                                <div className="text-xs mt-2 flex justify-between text-gray-600">
                                    <span>Price: {restaurant.price}</span>
                                    <span className="font-semibold">{restaurant.reservations}</span>
                                </div>
                            </PoiCard>
                        ))}
                    </div>
                </div>
            </div>
           )}
        </div>
      </div>
      
      <div className="mt-8 pt-6 border-t border-gray-200 text-right">
        <button
          onClick={onGenerate}
          disabled={totalSelections === 0}
          className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition text-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Generate Itinerary ({totalSelections} items)
        </button>
      </div>
    </div>
  );
};

const PoiCard: React.FC<{onToggle: () => void, isSelected: boolean, children: React.ReactNode}> = ({onToggle, isSelected, children}) => (
    <div className={`p-3 border rounded-lg relative ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>
        {children}
        <button onClick={onToggle} className={`absolute top-2 right-2 h-7 w-7 rounded-full flex items-center justify-center transition ${isSelected ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-blue-500 hover:text-white'}`}>
            <PlusIcon className={`h-4 w-4 transition-transform ${isSelected ? 'rotate-45' : ''}`} />
        </button>
    </div>
)

export default ItineraryBuilder;