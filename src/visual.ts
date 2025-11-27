/*
*  Power BI Visual CLI
*
*  Copyright (c) Microsoft Corporation
*  All rights reserved.
*  MIT License
*
*  Permission is hereby granted, free of charge, to any person obtaining a copy
*  of this software and associated documentation files (the "Software"), to deal
*  in the Software without restriction, including without limitation the rights
*  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
*  copies of the Software, and to permit persons to whom the Software is
*  furnished to do so, subject to the following conditions:
*
*  The above copyright notice and this permission notice shall be included in
*  all copies or substantial portions of the Software.
*
*  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
*  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
*  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
*  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
*  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
*  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
*  THE SOFTWARE.
*/
"use strict";

import powerbi from "powerbi-visuals-api";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import "./../style/visual.less";
// @ts-ignore
import * as $3Dmol from "3dmol/build/3Dmol.js";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import DataView = powerbi.DataView;

import { VisualFormattingSettingsModel } from "./settings";

// Supported molecular structure formats
const SUPPORTED_FORMATS = ['pdb', 'cif', 'mol2', 'sdf', 'xyz', 'cube'];

// Common PDB record types for format detection
const PDB_RECORD_TYPES = ['HEADER', 'ATOM', 'HETATM', 'MODEL', 'COMPND', 'SOURCE', 'TITLE', 'REMARK', 'SEQRES', 'CRYST1'];

interface ViewerCell {
    container: HTMLElement;
    viewerDiv: HTMLElement;
    titleDiv: HTMLElement;
    viewer: $3Dmol.GLViewer;
}

export class Visual implements IVisual {
    private target: HTMLElement;
    private gridContainer: HTMLElement;
    private viewers: ViewerCell[];
    private formattingSettings: VisualFormattingSettingsModel;
    private formattingSettingsService: FormattingSettingsService;

    constructor(options: VisualConstructorOptions) {
        console.log('Visual constructor', options);
        this.formattingSettingsService = new FormattingSettingsService();
        this.target = options.element;
        this.viewers = [];
        
        // Create grid container for multiple viewers
        this.gridContainer = document.createElement("div");
        this.gridContainer.style.width = "100%";
        this.gridContainer.style.height = "100%";
        this.gridContainer.style.display = "grid";
        this.gridContainer.style.gap = "2px";
        this.gridContainer.style.overflow = "hidden";
        this.target.appendChild(this.gridContainer);
    }

    /**
     * Normalize PDB data by ensuring proper line endings and removing problematic characters
     */
    private normalizePdbData(data: string): string {
        if (!data) {
            return "";
        }
        
        let normalized = data;
        
        // Remove surrounding quotes if present (common when data comes from Excel/CSV)
        if ((normalized.startsWith('"') && normalized.endsWith('"')) ||
            (normalized.startsWith("'") && normalized.endsWith("'"))) {
            normalized = normalized.slice(1, -1);
        }
        
        // Handle escaped newlines (literal \n or \r\n strings that should be actual newlines)
        // This is common when PDB data is stored in Excel cells or databases
        normalized = normalized.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n').replace(/\\r/g, '\n');
        
        // Handle various line ending formats and normalize to LF
        normalized = normalized.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        
        // Remove BOM (Byte Order Mark) if present
        normalized = normalized.replace(/^\uFEFF/, '');
        
        // Remove any null characters or other control characters (except newline, tab, and space)
        normalized = normalized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
        
        // Remove non-breaking spaces and other Unicode whitespace that may cause issues
        normalized = normalized.replace(/\u00A0/g, ' ');
        
        return normalized.trim();
    }

