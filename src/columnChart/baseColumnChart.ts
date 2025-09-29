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

import {
    converterHelper,
    dataViewObjects
}
    from "powerbi-visuals-utils-dataviewutils";

import {
    IMargin,
    CssConstants
}
    from "powerbi-visuals-utils-svgutils";

import {
    axis as AxisHelper,
    axisInterfaces,
    legendInterfaces,
    dataLabelUtils,
    dataLabelInterfaces
}
    from "powerbi-visuals-utils-chartutils";

import {
    prototype as Prototype,
    valueType,
    enumExtensions,
    arrayExtensions
}
    from "powerbi-visuals-utils-typeutils";

import {
    valueFormatter,
    displayUnitSystemType
}
    from "powerbi-visuals-utils-formattingutils";

import {
    ITooltipServiceWrapper,
    TooltipEnabledDataPoint,
    createTooltipServiceWrapper
}
    from "powerbi-visuals-utils-tooltiputils";

import {
    MekkoColumnChartData,
    IMekkoChartVisualHost,
    MekkoChartConstructorOptions,
    MekkoChartVisualInitOptions,
    MekkoCalculateScaleAndDomainOptions,
    MekkoChartCategoryLayout,
    LegendSeriesInfo,
    MekkoLegendDataPoint,
    MekkoDataPoints,
    MekkoChartSeries,
    ICategoryValuesCollection,
    ValueMultiplers,
    MekkoVisualRenderResult,
    MekkoChartDrawInfo,
    MekkoCategoryProperties,
    MekkoChartColumnDataPoint,
    MekkoColumnChartContext,
    MekkoChartBaseData,
    MekkoChartConstructorBaseOptions,
    BaseConverterOptions,
    CreateDataPointsOptions
}
    from "./../dataInterfaces";

import * as axisUtils from "./../axis/utils";

import VisualDataLabelsSettings = dataLabelInterfaces.VisualDataLabelsSettings;
import DisplayUnitSystemType = displayUnitSystemType.DisplayUnitSystemType;

import { max, sum } from "d3-array";
import { ScaleLinear as LinearScale, scaleLinear } from "d3-scale";
import { select, Selection } from "d3-selection";

import { MekkoChart } from "./../visual";

import * as converterStrategy from "./../converterStrategy/baseConverterStrategy";
import * as visualStrategy from "./../visualStrategy/visualStrategy";
import * as baseVisualStrategy from "./../visualStrategy/baseVisualStrategy";
import { IColumnChart, } from "./columnChartVisual";

import { MekkoVisualChartType, flagStacked, flagBar } from "./../visualChartType";

import { RoleNames, } from "./../roleNames";

import * as tooltip from "./../tooltip";

import * as axisType from "./../axis/type";

import IViewport = powerbi.IViewport;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import ISandboxExtendedColorPalette = powerbi.extensibility.ISandboxExtendedColorPalette;
import ILocalizationManager = powerbi.extensibility.ILocalizationManager;
import DataViewCategorical = powerbi.DataViewCategorical;
import DataViewMetadataColumn = powerbi.DataViewMetadataColumn;
import DataViewCategoryColumn = powerbi.DataViewCategoryColumn;
import CustomVisualOpaqueIdentity = powerbi.visuals.CustomVisualOpaqueIdentity;
import PrimitiveValue = powerbi.PrimitiveValue;
import DataViewValueColumn = powerbi.DataViewValueColumn;
import DataViewValueColumnGroup = powerbi.DataViewValueColumnGroup;
import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;

// powerbi.visuals
import ISelectionId = powerbi.visuals.ISelectionId;

// powerbi.extensibility.utils.svg
import ClassAndSelector = CssConstants.ClassAndSelector;
import createClassAndSelector = CssConstants.createClassAndSelector;

// powerbi.extensibility.utils.chart
import IAxisProperties = axisInterfaces.IAxisProperties;

// powerbi.extensibility.utils.type
import ValueType = valueType.ValueType;

// powerbi.extensibility.utils.interactivity
import ILegendData = legendInterfaces.LegendData;
import LegendDataPoint = legendInterfaces.LegendDataPoint;
import DataLabelObject = dataLabelInterfaces.DataLabelObject;

// powerbi.extensibility.utils.formatting
import IValueFormatter = valueFormatter.IValueFormatter;

// visualStrategy
import IVisualStrategy = visualStrategy.IVisualStrategy;
import BaseVisualStrategy = baseVisualStrategy.BaseVisualStrategy;

// converterStrategy
import BaseConverterStrategy = converterStrategy.BaseConverterStrategy;

// behavior
import { VisualBehaviorOptions } from "./../behavior/visualBehaviorOptions";
import { VisualFormattingSettingsModel } from "../settings";

export class BaseColumnChart implements IColumnChart {
    private static ColumnChartClassName: string = "columnChart";

    private static LabelGraphicsContextSelector: ClassAndSelector = createClassAndSelector("labelGraphicsContext");

    private static ColumnChartUnclippedGraphicsContextSelector: ClassAndSelector = createClassAndSelector("columnChartUnclippedGraphicsContext");
    private static ColumnChartMainGraphicsContextSelector: ClassAndSelector = createClassAndSelector("columnChartMainGraphicsContext");

    private static HighlightedKeyPostfix: string = "-highlighted-data-point";

    private static DefaultStackedPosition: number = 0;

    private static ColumSortField: string = "valueOriginal";

    private static Is100Pct: boolean = true;

    private svg: Selection<any, any, any, any>;
    private unclippedGraphicsContext: Selection<any, any, any, any>;
    private mainGraphicsContext: Selection<any, any, any, any>;
    private labelGraphicsContext: Selection<any, any, any, any>;

