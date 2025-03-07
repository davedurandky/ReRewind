export const ScanLines = (
  ctx: CanvasRenderingContext2D, 
  width: number, 
  height: number, 
  intensity: number,
  time?: number
) => {
  if (intensity === 0) return;
  
  // Calculate scan line properties based on intensity
  const baseSpacing = Math.max(2, Math.floor(12 - intensity));
  const opacity = 0.2 + (intensity / 20);
  
  // Use provided time or current time for animation
  const animationTime = time !== undefined ? time : Date.now() / 1000;
  
  // Save current context state
  ctx.save();
  
  // Set scan line styling
  ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
  
  // Draw horizontal scan lines with varying heights and positions
  for (let y = 0; y < height; y += baseSpacing) {
    // Vary the height based on position and time
    const lineHeight = 1 + Math.sin(y * 0.05 + animationTime * 2) * intensity * 0.3;
    
    // Vary the position slightly based on time
    const position = y + Math.sin(y * 0.02 + animationTime) * intensity;
    
    // Draw the scan line
    ctx.fillRect(0, position, width, lineHeight);
    
    // Add occasional "glitch" in the scan lines
    if (Math.random() < 0.02 * intensity) {
      const glitchWidth = Math.random() * width * 0.8;
      const glitchX = Math.random() * (width - glitchWidth);
      ctx.fillRect(glitchX, position, glitchWidth, lineHeight * 3);
    }
  }
  
  // Restore context state
  ctx.restore();
}; 