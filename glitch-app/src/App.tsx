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

interface Preset {
  name: string;
  filterSettings: FilterSettings;
  fluidSettings: FluidSettings;
  animationSpeed: number;
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isAnimating, setIsAnimating] = useState(true);
  const [uploadedImage, setUploadedImage] = useState<HTMLImageElement | null>(null);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [frameCount, setFrameCount] = useState(0);
  
  // Animation control states
  const [animationDuration, setAnimationDuration] = useState<number>(0); // 0 = infinite, 5 = 5s, 10 = 10s
  const [animationStartTime, setAnimationStartTime] = useState<number>(0);
  const [animationProgress, setAnimationProgress] = useState<number>(0); // 0-100%
  
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
  
  // Export settings
  const [exportQuality, setExportQuality] = useState<'original' | 'high' | 'medium' | 'small'>('high');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [exportDuration, setExportDuration] = useState<number>(5);
  const [exportFormat, setExportFormat] = useState<'image' | 'gif' | 'video'>('image');
  
  const [presets, setPresets] = useState<Preset[]>([]);
  const [showPresetDialog, setShowPresetDialog] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  
  // Define all effect functions first
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
  
  const applyDuplicateSynth = (ctx: CanvasRenderingContext2D, intensity: number, time: number) => {
    if (intensity === 0) return;
    
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    // Calculate center points
    const centerX = width / 2;
    const centerY = height / 2;
    
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
      
      // Draw the duplicate with translation
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(i * Math.PI * 2 / numDuplicates);
      ctx.translate(-centerX, -centerY);
      ctx.drawImage(tempCanvas, offsetX, offsetY);
      ctx.restore();
    }
    
    // Reset composite operation, alpha, and filter
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1.0;
    ctx.filter = 'none';
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
    
    // Create a temporary canvas for the effect
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;
    
    // Copy current canvas state
    tempCtx.drawImage(ctx.canvas, 0, 0);
    
    // Calculate center point
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Generate Fibonacci sequence
    const fibonacci = [1, 1];
    for (let i = 2; i < 12; i++) {
      fibonacci[i] = fibonacci[i-1] + fibonacci[i-2];
    }
    
    // Calculate max radius based on canvas size and intensity
    const maxRadius = Math.min(width, height) * 0.4 * (intensity / 10);
    
    // Normalize sequence to fit within maxRadius
    const scale = maxRadius / fibonacci[fibonacci.length - 1];
    
    // Set up drawing style
    ctx.lineWidth = 2;
    ctx.strokeStyle = `rgba(255, 255, 255, ${intensity / 10})`;
    
    // Create multiple rotating spirals
    for (let s = 0; s < 3; s++) {
      ctx.beginPath();
      
      // Rotate based on time
      const rotation = time * (0.2 + s * 0.1) + (s * Math.PI * 2 / 3);
      
      let angle = rotation;
      let x = centerX;
      let y = centerY;
      
      // Draw spiral segments
      for (let i = 0; i < fibonacci.length - 1; i++) {
        const radius = fibonacci[i] * scale;
        const nextRadius = fibonacci[i+1] * scale;
        
        // Calculate control points for smooth curve
        const startAngle = angle;
        const endAngle = angle + Math.PI / 2;
        
        // Draw curved segment
        ctx.beginPath();
        ctx.arc(x, y, radius, startAngle, endAngle, false);
        
        // Add glow effect
        ctx.shadowColor = `hsla(${(time * 50 + s * 120) % 360}, 70%, 60%, 0.5)`;
        ctx.shadowBlur = 10;
        ctx.stroke();
        
        // Update position for next segment
        angle = endAngle;
        x = centerX + Math.cos(angle) * nextRadius;
        y = centerY + Math.sin(angle) * nextRadius;
        
        // Add connecting lines between spirals
        if (s > 0 && i % 2 === 0) {
          ctx.globalCompositeOperation = 'screen';
          ctx.beginPath();
          ctx.moveTo(x, y);
          const angle2 = rotation + (s * Math.PI * 2 / 3);
          const x2 = centerX + Math.cos(angle2) * radius;
          const y2 = centerY + Math.sin(angle2) * radius;
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = `hsla(${(time * 50 + i * 30) % 360}, 70%, 60%, 0.3)`;
          ctx.stroke();
        }
      }
    }
    
    // Reset composite operation and shadow
    ctx.globalCompositeOperation = 'source-over';
    ctx.shadowBlur = 0;
    
    // Add particle effects
    if (intensity > 3) {
      ctx.globalCompositeOperation = 'screen';
      for (let i = 0; i < intensity * 5; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * maxRadius;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${(time * 50 + i * 30) % 360}, 70%, 60%, 0.5)`;
        ctx.fill();
      }
    }
    
    // Blend with original image
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.7;
    ctx.drawImage(tempCanvas, 0, 0);
    
    // Reset composite operation and alpha
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1.0;
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
  
  // Add missing effect functions before applyEffects
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
    
    // Calculate center point
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Draw the original image
    ctx.drawImage(tempCanvas, 0, 0);
    
    // Set blending mode
    ctx.globalCompositeOperation = 'screen';
    
    // Number of layers based on intensity
    const numLayers = Math.floor(intensity / 2) + 1;
    
    for (let i = 0; i < numLayers; i++) {
      const angle = (time + i) * 0.5;
      const scale = 1 + Math.sin(time * 0.5) * 0.1;
      const hue = (time * 50 + i * 60) % 360;
      
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle);
      ctx.scale(scale, scale);
      ctx.translate(-centerX, -centerY);
      
      ctx.globalAlpha = 0.3;
      ctx.filter = `hue-rotate(${hue}deg)`;
      ctx.drawImage(tempCanvas, 0, 0);
      
      ctx.restore();
    }
    
    // Reset composite operation and alpha
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1.0;
    ctx.filter = 'none';
  };

  const applyVHSColorGrade = (ctx: CanvasRenderingContext2D, intensity: number) => {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    // Get image data for pixel manipulation
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Apply VHS color grading
    for (let i = 0; i < data.length; i += 4) {
      // Increase red channel
      data[i] = Math.min(255, data[i] + intensity * 15);
      
      // Decrease blue channel
      data[i + 2] = Math.max(0, data[i + 2] - intensity * 8);
      
      // Add green tint to shadows
      if (data[i] < 128) {
        data[i + 1] = Math.min(255, data[i + 1] + intensity * 5);
      }
    }
    
    // Apply the modified image data
    ctx.putImageData(imageData, 0, 0);
    
    // Add scan lines
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.2 * (intensity / 10);
    
    for (let y = 0; y < height; y += 2) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, y, width, 1);
    }
    
    // Reset composite operation and alpha
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1.0;
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
    
    // Create fluid-like distortion
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const distX = Math.sin(y * 0.05 + time) * intensity * 2;
        const distY = Math.cos(x * 0.05 + time * 0.8) * intensity * 2;
        
        const sourceX = Math.floor(x + distX);
        const sourceY = Math.floor(y + distY);
        
        if (sourceX >= 0 && sourceX < width && sourceY >= 0 && sourceY < height) {
          const targetIdx = (y * width + x) * 4;
          const sourceIdx = (sourceY * width + sourceX) * 4;
          
          data[targetIdx] = tempData[sourceIdx];
          data[targetIdx + 1] = tempData[sourceIdx + 1];
          data[targetIdx + 2] = tempData[sourceIdx + 2];
          data[targetIdx + 3] = tempData[sourceIdx + 3];
        }
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
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
    if (!canvas || !uploadedImage) return;
    
    setIsExporting(true);
    setExportProgress(0);
    
    const loadingToast = document.createElement('div');
    loadingToast.textContent = 'Preparing image...';
    loadingToast.className = 'loading-toast';
    document.body.appendChild(loadingToast);
    
    setTimeout(() => {
      try {
        // Create a new canvas for the export
        const exportCanvas = document.createElement('canvas');
        let exportWidth = uploadedImage.width;
        let exportHeight = uploadedImage.height;
        
        // Adjust dimensions based on quality setting while maintaining aspect ratio
        const aspectRatio = uploadedImage.width / uploadedImage.height;
        
        switch (exportQuality) {
          case 'original':
            // Use original dimensions
            break;
          case 'high':
            if (exportWidth > 1920 || exportHeight > 1080) {
              if (aspectRatio > 1920/1080) {
                exportWidth = 1920;
                exportHeight = Math.round(1920 / aspectRatio);
              } else {
                exportHeight = 1080;
                exportWidth = Math.round(1080 * aspectRatio);
              }
            }
            break;
          case 'medium':
            if (exportWidth > 1280 || exportHeight > 720) {
              if (aspectRatio > 1280/720) {
                exportWidth = 1280;
                exportHeight = Math.round(1280 / aspectRatio);
              } else {
                exportHeight = 720;
                exportWidth = Math.round(720 * aspectRatio);
              }
            }
            break;
          case 'small':
            if (exportWidth > 854 || exportHeight > 480) {
              if (aspectRatio > 854/480) {
                exportWidth = 854;
                exportHeight = Math.round(854 / aspectRatio);
              } else {
                exportHeight = 480;
                exportWidth = Math.round(480 * aspectRatio);
              }
            }
            break;
        }
        
        // Set export canvas dimensions
        exportCanvas.width = exportWidth;
        exportCanvas.height = exportHeight;
        
        const exportCtx = exportCanvas.getContext('2d');
        if (!exportCtx) {
          throw new Error('Could not get export canvas context');
        }
        
        // First draw the original image
        exportCtx.drawImage(uploadedImage, 0, 0, exportWidth, exportHeight);
        
        // Apply effects with halved intensity
        const halfIntensityFilters = {
          ...filterSettings,
          layerVariation: filterSettings.layerVariation * 0.5,
          layerSeparation: filterSettings.layerSeparation * 0.5,
          staticOnScreen: filterSettings.staticOnScreen * 0.5,
          staticOnLayerSeparation: filterSettings.staticOnLayerSeparation * 0.5,
          zigZag: filterSettings.zigZag * 0.5,
          duplicateSynth: filterSettings.duplicateSynth * 0.5,
          liquidMesh: filterSettings.liquidMesh * 0.5,
          psychedelic: filterSettings.psychedelic * 0.5,
          brightness: filterSettings.brightness * 0.5,
          fibonacci: filterSettings.fibonacci * 0.5,
          vhsColorGrade: filterSettings.vhsColorGrade * 0.5
        };
        
        const halfIntensityFluid = {
          ...fluidSettings,
          flowSpeed: fluidSettings.flowSpeed * 0.5,
          turbulence: fluidSettings.turbulence * 0.5,
          colorShift: fluidSettings.colorShift * 0.5
        };
        
        // Apply effects
        applyEffects(exportCtx, frameCount, halfIntensityFilters, halfIntensityFluid, performance.now() / 1000);
        
        setExportProgress(50);
        loadingToast.textContent = 'Processing image...';
        
        setTimeout(() => {
          const link = document.createElement('a');
          link.download = `reRewind-effect-${exportQuality}.png`;
          link.href = exportCanvas.toDataURL('image/png');
          
          setExportProgress(90);
          loadingToast.textContent = 'Downloading image...';
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          setExportProgress(100);
          loadingToast.textContent = 'Image downloaded successfully!';
          
          setTimeout(() => {
            document.body.removeChild(loadingToast);
            setIsExporting(false);
            setExportProgress(0);
          }, 2000);
        }, 100);
      } catch (error) {
        console.error('Error exporting image:', error);
        loadingToast.textContent = 'Error exporting image. Please try again.';
        
        setTimeout(() => {
          document.body.removeChild(loadingToast);
          setIsExporting(false);
          setExportProgress(0);
        }, 3000);
      }
    }, 100);
  };
  
  // Function to create and download a GIF
  const handleGifDownload = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !uploadedImage) return;
    
    setIsExporting(true);
    setExportProgress(0);
    
    const loadingToast = document.createElement('div');
    loadingToast.textContent = 'Creating GIF...';
    loadingToast.className = 'loading-toast';
    document.body.appendChild(loadingToast);
    
    try {
      // Calculate dimensions while maintaining aspect ratio
      const aspectRatio = uploadedImage.width / uploadedImage.height;
      let gifWidth = uploadedImage.width;
      let gifHeight = uploadedImage.height;
      
      switch (exportQuality) {
        case 'original':
          break;
        case 'high':
          if (gifWidth > 1280 || gifHeight > 720) {
            if (aspectRatio > 1280/720) {
              gifWidth = 1280;
              gifHeight = Math.round(1280 / aspectRatio);
            } else {
              gifHeight = 720;
              gifWidth = Math.round(720 * aspectRatio);
            }
          }
          break;
        case 'medium':
          if (gifWidth > 854 || gifHeight > 480) {
            if (aspectRatio > 854/480) {
              gifWidth = 854;
              gifHeight = Math.round(854 / aspectRatio);
            } else {
              gifHeight = 480;
              gifWidth = Math.round(480 * aspectRatio);
            }
          }
          break;
        case 'small':
          if (gifWidth > 640 || gifHeight > 360) {
            if (aspectRatio > 640/360) {
              gifWidth = 640;
              gifHeight = Math.round(640 / aspectRatio);
            } else {
              gifHeight = 360;
              gifWidth = Math.round(360 * aspectRatio);
            }
          }
          break;
      }
      
      // Create a temporary canvas for the GIF frames
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = gifWidth;
      tempCanvas.height = gifHeight;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) throw new Error('Could not get temporary canvas context');
      
      // Calculate frame parameters
      const baseFrameCount = Math.floor(30 * exportDuration); // 30fps
      const frameCount = Math.max(10, Math.floor(baseFrameCount * animationSpeed));
      const frameDelay = Math.floor(100 / animationSpeed);
      
      loadingToast.textContent = 'Capturing frames...';
      
      // Create frames with proper aspect ratio
      const frames = await captureFrames(canvas, Math.floor(30 * exportDuration), (frameIndex: number) => {
        setExportProgress(Math.floor((frameIndex / (30 * exportDuration)) * 50));
      });
      
      if (frames.length === 0) {
        throw new Error('Failed to capture frames');
      }
      
      loadingToast.textContent = 'Creating GIF...';
      const gifBlob = await createGifFromFrames(frames, gifWidth, gifHeight, frameDelay);
      
      setExportProgress(90);
      loadingToast.textContent = 'Downloading GIF...';
      downloadBlob(gifBlob, `reRewind-animation-${exportQuality}.gif`);
      
      setExportProgress(100);
      loadingToast.textContent = 'GIF created successfully!';
      
      setTimeout(() => {
        document.body.removeChild(loadingToast);
        setIsExporting(false);
        setExportProgress(0);
      }, 2000);
    } catch (error) {
      console.error('Error creating GIF:', error);
      loadingToast.textContent = 'Error creating GIF. Please try again.';
      
      setTimeout(() => {
        document.body.removeChild(loadingToast);
        setIsExporting(false);
        setExportProgress(0);
      }, 3000);
    }
  };
  
  // Function to start a timed animation
  const startTimedAnimation = (duration: number) => {
    setAnimationDuration(duration);
    setAnimationStartTime(performance.now());
    setIsAnimating(true);
  };
  
  // Function to create and download a video
  const handleVideoDownload = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !uploadedImage) return;
    
    setIsExporting(true);
    setExportProgress(0);
    
    const loadingToast = document.createElement('div');
    loadingToast.textContent = 'Creating video...';
    loadingToast.className = 'loading-toast';
    document.body.appendChild(loadingToast);
    
    try {
      // Calculate dimensions while maintaining aspect ratio
      const aspectRatio = uploadedImage.width / uploadedImage.height;
      let videoWidth = uploadedImage.width;
      let videoHeight = uploadedImage.height;
      
      switch (exportQuality) {
        case 'original':
          break;
        case 'high':
          if (videoWidth > 1920 || videoHeight > 1080) {
            if (aspectRatio > 1920/1080) {
              videoWidth = 1920;
              videoHeight = Math.round(1920 / aspectRatio);
            } else {
              videoHeight = 1080;
              videoWidth = Math.round(1080 * aspectRatio);
            }
          }
          break;
        case 'medium':
          if (videoWidth > 1280 || videoHeight > 720) {
            if (aspectRatio > 1280/720) {
              videoWidth = 1280;
              videoHeight = Math.round(1280 / aspectRatio);
            } else {
              videoHeight = 720;
              videoWidth = Math.round(720 * aspectRatio);
            }
          }
          break;
        case 'small':
          if (videoWidth > 854 || videoHeight > 480) {
            if (aspectRatio > 854/480) {
              videoWidth = 854;
              videoHeight = Math.round(854 / aspectRatio);
            } else {
              videoHeight = 480;
              videoWidth = Math.round(480 * aspectRatio);
            }
          }
          break;
      }
      
      // Create a canvas for recording with correct dimensions
      const recordCanvas = document.createElement('canvas');
      recordCanvas.width = videoWidth;
      recordCanvas.height = videoHeight;
      const recordCtx = recordCanvas.getContext('2d');
      if (!recordCtx) throw new Error('Could not get recording canvas context');
      
      // Create MediaRecorder
      const stream = recordCanvas.captureStream(30);
      
      // Try different MIME types
      const mimeTypes = [
        'video/mp4;codecs=avc1.42E01E',
        'video/mp4',
        'video/webm;codecs=h264',
        'video/webm'
      ];
      
      let selectedMimeType = '';
      for (const type of mimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          selectedMimeType = type;
          break;
        }
      }
      
      if (!selectedMimeType) {
        throw new Error('No supported video format found');
      }
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType,
        videoBitsPerSecond: 5000000
      });
      
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: selectedMimeType.split(';')[0] });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reRewind-animation-${exportQuality}-${exportDuration}s.mp4`;
        a.click();
        URL.revokeObjectURL(url);
        
        loadingToast.textContent = 'Video created successfully!';
        setTimeout(() => {
          document.body.removeChild(loadingToast);
          setIsExporting(false);
          setExportProgress(0);
        }, 2000);
      };
      
      // Start recording
      mediaRecorder.start();
      
      // Animation loop for recording
      const startTime = performance.now();
      const animate = () => {
        const progress = (performance.now() - startTime) / (exportDuration * 1000);
        setExportProgress(Math.min(100, Math.round(progress * 100)));
        
        // Draw frame
        recordCtx.drawImage(uploadedImage, 0, 0, videoWidth, videoHeight);
        applyEffects(recordCtx, frameCount, filterSettings, fluidSettings, performance.now() / 1000);
        
        if (progress >= 1) {
          mediaRecorder.stop();
        } else {
          requestAnimationFrame(animate);
        }
      };
      
      animate();
      
    } catch (error) {
      console.error('Error creating video:', error);
      loadingToast.textContent = 'Error creating video. Please try again.';
      setTimeout(() => {
        document.body.removeChild(loadingToast);
        setIsExporting(false);
        setExportProgress(0);
      }, 3000);
    }
  };

  // Now define applyEffects after all the individual effect functions
  const applyEffects = (ctx: CanvasRenderingContext2D, currentFrame: number, filters: FilterSettings, fluid: FluidSettings, time: number) => {
    const seconds = time % 60;
    
    const layers = filters.layerVariation > 0 ? 
      applyLayerVariation(ctx, filters.layerVariation, seconds) : [];
    
    const gaps = filters.layerSeparation > 0 && layers.length > 0 ? 
      applyLayerSeparation(ctx, filters.layerSeparation, layers) : [];
    
    if (filters.staticOnScreen > 0) {
      applyStatic(ctx, filters.staticOnScreen);
    }
    
    if (filters.staticOnLayerSeparation > 0 && gaps.length > 0) {
      applyStaticOnLayerSeparation(ctx, filters.staticOnLayerSeparation, gaps);
    }
    
    if (filters.zigZag > 0) {
      applyZigZag(ctx, filters.zigZag, seconds, layers);
    }
    
    if (filters.duplicateSynth > 0) {
      applyDuplicateSynth(ctx, filters.duplicateSynth, seconds);
    }
    
    if (filters.liquidMesh > 0) {
      applyLiquidMesh(ctx, filters.liquidMesh, seconds);
    }
    
    if (filters.psychedelic > 0) {
      applyPsychedelic(ctx, filters.psychedelic, seconds);
    }
    
    if (filters.brightness > 0) {
      applyBrightness(ctx, filters.brightness);
    }
    
    if (filters.fibonacci > 0) {
      applyFibonacci(ctx, filters.fibonacci, seconds);
    }
    
    if (filters.vhsColorGrade > 0) {
      applyVHSColorGrade(ctx, filters.vhsColorGrade);
    }
    
    if (fluid.flowSpeed > 0) {
      applyFluidAnimation(ctx, fluid.flowSpeed, seconds);
    }
    
    if (fluid.turbulence > 0) {
      applyTurbulence(ctx, fluid.turbulence, seconds);
    }
    
    if (fluid.colorShift > 0) {
      applyColorShift(ctx, fluid.colorShift, seconds);
    }
  };

  // Add useEffect for canvas setup and animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set initial canvas size
    const updateCanvasSize = () => {
      const container = canvas.parentElement;
      if (!container) return;
      
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    // Animation frame handler
    let animationFrameId: number;
    const render = (timestamp: number) => {
      if (!isAnimating) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw uploaded image if available
      if (uploadedImage) {
        // Calculate dimensions to maintain aspect ratio
        const scale = Math.min(
          canvas.width / uploadedImage.width,
          canvas.height / uploadedImage.height
        );
        const width = uploadedImage.width * scale;
        const height = uploadedImage.height * scale;
        const x = (canvas.width - width) / 2;
        const y = (canvas.height - height) / 2;

        // Draw image
        ctx.drawImage(uploadedImage, x, y, width, height);

        // Apply effects
        applyEffects(ctx, frameCount, filterSettings, fluidSettings, timestamp / 1000);
      }

      setFrameCount(prev => prev + 1);
      animationFrameId = requestAnimationFrame(render);
    };

    if (isAnimating) {
      animationFrameId = requestAnimationFrame(render);
    }

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isAnimating, uploadedImage, filterSettings, fluidSettings, frameCount]);

  // Update file handling functions
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
      setUploadedImage(img);
      setIsImageLoaded(true);
      // Reset frame count when loading new image
      setFrameCount(0);
    };
    img.onerror = () => {
      console.error('Error loading image');
      alert('Error loading image. Please try another file.');
    };
    img.src = URL.createObjectURL(file);
  };
  
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    
    const file = event.dataTransfer.files[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
      setUploadedImage(img);
      setIsImageLoaded(true);
      // Reset frame count when loading new image
      setFrameCount(0);
    };
    img.onerror = () => {
      console.error('Error loading image');
      alert('Error loading image. Please try another file.');
    };
    img.src = URL.createObjectURL(file);
  };
  
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'copy';
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.remove('drag-over');
  };

  // Add function to save preset
  const handleSavePreset = () => {
    if (!newPresetName.trim()) return;
    
    const newPreset: Preset = {
      name: newPresetName,
      filterSettings,
      fluidSettings,
      animationSpeed
    };
    
    setPresets([...presets, newPreset]);
    setNewPresetName('');
    setShowPresetDialog(false);
  };

  // Add function to load preset
  const handleLoadPreset = (preset: Preset) => {
    setFilterSettings(preset.filterSettings);
    setFluidSettings(preset.fluidSettings);
    setAnimationSpeed(preset.animationSpeed);
  };

  return (
    <div className="app-container">
      <h1 className="vintage-font">ReRewind</h1>
      
      <div className="editor-container">
        <div className="preview-container">
          <div className="preview-header">
            <h2>Preview window</h2>
            <div className="export-controls">
              <select 
                className="quality-select"
                value={exportQuality}
                onChange={(e) => setExportQuality(e.target.value as 'original' | 'high' | 'medium' | 'small')}
                disabled={isExporting}
              >
                <option value="original">Original Quality</option>
                <option value="high">High Quality</option>
                <option value="medium">Medium Quality</option>
                <option value="small">Small Size</option>
              </select>
              
              <select
                className="format-select"
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as 'image' | 'gif' | 'video')}
                disabled={isExporting}
              >
                <option value="image">Static Image</option>
                <option value="gif">Animated GIF</option>
                <option value="video">Video</option>
              </select>
              
              {exportFormat !== 'image' && (
                <div className="duration-control">
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={exportDuration}
                    onChange={(e) => setExportDuration(Math.max(1, Math.min(30, parseInt(e.target.value) || 1)))}
                    disabled={isExporting}
                  /> s
              </div>
              )}
              
              <button 
                className="download-btn" 
                onClick={() => {
                  switch (exportFormat) {
                    case 'image':
                      handleDownload();
                      break;
                    case 'gif':
                      handleGifDownload();
                      break;
                    case 'video':
                      handleVideoDownload();
                      break;
                  }
                }}
                disabled={isExporting}
              >
                {isExporting ? 'Exporting...' : `Export ${exportFormat}`}
              </button>
            </div>
          </div>
          
          {isExporting && (
            <div className="export-progress-overlay">
              <div className="export-progress-container">
                <div className="export-progress-bar">
                  <div 
                    className="export-progress-fill" 
                    style={{ width: `${exportProgress}%` }}
                  ></div>
                </div>
                <div className="export-progress-text">
                  Exporting: {exportProgress}%
                </div>
              </div>
              </div>
            )}
            
          <div 
            className="canvas-container"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
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
              <label>Animation Speed: {(animationSpeed * 0.5).toFixed(1)}x</label>
              <input 
                type="range" 
                min="0.2" 
                max="2.0" 
                step="0.1" 
                value={animationSpeed}
                onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
              />
            </div>
            
            <div className="animation-buttons">
              <button 
                className={`animation-btn ${isAnimating && animationDuration === 5 ? 'active' : ''}`}
                onClick={() => startTimedAnimation(5)}
              >
                Animate 5s
              </button>
              <button 
                className={`animation-btn ${isAnimating && animationDuration === 10 ? 'active' : ''}`}
                onClick={() => startTimedAnimation(10)}
              >
                Animate 10s
              </button>
            </div>
            
            {animationDuration > 0 && isAnimating && (
              <div className="animation-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${animationProgress}%` }}
                  ></div>
                </div>
                <div className="progress-text">
                  {Math.round(animationProgress)}% - {(animationDuration * (animationProgress / 100)).toFixed(1)}s
                </div>
              </div>
            )}
            
            <div className="toggle-container">
              <label>
                <input 
                  type="checkbox" 
                  checked={isAnimating} 
                  onChange={() => {
                    if (!isAnimating) {
                      // When enabling animation, reset start time
                      setAnimationStartTime(performance.now());
                    }
                    setIsAnimating(!isAnimating);
                  }} 
                />
                Animation Enabled
              </label>
              {animationDuration > 0 && (
                <button 
                  className="reset-btn"
                  onClick={() => setAnimationDuration(0)}
                >
                  ∞ Continuous
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Preset Dialog */}
      {showPresetDialog && (
        <div className="preset-dialog-overlay">
          <div className="preset-dialog">
            <h3>Save Current Settings as Preset</h3>
            <input
              type="text"
              placeholder="Enter preset name"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              className="preset-name-input"
            />
            <div className="preset-dialog-buttons">
              <button 
                className="preset-save-btn"
                onClick={handleSavePreset}
              >
                Save
              </button>
              <button 
                className="preset-cancel-btn"
                onClick={() => {
                  setShowPresetDialog(false);
                  setNewPresetName('');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Presets Section */}
      <div className="filter-controls">
        <div className="presets-header">
          <h3>Presets</h3>
          <button 
            className="save-preset-btn"
            onClick={() => setShowPresetDialog(true)}
          >
            Save Current Settings
          </button>
        </div>
        
        {presets.length > 0 && (
          <div className="presets-list">
            {presets.map((preset, index) => (
              <button
                key={index}
                className="preset-btn"
                onClick={() => handleLoadPreset(preset)}
              >
                {preset.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
