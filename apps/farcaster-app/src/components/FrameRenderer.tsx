'use client';

import React from 'react';

interface FrameRendererProps {
  /** Frame image URL */
  imageUrl: string;
  /** Frame title */
  title?: string;
  /** Frame buttons */
  buttons?: Array<{
    label: string;
    action?: string;
    onClick?: () => void;
  }>;
  /** Input placeholder */
  inputPlaceholder?: string;
  /** Aspect ratio */
  aspectRatio?: '1.91:1' | '1:1';
}

/**
 * FrameRenderer - Preview and interact with Farcaster Frames.
 *
 * Renders a frame image with interactive buttons for testing
 * and preview purposes outside of the Farcaster client.
 */
export function FrameRenderer({
  imageUrl,
  title,
  buttons = [],
  inputPlaceholder,
  aspectRatio = '1.91:1',
}: FrameRendererProps) {
  const [inputValue, setInputValue] = React.useState('');

  const aspectClass = aspectRatio === '1:1' ? 'aspect-square' : 'aspect-[1.91/1]';

  return (
    <div className="w-full max-w-[600px] mx-auto">
      {/* Frame Container */}
      <div className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 shadow-2xl">
        {/* Frame Image */}
        <div className={`relative ${aspectClass} bg-gray-800`}>
          <img
            src={imageUrl}
            alt={title ?? 'Frame'}
            className="w-full h-full object-cover"
          />
          {title && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <h3 className="text-white font-semibold text-lg">{title}</h3>
            </div>
          )}
        </div>

        {/* Input Field */}
        {inputPlaceholder && (
          <div className="p-4 border-t border-gray-800">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={inputPlaceholder}
              className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        )}

        {/* Buttons */}
        {buttons.length > 0 && (
          <div className="p-4 border-t border-gray-800 grid gap-2" style={{
            gridTemplateColumns: `repeat(${Math.min(buttons.length, 2)}, minmax(0, 1fr))`,
          }}>
            {buttons.map((button, idx) => (
              <button
                key={idx}
                onClick={button.onClick}
                className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-3 rounded-xl font-medium transition-colors text-sm"
              >
                {button.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Frame Metadata */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        Farcaster Frame Preview
      </div>
    </div>
  );
}
