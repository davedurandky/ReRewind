import React from 'react';

interface FilterSliderProps {
  name: string;
  value: number;
  onChange: (value: number) => void;
  max?: number;
  step?: number;
  displayMultiplier?: number;
}

const FilterSlider: React.FC<FilterSliderProps> = ({ 
  name, 
  value, 
  onChange, 
  max = 10, 
  step = 0.1,
  displayMultiplier = 1
}) => {
  // For display purpose only
  const displayValue = (value * displayMultiplier).toFixed(1);
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 font-serif">{name}</label>
        <span className="text-xs font-serif px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">{displayValue}</span>
      </div>
      <div className="relative h-2">
        {/* Background track - made slightly larger for better appearance */}
        <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800 rounded-full w-full"></div>
        
        {/* Colored track - precisely positioned on top of background */}
        <div 
          className="absolute left-0 top-0 h-2 bg-indigo-300 dark:bg-indigo-700 rounded-full pointer-events-none" 
          style={{ width: `${(value/max) * 100}%` }}
        ></div>
        
        {/* The input range itself - made transparent but interactive */}
        <input 
          type="range" 
          min={0}
          max={max}
          step={step}
          value={value} 
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute w-full h-2 opacity-0 cursor-pointer focus:outline-none z-10"
        />
        
        {/* Thumb styles applied via an additional element */}
        <div 
          className="absolute top-1/2 -mt-2 w-4 h-4 rounded-full bg-indigo-600 dark:bg-indigo-400 cursor-pointer border-2 border-white dark:border-slate-900 shadow pointer-events-none"
          style={{ left: `calc(${(value/max) * 100}% - 8px)` }}
        ></div>
      </div>
    </div>
  );
};

export default FilterSlider;