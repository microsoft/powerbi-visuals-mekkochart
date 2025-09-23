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
import { legendInterfaces } from "powerbi-visuals-utils-chartutils";
import * as formattingUtils from "./../formattingUtils";
import { max, sum, min } from "d3-array";

import ISandboxExtendedColorPalette = powerbi.extensibility.ISandboxExtendedColorPalette;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import DataViewCategorical = powerbi.DataViewCategorical;
import DataViewMetadataColumn = powerbi.DataViewMetadataColumn;
import DataViewObjects = powerbi.DataViewObjects;
import PrimitiveValue = powerbi.PrimitiveValue;
import DataViewValueColumnGroup = powerbi.DataViewValueColumnGroup;
import ISelectionId = powerbi.visuals.ISelectionId;
import DataViewValueColumn = powerbi.DataViewValueColumn;
import DataViewCategoryColumn = powerbi.DataViewCategoryColumn;
import DataViewValueColumns = powerbi.DataViewValueColumns;

import { MekkoChart } from "./../visual";
import {
    MekkoLegendDataPoint,
    ICategotyValuesStatsCollection,
    IFilteredValueGroups,
    LegendSeriesInfo
} from "./../dataInterfaces";

// powerbi.extensibility.utils.chart
import LegendIcon = legendInterfaces.MarkerShape;
import ILegendData = legendInterfaces.LegendData;

// formattingUtils
import getFormattedLegendLabel = formattingUtils.getFormattedLegendLabel;

import { ConverterStrategy } from "./converterStrategy";
import { dataViewObjects } from "powerbi-visuals-utils-dataviewutils";
import { VisualFormattingSettingsModel } from "../settings";

export class BaseConverterStrategy implements ConverterStrategy {
    private static WidthColumnName: string = "Width";
    private static YColumnName: string = "Y";

    private static SortField: string = "categoryValue";
    private static DefaultLegendLabelColor: string = "black";

    private dataView: DataViewCategorical;
    private visualHost: IVisualHost;

    constructor(dataView: DataViewCategorical, visualHost: IVisualHost) {
        this.dataView = dataView;
        this.visualHost = visualHost;
    }

    private static hasRole(column: DataViewMetadataColumn, name: string): boolean {
        return column.roles && column.roles[name];
    }

