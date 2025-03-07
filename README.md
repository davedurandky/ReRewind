# ReRewind

A retro VHS-style image filter application that applies various glitch and distortion effects to images.

## Features

- **Layer Variation**: Creates RGB channel splitting effects similar to VHS tracking issues
- **Static On Screen**: Adds realistic static noise with varying intensity
- **ZigZag Effect**: Creates horizontal distortion patterns reminiscent of VHS playback issues
- **VHS Color Grade**: Applies authentic VHS color grading with red emphasis and vignetting
- **Fluid Animation**: Creates liquid-like distortion effects with smooth animation
- **Export Options**: Save your creations as PNG images or animated GIFs

## Enhanced Filter Effects

The application includes several sophisticated filter effects:

- **Advanced Layer Variation**: Implements RGB channel splitting with dynamic offsets, edge detection, and subtle RGB noise for authentic VHS tracking issues.
- **Realistic Static**: Creates authentic static noise with varying intensity, horizontal line glitches, pixel dropouts, and sync issues.
- **Complex ZigZag**: Produces horizontal distortion with multi-wave patterns, occasional major glitches, and digital corruption artifacts.
- **Authentic VHS Color Grade**: Applies sophisticated color grading with red emphasis, blue reduction, vignetting, film grain, and color bleeding.
- **Fluid Animation**: Creates liquid-like distortions with bilinear interpolation for smooth results, color shifts, and caustics effects.

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/ReRewind.git
   cd ReRewind
   ```

2. Install dependencies:
   ```
   cd glitch-app
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

4. Open your browser and navigate to `http://localhost:3000`

## Usage

1. Upload an image by dragging and dropping or using the file selector
2. Adjust the filter sliders to create your desired effect
3. Toggle animation on/off and adjust animation speed
4. Download your creation as a PNG or animated GIF

## Building for Production

To create a production build:

```
npm run build
```

The build files will be in the `build` directory and can be served using any static file server.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by VHS aesthetics and analog video artifacts
- Built with React and Canvas API 