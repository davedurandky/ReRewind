export const LayerVariation = (
  imageData: ImageData,
  width: number,
  height: number,
  intensity: number
) => {
  if (intensity === 0) return;
  
  // Scale up intensity for more dramatic effect
  const scaledIntensity = intensity * 10;
  
  // Create a temporary canvas to manipulate the image
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
  
  if (!tempCtx) return;
  
  // Draw the original image data to the temp canvas
  const tempImageData = new ImageData(
    new Uint8ClampedArray(imageData.data),
    width,
    height
  );
  tempCtx.putImageData(tempImageData, 0, 0);
  
  // Create a main canvas for final output
  const mainCanvas = document.createElement('canvas');
  mainCanvas.width = width;
  mainCanvas.height = height;
  const mainCtx = mainCanvas.getContext('2d', { willReadFrequently: true });
  
  if (!mainCtx) return;
  
  // Generate layers with varying heights
  const layers = [];
  let y = 0;
  
  // Base layer size based on intensity
  const minLayerSize = 5 + (intensity * 10);
  const maxLayerSize = 10 + (intensity * 40);
  
  while (y < height) {
    // Layer height varies within bounds that scale with intensity
    const layerHeight = minLayerSize + Math.random() * (maxLayerSize - minLayerSize);
    
    // Horizontal shift based on intensity
    const shiftX = Math.random() * intensity * 2 * (Math.random() > 0.5 ? 1 : -1);
    
    layers.push({ y, h: layerHeight, shiftX });
    y += layerHeight;
  }
  
  // Draw layers with borders
  layers.forEach(({ y, h, shiftX }) => {
    // Draw the image slice with shifted position
    mainCtx.drawImage(tempCanvas, 0, y, width, h, shiftX, y, width, h);
    
    // Line thickness increases with intensity but more subtly
    const baseThickness = Math.max(1, Math.round(intensity * 2));
    const lineThickness = baseThickness + Math.floor(Math.random() * baseThickness);
    
    // Line opacity based on intensity
    const lineOpacity = 0.2 + (intensity * 0.6);
    
    // Draw separation line between layers if intensity is high enough
    if (Math.random() < intensity / 3) {
      mainCtx.fillStyle = `rgba(0, 0, 0, ${lineOpacity})`;
      mainCtx.fillRect(0, y, width, lineThickness);
    }
  });
  
  // Get the final image data to return
  const finalImageData = mainCtx.getImageData(0, 0, width, height);
  
  // Copy the final image data back to the original
  for (let i = 0; i < imageData.data.length; i++) {
    imageData.data[i] = finalImageData.data[i];
  }
}