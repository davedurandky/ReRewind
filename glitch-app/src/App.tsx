import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import { captureFrames, createGifFromFrames, downloadBlob } from './utils/gifExport';

// Define interfaces for our settings
interface FilterSettings {
  layerVariation: number;
  layerSeparation: number;
  staticOnScreen: number;
  staticOnLayerSeparation: number;
  zigZag: number;
  duplicateSynth: number;
  liquidMesh: number;
  psychedelic: number;
  brightness: number;
  fibonacci: number;
  vhsColorGrade: number;
}

interface FluidSettings {
  flowSpeed: number;
  turbulence: number;
  colorShift: number;
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isAnimating, setIsAnimating] = useState(true);
  const [uploadedImage, setUploadedImage] = useState<HTMLImageElement | null>(null);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  
  // Filter settings with default values
  const [filterSettings, setFilterSettings] = useState<FilterSettings>({
    layerVariation: 2.9,
    layerSeparation: 0.0,
    staticOnScreen: 3.0,
    staticOnLayerSeparation: 0.0,
    zigZag: 3.8,
    duplicateSynth: 0.0,
    liquidMesh: 0.0,
    psychedelic: 0.0,
    brightness: 0.0,
    fibonacci: 0.0,
    vhsColorGrade: 0.0
  });
  
  // Fluid settings with default values
  const [fluidSettings, setFluidSettings] = useState<FluidSettings>({
    flowSpeed: 1.6,
    turbulence: 0.0,
    colorShift: 0.0
  });
  
  // Animation speed
  const [animationSpeed, setAnimationSpeed] = useState(1.0);
  
  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setUploadedImage(img);
        setIsImageLoaded(true);
      };
      img.src = e.target?.result as string;
    };
    
    reader.readAsDataURL(file);
  };
  
  // Handle drag and drop
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    
    const files = event.dataTransfer.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (!file.type.match('image.*')) {
      alert('Please drop an image file');
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setUploadedImage(img);
        setIsImageLoaded(true);
      };
      img.src = e.target?.result as string;
    };
    
    reader.readAsDataURL(file);
  };
  
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };
  
  // Animation and rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set canvas dimensions
    canvas.width = 800;
    canvas.height = 600;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Animation variables
    let frameCount = 0;
    let animationId: number;
    
    // Animation function
    const render = () => {
      frameCount++;
      
      // Clear canvas
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      if (isImageLoaded && uploadedImage) {
        // Draw the uploaded image
        const imgAspect = uploadedImage.width / uploadedImage.height;
        const canvasAspect = canvas.width / canvas.height;
        
        let drawWidth, drawHeight, drawX, drawY;
        
        if (imgAspect > canvasAspect) {
          // Image is wider than canvas (relative to height)
          drawWidth = canvas.width;
          drawHeight = canvas.width / imgAspect;
          drawX = 0;
          drawY = (canvas.height - drawHeight) / 2;
        } else {
          // Image is taller than canvas (relative to width)
          drawHeight = canvas.height;
          drawWidth = canvas.height * imgAspect;
          drawX = (canvas.width - drawWidth) / 2;
          drawY = 0;
        }
        
        // Create a temporary canvas for applying effects only to the image area
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = drawWidth;
        tempCanvas.height = drawHeight;
        const tempCtx = tempCanvas.getContext('2d');
        
        if (tempCtx) {
          // Draw the image to the temporary canvas
          tempCtx.drawImage(uploadedImage, 0, 0, drawWidth, drawHeight);
          
          // Apply effects to the temporary canvas (image area only)
          applyEffects(tempCtx, frameCount);
          
          // Draw the processed image back to the main canvas
          ctx.drawImage(tempCanvas, drawX, drawY);
          
          // Add a subtle border around the image
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.lineWidth = 1;
          ctx.strokeRect(drawX, drawY, drawWidth, drawHeight);
        }
      } else {
        // Draw default animation
        drawDefaultAnimation(ctx, frameCount, canvas.width, canvas.height);
      }
      
      // Continue animation if enabled
      if (isAnimating) {
        animationId = requestAnimationFrame(render);
      }
    };
    
    // Helper function to draw default animation
    function drawDefaultAnimation(ctx: CanvasRenderingContext2D, frameCount: number, width: number, height: number) {
      // Draw title
      ctx.fillStyle = '#fff';
      ctx.font = '48px "VT323", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('ReRewind', width/2, 100);
      
      // Draw subtitle
      ctx.font = '24px "VT323", monospace';
      ctx.fillText('Upload an image to begin', width/2, 150);
      
      // Draw animated element
      const time = new Date();
      const seconds = time.getSeconds() + time.getMilliseconds() / 1000;
      const radius = 100 + Math.sin(seconds * animationSpeed) * 50;
      
      // Draw circle
      ctx.beginPath();
      ctx.arc(width/2, height/2, radius, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${frameCount % 360}, 70%, 60%)`;
      ctx.fill();
      
      // Apply some basic effects to show what's possible
      applyEffects(ctx, frameCount);
      
      // Draw frame counter
      ctx.fillStyle = '#fff';
      ctx.font = '16px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`Frame: ${frameCount}`, 20, height - 20);
      ctx.textAlign = 'right';
      ctx.fillText(time.toLocaleTimeString(), width - 20, height - 20);
    }
    
    // Helper function to apply effects based on settings
    function applyEffects(ctx: CanvasRenderingContext2D, frameCount: number) {
      // Get current time for animations
      const time = new Date();
      const seconds = time.getSeconds() + time.getMilliseconds() / 1000;
      
      // Apply Layer Variation effect (must be first as it creates the layers)
      const layers = filterSettings.layerVariation > 0 ? 
        applyLayerVariation(ctx, filterSettings.layerVariation, seconds) : [];
      
      // Apply Layer Separation (requires layers from Layer Variation)
      const gaps = filterSettings.layerSeparation > 0 && layers.length > 0 ? 
        applyLayerSeparation(ctx, filterSettings.layerSeparation, layers) : [];
      
      // Apply Static on Screen
      if (filterSettings.staticOnScreen > 0) {
        applyStatic(ctx, filterSettings.staticOnScreen);
      }
      
      // Apply Static on Layer Separation (requires gaps from Layer Separation)
      if (filterSettings.staticOnLayerSeparation > 0 && gaps.length > 0) {
        applyStaticOnLayerSeparation(ctx, filterSettings.staticOnLayerSeparation, gaps);
      }
      
      // Apply ZigZag effect
      if (filterSettings.zigZag > 0) {
        applyZigZag(ctx, filterSettings.zigZag, seconds, layers);
      }
      
      // Apply Duplicate Synth
      if (filterSettings.duplicateSynth > 0) {
        applyDuplicateSynth(ctx, filterSettings.duplicateSynth, seconds);
      }
      
      // Apply Liquid Mesh
      if (filterSettings.liquidMesh > 0) {
        applyLiquidMesh(ctx, filterSettings.liquidMesh, seconds);
      }
      
      // Apply Psychedelic
      if (filterSettings.psychedelic > 0) {
        applyPsychedelic(ctx, filterSettings.psychedelic, seconds);
      }
      
      // Apply Brightness
      if (filterSettings.brightness > 0) {
        applyBrightness(ctx, filterSettings.brightness);
      }
      
      // Apply Fibonacci
      if (filterSettings.fibonacci > 0) {
        applyFibonacci(ctx, filterSettings.fibonacci, seconds);
      }
      
      // Apply VHS Color Grade
      if (filterSettings.vhsColorGrade > 0) {
        applyVHSColorGrade(ctx, filterSettings.vhsColorGrade);
      }
      
      // Apply Fluid Animation
      if (fluidSettings.flowSpeed > 0) {
        applyFluidAnimation(ctx, fluidSettings.flowSpeed, seconds);
      }
      
      // Apply additional fluid effects
      if (fluidSettings.turbulence > 0) {
        applyTurbulence(ctx, fluidSettings.turbulence, seconds);
      }
      
      if (fluidSettings.colorShift > 0) {
        applyColorShift(ctx, fluidSettings.colorShift, seconds);
      }
    }
    
    // Start animation
    render();
    
    // Cleanup
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isAnimating, uploadedImage, isImageLoaded, filterSettings, fluidSettings, animationSpeed]);
  
  // Completely reimagined effect implementations
  const applyLayerVariation = (ctx: CanvasRenderingContext2D, intensity: number, time: number): { y: number, height: number }[] => {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    // Create a copy of the current canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return [];
    
    // Draw the current state to the temp canvas
    tempCtx.drawImage(ctx.canvas, 0, 0);
    
    // Clear the original canvas
    ctx.clearRect(0, 0, width, height);
    
    // If intensity is 0, just draw the original image and return empty layers
    if (intensity === 0) {
      ctx.drawImage(tempCanvas, 0, 0);
      return [];
    }
    
    // Calculate number of layers based on intensity (0-10)
    const numLayers = Math.floor(5 + (intensity / 10) * 10); // 5-15 layers
    
    // Create layers with varying heights
    const layers: { y: number, height: number }[] = [];
    let currentY = 0;
    
    for (let i = 0; i < numLayers; i++) {
      // Last layer takes remaining height
      if (i === numLayers - 1) {
        layers.push({ y: currentY, height: height - currentY });
      } else {
        // Random height between 5% and 20% of total height
        const layerHeight = Math.floor(height * (0.05 + Math.random() * 0.15));
        layers.push({ y: currentY, height: layerHeight });
        currentY += layerHeight;
        
        // If we've exceeded the canvas height, stop creating layers
        if (currentY >= height) break;
      }
    }
    
    // Draw each layer
    layers.forEach(layer => {
      ctx.drawImage(
        tempCanvas,
        0, layer.y, width, layer.height,  // Source rectangle
        0, layer.y, width, layer.height   // Destination rectangle
      );
    });
    
    // Apply RGB channel splitting if intensity > 5
    if (intensity > 5) {
      // Calculate dynamic offsets based on time and intensity
      const redOffsetX = Math.sin(time * 0.8) * (intensity - 5) * 0.6;
      const redOffsetY = Math.cos(time * 0.7) * (intensity - 5) * 0.3;
      const blueOffsetX = Math.sin(time * 1.1) * (intensity - 5) * -0.5;
      const blueOffsetY = Math.cos(time * 0.8) * (intensity - 5) * -0.2;
      
      // Apply RGB channel splitting with screen blending
      ctx.globalCompositeOperation = 'screen';
      
      // Red channel
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
      ctx.drawImage(tempCanvas, redOffsetX, redOffsetY);
      
      // Blue channel
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = 'rgba(0, 0, 255, 0.5)';
      ctx.drawImage(tempCanvas, blueOffsetX, blueOffsetY);
      
      // Reset composite operation and alpha
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1.0;
    }
    
    return layers;
  };
  
  const applyLayerSeparation = (ctx: CanvasRenderingContext2D, intensity: number, layers: { y: number, height: number }[]): { y: number, height: number }[] => {
    if (intensity === 0 || layers.length === 0) return [];
    
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    // Create a copy of the current canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return [];
    
    // Draw the current state to the temp canvas
    tempCtx.drawImage(ctx.canvas, 0, 0);
    
    // Clear the original canvas
    ctx.clearRect(0, 0, width, height);
    
    // Calculate gap size based on intensity (0-10)
    const maxGapSize = Math.floor(intensity);
    
    // Create gaps between layers
    const gaps: { y: number, height: number }[] = [];
    let totalOffset = 0;
    
    // Draw each layer with gaps
    layers.forEach((layer, index) => {
      // Skip gap for the first layer
      if (index > 0) {
        // Random gap size between 1 and maxGapSize
        const gapSize = Math.max(1, Math.floor(Math.random() * maxGapSize));
        gaps.push({ y: layer.y + totalOffset, height: gapSize });
        totalOffset += gapSize;
      }
      
      // Draw the layer at its new position
      ctx.drawImage(
        tempCanvas,
        0, layer.y, width, layer.height,  // Source rectangle
        0, layer.y + totalOffset, width, layer.height   // Destination rectangle with offset
      );
    });
    
    // Fill gaps with black
    ctx.fillStyle = 'black';
    gaps.forEach(gap => {
      ctx.fillRect(0, gap.y, width, gap.height);
    });
    
    return gaps;
  };
  
  const applyStaticOnLayerSeparation = (ctx: CanvasRenderingContext2D, intensity: number, gaps: { y: number, height: number }[]) => {
    if (intensity === 0 || gaps.length === 0) return;
    
    const width = ctx.canvas.width;
    
    // Apply static only to the gap areas
    gaps.forEach(gap => {
      const imageData = ctx.getImageData(0, gap.y, width, gap.height);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        if (Math.random() < intensity / 10) {
          const noise = Math.random() * 255;
          data[i] = noise;     // R
          data[i+1] = noise;   // G
          data[i+2] = noise;   // B
        }
      }
      
      ctx.putImageData(imageData, 0, gap.y);
    });
  };
  
  const applyDuplicateSynth = (ctx: CanvasRenderingContext2D, intensity: number, time: number) => {
    if (intensity === 0) return;
    
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    // Create a copy of the current canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;
    
    // Draw the current state to the temp canvas
    tempCtx.drawImage(ctx.canvas, 0, 0);
    
    // Calculate number of duplicates based on intensity (0-10)
    const numDuplicates = Math.floor(1 + (intensity / 10) * 4); // 1-5 duplicates
    
    // Set blending mode for duplicates
    ctx.globalCompositeOperation = 'screen';
    
    // Create each duplicate
    for (let i = 0; i < numDuplicates; i++) {
      // Calculate offset based on intensity and time
      const offsetX = Math.sin(time * (0.5 + i * 0.2)) * intensity * 2;
      const offsetY = Math.cos(time * (0.3 + i * 0.2)) * intensity * 2;
      
      // Calculate hue rotation based on duplicate index
      const hueRotate = (i * 360 / numDuplicates) % 360;
      
      // Set transparency based on intensity
      ctx.globalAlpha = 0.3 * (intensity / 10);
      
      // Apply hue rotation using a color matrix
      ctx.filter = `hue-rotate(${hueRotate}deg)`;
      
      // Draw the duplicate
      ctx.drawImage(tempCanvas, offsetX, offsetY);
    }
    
    // Reset composite operation, alpha, and filter
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1.0;
    ctx.filter = 'none';
  };
  
  const applyStatic = (ctx: CanvasRenderingContext2D, intensity: number) => {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    // Create a copy of the current canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;
    
    tempCtx.drawImage(ctx.canvas, 0, 0);
    
    // Get image data for pixel manipulation
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Create more realistic static with varying intensity
    for (let y = 0; y < height; y++) {
      // Make static vary by row for a more authentic look
      // Add time-based variation for a more dynamic effect
      const rowIntensity = intensity * (1 + 0.2 * Math.sin(y * 0.1));
      
      // Occasionally add horizontal line glitches (more common in VHS)
      if (Math.random() < intensity / 50) {
        const lineLength = Math.floor(Math.random() * width);
        const lineStart = Math.floor(Math.random() * (width - lineLength));
        const brightness = Math.random() * 255;
        const lineThickness = Math.floor(Math.random() * 3) + 1;
        
        // Draw horizontal line glitch
        for (let ly = 0; ly < lineThickness; ly++) {
          if (y + ly < height) {
            for (let x = lineStart; x < lineStart + lineLength; x++) {
              const i = ((y + ly) * width + x) * 4;
              data[i] = brightness;     // R
              data[i+1] = brightness;   // G
              data[i+2] = brightness;   // B
            }
          }
        }
      }
      
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        
        // Apply static with varying probability based on intensity
        if (Math.random() < rowIntensity / 30) {
          // Create more realistic static with varying brightness
          const noise = Math.random() * 255;
          const alpha = Math.random() * 0.7 + 0.3; // Vary the opacity
          
          // Blend the noise with the original pixel for a more integrated look
          data[i] = data[i] * (1 - alpha) + noise * alpha;     // R
          data[i+1] = data[i+1] * (1 - alpha) + noise * alpha; // G
          data[i+2] = data[i+2] * (1 - alpha) + noise * alpha; // B
        }
        
        // Add occasional pixel dropouts (black pixels)
        if (Math.random() < intensity / 200) {
          data[i] = 0;     // R
          data[i+1] = 0;   // G
          data[i+2] = 0;   // B
        }
        
        // Add occasional bright spots
        if (Math.random() < intensity / 300) {
          data[i] = 255;     // R
          data[i+1] = 255;   // G
          data[i+2] = 255;   // B
        }
      }
    }
    
    // Add vertical sync issues (common in VHS)
    if (intensity > 3) {
      const syncOffset = Math.floor(Math.random() * 10) * (intensity / 3);
      if (syncOffset > 0) {
        const syncHeight = Math.floor(Math.random() * 30) + 10;
        const syncY = Math.floor(Math.random() * (height - syncHeight));
        
        // Shift a horizontal band of the image
        for (let y = syncY; y < syncY + syncHeight; y++) {
          for (let x = 0; x < width - syncOffset; x++) {
            const targetIdx = (y * width + x) * 4;
            const sourceIdx = (y * width + (x + syncOffset)) * 4;
            
            data[targetIdx] = data[sourceIdx];
            data[targetIdx+1] = data[sourceIdx+1];
            data[targetIdx+2] = data[sourceIdx+2];
          }
        }
      }
    }
    
    // Apply the modified image data
    ctx.putImageData(imageData, 0, 0);
    
    // Add subtle scan lines overlay for higher intensities
    if (intensity > 5) {
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = 0.2;
      
      // Create scan line pattern
      const scanLineCanvas = document.createElement('canvas');
      scanLineCanvas.width = width;
      scanLineCanvas.height = height;
      const scanLineCtx = scanLineCanvas.getContext('2d');
      
      if (scanLineCtx) {
        scanLineCtx.fillStyle = '#000';
        for (let y = 0; y < height; y += 2) {
          scanLineCtx.fillRect(0, y, width, 1);
        }
        
        ctx.drawImage(scanLineCanvas, 0, 0);
      }
      
      // Reset composite operation
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1.0;
    }
  };
  
  const applyZigZag = (ctx: CanvasRenderingContext2D, intensity: number, time: number, layers?: { y: number, height: number }[]) => {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    // Create a copy of the current canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;
    
    tempCtx.drawImage(ctx.canvas, 0, 0);
    
    // Clear the main canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw back with zigzag distortion
    // Use smaller slices for higher quality effect
    const sliceHeight = Math.max(2, Math.floor(10 - intensity * 0.5));
    
    // Add occasional major glitches for higher intensities
    const majorGlitchActive = intensity > 5 && Math.random() < 0.1;
    const glitchY = majorGlitchActive ? Math.floor(Math.random() * height) : -1;
    const glitchHeight = majorGlitchActive ? Math.floor(Math.random() * 50) + 10 : 0;
    
    // If we have layers, use them for slicing
    if (layers && layers.length > 0) {
      layers.forEach(layer => {
        // Calculate horizontal offset based on zigzag pattern
        // Add time-based variation for more dynamic effect
        const waveFreq = 0.1 + (intensity * 0.02);
        const timeScale = 2 + (intensity * 0.5);
        
        // Create more complex wave patterns
        let offsetX = Math.sin(layer.y * waveFreq + time * timeScale) * intensity * 3;
        
        // Add secondary wave for more complex movement
        offsetX += Math.sin(layer.y * waveFreq * 2.7 + time * (timeScale * 0.6)) * intensity * 1.5;
        
        // Add occasional glitch jumps
        const glitchJump = (Math.random() < intensity / 30) ? 
          (Math.random() - 0.5) * intensity * 20 : 0;
        
        // Apply major glitch if active and in range
        if (majorGlitchActive && layer.y >= glitchY && layer.y < glitchY + glitchHeight) {
          // Major horizontal shift
          offsetX = (Math.random() - 0.5) * width * 0.5;
          
          // Occasionally reverse slice
          if (Math.random() < 0.3) {
            // Draw reversed slice
            ctx.save();
            ctx.scale(-1, 1);
            ctx.drawImage(
              tempCanvas,
              0, layer.y, width, layer.height,  // Source rectangle
              -width - offsetX, layer.y, width, layer.height  // Destination rectangle (mirrored)
            );
            ctx.restore();
            return; // Skip the normal drawing for this layer
          }
        }
        
        // Draw the slice with offset
        ctx.drawImage(
          tempCanvas,
          0, layer.y, width, layer.height,  // Source rectangle
          offsetX + glitchJump, layer.y, width, layer.height  // Destination rectangle
        );
        
        // Occasionally add color shift to slices
        if (Math.random() < intensity / 20) {
          ctx.globalCompositeOperation = 'screen';
          ctx.globalAlpha = 0.3;
          ctx.fillStyle = Math.random() < 0.5 ? 'rgba(255,0,0,0.3)' : 'rgba(0,0,255,0.3)';
          ctx.fillRect(offsetX + glitchJump, layer.y, width, layer.height);
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = 1.0;
        }
      });
    } else {
      // Use regular slicing if no layers are provided
      for (let y = 0; y < height; y += sliceHeight) {
        const sliceY = Math.min(y, height);
        const sliceH = Math.min(sliceHeight, height - y);
        
        // Calculate horizontal offset based on zigzag pattern
        // Add time-based variation for more dynamic effect
        const waveFreq = 0.1 + (intensity * 0.02);
        const timeScale = 2 + (intensity * 0.5);
        
        // Create more complex wave patterns
        let offsetX = Math.sin(y * waveFreq + time * timeScale) * intensity * 3;
        
        // Add secondary wave for more complex movement
        offsetX += Math.sin(y * waveFreq * 2.7 + time * (timeScale * 0.6)) * intensity * 1.5;
        
        // Add occasional glitch jumps
        const glitchJump = (Math.random() < intensity / 30) ? 
          (Math.random() - 0.5) * intensity * 20 : 0;
        
        // Apply major glitch if active and in range
        if (majorGlitchActive && y >= glitchY && y < glitchY + glitchHeight) {
          // Major horizontal shift
          offsetX = (Math.random() - 0.5) * width * 0.5;
          
          // Occasionally reverse slice
          if (Math.random() < 0.3) {
            // Draw reversed slice
            ctx.save();
            ctx.scale(-1, 1);
            ctx.drawImage(
              tempCanvas,
              0, sliceY, width, sliceH,  // Source rectangle
              -width - offsetX, sliceY, width, sliceH  // Destination rectangle (mirrored)
            );
            ctx.restore();
            continue;
          }
        }
        
        // Draw the slice with offset
        ctx.drawImage(
          tempCanvas,
          0, sliceY, width, sliceH,  // Source rectangle
          offsetX + glitchJump, sliceY, width, sliceH  // Destination rectangle
        );
        
        // Occasionally add color shift to slices
        if (Math.random() < intensity / 20) {
          ctx.globalCompositeOperation = 'screen';
          ctx.globalAlpha = 0.3;
          ctx.fillStyle = Math.random() < 0.5 ? 'rgba(255,0,0,0.3)' : 'rgba(0,0,255,0.3)';
          ctx.fillRect(offsetX + glitchJump, sliceY, width, sliceH);
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = 1.0;
        }
      }
    }
    
    // Add digital corruption artifacts for high intensity
    if (intensity > 7) {
      // Create random blocks of corruption
      const blockCount = Math.floor(intensity * 2);
      
      for (let i = 0; i < blockCount; i++) {
        const blockX = Math.floor(Math.random() * width);
        const blockY = Math.floor(Math.random() * height);
        const blockW = Math.floor(Math.random() * 40) + 10;
        const blockH = Math.floor(Math.random() * 20) + 5;
        
        // Get data from a random location
        const sourceX = Math.floor(Math.random() * width);
        const sourceY = Math.floor(Math.random() * height);
        
        // Draw corrupted block
        ctx.drawImage(
          tempCanvas,
          sourceX, sourceY, blockW, blockH,  // Source rectangle
          blockX, blockY, blockW, blockH     // Destination rectangle
        );
        
        // Add digital artifacts
        ctx.globalCompositeOperation = 'difference';
        ctx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.5)`;
        ctx.fillRect(blockX, blockY, blockW, blockH);
        ctx.globalCompositeOperation = 'source-over';
      }
    }
  };
  
  const applyVHSColorGrade = (ctx: CanvasRenderingContext2D, intensity: number) => {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    // Create a copy of the current canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;
    
    tempCtx.drawImage(ctx.canvas, 0, 0);
    
    // Get image data for pixel manipulation
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Apply a sophisticated VHS color grading
    for (let i = 0; i < data.length; i += 4) {
      // Increase red channel for warmer look (classic VHS look)
      data[i] = Math.min(255, data[i] + intensity * 15);
      
      // Slightly decrease blue for vintage feel
      data[i+2] = Math.max(0, data[i+2] - intensity * 8);
      
      // Add slight green tint to shadows (common in VHS)
      if (data[i] < 128) {
        data[i+1] = Math.min(255, data[i+1] + intensity * 5);
      }
      
      // Adjust contrast and saturation
      for (let j = 0; j < 3; j++) {
        // Enhance contrast
        const contrastFactor = 1 + intensity * 0.2;
        data[i+j] = ((data[i+j] / 255 - 0.5) * contrastFactor + 0.5) * 255;
        
        // Limit to valid range
        data[i+j] = Math.max(0, Math.min(255, data[i+j]));
      }
    }
    
    // Apply the modified image data
    ctx.putImageData(imageData, 0, 0);
    
    // Add vignette effect (common in old recordings)
    ctx.globalCompositeOperation = 'multiply';
    
    // Create radial gradient for vignette
    const gradient = ctx.createRadialGradient(
      width / 2, height / 2, Math.min(width, height) * 0.3, // Inner circle
      width / 2, height / 2, Math.max(width, height) * 0.7  // Outer circle
    );
    
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, `rgba(0, 0, 0, ${intensity * 0.4})`);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Add subtle film grain
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.1 * intensity;
    
    // Create noise pattern
    const noiseCanvas = document.createElement('canvas');
    noiseCanvas.width = width;
    noiseCanvas.height = height;
    const noiseCtx = noiseCanvas.getContext('2d');
    
    if (noiseCtx) {
      const noiseData = noiseCtx.createImageData(width, height);
      const noiseDataArray = noiseData.data;
      
      for (let i = 0; i < noiseDataArray.length; i += 4) {
        const value = Math.random() * 255;
        noiseDataArray[i] = value;     // R
        noiseDataArray[i+1] = value;   // G
        noiseDataArray[i+2] = value;   // B
        noiseDataArray[i+3] = 50;      // A (semi-transparent)
      }
      
      noiseCtx.putImageData(noiseData, 0, 0);
      ctx.drawImage(noiseCanvas, 0, 0);
    }
    
    // Reset composite operation and alpha
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1.0;
    
    // Add subtle horizontal color bleeding (common in VHS)
    if (intensity > 3) {
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.1 * intensity;
      ctx.drawImage(tempCanvas, 2, 0); // Slight horizontal offset
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1.0;
    }
  };
  
  const applyFluidAnimation = (ctx: CanvasRenderingContext2D, intensity: number, time: number) => {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    // Create a copy of the current canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;
    
    tempCtx.drawImage(ctx.canvas, 0, 0);
    
    // Get image data for pixel manipulation
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const tempImageData = tempCtx.getImageData(0, 0, width, height);
    const tempData = tempImageData.data;
    
    // Use more complex wave patterns for more interesting distortion
    const waveScale = 0.05;
    const timeScale = intensity;
    
    // Create a displacement map for more natural fluid motion
    const displacementMap = new Array(width * height * 2);
    
    // Generate displacement map
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 2;
        
        // Create complex wave patterns
        // Primary wave
        let distX = Math.sin(y * waveScale + time * timeScale) * 5 * intensity;
        let distY = Math.cos(x * waveScale + time * timeScale * 0.8) * 5 * intensity;
        
        // Secondary wave for more complexity
        distX += Math.cos((x + y) * waveScale * 0.5 + time * timeScale * 0.7) * 3 * intensity;
        distY += Math.sin((x - y) * waveScale * 0.5 + time * timeScale * 1.2) * 3 * intensity;
        
        // Tertiary wave for even more natural movement
        if (intensity > 3) {
          distX += Math.sin(x * waveScale * 0.3 + time * timeScale * 1.1) * 2 * intensity;
          distY += Math.cos(y * waveScale * 0.3 + time * timeScale * 0.9) * 2 * intensity;
        }
        
        // Store in displacement map
        displacementMap[idx] = distX;
        displacementMap[idx + 1] = distY;
      }
    }
    
    // Apply displacement map with bilinear interpolation for smoother results
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const targetIdx = (y * width + x) * 4;
        const mapIdx = (y * width + x) * 2;
        
        // Get displacement
        const distX = displacementMap[mapIdx];
        const distY = displacementMap[mapIdx + 1];
        
        // Calculate source position with displacement
        const sourceX = x + distX;
        const sourceY = y + distY;
        
        // Bilinear interpolation for smoother results
        if (sourceX >= 0 && sourceX < width - 1 && sourceY >= 0 && sourceY < height - 1) {
          // Calculate the four surrounding pixels
          const x0 = Math.floor(sourceX);
          const y0 = Math.floor(sourceY);
          const x1 = x0 + 1;
          const y1 = y0 + 1;
          
          // Calculate interpolation weights
          const wx = sourceX - x0;
          const wy = sourceY - y0;
          
          // Get the four surrounding pixels
          const idx00 = (y0 * width + x0) * 4;
          const idx01 = (y0 * width + x1) * 4;
          const idx10 = (y1 * width + x0) * 4;
          const idx11 = (y1 * width + x1) * 4;
          
          // Interpolate each color channel
          for (let c = 0; c < 4; c++) {
            // Bilinear interpolation formula
            data[targetIdx + c] = 
              tempData[idx00 + c] * (1 - wx) * (1 - wy) +
              tempData[idx01 + c] * wx * (1 - wy) +
              tempData[idx10 + c] * (1 - wx) * wy +
              tempData[idx11 + c] * wx * wy;
          }
        } else if (sourceX >= 0 && sourceX < width && sourceY >= 0 && sourceY < height) {
          // Fallback to nearest neighbor for edge cases
          const sourceIdx = (Math.floor(sourceY) * width + Math.floor(sourceX)) * 4;
          
          data[targetIdx] = tempData[sourceIdx];
          data[targetIdx + 1] = tempData[sourceIdx + 1];
          data[targetIdx + 2] = tempData[sourceIdx + 2];
          data[targetIdx + 3] = tempData[sourceIdx + 3];
        }
      }
    }
    
    // Apply the modified image data
    ctx.putImageData(imageData, 0, 0);
    
    // Add subtle color shift overlay for more dynamic effect
    if (intensity > 2) {
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = 0.1 * (intensity / 10);
      
      // Create a subtle color gradient that shifts with time
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, `hsl(${(time * 20) % 360}, 70%, 60%)`);
      gradient.addColorStop(1, `hsl(${(time * 20 + 180) % 360}, 70%, 60%)`);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      
      // Reset composite operation
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1.0;
    }
    
    // Add caustics effect for high intensity
    if (intensity > 6) {
      ctx.globalCompositeOperation = 'lighten';
      ctx.globalAlpha = 0.2;
      
      // Create caustics pattern
      for (let i = 0; i < 3; i++) {
        const causticX = Math.sin(time * (0.5 + i * 0.2)) * width * 0.3 + width * 0.5;
        const causticY = Math.cos(time * (0.3 + i * 0.2)) * height * 0.3 + height * 0.5;
        const causticSize = Math.min(width, height) * (0.2 + Math.sin(time) * 0.1);
        
        // Create radial gradient for caustic
        const causticGradient = ctx.createRadialGradient(
          causticX, causticY, 0,
          causticX, causticY, causticSize
        );
        
        causticGradient.addColorStop(0, `hsla(${(time * 30 + i * 120) % 360}, 100%, 70%, 0.5)`);
        causticGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = causticGradient;
        ctx.fillRect(0, 0, width, height);
      }
      
      // Reset composite operation
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1.0;
    }
  };
  
  const applyLiquidMesh = (ctx: CanvasRenderingContext2D, intensity: number, time: number) => {
    if (intensity === 0) return;
    
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    // Create a copy of the current canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;
    
    // Draw the current state to the temp canvas
    tempCtx.drawImage(ctx.canvas, 0, 0);
    
    // Get image data for pixel manipulation
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const tempImageData = tempCtx.getImageData(0, 0, width, height);
    const tempData = tempImageData.data;
    
    // Scale factor for wave intensity
    const waveScale = 0.05;
    const timeScale = intensity;
    
    // Apply fluid-like distortion
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Create complex wave patterns for displacement
        const distX = Math.sin(y * waveScale + time * timeScale) * intensity +
                     Math.cos((x + y) * waveScale * 0.5 + time * timeScale * 0.7) * intensity * 0.5;
                     
        const distY = Math.cos(x * waveScale + time * timeScale * 0.8) * intensity +
                     Math.sin((x - y) * waveScale * 0.5 + time * timeScale * 1.2) * intensity * 0.5;
        
        // Calculate source position with displacement
        const sourceX = Math.floor(x + distX);
        const sourceY = Math.floor(y + distY);
        
        // Check bounds
        if (sourceX >= 0 && sourceX < width && sourceY >= 0 && sourceY < height) {
          const targetIdx = (y * width + x) * 4;
          const sourceIdx = (sourceY * width + sourceX) * 4;
          
          // Copy pixel data
          data[targetIdx] = tempData[sourceIdx];
          data[targetIdx + 1] = tempData[sourceIdx + 1];
          data[targetIdx + 2] = tempData[sourceIdx + 2];
          data[targetIdx + 3] = tempData[sourceIdx + 3];
        }
      }
    }
    
    // Apply the modified image data
    ctx.putImageData(imageData, 0, 0);
  };
  
  const applyPsychedelic = (ctx: CanvasRenderingContext2D, intensity: number, time: number) => {
    if (intensity === 0) return;
    
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    // Create a copy of the current canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;
    
    // Draw the current state to the temp canvas
    tempCtx.drawImage(ctx.canvas, 0, 0);
    
    // Clear the original canvas
    ctx.clearRect(0, 0, width, height);
    
    // Calculate center point
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Draw the original image
    ctx.drawImage(tempCanvas, 0, 0);
    
    // If intensity > 0, apply kaleidoscopic effect
    if (intensity > 0) {
      // Set blending mode
      ctx.globalCompositeOperation = 'screen';
      
      // Number of quadrants based on intensity
      const numQuadrants = Math.floor(intensity / 2.5) + 1; // 1-5 quadrants
      
      for (let i = 0; i < numQuadrants; i++) {
        // Calculate rotation angle
        const angle = (i * Math.PI * 2) / numQuadrants;
        
        // Calculate hue shift based on time and quadrant
        const hueShift = (time * 20 + i * 30) % 360;
        
        // Set transparency and filter
        ctx.globalAlpha = 0.5 * (intensity / 10);
        ctx.filter = `hue-rotate(${hueShift}deg)`;
        
        // Apply rotation and mirroring
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle);
        ctx.scale(i % 2 === 0 ? 1 : -1, 1);
        ctx.translate(-centerX, -centerY);
        
        // Draw the mirrored and rotated image
        ctx.drawImage(tempCanvas, 0, 0);
        
        ctx.restore();
      }
      
      // Reset composite operation, alpha, and filter
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1.0;
      ctx.filter = 'none';
    }
  };
  
  const applyBrightness = (ctx: CanvasRenderingContext2D, intensity: number) => {
    if (intensity === 0) return;
    
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    // Create a copy of the current canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;
    
    // Draw the current state to the temp canvas
    tempCtx.drawImage(ctx.canvas, 0, 0);
    
    // Clear the original canvas
    ctx.clearRect(0, 0, width, height);
    
    // Calculate brightness and contrast based on intensity
    const brightness = 100 + intensity * 10; // 100-200%
    const contrast = 100 + intensity * 5;    // 100-150%
    
    // Apply brightness and contrast filter
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
    
    // Draw the filtered image
    ctx.drawImage(tempCanvas, 0, 0);
    
    // Reset filter
    ctx.filter = 'none';
  };
  
  const applyFibonacci = (ctx: CanvasRenderingContext2D, intensity: number, time: number) => {
    if (intensity === 0) return;
    
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    // Calculate center point
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Calculate spiral size based on canvas dimensions and intensity
    const maxRadius = Math.min(width, height) * 0.4 * (intensity / 10);
    
    // Set up drawing style
    ctx.lineWidth = 2;
    ctx.strokeStyle = `rgba(255, 255, 255, ${intensity / 10})`;
    
    // Generate Fibonacci sequence
    const fibonacci = [1, 1];
    for (let i = 2; i < 10; i++) {
      fibonacci[i] = fibonacci[i-1] + fibonacci[i-2];
    }
    
    // Normalize the sequence to fit within maxRadius
    const scale = maxRadius / fibonacci[fibonacci.length - 1];
    
    // Draw the spiral
    ctx.beginPath();
    
    // Start from the center
    ctx.moveTo(centerX, centerY);
    
    // Animate rotation based on time
    const rotation = time * 0.2;
    
    // Draw quarter-circle arcs to form the spiral
    let angle = rotation;
    let x = centerX;
    let y = centerY;
    
    for (let i = 0; i < fibonacci.length - 1; i++) {
      const radius = fibonacci[i] * scale;
      const nextRadius = fibonacci[i+1] * scale;
      
      // Calculate control points for the arc
      const startAngle = angle;
      const endAngle = angle + Math.PI / 2;
      
      // Draw the arc
      ctx.arc(x, y, radius, startAngle, endAngle, false);
      
      // Update position for the next arc
      angle = endAngle;
      x = centerX + Math.cos(angle) * nextRadius;
      y = centerY + Math.sin(angle) * nextRadius;
    }
    
    // Stroke the path
    ctx.stroke();
  };
  
  const applyTurbulence = (ctx: CanvasRenderingContext2D, intensity: number, time: number) => {
    if (intensity === 0) return;
    
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    // Create a copy of the current canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;
    
    // Draw the current state to the temp canvas
    tempCtx.drawImage(ctx.canvas, 0, 0);
    
    // Get image data for pixel manipulation
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const tempImageData = tempCtx.getImageData(0, 0, width, height);
    const tempData = tempImageData.data;
    
    // Apply turbulence effect
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Create turbulent displacement using Perlin-like noise
        const noiseX = Math.sin(x * 0.1 + time) * Math.cos(y * 0.1 + time * 0.5);
        const noiseY = Math.cos(x * 0.1 + time * 0.7) * Math.sin(y * 0.1 + time * 0.3);
        
        const distX = noiseX * intensity * 5;
        const distY = noiseY * intensity * 5;
        
        // Calculate source position with displacement
        const sourceX = Math.floor(x + distX);
        const sourceY = Math.floor(y + distY);
        
        // Check bounds
        if (sourceX >= 0 && sourceX < width && sourceY >= 0 && sourceY < height) {
          const targetIdx = (y * width + x) * 4;
          const sourceIdx = (sourceY * width + sourceX) * 4;
          
          // Copy pixel data
          data[targetIdx] = tempData[sourceIdx];
          data[targetIdx + 1] = tempData[sourceIdx + 1];
          data[targetIdx + 2] = tempData[sourceIdx + 2];
          data[targetIdx + 3] = tempData[sourceIdx + 3];
        }
      }
    }
    
    // Apply the modified image data
    ctx.putImageData(imageData, 0, 0);
    
    // Add turbulence particles for high intensity
    if (intensity > 5) {
      // Set up particle drawing
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.2;
      
      // Number of particles based on intensity
      const numParticles = Math.floor(intensity * 5);
      
      // Draw particles
      for (let i = 0; i < numParticles; i++) {
        // Random position
        const x = Math.random() * width;
        const y = Math.random() * height;
        
        // Random size based on intensity
        const size = Math.random() * intensity + 2;
        
        // Random color
        const hue = (time * 50 + i * 30) % 360;
        ctx.fillStyle = `hsla(${hue}, 100%, 70%, 0.5)`;
        
        // Draw particle
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Reset composite operation and alpha
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1.0;
    }
  };
  
  const applyColorShift = (ctx: CanvasRenderingContext2D, intensity: number, time: number) => {
    if (intensity === 0) return;
    
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    // Create a copy of the current canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;
    
    // Draw the current state to the temp canvas
    tempCtx.drawImage(ctx.canvas, 0, 0);
    
    // Get image data for pixel manipulation
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Apply color shift effect
    for (let i = 0; i < data.length; i += 4) {
      // Calculate color shift amount based on intensity and time
      const redShift = Math.sin(time * 2) * intensity * 20;
      const greenShift = Math.sin(time * 1.5 + Math.PI / 3) * intensity * 20;
      const blueShift = Math.sin(time * 1 + Math.PI * 2/3) * intensity * 20;
      
      // Apply color shifts
      data[i] = Math.max(0, Math.min(255, data[i] + redShift));       // R
      data[i+1] = Math.max(0, Math.min(255, data[i+1] + greenShift)); // G
      data[i+2] = Math.max(0, Math.min(255, data[i+2] + blueShift));  // B
    }
    
    // Apply the modified image data
    ctx.putImageData(imageData, 0, 0);
    
    // Add color overlay for high intensity
    if (intensity > 7) {
      // Set up overlay drawing
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = 0.2;
      
      // Create gradient based on time
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, `hsla(${(time * 30) % 360}, 100%, 50%, 0.3)`);
      gradient.addColorStop(1, `hsla(${(time * 30 + 180) % 360}, 100%, 50%, 0.3)`);
      
      // Apply gradient overlay
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      
      // Reset composite operation and alpha
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1.0;
    }
  };
  
  // Function to handle filter setting changes
  const handleFilterChange = (filter: keyof FilterSettings, value: number) => {
    setFilterSettings(prev => ({
      ...prev,
      [filter]: value
    }));
  };
  
  // Function to handle fluid setting changes
  const handleFluidChange = (setting: keyof FluidSettings, value: number) => {
    setFluidSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };
  
  // Function to download the current canvas state
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Create a download link
    const link = document.createElement('a');
    link.download = 'reRewind-effect.png';
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Function to create and download a GIF
  const handleGifDownload = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Show loading indicator
    const loadingToast = document.createElement('div');
    loadingToast.textContent = 'Creating GIF...';
    loadingToast.className = 'loading-toast';
    document.body.appendChild(loadingToast);
    
    try {
      // Capture frames
      const frameCount = 20; // Number of frames to capture
      
      const renderFrameForGif = (frameIndex: number) => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        // Get canvas dimensions
        const width = canvas.width;
        const height = canvas.height;
        
        // Clear canvas
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, width, height);
        
        if (isImageLoaded && uploadedImage) {
          // Draw the uploaded image
          const imgAspect = uploadedImage.width / uploadedImage.height;
          const canvasAspect = width / height;
          
          let drawWidth, drawHeight, drawX, drawY;
          
          if (imgAspect > canvasAspect) {
            drawWidth = width;
            drawHeight = width / imgAspect;
            drawX = 0;
            drawY = (height - drawHeight) / 2;
          } else {
            drawHeight = height;
            drawWidth = height * imgAspect;
            drawX = (width - drawWidth) / 2;
            drawY = 0;
          }
          
          // Create a temporary canvas for applying effects only to the image area
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = drawWidth;
          tempCanvas.height = drawHeight;
          const tempCtx = tempCanvas.getContext('2d');
          
          if (tempCtx) {
            // Draw the image to the temporary canvas
            tempCtx.drawImage(uploadedImage, 0, 0, drawWidth, drawHeight);
            
            // Apply effects to the temporary canvas (image area only)
            // Use time based on frame index for smooth animation
            const time = frameIndex * 0.2;
            
            // Apply Layer Variation effect (must be first as it creates the layers)
            const layers = filterSettings.layerVariation > 0 ? 
              applyLayerVariation(tempCtx, filterSettings.layerVariation, time) : [];
            
            // Apply Layer Separation (requires layers from Layer Variation)
            const gaps = filterSettings.layerSeparation > 0 && layers.length > 0 ? 
              applyLayerSeparation(tempCtx, filterSettings.layerSeparation, layers) : [];
            
            // Apply Static on Screen
            if (filterSettings.staticOnScreen > 0) {
              applyStatic(tempCtx, filterSettings.staticOnScreen);
            }
            
            // Apply Static on Layer Separation (requires gaps from Layer Separation)
            if (filterSettings.staticOnLayerSeparation > 0 && gaps.length > 0) {
              applyStaticOnLayerSeparation(tempCtx, filterSettings.staticOnLayerSeparation, gaps);
            }
            
            // Apply ZigZag effect
            if (filterSettings.zigZag > 0) {
              applyZigZag(tempCtx, filterSettings.zigZag, time, layers);
            }
            
            // Apply Duplicate Synth
            if (filterSettings.duplicateSynth > 0) {
              applyDuplicateSynth(tempCtx, filterSettings.duplicateSynth, time);
            }
            
            // Apply Liquid Mesh
            if (filterSettings.liquidMesh > 0) {
              applyLiquidMesh(tempCtx, filterSettings.liquidMesh, time);
            }
            
            // Apply Psychedelic
            if (filterSettings.psychedelic > 0) {
              applyPsychedelic(tempCtx, filterSettings.psychedelic, time);
            }
            
            // Apply Brightness
            if (filterSettings.brightness > 0) {
              applyBrightness(tempCtx, filterSettings.brightness);
            }
            
            // Apply Fibonacci
            if (filterSettings.fibonacci > 0) {
              applyFibonacci(tempCtx, filterSettings.fibonacci, time);
            }
            
            // Apply VHS Color Grade
            if (filterSettings.vhsColorGrade > 0) {
              applyVHSColorGrade(tempCtx, filterSettings.vhsColorGrade);
            }
            
            // Apply Fluid Animation
            if (fluidSettings.flowSpeed > 0) {
              applyFluidAnimation(tempCtx, fluidSettings.flowSpeed, time);
            }
            
            // Apply additional fluid effects
            if (fluidSettings.turbulence > 0) {
              applyTurbulence(tempCtx, fluidSettings.turbulence, time);
            }
            
            if (fluidSettings.colorShift > 0) {
              applyColorShift(tempCtx, fluidSettings.colorShift, time);
            }
            
            // Draw the processed image back to the main canvas
            ctx.drawImage(tempCanvas, drawX, drawY);
            
            // Add a subtle border around the image
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1;
            ctx.strokeRect(drawX, drawY, drawWidth, drawHeight);
          }
        } else {
          // Draw default animation
          ctx.fillStyle = '#fff';
          ctx.font = '48px "VT323", monospace';
          ctx.textAlign = 'center';
          ctx.fillText('ReRewind', width/2, 100);
          
          ctx.font = '24px "VT323", monospace';
          ctx.fillText('GIF Export', width/2, 150);
          
          // Draw animated element
          const radius = 100 + Math.sin(frameIndex * 0.3) * 50;
          
          ctx.beginPath();
          ctx.arc(width/2, height/2, radius, 0, Math.PI * 2);
          ctx.fillStyle = `hsl(${frameIndex * 18 % 360}, 70%, 60%)`;
          ctx.fill();
        }
      };
      
      loadingToast.textContent = 'Capturing frames...';
      const frames = await captureFrames(canvas, frameCount, renderFrameForGif);
      
      if (frames.length === 0) {
        throw new Error('Failed to capture frames');
      }
      
      loadingToast.textContent = 'Creating GIF...';
      // Create an animated GIF using our utility
      const gifBlob = await createGifFromFrames(frames, canvas.width, canvas.height, 100);
      
      loadingToast.textContent = 'Downloading GIF...';
      // Download the GIF
      downloadBlob(gifBlob, 'reRewind-animation.gif');
      
      loadingToast.textContent = 'GIF created successfully!';
      setTimeout(() => {
        document.body.removeChild(loadingToast);
      }, 2000);
    } catch (error) {
      console.error('Error creating GIF:', error);
      loadingToast.textContent = 'Error creating GIF. Please try again.';
      setTimeout(() => {
        document.body.removeChild(loadingToast);
      }, 3000);
    }
  };
  
  return (
    <div className="app-container">
      <h1 className="vintage-font">ReRewind</h1>
      
      <div className="editor-container">
        <div className="preview-container">
          <div className="preview-header">
            <h2>Preview window</h2>
            <div>
              <button className="download-btn" onClick={handleDownload}>Download</button>
              <button className="download-gif-btn" onClick={handleGifDownload}>Download GIF</button>
            </div>
          </div>
          
          <div 
            className="canvas-container"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <canvas 
              ref={canvasRef}
              style={{
                width: '100%',
                height: '100%',
                display: 'block'
              }}
            />
            
            {!isImageLoaded && (
              <div className="upload-overlay">
                <p>Drag & drop an image here</p>
                <p>or</p>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileUpload}
                  id="file-upload"
                  style={{ display: 'none' }}
                />
                <label htmlFor="file-upload" className="upload-btn">
                  Select File
                </label>
              </div>
            )}
          </div>
        </div>
        
        <div className="controls-container">
          {/* Layer Effects Controls */}
          <div className="filter-controls">
            <h3>Layer Effects</h3>
            
            <div className="filter-slider">
              <label>Layer Variation: {filterSettings.layerVariation.toFixed(1)}</label>
              <input 
                type="range" 
                min="0" 
                max="10" 
                step="0.1" 
                value={filterSettings.layerVariation}
                onChange={(e) => handleFilterChange('layerVariation', parseFloat(e.target.value))}
              />
            </div>
            
            <div className="filter-slider">
              <label>Layer Separation: {filterSettings.layerSeparation.toFixed(1)}</label>
              <input 
                type="range" 
                min="0" 
                max="10" 
                step="0.1" 
                value={filterSettings.layerSeparation}
                onChange={(e) => handleFilterChange('layerSeparation', parseFloat(e.target.value))}
              />
            </div>
          </div>
          
          {/* Static Effects Controls */}
          <div className="filter-controls">
            <h3>Static Effects</h3>
            
            <div className="filter-slider">
              <label>Static On Screen: {filterSettings.staticOnScreen.toFixed(1)}</label>
              <input 
                type="range" 
                min="0" 
                max="10" 
                step="0.1" 
                value={filterSettings.staticOnScreen}
                onChange={(e) => handleFilterChange('staticOnScreen', parseFloat(e.target.value))}
              />
            </div>
            
            <div className="filter-slider">
              <label>Static On Layer Separation: {filterSettings.staticOnLayerSeparation.toFixed(1)}</label>
              <input 
                type="range" 
                min="0" 
                max="10" 
                step="0.1" 
                value={filterSettings.staticOnLayerSeparation}
                onChange={(e) => handleFilterChange('staticOnLayerSeparation', parseFloat(e.target.value))}
              />
            </div>
          </div>
          
          {/* Distortion Effects Controls */}
          <div className="filter-controls">
            <h3>Distortion Effects</h3>
            
            <div className="filter-slider">
              <label>ZigZag Effect: {filterSettings.zigZag.toFixed(1)}</label>
              <input 
                type="range" 
                min="0" 
                max="10" 
                step="0.1" 
                value={filterSettings.zigZag}
                onChange={(e) => handleFilterChange('zigZag', parseFloat(e.target.value))}
              />
            </div>
            
            <div className="filter-slider">
              <label>Duplicate Synth: {filterSettings.duplicateSynth.toFixed(1)}</label>
              <input 
                type="range" 
                min="0" 
                max="10" 
                step="0.1" 
                value={filterSettings.duplicateSynth}
                onChange={(e) => handleFilterChange('duplicateSynth', parseFloat(e.target.value))}
              />
            </div>
          </div>
          
          {/* Fluid Effects Controls */}
          <div className="filter-controls">
            <h3>Fluid Effects</h3>
            
            <div className="filter-slider">
              <label>Liquid Mesh: {filterSettings.liquidMesh.toFixed(1)}</label>
              <input 
                type="range" 
                min="0" 
                max="10" 
                step="0.1" 
                value={filterSettings.liquidMesh}
                onChange={(e) => handleFilterChange('liquidMesh', parseFloat(e.target.value))}
              />
            </div>
            
            <div className="filter-slider">
              <label>Flow Speed: {fluidSettings.flowSpeed.toFixed(1)}</label>
              <input 
                type="range" 
                min="0" 
                max="10" 
                step="0.1" 
                value={fluidSettings.flowSpeed}
                onChange={(e) => handleFluidChange('flowSpeed', parseFloat(e.target.value))}
              />
            </div>
            
            <div className="filter-slider">
              <label>Turbulence: {fluidSettings.turbulence.toFixed(1)}</label>
              <input 
                type="range" 
                min="0" 
                max="10" 
                step="0.1" 
                value={fluidSettings.turbulence}
                onChange={(e) => handleFluidChange('turbulence', parseFloat(e.target.value))}
              />
            </div>
            
            <div className="filter-slider">
              <label>Color Shift: {fluidSettings.colorShift.toFixed(1)}</label>
              <input 
                type="range" 
                min="0" 
                max="10" 
                step="0.1" 
                value={fluidSettings.colorShift}
                onChange={(e) => handleFluidChange('colorShift', parseFloat(e.target.value))}
              />
            </div>
          </div>
          
          {/* Visual Effects Controls */}
          <div className="filter-controls">
            <h3>Visual Effects</h3>
            
            <div className="filter-slider">
              <label>Psychedelic: {filterSettings.psychedelic.toFixed(1)}</label>
              <input 
                type="range" 
                min="0" 
                max="10" 
                step="0.1" 
                value={filterSettings.psychedelic}
                onChange={(e) => handleFilterChange('psychedelic', parseFloat(e.target.value))}
              />
            </div>
            
            <div className="filter-slider">
              <label>Brightness: {filterSettings.brightness.toFixed(1)}</label>
              <input 
                type="range" 
                min="0" 
                max="10" 
                step="0.1" 
                value={filterSettings.brightness}
                onChange={(e) => handleFilterChange('brightness', parseFloat(e.target.value))}
              />
            </div>
            
            <div className="filter-slider">
              <label>Fibonacci: {filterSettings.fibonacci.toFixed(1)}</label>
              <input 
                type="range" 
                min="0" 
                max="10" 
                step="0.1" 
                value={filterSettings.fibonacci}
                onChange={(e) => handleFilterChange('fibonacci', parseFloat(e.target.value))}
              />
            </div>
            
            <div className="filter-slider">
              <label>VHS Color Grade: {filterSettings.vhsColorGrade.toFixed(1)}</label>
              <input 
                type="range" 
                min="0" 
                max="10" 
                step="0.1" 
                value={filterSettings.vhsColorGrade}
                onChange={(e) => handleFilterChange('vhsColorGrade', parseFloat(e.target.value))}
              />
            </div>
          </div>
          
          {/* Animation Controls */}
          <div className="filter-controls">
            <h3>Animation</h3>
            
            <div className="filter-slider">
              <label>Animation Speed: {animationSpeed.toFixed(1)}</label>
              <input 
                type="range" 
                min="0.1" 
                max="5" 
                step="0.1" 
                value={animationSpeed}
                onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
              />
            </div>
            
            <div className="animation-buttons">
              <button 
                className={`animation-btn ${isAnimating ? 'active' : ''}`}
                onClick={() => setIsAnimating(true)}
              >
                Animate 5s
              </button>
              <button 
                className="animation-btn"
                onClick={() => {
                  setAnimationSpeed(2.0);
                  setIsAnimating(true);
                }}
              >
                Animate 10s
              </button>
            </div>
            
            <div className="toggle-container">
              <label>
                <input 
                  type="checkbox" 
                  checked={isAnimating} 
                  onChange={() => setIsAnimating(!isAnimating)} 
                />
                Animation Enabled
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;// Add a small comment to demonstrate commit conventions
