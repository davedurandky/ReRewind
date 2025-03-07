export const FluidAnimation = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  flowSpeed: number,  
  turbulence: number,
  colorShift: number,
  timeMs: number
) => {
  // Ensure the time value is always a number to prevent inconsistencies
  const time = typeof timeMs === 'number' ? timeMs : 0;
  
  // Normalize time to reduce floating point precision issues
  const normalizedTime = (time / 1000) % 1000;

  // Create a more deterministic fluid animation
  const offsetX = Math.sin(normalizedTime * 0.001 * flowSpeed) * (width * 0.05) * (flowSpeed / 10);
  const offsetY = Math.cos(normalizedTime * 0.001 * flowSpeed) * (height * 0.05) * (flowSpeed / 10);

  // Multi-wave turbulence for more consistent wavy effects
  let turbulenceOffsetX = 0;
  let turbulenceOffsetY = 0;
  
  if (turbulence > 0) {
    // Use fixed frequencies for consistent wave patterns
    const frequencies = [0.005, 0.01, 0.02];
    const amplitudes = [0.4, 0.3, 0.3];
    
    for (let i = 0; i < frequencies.length; i++) {
      const freq = frequencies[i];
      const amp = amplitudes[i];
      
      // Create consistent wave patterns based on time
      turbulenceOffsetX += Math.sin(normalizedTime * freq * turbulence) * (width * 0.01) * turbulence * amp;
      turbulenceOffsetY += Math.cos(normalizedTime * freq * turbulence) * (height * 0.01) * turbulence * amp;
    }
  }
  
  // Apply the combined offsets
  ctx.translate(offsetX + turbulenceOffsetX, offsetY + turbulenceOffsetY);
  
  // Apply color shift if needed with consistent timing
  if (colorShift > 0) {
    // Use the same time factor for consistent color shifting
    const colorPhase = normalizedTime * 0.001 * colorShift;
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = `rgba(${Math.sin(colorPhase) * 20 + 10}, ${Math.cos(colorPhase) * 20 + 10}, ${Math.sin(colorPhase + 1) * 20 + 20}, ${colorShift * 0.05})`;
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'source-over';
  }
  
  // Reset the transformation matrix to prevent cumulative effects
  ctx.setTransform(1, 0, 0, 1, 0, 0);
} 