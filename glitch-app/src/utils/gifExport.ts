/**
 * Utility functions for GIF export
 */
import GIF from 'gif.js';

// Function to capture frames from canvas
export const captureFrames = (
  canvas: HTMLCanvasElement,
  frameCount: number,
  renderFrame: (frameIndex: number) => void
): Promise<ImageData[]> => {
  return new Promise((resolve) => {
    const frames: ImageData[] = [];
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      console.error('Could not get canvas context');
      resolve([]);
      return;
    }
    
    let currentFrame = 0;
    
    const captureNextFrame = () => {
      // Render the current frame
      renderFrame(currentFrame);
      
      // Capture the frame
      frames.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
      
      // Move to next frame or finish
      currentFrame++;
      if (currentFrame < frameCount) {
        // Continue capturing frames
        setTimeout(captureNextFrame, 0);
      } else {
        // All frames captured
        resolve(frames);
      }
    };
    
    // Start capturing frames
    captureNextFrame();
  });
};

// Function to create a GIF from frames using gif.js
export const createGifFromFrames = (
  frames: ImageData[],
  width: number,
  height: number,
  delay: number = 100
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    try {
      // Create a temporary canvas to draw frames
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Initialize gif.js
      const gif = new GIF({
        workers: 2,
        quality: 10,
        width: width,
        height: height,
        workerScript: '/gif.worker.js'
      });
      
      // Add progress handler
      gif.on('progress', (p: number) => {
        console.log(`GIF encoding progress: ${Math.round(p * 100)}%`);
      });
      
      // Add each frame to the GIF
      frames.forEach(frame => {
        ctx.putImageData(frame, 0, 0);
        gif.addFrame(ctx, { copy: true, delay: delay });
      });
      
      // Render the GIF
      gif.on('finished', (blob: Blob) => {
        resolve(blob);
      });
      
      gif.render();
    } catch (error) {
      reject(error);
    }
  });
};

// Function to download a blob as a file
export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}; 