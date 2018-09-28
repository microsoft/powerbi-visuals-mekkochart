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
    axisStyle
} from "powerbi-visuals-utils-chartutils";
import { valueFormatter as vf } from "powerbi-visuals-utils-formattingutils";
import valueFormatter = vf.valueFormatter;

import IAxisProperties = axisInterfaces.IAxisProperties;
import DataViewObject = powerbi.DataViewObject;
import IViewport = powerbi.IViewport;
import DataViewMetadataColumn = powerbi.DataViewMetadataColumn;

import * as columnChart from "./../columnChart/columnChartVisual";
import {
    MekkoCalculateScaleAndDomainOptions,
    MekkoChartAxisProperties,
} from "./../dataInterfaces";

    export interface AxesLabels {
        xAxisLabel: string;
        yAxisLabel: string;
    }

    /**
     * Returns a boolean, that indicates if y axis title should be displayed.
     * @return True if y axis title should be displayed,
     * otherwise false.
     */
    export function shouldShowYAxisLabel(
        layerNumber: number,
        valueAxisProperties: DataViewObject,
        yAxisWillMerge: boolean): boolean {

        return (layerNumber === 0
            && !!valueAxisProperties
            && !!valueAxisProperties["showAxisTitle"])
            || (layerNumber === 1
                && !yAxisWillMerge
                && !!valueAxisProperties
                && !!valueAxisProperties["secShowAxisTitle"]);
    }

    /**
     * Computes the Cartesian Chart axes from the set of layers.
     */
    export function calculateAxes(
        layers: columnChart.IColumnChart[],
        viewport: IViewport,
        margin: IMargin,
        categoryAxisProperties: DataViewObject,
        valueAxisProperties: DataViewObject,
        scrollbarVisible: boolean,
        existingAxisProperties: MekkoChartAxisProperties): MekkoChartAxisProperties {

        const visualOptions: MekkoCalculateScaleAndDomainOptions = {
            viewport,
            margin,
            forcedXDomain: [
                categoryAxisProperties
                    ? categoryAxisProperties["start"]
                    : null,
                categoryAxisProperties
                    ? categoryAxisProperties["end"]
                    : null
            ],
            forceMerge: valueAxisProperties && valueAxisProperties["secShow"] === false,
            showCategoryAxisLabel: false,
            showValueAxisLabel: false,
            categoryAxisScaleType: categoryAxisProperties && categoryAxisProperties["axisScale"] != null
                ? <string>categoryAxisProperties["axisScale"]
                : axisScale.linear,
            valueAxisScaleType: valueAxisProperties && valueAxisProperties["axisScale"] != null
                ? <string>valueAxisProperties["axisScale"]
                : axisScale.linear,
            trimOrdinalDataOnOverflow: false
        };

        if (valueAxisProperties) {
            visualOptions.forcedYDomain = AxisHelper.applyCustomizedDomain(
                [
                    valueAxisProperties["start"],
                    valueAxisProperties["end"]
                ],
                visualOptions.forcedYDomain);
        }

        let result: MekkoChartAxisProperties;

        for (let layerNumber: number = 0; layerNumber < layers.length; layerNumber++) {
            const currentLayer: columnChart.IColumnChart = layers[layerNumber];

            visualOptions.showCategoryAxisLabel = !!categoryAxisProperties
                && !!categoryAxisProperties["showAxisTitle"];

            visualOptions.showValueAxisLabel = shouldShowYAxisLabel(
                layerNumber,
                valueAxisProperties,
                false);

            const axes: IAxisProperties[] = currentLayer.calculateAxesProperties(visualOptions);

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
        categoryAxisProperties: DataViewObject,
        valueAxisProperties: DataViewObject,
        category: DataViewMetadataColumn,
        values: DataViewMetadataColumn[]): AxesLabels {

        let xAxisLabel: string = null,
            yAxisLabel: string = null;

        if (categoryAxisProperties) {
            // Take the value only if it's there
            if (category && category.displayName) {
                xAxisLabel = category.displayName;
            }
        }

        if (valueAxisProperties) {
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
        }

        return {
            xAxisLabel,
            yAxisLabel
        };
    }
