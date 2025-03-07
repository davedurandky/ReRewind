export const Pixelate = (ctx: CanvasRenderingContext2D, width: number, height: number, intensity: number) => {
  if (intensity === 0) return;
  
  // Create a temporary canvas to store the original image
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d');
  
  if (!tempCtx) return;
  
  // Copy the original image to the temporary canvas
  tempCtx.drawImage(ctx.canvas, 0, 0);
  
  // Calculate pixel size - much more gradual scale
  // For intensity 0.01-0.2: subtle pixelation (1-3 pixel blocks)
  // For intensity 0.2-0.5: medium pixelation (3-6 pixel blocks) 
  // For intensity 0.5-0.8: strong pixelation (6-10 pixel blocks)
  // For intensity 0.8-1.0: extreme pixelation (10-16 pixel blocks)
  let pixelSize;
  
  if (intensity < 0.01) {
    return; // No visible effect for very low values
  } else if (intensity <= 0.2) {
    // Very subtle pixelation (1-3 pixels)
    pixelSize = Math.max(1, Math.floor(1 + intensity * 10));
  } else if (intensity <= 0.5) {
    // Medium pixelation (3-6 pixels)
    pixelSize = Math.floor(3 + (intensity - 0.2) * 10);
  } else if (intensity <= 0.8) {
    // Strong pixelation (6-10 pixels)
    pixelSize = Math.floor(6 + (intensity - 0.5) * 13.33);
  } else {
    // Extreme pixelation (10-16 pixels)
    pixelSize = Math.floor(10 + (intensity - 0.8) * 30);
  }
  
  // Clear the original canvas
  ctx.clearRect(0, 0, width, height);
  
  // Draw pixelated version with improved sampling method
  for (let y = 0; y < height; y += pixelSize) {
    for (let x = 0; x < width; x += pixelSize) {
      // Size of the area to sample (use the full pixel size or whatever fits in the image)
      const sampleWidth = Math.min(pixelSize, width - x);
      const sampleHeight = Math.min(pixelSize, height - y);
      
      if (sampleWidth <= 0 || sampleHeight <= 0) continue;
      
      // For smaller pixel sizes, use center sampling for sharper details
      if (pixelSize <= 4) {
        // Sample from the center of each pixel block for better color representation
        const sampleX = Math.min(x + Math.floor(sampleWidth/2), width - 1);
        const sampleY = Math.min(y + Math.floor(sampleHeight/2), height - 1);
        
        // Get the color of the pixel at the sampling point
        const pixelData = tempCtx.getImageData(sampleX, sampleY, 1, 1).data;
        
        // Fill a rectangle with that color
        ctx.fillStyle = `rgba(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]}, ${pixelData[3] / 255})`;
        ctx.fillRect(x, y, pixelSize, pixelSize);
      } 
      // For medium pixel sizes, use a faster average sampling
      else if (pixelSize <= 8) {
        // Sample a sparse grid of pixels for a reasonable average
        const gridSize = 2; // Sample every 2nd pixel
        let r = 0, g = 0, b = 0, a = 0;
        let count = 0;
        
        for (let sy = 0; sy < sampleHeight; sy += gridSize) {
          for (let sx = 0; sx < sampleWidth; sx += gridSize) {
            const sampleX = x + sx;
            const sampleY = y + sy;
            
            if (sampleX < width && sampleY < height) {
              const pixelData = tempCtx.getImageData(sampleX, sampleY, 1, 1).data;
              r += pixelData[0];
              g += pixelData[1];
              b += pixelData[2];
              a += pixelData[3];
              count++;
            }
          }
        }
        
        if (count > 0) {
          // Calculate the average color
          r = Math.round(r / count);
          g = Math.round(g / count);
          b = Math.round(b / count);
          a = Math.round(a / count);
          
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
          ctx.fillRect(x, y, pixelSize, pixelSize);
        }
      }
      // For larger pixel sizes, use full average sampling for smoother color blends
      else {
        // Get the average color of the area with proper sampling
        const imageData = tempCtx.getImageData(x, y, sampleWidth, sampleHeight);
        const data = imageData.data;
        
        let r = 0, g = 0, b = 0, a = 0;
        let count = 0;
        
        // Use a sampling rate based on the pixel size for performance
        const samplingRate = Math.max(1, Math.floor(pixelSize / 3));
        
        for (let i = 0; i < data.length; i += 4 * samplingRate) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          a += data[i + 3];
          count++;
        }
        
        if (count > 0) {
          // Calculate the average color
          r = Math.round(r / count);
          g = Math.round(g / count);
          b = Math.round(b / count);
          a = Math.round(a / count);
          
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
          ctx.fillRect(x, y, pixelSize, pixelSize);
        }
      }
    }
  }
  
  // For a true pixelated look, ensure the image is rendered with pixelated interpolation
  ctx.canvas.style.imageRendering = 'pixelated';
}; 