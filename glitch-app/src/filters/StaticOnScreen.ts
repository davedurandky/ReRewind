export const StaticOnScreen = (ctx: CanvasRenderingContext2D, width: number, height: number, intensity: number) => {
  if (intensity === 0) return;
  
  // Scale intensity - make it extremely subtle with tiny dots
  // Drastically reduced intensity for smaller, more subtle effect
  const scaledIntensity = Math.min(0.08, intensity * 0.08); 
  
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Calculate how many pixels will get static effect
  // Increase pixel count but make each dot much less visible
  const totalPixels = width * height;
  let staticPixelCount = Math.floor(totalPixels * scaledIntensity * 6); // More dots, but each much less visible
  
  // Create a list of pixel indices for the whole image
  const pixelIndices = [];
  for (let i = 0; i < totalPixels; i++) {
    pixelIndices.push(i);
  }
  
  // Shuffle the array to randomly select pixels
  for (let i = pixelIndices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pixelIndices[i], pixelIndices[j]] = [pixelIndices[j], pixelIndices[i]];
  }
  
  // Apply static to randomly selected pixels with extremely low visibility
  for (let i = 0; i < staticPixelCount; i++) {
    const pixelIndex = pixelIndices[i];
    const idx = pixelIndex * 4;
    
    // Reduce static strength for absolutely tiny, almost imperceptible dots
    const staticStrength = 0.05 + Math.random() * 0.1; // Extremely low value (was 0.1-0.3)
    const noise = Math.random() * 255;
    
    // Apply noise with more subtle blending to original pixel
    data[idx] = data[idx] * (1 - staticStrength) + noise * staticStrength;       // R
    data[idx + 1] = data[idx + 1] * (1 - staticStrength) + noise * staticStrength; // G
    data[idx + 2] = data[idx + 2] * (1 - staticStrength) + noise * staticStrength; // B
  }
  
  // Apply an extremely subtle noise pattern across the entire image
  for (let i = 0; i < data.length; i += 4) {
    if (Math.random() < scaledIntensity * 0.025) { // Reduced from 0.05
      const lowNoise = Math.random() * 15; // Reduced from 20
      const lowStrength = 0.03 + Math.random() * 0.05; // Reduced from 0.05-0.15
      
      data[i] = data[i] * (1 - lowStrength) + lowNoise * lowStrength;         // R
      data[i + 1] = data[i + 1] * (1 - lowStrength) + lowNoise * lowStrength; // G
      data[i + 2] = data[i + 2] * (1 - lowStrength) + lowNoise * lowStrength; // B
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
}; 