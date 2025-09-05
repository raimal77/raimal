/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

const App: React.FC = () => {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');

  const handleGenerateLogo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);
    setLogoUrl(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      // Enhance the user's prompt with style keywords for better logo generation
      const fullPrompt = `A simple, abstract, modern, minimalist logo for a company. Vector art style, flat design with vibrant colors, on a clean white background, based on this idea: "${prompt}"`;

      const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: fullPrompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/png',
          aspectRatio: '1:1',
        },
      });

      if (response.generatedImages && response.generatedImages.length > 0) {
        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
        const imageUrl = `data:image/png;base64,${base64ImageBytes}`;
        setLogoUrl(imageUrl);
      } else {
        throw new Error('No image was generated.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to generate the logo. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div>
          <div className="spinner"></div>
          <p className="status-message">Generating your unique logo...</p>
        </div>
      );
    }
    if (error) {
      return <p className="status-message error-message" role="alert">{error}</p>;
    }
    if (logoUrl) {
      return <img src={logoUrl} alt="Generated Abstract App Logo" className="logo-image" />;
    }
    return <p className="status-message">Describe the logo you want to create in the box below.</p>;
  };

  return (
    <main className="container">
      <h1>AI Logo Maker</h1>
      <p className="subtitle">Turn your ideas into a unique logo in seconds.</p>
      <div className="logo-container" aria-live="polite">
        {renderContent()}
      </div>
      <form onSubmit={handleGenerateLogo} className="prompt-form">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., a stylized fox head made of geometric shapes"
          className="prompt-input"
          rows={3}
          aria-label="Logo description"
        />
        <button
          type="submit"
          className="generate-button"
          disabled={isLoading || !prompt.trim()}
        >
          {isLoading ? 'Generating...' : 'Generate Logo'}
        </button>
      </form>
    </main>
  );
};

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(<App />);