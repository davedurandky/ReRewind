import React from "react"; 
import FilterSlider from "./FilterSlider"; 

interface FilterSettings { 
  layerVariation: number; 
  staticOnScreen: number; 
  zigZag: number; 
  pixelate: number;
  chromaShift: number;
  scanLines: number;
  vhsColorGrade: number;
  [key: string]: number; 
} 

interface FilterControlsProps { 
  filterSettings: FilterSettings; 
  onFilterChange: (newSettings: FilterSettings) => void;
  controlType?: 'basic' | 'advanced' | 'all';
} 

const FilterControls: React.FC<FilterControlsProps> = ({ 
  filterSettings, 
  onFilterChange,
  controlType = 'all'
}) => { 
  const handleSliderChange = (name: string, value: number) => { 
    onFilterChange({ ...filterSettings, [name]: value }); 
  }; 

  const basicFilters = (
    <>
      <FilterSlider 
        name="Layer Variation" 
        value={filterSettings.layerVariation} 
        onChange={(value: number) => handleSliderChange("layerVariation", value)}
        max={1}
        step={0.01}
        displayMultiplier={10} 
      /> 
      <FilterSlider 
        name="Static On Screen" 
        value={filterSettings.staticOnScreen} 
        onChange={(value: number) => handleSliderChange("staticOnScreen", value)}
        max={1}
        step={0.01}
        displayMultiplier={10}
      /> 
      <FilterSlider 
        name="ZigZag Effect" 
        value={filterSettings.zigZag} 
        onChange={(value: number) => handleSliderChange("zigZag", value)}
        max={1}
        step={0.01}
        displayMultiplier={10}
      />
      <FilterSlider 
        name="VHS Color Grade" 
        value={filterSettings.vhsColorGrade} 
        onChange={(value: number) => handleSliderChange("vhsColorGrade", value)}
        max={1}
        step={0.01}
        displayMultiplier={10}
      />
    </>
  );

  const advancedFilters = (
    <>
      <FilterSlider 
        name="Pixelate" 
        value={filterSettings.pixelate} 
        onChange={(value: number) => handleSliderChange("pixelate", value)}
        max={1}
        step={0.01}
        displayMultiplier={10}
      />
      <FilterSlider 
        name="Chroma Shift" 
        value={filterSettings.chromaShift} 
        onChange={(value: number) => handleSliderChange("chromaShift", value)}
        max={1}
        step={0.01}
        displayMultiplier={10}
      />
      <FilterSlider 
        name="Scan Lines" 
        value={filterSettings.scanLines} 
        onChange={(value: number) => handleSliderChange("scanLines", value)}
        max={1}
        step={0.01}
        displayMultiplier={10}
      />
    </>
  );

  // Only render the reset button when showing all controls
  const renderResetButton = controlType === 'all';

  return ( 
    <div className={controlType === 'all' ? "bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md border border-gray-200 dark:border-slate-800 transition-colors" : ""}>
      {controlType === 'all' && (
        <div className="mb-6">
          <h3 className="text-xl font-semibold font-serif text-slate-900 dark:text-slate-100">Visual Effects</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-serif mt-1">
            Adjust the sliders to create your perfect retro VHS look
          </p>
        </div>
      )}
      
      <div className="space-y-8">
        {(controlType === 'all' || controlType === 'basic') && (
          <div className="space-y-4">
            {controlType === 'all' && (
              <h4 className="font-medium text-sm uppercase tracking-wide text-slate-600 dark:text-slate-400 font-serif border-b pb-1 border-slate-200 dark:border-slate-700">
                Basic Effects
              </h4>
            )}
            {basicFilters}
          </div>
        )}
        
        {(controlType === 'all' || controlType === 'advanced') && (
          <div className="space-y-4">
            {controlType === 'all' && (
              <h4 className="font-medium text-sm uppercase tracking-wide text-slate-600 dark:text-slate-400 font-serif border-b pb-1 border-slate-200 dark:border-slate-700">
                Advanced Effects
              </h4>
            )}
            {advancedFilters}
          </div>
        )}
      </div>
      
      {renderResetButton && (
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button 
            className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-md text-slate-700 dark:text-slate-300 font-serif transition-colors text-sm"
            onClick={() => onFilterChange({
              layerVariation: 0,
              staticOnScreen: 0,
              zigZag: 0,
              pixelate: 0,
              chromaShift: 0,
              scanLines: 0,
              vhsColorGrade: 0,
            })}
          >
            Reset All Effects
          </button>
        </div>
      )}
    </div> 
  ); 
}; 

export default FilterControls;
