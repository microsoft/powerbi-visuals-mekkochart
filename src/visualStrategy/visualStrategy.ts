/*
 *  Power BI Visualizations
 *
 *  Copyright (c) Microsoft Corporation
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

import { axisInterfaces } from "powerbi-visuals-utils-chartutils";
import NumberRange = powerbi.NumberRange;

import {
    MekkoChartData,
    MekkoChartContext,
    MekkoChartDrawInfo
} from "./../dataInterfaces";

import IAxisProperties = axisInterfaces.IAxisProperties;
import powerbi from "powerbi-visuals-api";
import { VisualFormattingSettingsModel } from "../settings";

export interface IVisualStrategy {
    setData(data: MekkoChartData): void;
    setupVisualProps(columnChartProps: MekkoChartContext): void;
    setXScale(
        is100Pct: boolean,
        settingsModel: VisualFormattingSettingsModel,
        forcedTickCount?: number,
        forcedXDomain?: any[],
        axisScaleType?: string,
        axisDisplayUnits?: number,
        axisPrecision?: number,
        ensureXDomain?: NumberRange): IAxisProperties;
    setYScale(
        is100Pct: boolean,
        forcedTickCount?: number,
        forcedYDomain?: any[],
        axisScaleType?: string,
        axisDisplayUnits?: number,
        axisPrecision?: number,
        ensureYDomain?: NumberRange): IAxisProperties;
    drawColumns(useAnimation: boolean, settingsModel: VisualFormattingSettingsModel): MekkoChartDrawInfo;
    selectColumn(selectedColumnIndex: number, lastSelectedColumnIndex: number): void;
    getClosestColumnIndex(x: number): number;
}
