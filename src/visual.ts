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

export class Visual implements IVisual {
    private target: HTMLElement;
    private viewerContainer: HTMLElement;
    private viewer: any;
    private formattingSettings: VisualFormattingSettingsModel;
    private formattingSettingsService: FormattingSettingsService;

    constructor(options: VisualConstructorOptions) {
        console.log('Visual constructor', options);
        this.formattingSettingsService = new FormattingSettingsService();
        this.target = options.element;
        
        // Create container for 3Dmol viewer
        this.viewerContainer = document.createElement("div");
        this.viewerContainer.style.width = "100%";
        this.viewerContainer.style.height = "100%";
        this.viewerContainer.style.position = "relative";
        this.target.appendChild(this.viewerContainer);

        // Initialize 3Dmol viewer
        this.viewer = $3Dmol.createViewer(this.viewerContainer, {
            backgroundColor: 'white'
        });
    }

    public update(options: VisualUpdateOptions) {
        this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(VisualFormattingSettingsModel, options.dataViews[0]);

        console.log('Visual update', options);

        // Clear previous models
        this.viewer.removeAllModels();

        // Get data from Power BI
        const dataView: DataView = options.dataViews[0];
        
        if (!dataView || !dataView.table || !dataView.table.rows || dataView.table.rows.length === 0) {
            console.log("No data available");
            return;
        }

        // Get the first row (protein structure data)
        const proteinData = dataView.table.rows[0][0];
        
        if (!proteinData || proteinData === null || proteinData === undefined) {
            console.log("No protein data found");
            return;
        }

        // Convert to string if needed
        const structureData = String(proteinData).trim();
        
        if (structureData === "" || structureData === "null" || structureData === "undefined") {
            console.log("Invalid protein data");
            return;
        }

        // Detect format (PDB or CIF)
        let format = "pdb";
        if (structureData.includes("data_") || structureData.includes("_entry.id")) {
            format = "cif";
        }

        // Add model to viewer
        try {
            this.viewer.addModel(structureData, format);
        } catch (error) {
            console.error("Error loading structure:", error);
            return;
        }

        // Get formatting settings
        const style = this.formattingSettings.displaySettingsCard.style.value.value;
        const colorScheme = this.formattingSettings.displaySettingsCard.colorScheme.value.value;
        const backgroundColor = this.formattingSettings.displaySettingsCard.backgroundColor.value.value;
        const spin = this.formattingSettings.displaySettingsCard.spin.value;
        const quality = this.formattingSettings.displaySettingsCard.quality.value.value;

        // Apply style and color
        const styleConfig: any = {};
        
        // Configure color scheme
        if (colorScheme === "chainHetatm") {
            styleConfig.colorscheme = "chainHetatm";
        } else if (colorScheme === "residue") {
            styleConfig.colorscheme = "amino";
        } else if (colorScheme === "spectrum") {
            styleConfig.colorscheme = "spectrum";
        } else if (colorScheme === "ss") {
            styleConfig.colorscheme = "ssJmol";
        }

        // Apply the style
        if (style === "cartoon") {
            this.viewer.setStyle({}, { cartoon: styleConfig });
        } else if (style === "stick") {
            this.viewer.setStyle({}, { stick: styleConfig });
        } else if (style === "line") {
            this.viewer.setStyle({}, { line: styleConfig });
        } else if (style === "cross") {
            this.viewer.setStyle({}, { cross: styleConfig });
        } else if (style === "sphere") {
            this.viewer.setStyle({}, { sphere: styleConfig });
        } else if (style === "surface") {
            this.viewer.setStyle({}, { cartoon: styleConfig });
            this.viewer.addSurface($3Dmol.SurfaceType.VDW, { opacity: 0.85 });
        }

        // Set background color
        this.viewer.setBackgroundColor(backgroundColor);

        // Zoom to fit structure
        this.viewer.zoomTo();

        // Enable/disable auto-rotation
        if (spin) {
            this.viewer.spin(true);
        } else {
            this.viewer.spin(false);
        }

        // Render the viewer
        this.viewer.render();

        // Resize viewer when container size changes
        this.viewerContainer.style.width = options.viewport.width + "px";
        this.viewerContainer.style.height = options.viewport.height + "px";
        this.viewer.resize();
    }

    /**
     * Returns properties pane formatting model content hierarchies, properties and latest formatting values, Then populate properties pane.
     * This method is called once every time we open properties pane or when the user edit any format property. 
     */
    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }
}