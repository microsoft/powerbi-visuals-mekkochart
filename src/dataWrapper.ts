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

import { axis as AxisHelper } from "powerbi-visuals-utils-chartutils";
import { valueType } from "powerbi-visuals-utils-typeutils";

import {
    MekkoChartBaseSeries,
    MekkoChartBaseData,
    MekkoChartDataPoint
} from "./dataInterfaces";


// powerbi.extensibility.utils.type
import ValueType = valueType.ValueType;

export class DataWrapper {
    private static HighlightedIndexFactor: number = 2;

    private data: MekkoChartBaseData;
    private isScalar: boolean;

    public constructor(columnChartData: MekkoChartBaseData, isScalar: boolean) {
        this.data = columnChartData;
        this.isScalar = isScalar;
    }

    public lookupXValue(index: number, type: ValueType): any {
        const isDateTime: boolean = AxisHelper.isDateTime(type);

        if (isDateTime && this.isScalar) {
            return new Date(index);
        }

        if (type.text) {
            return this.data.categories[index];
        }

        const firstSeries: MekkoChartBaseSeries = this.data.series[0];

        if (firstSeries) {
            const dataPoints: MekkoChartDataPoint[] = firstSeries.data;

            if (dataPoints) {
                if (this.data.hasHighlights) {
                    index = index * DataWrapper.HighlightedIndexFactor;
                }

                const dataPoint: MekkoChartDataPoint = dataPoints[index];

                if (dataPoint) {
                    if (isDateTime) {
                        return new Date(dataPoint.categoryValue);
                    }

                    return dataPoint.categoryValue;
                }
            }
        }

        return index;
    }
}
