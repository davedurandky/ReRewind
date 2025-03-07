import React from "react";
import FilterSlider from "./FilterSlider";

interface FluidSettings {
  flowSpeed: number;
  turbulence: number;
  colorShift: number;
  [key: string]: number;
}

interface FluidControlsProps {
  fluidSettings: FluidSettings;
  onFluidChange: (newSettings: FluidSettings) => void;
  isCompact?: boolean;
}

const FluidControls: React.FC<FluidControlsProps> = ({ 
  fluidSettings, 
  onFluidChange,
  isCompact = false 
}) => {
  const handleSliderChange = (name: string, value: number) => {
    onFluidChange({ ...fluidSettings, [name]: value });
  };

  return (
    <div className={isCompact ? "" : "bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md border border-gray-200 dark:border-slate-800 transition-colors"}>
      {!isCompact && (
        <div className="mb-4">
          <h3 className="text-xl font-semibold font-serif text-slate-900 dark:text-slate-100">Fluid Controls</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-serif mt-1">
            Control how effects animate and flow
          </p>
        </div>
      )}
      <div className="space-y-4">
        <FilterSlider
          name="Flow Speed"
          value={fluidSettings.flowSpeed}
          onChange={(value: number) => handleSliderChange("flowSpeed", value)}
          max={1}
          step={0.01}
          displayMultiplier={10}
        />
        <FilterSlider
          name="Turbulence"
          value={fluidSettings.turbulence}
          onChange={(value: number) => handleSliderChange("turbulence", value)}
          max={1}
          step={0.01}
          displayMultiplier={10}
        />
        <FilterSlider
          name="Color Shift"
          value={fluidSettings.colorShift}
          onChange={(value: number) => handleSliderChange("colorShift", value)}
          max={1}
          step={0.01}
          displayMultiplier={10}
        />
      </div>
    </div>
  );
};

export default FluidControls; 