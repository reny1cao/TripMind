import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { MapPinIcon } from './icons';

interface TripMapImageProps {
    imageUrl: string | null;
    isLoading: boolean;
    error: string | null;
    title: string;
    description: string;
}

const TripMapImage: React.FC<TripMapImageProps> = ({ imageUrl, isLoading, error, title, description }) => {

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-gray-100 rounded-xl">
                <LoadingSpinner />
                <p className="mt-4 font-semibold text-blue-600">Drawing your custom map...</p>
                <p className="mt-1 text-sm text-gray-500">Our AI artist is at work!</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-red-50 text-red-700 p-4 rounded-xl">
                <p className="font-bold">Map Error</p>
                <p>{error}</p>
            </div>
        );
    }
    
    if (imageUrl) {
        return (
            <div className="h-full w-full bg-gray-200">
                <img src={imageUrl} alt={`A stylized map for ${title}`} className="h-full w-full object-cover" />
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center h-full bg-gray-100 rounded-xl text-center p-4">
             <MapPinIcon className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-bold text-gray-700">{title}</h3>
            <p className="text-gray-500">{description}</p>
        </div>
    );
};

export default TripMapImage;
