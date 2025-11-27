/*
 *  Power BI Visualizations
 *
 *  Copyright (c) Microsoft Corporation and Tuple, LLC.
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
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

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

import FormattingSettingsCard = formattingSettings.SimpleCard;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;

/**
 * Display Settings Formatting Card
 */
class DisplaySettingsCard extends FormattingSettingsCard {
    style = new formattingSettings.ItemDropdown({
        name: "style",
        displayName: "Protein Style",
        items: [
            { value: "cartoon", displayName: "Cartoon" },
            { value: "stick", displayName: "Stick" },
            { value: "line", displayName: "Line" },
            { value: "cross", displayName: "Cross" },
            { value: "sphere", displayName: "Sphere" },
            { value: "surface", displayName: "Surface" }
        ],
        value: { value: "cartoon", displayName: "Cartoon" }
    });

    colorScheme = new formattingSettings.ItemDropdown({
        name: "colorScheme",
        displayName: "Color Scheme",
        items: [
            { value: "chain", displayName: "By Chain" },
            { value: "residue", displayName: "By Residue" },
            { value: "spectrum", displayName: "Spectrum" },
            { value: "ss", displayName: "Secondary Structure" },
            { value: "default", displayName: "Default" }
        ],
        value: { value: "default", displayName: "Default" }
    });

    backgroundColor = new formattingSettings.ColorPicker({
        name: "backgroundColor",
        displayName: "Background Color",
        value: { value: "#FFFFFF" }
    });

    spin = new formattingSettings.ToggleSwitch({
        name: "spin",
        displayName: "Auto Rotate",
        value: false
    });

    useCustomChainColors = new formattingSettings.ToggleSwitch({
        name: "useCustomChainColors",
        displayName: "Use Custom Chain Colors",
        description: "Enable custom colors for each chain",
        value: false
    });

    chainAColor = new formattingSettings.ColorPicker({
        name: "chainAColor",
        displayName: "Chain A Color",
        value: { value: "#00FF00" }
    });

    chainBColor = new formattingSettings.ColorPicker({
        name: "chainBColor",
        displayName: "Chain B Color",
        value: { value: "#00FFFF" }
    });

    chainCColor = new formattingSettings.ColorPicker({
        name: "chainCColor",
        displayName: "Chain C Color",
        value: { value: "#FF00FF" }
    });

    chainDColor = new formattingSettings.ColorPicker({
        name: "chainDColor",
        displayName: "Chain D Color",
        value: { value: "#FFFF00" }
    });

    name: string = "displaySettings";
    displayName: string = "Display Settings";
    slices: Array<FormattingSettingsSlice> = [this.style, this.colorScheme, this.backgroundColor, this.spin, this.useCustomChainColors, this.chainAColor, this.chainBColor, this.chainCColor, this.chainDColor];
}

/**
 * Grid Settings Formatting Card
 */
class GridSettingsCard extends FormattingSettingsCard {
    columns = new formattingSettings.NumUpDown({
        name: "columns",
        displayName: "Columns",
        description: "Number of columns in the grid (0 for auto)",
        value: 0
    });

    showTitles = new formattingSettings.ToggleSwitch({
        name: "showTitles",
        displayName: "Show Titles",
        description: "Display molecule titles in each cell",
        value: true
    });

    titlePosition = new formattingSettings.ItemDropdown({
        name: "titlePosition",
        displayName: "Title Position",
        description: "Position of the title in each cell",
        items: [
            { value: "top-left", displayName: "Top Left" },
            { value: "top-center", displayName: "Top Center" },
            { value: "top-right", displayName: "Top Right" },
            { value: "bottom-left", displayName: "Bottom Left" },
            { value: "bottom-center", displayName: "Bottom Center" },
            { value: "bottom-right", displayName: "Bottom Right" }
        ],
        value: { value: "top-center", displayName: "Top Center" }
    });

    name: string = "gridSettings";
    displayName: string = "Grid Settings";
    slices: Array<FormattingSettingsSlice> = [this.columns, this.showTitles, this.titlePosition];
}

/**
 * Surface Settings Formatting Card
 */
class SurfaceSettingsCard extends FormattingSettingsCard {
    showSurface = new formattingSettings.ToggleSwitch({
        name: "showSurface",
        displayName: "Show Surface",
        description: "Display a translucent surface overlay on the structure",
        value: false
    });

    surfaceOpacity = new formattingSettings.Slider({
        name: "surfaceOpacity",
        displayName: "Surface Opacity",
        description: "Opacity of the surface (0-100%)",
        value: 70
    });

    surfaceColorScheme = new formattingSettings.ItemDropdown({
        name: "surfaceColorScheme",
        displayName: "Surface Color Scheme",
        items: [
            { value: "chain", displayName: "By Chain" },
            { value: "residue", displayName: "By Residue" },
            { value: "spectrum", displayName: "Spectrum" },
            { value: "ss", displayName: "Secondary Structure" },
            { value: "custom", displayName: "Custom Color" },
            { value: "default", displayName: "Default" }
        ],
        value: { value: "default", displayName: "Default" }
    });

    surfaceColor = new formattingSettings.ColorPicker({
        name: "surfaceColor",
        displayName: "Surface Color",
        description: "Custom surface color (when Color Scheme is Custom)",
        value: { value: "#808080" }
    });

    name: string = "surfaceSettings";
    displayName: string = "Surface Settings";
    slices: Array<FormattingSettingsSlice> = [this.showSurface, this.surfaceOpacity, this.surfaceColorScheme, this.surfaceColor];
}

/**
* visual settings model class
*
*/
export class VisualFormattingSettingsModel extends FormattingSettingsModel {
    // Create formatting settings model formatting cards
    displaySettingsCard = new DisplaySettingsCard();
    gridSettingsCard = new GridSettingsCard();
    surfaceSettingsCard = new SurfaceSettingsCard();

    cards = [this.displaySettingsCard, this.gridSettingsCard, this.surfaceSettingsCard];
}
