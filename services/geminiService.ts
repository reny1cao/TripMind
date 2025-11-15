import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Destination, DateRange, Selections, Itinerary, District, Attraction, Restaurant, ItineraryDay } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const districtSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
        },
        required: ['name', 'description'],
    }
};

const poiSchema = {
    type: Type.OBJECT,
    properties: {
        attractions: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    duration: { type: Type.STRING, description: "Estimated visit duration, e.g. '1-2 hours'" },
                    rating: { type: Type.NUMBER, description: "Rating out of 5" },
                },
                required: ['name', 'description', 'duration', 'rating'],
            }
        },
        restaurants: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    cuisine: { type: Type.STRING },
                    price: { type: Type.STRING, description: "Price range, e.g. '$', '$$', '$$$'" },
                    reservations: { type: Type.STRING, description: "'Recommended' or 'Not required'"},
                },
                required: ['name', 'cuisine', 'price', 'reservations'],
            }
        }
    },
    required: ['attractions', 'restaurants'],
};

const cleanJsonString = (str: string) => {
    // The model might return a JSON object wrapped in markdown fences,
    // or it might include conversational text before the JSON object.
    // This function attempts to extract the raw JSON string.

    // First, check for markdown fences and extract content within them.
    const match = str.match(/```json\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
        return match[1];
    }

    // If no markdown, find the first '{' and the last '}' to extract the object.
    // This handles cases where conversational text precedes the JSON.
    const firstBrace = str.indexOf('{');
    const lastBrace = str.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace > firstBrace) {
        return str.substring(firstBrace, lastBrace + 1);
    }

    // If no JSON object is found, return the original string for parsing.
    return str;
};

export const fetchDistricts = async (city: string): Promise<District[]> => {
    // FIX: Updated prompt to explicitly ask for JSON output, as responseSchema and responseMimeType are not compatible with the googleMaps tool.
    const prompt = `For the city of ${city}, list its main districts or neighborhoods popular with tourists. For each one, provide a short, catchy description. Use up-to-date information from Google Maps. Return the result as a JSON array of objects, where each object has "name" and "description" properties.`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: [{ googleMaps: {} }],
        }
    });
    
    const cleaned = cleanJsonString(response.text);
    return JSON.parse(cleaned) as District[];
};

export const fetchPois = async (city: string, district: string): Promise<{ attractions: Attraction[], restaurants: Restaurant[] }> => {
    // FIX: Updated prompt to explicitly ask for JSON output, as responseSchema and responseMimeType are not compatible with the googleMaps tool.
    const prompt = `In the ${district} of ${city}, list the top 5 tourist attractions and top 5 highly-rated restaurants based on Google Maps data. For attractions, include a short description, an estimated visit duration (e.g., '1-2 hours'), and a rating out of 5. For restaurants, include the cuisine type, a price range (e.g., $, $$, $$$), and if reservations are recommended. Return the result as a JSON object with two keys: "attractions" and "restaurants", each containing an array of the respective items.`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: [{ googleMaps: {} }],
        }
    });
    
    const cleaned = cleanJsonString(response.text);
    return JSON.parse(cleaned) as { attractions: Attraction[], restaurants: Restaurant[] };
};

export const generateItinerary = async (
    destinations: Destination[],
    dateRange: DateRange,
    selections: Selections
): Promise<Itinerary> => {
    const selectionsText = destinations.map(d => 
        `For ${d.name}, the traveler is interested in:\n${selections[d.name].map(s => `- ${s.name} (${s.type})`).join('\n')}`
    ).join('\n\n');

    const prompt = `
You are a world-class travel planner AI. Create a detailed, optimized, day-by-day itinerary for a trip.

**Trip Details:**
- **Destinations (in order):** ${destinations.map(d => d.name).join(', ')}
- **Travel Dates:** ${dateRange.start} to ${dateRange.end}

**Traveler's Interests:**
${selectionsText}

**Your Task:**
1.  **Allocate Days:** Sensibly allocate the total number of days across the chosen destinations.
2.  **Daily Schedule:** For each day, create a schedule for "Morning", "Afternoon", and "Evening".
3.  **Optimization:** Group attractions that are geographically close to each other to minimize travel time. Use Google Search and Google Maps for real-time information.
4.  **Logistics:** Include realistic travel times and modes (e.g., walking, metro, taxi) between activities.
5.  **Details:** For each activity, provide a brief, engaging description. Suggest lunch and dinner spots from the user's selections or find suitable, highly-rated options near the day's attractions. Reference current opening hours.
6.  **Format:** Return the entire plan as a single, valid JSON object. The root object should have a key for each date in 'YYYY-MM-DD' format. Each date's value is an object containing 'title', 'summary', and arrays for 'morning', 'afternoon', and 'evening' activities. Each activity object must have 'time', 'activity', 'description', and 'location'. It can optionally include 'details' (like booking info) and 'travelToNext' (with 'mode' and 'duration').

**Example Activity Object:**
{
  "time": "10:00 AM - 1:00 PM",
  "activity": "Visit the Louvre Museum",
  "description": "Explore one of the world's largest art museums and a historic monument.",
  "location": "Rue de Rivoli, 75001 Paris, France",
  "travelToNext": { "mode": "Metro", "duration": "15 minutes" }
}

IMPORTANT: Your entire response must be ONLY the raw JSON object. Do not include any conversational text, explanations, or markdown fences.
`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            thinkingConfig: { thinkingBudget: 32768 },
            tools: [{ googleSearch: {} }, { googleMaps: {} }]
        },
    });

    const cleaned = cleanJsonString(response.text);
    return JSON.parse(cleaned) as Itinerary;
};

export const generateMapImage = async (dayDetails: ItineraryDay): Promise<string> => {
    const locations = [...dayDetails.morning, ...dayDetails.afternoon, ...dayDetails.evening]
        .map((activity, index) => `${index + 1}. ${activity.activity}`)
        .join('\n');

    if (!locations) {
        throw new Error("No locations available for this day to generate a map.");
    }

    const prompt = `
Create a stylized, visually appealing tourist map for a day trip titled "${dayDetails.title}".
The map should clearly show the following locations in order, with a fun, dotted line or arrows indicating the travel path between them:
${locations}

Label each location on the map with its corresponding number.
The style should be colorful and illustrative, like a hand-drawn map in a travel journal or a cute video game map. Do not use a realistic satellite or street map style. Keep it simple and creative.
`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [{ text: prompt }],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            return `data:image/png;base64,${base64ImageBytes}`;
        }
    }

    throw new Error("Image generation failed, no image data received.");
};

export const generateOverallMapImage = async (itinerary: Itinerary): Promise<string> => {
    const destinationsInOrder = Object.values(itinerary)
      .map(day => (day.title.split(' in ')[1] || day.title))
      .filter((value, index, self) => self.indexOf(value) === index);

    const destinationsText = destinationsInOrder.map((city, index) => `${index + 1}. ${city}`).join('\n');

    const prompt = `
Create a stylized, visually appealing tourist map for an entire trip.
The map should show the travel route between the following destinations in order:
${destinationsText}

The style should be like a vintage travel poster or an adventurous treasure map. Illustrate each destination with a small, iconic landmark. Connect the destinations with a clear, dotted line showing the journey's progression.
The overall title should be "My Epic Journey".
Do not use a realistic satellite or street map style. Keep it artistic, simple, and creative.
`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [{ text: prompt }],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            return `data:image/png;base64,${base64ImageBytes}`;
        }
    }

    throw new Error("Overall map generation failed, no image data received.");
};

export const generateChinaMap = async (): Promise<string> => {
    const prompt = `
Create a simple, stylized map of China suitable for a travel planning app.
- Style: Clean, modern, with a light-colored background (e.g., #f0f9ff).
- Labels: Clearly label major tourist cities: Beijing, Shanghai, Xi'an, Guilin, Chengdu, Guangzhou, and Hong Kong. Use a clear, legible font.
- Features: Include major rivers like the Yangtze and Yellow River as simple lines.
- Do not include too much clutter, roads, or provincial borders. Keep it minimalist and visually appealing.
`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [{ text: prompt }],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
        }
    }
    throw new Error("China map generation failed.");
};

export const getCityFromMapClick = async (
    mapImage: string, // base64 string
    clickX: number,
    clickY: number,
    imageWidth: number,
    imageHeight: number
): Promise<string> => {
    const base64Data = mapImage.split(',')[1]; // Remove "data:image/png;base64," prefix

    const prompt = `
Analyze the provided map image of China. A user clicked at the coordinate (${clickX}, ${clickY}).
The image dimensions are ${imageWidth}x${imageHeight} pixels.
Identify the major city label closest to this click point.
Respond with ONLY the name of the city. For example: 'Beijing'. If no city is nearby, respond with 'Unknown'.
`;

    const imagePart = {
        inlineData: {
            mimeType: 'image/png',
            data: base64Data,
        },
    };
    const textPart = {
        text: prompt,
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
    });

    const cityName = response.text.trim();
    if (cityName.toLowerCase() === 'unknown') {
        throw new Error("No city identified at this location.");
    }
    return cityName;
};