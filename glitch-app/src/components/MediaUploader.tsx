import React, { useCallback, useState, useRef, useEffect } from 'react';

interface MediaUploaderProps {
  onMediaLoaded: ({ original, thumbnail }: { original: File, thumbnail: HTMLCanvasElement }) => void;
  hasExistingImage?: boolean;
}

const MediaUploader: React.FC<MediaUploaderProps> = ({ onMediaLoaded, hasExistingImage = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dragCounter = useRef(0);

  // Add debugging information to window object
  useEffect(() => {
    (window as any).__mediaUploaderDebug = {
      isDragging,
      isLoading,
      error,
      hasExistingImage
    };
    
    console.log('[MediaUploader] Mounted with hasExistingImage:', hasExistingImage);
    
    // Add global drag event listener to help diagnose issues
    const handleGlobalDragOver = (e: DragEvent) => {
      console.log('[MediaUploader] Global dragover event detected');
    };
    
    window.addEventListener('dragover', handleGlobalDragOver);
    return () => {
      window.removeEventListener('dragover', handleGlobalDragOver);
      delete (window as any).__mediaUploaderDebug;
    };
  }, [isDragging, isLoading, error, hasExistingImage]);

  // Process an uploaded image file
  const processFile = useCallback((file: File) => {
    console.log('[MediaUploader] processFile called with file:', file.name, file.type, file.size);
    
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPEG, PNG, etc.)');
      console.error('[MediaUploader] Invalid file type:', file.type);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    const img = new Image();
    img.crossOrigin = "anonymous"; // Try to avoid CORS issues
    
    const objectUrl = URL.createObjectURL(file);
    console.log('[MediaUploader] Created object URL:', objectUrl);
    img.src = objectUrl;
    
    // Clean up the object URL when the image loads or errors
    const cleanupUrl = () => {
      URL.revokeObjectURL(objectUrl);
      console.log('[MediaUploader] Revoked object URL');
    };
    
    img.onload = function() {
      cleanupUrl();
      console.log('[MediaUploader] Image loaded successfully:', img.width, 'x', img.height);
      
      try {
        // Create thumbnail
        const canvas = document.createElement('canvas');
        
        // Use the same MAX_DIMENSION as in PreviewWindow for consistency
        const MAX_DIMENSION = 1000;
        
        // Calculate dimensions based on original image
        let scaledWidth = img.width;
        let scaledHeight = img.height;
        
        // Scale down if image is larger than MAX_DIMENSION
        if (img.width > MAX_DIMENSION || img.height > MAX_DIMENSION) {
          if (img.width > img.height) {
            // Landscape orientation
            scaledWidth = MAX_DIMENSION;
            scaledHeight = (img.height / img.width) * MAX_DIMENSION;
          } else {
            // Portrait orientation
            scaledHeight = MAX_DIMENSION;
            scaledWidth = (img.width / img.height) * MAX_DIMENSION;
          }
        }
        
        // Ensure minimum dimensions for very small images
        scaledWidth = Math.max(scaledWidth, 400);
        scaledHeight = Math.max(scaledHeight, 300);
        
        canvas.width = Math.floor(scaledWidth);
        canvas.height = Math.floor(scaledHeight);
        
        console.log('[MediaUploader] Processing image with dimensions:', canvas.width, 'x', canvas.height, 'Original:', img.width, 'x', img.height);
        
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        if (!ctx) {
          console.error('[MediaUploader] Failed to get canvas context');
          setError('Failed to process image');
          setIsLoading(false);
          return;
        }
        
        // Fill with a white background to ensure no transparency issues
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw image to canvas at the scaled dimensions
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        console.log('[MediaUploader] Image processed:', canvas.width, 'x', canvas.height, 'Original:', img.width, 'x', img.height);
        
        // Validate the canvas has meaningful content
        try {
          const centerX = Math.floor(canvas.width / 2);
          const centerY = Math.floor(canvas.height / 2);
          const centerPixel = ctx.getImageData(centerX, centerY, 1, 1).data;
          
          // Check if the center pixel is fully transparent
          const isBlank = (centerPixel[3] === 0);
          
          if (isBlank) {
            console.warn('[MediaUploader] Warning: Center pixel is transparent, image may not be visible');
          }
          
          console.log('[MediaUploader] Calling onMediaLoaded with processed image');
          onMediaLoaded({ original: file, thumbnail: canvas });
          
        } catch (imgErr) {
          console.error('[MediaUploader] Canvas validation failed:', imgErr);
          
          // Create a fallback canvas with a simple colored background
          try {
            const fallbackCanvas = document.createElement('canvas');
            fallbackCanvas.width = 800;
            fallbackCanvas.height = 600;
            const fbCtx = fallbackCanvas.getContext('2d');
            
            if (fbCtx) {
              // Create a gradient background
              const gradient = fbCtx.createLinearGradient(0, 0, fallbackCanvas.width, fallbackCanvas.height);
              gradient.addColorStop(0, '#3490dc');
              gradient.addColorStop(1, '#6574cd');
              fbCtx.fillStyle = gradient;
              fbCtx.fillRect(0, 0, fallbackCanvas.width, fallbackCanvas.height);
              
              // Add an error message
              fbCtx.fillStyle = 'white';
              fbCtx.font = '24px sans-serif';
              fbCtx.textAlign = 'center';
              fbCtx.fillText('Could not process image', fallbackCanvas.width / 2, fallbackCanvas.height / 2);
              
              console.log('[MediaUploader] Using fallback canvas');
              onMediaLoaded({ original: file, thumbnail: fallbackCanvas });
            }
          } catch (fbErr) {
            console.error('[MediaUploader] Fallback canvas creation failed:', fbErr);
            setError('Failed to process image');
          }
        }
        
        setIsLoading(false);
        
      } catch (err) {
        console.error('[MediaUploader] Image processing error:', err);
        setError('Error processing image');
        setIsLoading(false);
      }
    };
    
    img.onerror = function(e) {
      cleanupUrl();
      console.error('[MediaUploader] Image loading failed', e);
      setError('Failed to load image');
      setIsLoading(false);
    };
    
  }, [onMediaLoaded]);
  
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('[MediaUploader] handleFileChange called', e.target.files);
    if (e.target.files && e.target.files.length > 0) {
      console.log('[MediaUploader] File selected:', e.target.files[0].name);
      processFile(e.target.files[0]);
    } else {
      console.warn('[MediaUploader] No files selected in input element');
    }
  }, [processFile]);
  
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Increment counter so we can track nested elements
    dragCounter.current += 1;
    console.log('[MediaUploader] handleDragEnter, counter:', dragCounter.current);
    
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Decrement counter
    dragCounter.current -= 1;
    console.log('[MediaUploader] handleDragLeave, counter:', dragCounter.current);
    
    // Only set isDragging to false when the counter reaches 0
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);
  
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[MediaUploader] handleDragOver');
    
    // Add a className or change component state
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Reset counter
    dragCounter.current = 0;
    setIsDragging(false);
    
    console.log('[MediaUploader] handleDrop called', e.dataTransfer.files);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      console.log('[MediaUploader] File dropped:', e.dataTransfer.files[0].name);
      processFile(e.dataTransfer.files[0]);
    } else {
      console.warn('[MediaUploader] No files found in drop event');
    }
  }, [processFile]);
  
  const handleClick = useCallback(() => {
    if (hasExistingImage) {
      // When used as an overlay on an existing image, still allow clicking to open file dialog
      console.log('[MediaUploader] Overlay clicked, opening file dialog');
    } else {
      console.log('[MediaUploader] Upload area clicked');
    }
    
    // Programmatically click the file input
    const fileInput = document.getElementById('file-upload');
    if (fileInput) {
      fileInput.click();
    } else {
      console.error('[MediaUploader] Could not find file-upload element');
    }
  }, [hasExistingImage]);

  // Style classes based on whether this is an overlay or standalone uploader
  const containerClasses = hasExistingImage 
    ? `w-full h-full flex items-center justify-center rounded-xl ${isDragging ? 'bg-blue-500/50' : 'bg-transparent'} transition-colors duration-200`
    : `w-full border-2 border-dashed rounded-xl p-8 ${
        isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-zinc-700'
      } transition-colors duration-200 ${isLoading ? 'opacity-75' : 'hover:border-blue-400 dark:hover:border-blue-500'}`;

  // For overlay mode, show minimal UI unless dragging
  if (hasExistingImage) {
    return (
      <div
        className={containerClasses}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        style={{ pointerEvents: 'all', cursor: 'pointer' }}
      >
        {isDragging && (
          <div className="text-center p-4 bg-white/90 dark:bg-black/80 rounded-lg shadow-lg">
            <div className="text-xl font-medium text-blue-600 dark:text-blue-400 mb-1">
              Drop to Replace
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Release to update the animation
            </p>
          </div>
        )}
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />
      </div>
    );
  }

  // Original UI for the standalone uploader
  return (
    <div
      className={containerClasses}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <div className="text-center">
        {isLoading ? (
          <div className="text-center">
            <svg className="animate-spin mx-auto h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Processing image...</p>
          </div>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="mx-auto h-12 w-12 text-gray-400 dark:text-zinc-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-200">
              Drop an image to start
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Or click to browse
            </p>
            {error && (
              <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs rounded-lg border border-red-200 dark:border-red-800">
                {error}
              </div>
            )}
          </>
        )}
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
};

export default MediaUploader;