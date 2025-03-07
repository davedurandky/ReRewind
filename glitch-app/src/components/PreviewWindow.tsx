import React, { useEffect, useRef, useState, useCallback } from 'react';
import { LayerVariation } from '../filters/LayerVariation';
import { StaticOnScreen } from '../filters/StaticOnScreen';
import { ZigZag } from '../filters/ZigZag';
import { Pixelate } from '../filters/Pixelate';
import { ChromaShift } from '../filters/ChromaShift';
import { ScanLines } from '../filters/ScanLines';
import { FluidAnimation } from '../filters/FluidAnimation';
import { VHSColorGrade } from '../filters/BrightnessContrast';
import GIF from 'gif.js';

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

interface PreviewWindowProps {
  thumbnail: HTMLCanvasElement;
  filterSettings: FilterSettings;
  fluidSettings: FluidSettings;
  isAnimating: boolean;
  isPreviewMode: boolean;
  isRendering: boolean;
  renderedFrames: ImageData[];
  frameCount: number;
  animationSpeed: number;
  onRenderComplete: (frames: ImageData[]) => void;
  onRenderProgress: (progress: number) => void;
}

const PreviewWindow: React.FC<PreviewWindowProps> = ({ 
  thumbnail, 
  filterSettings, 
  fluidSettings,
  isAnimating,
  isPreviewMode,
  isRendering,
  renderedFrames,
  frameCount,
  animationSpeed,
  onRenderComplete,
  onRenderProgress
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const lastRenderTimeRef = useRef<number>(0);
  const currentFrameRef = useRef<number>(0);
  const [isReady, setIsReady] = useState<boolean>(false);
  const timeOffsetRef = useRef<number>(Math.random() * 1000); // Random starting time offset for variety
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const thumbnailRef = useRef<HTMLCanvasElement | null>(null);
  const frameIndexRef = useRef<number>(0);
  const lastTimestampRef = useRef<number>(0);
  const [forceShowContent, setForceShowContent] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const initialAnimationStarted = useRef<boolean>(false);

  // Ensure we always show something immediately when component mounts
  useEffect(() => {
    if (thumbnail && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        // Draw thumbnail immediately to ensure content is visible
        ctx.drawImage(thumbnail, 0, 0, canvasRef.current.width, canvasRef.current.height);
        console.log('[PreviewWindow] Immediate thumbnail render');
        setForceShowContent(true);
      }
    }
  }, [thumbnail]);

  // Set up canvas and sizing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !thumbnail) return;
    
    // Force the canvas to fill the parent container completely
    const container = canvas.parentElement;
    if (!container) {
      console.error('[PreviewWindow] No parent container found');
      return;
    }
    
    // Set container to display: block to ensure it takes full space
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.alignItems = 'center';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.minHeight = '600px';
    
    // Get the actual dimensions of the container
    const containerWidth = container.clientWidth || 800;
    const containerHeight = container.clientHeight || 600;
    
    console.log('[PreviewWindow] Container size:', containerWidth, 'x', containerHeight);
    console.log('[PreviewWindow] Thumbnail size:', thumbnail.width, 'x', thumbnail.height);
    
    // Maximum allowed dimensions
    const MAX_DIMENSION = 1000;
    
    // Calculate the scaling based on the original thumbnail size
    // If the thumbnail is smaller than MAX_DIMENSION, use its original size
    // If it's larger, scale it down to fit within MAX_DIMENSION
    let scaledWidth = thumbnail.width;
    let scaledHeight = thumbnail.height;
    
    if (thumbnail.width > MAX_DIMENSION || thumbnail.height > MAX_DIMENSION) {
      if (thumbnail.width > thumbnail.height) {
        // Landscape orientation
        scaledWidth = MAX_DIMENSION;
        scaledHeight = (thumbnail.height / thumbnail.width) * MAX_DIMENSION;
      } else {
        // Portrait orientation
        scaledHeight = MAX_DIMENSION;
        scaledWidth = (thumbnail.width / thumbnail.height) * MAX_DIMENSION;
      }
    }
    
    // Calculate aspect ratios
    const thumbAspect = scaledWidth / scaledHeight;
    const containerAspect = containerWidth / containerHeight;
    
    let newWidth, newHeight;
    
    // Force the image to fill the container while respecting the max dimension and original aspect ratio
    if (thumbAspect > containerAspect) {
      // Image is wider than container (width is limiting factor)
      newWidth = Math.min(containerWidth, scaledWidth);
      newHeight = newWidth / thumbAspect;
    } else {
      // Image is taller than container (height is limiting factor)
      newHeight = Math.min(containerHeight, scaledHeight);
      newWidth = newHeight * thumbAspect;
    }
    
    // Set minimum dimensions to ensure small images are still easily visible
    newWidth = Math.max(newWidth, 400);
    newHeight = Math.max(newHeight, 400 / thumbAspect);
    
    // Set canvas dimensions
    canvas.width = Math.floor(newWidth);
    canvas.height = Math.floor(newHeight);
    
    // Make canvas visually fill the container
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.objectFit = 'contain';
    canvas.style.maxWidth = '100%';
    canvas.style.maxHeight = '100%';
    
    console.log('[PreviewWindow] Canvas set to:', canvas.width, 'x', canvas.height);
    
    // Show loading state initially
    setIsReady(false);
    
    // Draw the thumbnail immediately for visual feedback
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      try {
        ctx.drawImage(thumbnail, 0, 0, canvas.width, canvas.height);
        console.log('[PreviewWindow] Initial image drawn successfully');
      } catch (error) {
        console.error('[PreviewWindow] Error drawing initial image:', error);
      }
    }
    
    // Render initial frame with short delay
    setTimeout(() => {
      renderStaticFrame();
      setIsReady(true);
    }, 100);
    
    // Cleanup function
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [thumbnail]);

  // Render static frame with current settings
  const renderStaticFrame = () => {
    console.log("Rendering static frame");
    
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error("Canvas not available for static frame rendering");
      return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error("Canvas context not available for static frame rendering");
      return;
    }
    
    try {
      // Clear the canvas first
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw the base image
      if (thumbnail && thumbnail.width > 0 && thumbnail.height > 0) {
        // Draw the thumbnail at full canvas size
        ctx.drawImage(thumbnail, 0, 0, canvas.width, canvas.height);
        console.log("Base image drawn successfully");
      } else {
        console.error("Invalid thumbnail in renderStaticFrame");
        // Display a visible error pattern
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '20px Arial';
        ctx.fillText('Error: No image available', 20, canvas.height/2);
        return;
      }
      
      // Apply filters
      applyFilters(ctx, canvas.width, canvas.height, filterSettings, fluidSettings);
      
      setForceShowContent(true);
    } catch (error) {
      console.error("Error in renderStaticFrame:", error);
    }
  };

  // Start live animation (lower quality but immediate feedback)
  const startLiveAnimation = () => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }

    console.log("Starting live animation loop");
    
    // Reset current frame and ensure canvas is ready
    currentFrameRef.current = 0;
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error("Canvas not available for animation");
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error("Could not get canvas context");
      return;
    }
    
    const animate = (timestamp: number) => {
      if (!canvasRef.current) return;
      
      // Apply filters with the current timestamp for animation
      // Slow down the animation by reducing the time value passed to the filters
      const slowedTimestamp = timestamp * (animationSpeed * 0.05); // Reduced multiplier for more gentle animation
      
      applyFilters(ctx, canvas.width, canvas.height, filterSettings, fluidSettings, slowedTimestamp + timeOffsetRef.current);

      // Schedule next frame
      animationFrameIdRef.current = requestAnimationFrame(animate);
    };
    
    // Start animation loop
    animationFrameIdRef.current = requestAnimationFrame(animate);
    
    // Return cleanup function
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  };

  // Play from pre-rendered frames (optimal performance)
  const playRenderedFrames = () => {
    console.log("Starting playback of pre-rendered frames:", renderedFrames.length);
    
    // If no frames were rendered, render a static frame instead
    if (!renderedFrames || renderedFrames.length === 0) {
      console.log("No rendered frames available, displaying static frame");
      renderStaticFrame();
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      console.error("Canvas not available for frame playback");
      return;
    }
    
    // Track starting time for animation
    const startTime = performance.now();
    
    const playFrame = (timestamp: number) => {
      // Get canvas context here inside the animation frame function
      const ctx = canvas.getContext('2d');
      if (!canvas || !ctx) {
        console.error("Canvas or context not available for frame playback");
        return;
      }
      
      // Calculate which frame to show based on time and speed
      // Use a slower animation rate by default
      const elapsed = timestamp - startTime;
      // Slow down the animation by increasing the total duration
      const totalDuration = renderedFrames.length * (2000 / animationSpeed); // Increased from 1000 to 2000 for slower animation
      let position = (elapsed % totalDuration) / totalDuration;
      
      // Frame index based on position in animation cycle
      let frameIndex = Math.floor(position * renderedFrames.length);
      frameIndex = Math.min(frameIndex, renderedFrames.length - 1);
      
      // Log occasionally for debugging
      if (frameIndex === 0 || frameIndex % 30 === 0) {
        console.log(`Playing frame ${frameIndex}/${renderedFrames.length - 1} (pos: ${position.toFixed(2)})`);
     }

      try {
        // Draw the frame
        ctx.putImageData(renderedFrames[frameIndex], 0, 0);
      } catch (error) {
        console.error("Error drawing frame:", error);
      }

      // Continue animation loop
      animationFrameIdRef.current = requestAnimationFrame(playFrame);
    };
    
    // Start animation loop
    console.log("Starting animation loop with pre-rendered frames");
    animationFrameIdRef.current = requestAnimationFrame(playFrame);
  };

  // Render frames in background for smooth playback
  const renderFramesInBackground = () => {
    console.log("Starting renderFramesInBackground");
    
    // We can't set isRendering directly as it's a prop, not state
    // isRendering should be controlled by the parent component
    setIsReady(false);
    
    // Array to store rendered frames
    const frames: ImageData[] = [];
    let progress = 0;
    
    // Get canvas and context
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error("Canvas not available for background rendering");
      onRenderComplete([]);
      setIsReady(true);
      return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error("Canvas context not available for background rendering");
      onRenderComplete([]);
      setIsReady(true);
      return;
    }
    
    console.log(`Starting to render ${frameCount} frames in the background`);
    
    // Limit frame count to prevent excessive rendering
    const actualFrameCount = Math.min(frameCount, 30);
    
    // Make sure we exit rendering state after a timeout
    let renderCompleted = false;
    
    // Safety timeout to ensure rendering completes
    const safetyTimeout = setTimeout(() => {
      if (!renderCompleted) {
        console.log("Safety timeout triggered - forcing render completion");
        renderCompleted = true;
        onRenderProgress(100);
        onRenderComplete(frames.length > 0 ? frames : []);
        setIsReady(true);
      }
    }, 8000);
    
    // Secondary super safety timeout that will always trigger
    const ultimateSafetyTimeout = setTimeout(() => {
      if (!renderCompleted) {
        console.log("ULTIMATE safety timeout triggered - forcing app to continue");
        renderCompleted = true;
        onRenderProgress(100);
        onRenderComplete(frames);
        setIsReady(true);
        setForceShowContent(true);
      }
    }, 12000);
    
    // Calculate time step for even distribution of frames
    const timeStep = 1000 / actualFrameCount;
    
    // Batch rendering for better performance
    const batchSize = 5;
    let batchIndex = 0;
    
    const renderBatch = () => {
      // Calculate start and end frame indices for this batch
      const startFrame = batchIndex * batchSize;
      const endFrame = Math.min(startFrame + batchSize, actualFrameCount);
      
      // Render frames in this batch
      for (let frameIndex = startFrame; frameIndex < endFrame; frameIndex++) {
        // Calculate time for this frame
        const time = frameIndex * timeStep;

        // First draw the thumbnail
        ctx.drawImage(thumbnail, 0, 0, canvas.width, canvas.height);
        
        // Apply filters
        applyFilters(ctx, canvas.width, canvas.height, filterSettings, fluidSettings, time);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        frames.push(imageData);
        
        // Update progress
        progress = Math.round((frameIndex + 1) / actualFrameCount * 100);
        setRenderProgress(progress);
        onRenderProgress(progress);
      }
      
      // Update batch index
      batchIndex++;
      
      // Check if rendering is complete
      if (batchIndex * batchSize >= actualFrameCount) {
        // Clean up
        clearTimeout(safetyTimeout);
        clearTimeout(ultimateSafetyTimeout);
        
        console.log(`Background rendering complete. Generated ${frames.length} frames.`);
        renderCompleted = true;
        onRenderProgress(100);
        onRenderComplete(frames);
      } else {
        // Schedule next batch
        setTimeout(renderBatch, 0);
      }
    };
    
    // Start the first batch
    try {
      renderBatch();
    } catch (error) {
      console.error("Error during batch rendering:", error);
      clearTimeout(safetyTimeout);
      clearTimeout(ultimateSafetyTimeout);
      onRenderComplete(frames.length > 0 ? frames : []);
      setIsReady(true);
    }
  };

  // Apply all filters with timestamp for animation
  const applyFilters = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    filterSettings: FilterSettings,
    fluidSettings: FluidSettings,
    timeMs: number = 0
  ) => {
    try {
      // Safety check for valid context and dimensions
      if (!ctx || width <= 0 || height <= 0) return;
      
      // Apply each filter, checking that filter settings exist and are valid
      
      if (filterSettings.layerVariation > 0) {
        // Get ImageData from the context instead of passing the context directly
        const imageData = ctx.getImageData(0, 0, width, height);
        LayerVariation(imageData, width, height, filterSettings.layerVariation);
        // Put the modified image data back to the canvas
        ctx.putImageData(imageData, 0, 0);
      }
      
      if (filterSettings.zigZag > 0) {
        ZigZag(ctx, { width, height }, filterSettings.zigZag, timeMs);
      }
      
      if (filterSettings.pixelate > 0) {
        Pixelate(ctx, width, height, filterSettings.pixelate);
      }

      // Apply chromatic aberration with time parameter
      if (filterSettings.chromaShift > 0) {
        ChromaShift(ctx, width, height, filterSettings.chromaShift, timeMs);
      }
      
      if (filterSettings.staticOnScreen > 0) {
        StaticOnScreen(ctx, width, height, filterSettings.staticOnScreen);
      }
      
      if (filterSettings.scanLines > 0) {
        ScanLines(ctx, width, height, filterSettings.scanLines, timeMs);
      }
      
      if (filterSettings.vhsColorGrade > 0) {
        VHSColorGrade(ctx, width, height, filterSettings.vhsColorGrade);
      }
      
      // Apply fluid animation if settings exist and animation is active
      if (isAnimating && fluidSettings && Object.keys(fluidSettings).length > 0) {
        FluidAnimation(
          ctx,
          width,  // Add width parameter
          height, // Add height parameter
          fluidSettings.flowSpeed, 
          fluidSettings.turbulence, 
          fluidSettings.colorShift,
          timeMs
        );
      }
    } catch (error) {
      console.error('Error applying filters:', error);
    }
  };

  // Add download function
  const handleDownload = () => {
    if (!canvasRef.current) return;
    
    try {
      // Get the current canvas dimensions
      const canvas = canvasRef.current;
      const width = canvas.width;
      const height = canvas.height;
      
      // Create a new canvas at the same dimensions
      const downloadCanvas = document.createElement('canvas');
      downloadCanvas.width = width;
      downloadCanvas.height = height;
      const downloadCtx = downloadCanvas.getContext('2d');
      
      if (!downloadCtx) {
        console.error('Failed to get download canvas context');
        return;
      }
      
      // Copy the current canvas content to the download canvas
      downloadCtx.drawImage(canvas, 0, 0, width, height);
      
      // Create a download link
      const dataURL = downloadCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = 'glitch-app-image.png';
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(dataURL), 100);
      
    } catch (error) {
      console.error('Error during PNG download:', error);
    }
  };

  // Add GIF download function
  const handleGifDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas || !thumbnail) return;
    
    try {
      console.log('[PreviewWindow] Starting GIF creation process');
      
      // Use the original thumbnail dimensions for the GIF to ensure full size output
      // This ensures the GIF matches the expected size rather than the potentially scaled-down canvas
      const width = thumbnail.width;
      const height = thumbnail.height;
      
      console.log('[PreviewWindow] Using GIF dimensions:', width, 'x', height, '(using original thumbnail size)');
      
      // Create a loading indicator
      const loadingToast = document.createElement('div');
      loadingToast.textContent = 'Creating GIF...';
      loadingToast.style.position = 'fixed';
      loadingToast.style.bottom = '20px';
      loadingToast.style.right = '20px';
      loadingToast.style.backgroundColor = 'rgba(79, 70, 229, 0.9)';
      loadingToast.style.color = 'white';
      loadingToast.style.padding = '10px 20px';
      loadingToast.style.borderRadius = '4px';
      loadingToast.style.zIndex = '1000';
      document.body.appendChild(loadingToast);
      
      // Properly initialize GIF with correct path to worker
      const gif = new GIF({
        workers: 4,
        quality: 10,
        width: width,
        height: height,
        workerScript: '/gif.worker.js',
        debug: true
      });
      
      // Create more frames for smoother animation
      const frameCount = isAnimating ? 30 : 15;
      
      // Create a temporary canvas for better quality
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = width;
      tempCanvas.height = height;
      const tempCtx = tempCanvas.getContext('2d');
      
      if (!tempCtx) {
        console.error('[PreviewWindow] Could not get temporary canvas context');
        document.body.removeChild(loadingToast);
        return;
      }
      
      // First, draw the base image to ensure we have consistent starting state
      tempCtx.drawImage(thumbnail, 0, 0, width, height);
      
      // Apply filters to the first frame to ensure it matches the preview
      const initialTimeOffset = Date.now() / 1000;
      applyFilters(tempCtx, width, height, filterSettings, fluidSettings, initialTimeOffset);
      
      // Add first frame - now with filters applied
      gif.addFrame(tempCanvas, { delay: 100, copy: true });
      
      console.log('[PreviewWindow] Added first frame to GIF with filters applied');
      
      // Queue to add the remaining frames
      let frameIndex = 0;
      
      // Create a named function to add frames incrementally
      const addNextFrame = () => {
        if (frameIndex >= frameCount) {
          // All frames have been added, render the GIF
          console.log('[PreviewWindow] Rendering GIF with', frameCount, 'frames');
          
          // When the GIF is finished, download it
          gif.on('finished', function(blob) {
            console.log('[PreviewWindow] GIF created, size:', blob.size, 'bytes');
            loadingToast.textContent = 'GIF created! Downloading...';
            
            const gifUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = gifUrl;
            a.download = 'glitch-effect.gif';
            document.body.appendChild(a);
            a.click();
            
            // Clean up
            setTimeout(() => {
              document.body.removeChild(a);
              document.body.removeChild(loadingToast);
              URL.revokeObjectURL(gifUrl);
            }, 2000);
          });
          
          gif.on('progress', function(p) {
            loadingToast.textContent = `Creating GIF: ${Math.round(p * 100)}%`;
          });
          
          gif.render();
          return;
        }
        
        // Calculate a time offset for this frame to create variation
        const timeOffset = (Date.now() + (frameIndex * 200)) / 1000;
        
        // Clear the temporary canvas
        tempCtx.clearRect(0, 0, width, height);
        
        // Draw the base image first
        tempCtx.drawImage(thumbnail, 0, 0, width, height);
        
        // Apply the filters to create the animation effect
        applyFilters(tempCtx, width, height, filterSettings, fluidSettings, timeOffset);
        
        // Add the frame to the GIF with a copy to ensure it's properly captured
        gif.addFrame(tempCanvas, { delay: 100, copy: true });
        
        // Process the next frame (use setTimeout to prevent UI blocking)
        frameIndex++;
        setTimeout(addNextFrame, 0);
      };
      
      // Start adding frames
      addNextFrame();
      
    } catch (error) {
      console.error('[PreviewWindow] Error creating GIF:', error);
      alert('Failed to create GIF. Please try again.');
    }
  };

  // Handle animation state changes
  useEffect(() => {
    console.log(`[PreviewWindow] Animation state changed: isAnimating=${isAnimating}, isPreviewMode=${isPreviewMode}, isRendering=${isRendering}`);
    
    if (isAnimating && !isRendering) {
      console.log('[PreviewWindow] Starting animation');
      
      if (renderedFrames.length > 0) {
        console.log(`[PreviewWindow] Using ${renderedFrames.length} pre-rendered frames`);
        playRenderedFrames();
      } else {
        console.log('[PreviewWindow] Using live animation');
        startLiveAnimation();
      }
    } else if (!isAnimating) {
      // Ensure animation is stopped
      if (animationFrameIdRef.current) {
        console.log('[PreviewWindow] Stopping animation');
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      
      // If we're in preview mode, render static frame
      if (isPreviewMode && !isRendering) {
        console.log('[PreviewWindow] Rendering static preview frame');
        renderStaticFrame();
      }
    }
    
    // Cleanup function to ensure animation is stopped
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [isAnimating, isPreviewMode, isRendering, renderedFrames.length]);

  // Immediately start animation when component mounts if isAnimating is true
  useEffect(() => {
    if (isAnimating && !isRendering && !initialAnimationStarted.current) {
      console.log('[PreviewWindow] Initial animation auto-start');
      initialAnimationStarted.current = true;
      
      // Small delay to ensure canvas is ready
      setTimeout(() => {
        if (renderedFrames.length > 0) {
          playRenderedFrames();
        } else {
          startLiveAnimation();
        }
      }, 200);
    }
  }, [isAnimating, isRendering, renderedFrames.length]);

  // Define the setCanvasSize function to properly size the canvas based on thumbnail and container
  const setCanvasSize = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Get current container dimensions
    const containerRect = containerRef.current?.getBoundingClientRect();
    const containerWidth = containerRect?.width || 800;
    const containerHeight = containerRect?.height || 600;
    
    console.log('[PreviewWindow] Container dimensions:', containerWidth, 'x', containerHeight);
    console.log('[PreviewWindow] Thumbnail dimensions:', thumbnail.width, 'x', thumbnail.height);
    
    // Maximum allowed dimensions
    const MAX_DIMENSION = 1000;
    
    // Calculate the scaling based on the original thumbnail size
    let scaledWidth = thumbnail.width;
    let scaledHeight = thumbnail.height;
    
    if (thumbnail.width > MAX_DIMENSION || thumbnail.height > MAX_DIMENSION) {
      if (thumbnail.width > thumbnail.height) {
        // Landscape orientation
        scaledWidth = MAX_DIMENSION;
        scaledHeight = (thumbnail.height / thumbnail.width) * MAX_DIMENSION;
      } else {
        // Portrait orientation
        scaledHeight = MAX_DIMENSION;
        scaledWidth = (thumbnail.width / thumbnail.height) * MAX_DIMENSION;
      }
    }
    
    console.log('[PreviewWindow] Scaled dimensions:', scaledWidth, 'x', scaledHeight);
    
    // For the canvas display, we need to fit it in the container
    // but we should prioritize using the full sized canvas when possible
    let canvasWidth, canvasHeight;
    
    // Use the scaled dimensions directly if they fit in the container
    if (scaledWidth <= containerWidth && scaledHeight <= containerHeight) {
      canvasWidth = scaledWidth;
      canvasHeight = scaledHeight;
      console.log('[PreviewWindow] Using direct scaled dimensions');
    } else {
      // Otherwise, adjust to fit container while maintaining aspect ratio
      const aspectRatio = scaledWidth / scaledHeight;
      
      if (scaledWidth / containerWidth > scaledHeight / containerHeight) {
        // Width is the limiting factor
        canvasWidth = containerWidth;
        canvasHeight = containerWidth / aspectRatio;
      } else {
        // Height is the limiting factor
        canvasHeight = containerHeight;
        canvasWidth = containerHeight * aspectRatio;
      }
      console.log('[PreviewWindow] Adjusted to fit container');
    }
    
    // Set minimum dimensions to ensure canvas is visible
    const minWidth = 400;
    const minHeight = 300;
    
    // Set canvas dimensions based on the calculated optimal dimensions
    canvas.width = Math.max(Math.floor(canvasWidth), minWidth);
    canvas.height = Math.max(Math.floor(canvasHeight), minHeight);
    
    console.log('[PreviewWindow] Final canvas size set to:', canvas.width, 'x', canvas.height);
  };

  // Update the effect that handles thumbnail changes
  useEffect(() => {
    if (!thumbnail) {
      console.error('[PreviewWindow] No thumbnail provided');
      return;
    }
    
    console.log('[PreviewWindow] Thumbnail changed:', thumbnail.width, 'x', thumbnail.height);
    
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('[PreviewWindow] No canvas found');
      return;
    }
    
    // Update canvas size when thumbnail changes
    setCanvasSize();
    
    try {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw initial image
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(thumbnail, 0, 0, canvas.width, canvas.height);
      } else {
        console.error('[PreviewWindow] Error getting canvas context');
      }
    } catch (error) {
      console.error('[PreviewWindow] Error drawing initial image:', error);
    }
    
    // Render initial frame with short delay
    setTimeout(() => {
      // Make sure setCanvasSize has finished before rendering
      requestAnimationFrame(() => {
        renderStaticFrame();
        setIsReady(true);
      });
    }, 100);
    
    // Cleanup function
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [thumbnail]);

  // Add this useEffect to force show content after a timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log("Forcing content display after timeout");
      setForceShowContent(true);
      setIsReady(true);
      
      // Force transition out of rendering state if we're still stuck
      if (isRendering) {
        console.log("Forcing completion of rendering process");
        onRenderProgress(100);
        onRenderComplete([]);
      }
    }, 8000);
    
    return () => clearTimeout(timer);
  }, [isRendering, onRenderComplete, onRenderProgress]);

  // Place the useEffect at the end, after all function declarations
  useEffect(() => {
    console.log("Main animation useEffect triggered with state:", {
      isAnimating, isPreviewMode, isRendering, isReady, renderedFrames: renderedFrames?.length || 0
    });
    
    try {
      // Clear any ongoing animations
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }

      // Force a direct render once when dependencies change to ensure we see something
      renderStaticFrame();
      
      if (!isReady) {
        console.log("Component not ready yet, skipping animation setup");
        return;
      }

      if (isAnimating) {
        if (isPreviewMode && renderedFrames && renderedFrames.length > 0) {
          console.log("Starting pre-rendered frames playback with", renderedFrames.length, "frames");
          playRenderedFrames();
        } else if (isRendering) {
          console.log("Starting background render process");
          renderFramesInBackground();
        } else {
          console.log("Starting live animation");
          startLiveAnimation();
        }
      } else {
        console.log("Animation disabled, rendering static frame");
        renderStaticFrame();
      }
    } catch (error) {
      console.error("Error in animation useEffect:", error);
      // Fallback to static frame if anything fails
      setIsReady(true);
      renderStaticFrame();
    }

    // Cleanup function
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [
    isAnimating, 
    isPreviewMode, 
    isRendering, 
    isReady,
    renderedFrames, 
    // Include all the functions that are used
    renderStaticFrame,
    playRenderedFrames,
    renderFramesInBackground,
    startLiveAnimation
  ]);

  // Add this near the top of the component, after the state variables
  useEffect(() => {
    // Create a fallback rendering to ensure something is visible
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions if not already set
    if (canvas.width === 0) canvas.width = 600;
    if (canvas.height === 0) canvas.height = 400;
    
    // Draw a simple gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#333');
    gradient.addColorStop(1, '#111');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add text to show the canvas is working
    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('ReRewind Preview Window', canvas.width/2, canvas.height/2 - 20);
    ctx.font = '16px Arial';
    ctx.fillText('Canvas is working!', canvas.width/2, canvas.height/2 + 20);
    
    // Draw a simple animation frame to verify rendering
    let frameCount = 0;
    const animate = () => {
      frameCount++;
      
      // Clear only a portion to keep the background
      ctx.clearRect(0, canvas.height - 40, canvas.width, 40);
      
      // Draw animated text
      const now = new Date();
      ctx.fillStyle = '#fff';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`Frame: ${frameCount} - Time: ${now.toLocaleTimeString()}`, 
                   canvas.width/2, canvas.height - 20);
      
      // Request next frame
      requestAnimationFrame(animate);
    };
    
    // Start animation
    animate();
    
    // Set states to show content
    setForceShowContent(true);
    setIsReady(true);
    
    console.log('[PreviewWindow] Fallback rendering initialized');
  }, []);

  return (
    <div className="w-full h-full bg-slate-50 dark:bg-slate-800 rounded-xl overflow-hidden relative">
      {/* Header area */}
      <div className="p-4 bg-white dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 font-serif">
          Preview window
        </h2>
        <div className="flex space-x-2">
          <button 
            onClick={handleDownload}
            className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition-colors"
          >
            Download
          </button>
          <button 
            onClick={handleGifDownload}
            className="px-3 py-1 bg-purple-500 text-white rounded-md text-sm hover:bg-purple-600 transition-colors"
          >
            Download GIF
          </button>
        </div>
      </div>
      
      {/* Force the component to show content after a delay */}
      <div className="w-full h-full flex items-center justify-center relative">
        {/* Loading state with fallback timeout */}
        {((!isReady || isRendering) && !forceShowContent) ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 z-20">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-700 dark:text-slate-300 text-lg">
              {isRendering ? "Rendering effect..." : "Tune in for just a moment..."}
            </p>
            {isRendering && (
              <p className="text-slate-500 dark:text-slate-400 mt-2">{renderProgress}%</p>
            )}
          </div>
        ) : (
          <>
            {/* Canvas for animation/static display */}
            <canvas 
              ref={canvasRef}
              className="absolute inset-0 w-full h-full object-contain"
            />
            
            {/* Overlay when rendering in progress */}
            {isRendering && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                <div className="bg-white dark:bg-slate-700 p-4 rounded-lg shadow-lg">
                  <p className="text-slate-900 dark:text-slate-100">Rendering: {renderProgress}%</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PreviewWindow;