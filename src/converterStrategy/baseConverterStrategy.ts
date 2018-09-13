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
import { ColorHelper, createLinearColorScale } from "powerbi-visuals-utils-colorutils";
import { legendInterfaces } from "powerbi-visuals-utils-chartutils";
import * as formattingUtils from "./../formattingUtils";
import { max, sum, min } from "d3-array";

import IColorPalette = powerbi.extensibility.IColorPalette;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import DataViewCategorical = powerbi.DataViewCategorical;
import DataViewMetadataColumn = powerbi.DataViewMetadataColumn;
import DataViewObjects = powerbi.DataViewObjects;
import PrimitiveValue = powerbi.PrimitiveValue;
import DataViewValueColumnGroup = powerbi.DataViewValueColumnGroup;
import ISelectionId = powerbi.visuals.ISelectionId;
import Fill = powerbi.Fill;
import DataViewValueColumn = powerbi.DataViewValueColumn;
import DataViewCategoryColumn = powerbi.DataViewCategoryColumn;
import DataViewValueColumns = powerbi.DataViewValueColumns;
import isEqual from "lodash.isequal";

import { MekkoChart } from "./../visual";
import {
    MekkoLegendDataPoint,
    ICategotyValuesStatsCollection,
    IFilteredValueGroups,
    BaseColorIdentity,
    LegendSeriesInfo,
    MekkoGradientSettings
} from "./../dataInterfaces";

// powerbi.extensibility.utils.chart
import LegendIcon = legendInterfaces.LegendIcon;
import ILegendData = legendInterfaces.LegendData;

// formattingUtils
import getFormattedLegendLabel = formattingUtils.getFormattedLegendLabel;

import { ConverterStrategy } from "./converterStrategy";

export class BaseConverterStrategy implements ConverterStrategy {
    private static WidthColumnName: string = "Width";
    private static YColumnName: string = "Y";

    private static SortField: string = "categoryValue";

    private dataView: DataViewCategorical;
    private visualHost: IVisualHost;

    constructor(dataView: DataViewCategorical, visualHost: IVisualHost) {
        this.dataView = dataView;
        this.visualHost = visualHost;
    }

    private static hasRole(column: DataViewMetadataColumn, name: string): boolean {
        return column.roles && column.roles[name];
    }