    private xAxisProperties: IAxisProperties;
    private yAxisProperties: IAxisProperties;

    private currentViewport: IViewport;

    private data: MekkoColumnChartData;

    private colorPalette: ISandboxExtendedColorPalette;
    private visualHost: IVisualHost;
    private localizationManager: ILocalizationManager;

    private chartType: MekkoVisualChartType;

    private columnChart: IVisualStrategy;

    private cartesianVisualHost: IMekkoChartVisualHost;

    private margin: IMargin;
    private lastInteractiveSelectedColumnIndex: number;
    private supportsOverflow: boolean;
    private dataViewCat: DataViewCategorical;
    public categoryAxisType: string = null;
    private isScrollable: boolean;

    private tooltipServiceWrapper: ITooltipServiceWrapper;

    constructor(options: MekkoChartConstructorOptions) {
        this.chartType = options.chartType;
        this.isScrollable = options.isScrollable;
    }

    public init(options: MekkoChartVisualInitOptions) {
        this.svg = options.svg;

        this.unclippedGraphicsContext = this.svg
            .append("g")
            .classed(BaseColumnChart.ColumnChartUnclippedGraphicsContextSelector.className, true);

        this.mainGraphicsContext = this.unclippedGraphicsContext
            .append("svg")
            .classed(BaseColumnChart.ColumnChartMainGraphicsContextSelector.className, true);

        this.labelGraphicsContext = this.svg
            .append("g")
            .classed(BaseColumnChart.LabelGraphicsContextSelector.className, true);

        this.visualHost = options.host;
        this.localizationManager = this.visualHost.createLocalizationManager();
        this.colorPalette = this.visualHost.colorPalette;

        this.cartesianVisualHost = options.cartesianHost;
        this.supportsOverflow = !enumExtensions.hasFlag(this.chartType, flagStacked);

        select(options.element)
            .classed(BaseColumnChart.ColumnChartClassName, true);

        this.tooltipServiceWrapper = createTooltipServiceWrapper(
            this.visualHost.tooltipService,
            options.element);

        this.columnChart = new BaseVisualStrategy();
    }

    private getCategoryLayout(
        numCategoryValues: number,
        options: MekkoCalculateScaleAndDomainOptions): MekkoChartCategoryLayout {

        const availableWidth: number = this.currentViewport.width
            - (this.margin.left + this.margin.right),
            metadataColumn: DataViewMetadataColumn = this.data
                ? this.data.categoryMetadata
                : undefined,
            categoryDataType: ValueType = AxisHelper.getCategoryValueType(metadataColumn),
            isScalar: boolean = this.data
                ? this.data.scalarCategoryAxis
                : false,
            domain: number[] = AxisHelper.createDomain(
                this.data.series,
                categoryDataType,
                isScalar,
                options.forcedXDomain);

        return MekkoChart.getLayout(
            this.data,
            {
                domain,
                isScalar,
                availableWidth,
                categoryCount: numCategoryValues,
                isScrollable: this.isScrollable,
                trimOrdinalDataOnOverflow: false
            });
    }

    public static converter({
        visualHost,
        categorical,
        colors,
        is100PercentStacked,
        isScalar,
        supportsOverflow,
        localizationManager,
        settingsModel,
        chartType,
        isFormatMode }: BaseConverterOptions): MekkoColumnChartData {

        const converterStrategy: BaseConverterStrategy = new BaseConverterStrategy(categorical, visualHost);

        const firstCategory: DataViewCategoryColumn = categorical
            && categorical.categories
            && categorical.categories[0],
            categories: PrimitiveValue[] = firstCategory
                ? firstCategory.values
                : [],
            categoryIdentities: CustomVisualOpaqueIdentity[] = firstCategory
                ? firstCategory.identity
                : [],
            categoryMetadata: DataViewMetadataColumn = firstCategory
                ? firstCategory.source
                : undefined;

        const categoryFormatter: IValueFormatter = valueFormatter.create({
            format: valueFormatter.getFormatStringByColumn(categoryMetadata),
            value: categories[0],
            value2: categories[categories.length - 1],
            displayUnitSystemType: DisplayUnitSystemType.Verbose
        });

        // Allocate colors
        const legendAndSeriesInfo: LegendSeriesInfo = converterStrategy.getLegend(colors, settingsModel);
        const legend: MekkoLegendDataPoint[] = legendAndSeriesInfo.legend.dataPoints;

        const seriesSources: DataViewMetadataColumn[] = legendAndSeriesInfo.seriesSources;

        // Determine data points
        const result: MekkoDataPoints = BaseColumnChart.createDataPoints({
            visualHost,
            dataViewCat: categorical,
            categories,
            categoryIdentities,
            legend,
            seriesObjectsList: legendAndSeriesInfo.seriesObjects,
            converterStrategy,
            is100PercentStacked,
            isScalar,
            supportsOverflow,
            localizationManager,
            settingsModel,
            colorPalette: colors,
            isCategoryAlsoSeries: converterHelper.categoryIsAlsoSeriesRole(
                categorical,
                RoleNames.series,
                RoleNames.category),
            categoryObjectsList: firstCategory?.objects,
            chartType,
            categoryMetadata
        });

        if (settingsModel.sortSeries.enabled.value) {
            const columns = BaseColumnChart.createAlternateStructure(result, settingsModel.sortSeries.direction.value === "des");
            BaseColumnChart.reorderPositions(result, columns, is100PercentStacked);
        }

        const valuesMetadata: DataViewMetadataColumn[] = [];

        for (let j: number = 0; j < legend.length; j++) {
            valuesMetadata.push(seriesSources[j]);
        }

        const labels: axisUtils.AxesLabels = axisUtils.createAxesLabels(
            categoryMetadata,
            valuesMetadata);

        return {
            categories,
            categoryFormatter,
            categoryMetadata,
            categoriesWidth: result.categoriesWidth,
            series: result.series,
            valuesMetadata,
            legendData: legendAndSeriesInfo.legend,
            hasHighlights: result.hasHighlights,
            scalarCategoryAxis: isScalar,
            axesLabels: {
                x: labels.xAxisLabel,
                y: labels.yAxisLabel
            },
            hasDynamicSeries: result.hasDynamicSeries,
            categoryProperties: result.categoryProperties,
            isMultiMeasure: false,
            isFormatMode,
            localizationManager
        };
    }

