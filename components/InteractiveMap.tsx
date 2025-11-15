import React, { useState, useEffect, useRef } from 'react';
import { generateChinaMap, getCityFromMapClick } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import { MapPinIcon } from './icons';

interface InteractiveMapProps {
    onCitySelect: (city: string) => void;
    onCityIdentifyError: (error: string) => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({ onCitySelect, onCityIdentifyError }) => {
    const [mapImageUrl, setMapImageUrl] = useState<string | null>(null);
    const [isLoadingMap, setIsLoadingMap] = useState(true);
    const [isIdentifying, setIsIdentifying] = useState(false);
    const [clickPosition, setClickPosition] = useState<{ x: number, y: number } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const mapRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        const fetchMap = async () => {
            try {
                const url = await generateChinaMap();
                setMapImageUrl(url);
            } catch (err) {
                console.error(err);
                setError("Could not generate the interactive map. Please use text input.");
            } finally {
                setIsLoadingMap(false);
            }
        };
        fetchMap();
    }, []);

    const handleMapClick = async (event: React.MouseEvent<HTMLDivElement>) => {
        if (!mapImageUrl || isIdentifying || !mapRef.current) return;

        const rect = mapRef.current.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const naturalWidth = mapRef.current.naturalWidth;
        const naturalHeight = mapRef.current.naturalHeight;

        const scaledX = Math.round((x / rect.width) * naturalWidth);
        const scaledY = Math.round((y / rect.height) * naturalHeight);

        setClickPosition({ x, y });
        setIsIdentifying(true);
        onCityIdentifyError('');

        try {
            const cityName = await getCityFromMapClick(mapImageUrl, scaledX, scaledY, naturalWidth, naturalHeight);
            onCitySelect(cityName);
        } catch (err) {
            console.error(err);
            onCityIdentifyError("Could not identify a city at this location. Please try again.");
        } finally {
            setIsIdentifying(false);
            setTimeout(() => setClickPosition(null), 1000);
        }
    };

    if (isLoadingMap) {
        return (
            <div className="h-96 flex flex-col items-center justify-center bg-gray-100 rounded-lg">
                <LoadingSpinner />
                <p className="mt-4 text-gray-600">Generating your interactive map...</p>
            </div>
        );
    }

    if (error) {
        return <div className="h-96 flex items-center justify-center bg-red-50 text-red-700 rounded-lg">{error}</div>;
    }

    return (
        <div 
            className="relative w-full h-96 cursor-pointer rounded-lg overflow-hidden border border-gray-300 bg-gray-50"
            onClick={handleMapClick}
        >
            {mapImageUrl && <img ref={mapRef} src={mapImageUrl} alt="Interactive map of China" className="w-full h-full object-contain" />}
            
            {isIdentifying && (
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                    <div className="flex flex-col items-center text-white">
                        <LoadingSpinner />
                        <p className="mt-2 font-semibold">Identifying city...</p>
                    </div>
                </div>
            )}
            
            {clickPosition && (
                 <MapPinIcon 
                    className="absolute w-8 h-8 text-red-500 transition-opacity duration-1000"
                    style={{ left: `${clickPosition.x - 16}px`, top: `${clickPosition.y - 32}px`, pointerEvents: 'none' }}
                 />
            )}
        </div>
    );
};