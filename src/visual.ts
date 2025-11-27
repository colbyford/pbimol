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

interface ViewerCell {
    container: HTMLElement;
    viewer: any;
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
        // Handle various line ending formats and normalize to LF
        let normalized = data.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        
        // Remove any null characters or other control characters (except newline and tab)
        normalized = normalized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
        
        return normalized.trim();
    }

    /**
     * Detect the format of molecular structure data
     */
    private detectFormat(data: string): string {
        const trimmed = data.trim();
        
        // CIF format detection - check for mmCIF/PDBx markers
        if (trimmed.includes("data_") || 
            trimmed.includes("_entry.id") || 
            trimmed.includes("_atom_site.") ||
            trimmed.includes("loop_")) {
            return "cif";
        }
        
        // PDB format - check for common PDB record types
        // Both full PDB files (with HEADER) and ATOM-only files should be detected
        const lines = trimmed.split('\n');
        for (const line of lines.slice(0, 20)) { // Check first 20 lines
            const recordType = line.substring(0, 6).trim().toUpperCase();
            if (['HEADER', 'ATOM', 'HETATM', 'MODEL', 'COMPND', 'SOURCE', 'TITLE', 'REMARK', 'SEQRES', 'CRYST1'].includes(recordType)) {
                return "pdb";
            }
        }
        
        // Default to PDB if we can't determine
        return "pdb";
    }

    /**
     * Validate that the structure data contains actual molecular data
     */
    private isValidStructureData(data: string): boolean {
        if (!data || data.length === 0) {
            return false;
        }
        
        const normalized = this.normalizePdbData(data);
        
        // Check for PDB ATOM/HETATM records
        if (normalized.includes('ATOM') || normalized.includes('HETATM')) {
            return true;
        }
        
        // Check for CIF atom site data
        if (normalized.includes('_atom_site.')) {
            return true;
        }
        
        return false;
    }

    /**
     * Create or reuse viewer cells for the grid
     */
    private setupViewerGrid(count: number, columns: number, cellWidth: number, cellHeight: number, backgroundColor: string): void {
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
            this.gridContainer.appendChild(container);
            
            const viewer = $3Dmol.createViewer(container, {
                backgroundColor: backgroundColor
            });
            
            this.viewers.push({ container, viewer });
        }
        
        // Update all viewer backgrounds
        for (const cell of this.viewers) {
            cell.viewer.setBackgroundColor(backgroundColor);
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
        const style = this.formattingSettings.displaySettingsCard.style.value.value;
        const colorScheme = this.formattingSettings.displaySettingsCard.colorScheme.value.value;
        const backgroundColor = this.formattingSettings.displaySettingsCard.backgroundColor.value.value;
        const spin = this.formattingSettings.displaySettingsCard.spin.value;
        const columns = this.formattingSettings.gridSettingsCard.columns.value;

        // Filter valid protein data rows
        const validRows: string[] = [];
        for (const row of dataView.table.rows) {
            const proteinData = row[0];
            if (proteinData !== null && proteinData !== undefined) {
                const structureData = String(proteinData).trim();
                if (structureData !== "" && structureData !== "null" && structureData !== "undefined") {
                    if (this.isValidStructureData(structureData)) {
                        validRows.push(structureData);
                    }
                }
            }
        }

        if (validRows.length === 0) {
            console.log("No valid protein data found");
            return;
        }

        // Calculate cell dimensions
        const viewportWidth = options.viewport.width;
        const viewportHeight = options.viewport.height;
        const cols = columns > 0 ? columns : Math.ceil(Math.sqrt(validRows.length));
        const rows = Math.ceil(validRows.length / cols);
        const cellWidth = viewportWidth / cols;
        const cellHeight = viewportHeight / rows;

        // Setup the grid of viewers
        this.setupViewerGrid(validRows.length, columns, cellWidth, cellHeight, backgroundColor);

        // Configure style
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

        // Load each structure into its viewer
        for (let i = 0; i < validRows.length; i++) {
            const viewer = this.viewers[i].viewer;
            const structureData = this.normalizePdbData(validRows[i]);
            const format = this.detectFormat(structureData);
            
            // Clear previous models
            viewer.removeAllModels();
            viewer.removeAllSurfaces();

            // Add model to viewer
            try {
                viewer.addModel(structureData, format);
            } catch (error) {
                console.error(`Error loading structure ${i}:`, error);
                continue;
            }

            // Apply the style
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
                viewer.addSurface($3Dmol.SurfaceType.VDW, { opacity: 0.85 });
            }

            // Zoom to fit structure
            viewer.zoomTo();

            // Enable/disable auto-rotation
            viewer.spin(spin);

            // Render the viewer
            viewer.render();
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
     * Returns properties pane formatting model content hierarchies, properties and latest formatting values, Then populate properties pane.
     * This method is called once every time we open properties pane or when the user edit any format property. 
     */
    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }
}