    /**
     * Detect the format of molecular structure data
     */
    private detectFormat(data: string, providedFormat?: string): string {
        // If format is provided and valid, use it
        if (providedFormat) {
            const format = providedFormat.toLowerCase().trim();
            if (SUPPORTED_FORMATS.includes(format)) {
                return format;
            }
        }
        
        const trimmed = data.trim();
        
        // CIF format detection - check for mmCIF/PDBx markers
        if (trimmed.includes("data_") || 
            trimmed.includes("_entry.id") || 
            trimmed.includes("_atom_site.") ||
            trimmed.includes("loop_")) {
            return "cif";
        }
        
        // MOL2 format detection
        if (trimmed.includes("@<TRIPOS>") || trimmed.includes("@<tripos>")) {
            return "mol2";
        }
        
        // SDF format detection - check for V2000 or V3000 format markers
        if (trimmed.includes("V2000") || trimmed.includes("V3000") || trimmed.includes("M  END")) {
            return "sdf";
        }
        
        // XYZ format detection - first line is atom count, second is comment
        const lines = trimmed.split('\n');
        if (lines.length >= 2) {
            const firstLine = lines[0].trim();
            // XYZ files start with a number (atom count)
            if (/^\d+$/.test(firstLine)) {
                return "xyz";
            }
        }
        
        // Cube format detection
        if (trimmed.includes("CUBE FILE") || (lines.length > 6 && /^\s*-?\d+\s+-?\d+\.\d+\s+-?\d+\.\d+\s+-?\d+\.\d+/.test(lines[2]))) {
            return "cube";
        }
        
        // PDB format - check for common PDB record types
        // Both full PDB files (with HEADER) and ATOM-only files should be detected
        for (const line of lines.slice(0, 20)) { // Check first 20 lines
            const recordType = line.substring(0, 6).trim().toUpperCase();
            if (PDB_RECORD_TYPES.includes(recordType)) {
                return "pdb";
            }
        }
        
        // Default to PDB if we can't determine
        return "pdb";
    }

    /**
     * Validate that the structure data contains actual molecular data
     */
    private isValidStructureData(data: string, providedFormat?: string): boolean {
        if (!data || data.length === 0) {
            return false;
        }
        
        const normalized = this.normalizePdbData(data);
        const format = this.detectFormat(normalized, providedFormat);
        
        // For explicitly provided formats, trust that the data is valid
        if (providedFormat && SUPPORTED_FORMATS.includes(providedFormat.toLowerCase().trim())) {
            return normalized.length > 10; // Basic sanity check
        }
        
        // Check for PDB ATOM/HETATM records
        if (normalized.includes('ATOM') || normalized.includes('HETATM')) {
            return true;
        }
        
        // Check for CIF atom site data
        if (normalized.includes('_atom_site.')) {
            return true;
        }
        
        // Check for MOL2 atom section
        if (normalized.includes('@<TRIPOS>ATOM') || normalized.includes('@<tripos>atom')) {
            return true;
        }
        
        // Check for SDF/MOL format
        if (normalized.includes('V2000') || normalized.includes('V3000')) {
            return true;
        }
        
        // Check for XYZ format (starts with number)
        const lines = normalized.split('\n');
        if (lines.length >= 3 && /^\d+$/.test(lines[0].trim())) {
            return true;
        }
        
        // Check for Cube format
        if (format === "cube") {
            return true;
        }
        
        return false;
    }

    /**
     * Create or reuse viewer cells for the grid
     */
    private setupViewerGrid(count: number, columns: number, backgroundColor: string, showTitles: boolean, titlePosition: string): void {
        // Calculate actual columns and rows
        const cols = columns > 0 ? columns : Math.ceil(Math.sqrt(count));
        const rows = Math.ceil(count / cols);
        
        // Update grid template
        this.gridContainer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        this.gridContainer.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
        
        // Remove excess viewers
        while (this.viewers.length > count) {
            const cell = this.viewers.pop();
            if (cell) {
                cell.container.remove();
            }
        }
        
        // Add new viewers if needed
        while (this.viewers.length < count) {
            const container = document.createElement("div");
            container.style.position = "relative";
            container.style.width = "100%";
            container.style.height = "100%";
            container.style.minHeight = "50px";
            container.style.minWidth = "50px";
            container.style.display = "flex";
            container.style.overflow = "hidden";
            this.gridContainer.appendChild(container);
            
            // Create title div
            const titleDiv = document.createElement("div");
            titleDiv.style.position = "absolute";
            titleDiv.style.padding = "2px 4px";
            titleDiv.style.fontSize = "12px";
            titleDiv.style.fontWeight = "bold";
            titleDiv.style.overflow = "hidden";
            titleDiv.style.textOverflow = "ellipsis";
            titleDiv.style.whiteSpace = "nowrap";
            titleDiv.style.zIndex = "10";
            titleDiv.style.backgroundColor = "rgba(255, 255, 255, 0.7)";
            titleDiv.style.borderRadius = "2px";
            container.appendChild(titleDiv);
            
            // Create viewer div
            const viewerDiv = document.createElement("div");
            viewerDiv.style.flex = "1";
            viewerDiv.style.position = "relative";
            viewerDiv.style.width = "100%";
            viewerDiv.style.height = "100%";
            viewerDiv.style.minHeight = "0";
            container.appendChild(viewerDiv);
            
            const viewer = $3Dmol.createViewer(viewerDiv, {});
            
            this.viewers.push({ container, viewerDiv, titleDiv, viewer });
        }
        
        // Update all viewer backgrounds, title visibility and position
        for (const cell of this.viewers) {
            cell.viewer.setBackgroundColor(backgroundColor);
            cell.titleDiv.style.display = showTitles ? "block" : "none";
            
            // Set title position
            cell.titleDiv.style.top = "";
            cell.titleDiv.style.bottom = "";
            cell.titleDiv.style.left = "";
            cell.titleDiv.style.right = "";
            
            if (titlePosition.startsWith("top")) {
                cell.titleDiv.style.top = "2px";
            } else {
                cell.titleDiv.style.bottom = "2px";
            }
            
            if (titlePosition.endsWith("left")) {
                cell.titleDiv.style.left = "2px";
            } else if (titlePosition.endsWith("right")) {
                cell.titleDiv.style.right = "2px";
            } else {
                cell.titleDiv.style.left = "50%";
                cell.titleDiv.style.transform = "translateX(-50%)";
            }
        }
    }

