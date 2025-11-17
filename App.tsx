
import React, { useState, useRef, useCallback } from 'react';
import { Canvas } from './components/Canvas';
import type { CanvasRef } from './types';
import { generateFantasyImage } from './services/geminiService';

const LoadingSpinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center space-y-4">
    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
    <p className="text-lg text-purple-300 font-fantasy tracking-wider">Conjuring Magic...</p>
  </div>
);

const Toolbar: React.FC<{
  color: string;
  setColor: (color: string) => void;
  lineWidth: number;
  setLineWidth: (width: number) => void;
  clearCanvas: () => void;
  generateImage: () => void;
  isLoading: boolean;
}> = ({ color, setColor, lineWidth, setLineWidth, clearCanvas, generateImage, isLoading }) => (
  <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-lg shadow-lg flex flex-col md:flex-row items-center gap-4 md:gap-6 border border-gray-700">
    <div className="flex items-center gap-3">
      <label htmlFor="colorPicker" className="text-sm font-semibold text-gray-300">Color</label>
      <input
        id="colorPicker"
        type="color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
        className="w-10 h-10 p-1 bg-gray-700 border-2 border-gray-600 rounded-md cursor-pointer"
        disabled={isLoading}
      />
    </div>
    <div className="flex items-center gap-3 w-full md:w-auto">
      <label htmlFor="lineWidth" className="text-sm font-semibold text-gray-300">Size</label>
      <input
        id="lineWidth"
        type="range"
        min="1"
        max="50"
        value={lineWidth}
        onChange={(e) => setLineWidth(Number(e.target.value))}
        className="w-full md:w-32 cursor-pointer"
        disabled={isLoading}
      />
      <span className="text-sm w-8 text-center">{lineWidth}</span>
    </div>
    <div className="flex items-center gap-2 w-full md:w-auto md:ml-auto">
       <button
        onClick={clearCanvas}
        disabled={isLoading}
        className="w-1/2 md:w-auto flex-grow px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Clear
      </button>
      <button
        onClick={generateImage}
        disabled={isLoading}
        className="w-1/2 md:w-auto flex-grow px-6 py-2 bg-purple-600 text-white font-bold rounded-md hover:bg-purple-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-600/30"
      >
        Generate
      </button>
    </div>
  </div>
);


export default function App() {
  const [color, setColor] = useState<string>('#FFFFFF');
  const [lineWidth, setLineWidth] = useState<number>(5);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const canvasRef = useRef<CanvasRef>(null);

  const handleClearCanvas = useCallback(() => {
    canvasRef.current?.clearCanvas();
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!canvasRef.current) return;

    const dataUrl = canvasRef.current.getCanvasData();
    if (!dataUrl) {
      setError("The canvas is empty. Draw something first!");
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      // Strips 'data:image/png;base64,' from the beginning of the string
      const base64Data = dataUrl.split(',')[1];
      const imageUrl = await generateFantasyImage(base64Data);
      setGeneratedImage(`data:image/png;base64,${imageUrl}`);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 md:p-8 flex flex-col items-center">
      <header className="text-center mb-6">
        <h1 className="text-4xl md:text-6xl font-fantasy text-purple-400">AI Fantasy Drawing Pad</h1>
        <p className="text-gray-400 mt-2">Turn your sketches into epic fantasy art!</p>
      </header>

      <main className="w-full max-w-7xl flex flex-col gap-8">
        <Toolbar
          color={color}
          setColor={setColor}
          lineWidth={lineWidth}
          setLineWidth={setLineWidth}
          clearCanvas={handleClearCanvas}
          generateImage={handleGenerate}
          isLoading={isLoading}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-gray-800 p-2 md:p-4 rounded-lg shadow-2xl border border-gray-700">
             <Canvas ref={canvasRef} color={color} lineWidth={lineWidth} />
          </div>
          <div className="bg-gray-800 p-4 rounded-lg shadow-2xl flex items-center justify-center min-h-[300px] lg:min-h-0 border border-gray-700">
            {isLoading ? (
              <LoadingSpinner />
            ) : error ? (
              <div className="text-center text-red-400">
                <h3 className="text-xl font-bold mb-2">Error</h3>
                <p>{error}</p>
              </div>
            ) : generatedImage ? (
              <img src={generatedImage} alt="AI generated fantasy art" className="max-w-full max-h-full object-contain rounded-md" />
            ) : (
              <div className="text-center text-gray-500">
                <h3 className="text-2xl font-fantasy text-gray-400 mb-2">Your Artwork Awaits</h3>
                <p>Draw something on the left canvas and click 'Generate' to see the magic happen!</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
