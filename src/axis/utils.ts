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
import powerbi from "powerbi-visuals-api";
import { IMargin } from "powerbi-visuals-utils-svgutils";
import {
    axis as AxisHelper,
    axisInterfaces,
    axisScale,
} from "powerbi-visuals-utils-chartutils";
import { valueFormatter } from "powerbi-visuals-utils-formattingutils";

import IAxisProperties = axisInterfaces.IAxisProperties;
import IViewport = powerbi.IViewport;
import DataViewMetadataColumn = powerbi.DataViewMetadataColumn;

import * as columnChart from "./../columnChart/columnChartVisual";
import {
    MekkoCalculateScaleAndDomainOptions,
    MekkoChartAxisProperties,
} from "./../dataInterfaces";
import { CategoryAxisSettings, ValueAxisSettings, VisualFormattingSettingsModel } from "../settings";

    export interface AxesLabels {
        xAxisLabel: string;
        yAxisLabel: string;
    }

    /**
     * Computes the Cartesian Chart axes from the set of layers.
     */
    export function calculateAxes(
        layers: columnChart.IColumnChart[],
        viewport: IViewport,
        margin: IMargin,
        categoryAxisSettings: CategoryAxisSettings,
        valueAxisSettings: ValueAxisSettings,
        settingsModel: VisualFormattingSettingsModel): MekkoChartAxisProperties {
        const visualOptions: MekkoCalculateScaleAndDomainOptions = {
            viewport,
            margin,
            forcedXDomain: [null, null],
            forceMerge: false,
            showCategoryAxisLabel: false,
            showValueAxisLabel: false,
            categoryAxisScaleType: axisScale.linear,
            valueAxisScaleType: axisScale.linear,
            trimOrdinalDataOnOverflow: false
        };

        visualOptions.forcedYDomain = AxisHelper.applyCustomizedDomain([null, null], visualOptions.forcedYDomain);

        let result: MekkoChartAxisProperties;

        for (let layerNumber: number = 0; layerNumber < layers.length; layerNumber++) {
            const currentLayer: columnChart.IColumnChart = layers[layerNumber];

            visualOptions.showCategoryAxisLabel = categoryAxisSettings.showTitle.value && categoryAxisSettings.show.value;

            visualOptions.showValueAxisLabel = valueAxisSettings.showTitle.value && valueAxisSettings.show.value;

            const axes: IAxisProperties[] = currentLayer.calculateAxesProperties(visualOptions, settingsModel);

            if (layerNumber === 0) {
                result = {
                    x: axes[0],
                    y1: axes[1]
                };
            }

            result.x.willLabelsFit = false;
            result.x.willLabelsWordBreak = false;
        }

        return result;
    }

    export function createAxesLabels(
        category: DataViewMetadataColumn,
        values: DataViewMetadataColumn[]): AxesLabels {

        let xAxisLabel: string = null,
            yAxisLabel: string = null;

        // Take the value only if it's there
        if (category && category.displayName) {
            xAxisLabel = category.displayName;
        }

        if (values) {
            // Take the name from the values, and make it unique because there are sometimes duplications
            const valuesNames: string[] = values
                .map((metadata: DataViewMetadataColumn) => {
                    return metadata
                        ? metadata.displayName
                        : "";
                })
                .filter((value: string, index: number, self: string[]) => {
                    return value !== "" && self.indexOf(value) === index;
                });

            yAxisLabel = valueFormatter.formatListAnd(valuesNames);
        }

        return {
            xAxisLabel,
            yAxisLabel
        };
    }
