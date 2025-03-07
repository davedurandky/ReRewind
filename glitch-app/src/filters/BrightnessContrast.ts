import { createBlurredBackground } from './utils';

/**
 * Applies brightness and contrast adjustments to the image
 * Brightness value: -1 to 1 where:
 * - Negative values decrease brightness (darker)
 * - 0 is neutral
 * - Positive values increase brightness (brighter)
 * 
 * Contrast value: -1 to 1 where:
 * - Negative values decrease contrast (flatter)
 * - 0 is neutral
 * - Positive values increase contrast (more dramatic)
 */
export const BrightnessContrast = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  brightness: number,
  contrast: number
): void => {
  if (brightness === 0 && contrast === 0) return;
  
  // Get image data
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Scale intensity properly (values between -1 and 1)
  const brightnessScale = brightness * 100; // Convert to percentage
  const contrastFactor = (1 + contrast) * (1 + contrast); // Quadratic intensity for contrast
  
  // Apply brightness and contrast adjustments
  for (let i = 0; i < data.length; i += 4) {
    // Apply brightness adjustment
    let r = data[i] + brightnessScale;
    let g = data[i + 1] + brightnessScale;
    let b = data[i + 2] + brightnessScale;
    
    // Apply contrast adjustment
    if (contrast !== 0) {
      // Calculate luminance (weighted conversion to grayscale)
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      
      // Apply contrast
      r = luminance + contrastFactor * (r - luminance);
      g = luminance + contrastFactor * (g - luminance);
      b = luminance + contrastFactor * (b - luminance);
    }
    
    // Clamp values to valid range
    data[i] = Math.max(0, Math.min(255, r));
    data[i + 1] = Math.max(0, Math.min(255, g));
    data[i + 2] = Math.max(0, Math.min(255, b));
    // Alpha remains unchanged
  }
  
  // Put the modified image data back
  ctx.putImageData(imageData, 0, 0);
};

/**
 * Apply a VHS-style color grading with decreased brightness and increased contrast
 * for that authentic worn VHS tape look
 */
export const VHSColorGrade = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number
): void => {
  if (intensity === 0) return;
  
  // Create a slightly blurred background
  createBlurredBackground(ctx, width, height, 5, 1.05);
  
  // Get image data
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Scale values
  const scaledIntensity = intensity * 0.8; // Scale down for more subtle effect
  
  // Apply VHS color grading
  for (let i = 0; i < data.length; i += 4) {
    // Reduce brightness slightly
    const brightness = -0.2 * scaledIntensity;
    
    // Increase red slightly, decrease blue, and slightly adjust green
    // This gives the warm, slightly magenta/reddish tint of VHS
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Apply VHS color science adjustments
    data[i] = Math.max(0, Math.min(255, r + r * 0.05 * scaledIntensity + brightness * 255)); // More red
    data[i + 1] = Math.max(0, Math.min(255, g - g * 0.02 * scaledIntensity + brightness * 255)); // Slightly less green
    data[i + 2] = Math.max(0, Math.min(255, b - b * 0.1 * scaledIntensity + brightness * 255)); // Less blue
    
    // Apply slight contrast to shadows specifically
    if (r < 128 && g < 128 && b < 128) {
      data[i] = Math.max(0, Math.min(255, data[i] * (0.95 - 0.1 * scaledIntensity)));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] * (0.95 - 0.1 * scaledIntensity)));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] * (0.95 - 0.1 * scaledIntensity)));
    }
  }
  
  // Put the modified image data back
  ctx.putImageData(imageData, 0, 0);
}; 