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
        value: { value: "chain", displayName: "By Chain" }
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

    // quality = new formattingSettings.ItemDropdown({
    //     name: "quality",
    //     displayName: "Rendering Quality",
    //     items: [
    //         { value: "low", displayName: "Low" },
    //         { value: "medium", displayName: "Medium" },
    //         { value: "high", displayName: "High" }
    //     ],
    //     value: { value: "medium", displayName: "Medium" }
    // });

    name: string = "displaySettings";
    displayName: string = "Display Settings";
    // slices: Array<FormattingSettingsSlice> = [this.style, this.colorScheme, this.backgroundColor, this.spin, this.quality];
    slices: Array<FormattingSettingsSlice> = [this.style, this.colorScheme, this.backgroundColor, this.spin];
}

/**
* visual settings model class
*
*/
export class VisualFormattingSettingsModel extends FormattingSettingsModel {
    // Create formatting settings model formatting cards
    displaySettingsCard = new DisplaySettingsCard();

    cards = [this.displaySettingsCard];
}