    public update(options: VisualUpdateOptions) {
        this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(VisualFormattingSettingsModel, options.dataViews[0]);

        console.log('Visual update', options);

        // Get data from Power BI
        const dataView: DataView = options.dataViews[0];
        
        if (!dataView || !dataView.table || !dataView.table.rows || dataView.table.rows.length === 0) {
            console.log("No data available");
            // Clear all viewers
            for (const cell of this.viewers) {
                cell.viewer.removeAllModels();
                cell.viewer.render();
            }
            return;
        }

        // Get formatting settings
        const style = String(this.formattingSettings.displaySettingsCard.style.value.value);
        const colorScheme = String(this.formattingSettings.displaySettingsCard.colorScheme.value.value);
        const backgroundColor = this.formattingSettings.displaySettingsCard.backgroundColor.value.value;
        const spin = this.formattingSettings.displaySettingsCard.spin.value;
        const useCustomChainColors = this.formattingSettings.displaySettingsCard.useCustomChainColors.value;
        const chainAColor = this.formattingSettings.displaySettingsCard.chainAColor.value.value;
        const chainBColor = this.formattingSettings.displaySettingsCard.chainBColor.value.value;
        const chainCColor = this.formattingSettings.displaySettingsCard.chainCColor.value.value;
        const chainDColor = this.formattingSettings.displaySettingsCard.chainDColor.value.value;
        const columns = this.formattingSettings.gridSettingsCard.columns.value;
        const showTitles = this.formattingSettings.gridSettingsCard.showTitles.value;
        const titlePosition = String(this.formattingSettings.gridSettingsCard.titlePosition.value.value);
        const showSurface = this.formattingSettings.surfaceSettingsCard.showSurface.value;
        const surfaceOpacity = this.formattingSettings.surfaceSettingsCard.surfaceOpacity.value / 100;
        const surfaceColorScheme = String(this.formattingSettings.surfaceSettingsCard.surfaceColorScheme.value.value);
        const surfaceColor = this.formattingSettings.surfaceSettingsCard.surfaceColor.value.value;

        // Determine column indices for protein data, title, format, and filepath
        let proteinIndex = -1;
        let titleIndex = -1;
        let formatIndex = -1;
        let filePathIndex = -1;
        
        if (dataView.table.columns && dataView.table.columns.length > 0) {
            for (let i = 0; i < dataView.table.columns.length; i++) {
                const roles = dataView.table.columns[i].roles;
                if (roles) {
                    if (roles["proteinData"] && proteinIndex === -1) {
                        proteinIndex = i;
                    }
                    if (roles["titleData"] && titleIndex === -1) {
                        titleIndex = i;
                    }
                    if (roles["formatData"] && formatIndex === -1) {
                        formatIndex = i;
                    }
                    if (roles["filePathData"] && filePathIndex === -1) {
                        filePathIndex = i;
                    }
                }
            }
        }
        
        // If no explicit protein column found, use first column if it exists
        if (proteinIndex === -1 && dataView.table.columns && dataView.table.columns.length > 0) {
            proteinIndex = 0;
        }
        
        // Exit if no valid protein column
        if (proteinIndex === -1) {
            console.log("No protein data column found");
            return;
        }

        // Filter valid protein data rows and collect titles, formats, and filepaths
        const validRows: { structure: string; title: string; format: string; filePath: string }[] = [];
        for (const row of dataView.table.rows) {
            const proteinData = row[proteinIndex];
            
            // Get filepath if available
            let filePath = "";
            if (filePathIndex >= 0 && row[filePathIndex] !== null && row[filePathIndex] !== undefined) {
                filePath = String(row[filePathIndex]).trim();
            }
            
            // Use filepath as structure data if protein data is empty but filepath is provided
            let structureData = "";
            if (proteinData !== null && proteinData !== undefined) {
                structureData = String(proteinData).trim();
            }
            
            if ((structureData !== "" && structureData !== "null" && structureData !== "undefined") || filePath !== "") {
                // Get format if available
                let format = "";
                if (formatIndex >= 0 && row[formatIndex] !== null && row[formatIndex] !== undefined) {
                    format = String(row[formatIndex]).trim().toLowerCase();
                }
                
                // If structure data is valid, use it; otherwise we'll try filepath
                if (structureData !== "" && structureData !== "null" && structureData !== "undefined") {
                    if (this.isValidStructureData(structureData, format)) {
                        // Get title if available
                        let title = "";
                        if (titleIndex >= 0 && row[titleIndex] !== null && row[titleIndex] !== undefined) {
                            title = String(row[titleIndex]).trim();
                        }
                        validRows.push({ structure: structureData, title: title, format: format, filePath: filePath });
                    }
                } else if (filePath !== "") {
                    // If we only have a filepath, add it for later loading
                    let title = "";
                    if (titleIndex >= 0 && row[titleIndex] !== null && row[titleIndex] !== undefined) {
                        title = String(row[titleIndex]).trim();
                    }
                    validRows.push({ structure: "", title: title, format: format, filePath: filePath });
                }
            }
        }

        if (validRows.length === 0) {
            console.log("No valid protein data found");
            return;
        }

        // Get viewport dimensions
        const viewportWidth = options.viewport.width;
        const viewportHeight = options.viewport.height;

        // Setup the grid of viewers
        this.setupViewerGrid(validRows.length, columns, backgroundColor, showTitles, titlePosition);

        // Configure style color scheme
        const styleConfig: any = {};
        if (colorScheme === "chain") {
            styleConfig.colorscheme = "chain";
        } else if (colorScheme === "residue") {
            styleConfig.colorscheme = "amino";
        } else if (colorScheme === "spectrum") {
            styleConfig.colorscheme = "spectrum";
        } else if (colorScheme === "ss") {
            styleConfig.colorscheme = "ssJmol";
        }

        // Configure surface color scheme (independent from main style)
        const surfaceConfig: any = { opacity: surfaceOpacity };
        if (surfaceColorScheme === "custom") {
            surfaceConfig.color = surfaceColor;
        } else if (surfaceColorScheme === "chain") {
            surfaceConfig.colorscheme = "chain";
        } else if (surfaceColorScheme === "residue") {
            surfaceConfig.colorscheme = "amino";
        } else if (surfaceColorScheme === "spectrum") {
            surfaceConfig.colorscheme = "spectrum";
        } else if (surfaceColorScheme === "ss") {
            surfaceConfig.colorscheme = "ssJmol";
        }

        // Custom chain color mapping
        const chainColorMap: { [key: string]: string } = {
            'A': chainAColor,
            'B': chainBColor,
            'C': chainCColor,
            'D': chainDColor
        };

        // Helper function to apply styling to a viewer
        const applyStyleToViewer = (viewer: $3Dmol.GLViewer, styleConfig: any, useCustomChainColors: boolean, chainColorMap: { [key: string]: string }, style: string, showSurface: boolean, surfaceConfig: any, spin: boolean) => {
            // Apply the main style
            if (useCustomChainColors) {
                // Apply custom colors for each chain
                for (const chain of ['A', 'B', 'C', 'D']) {
                    const chainStyle: any = { ...styleConfig };
                    chainStyle.color = chainColorMap[chain];
                    
                    if (style === "cartoon") {
                        viewer.setStyle({ chain: chain }, { cartoon: chainStyle });
                    } else if (style === "stick") {
                        viewer.setStyle({ chain: chain }, { stick: chainStyle });
                    } else if (style === "line") {
                        viewer.setStyle({ chain: chain }, { line: chainStyle });
                    } else if (style === "cross") {
                        viewer.setStyle({ chain: chain }, { cross: chainStyle });
                    } else if (style === "sphere") {
                        viewer.setStyle({ chain: chain }, { sphere: chainStyle });
                    } else if (style === "surface") {
                        viewer.setStyle({ chain: chain }, { cartoon: chainStyle });
                    }
                }
            } else {
                // Use color scheme for all atoms
                if (style === "cartoon") {
                    viewer.setStyle({}, { cartoon: styleConfig });
                } else if (style === "stick") {
                    viewer.setStyle({}, { stick: styleConfig });
                } else if (style === "line") {
                    viewer.setStyle({}, { line: styleConfig });
                } else if (style === "cross") {
                    viewer.setStyle({}, { cross: styleConfig });
                } else if (style === "sphere") {
                    viewer.setStyle({}, { sphere: styleConfig });
                } else if (style === "surface") {
                    viewer.setStyle({}, { cartoon: styleConfig });
                }
            }

            // Add surface overlay if enabled
            if (showSurface) {
                viewer.addSurface($3Dmol.SurfaceType.VDW, surfaceConfig);
            }

            // Zoom to fit structure
            viewer.zoomTo();

            // Enable/disable auto-rotation
            viewer.spin(spin);

            // Render the viewer
            viewer.render();
        };

        // Load each structure into its viewer
        for (let i = 0; i < validRows.length; i++) {
            const cell = this.viewers[i];
            const viewer = cell.viewer;
            
            // Set the title
            cell.titleDiv.textContent = validRows[i].title;
            
            // Clear previous models
            viewer.removeAllModels();
            viewer.removeAllSurfaces();

            // If we have a filepath but no structure data, try to load from filepath
            if (validRows[i].structure === "" && validRows[i].filePath !== "") {
                const filePath = validRows[i].filePath;
                const format = validRows[i].format || this.detectFormatFromPath(filePath);
                
                // Use 3Dmol's built-in file loading (works with URLs)
                try {
                    $3Dmol.download(`url:${filePath}`, viewer, { format: format }, () => {
                        applyStyleToViewer(viewer, styleConfig, useCustomChainColors, chainColorMap, style, showSurface, surfaceConfig, spin);
                    });
                } catch (error) {
                    console.error(`Error loading file ${i} from ${filePath}:`, error);
                }
            } else {
                // Load from structure data
                const structureData = this.normalizePdbData(validRows[i].structure);
                const format = this.detectFormat(structureData, validRows[i].format);

                // Add model to viewer
                try {
                    viewer.addModel(structureData, format);
                    applyStyleToViewer(viewer, styleConfig, useCustomChainColors, chainColorMap, style, showSurface, surfaceConfig, spin);
                } catch (error) {
                    console.error(`Error loading structure ${i}:`, error);
                    continue;
                }
            }
        }

        // Update grid container size
        this.gridContainer.style.width = viewportWidth + "px";
        this.gridContainer.style.height = viewportHeight + "px";

        // Resize all viewers
        for (const cell of this.viewers) {
            cell.viewer.resize();
        }
    }

    /**
     * Detect format from file path extension
     */
    private detectFormatFromPath(filePath: string): string {
        const lowerPath = filePath.toLowerCase();
        if (lowerPath.endsWith('.pdb')) return 'pdb';
        if (lowerPath.endsWith('.cif') || lowerPath.endsWith('.mmcif')) return 'cif';
        if (lowerPath.endsWith('.mol2')) return 'mol2';
        if (lowerPath.endsWith('.sdf') || lowerPath.endsWith('.mol')) return 'sdf';
        if (lowerPath.endsWith('.xyz')) return 'xyz';
        if (lowerPath.endsWith('.cube')) return 'cube';
        return 'pdb'; // default
    }

    /**
     * Returns properties pane formatting model content hierarchies, properties and latest formatting values, Then populate properties pane.
     * This method is called once every time we open properties pane or when the user edit any format property. 
     */
    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }
}