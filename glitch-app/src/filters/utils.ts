/**
 * Creates a blurred background using the original image to prevent white edges.
 * This should be called at the beginning of filters that might expose the background.
 * 
 * @param ctx The canvas context
 * @param width The canvas width
 * @param height The canvas height
 * @param blurAmount Optional blur amount (default: 10)
 * @param scale Optional scale factor for the background (default: 1.1 - slightly larger than the original)
 */
export const createBlurredBackground = (
  ctx: CanvasRenderingContext2D, 
  width: number, 
  height: number,
  blurAmount: number = 10,
  scale: number = 1.1
) => {
  // Create a temporary canvas for the blurred background
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d');
  
  if (!tempCtx) return;
  
  // Copy the original image to the temporary canvas
  tempCtx.drawImage(ctx.canvas, 0, 0);
  
  // Apply a blur effect to the temporary canvas
  // First, we use a fast box blur by drawing multiple times with lower opacity
  for (let i = 0; i < blurAmount; i++) {
    tempCtx.globalAlpha = 1 / (i + 1);
    tempCtx.drawImage(
      tempCanvas, 
      0, 0, width, height,
      0, 0, width, height
    );
  }
  tempCtx.globalAlpha = 1;
  
  // Clear the original canvas
  ctx.clearRect(0, 0, width, height);
  
  // Calculate the scaled dimensions and position to center
  const scaledWidth = width * scale;
  const scaledHeight = height * scale;
  const offsetX = (width - scaledWidth) / 2;
  const offsetY = (height - scaledHeight) / 2;
  
  // Draw the blurred, slightly larger version as background
  ctx.drawImage(
    tempCanvas, 
    0, 0, width, height,
    offsetX, offsetY, scaledWidth, scaledHeight
  );
  
  // Draw the original image on top
  ctx.drawImage(tempCanvas, 0, 0);
};

/**
 * Saves the current state of a canvas and returns a function to restore it
 * Useful for filters that need to maintain the original image
 * 
 * @param ctx The canvas context
 * @returns A function that restores the saved image data
 */
export const saveCanvasState = (ctx: CanvasRenderingContext2D) => {
  const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  
  return () => {
    ctx.putImageData(imageData, 0, 0);
  };
}; 