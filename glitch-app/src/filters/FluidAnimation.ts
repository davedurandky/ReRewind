export const FluidAnimation = (
  ctx: CanvasRenderingContext2D, 
  width: number, 
  height: number, 
  flowSpeed: number,
  turbulence: number,
  colorShift: number,
  time?: number
) => {
  if (flowSpeed === 0 && turbulence === 0 && colorShift === 0) return;
  
  // Create a temporary canvas for processing
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d');
  
  if (!tempCtx) return;
  
  // Copy the original image to the temporary canvas
  tempCtx.drawImage(ctx.canvas, 0, 0);
  
  // Get image data for pixel manipulation
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;
  
  // Get source image data for reading original pixels
  const sourceData = tempCtx.getImageData(0, 0, width, height);
  const sourcePixels = sourceData.data;
  
  // Use provided time or current time for animation
  const animationTime = time !== undefined ? time : Date.now() / 1000;
  
  // Apply fluid distortion
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Calculate effect intensity based on position
      const fx = flowSpeed * 10;
      const ft = turbulence * 0.4;
      
      // Create more fluid distortion using multiple sine waves at different frequencies
      // This creates a more complex, organic wave pattern
      const distortX = Math.sin(y / 20 + animationTime * fx) * ft + 
                      Math.sin(y / 10 + animationTime * (fx * 0.7)) * (ft * 0.5) +
                      Math.sin(y / 40 + animationTime * (fx * 1.3)) * (ft * 0.3);
                      
      const distortY = Math.cos(x / 20 + animationTime * fx) * ft +
                      Math.cos(x / 15 + animationTime * (fx * 0.8)) * (ft * 0.4) +
                      Math.cos(x / 30 + animationTime * (fx * 1.2)) * (ft * 0.3);
      
      // Calculate source coordinates with distortion
      const srcX = Math.floor(x + distortX);
      const srcY = Math.floor(y + distortY);
      
      // Make sure coordinates are within bounds
      const validSrcX = Math.max(0, Math.min(width - 1, srcX));
      const validSrcY = Math.max(0, Math.min(height - 1, srcY));
      
      // Get source pixel index
      const srcIndex = (validSrcY * width + validSrcX) * 4;
      const destIndex = (y * width + x) * 4;
      
      // Apply color shifting based on time
      const shiftOffset = Math.floor(Math.sin(x / width * Math.PI * 2 + animationTime * colorShift) * colorShift * 5);
      
      // Read RGB from source position for base pixels
      const r = sourcePixels[srcIndex];
      const g = sourcePixels[srcIndex + 1];
      const b = sourcePixels[srcIndex + 2];
      
      // Optional color shifting (RGB channel separation)
      if (colorShift > 0) {
        // Calculate position offsets for color channels
        const rOffset = Math.max(0, Math.min(width * height * 4 - 4, srcIndex + shiftOffset * 4));
        const bOffset = Math.max(0, Math.min(width * height * 4 - 4, srcIndex - shiftOffset * 4));
        
        // Apply shifted colors
        pixels[destIndex] = sourcePixels[rOffset]; // R from shifted position
        pixels[destIndex + 1] = g; // G from original position
        pixels[destIndex + 2] = sourcePixels[bOffset + 2]; // B from another shifted position
      } else {
        // No color shift - just copy pixels from the distorted position
        pixels[destIndex] = r;
        pixels[destIndex + 1] = g;
        pixels[destIndex + 2] = b;
      }
      
      // Keep original alpha
      pixels[destIndex + 3] = sourcePixels[srcIndex + 3];
    }
  }
  
  // Put the modified pixels back to the canvas
  ctx.putImageData(imageData, 0, 0);
}; 