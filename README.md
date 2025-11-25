# 3Dmol.js Power BI Custom Visual

A Power BI custom visual that allows users to visualize protein structure data using the 3Dmol.js viewer.

<h3 align="right">Tuple, LLC</h3>

## Features

- **Accepts PDB and CIF format data**: Load protein structures directly from your Power BI data model
- **Multiple visualization styles**: Choose from Cartoon, Stick, Line, Cross, Sphere, and Surface representations
- **Flexible coloring schemes**: Color by Chain, Residue, Spectrum, Secondary Structure, or use default colors
- **Customizable display**: Adjust background color, enable auto-rotation, and control rendering quality
- **Automatic format detection**: Automatically detects whether the input is PDB or CIF format

## Installation

1. Download the latest `.pbiviz` file from the `dist/` directory
2. In Power BI Desktop, go to **Visualizations** pane
3. Click the **...** (More options) button and select **Import a visual from a file**
4. Select the downloaded `.pbiviz` file
5. The 3Dmol Protein Viewer will appear in your visualizations pane

## Usage

### Data Requirements

The visual expects a single column containing protein structure data in either PDB or CIF format as text strings.

1. Add the visual to your report canvas
2. Drag a field containing PDB or CIF data to the **Protein Structure** data role
3. The protein structure will be rendered automatically

### Formatting Options

Access these settings in the Format pane:

- **Protein Style**: Choose how the protein is rendered (Cartoon, Stick, Line, Cross, Sphere, Surface)
- **Color Scheme**: Select coloring method (By Chain, By Residue, Spectrum, Secondary Structure, Default)
- **Background Color**: Set the viewer background color
- **Auto Rotate**: Enable/disable automatic rotation of the structure
- **Rendering Quality**: Choose rendering quality (Low, Medium, High)

## Development

### Prerequisites

- Node.js (v12 or higher)
- npm
- Power BI Visual Tools: `npm install -g powerbi-visuals-tools`

### Building from Source

```bash
# Install dependencies
npm install

# Start development server
npm start

# Package the visual
npm run package
```

The packaged visual will be available in the `dist/` directory.

## Dependencies

- [3Dmol.js](https://3dmol.csb.pitt.edu/) - Molecular visualization library
- Power BI Visuals API

