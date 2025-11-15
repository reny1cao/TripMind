import React from 'react';
import { PlaneIcon } from './icons';

interface HeaderProps {
    onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onReset }) => (
    <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-3">
                <PlaneIcon className="h-8 w-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-800">
                    TripMind Trip Planner
                </h1>
            </div>
            <button
                onClick={onReset}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition duration-200"
            >
                Start Over
            </button>
        </div>
    </header>
);