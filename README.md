# tmerz.com

An interactive personal portfolio website featuring a procedurally generated city map with pan, zoom, and marker editing capabilities.

## 🌐 Live Website

My page is live at [https://tmerz.com/](https://tmerz.com/).

The Develop Branch Preview: [https://tobi238.github.io/tmerz.com/](https://tobi238.github.io/tmerz.com/)

## ✨ Features

### Interactive Map
- **Procedural Generation**: Each page load generates a unique city layout with streets, buildings, parks, and a river
- **Pan & Zoom**: Navigate the map with mouse drag/scroll or touch gestures (pinch-to-zoom on mobile)
- **Movable Markers**: Desktop users can enable edit mode to reposition social link markers
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices

### Map Generation
- Organic road networks with major and minor streets
- Meandering river that influences road placement
- Buildings and parks placed along roads
- Smart marker placement that avoids UI elements

### User Interface
- **Dark/Light Mode**: Toggle between themes with smooth transitions
- **Edit Mode** (Desktop only): Drag and reposition social link markers
- **Keyboard Shortcuts**:
  - `R` - Regenerate the map
  - `M` - Toggle dark/light mode
  - `E` - Toggle marker edit mode (desktop only)
- **Visual Feedback**: Drag handles, tooltips, and hover effects

## 🎨 Design

- Custom glassmorphism UI with backdrop blur effects
- Gradient backgrounds with radial color overlays
- Animated grain texture overlay
- Responsive typography and spacing
- Pin-style markers with icons for social links

## 🛠️ Technology

- **Pure HTML/CSS/JavaScript** - No frameworks or build tools required
- **Single File Architecture** - Everything contained in `index.html`
- **Canvas API** - For rendering the procedural map
- **localStorage** - Persists theme preference
- **CSS Custom Properties** - For theme switching and responsive design

## 🎯 Map Generation Algorithm

1. **River Generation**: Creates a meandering river across the map
2. **Road Network**: Grid-based roads with noise-based variations, avoiding the river
3. **Buildings**: Placed along roads with random sizes and orientations
4. **Parks**: Green spaces in grid cells, avoiding roads and buildings
5. **Marker Placement**: Social links positioned on the initial viewport with minimum spacing

## 🚀 Getting Started

Simply open `index.html` in a modern web browser. No build process or dependencies required.

## 📄 License

Personal portfolio website for Tobias Merz.

## 🔗 Contact

- Email: info@tmerz.com
- GitHub: [@tobi238](https://github.com/tobi238)
- LinkedIn: [tobiasmerz](https://www.linkedin.com/in/tobiasmerz)
- Xing: [Tobias_Merz14](https://www.xing.com/profile/Tobias_Merz14/cv)