    public getLegend(colorPalette: IColorPalette, defaultLabelLegendColor?: string, defaultColor?: string, colorGradient?: boolean, colorGradientEndColor?: string): LegendSeriesInfo {
        const legend: MekkoLegendDataPoint[] = [];
        const seriesSources: DataViewMetadataColumn[] = [];
        const seriesObjects: DataViewObjects[][] = [];

        let grouped: boolean = false;
        let legendTitle: string = undefined;

        const colorHelper: ColorHelper = new ColorHelper(
            colorPalette,
            MekkoChart.Properties["dataPoint"]["fill"],
            defaultLabelLegendColor
        );

        const categoryFieldIndex: number = 0;
        let categoryMaxValues: ICategotyValuesStatsCollection = {};
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
        let valueGroups: DataViewValueColumnGroup[] = this.dataView.values.grouped();
        let categoryGradientBaseColorIdentities: BaseColorIdentity[] = [];
        let categoryGradientEndBaseColorIdentities: BaseColorIdentity[] = [];
        let categoryItemsCount: Array<IFilteredValueGroups[]> = [];

        let restoredColors: any;
        this.dataView.categories[categoryFieldIndex].values.forEach((category: PrimitiveValue, index: number) => {

            const categorySelectionId: ISelectionId = this.visualHost.createSelectionIdBuilder()
                .withCategory(this.dataView.categories[categoryFieldIndex], index)
                .createSelectionId();

            // gradiend start color
            let mappedItems: IFilteredValueGroups[] = [];
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

            if (colorGradient) {
                categoryItemsCount[index] = categoryItemsCount[index].sort((a, b) => {
                    return a[BaseConverterStrategy.SortField] > b[BaseConverterStrategy.SortField] ? 1 : -1;
                });
            }

            let baseStartColorIdentity: IFilteredValueGroups = mappedItems.sort((a, b) => a[BaseConverterStrategy.SortField] > b[BaseConverterStrategy.SortField] ? 1 : -1)[0];
            if (baseStartColorIdentity === undefined) {
                return;
            }

            let colorStart: string = defaultLabelLegendColor;

            if (baseStartColorIdentity.gr.objects !== undefined && (<Fill>(<any>baseStartColorIdentity.gr.objects).dataPoint.fill).solid !== undefined) {
                colorStart = (<Fill>(<any>baseStartColorIdentity.gr.objects).dataPoint.fill).solid.color;
            }
            if (colorStart === undefined) {
                colorStart = colorHelper.getColorForSeriesValue(baseStartColorIdentity.gr.objects, baseStartColorIdentity.categoryValue);
            }

            // gradiend end color
            let baseEndColorIdentity: IFilteredValueGroups = mappedItems.sort((a, b) => a[BaseConverterStrategy.SortField] < b[BaseConverterStrategy.SortField] ? 1 : -1)[0];

            if (baseEndColorIdentity === undefined) {
                return;
            }

            let colorEnd: string = defaultLabelLegendColor;

            if (baseEndColorIdentity.gr.objects !== undefined && (<Fill>(<any>baseEndColorIdentity.gr.objects).dataPoint.fill).solid !== undefined) {
                colorEnd = (<Fill>(<any>baseEndColorIdentity.gr.objects).dataPoint.fill).solid.color;
            }

            if (colorEnd === undefined) {
                colorEnd = colorHelper.getColorForSeriesValue(baseEndColorIdentity.gr.objects, baseEndColorIdentity.categoryValue);
            }

            let categoryStartColor: string = ((
                this.dataView.categories[categoryFieldIndex].objects &&
                this.dataView.categories[categoryFieldIndex].objects[index] &&
                this.dataView.categories[categoryFieldIndex].objects[index]["categoryColorStart"] ||
                <MekkoGradientSettings>{
                    categoryGradient: {
                        solid: {
                            color: colorStart
                        }
                    }
                }) as MekkoGradientSettings).categoryGradient.solid.color;

            let categoryEndColor: string = ((
                this.dataView.categories[categoryFieldIndex].objects &&
                this.dataView.categories[categoryFieldIndex].objects[index] &&
                this.dataView.categories[categoryFieldIndex].objects[index]["categoryColorEnd"] ||
                <MekkoGradientSettings>{
                    categoryGradient: {
                        solid: {
                            color: colorEnd
                        }
                    }
                }) as MekkoGradientSettings).categoryGradient.solid.color;

            categoryGradientBaseColorIdentities[index] = {
                category: (baseStartColorIdentity.category || "").toString(),
                color: colorStart,
                identity: baseStartColorIdentity.gr.identity,
                group: baseStartColorIdentity.gr,
                categorySelectionId: categorySelectionId,
                categoryStartColor: categoryStartColor,
                categoryEndColor: categoryEndColor
            };
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
                        .withMeasure(this.getMeasureNameByIndex(valueIndex))
                        .createSelectionId();

                    const label: string = getFormattedLegendLabel(source, allValues);
                    let category: string;

                    let color: string;
                    let categoryIndex: number = series.values.findIndex(value => typeof value !== undefined && value !== null);

                    if (!colorGradient) {
                        color = hasDynamicSeries ? colorHelper.getColorForSeriesValue(valueGroupObjects || source.objects, source.groupName)
                            : colorHelper.getColorForMeasure(valueGroupObjects || source.objects, source.queryName);
                    }
                    else {
                        let positionIndex: number = (<IFilteredValueGroups[]>categoryItemsCount[categoryIndex]).findIndex(ser => isEqual(ser.identity, series.identity));
                        category = (categoryMaxValues[categoryIndex].category || "").toString();
                        let gradientBaseColorStart: string = categoryGradientBaseColorIdentities[categoryIndex].categoryStartColor;
                        let gradientBaseColorEnd: string = categoryGradientBaseColorIdentities[categoryIndex].categoryEndColor;

                        color = createLinearColorScale(
                            [0, categoryItemsCount[categoryIndex].length],
                            [gradientBaseColorEnd, gradientBaseColorStart], true)
                            (positionIndex);
                    }

                    legend.push({
                        color,
                        label,
                        icon: LegendIcon.Box,
                        identity: selectionId,
                        selected: false,
                        valueSum: sum(<number[]>series.values),
                        categoryValues: series.values,
                        category: category,
                        categoryStartColor: categoryGradientBaseColorIdentities[categoryIndex].categoryStartColor,
                        categoryEndColor: categoryGradientBaseColorIdentities[categoryIndex].categoryEndColor,
                        categoryIdentity: categoryGradientBaseColorIdentities[categoryIndex].categorySelectionId,
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

        const legendData: ILegendData = {
            title: legendTitle,
            dataPoints: legend,
            grouped: grouped,
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

        return valueColumn && !!valueColumn.highlights;
    }

    public getHighlightBySeriesAndCategory(series: number, category: number): number {
        return this.dataView.values[series].highlights[category] as number;
    }
}
