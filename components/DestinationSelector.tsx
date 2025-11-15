
import React, { useState } from 'react';
import { Destination, DateRange } from '../types';
import { PlusIcon, TrashIcon, MapPinIcon, CalendarIcon } from './icons';
import { InteractiveMap } from './InteractiveMap';

interface DestinationSelectorProps {
  onSubmit: (destinations: Destination[], dateRange: DateRange) => void;
}

const DestinationSelector: React.FC<DestinationSelectorProps> = ({ onSubmit }) => {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [currentDestination, setCurrentDestination] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>({ start: '', end: '' });
  const [error, setError] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string>('');
  const [selectionMode, setSelectionMode] = useState<'text' | 'map'>('text');
  
  const today = new Date().toISOString().split('T')[0];

  const addDestination = () => {
    if (currentDestination && !destinations.find(d => d.name.toLowerCase() === currentDestination.toLowerCase())) {
      setDestinations([...destinations, { id: Date.now().toString(), name: currentDestination }]);
      setCurrentDestination('');
      setError(null);
    }
  };

  const addDestinationFromMap = (cityName: string) => {
    if (cityName && !destinations.find(d => d.name.toLowerCase() === cityName.toLowerCase())) {
        setDestinations(prev => [...prev, { id: Date.now().toString(), name: cityName }]);
        setError(null);
    } else if (cityName) {
        setMapError(`${cityName} is already in your itinerary.`);
    }
  };

  const removeDestination = (id: string) => {
    setDestinations(destinations.filter(d => d.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (destinations.length === 0) {
      setError('Please add at least one destination.');
      return;
    }
    if (!dateRange.start || !dateRange.end) {
      setError('Please select a start and end date for your trip.');
      return;
    }
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (diffDays < 1) {
        setError('The trip must be at least 1 day long.');
        return;
    }
    if (diffDays > 90) {
        setError('The trip cannot be longer than 90 days.');
        return;
    }

    setError(null);
    onSubmit(destinations, dateRange);
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 animate-fade-in">
      <h2 className="text-3xl font-bold text-gray-800 mb-2">Plan Your Dream Trip</h2>
      <p className="text-gray-500 mb-8">Start by telling us where you want to go and when.</p>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded-md mb-6">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <div className="flex justify-between items-center mb-4">
              <label className="block text-lg font-semibold text-gray-700">Destinations</label>
              <div className="flex items-center rounded-lg bg-gray-100 p-1">
                  <button type="button" onClick={() => setSelectionMode('text')} className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${selectionMode === 'text' ? 'bg-white text-blue-600 shadow' : 'text-gray-600 hover:bg-gray-200'}`}>Text</button>
                  <button type="button" onClick={() => setSelectionMode('map')} className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${selectionMode === 'map' ? 'bg-white text-blue-600 shadow' : 'text-gray-600 hover:bg-gray-200'}`}>Map</button>
              </div>
          </div>
          
          {selectionMode === 'text' ? (
              <div className="flex space-x-2">
                  <div className="relative flex-grow">
                      <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                          id="destination"
                          type="text"
                          value={currentDestination}
                          onChange={(e) => setCurrentDestination(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addDestination())}
                          placeholder="e.g., Paris, France"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      />
                  </div>
                  <button
                      type="button"
                      onClick={addDestination}
                      className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition flex items-center"
                  >
                      <PlusIcon className="h-5 w-5" />
                      <span className="ml-2 hidden md:inline">Add</span>
                  </button>
              </div>
          ) : (
              <div>
                  <p className="text-sm text-gray-500 mb-3">Click on the generative map of China to add a destination.</p>
                  <InteractiveMap onCitySelect={addDestinationFromMap} onCityIdentifyError={setMapError} />
                  {mapError && <p className="text-red-600 text-sm mt-2">{mapError}</p>}
              </div>
          )}

          <ul className="mt-4 space-y-2">
            {destinations.map((dest, index) => (
              <li key={dest.id} className="flex justify-between items-center bg-gray-100 p-3 rounded-lg animate-fade-in-up">
                <span className="font-medium text-gray-700">{index + 1}. {dest.name}</span>
                <button type="button" onClick={() => removeDestination(dest.id)} className="text-red-500 hover:text-red-700">
                  <TrashIcon className="h-5 w-5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
        
        <div>
          <label className="block text-lg font-semibold text-gray-700 mb-2">Travel Dates</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                    type="date"
                    value={dateRange.start}
                    min={today}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
            </div>
            <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                    type="date"
                    value={dateRange.end}
                    min={dateRange.start || today}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
            </div>
          </div>
        </div>
        
        <button
          type="submit"
          className="w-full bg-blue-600 text-white font-bold py-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition text-lg"
        >
          Build My Itinerary
        </button>
      </form>
    </div>
  );
};

export default DestinationSelector;