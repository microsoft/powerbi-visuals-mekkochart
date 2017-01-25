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

module powerbi.extensibility.visual.columnChart {
    // powerbi.visuals
    import ISelectionId = powerbi.visuals.ISelectionId;

    // d3
    import Selection = d3.Selection;

    // powerbi
    import IDataViewObjects = powerbi.DataViewObjects;

    // powerbi.extensibility.utils.dataview
    import converterHelper = powerbi.extensibility.utils.dataview.converterHelper;
    import DataViewObjects = powerbi.extensibility.utils.dataview.DataViewObjects;

    // powerbi.extensibility.utils.svg
    import IMargin = powerbi.extensibility.utils.svg.IMargin;
    import ClassAndSelector = powerbi.extensibility.utils.svg.CssConstants.ClassAndSelector;
    import createClassAndSelector = powerbi.extensibility.utils.svg.CssConstants.createClassAndSelector;

    // powerbi.extensibility.utils.chart
    import AxisHelper = powerbi.extensibility.utils.chart.axis;
    import IAxisProperties = AxisHelper.IAxisProperties;

    // powerbi.extensibility.utils.type
    import Prototype = powerbi.extensibility.utils.type.Prototype;
    import ValueType = powerbi.extensibility.utils.type.ValueType;
    import EnumExtensions = powerbi.extensibility.utils.type.EnumExtensions;
    import ArrayExtensions = powerbi.extensibility.utils.type.ArrayExtensions;

    // powerbi.extensibility.utils.interactivity
    import LegendIcon = powerbi.extensibility.utils.chart.legend.LegendIcon;
    import ILegendData = powerbi.extensibility.utils.chart.legend.LegendData;
    import dataLabelUtils = powerbi.extensibility.utils.chart.dataLabel.utils;
    import DataLabelObject = powerbi.extensibility.utils.chart.dataLabel.DataLabelObject;
    import IInteractivityService = powerbi.extensibility.utils.interactivity.IInteractivityService;
    import VisualDataLabelsSettings = powerbi.extensibility.utils.chart.dataLabel.VisualDataLabelsSettings;
    import VisualDataLabelsSettingsOptions = powerbi.extensibility.utils.chart.dataLabel.VisualDataLabelsSettingsOptions;

    // powerbi.extensibility.utils.formatting
    import valueFormatter = powerbi.extensibility.utils.formatting.valueFormatter;
    import IValueFormatter = powerbi.extensibility.utils.formatting.IValueFormatter;
    import DisplayUnitSystemType = powerbi.extensibility.utils.formatting.DisplayUnitSystemType;

    // powerbi.extensibility.utils.color
    import ColorHelper = powerbi.extensibility.utils.color.ColorHelper;

    // visualStrategy
    import IVisualStrategy = visualStrategy.IVisualStrategy;
    import BaseVisualStrategy = visualStrategy.BaseVisualStrategy;

    // converterStrategy
    import BaseConverterStrategy = converterStrategy.BaseConverterStrategy;

    // formattingUtils
    import getFormattedLegendLabel = formattingUtils.getFormattedLegendLabel;

    // behavior
    import VisualBehaviorOptions = behavior.VisualBehaviorOptions;

    export class BaseColumnChart implements IColumnChart {
        private static ColumnChartClassName = 'columnChart';

        public static SeriesClasses: ClassAndSelector = createClassAndSelector("series");
        public static BorderClass: ClassAndSelector = createClassAndSelector("mekkoborder");

        private svg: Selection<any>;
        private unclippedGraphicsContext: Selection<any>;
        private mainGraphicsContext: Selection<any>;
        private labelGraphicsContext: Selection<any>;
        private xAxisProperties: IAxisProperties;
        private yAxisProperties: IAxisProperties;
        private currentViewport: IViewport;
        private data: MekkoColumnChartData;
        // private style: IVisualStyle;
        private colorPalette: IColorPalette;
        private chartType: MekkoVisualChartType;
        private columnChart: IVisualStrategy;
        private visualHost: IVisualHost;
        private cartesianVisualHost: IMekkoChartVisualHost;
        // private interactivity: InteractivityOptions;
        private margin: IMargin;
        private options: MekkoChartVisualInitOptions;
        private lastInteractiveSelectedColumnIndex: number;
        private supportsOverflow: boolean;
        private interactivityService: IInteractivityService;
        private dataViewCat: DataViewCategorical;
        private categoryAxisType: string;
        private animator: IMekkoChartAnimator;
        private isScrollable: boolean;
        private element: JQuery;

        constructor(options: MekkoChartConstructorOptions) {
            var chartType: MekkoVisualChartType = options.chartType;

            this.chartType = chartType;
            this.categoryAxisType = null;
            this.animator = options.animator;
            this.isScrollable = options.isScrollable;
            this.interactivityService = options.interactivityService;
        }

        public init(options: MekkoChartVisualInitOptions) {
            this.svg = options.svg;

            this.unclippedGraphicsContext = this.svg
                .append('g')
                .classed('columnChartUnclippedGraphicsContext', true);

            this.mainGraphicsContext = this.unclippedGraphicsContext
                .append('svg')
                .classed('columnChartMainGraphicsContext', true);

            this.labelGraphicsContext = this.svg
                .append('g')
                .classed(
                    /*NewDataLabelUtils.labelGraphicsContextClass.class*/createClassAndSelector('labelGraphicsContext').class, true);

            // this.style = options.style;
            // this.currentViewport = options.viewport; // TODO: check it
            this.visualHost = options.host; // TODO: check it
            // this.interactivity = options.interactivity;
            this.colorPalette = /*this.style.colorPalette.dataColors*/options.host.colorPalette; // TODO: check it
            this.cartesianVisualHost = options.cartesianHost;
            this.options = options;
            this.supportsOverflow = !EnumExtensions.hasFlag(this.chartType, flagStacked);
            var element = this.element = $(options.element);
            element.addClass(BaseColumnChart.ColumnChartClassName);

            this.columnChart = new BaseVisualStrategy();
        }

        private getCategoryLayout(numCategoryValues: number, options: MekkoCalculateScaleAndDomainOptions): MekkoChartCategoryLayout {
            var availableWidth: number = this.currentViewport.width - (this.margin.left + this.margin.right);
            var metaDataColumn = this.data ? this.data.categoryMetadata : undefined;
            var categoryDataType: ValueType = AxisHelper.getCategoryValueType(metaDataColumn);
            var isScalar = this.data ? this.data.scalarCategoryAxis : false;
            var domain = AxisHelper.createDomain(this.data.series, categoryDataType, isScalar, options.forcedXDomain);

            return MekkoChart.getLayout(
                this.data,
                {
                    availableWidth: availableWidth,
                    categoryCount: numCategoryValues,
                    domain: domain,
                    isScalar: isScalar,
                    isScrollable: this.isScrollable,
                    trimOrdinalDataOnOverflow: false
                });
        }

        public static getBorderWidth(border: MekkoBorderSettings) {
            if (!border ||
                !border.show ||
                !border.width) {
                return 0;
            }

            var width: number = border.width;

            if (width < 0) {
                return 0;
            }
            if (width > border.maxWidth) {
                return border.maxWidth;
            }

            return width;
        }

        public static getBorderColor(border: MekkoBorderSettings) {
            if (!border) {
                return MekkoChart.DefaultSettings.columnBorder.color;
            }
            return border.color;
        }

        public static converter(
            visualHost: IVisualHost,
            categorical: DataViewCategorical,
            colors: IColorPalette,
            is100PercentStacked: boolean = false,
            isScalar: boolean = false,
            supportsOverflow: boolean = false,
            dataViewMetadata: DataViewMetadata = null,
            chartType?: MekkoVisualChartType): MekkoColumnChartData {

            const xAxisCardProperties = dataViewUtils.getCategoryAxisProperties(dataViewMetadata),
                valueAxisProperties = dataViewUtils.getValueAxisProperties(dataViewMetadata);

            isScalar = dataViewUtils.isScalar(isScalar, xAxisCardProperties);
            categorical = utils.applyUserMinMax(isScalar, categorical, xAxisCardProperties);

            const converterStrategy: BaseConverterStrategy =
                new BaseConverterStrategy(categorical, visualHost);

            const firstCategory: DataViewCategoryColumn = categorical
                && categorical.categories
                && categorical.categories[0],
                categories: PrimitiveValue[] = firstCategory
                    ? firstCategory.values
                    : [],
                categoryIdentities: DataViewScopeIdentity[] = firstCategory
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
            })

            var borderSettings: MekkoBorderSettings = MekkoChart.DefaultSettings.columnBorder,
                labelSettings: VisualDataLabelsSettings = dataLabelUtils.getDefaultColumnLabelSettings(true);

            var defaultDataPointColor = undefined,
                showAllDataPoints = undefined;

            if (dataViewMetadata && dataViewMetadata.objects) {
                const objects: IDataViewObjects = dataViewMetadata.objects;

                defaultDataPointColor = DataViewObjects.getFillColor(
                    objects,
                    MekkoChart.Properties["dataPoint"]["defaultColor"]);

                showAllDataPoints = DataViewObjects.getValue<boolean>(
                    objects,
                    MekkoChart.Properties["dataPoint"]["showAllDataPoints"]);

                labelSettings = MekkoChart.parseLabelSettings(objects);
                borderSettings = MekkoChart.parseBorderSettings(objects);
            }

            // Allocate colors
            var legendAndSeriesInfo = converterStrategy.getLegend(colors, defaultDataPointColor);
            var legend: MekkoLegendDataPoint[] = legendAndSeriesInfo.legend.dataPoints;
            var seriesSources: DataViewMetadataColumn[] = legendAndSeriesInfo.seriesSources;

            // Determine data points
            var result: MekkoDataPoints = BaseColumnChart.createDataPoints(
                visualHost,
                categorical,
                categories,
                categoryIdentities,
                legend,
                legendAndSeriesInfo.seriesObjects,
                converterStrategy,
                labelSettings,
                is100PercentStacked,
                isScalar,
                supportsOverflow,
                converterHelper.categoryIsAlsoSeriesRole(
                    categorical,
                    RoleNames.series,
                    RoleNames.category),
                //categoryInfo.categoryObjects,
                firstCategory && firstCategory.objects,
                defaultDataPointColor,
                chartType,
                categoryMetadata);
            var columnSeries: MekkoChartSeries[] = result.series;

            var valuesMetadata: DataViewMetadataColumn[] = [];
            for (var j = 0, jlen = legend.length; j < jlen; j++) {
                valuesMetadata.push(seriesSources[j]);
            }

            var labels = /*converterHelper.*/axis.utils.createAxesLabels(
                xAxisCardProperties,
                valueAxisProperties,
                categoryMetadata,
                valuesMetadata);

