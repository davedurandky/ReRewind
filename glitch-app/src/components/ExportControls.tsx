import React from 'react';
import GIF from 'gif.js';
import { LayerVariation } from '../filters/LayerVariation';
import { StaticOnScreen } from '../filters/StaticOnScreen';
import { ZigZag } from '../filters/ZigZag';
import { Pixelate } from '../filters/Pixelate';
import { ChromaShift } from '../filters/ChromaShift';
import { ScanLines } from '../filters/ScanLines';
import { FluidAnimation } from '../utils/FluidAnimation';

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

interface FluidSettings {
  flowSpeed: number;
  turbulence: number;
  colorShift: number;
  [key: string]: number;
}

interface ExportControlsProps {
  media: File | null;
  filterSettings: FilterSettings;
  fluidSettings: FluidSettings;
  animationSpeed: number;
  renderedFrames: ImageData[];
  onRenderRequest: () => void;
}

const ExportControls: React.FC<ExportControlsProps> = ({ 
  media, 
  filterSettings,
  fluidSettings,
  animationSpeed,
  renderedFrames,
  onRenderRequest
}) => {
  const [isExporting, setIsExporting] = React.useState(false);
  const [exportProgress, setExportProgress] = React.useState(0);
  const [exportType, setExportType] = React.useState<'gif' | 'png'>('gif');
  const [isRendering, setIsRendering] = React.useState(false);

  // Reset progress when export completes
  React.useEffect(() => {
    if (!isExporting) {
      // Reset progress after a short delay to show completion
      const timeout = setTimeout(() => {
        setExportProgress(0);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [isExporting]);

  // Observe render status
  React.useEffect(() => {
    setIsRendering(renderedFrames.length === 0 && onRenderRequest !== undefined);
  }, [renderedFrames.length, onRenderRequest]);

  const handleExport = (type: 'gif' | 'png') => {
    if (!media) {
      console.error('No media to export');
      return;
    }
    
    setExportType(type);
    setIsExporting(true);
    setExportProgress(5); // Start progress at 5%

    if (type === 'png') {
      exportAsPNG();
    } else {
      exportAsGIF();
    }
  };
  
  const exportAsPNG = () => {
    if (renderedFrames.length === 0) {
      setIsExporting(false);
      console.error('No rendered frames available');
      return;
    }
    
    try {
      // Use the first frame for PNG export
      const frame = renderedFrames[0];
      
      // Create a canvas to process the frame
      const canvas = document.createElement('canvas');
      canvas.width = frame.width;
      canvas.height = frame.height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }
      
      // Draw the frame
      ctx.putImageData(frame, 0, 0);
      setExportProgress(70);
      
      // Convert to PNG and download
      setTimeout(() => {
        const pngUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = 'glitch-effect.png';
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
          document.body.removeChild(a);
          setExportProgress(100);
          setTimeout(() => {
            setIsExporting(false);
          }, 1000);
        }, 100);
      }, 300);
    } catch (error) {
      console.error('Error exporting PNG:', error);
      setIsExporting(false);
    }
  };
  
  const exportAsGIF = () => {
    if (!media) {
      console.error('No media to export');
      return;
    }

    console.log('Creating GIF...');
    
    // Check if we have renderedFrames
    if (renderedFrames.length === 0) {
      console.error('No rendered frames available');
      setIsExporting(false);
      return;
    }
    
    setExportProgress(10);
    
    const frames = [...renderedFrames];
    const totalFrames = frames.length;
    
    // Create a temporary canvas for rendering
    const tempCanvas = document.createElement('canvas');
    const firstFrame = frames[0];
    
    // Set the canvas dimensions to match the first frame
    tempCanvas.width = firstFrame.width;
    tempCanvas.height = firstFrame.height;
    
    // Get the canvas context
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) {
      console.error('Could not get canvas context');
      setIsExporting(false);
      return;
    }
    
    // Create a new GIF
    const gif = new GIF({
      workers: 2,
      quality: 10,
      width: tempCanvas.width,
      height: tempCanvas.height,
      workerScript: '/gif.worker.js',
    });
    
    setExportProgress(25);
    
    // Track GIF creation progress
    gif.on('progress', (p) => {
      setExportProgress(25 + Math.floor(p * 70)); // Scale progress from 25-95%
    });
    
    // Function to apply all filters to match the preview
    const applyFilters = (ctx: CanvasRenderingContext2D, width: number, height: number, frameIndex: number) => {
      // Calculate the time offset based on frame index and animation speed
      const timeOffset = (frameIndex / totalFrames) * (1000 / animationSpeed);
      const timeMs = timeOffset * 1000;

      // First apply fluid animation effects (same as in preview)
      if (fluidSettings.flowSpeed > 0 || fluidSettings.turbulence > 0 || fluidSettings.colorShift > 0) {
        FluidAnimation(
          ctx, 
          width, 
          height, 
          fluidSettings.flowSpeed, 
          fluidSettings.turbulence,
          fluidSettings.colorShift,
          timeMs
        );
      }

      // Then apply all other filters in the same order as preview
      if (filterSettings.layerVariation > 0) {
        // Get the image data first
        const imageData = ctx.getImageData(0, 0, width, height);
        // Apply LayerVariation to the image data
        LayerVariation(imageData, width, height, filterSettings.layerVariation);
        // Put the modified image data back to the canvas
        ctx.putImageData(imageData, 0, 0);
      }
      
      if (filterSettings.chromaShift > 0) {
        ChromaShift(ctx, width, height, filterSettings.chromaShift, timeMs);
      }
      
      if (filterSettings.staticOnScreen > 0) {
        StaticOnScreen(ctx, width, height, filterSettings.staticOnScreen);
      }
      
      if (filterSettings.zigZag > 0) {
        ZigZag(ctx, { width, height }, filterSettings.zigZag);
      }
      
      if (filterSettings.pixelate > 0) {
        Pixelate(ctx, width, height, filterSettings.pixelate);
      }
      
      if (filterSettings.scanLines > 0) {
        ScanLines(ctx, width, height, filterSettings.scanLines);
      }
    };

    // Process each frame
    frames.forEach((frame, index) => {
      // Draw the base frame
      ctx.putImageData(frame, 0, 0);
      
      // Apply all filters to match the preview exactly
      applyFilters(ctx, tempCanvas.width, tempCanvas.height, index);
      
      // Add the processed frame to the GIF
      const frameDelay = 1000 / animationSpeed;
      gif.addFrame(tempCanvas, { delay: frameDelay, copy: true });
    });
    
    // When the GIF is finished, download it
    gif.on('finished', (blob) => {
      try {
        // Create a safe download mechanism
        const gifUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = gifUrl;
        a.download = 'glitch-effect.gif';
        document.body.appendChild(a); // Needed for Firefox
        a.click();
        
        // Clean up
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(gifUrl);
          setExportProgress(100);
          setTimeout(() => {
            setIsExporting(false);
          }, 1000);
        }, 100);
      } catch (error) {
        console.error('Error downloading GIF:', error);
        setIsExporting(false);
      }
    });
    
    // Log any errors
    gif.on('abort', () => {
      console.error('GIF creation aborted');
      setIsExporting(false);
    });
    
    // Start rendering the GIF
    console.log(`Creating GIF with ${totalFrames} frames...`);
    gif.render();
  };

  return (
    <div className="export-controls">
      {renderedFrames.length === 0 && (
        <div className="flex flex-col space-y-4">
          <button 
            onClick={onRenderRequest}
            disabled={!media}
            className={`bg-indigo-600 text-white font-medium py-3 px-4 rounded-lg shadow-md flex justify-center items-center disabled:bg-indigo-400 disabled:cursor-not-allowed ${isRendering ? 'opacity-70' : 'hover:bg-indigo-700'}`}
          >
            {isRendering ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Rendering...
              </span>
            ) : (
              'Prepare for Export'
            )}
          </button>
          {!media && (
            <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
              Upload an image first to enable export options.
            </p>
          )}
        </div>
      )}

      {renderedFrames.length > 0 && (
        <div className="flex flex-col space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
            {renderedFrames.length} {renderedFrames.length === 1 ? 'frame' : 'frames'} ready for export
          </p>
          
          <div className="flex flex-col space-y-3">
            {/* Progress Bar and PNG Export on same row */}
            <div className="flex items-center gap-4">
              {/* Progress bar on the left */}
              {exportProgress > 0 && exportType === 'png' && (
                <div className="w-1/3 h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 dark:bg-green-600 transition-all duration-300 ease-out"
                    style={{ width: `${exportProgress}%` }}
                  ></div>
                </div>
              )}
              
              {/* Export PNG Button */}
              <button 
                onClick={() => handleExport('png')}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg shadow-md transition-colors flex justify-center items-center"
                disabled={isExporting}
              >
                {isExporting && exportType === 'png' ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating PNG...
                  </span>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                    </svg>
                    Download PNG
                  </>
                )}
              </button>
            </div>
            
            {/* Progress Bar and GIF Export on same row */}
            <div className="flex items-center gap-4">
              {/* Progress bar on the left */}
              {exportProgress > 0 && exportType === 'gif' && (
                <div className="w-1/3 h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 dark:bg-green-600 transition-all duration-300 ease-out"
                    style={{ width: `${exportProgress}%` }}
                  ></div>
                </div>
              )}
              
              {/* Export GIF Button */}
              <button 
                onClick={() => handleExport('gif')}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg shadow-md transition-colors flex justify-center items-center"
                disabled={isExporting}
              >
                {isExporting && exportType === 'gif' ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating GIF...
                  </span>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                    </svg>
                    Download GIF
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportControls;