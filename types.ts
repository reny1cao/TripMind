
export interface Destination {
  id: string;
  name: string;
}

export interface DateRange {
  start: string;
  end: string;
}

export interface District {
  name: string;
  description: string;
}

export interface Attraction {
  name: string;
  description: string;
  duration: string;
  rating: number;
}

export interface Restaurant {
  name:string;
  cuisine: string;
  price: string;
  reservations: string;
}

export interface PointOfInterest {
  name: string;
  type: 'attraction' | 'restaurant';
}

export interface ItineraryActivity {
  time: string;
  activity: string;
  description: string;
  location: string;
  details?: string;
  travelToNext?: {
    mode: string;
    duration: string;
  };
}

export interface ItineraryDay {
  title: string;
  summary: string;
  morning: ItineraryActivity[];
  afternoon: ItineraryActivity[];
  evening: ItineraryActivity[];
}

export interface Itinerary {
  [date: string]: ItineraryDay;
}

// State Management Types
export type AppStep = 'CONFIG' | 'BUILDING' | 'RESULT';

export interface Selections {
  [cityName: string]: PointOfInterest[];
}