            return {
                categories: categories,
                categoriesWidth: result.categoriesWidth,
                categoryFormatter: categoryFormatter,
                series: columnSeries,
                valuesMetadata: valuesMetadata,
                legendData: legendAndSeriesInfo.legend,
                hasHighlights: result.hasHighlights,
                categoryMetadata: categoryMetadata,
                scalarCategoryAxis: isScalar,
                borderSettings: borderSettings,
                labelSettings: labelSettings,
                axesLabels: { x: labels.xAxisLabel, y: labels.yAxisLabel },
                hasDynamicSeries: result.hasDynamicSeries,
                defaultDataPointColor: defaultDataPointColor,
                showAllDataPoints: showAllDataPoints,
                isMultiMeasure: false,
            };
        }

        private static getStackedMultiplier(
            rawValues: number[][],
            rowIdx: number,
            seriesCount: number,
            categoryCount: number): ValueMultiplers {

            var pos: number = 0,
                neg: number = 0;

            for (var i = 0; i < seriesCount; i++) {
                var value: number = rawValues[i][rowIdx];
                value = AxisHelper.normalizeNonFiniteNumber(value);

                if (value > 0) {
                    pos += value;
                } else if (value < 0) {
                    neg -= value;
                }
            }

            var absTotal: number = pos + neg;
            return {
                pos: pos ? (pos / absTotal) / pos : 1,
                neg: neg ? (neg / absTotal) / neg : 1,
            };
        }

        private static createDataPoints(
            visualHost: IVisualHost,
            dataViewCat: DataViewCategorical,
            categories: any[],
            categoryIdentities: DataViewScopeIdentity[],
            legend: MekkoLegendDataPoint[],
            seriesObjectsList: IDataViewObjects[][],
            converterStrategy: BaseConverterStrategy,

            defaultLabelSettings: VisualDataLabelsSettings,
            is100PercentStacked: boolean = false,
            isScalar: boolean = false,
            supportsOverflow: boolean = false,
            isCategoryAlsoSeries?: boolean,
            categoryObjectsList?: IDataViewObjects[],
            defaultDataPointColor?: string,
            chartType?: MekkoVisualChartType,
            categoryMetadata?: DataViewMetadataColumn): MekkoDataPoints {

            var grouped = dataViewCat && dataViewCat.values ? dataViewCat.values.grouped() : undefined;

            var categoryCount = categories.length;
            var seriesCount = legend.length;
            var columnSeries: MekkoChartSeries[] = [];

            if (seriesCount < 1 || categoryCount < 1 || categories[0] === null) {
                return {
                    series: columnSeries,
                    hasHighlights: false,
                    hasDynamicSeries: false,
                    categoriesWidth: [],
                };
            }

            var dvCategories = dataViewCat.categories;
            categoryMetadata = (dvCategories && dvCategories.length > 0)
                ? dvCategories[0].source
                : null;
            var categoryType = AxisHelper.getCategoryValueType(categoryMetadata);
            var isDateTime = AxisHelper.isDateTime(categoryType);
            var baseValuesPos = [], baseValuesNeg = [];

            var rawValues: number[][] = [];
            var rawHighlightValues: number[][] = [];

            var hasDynamicSeries = !!(dataViewCat.values && dataViewCat.values.source);
            var widthColumns: number[] = [];
            var widthIndex = -1;

            var seriesIndex: number = 0;
            var highlightsOverflow = false; // Overflow means the highlight larger than value or the signs being different
            var hasHighlights = converterStrategy.hasHighlightValues(0);
            for (seriesIndex = 0; seriesIndex < dataViewCat.values.length; seriesIndex++) {
                if (dataViewCat.values[seriesIndex].source.roles &&
                    dataViewCat.values[seriesIndex].source.roles[RoleNames.width] &&
                    !dataViewCat.values[seriesIndex].source.roles[RoleNames.y]) {

                    widthIndex = seriesIndex;
                    var widthValues = <number[]>dataViewCat.values[seriesIndex].values;
                    for (var i: number = 0, valuesLen = widthValues.length; i < valuesLen; i++) {
                        widthColumns[i] = d3.sum([0, widthColumns[i], widthValues[i]]);
                    }
                    continue;
                }
                var seriesValues = [];
                var seriesHighlightValues = [];
                for (var categoryIndex: number = 0; categoryIndex < categoryCount; categoryIndex++) {
                    var value = converterStrategy.getValueBySeriesAndCategory(seriesIndex, categoryIndex);
                    seriesValues[categoryIndex] = value;
                    if (hasHighlights) {
                        var highlightValue = converterStrategy.getHighlightBySeriesAndCategory(seriesIndex, categoryIndex);
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
                for (seriesIndex = 0; seriesIndex < dataViewCat.values.length; seriesIndex++) {
                    if (dataViewCat.values[seriesIndex].source.roles &&
                        dataViewCat.values[seriesIndex].source.roles[RoleNames.width]) {

                        widthIndex = seriesIndex;
                        var widthValues = <number[]>dataViewCat.values[seriesIndex].values;
                        for (var i: number = 0, valuesLen: number = widthValues.length; i < valuesLen; i++) {
                            widthColumns[i] = d3.sum([0, widthColumns[i], widthValues[i]]);
                        }

                        continue;
                    }
                }
            }

            if (widthColumns.length < 1) {
                for (seriesIndex = 0; seriesIndex < categoryCount; seriesIndex++) {
                    widthColumns.push(1);
                }
            }

            var totalSum: number = d3.sum(widthColumns);
            var linearScale = d3.scale.linear()
                .domain([0, totalSum])
                .range([0, 1]);

            var columnStartX: number[] = [0];
            var columnWidth: number[] = [];
            for (seriesIndex = 0; seriesIndex < (categoryCount - 1); seriesIndex++) {
                var stepWidth: number = columnStartX[columnStartX.length - 1] + (widthColumns[seriesIndex] || 0);
                columnStartX.push(stepWidth);
            }

            for (seriesIndex = 0; seriesIndex < categoryCount; seriesIndex++) {
                columnStartX[seriesIndex] = linearScale(columnStartX[seriesIndex]);
                columnWidth[seriesIndex] = linearScale(widthColumns[seriesIndex]);
            }

            var dataPointObjects: IDataViewObjects[] = categoryObjectsList;

            for (seriesIndex = 0; seriesIndex < seriesCount; seriesIndex++) {
                var seriesDataPoints: MekkoChartColumnDataPoint[] = [],
                    legendItem = legend[seriesIndex],
                    seriesLabelSettings: VisualDataLabelsSettings;

                if (!hasDynamicSeries) {
                    var labelsSeriesGroup = grouped && grouped.length > 0 && grouped[0].values
                        ? grouped[0].values[seriesIndex]
                        : null;

                    var labelObjects: DataLabelObject = (labelsSeriesGroup && labelsSeriesGroup.source && labelsSeriesGroup.source.objects)
                        ? labelsSeriesGroup.source.objects['labels'] as DataLabelObject
                        : null;

                    if (labelObjects) {
                        seriesLabelSettings = Prototype.inherit(defaultLabelSettings); // TODO: check it
                        dataLabelUtils.updateLabelSettingsFromLabelsObject(labelObjects, seriesLabelSettings);
                    }
                }

                var series: MekkoChartSeries = {
                    displayName: legendItem.label,
                    key: 'series' + seriesIndex,
                    index: seriesIndex,
                    data: seriesDataPoints,
                    identity: legendItem.identity as ISelectionId,
                    color: legendItem.color,
                    labelSettings: seriesLabelSettings,
                };

                if (seriesCount > 1) {
                    dataPointObjects = seriesObjectsList[seriesIndex];
                }
                var metadata = dataViewCat.values[seriesIndex].source;

                for (var categoryIndex = 0; categoryIndex < categoryCount; categoryIndex++) {
                    if (seriesIndex === 0) {
                        baseValuesPos.push(0);
                        baseValuesNeg.push(0);
                    }

                    var value = AxisHelper.normalizeNonFiniteNumber(rawValues[seriesIndex][categoryIndex]);
                    if (value == null) {
                        // Optimization: Ignore null dataPoints from the fabricated category/series combination in the self cross-join.
                        // However, we must retain the first series because it is used to compute things like axis scales, and value lookups.
                        if (seriesIndex > 0) {
                            continue;
                        }
                    }

                    var originalValue: number = value;
                    var categoryValue = categories[categoryIndex];
                    if (isDateTime && categoryValue) {
                        categoryValue = categoryValue.getTime();
                    }
                    if (isScalar && (categoryValue == null || isNaN(categoryValue))) {
                        continue;
                    }

                    var multipliers: ValueMultiplers;

                    if (is100PercentStacked) {
                        multipliers = BaseColumnChart.getStackedMultiplier(rawValues, categoryIndex, seriesCount, categoryCount);
                    }

                    var unadjustedValue = value,
                        isNegative = value < 0;

                    if (multipliers) {
                        if (isNegative) {
                            value *= multipliers.neg;
                        } else {
                            value *= multipliers.pos;
                        }
                    }

                    var valueAbsolute = Math.abs(value),
                        position: number;

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

                    var columnGroup: DataViewValueColumnGroup = grouped && grouped.length > seriesIndex && grouped[seriesIndex].values
                        ? grouped[seriesIndex]
                        : null;

                    var category: DataViewCategoryColumn = dataViewCat.categories && dataViewCat.categories.length > 0
                        ? dataViewCat.categories[0]
                        : null;

                    var identity = /*SelectionIdBuilder*/visualHost.createSelectionIdBuilder()
                        .withCategory(category, categoryIndex)
                        .withSeries(dataViewCat.values, columnGroup)
                        .withMeasure(converterStrategy.getMeasureNameByIndex(seriesIndex))
                        .createSelectionId();

                    var rawCategoryValue = categories[categoryIndex];
                    var color = BaseColumnChart.getDataPointColor(legendItem, categoryIndex, dataPointObjects);

                    var seriesData: /*TooltipSeriesDataItem*/any[] = [];

                    if (columnGroup) {

                        var seriesValueColumn: DataViewValueColumn = {
                            values: [],
                            source: dataViewCat.values.source,
                        };
                        seriesData.push({
                            value: columnGroup.name,
                            metadata: seriesValueColumn,
                        });

                        for (var columnIndex: number = 0; columnIndex < columnGroup.values.length; columnIndex++) {
                            var columnValues: DataViewValueColumn = columnGroup.values[columnIndex];
                            seriesData.push({
                                value: columnValues.values[categoryIndex],
                                metadata: columnValues,
                            });
                        }
                    }

                    // TODO: fix tooltips
                    var tooltipInfo: VisualTooltipDataItem[] = []//TooltipBuilder.createTooltipInfo(formatStringProp, null/*dataViewCat*/, rawCategoryValue, originalValue, [category], seriesData, null/*seriesIndex*/, categoryIndex);

                    var dataPointLabelSettings = (series && series.labelSettings)
                        ? series.labelSettings
                        : defaultLabelSettings;

                    var labelColor = dataPointLabelSettings.labelColor;
                    var lastValue = undefined;

                    //Stacked column/bar label color is white by default (except last series)
                    if ((EnumExtensions.hasFlag(chartType, flagStacked))) {
                        lastValue = this.getStackedLabelColor(
                            isNegative,
                            seriesIndex,
                            seriesCount,
                            categoryIndex,
                            rawValues);

                        labelColor = (lastValue || (seriesIndex === seriesCount - 1 && !isNegative))
                            ? labelColor
                            : dataLabelUtils.defaultInsideLabelColor;
                    }

                    value = columnWidth[categoryIndex];
                    var originalPosition: number = columnStartX[categoryIndex];

                    var dataPoint: MekkoChartColumnDataPoint = {
                        categoryValue: categoryValue,
                        value: value,
                        position: position,
                        valueAbsolute: valueAbsolute,
                        valueOriginal: unadjustedValue,
                        seriesIndex: seriesIndex,
                        labelSettings: dataPointLabelSettings,
                        categoryIndex: categoryIndex,
                        color: color,
                        selected: false,
                        originalValue: value,
                        originalPosition: originalPosition,//position,
                        originalValueAbsolute: valueAbsolute,
                        identity: identity,
                        key: identity.getKey(),
                        tooltipInfo: tooltipInfo,
                        labelFill: labelColor,
                        labelFormatString: metadata.format,
                        lastSeries: lastValue,
                        chartType: chartType,
                    };

                    seriesDataPoints.push(dataPoint);

                    if (hasHighlights) {
                        var valueHighlight = rawHighlightValues[seriesIndex][categoryIndex];
                        var unadjustedValueHighlight = valueHighlight;

                        var highlightedTooltip: boolean = true;
                        if (valueHighlight === null) {
                            valueHighlight = 0;
                            highlightedTooltip = false;
                        }

                        if (is100PercentStacked) {
                            valueHighlight *= multipliers.pos;
                        }
                        var absoluteValueHighlight = Math.abs(valueHighlight);
                        var highlightPosition = position;

                        if (valueHighlight > 0) {
                            highlightPosition -= valueAbsolute - absoluteValueHighlight;
                        }
                        else if (valueHighlight === 0 && value > 0) {
                            highlightPosition -= valueAbsolute;
                        }

                        var highlightIdentity = /*SelectionId.createWithHighlight*/(identity);// TODO: check it
                        var rawCategoryValue = categories[categoryIndex];
                        //var highlightedValue: number = highlightedTooltip ? valueHighlight : undefined;
                        //var tooltipInfo: TooltipDataItem[] = TooltipBuilder.createTooltipInfo(formatStringProp, dataViewCat, rawCategoryValue, originalValue, null, null, seriesIndex, categoryIndex, highlightedValue);

                        if (highlightedTooltip) {
                            // Override non highlighted data point
                            dataPoint.tooltipInfo = tooltipInfo;
                        }

                        var highlightDataPoint: MekkoChartColumnDataPoint = {
                            categoryValue: categoryValue,
                            value: value,
                            position: highlightPosition,
                            valueAbsolute: absoluteValueHighlight,
                            valueOriginal: unadjustedValueHighlight,
                            seriesIndex: seriesIndex,
                            labelSettings: dataPointLabelSettings,
                            categoryIndex: categoryIndex,
                            color: color,
                            selected: false,
                            highlight: true,
                            originalValue: value,
                            originalPosition: originalPosition,
                            originalValueAbsolute: valueAbsolute,
                            drawThinner: highlightsOverflow,
                            identity: highlightIdentity,
                            key: highlightIdentity.getKey(),
                            tooltipInfo: tooltipInfo,
                            labelFormatString: metadata.format,
                            labelFill: labelColor,
                            lastSeries: lastValue,
                            chartType: chartType,
                        };

                        seriesDataPoints.push(highlightDataPoint);
                    }
                }

                columnSeries.push(series);
            }

            return {
                series: columnSeries,
                categoriesWidth: columnWidth,
                hasHighlights: hasHighlights,
                hasDynamicSeries: hasDynamicSeries,
            };
        }

        private static getDataPointColor(
            legendItem: MekkoLegendDataPoint,
            categoryIndex: number,
            dataPointObjects?: IDataViewObjects[]): string {

            if (dataPointObjects) {
                var colorOverride = DataViewObjects.getFillColor(
                    dataPointObjects[categoryIndex],
                    MekkoChart.Properties["dataPoint"]["fill"]);

                if (colorOverride) {
                    return colorOverride;
                }
            }

            return legendItem.color;
        }

        private static getStackedLabelColor(isNegative: boolean, seriesIndex: number, seriesCount: number, categoryIndex: number, rawValues: number[][]): boolean {
            var lastValue = !(isNegative && seriesIndex === seriesCount - 1 && seriesCount !== 1);
            //run for the next series and check if current series is last
            for (var i: number = seriesIndex + 1; i < seriesCount; i++) {
                var nextValues: number = AxisHelper.normalizeNonFiniteNumber(rawValues[i][categoryIndex]);
                if ((nextValues !== null) && (((!isNegative || (isNegative && seriesIndex === 0)) && nextValues > 0) || (isNegative && seriesIndex !== 0))) {
                    lastValue = false;
                    break;
                }
            }
            return lastValue;
        }

        public static sliceSeries(series: MekkoChartSeries[], endIndex: number, startIndex: number = 0): MekkoChartSeries[] {
            var newSeries: MekkoChartSeries[] = [];
            if (series && series.length > 0) {
                for (var i = 0, len = series.length; i < len; i++) {
                    var iNewSeries = newSeries[i] = Prototype.inherit(series[i]);
                    iNewSeries.data = series[i].data.filter(d => d.categoryIndex >= startIndex && d.categoryIndex < endIndex);
                }
            }

            return newSeries;
        }

        public static getInteractiveColumnChartDomElement(element: JQuery): HTMLElement {
            return element.children("svg").get(0);
        }

        public getColumnsWidth(): number[] {
            var data: MekkoColumnChartData = this.data;
            if (!data ||
                !data.series ||
                !data.series[0] ||
                !data.series[0].data) {
                return [];
            }

            return data.categoriesWidth;
        }

        public getBorderWidth(): number {
            return BaseColumnChart.getBorderWidth(this.data.borderSettings);
        }

        public setData(dataViews: DataView[]): void {
            var is100PctStacked: boolean = true;
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
                borderSettings: null,
                labelSettings: dataLabelUtils.getDefaultColumnLabelSettings(is100PctStacked),
                axesLabels: { x: null, y: null },
                hasDynamicSeries: false,
                defaultDataPointColor: null,
                isMultiMeasure: false,
            };

            if (dataViews.length > 0) {
                var dataView = dataViews[0];

                if (dataView && dataView.categorical) {
                    var dataViewCat = this.dataViewCat = dataView.categorical;

                    this.data = BaseColumnChart.converter(
                        this.visualHost,
                        dataViewCat,
                        this.cartesianVisualHost.getSharedColors(),
                        true,//s100PctStacked,
                        false,
                        this.supportsOverflow,
                        dataView.metadata,
                        this.chartType);

                    var series: MekkoChartSeries[] = this.data.series;
                    for (var i: number = 0, ilen: number = series.length; i < ilen; i++) {
                        var currentSeries: MekkoChartSeries = series[i];
                        if (this.interactivityService) {
                            this.interactivityService.applySelectionStateToData(currentSeries.data);
                        }
                    }
                }
            }
        }

        public calculateLegend(): ILegendData {
            // if we're in interactive mode, return the interactive legend
            //if (/*this.interactivity && this.interactivity.isInteractiveLegend*/false) {
            //return this.createInteractiveMekkoLegendDataPoints(0);
            /*}*/

            var legendData = this.data ? this.data.legendData : null;
            var MekkoLegendDataPoints = legendData ? legendData.dataPoints : [];

            if (ArrayExtensions.isUndefinedOrEmpty(MekkoLegendDataPoints)) {
                return null;
            }

            return legendData;
        }

        public hasLegend(): boolean {
            return this.data && (this.data.hasDynamicSeries || (this.data.series && this.data.series.length > 1));
        }

        public enumerateObjectInstances(
            enumeration: VisualObjectInstance[],
            options: EnumerateVisualObjectInstancesOptions): void {

            switch (options.objectName) {
                case 'dataPoint':
                    //if (!GradientUtils.hasGradientRole(this.dataViewCat))
                    this.enumerateDataPoints(enumeration);
                    break;
                case 'labels':
                    this.enumerateDataLabels(enumeration);
                    break;
            }
        }

        private enumerateDataLabels(instances: VisualObjectInstance[]): void {
            var data = this.data,
                labelSettings = this.data.labelSettings,
                seriesCount = data.series.length;

            //Draw default settings
            dataLabelUtils.enumerateDataLabels(this.getLabelSettingsOptions(
                instances,
                labelSettings,
                false));

            if (seriesCount === 0) {
                return;
            }

            //Draw series settings
            if (!data.hasDynamicSeries && (seriesCount > 1 || !data.categoryMetadata)) {
                for (var i = 0; i < seriesCount; i++) {
                    var series: MekkoChartSeries = data.series[i],
                        labelSettings: VisualDataLabelsSettings = (series.labelSettings) ? series.labelSettings : this.data.labelSettings;

                    //enumeration.pushContainer({ displayName: series.displayName });
                    dataLabelUtils.enumerateDataLabels(this.getLabelSettingsOptions(instances, labelSettings, true, series));
                    //enumeration.popContainer();
                }
            }
        }

        private getLabelSettingsOptions(
            instances: VisualObjectInstance[],
            labelSettings: VisualDataLabelsSettings,
            isSeries: boolean,
            series?: MekkoChartSeries): VisualDataLabelsSettingsOptions {

            var is100PctStacked: boolean = true;

            return {
                instances: instances,
                dataLabelsSettings: labelSettings,
                show: !isSeries,
                displayUnits: is100PctStacked,
                precision: true,
                selector: series && series.identity ? series.identity.getSelector() : null
            };
        }

        private enumerateDataPoints(instances: VisualObjectInstance[]): void {
            var data: MekkoColumnChartData = this.data;
            if (!data || !data.series) {
                return;
            }

            var seriesCount = data.series.length;

            if (seriesCount === 0) {
                return;
            }

            if (data.hasDynamicSeries || seriesCount > 1 || !data.categoryMetadata) {
                for (var i: number = 0; i < seriesCount; i++) {
                    var series: MekkoChartSeries = data.series[i];
                    instances.push({
                        objectName: 'dataPoint',
                        displayName: series.displayName,
                        selector: ColorHelper.normalizeSelector(series.identity.getSelector()),
                        properties: {
                            fill: { solid: { color: series.color } }
                        },
                    });
                }
            }
            else {
                // For single-category, single-measure column charts, the user can color the individual bars.
                var singleSeriesData: MekkoChartColumnDataPoint[] = data.series[0].data;
                var categoryFormatter: IValueFormatter = data.categoryFormatter;

                // Add default color and show all slices
                instances.push({
                    objectName: 'dataPoint',
                    selector: null,
                    properties: {
                        defaultColor: { solid: { color: data.defaultDataPointColor || this.colorPalette.getColor("0").value } }
                    }
                });

                instances.push({
                    objectName: 'dataPoint',
                    selector: null,
                    properties: {
                        showAllDataPoints: !!data.showAllDataPoints
                    }
                });

                for (var i: number = 0; i < singleSeriesData.length && data.showAllDataPoints; i++) {
                    var singleSeriesDataPoints = singleSeriesData[i],
                        categoryValue: any = data.categories[i];
                    instances.push({
                        objectName: 'dataPoint',
                        displayName: categoryFormatter ? categoryFormatter.format(categoryValue) : categoryValue,
                        selector: ColorHelper.normalizeSelector((singleSeriesDataPoints.identity as ISelectionId).getSelector(), /*isSingleSeries*/true),
                        properties: {
                            fill: { solid: { color: singleSeriesDataPoints.color } }
                        },
                    });
                }
            }
        }

        public calculateAxesProperties(options: MekkoCalculateScaleAndDomainOptions): IAxisProperties[] {
            var data: MekkoColumnChartData = this.data;
            this.currentViewport = options.viewport;
            var margin: IMargin = this.margin = options.margin;

            var origCatgSize = (data && data.categories) ? data.categories.length : 0;
            var chartLayout: MekkoChartCategoryLayout = data ? this.getCategoryLayout(origCatgSize, options) : {
                categoryCount: 0,
                categoryThickness: MekkoChart.MinOrdinalRectThickness,
                outerPaddingRatio: MekkoChart.OuterPaddingRatio,
                isScalar: false
            };
            this.categoryAxisType = chartLayout.isScalar ? axis.type.scalar : null;
            this.columnChart.setData(data);

            var preferredPlotArea = this.getPreferredPlotArea(chartLayout.isScalar, chartLayout.categoryCount, chartLayout.categoryThickness);

            /* preferredPlotArea would be same as currentViewport width when there is no scrollbar.
             In that case we want to calculate the available plot area for the shapes by subtracting the margin from available viewport */
            if (preferredPlotArea.width === this.currentViewport.width) {
                preferredPlotArea.width -= (margin.left + margin.right);
            }
            preferredPlotArea.height -= (margin.top + margin.bottom);

            var is100Pct: boolean = true;

            // When the category axis is scrollable the height of the category axis and value axis will be different
            // The height of the value axis would be same as viewportHeight
            var chartContext: MekkoColumnChartContext = {
                height: preferredPlotArea.height,
                width: preferredPlotArea.width,
                duration: 0,
                hostService: this.visualHost,
                unclippedGraphicsContext: this.unclippedGraphicsContext,
                mainGraphicsContext: this.mainGraphicsContext,
                labelGraphicsContext: this.labelGraphicsContext,
                margin: this.margin,
                layout: chartLayout,
                animator: this.animator,
                interactivityService: this.interactivityService,
                viewportHeight: this.currentViewport.height - (margin.top + margin.bottom),
                viewportWidth: this.currentViewport.width - (margin.left + margin.right),
                is100Pct: is100Pct,
                isComboChart: true,
            };
            this.ApplyInteractivity(chartContext);
            this.columnChart.setupVisualProps(chartContext);

            var isBarChart = EnumExtensions.hasFlag(this.chartType, flagBar);

            if (isBarChart) {
                var temp = options.forcedXDomain;
                options.forcedXDomain = options.forcedYDomain;
                options.forcedYDomain = temp;
            }

            this.xAxisProperties = this.columnChart.setXScale(
                is100Pct,
                options.forcedTickCount,
                options.forcedXDomain,
                isBarChart
                    ? options.valueAxisScaleType
                    : options.categoryAxisScaleType);

            this.yAxisProperties = this.columnChart.setYScale(
                is100Pct,
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

            return [this.xAxisProperties, this.yAxisProperties];
        }

        public getPreferredPlotArea(isScalar: boolean, categoryCount: number, categoryThickness: number): IViewport {
            var viewport: IViewport = {
                height: this.currentViewport.height,
                width: this.currentViewport.width
            };

            if (this.isScrollable && !isScalar) {
                var preferredWidth = MekkoChart.getPreferredCategorySpan(categoryCount, categoryThickness);
                if (EnumExtensions.hasFlag(this.chartType, flagBar)) {
                    viewport.height = Math.max(preferredWidth, viewport.height);
                }
                else
                    viewport.width = Math.max(preferredWidth, viewport.width);
            }
            return viewport;
        }

        // TODO: check this method.
        private ApplyInteractivity(chartContext: MekkoColumnChartContext): void {
            // var interactivity = this.interactivity;
            // if (interactivity) {
            //     if (interactivity.dragDataPoint) {
            //         chartContext.onDragStart = (datum: MekkoChartColumnDataPoint) => {
            //             if (!datum.identity)
            //                 return;

            //             this.visualHost.onDragStart({
            //                 event: <any>d3.event,
            //                 data: {
            //                     data: datum.identity.getSelector()
            //                 }
            //             });
            //         };
            //     }

            //     if (interactivity.isInteractiveLegend) {
            //         var dragMove = () => {
            //             var mousePoint = d3.mouse(this.mainGraphicsContext[0][0]); // get the x and y for the column area itself
            //             var x: number = mousePoint[0];
            //             var y: number = mousePoint[1];
            //             var index: number = this.columnChart.getClosestColumnIndex(x, y);
            //             this.selectColumn(index);
            //         };

            //         var ColumnChartSvg: EventTarget = MekkoColumnChart.getInteractiveColumnChartDomElement(this.element);

            //         //set click interaction on the visual
            //         this.svg.on('click', dragMove);
            //         //set click interaction on the background
            //         d3.select(ColumnChartSvg).on('click', dragMove);
            //         var drag = d3.behavior.drag()
            //             .origin(Object)
            //             .on("drag", dragMove);
            //         //set drag interaction on the visual
            //         this.svg.call(drag);
            //         //set drag interaction on the background
            //         d3.select(ColumnChartSvg).call(drag);
            //     }
            // }
        }

        private selectColumn(indexOfColumnSelected: number, force: boolean = false): void {
            if (!force && this.lastInteractiveSelectedColumnIndex === indexOfColumnSelected) return; // same column, nothing to do here

            var legendData: ILegendData = this.createInteractiveMekkoLegendDataPoints(indexOfColumnSelected);
            var MekkoLegendDataPoints: MekkoLegendDataPoint[] = legendData.dataPoints;
            this.cartesianVisualHost.updateLegend(legendData);
            if (MekkoLegendDataPoints.length > 0) {
                this.columnChart.selectColumn(indexOfColumnSelected, this.lastInteractiveSelectedColumnIndex);
            }
            this.lastInteractiveSelectedColumnIndex = indexOfColumnSelected;
        }

        private createInteractiveMekkoLegendDataPoints(columnIndex: number): ILegendData {
            var data: MekkoColumnChartData = this.data;

            if (!data || ArrayExtensions.isUndefinedOrEmpty(data.series)) {
                return { dataPoints: [] };
            }

            var MekkoLegendDataPoints: MekkoLegendDataPoint[] = [];
            var category = data.categories && data.categories[columnIndex];
            var allSeries: MekkoChartSeries[] = data.series;
            var dataPoints = data.legendData && data.legendData.dataPoints;
            var converterStrategy = new BaseConverterStrategy(this.dataViewCat, this.visualHost);

            for (var i: number = 0, len = allSeries.length; i < len; i++) {
                var measure = converterStrategy.getValueBySeriesAndCategory(i, columnIndex);
                var valueMetadata = data.valuesMetadata[i];
                var formattedLabel = getFormattedLegendLabel(valueMetadata, this.dataViewCat.values);
                var dataPointColor: string;
                if (allSeries.length === 1) {
                    var series = allSeries[0];
                    dataPointColor = series.data.length > columnIndex && series.data[columnIndex].color;
                } else {
                    dataPointColor = dataPoints.length > i && dataPoints[i].color;
                }

                const emptyIdentity: ISelectionId = this.visualHost
                    .createSelectionIdBuilder()
                    .createSelectionId();

                MekkoLegendDataPoints.push({
                    color: dataPointColor,
                    icon: LegendIcon.Box,
                    label: formattedLabel,
                    category: data.categoryFormatter ? data.categoryFormatter.format(category) : category,
                    measure: valueFormatter.format(measure, valueFormatter.getFormatStringByColumn(valueMetadata)),
                    identity: /*SelectionId.createNull()*/emptyIdentity, // TODO: check it
                    selected: false,
                });
            }

            return { dataPoints: MekkoLegendDataPoints };
        }

        public overrideXScale(xProperties: IAxisProperties): void {
            this.xAxisProperties = xProperties;
        }

        public render(suppressAnimations: boolean): MekkoVisualRenderResult {
            var MekkoColumnChartDrawInfo = this.columnChart.drawColumns(!suppressAnimations /* useAnimations */);
            var data: MekkoColumnChartData = this.data;

            var margin = this.margin;
            var viewport = this.currentViewport;
            var height = viewport.height - (margin.top + margin.bottom);
            var width = viewport.width - (margin.left + margin.right);

            this.mainGraphicsContext
                .attr('height', height)
                .attr('width', width);

            // TODO: fix tooltips
            //TooltipManager.addTooltip(MekkoColumnChartDrawInfo.shapesSelection, (tooltipEvent: TooltipEvent) => tooltipEvent.data.tooltipInfo);
            let dataPoints: MekkoChartColumnDataPoint[] = [],
                behaviorOptions: VisualBehaviorOptions = undefined;

            if (this.interactivityService) {
                for (let dataPointIndex: number = 0; dataPointIndex < data.series.length; dataPointIndex++) {
                    dataPoints = dataPoints.concat(data.series[dataPointIndex].data);
                }

                behaviorOptions = {
                    dataPoints,
                    bars: MekkoColumnChartDrawInfo.shapesSelection,
                    hasHighlights: data.hasHighlights,
                    eventGroup: this.mainGraphicsContext,
                    mainGraphicsContext: this.mainGraphicsContext,
                    viewport: MekkoColumnChartDrawInfo.viewport,
                    axisOptions: MekkoColumnChartDrawInfo.axisOptions,
                    showLabel: data.labelSettings.show
                };
            }

            // if (this.interactivity && this.interactivity.isInteractiveLegend) {
            //     if (this.data.series.length > 0) {
            //         this.selectColumn(0, true); // start with the first column
            //     }
            // }
            // SVGUtil.flushAllD3TransitionsIfNeeded(this.options); // TODO: check it
            return {
                dataPoints,
                behaviorOptions,
                labelDataPoints: MekkoColumnChartDrawInfo.labelDataPoints,
                labelsAreNumeric: true
            };
        }

        public onClearSelection(): void {
            if (this.interactivityService) {
                this.interactivityService.clearSelection();
            }
        }

        public getVisualCategoryAxisIsScalar(): boolean {
            return this.data ? this.data.scalarCategoryAxis : false;
        }

        public getSupportedCategoryAxisType(): string {
            var metaDataColumn = this.data ? this.data.categoryMetadata : undefined;
            var valueType = AxisHelper.getCategoryValueType(metaDataColumn);
            var isOrdinal = AxisHelper.isOrdinal(valueType);

            return isOrdinal
                ? axis.type.categorical
                : axis.type.both;
        }

        public setFilteredData(startIndex: number, endIndex: number): MekkoChartBaseData {
            var data = Prototype.inherit(this.data);

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
            animator: <IMekkoChartAnimator>defaultOptions.animator,
            interactivityService: defaultOptions.interactivityService,
            isScrollable: defaultOptions.isScrollable,
            chartType: type
        };

        return new BaseColumnChart(options);
    }
}
