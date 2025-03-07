// Implementation of a chromatic aberration effect
// This filter shifts the red and blue color channels in opposite directions

export const ChromaShift = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number,
  timeMs: number = 0
): void => {
  // If intensity is 0, do nothing
  if (intensity === 0) return;

  // Get the image data from the canvas
  const imageData = ctx.getImageData(0, 0, width, height);
  
  // Calculate the amount to shift based on intensity (0-100)
  // Scale it to a more noticeable pixel range (0-20)
  let baseShift = Math.floor(intensity * 0.2);
  
  // Add subtle animation if time is provided
  if (timeMs > 0) {
    const oscillation = Math.sin(timeMs / 500) * 0.3 + 0.7; // Values between 0.4 and 1.0
    baseShift = Math.floor(baseShift * oscillation);
  }
  
  // Ensure shift amount is at least 1 pixel to be visible
  const maxShift = Math.max(1, baseShift);
  
  // Create new ImageData for the shifted result
  const resultData = ctx.createImageData(width, height);
  const resultPixels = resultData.data;
  const srcPixels = imageData.data;
  
  // Simple implementation - directly shift the RGB channels
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const currentPixel = (y * width + x) * 4;
      
      // Red channel - shift left
      const redX = x - maxShift;
      if (redX >= 0 && redX < width) {
        const redPixel = (y * width + redX) * 4;
        resultPixels[currentPixel] = srcPixels[redPixel];
      } else {
        resultPixels[currentPixel] = 0; // Out of bounds
      }
      
      // Green channel - no shift (anchor channel)
      resultPixels[currentPixel + 1] = srcPixels[currentPixel + 1];
      
      // Blue channel - shift right
      const blueX = x + maxShift;
      if (blueX >= 0 && blueX < width) {
        const bluePixel = (y * width + blueX) * 4;
        resultPixels[currentPixel + 2] = srcPixels[bluePixel + 2];
      } else {
        resultPixels[currentPixel + 2] = 0; // Out of bounds
      }
      
      // Alpha channel - keep original
      resultPixels[currentPixel + 3] = srcPixels[currentPixel + 3];
    }
  }
  
  // Put the modified image data back onto the canvas
  ctx.putImageData(resultData, 0, 0);
} 