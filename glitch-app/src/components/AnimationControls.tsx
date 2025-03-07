import React from 'react';

interface AnimationControlsProps {
  isAnimating?: boolean;
  animationSpeed: number;
  frameCount: number;
  onSpeedChange: (speed: number) => void;
  onFrameCountChange: (frameCount: number) => void;
  onToggleAnimation?: () => void;
}

const AnimationControls: React.FC<AnimationControlsProps> = ({
  isAnimating = false,
  animationSpeed,
  frameCount,
  onSpeedChange,
  onFrameCountChange,
  onToggleAnimation,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 transition-colors">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Animation Settings</h3>
      </div>
      
      {/* Animation Toggle Button */}
      {onToggleAnimation && (
        <div className="mb-5">
          <button
            onClick={onToggleAnimation}
            className={`w-full py-2.5 px-4 rounded-md text-sm font-medium shadow-sm 
              ${isAnimating 
                ? 'border-2 border-red-500 bg-transparent hover:bg-red-50 dark:hover:bg-red-900/10 text-red-600 dark:text-red-400' 
                : 'bg-slate-900 dark:bg-slate-600 hover:bg-slate-700 dark:hover:bg-slate-500 text-white'
              } 
              transition-colors focus:outline-none`}
          >
            {isAnimating ? '⏹ Stop Animation' : '▶ Start Animation'}
          </button>
        </div>
      )}
      
      <div className="space-y-5">
        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Animation Speed
            </label>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
              {animationSpeed.toFixed(1)}x
            </span>
          </div>
          <div className="relative h-2">
            {/* Background track */}
            <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800 rounded-full w-full"></div>
            
            {/* Colored track */}
            <div 
              className="absolute left-0 top-0 h-2 bg-indigo-300 dark:bg-indigo-700 rounded-full pointer-events-none" 
              style={{ width: `${((animationSpeed - 0.1) / (3 - 0.1)) * 100}%` }}
            ></div>
            
            {/* The input range itself */}
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={animationSpeed}
              onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
              className="absolute w-full h-2 opacity-0 cursor-pointer focus:outline-none z-10"
            />
            
            {/* Thumb element */}
            <div 
              className="absolute top-1/2 -mt-2 w-4 h-4 rounded-full bg-indigo-600 dark:bg-indigo-400 cursor-pointer border-2 border-white dark:border-slate-900 shadow pointer-events-none"
              style={{ left: `calc(${((animationSpeed - 0.1) / (3 - 0.1)) * 100}% - 8px)` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
            <span>Slower</span>
            <span>Faster</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Frame Count
            </label>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
              {frameCount} frames
            </span>
          </div>
          <div className="relative h-2">
            {/* Background track */}
            <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800 rounded-full w-full"></div>
            
            {/* Colored track */}
            <div 
              className="absolute left-0 top-0 h-2 bg-indigo-300 dark:bg-indigo-700 rounded-full pointer-events-none" 
              style={{ width: `${((frameCount - 10) / (60 - 10)) * 100}%` }}
            ></div>
            
            {/* The input range itself */}
            <input
              type="range"
              min="10"
              max="60"
              step="5"
              value={frameCount}
              onChange={(e) => onFrameCountChange(parseInt(e.target.value))}
              className="absolute w-full h-2 opacity-0 cursor-pointer focus:outline-none z-10"
            />
            
            {/* Thumb element */}
            <div 
              className="absolute top-1/2 -mt-2 w-4 h-4 rounded-full bg-indigo-600 dark:bg-indigo-400 cursor-pointer border-2 border-white dark:border-slate-900 shadow pointer-events-none"
              style={{ left: `calc(${((frameCount - 10) / (60 - 10)) * 100}% - 8px)` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
            <span>Fewer (faster)</span>
            <span>More (smoother)</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 italic">
            Higher frame counts produce smoother animations but take longer to render.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AnimationControls;