    public getLegend(colorPalette: ISandboxExtendedColorPalette, settingsModel: VisualFormattingSettingsModel): LegendSeriesInfo {
        const legend: MekkoLegendDataPoint[] = [];
        const seriesSources: DataViewMetadataColumn[] = [];
        const seriesObjects: DataViewObjects[][] = [];

        let grouped: boolean = false;
        let legendTitle: string = undefined;

        const categoryFieldIndex: number = 0;
        const categoryMaxValues: ICategotyValuesStatsCollection = {};
        this.dataView.categories[categoryFieldIndex].values.forEach((category, index) => {
            categoryMaxValues[index] = {
                category: category,
                maxValueOfCategory: max(this.dataView.values.map(v => <number>v.values[index])),
                maxItemOfCategory: sum(this.dataView.values.map(v => <number>v.values[index] !== undefined ? 1 : 0)),
                minValueOfCategory: min(this.dataView.values.map(v => <number>v.values[index]))
            };
        });

        // find base color identity
        // todo handle color change of
        const valueGroups: DataViewValueColumnGroup[] = this.dataView.values.grouped();
        const categoryItemsCount: Array<IFilteredValueGroups[]> = [];

        this.dataView.categories[categoryFieldIndex].values.forEach((category: PrimitiveValue, index: number) => {
            // gradiend start color
            const mappedItems: IFilteredValueGroups[] = [];
            valueGroups.forEach(group => {
                if (group.values[0].values[index] !== null) {
                    mappedItems.push(<IFilteredValueGroups>{
                        gr: group,
                        categoryValue: group.values[0].values[index],
                        categoryIndex: index,
                        category: category || "",
                        identity: group.identity
                    });
                }
            });
            categoryItemsCount[index] = mappedItems;
        });

        if (this.dataView && this.dataView.values) {
            const allValues: DataViewValueColumns = this.dataView.values;
            const valueGroups: DataViewValueColumnGroup[] = allValues.grouped();
            const hasDynamicSeries: boolean = !!(allValues && allValues.source);

            for (let valueGroupsIndex: number = 0; valueGroupsIndex < valueGroups.length; valueGroupsIndex++) {
                const valueGroup: DataViewValueColumnGroup = valueGroups[valueGroupsIndex];
                const valueGroupObjects: DataViewObjects = valueGroup.objects;
                const values: DataViewValueColumn[] = valueGroup.values;

                for (let valueIndex: number = 0; valueIndex < values.length; valueIndex++) {
                    const series: DataViewValueColumn = values[valueIndex];
                    const source: DataViewMetadataColumn = series.source;

                    // Gradient measures do not create series.
                    if (BaseConverterStrategy.hasRole(source, BaseConverterStrategy.WidthColumnName)
                        && !BaseConverterStrategy.hasRole(source, BaseConverterStrategy.YColumnName)) {

                        continue;
                    }

                    seriesSources.push(source);
                    seriesObjects.push(series.objects);

                    const categoryColumn: DataViewCategoryColumn = {
                        source: series.source,
                        identity: [series.identity],
                        values: undefined
                    };

                    const selectionId: ISelectionId = this.visualHost.createSelectionIdBuilder()
                        .withCategory(categoryColumn, 0)
                        .createSelectionId();

                    const label: string = getFormattedLegendLabel(source, allValues);
                    let category: string;

                    const categoryIndex: number = series.values.findIndex(value => typeof value !== "undefined" && value !== null);

                    let color: string;
                    if (hasDynamicSeries){
                        const colorFromPallete: string = colorPalette.getColor(source.groupName.toString()).value;
                        const dataPointFillColor = dataViewObjects.getFillColor(valueGroupObjects || source.objects, MekkoChart.Properties.dataPoint.fill);
                        color = dataPointFillColor ?? colorFromPallete;
                    }
                    else {
                        color = settingsModel.dataPoint.defaultColor.value.value;
                    }

                    legend.push({
                        color: colorPalette.isHighContrast ? colorPalette.foreground.value : color,
                        label,
                        markerShape: LegendIcon.circle,
                        identity: selectionId,
                        selected: false,
                        valueSum: sum(<number[]>series.values),
                        categoryValues: series.values,
                        category: category,
                        categorySort: this.dataView.categories[categoryFieldIndex].values[categoryIndex]
                    });

                    if (series.identity && source.groupName !== undefined) {
                        grouped = true;
                    }
                }
            }

            legendTitle = allValues && allValues.source
                ? allValues.source.displayName
                : "";
        }

        const labelColor: string = colorPalette.isHighContrast ? colorPalette.foreground.value : settingsModel.legend.color.value.value;

        const legendData: ILegendData = {
            title: legendTitle,
            dataPoints: legend,
            grouped: grouped,
            labelColor: labelColor
        };

        return {
            seriesSources,
            seriesObjects,
            legend: legendData
        };
    }

    public getValueBySeriesAndCategory(series: number, category: number): number {
        return this.dataView.values[series].values[category] as number;
    }

    public getMeasureNameByIndex(index: number): string {
        return this.dataView.values[index].source.queryName;
    }

    public hasHighlightValues(series: number): boolean {
        const valueColumn: DataViewValueColumn = this.dataView && this.dataView.values
            ? this.dataView.values[series]
            : undefined;

        return !!valueColumn?.highlights;
    }

    public getHighlightBySeriesAndCategory(series: number, category: number): number {
        return this.dataView.values[series].highlights[category] as number;
    }
}