    private static createAlternateStructure(dataPoint: MekkoDataPoints, descendingDirection: boolean = true): ICategoryValuesCollection[] {
        const series: MekkoChartSeries[] = dataPoint.series;
        const columns: ICategoryValuesCollection[] = [];
        const rowsCount: number = series.length;
        const colsCount: number = max(series.map(s => s.data.length));

        // define all cols
        series.some((value: MekkoChartSeries): boolean => {
            if (value.data.length === colsCount) {
                value.data.forEach(data => {
                    columns[data.categoryIndex] = [];
                });

                return true;
            }
            return false;
        });

        for (let col = 0; col < colsCount; col++) {
            for (let row = 0; row < rowsCount; row++) {
                columns[col] = columns[col] || [];
                if (series[row].data[col] === undefined) {
                    continue;
                }
                if (columns[series[row].data[col].categoryIndex].categoryValue === undefined) {
                    columns[series[row].data[col].categoryIndex].identity = <any>series[row].data[col].identity;
                    columns[series[row].data[col].categoryIndex].categoryValue = series[row].data[col].categoryValue;
                    columns[series[row].data[col].categoryIndex].color = series[row].data[col].color;
                }

                columns[series[row].data[col].categoryIndex][row] = series[row].data[col];
            }
        }

        // copy array with specific fields
        for (let col = 0; col < colsCount; col++) {
            const tmpIdentity: ISelectionId = columns[col].identity;
            const tmpCategoryValue: PrimitiveValue = columns[col].categoryValue;
            const tmpColor: string = columns[col].color;
            columns[col] = columns[col].sort((a, b) => a[BaseColumnChart.ColumSortField] > b[BaseColumnChart.ColumSortField] ? 1 : -1);
            if (descendingDirection) {
                columns[col] = (columns[col]).reverse();
            }
            columns[col].identity = tmpIdentity;
            columns[col].categoryValue = tmpCategoryValue;
            columns[col].color = tmpColor;
        }

        return columns;
    }

    private static reorderPositions(dataPoint: MekkoDataPoints, columns: ICategoryValuesCollection[], is100PercentStacked: boolean = true): void {
        const series: MekkoChartSeries[] = dataPoint.series;
        const colsCount: number = series[0].data.length;
        const columnValues: number[] = [];

        if (!is100PercentStacked) {
            for (let col = 0; col < colsCount; col++) {
                const summed = sum(columns[col].map((val) => {
                    if (val === undefined) {
                        return 0;
                    }
                    return val.valueAbsolute;
                }));
                columnValues.push(summed);
            }
        }

        for (let col = 0; col < colsCount; col++) {
            let columnAbsoluteValue: number = sum(columns[col].map((val) => {
                if (val === undefined) {
                    return 0;
                }
                return val.valueAbsolute;
            }));
            const absValScale: LinearScale<number, number> = scaleLinear().domain([0, columnAbsoluteValue]).range([0, is100PercentStacked ? 1 : columnValues[col]]);
            const rowsCount: number = columns[col].length;
            for (let row = 0; row < rowsCount; row++) {
                if (columns[col][row] === undefined) {
                    continue;
                }
                columns[col][row].position = absValScale(columnAbsoluteValue);
                columnAbsoluteValue -= columns[col][row].valueAbsolute;
            }
        }
    }

    private static getStackedMultiplier(
        rawValues: number[][],
        rowIdx: number,
        seriesCount: number): ValueMultiplers {

        let pos: number = 0,
            neg: number = 0;

        for (let i: number = 0; i < seriesCount; i++) {
            let value: number = rawValues[i][rowIdx];

            value = AxisHelper.normalizeNonFiniteNumber(value);

            if (value > 0) {
                pos += value;
            } else if (value < 0) {
                neg -= value;
            }
        }

        const absTotal: number = pos + neg;

        return {
            pos: BaseColumnChart.getPosition(pos, absTotal),
            neg: BaseColumnChart.getPosition(neg, absTotal)
        };
    }

    private static getStackedMultiplierForAllDataSet(
        rawValues: number[][],
        seriesCount: number,
        categoryCount: number): ValueMultiplers {

        let pos: number = 0,
            neg: number = 0;

        for (let j: number = 0; j < categoryCount; j++) {
            for (let i: number = 0; i < seriesCount; i++) {
                let value: number = rawValues[i][j];

                value = AxisHelper.normalizeNonFiniteNumber(value);

                if (value > 0) {
                    pos += value;
                } else if (value < 0) {
                    neg -= value;
                }
            }
        }
        const absTotal: number = pos + neg;

        return {
            pos: BaseColumnChart.getPosition(pos, absTotal),
            neg: BaseColumnChart.getPosition(neg, absTotal)
        };
    }

    private static getPosition(position: number, absTotal: number): number {
        return position
            ? (position / absTotal) / position
            : BaseColumnChart.DefaultStackedPosition;
    }

    private static createDataPoints({
        visualHost,
        dataViewCat,
        categories,
        legend,
        seriesObjectsList,
        converterStrategy,
        is100PercentStacked,
        isScalar,
        supportsOverflow,
        localizationManager,
        settingsModel,
        categoryObjectsList,
        chartType,
        categoryMetadata,
        colorPalette }: CreateDataPointsOptions): MekkoDataPoints {

        const grouped: DataViewValueColumnGroup[] = dataViewCat && dataViewCat.values
            ? dataViewCat.values.grouped()
            : undefined;

        const categoryCount = categories.length,
            seriesCount = legend.length,
            columnSeries: MekkoChartSeries[] = [];

        if (seriesCount < 1
            || categoryCount < 1
            || (categories[0] === null && categories[1] === undefined)) {

            return {
                series: columnSeries,
                hasHighlights: false,
                hasDynamicSeries: false,
                categoriesWidth: [],
            };
        }

        const dvCategories: DataViewCategoryColumn[] = dataViewCat.categories;

        categoryMetadata = (dvCategories && dvCategories.length > 0)
            ? dvCategories[0].source
            : null;

        const categoryType: ValueType = AxisHelper.getCategoryValueType(categoryMetadata),
            isDateTime: boolean = AxisHelper.isDateTime(categoryType),
            baseValuesPos: number[] = [],
            baseValuesNeg: number[] = [],
            rawHighlightValues: number[][] = [],
            hasDynamicSeries = !!(dataViewCat.values && dataViewCat.values.source),
            widthColumns: number[] = [];

        let rawValues: number[][] = [];

        let highlightsOverflow: boolean = false,
            hasHighlights: boolean = converterStrategy.hasHighlightValues(0);

        for (let seriesIndex: number = 0; seriesIndex < dataViewCat.values.length; seriesIndex++) {
            if (dataViewCat.values[seriesIndex].source.roles
                && dataViewCat.values[seriesIndex].source.roles[RoleNames.width]
                && !dataViewCat.values[seriesIndex].source.roles[RoleNames.y]) {

                const widthValues: number[] = dataViewCat.values[seriesIndex].values as number[];

                for (let i: number = 0; i < widthValues.length; i++) {
                    widthColumns[i] = sum([
                        0,
                        widthColumns[i],
                        widthValues[i]
                    ]);
                }

                continue;
            }

            const seriesValues: number[] = [],
                seriesHighlightValues: number[] = [];

            for (let categoryIndex: number = 0; categoryIndex < categoryCount; categoryIndex++) {
                const value: number = converterStrategy.getValueBySeriesAndCategory(
                    seriesIndex,
                    categoryIndex);

                seriesValues[categoryIndex] = value;

                if (hasHighlights) {
                    const highlightValue: number = converterStrategy.getHighlightBySeriesAndCategory(
                        seriesIndex,
                        categoryIndex);

                    seriesHighlightValues[categoryIndex] = highlightValue;

                    // There are two cases where we don't use overflow logic; if all are false, use overflow logic appropriate for the chart.
                    if (!((value >= 0 && highlightValue >= 0 && value >= highlightValue) || // Both positive; value greater than highlight
                        (value <= 0 && highlightValue <= 0 && value <= highlightValue))) { // Both negative; value less than highlight
                        highlightsOverflow = true;
                    }
                }
            }

            rawValues.push(seriesValues);

            if (hasHighlights) {
                rawHighlightValues.push(seriesHighlightValues);
            }
        }

        if (highlightsOverflow && !supportsOverflow) {
            highlightsOverflow = false;
            hasHighlights = false;
            rawValues = rawHighlightValues;
        }

        if (widthColumns.length < 1) {
            for (let seriesIndex: number = 0; seriesIndex < dataViewCat.values.length; seriesIndex++) {
                if (dataViewCat.values[seriesIndex].source.roles
                    && dataViewCat.values[seriesIndex].source.roles[RoleNames.width]) {

                    const widthValues: number[] = dataViewCat.values[seriesIndex].values as number[];

                    for (let i: number = 0; i < widthValues.length; i++) {
                        widthColumns[i] = sum([
                            0,
                            widthColumns[i],
                            widthValues[i]
                        ]);
                    }

                    continue;
                }
            }
        }

        if (widthColumns.length < 1) {
            for (let seriesIndex: number = 0; seriesIndex < categoryCount; seriesIndex++) {
                widthColumns.push(1);
            }
        }

        const totalSum: number = sum(widthColumns),
            linearScale: LinearScale<number, number> = scaleLinear()
                .domain([0, totalSum])
                .range([0, 1]);

        const columnStartX: number[] = [0],
            columnWidth: number[] = [];

        for (let seriesIndex: number = 0; seriesIndex < (categoryCount - 1); seriesIndex++) {
            const stepWidth: number = columnStartX[columnStartX.length - 1]
                + (widthColumns[seriesIndex] || 0);

            columnStartX.push(stepWidth);
        }

        for (let seriesIndex: number = 0; seriesIndex < categoryCount; seriesIndex++) {
            columnStartX[seriesIndex] = linearScale(columnStartX[seriesIndex]);
            columnWidth[seriesIndex] = linearScale(widthColumns[seriesIndex]);
        }

        let dataPointObjects: powerbi.DataViewObjects[] = categoryObjectsList;
        const multipliersAllData: ValueMultiplers = BaseColumnChart.getStackedMultiplierForAllDataSet(rawValues, seriesCount, categoryCount);

        for (let seriesIndex: number = 0; seriesIndex < seriesCount; seriesIndex++) {
            const seriesDataPoints: MekkoChartColumnDataPoint[] = [],
                legendItem: MekkoLegendDataPoint = legend[seriesIndex];

            let seriesLabelSettings: VisualDataLabelsSettings;

            if (!hasDynamicSeries) {
                const labelsSeriesGroup: DataViewValueColumn = grouped
                    && grouped.length > 0
                    && grouped[0].values
                    ? grouped[0].values[seriesIndex]
                    : null;

                const labelObjects: DataLabelObject = labelsSeriesGroup
                    && labelsSeriesGroup.source
                    && labelsSeriesGroup.source.objects
                    ? labelsSeriesGroup.source.objects?.labels as any
                    : null;

                if (labelObjects) {
                    seriesLabelSettings = {
                        show: settingsModel.labels.show.value,
                        displayUnits: +settingsModel.labels.displayUnits.value,
                        precision: settingsModel.labels.labelPrecision.value,
                        labelColor: settingsModel.labels.color.value.value
                    };

                    dataLabelUtils.updateLabelSettingsFromLabelsObject(
                        labelObjects,
                        seriesLabelSettings);
                }
            }

            const series: MekkoChartSeries = {
                displayName: legendItem.label,
                key: `series${seriesIndex}`,
                index: seriesIndex,
                data: seriesDataPoints,
                identity: legendItem.identity as ISelectionId,
                color: legendItem.color,
                labelSettings: seriesLabelSettings,
                selected: false
            };

            if (seriesCount > 1) {
                dataPointObjects = seriesObjectsList[seriesIndex];
            }

            const metadata: DataViewMetadataColumn = dataViewCat.values[seriesIndex].source;

            for (let categoryIndex: number = 0; categoryIndex < categoryCount; categoryIndex++) {
                if (seriesIndex === 0) {
                    baseValuesPos.push(0);
                    baseValuesNeg.push(0);
                }

                let value: number = AxisHelper.normalizeNonFiniteNumber(
                    rawValues[seriesIndex][categoryIndex]);

                if (value == null && seriesIndex > 0) {
                    continue;
                }

                const originalValue: number = value;
                let categoryValue: any = categories[categoryIndex];

                if (isDateTime && categoryValue) {
                    categoryValue = categoryValue.getTime();
                }

                if (isScalar && (categoryValue == null || isNaN(categoryValue))) {
                    continue;
                }

                let multipliers: ValueMultiplers;

                if (is100PercentStacked) {
                    multipliers = BaseColumnChart.getStackedMultiplier(
                        rawValues,
                        categoryIndex,
                        seriesCount);
                }

                const unadjustedValue: number = value,
                    isNegative: boolean = value < 0;

                if (multipliers) {
                    if (isNegative) {
                        value *= multipliers.neg;
                    } else {
                        value *= multipliers.pos;
                    }
                }

                let valueByAllData = originalValue;
                if (multipliersAllData) {
                    if (isNegative) {
                        valueByAllData *= multipliersAllData.neg;
                    } else {
                        valueByAllData *= multipliersAllData.pos;
                    }
                }

                const valueAbsolute: number = Math.abs(value);
                let position: number;

                const valueAbsoluteByAllData: number = Math.abs(valueByAllData);

                if (isNegative) {
                    position = baseValuesNeg[categoryIndex];

                    if (!isNaN(valueAbsolute)) {
                        baseValuesNeg[categoryIndex] -= valueAbsolute;
                    }
                }
                else {
                    if (!isNaN(valueAbsolute)) {
                        baseValuesPos[categoryIndex] += valueAbsolute;
                    }

                    position = baseValuesPos[categoryIndex];
                }

                const columnGroup: DataViewValueColumnGroup = grouped
                    && grouped.length > seriesIndex
                    && grouped[seriesIndex].values
                    ? grouped[seriesIndex]
                    : null;

                const category: DataViewCategoryColumn = dataViewCat.categories
                    && dataViewCat.categories.length > 0
                    ? dataViewCat.categories[0]
                    : null;

                const identity: ISelectionId = visualHost.createSelectionIdBuilder()
                    .withCategory(category, categoryIndex)
                    .withSeries(dataViewCat.values, columnGroup)
                    .createSelectionId();

                const color: string = BaseColumnChart.getDataPointColor(
                    legendItem,
                    categoryIndex,
                    colorPalette,
                    dataPointObjects
                );

                const seriesData: tooltip.TooltipSeriesDataItem[] = [];

                if (columnGroup) {
                    const seriesValueColumn: DataViewValueColumn = {
                        values: [],
                        source: dataViewCat.values.source,
                    };

                    seriesData.push({
                        value: columnGroup.name,
                        metadata: seriesValueColumn,
                    });

                    for (let columnIndex: number = 0; columnIndex < columnGroup.values.length; columnIndex++) {
                        const columnValues: DataViewValueColumn = columnGroup.values[columnIndex];

                        seriesData.push({
                            value: columnValues.values[categoryIndex],
                            metadata: columnValues,
                        });
                    }
                }

                let rawCategoryValue: any = categories[categoryIndex];
                let tooltipInfo: VisualTooltipDataItem[] = tooltip.createTooltipInfo(
                    null,
                    rawCategoryValue,
                    localizationManager,
                    originalValue,
                    [category],
                    seriesData,
                    null,
                    categoryIndex);

                const dataPointLabelSettings: VisualDataLabelsSettings = series && series.labelSettings
                    ? series.labelSettings
                    : {
                        show: settingsModel.labels.show.value,
                        displayUnits: +settingsModel.labels.displayUnits.value,
                        precision: settingsModel.labels.labelPrecision.value,
                        labelColor: settingsModel.labels.color.value.value
                    };

                let labelColor: string = dataPointLabelSettings.labelColor,
                    lastValue: boolean = undefined;

                // Stacked column/bar label color is white by default (except last series)
                if ((enumExtensions.hasFlag(chartType, flagStacked))) {
                    lastValue = this.getStackedLabelColor(
                        isNegative,
                        seriesIndex,
                        seriesCount,
                        categoryIndex,
                        rawValues);

                    labelColor = lastValue || (seriesIndex === seriesCount - 1 && !isNegative)
                        ? labelColor
                        : dataLabelUtils.defaultInsideLabelColor;
                }

                value = columnWidth[categoryIndex];

                const originalPosition: number = columnStartX[categoryIndex],
                    dataPoint: MekkoChartColumnDataPoint = {
                        categoryValue,
                        value,
                        position,
                        valueAbsolute,
                        categoryIndex,
                        color,
                        seriesIndex,
                        chartType,
                        identity,
                        tooltipInfo,
                        originalPosition,
                        valueOriginal: unadjustedValue,
                        labelSettings: dataPointLabelSettings,
                        selected: false,
                        originalValue: value,
                        originalValueAbsolute: valueAbsolute,
                        originalValueAbsoluteByAlLData: valueAbsoluteByAllData,
                        key: identity.getKey(),
                        labelFill: labelColor,
                        labelFormatString: metadata.format,
                        lastSeries: lastValue
                    };

                seriesDataPoints.push(dataPoint);

                if (hasHighlights) {
                    let valueHighlight: number = rawHighlightValues[seriesIndex][categoryIndex];
                    const unadjustedValueHighlight: number = valueHighlight;

                    let highlightedTooltip: boolean = true;

                    if (valueHighlight === null) {
                        valueHighlight = 0;
                        highlightedTooltip = false;
                    }

                    if (is100PercentStacked) {
                        valueHighlight *= multipliers.pos;
                    }

                    const absoluteValueHighlight: number = Math.abs(valueHighlight);
                    let highlightPosition: number = position;

                    if (valueHighlight > 0) {
                        highlightPosition -= valueAbsolute - absoluteValueHighlight;
                    }
                    else if (valueHighlight === 0 && value > 0) {
                        highlightPosition -= valueAbsolute;
                    }

                    rawCategoryValue = categories[categoryIndex];

                    const highlightedValue: number = highlightedTooltip
                        ? valueHighlight
                        : undefined;

                    tooltipInfo = tooltip.createTooltipInfo(
                        dataViewCat,
                        rawCategoryValue,
                        localizationManager,
                        originalValue,
                        null,
                        null,
                        seriesIndex,
                        categoryIndex,
                        highlightedValue);

                    if (highlightedTooltip) {
                        dataPoint.tooltipInfo = tooltipInfo;
                    }

                    const highlightDataPoint: MekkoChartColumnDataPoint = {
                        categoryValue,
                        value,
                        seriesIndex,
                        categoryIndex,
                        color,
                        originalPosition,
                        identity,
                        chartType,
                        tooltipInfo,
                        position: highlightPosition,
                        valueAbsolute: absoluteValueHighlight,
                        valueOriginal: unadjustedValueHighlight,
                        labelSettings: dataPointLabelSettings,
                        selected: false,
                        highlight: true,
                        originalValue: value,
                        originalValueAbsolute: valueAbsolute,
                        drawThinner: highlightsOverflow,
                        key: `${identity.getKey()}${BaseColumnChart.HighlightedKeyPostfix}`,
                        labelFormatString: metadata.format,
                        labelFill: labelColor,
                        lastSeries: lastValue
                    };

                    seriesDataPoints.push(highlightDataPoint);
                }
            }

            columnSeries.push(series);
        }

        const result: MekkoDataPoints = {
            series: columnSeries,
            categoriesWidth: columnWidth,
            hasHighlights: hasHighlights,
            hasDynamicSeries: hasDynamicSeries
        };

        const categoryProperties: MekkoCategoryProperties[] = [];

        result.series.forEach((series) => {
            if (series.data.length !== 1) {
                return;
            }
            if (categoryProperties[series.data[0].categoryIndex] === undefined) {
                categoryProperties[series.data[0].categoryIndex] = {
                    valueAbsolute: 0
                };
            }
            if (series.data[0] !== undefined && series.data[0].valueAbsolute > categoryProperties[series.data[0].categoryIndex].valueAbsolute) {
                categoryProperties[series.data[0].categoryIndex].valueAbsolute = series.data[0].valueAbsolute;
                categoryProperties[series.data[0].categoryIndex].color = series.data[0].color;
                categoryProperties[series.data[0].categoryIndex].name = (series.data[0].categoryValue || "").toString();
                categoryProperties[series.data[0].categoryIndex].series = series;
                categoryProperties[series.data[0].categoryIndex].identity = series.identity;
            }
        });
        result.categoryProperties = categoryProperties;

        return result;
    }

    private static getDataPointColor(
        legendItem: MekkoLegendDataPoint,
        categoryIndex: number,
        colorPalette: ISandboxExtendedColorPalette,
        dataPointObjects?: powerbi.DataViewObjects[]): string {

        if (dataPointObjects) {
            const colorOverride: string = dataViewObjects.getFillColor(
                dataPointObjects[categoryIndex],
                MekkoChart.Properties.dataPoint.fill);

            if (colorOverride) {
                return colorOverride;
            }

            const defaultColorOverride: string = dataViewObjects.getFillColor(
                dataPointObjects[categoryIndex],
                MekkoChart.Properties.dataPoint.defaultColor);

            if (defaultColorOverride) {
                return defaultColorOverride;
            }
        }

        return colorPalette.isHighContrast ? colorPalette.background.value : legendItem.color;
    }

    private static getStackedLabelColor(
        isNegative: boolean,
        seriesIndex: number,
        seriesCount: number,
        categoryIndex: number,
        rawValues: number[][]): boolean {

        let lastValue: boolean = !(isNegative
            && seriesIndex === seriesCount - 1
            && seriesCount !== 1);

        // run for the next series and check if current series is last
        for (let i: number = seriesIndex + 1; i < seriesCount; i++) {
            const nextValues: number = AxisHelper.normalizeNonFiniteNumber(rawValues[i][categoryIndex]);

            if ((nextValues !== null)
                && (((!isNegative || (isNegative && seriesIndex === 0)) && nextValues > 0)
                    || (isNegative && seriesIndex !== 0))) {

                lastValue = false;
                break;
            }
        }

        return lastValue;
    }

    public static sliceSeries(
        series: MekkoChartSeries[],
        endIndex: number,
        startIndex: number = 0): MekkoChartSeries[] {

        const newSeries: MekkoChartSeries[] = [];

        if (series && series.length > 0) {
            for (let i: number = 0, len = series.length; i < len; i++) {
                const iNewSeries: MekkoChartSeries = newSeries[i] = Prototype.inherit(series[i]);

                iNewSeries.data = series[i].data.filter((dataPoint: MekkoChartColumnDataPoint) => {
                    return dataPoint.categoryIndex >= startIndex
                        && dataPoint.categoryIndex < endIndex;
                });
            }
        }

        return newSeries;
    }

    public getColumnsWidth(): number[] {
        const data: MekkoColumnChartData = this.data;

        if (!data
            || !data.series
            || !data.series[0]
            || !data.series[0].data) {

            return [];
        }

        return data.categoriesWidth;
    }

    public setData(dataViews: powerbi.DataView[], settingsModel: VisualFormattingSettingsModel, isFormatMode: boolean, localizationManager: ILocalizationManager): void {
        this.data = {
            categories: [],
            categoriesWidth: [],
            categoryFormatter: null,
            series: [],
            valuesMetadata: [],
            legendData: null,
            hasHighlights: false,
            categoryMetadata: null,
            scalarCategoryAxis: false,
            axesLabels: { x: null, y: null },
            hasDynamicSeries: false,
            defaultDataPointColor: null,
            isMultiMeasure: false,
            categoryProperties: null,
            isFormatMode,
            localizationManager
        };

        if (dataViews.length > 0) {
            const dataView: powerbi.DataView = dataViews[0];

            if (dataView && dataView.categorical) {
                this.dataViewCat = dataView.categorical;
                BaseColumnChart.Is100Pct = settingsModel.valueAxis.valueMode.value === "percentage";
                this.data = BaseColumnChart.converter({
                    visualHost: this.visualHost,
                    categorical: this.dataViewCat,
                    colors: this.cartesianVisualHost.getSharedColors(),
                    is100PercentStacked: BaseColumnChart.Is100Pct,
                    isScalar: false,
                    supportsOverflow: this.supportsOverflow,
                    localizationManager: this.localizationManager,
                    settingsModel,
                    chartType: this.chartType,
                    isFormatMode
                });
            }
        }
    }

    public calculateLegend(): ILegendData {
        const legendData: ILegendData = this.data
            ? this.data.legendData
            : null;

        const dataPoints: LegendDataPoint[] = legendData
            ? legendData.dataPoints
            : [];

        if (arrayExtensions.isUndefinedOrEmpty(dataPoints)) {
            return null;
        }

        return legendData;
    }

    public hasLegend(): boolean {
        return this.data
            && (this.data.hasDynamicSeries
                || (this.data.series && this.data.series.length > 1));
    }

    public getData() {
        return this.data;
    }

    public checkDataToFeatures(): boolean {
        return !this.data.legendData.dataPoints.some((value: MekkoLegendDataPoint) => {
            return value.categoryValues.filter(value => value).length > 1;
        });
    }

    public calculateAxesProperties(options: MekkoCalculateScaleAndDomainOptions, settingsModel: VisualFormattingSettingsModel): IAxisProperties[] {
        const data: MekkoColumnChartData = this.data;

        this.currentViewport = options.viewport;
        this.margin = options.margin;

        const origCategorySize: number = data && data.categories
            ? data.categories.length
            : 0;

        const chartLayout: MekkoChartCategoryLayout = data
            ? this.getCategoryLayout(origCategorySize, options)
            : {
                categoryCount: 0,
                categoryThickness: MekkoChart.MinOrdinalRectThickness,
                outerPaddingRatio: MekkoChart.OuterPaddingRatio,
                isScalar: false
            };

        this.categoryAxisType = chartLayout.isScalar
            ? axisType.scalar
            : null;

        this.columnChart.setData(data);

        const preferredPlotArea: IViewport = this.getPreferredPlotArea(
            chartLayout.isScalar,
            chartLayout.categoryCount,
            chartLayout.categoryThickness);

        /**
         * preferredPlotArea would be same as currentViewport width when there is no scrollbar.
         * In that case we want to calculate the available plot area for the shapes by subtracting the margin from available viewport
         */
        if (preferredPlotArea.width === this.currentViewport.width) {
            preferredPlotArea.width -= (this.margin.left + this.margin.right);
        }

        preferredPlotArea.height -= (this.margin.top + this.margin.bottom);

        // When the category axis is scrollable the height of the category axis and value axis will be different
        // The height of the value axis would be same as viewportHeight
        const chartContext: MekkoColumnChartContext = {
            height: preferredPlotArea.height,
            width: preferredPlotArea.width,
            duration: 0,
            hostService: this.visualHost,
            unclippedGraphicsContext: this.unclippedGraphicsContext,
            mainGraphicsContext: this.mainGraphicsContext,
            labelGraphicsContext: this.labelGraphicsContext,
            margin: this.margin,
            layout: chartLayout,
            viewportHeight: this.currentViewport.height - (this.margin.top + this.margin.bottom),
            viewportWidth: this.currentViewport.width - (this.margin.left + this.margin.right),
            is100Pct: BaseColumnChart.Is100Pct,
            isComboChart: true,
        };

        this.columnChart.setupVisualProps(chartContext);

        const isBarChart: boolean = enumExtensions.hasFlag(this.chartType, flagBar);

        if (isBarChart) {
            [options.forcedXDomain, options.forcedYDomain] = [options.forcedYDomain, options.forcedXDomain];
        }

        this.xAxisProperties = this.columnChart.setXScale(
            BaseColumnChart.Is100Pct,
            settingsModel,
            options.forcedTickCount,
            options.forcedXDomain,
            isBarChart
                ? options.valueAxisScaleType
                : options.categoryAxisScaleType);

        this.yAxisProperties = this.columnChart.setYScale(
            BaseColumnChart.Is100Pct,
            options.forcedTickCount,
            options.forcedYDomain,
            isBarChart
                ? options.categoryAxisScaleType
                : options.valueAxisScaleType);

        if (options.showCategoryAxisLabel
            && this.xAxisProperties.isCategoryAxis
            || options.showValueAxisLabel
            && !this.xAxisProperties.isCategoryAxis) {

            this.xAxisProperties.axisLabel = data.axesLabels.x;
        }
        else {
            this.xAxisProperties.axisLabel = null;
        }
        if (options.showValueAxisLabel
            && !this.yAxisProperties.isCategoryAxis
            || options.showCategoryAxisLabel
            && this.yAxisProperties.isCategoryAxis) {

            this.yAxisProperties.axisLabel = data.axesLabels.y;
        }
        else {
            this.yAxisProperties.axisLabel = null;
        }

        return [
            this.xAxisProperties,
            this.yAxisProperties
        ];
    }

    public getAxisProperties(): IAxisProperties[] {
        return [
            this.xAxisProperties,
            this.yAxisProperties
        ];
    }

    public getPreferredPlotArea(
        isScalar: boolean,
        categoryCount: number,
        categoryThickness: number): IViewport {

        const viewport: IViewport = {
            height: this.currentViewport.height,
            width: this.currentViewport.width
        };

        if (this.isScrollable && !isScalar) {
            const preferredWidth: number = MekkoChart.getPreferredCategorySpan(
                categoryCount,
                categoryThickness);

            if (enumExtensions.hasFlag(this.chartType, flagBar)) {
                viewport.height = Math.max(preferredWidth, viewport.height);
            }
            else {
                viewport.width = Math.max(preferredWidth, viewport.width);
            }
        }

        return viewport;
    }

    public overrideXScale(xProperties: IAxisProperties): void {
        this.xAxisProperties = xProperties;
    }

    public render(suppressAnimations: boolean, settingsModel: VisualFormattingSettingsModel): MekkoVisualRenderResult {
        const chartDrawInfo: MekkoChartDrawInfo = this.columnChart.drawColumns(!suppressAnimations, settingsModel),
            data: MekkoColumnChartData = this.data;

        const margin: IMargin = this.margin,
            viewport: IViewport = this.currentViewport,
            height: number = viewport.height - (margin.top + margin.bottom),
            width: number = viewport.width - (margin.left + margin.right);

        this.mainGraphicsContext.attr("height", height);
        this.mainGraphicsContext.attr("width", width);

        this.tooltipServiceWrapper.addTooltip<TooltipEnabledDataPoint>(
            chartDrawInfo.shapesSelection,
            (datapoint: TooltipEnabledDataPoint) => {
                return datapoint.tooltipInfo;
            });

        let dataPoints: MekkoChartColumnDataPoint[] = [];
        let behaviorOptions: VisualBehaviorOptions = undefined;

        for (let dataPointIndex: number = 0; dataPointIndex < data.series.length; dataPointIndex++) {
            dataPoints = dataPoints.concat(data.series[dataPointIndex].data);
        }

        behaviorOptions = {
            bars: chartDrawInfo.shapesSelection,
            hasHighlights: data.hasHighlights,
            eventGroup: this.mainGraphicsContext,
            mainGraphicsContext: this.mainGraphicsContext,
            viewport: chartDrawInfo.viewport,
            axisOptions: chartDrawInfo.axisOptions
        };

        return {
            dataPoints,
            behaviorOptions,
            labelDataPoints: chartDrawInfo.labelDataPoints,
            labelsAreNumeric: true
        };
    }

    public getVisualCategoryAxisIsScalar(): boolean {
        return this.data
            ? this.data.scalarCategoryAxis
            : false;
    }

    public getSupportedCategoryAxisType(): string {
        const metaDataColumn: DataViewMetadataColumn = this.data
            ? this.data.categoryMetadata
            : undefined;

        const valueType: ValueType = AxisHelper.getCategoryValueType(metaDataColumn),
            isOrdinal: boolean = AxisHelper.isOrdinal(valueType);

        return isOrdinal
            ? axisType.categorical
            : axisType.both;
    }

    public setFilteredData(startIndex: number, endIndex: number): MekkoChartBaseData {
        const data: MekkoColumnChartData = Prototype.inherit(this.data);

        data.series = BaseColumnChart.sliceSeries(data.series, endIndex, startIndex);
        data.categories = data.categories.slice(startIndex, endIndex);
        this.columnChart.setData(data);

        return data;
    }
}

export function createBaseColumnChartLayer(
    type: MekkoVisualChartType,
    defaultOptions: MekkoChartConstructorBaseOptions): BaseColumnChart {

    const options: MekkoChartConstructorOptions = {
        isScrollable: defaultOptions.isScrollable,
        chartType: type
    };

    return new BaseColumnChart(options);
}
