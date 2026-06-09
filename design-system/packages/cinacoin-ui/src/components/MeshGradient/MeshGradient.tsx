import React, { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../../utils';
import type { BaseProps } from '../../types';

export type MeshGradientColor = 'cyan' | 'blue' | 'magenta' | 'amber';

export interface MeshGradientProps extends HTMLAttributes<HTMLDivElement>, BaseProps {
  /** Enable animation */
  animated?: boolean;
  /** Animation duration in seconds */
  duration?: number;
  /** Opacity (0-1) */
  opacity?: number;
  /** Color palette */
  colors?: MeshGradientColor[];
}

const colorMap: Record<MeshGradientColor, string> = {
  cyan: '#06b6d4',
  blue: '#3b82f6',
  magenta: '#ec4899',
  amber: '#f59e0b',
};

export const MeshGradient = forwardRef<HTMLDivElement, MeshGradientProps>(
  (
    {
      animated = true,
      duration = 8,
      opacity = 0.4,
      colors = ['cyan', 'blue', 'magenta', 'amber'],
      className,
      ...props
    },
    ref,
  ) => {
    const resolvedColors = colors.map((c) => colorMap[c]);

    return (
      <div
        ref={ref}
        className={cn('absolute inset-0 overflow-hidden', className)}
        aria-hidden="true"
        {...props}
      >
        <svg
          className="w-full h-full"
          viewBox="0 0 1200 800"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id="mesh-blur" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="80" />
            </filter>
          </defs>
          <g filter="url(#mesh-blur)" opacity={opacity}>
            {/* Cyan blob */}
            {resolvedColors.includes(colorMap.cyan) && (
              <circle cx="300" cy="200" r="250" fill={colorMap.cyan}>
                {animated && (
                  <>
                    <animate
                      attributeName="cx"
                      values="300;400;250;300"
                      dur={`${duration}s`}
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="cy"
                      values="200;300;150;200"
                      dur={`${duration}s`}
                      repeatCount="indefinite"
                    />
                  </>
                )}
              </circle>
            )}

            {/* Blue blob */}
            {resolvedColors.includes(colorMap.blue) && (
              <circle cx="800" cy="300" r="300" fill={colorMap.blue}>
                {animated && (
                  <>
                    <animate
                      attributeName="cx"
                      values="800;700;850;800"
                      dur={`${duration + 2}s`}
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="cy"
                      values="300;200;400;300"
                      dur={`${duration + 2}s`}
                      repeatCount="indefinite"
                    />
                  </>
                )}
              </circle>
            )}

            {/* Magenta blob */}
            {resolvedColors.includes(colorMap.magenta) && (
              <circle cx="500" cy="500" r="280" fill={colorMap.magenta}>
                {animated && (
                  <>
                    <animate
                      attributeName="cx"
                      values="500;600;400;500"
                      dur={`${duration + 4}s`}
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="cy"
                      values="500;400;600;500"
                      dur={`${duration + 4}s`}
                      repeatCount="indefinite"
                    />
                  </>
                )}
              </circle>
            )}

            {/* Amber blob */}
            {resolvedColors.includes(colorMap.amber) && (
              <circle cx="900" cy="600" r="220" fill={colorMap.amber}>
                {animated && (
                  <>
                    <animate
                      attributeName="cx"
                      values="900;800;950;900"
                      dur={`${duration + 1}s`}
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="cy"
                      values="600;500;650;600"
                      dur={`${duration + 1}s`}
                      repeatCount="indefinite"
                    />
                  </>
                )}
              </circle>
            )}
          </g>
        </svg>
      </div>
    );
  },
);

MeshGradient.displayName = 'MeshGradient';
