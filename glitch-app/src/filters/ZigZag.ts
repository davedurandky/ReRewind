import { createBlurredBackground } from './utils';

export const ZigZag = (
  ctx: CanvasRenderingContext2D,
  { width, height }: { width: number; height: number },
  intensity: number = 0.5,
  time: number = 0
) => {
  // Performance optimization for large canvases
  const useScaling = width > 800 || height > 800;
  let scale = 1;
  
  if (useScaling) {
    scale = 0.5;
    ctx.save();
    ctx.scale(scale, scale);
    width /= scale;
    height /= scale;
  }

  try {
    // Get the image data
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Apply a blurred background to prevent white edges
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    
    if (!tempCtx) {
      console.error('Failed to get temporary context');
      return;
    }
    
    // Draw the current state to the temp canvas
    tempCtx.drawImage(ctx.canvas, 0, 0, width, height);
    
    // Scale down intensity to make effect more subtle
    const actualIntensity = intensity * 0.6; // Reduce overall intensity
    
    // Calculate wave properties - more subtle by default
    const waveAmplitude = Math.min(15, Math.max(1, 30 * actualIntensity)); // Max amplitude of 15 pixels
    const waveFrequency = Math.min(0.1, Math.max(0.01, 0.2 * actualIntensity)); // Lower frequency for smoother waves
    const timeScale = Math.min(3, Math.max(0.5, 5 * actualIntensity)); // Time scale affects how fast waves move
    
    // Get real time or use the provided time
    const currentTime = time || performance.now() / 1000;
    const scaledTime = currentTime * timeScale;
    
    // Main pixel manipulation
    const destData = new Uint8ClampedArray(data.length);
    
    // Copy data to destination first
    destData.set(data);
    
    // Adjust rows of pixels
    for (let y = 0; y < height; y++) {
      // Calculate horizontal offset for this row
      const horizontalOffset = Math.sin(y * waveFrequency + scaledTime) * waveAmplitude;
      
      // Add some complex movement with a secondary wave
      const secondaryOffset = Math.cos(y * waveFrequency * 0.7 + scaledTime * 0.8) * waveAmplitude * 0.3;
      
      // Combine offsets
      const totalOffset = Math.round(horizontalOffset + secondaryOffset);
      
      // Occasional larger glitches - reduce frequency and intensity
      let glitchOffset = 0;
      if (actualIntensity > 0.4 && Math.random() < 0.01 * actualIntensity) {
        glitchOffset = Math.round((Math.random() - 0.5) * waveAmplitude * 4);
      }
      
      for (let x = 0; x < width; x++) {
        // Calculate source position with offset
        let srcX = x - totalOffset - glitchOffset;
        
        // Wrap around horizontally if needed
        if (srcX < 0) srcX += width;
        if (srcX >= width) srcX -= width;
        
        // Copy pixel data from source to destination
        const destIndex = (y * width + x) * 4;
        const srcIndex = (y * width + srcX) * 4;
        
        // Copy RGBA values
        destData[destIndex] = data[srcIndex];
        destData[destIndex + 1] = data[srcIndex + 1];
        destData[destIndex + 2] = data[srcIndex + 2];
        destData[destIndex + 3] = data[srcIndex + 3];
      }
    }
    
    // Create new ImageData and put it back on the canvas
    const newImageData = new ImageData(destData, width, height);
    ctx.putImageData(newImageData, 0, 0);
    
    // Occasional distortion - reduce frequency and intensity
    if (actualIntensity > 0.3 && Math.random() < 0.005 * actualIntensity) {
      // Small horizontal slice displacement
      const sliceY = Math.floor(Math.random() * height);
      const sliceHeight = Math.floor(Math.random() * 10) + 1;
      const sliceOffset = Math.floor((Math.random() - 0.5) * 20 * actualIntensity);
      
      // Get slice data
      const sliceData = ctx.getImageData(0, sliceY, width, sliceHeight);
      
      // Clear the slice area
      ctx.fillStyle = 'rgba(0,0,0,0)';
      ctx.fillRect(0, sliceY, width, sliceHeight);
      
      // Put the slice back with offset
      ctx.putImageData(sliceData, sliceOffset, sliceY);
    }
    
  } catch (error) {
    console.error('Error in ZigZag filter:', error);
  }
  
  // Restore original scale
  if (useScaling) {
    ctx.restore();
  }
};

export default ZigZag; 