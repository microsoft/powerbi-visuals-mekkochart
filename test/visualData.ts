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

// powerbi.extensibility.utils.type
import { valueType } from "powerbi-visuals-utils-typeutils";
import ValueType = valueType.ValueType;
import ExtendedType = valueType.ExtendedType;

import { getRandomNumbers, getRandomNumber, testDataViewBuilder } from "powerbi-visuals-utils-testutils";

// powerbi.extensibility.utils.test
import TestDataViewBuilder = testDataViewBuilder.TestDataViewBuilder;
import { DataViewBuilderValuesColumnOptions } from "powerbi-visuals-utils-testutils/lib/dataViewBuilder/dataViewBuilder";

export class MekkoChartData extends TestDataViewBuilder {
    private static DefaultFormat: string = "\"$\"#,##0;\\(\"$\"#,##0\\)";

    private static MinValue: number = 1000;
    private static MaxValue: number = 100000;

    public static ColumnCategory: string = "Name";
    public static ColumnSeries: string = "Territory";
    public static ColumnY: string = "This Year Sales";
    public static ColumnWidth: string = "Sum Total Units This Year";

    public valuesCategorySeries: string[][] = [
        ["William", "DE"],
        ["James", "GA"],
        ["Harper", "KY"],
        ["Aiden", "MD"],
        ["Lucas", "NC"],
        ["Daniel", "OH"],
        ["Henry", "PA"],
        ["Olivia", "SC"],
        ["Ella", "TN"],
        ["Carter", "VA"],
        ["Logan", "WV"],
        ["James", "TN"],
        ["Aiden", "DE"],
        ["Daniel", "KY"],
        ["Henry", "SC"],
        ["Olivia", "NC"],
        ["Ella", "VA"],
        ["Logan", "MD"],
    ];

    public valuesY: number[] = getRandomNumbers(
        this.valuesCategorySeries.length,
        MekkoChartData.MinValue,
        MekkoChartData.MaxValue);

    public valuesWidth: number[] = getRandomNumbers(
        this.valuesCategorySeries.length,
        MekkoChartData.MinValue,
        MekkoChartData.MaxValue);

    // the data set with unique items in each category
    // one series value belongs to only one category
    public specificValuesCategorySeries: string[][] = [
        ["Russia", "Moscow"],
        ["Russia", "St. Petersburg"],
        ["Russia", "Kazan"],
        ["Germany", "Berlin"],
        ["Germany", "Cologne"],
        ["Germany", "Frankfurt am Main"],
        ["USA", "Redmond"],
        ["USA", "Seattle"],
        ["USA", "Bellevue"],
    ];

    public specificValuesY: number[] = getRandomNumbers(
        this.specificValuesCategorySeries.length,
        MekkoChartData.MinValue,
        MekkoChartData.MaxValue);

    public specificValuesWidth: number[] = getRandomNumbers(
        this.specificValuesCategorySeries.length,
        MekkoChartData.MinValue,
        MekkoChartData.MaxValue);

    public getDataView(columnNames?: string[], withHighLights: boolean = false): powerbi.DataView {

        let columns: DataViewBuilderValuesColumnOptions[] = [
            {
                source: {
                    displayName: MekkoChartData.ColumnY,
                    format: MekkoChartData.DefaultFormat,
                    roles: { Y: true },
                    isMeasure: true,
                    type: ValueType.fromDescriptor({ extendedType: ExtendedType.Numeric })
                },
                values: this.valuesY
            },
            {
                source: {
                    displayName: MekkoChartData.ColumnWidth,
                    format: MekkoChartData.DefaultFormat,
                    roles: { Width: true },
                    isMeasure: true,
                    type: ValueType.fromDescriptor({ extendedType: ExtendedType.Numeric })
                },
                values: this.valuesWidth
            }
        ];

        let dataView = this.createCategoricalDataViewBuilder([
            {
                source: {
                    displayName: MekkoChartData.ColumnCategory,
                    roles: { Category: true },
                    type: ValueType.fromDescriptor({ extendedType: ExtendedType.Text })
                },
                values: this.valuesCategorySeries.map((values: string[]) => values[0])
            },
            {
                isGroup: true,
                source: {
                    displayName: MekkoChartData.ColumnSeries,
                    roles: { Series: true },
                    type: ValueType.fromDescriptor({ extendedType: ExtendedType.Text })
                },
                values: this.valuesCategorySeries.map((values: string[]) => values[1]),
            }
        ], columns, columnNames).build();

        if (withHighLights) {
            const highlightedSeriesNumber: number = Math.ceil(getRandomNumber(0, dataView.categorical.values.length - 1));
            const seriesLength: number = dataView.categorical.values[0].values.length;
            const seriesCount: number = dataView.categorical.values.length;
            const highlightedSeriesValues: powerbi.PrimitiveValue[] = dataView.categorical.values[highlightedSeriesNumber].values;

            let notNullableValuesIndexes: number[] = [];
            for (let i = 0; i < seriesLength; i++) {
                if (highlightedSeriesValues[i]) {
                    notNullableValuesIndexes.push(i);
                }
            }

            const highlightedElementNumber: number = notNullableValuesIndexes[Math.ceil(getRandomNumber(0, notNullableValuesIndexes.length - 1))];
            for (let i = 0; i < seriesCount; i++) {
                let highLights: powerbi.PrimitiveValue[] = new Array(seriesLength).fill(null);
                if (i === highlightedSeriesNumber) {
                    highLights[highlightedElementNumber] = highlightedSeriesValues[highlightedElementNumber];
                }
                dataView.categorical.values[i].highlights = highLights;
            }
        }

        return dataView;
    }

    public getSpecificDataView(columnNames?: string[]): powerbi.DataView {
        return this.createCategoricalDataViewBuilder([
            {
                source: {
                    displayName: MekkoChartData.ColumnCategory,
                    roles: { Category: true },
                    type: ValueType.fromDescriptor({ extendedType: ExtendedType.Numeric })
                },
                values: this.specificValuesCategorySeries.map((values: string[]) => values[0])
            },
            {
                isGroup: true,
                source: {
                    displayName: MekkoChartData.ColumnSeries,
                    roles: { Series: true },
                    type: ValueType.fromDescriptor({ extendedType: ExtendedType.Numeric })
                },
                values: this.specificValuesCategorySeries.map((values: string[]) => values[1]),
            }
        ], [
                {
                    source: {
                        displayName: MekkoChartData.ColumnY,
                        format: MekkoChartData.DefaultFormat,
                        roles: { Y: true },
                        isMeasure: true,
                        type: ValueType.fromDescriptor({ extendedType: ExtendedType.Numeric })
                    },
                    values: this.specificValuesY
                },
                {
                    source: {
                        displayName: MekkoChartData.ColumnWidth,
                        format: MekkoChartData.DefaultFormat,
                        roles: { Width: true },
                        isMeasure: true,
                        type: ValueType.fromDescriptor({ extendedType: ExtendedType.Numeric })
                    },
                    values: this.specificValuesWidth
                }], columnNames).build();
    }
}