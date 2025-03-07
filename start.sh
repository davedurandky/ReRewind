#!/bin/bash

# ReRewind - A React application for creating retro visual effects
# ===============================================================

# Display welcome message
echo "============================================="
echo "  ReRewind - Retro Visual Effects Generator  "
echo "============================================="
echo ""

# Kill any existing React development servers
echo "Stopping any existing React servers..."
pkill -f "react-scripts start" || true
echo ""

# Check for default images
if [ ! -f "glitch-app/public/default-image.png" ] || [ ! -f "glitch-app/public/rere.png" ]; then
  echo "Warning: One or more default images are missing."
  echo "The application may not function correctly without these files."
  echo ""
fi

# Change to the application directory
cd glitch-app

# Display feature information
echo "Application Features:"
echo "- Two default images loaded automatically (Cosmo and ReRe)"
echo "- Support for up to 3 images with thumbnail gallery and delete feature"
echo "- VHS Mode and Cosmo Mode presets"
echo "- Organized visual effects categories"
echo "- Fluid animation effects"
echo "- Export capabilities"
echo ""

echo "Available Effects Categories:"
echo "1. Distortion Effects:"
echo "   - Layer Variation"
echo "   - Zig Zag"
echo "   - Pixelate"
echo ""
echo "2. VHS Effects:"
echo "   - Static Noise"
echo "   - Chroma Shift"
echo "   - Scan Lines"
echo "   - VHS Color Grade"
echo ""
echo "3. Fluid Animation:"
echo "   - Flow Speed"
echo "   - Turbulence"
echo "   - Color Shift"
echo ""

# Start the application
echo "Starting React application on port 3059..."
echo "Open your browser at http://localhost:3059 if it doesn't open automatically"
echo ""

# Run the application
npm start 