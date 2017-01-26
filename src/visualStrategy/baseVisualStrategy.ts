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

module powerbi.extensibility.visual.visualStrategy {
    // d3
    import Axis = d3.svg.Axis;
    import Selection = d3.Selection;
    import UpdateSelection = d3.selection.Update;

    // powerbi.visuals
    import ISelectionId = powerbi.visuals.ISelectionId;

    // powerbi.extensibility.utils.svg
    import IRect = powerbi.extensibility.utils.svg.IRect;
    import IMargin = powerbi.extensibility.utils.svg.IMargin;
    import ClassAndSelector = powerbi.extensibility.utils.svg.CssConstants.ClassAndSelector;
    import createClassAndSelector = powerbi.extensibility.utils.svg.CssConstants.createClassAndSelector;

    // powerbi.extensibility.utils.chart
    import AxisHelper = powerbi.extensibility.utils.chart.axis;
    import IAxisProperties = AxisHelper.IAxisProperties;
    import getLabelPrecision = powerbi.extensibility.utils.chart.dataLabel.utils.getLabelPrecision;
    import hundredPercentFormat = powerbi.extensibility.utils.chart.dataLabel.utils.hundredPercentFormat;
    import VisualDataLabelsSettings = powerbi.extensibility.utils.chart.dataLabel.VisualDataLabelsSettings;
    import IColumnFormatterCacheManager = powerbi.extensibility.utils.chart.dataLabel.IColumnFormatterCacheManager;
    import createColumnFormatterCacheManager = powerbi.extensibility.utils.chart.dataLabel.utils.createColumnFormatterCacheManager;

    // powerbi.extensibility.utils.interactivity
    import IInteractivityService = powerbi.extensibility.utils.interactivity.IInteractivityService;

    // powerbi.extensibility.utils.formatting
    import TextProperties = powerbi.extensibility.utils.formatting.TextProperties;
    import valueFormatter = powerbi.extensibility.utils.formatting.valueFormatter;
    import IValueFormatter = powerbi.extensibility.utils.formatting.IValueFormatter;
    import textMeasurementService = powerbi.extensibility.utils.formatting.textMeasurementService;

    // powerbi.extensibility.utils.type
    import ValueType = powerbi.extensibility.utils.type.ValueType;
    import PixelConverter = powerbi.extensibility.utils.type.PixelConverter;

    export class BaseVisualStrategy implements IVisualStrategy {
        private static DefaultLabelFillColor: string = "#ffffff";

        private static Classes: MekkoChartClasses = {
            item: createClassAndSelector('column'),
            highlightItem: createClassAndSelector('highlightColumn')
        };

        private layout: IMekkoColumnLayout;
        private data: MekkoColumnChartData;
        private graphicsContext: MekkoColumnChartContext;
        private width: number;
        private height: number;
        private margin: IMargin;
        private xProps: IAxisProperties;
        private yProps: IAxisProperties;
        private categoryLayout: MekkoChartCategoryLayout;
        private columnsCenters: number[];
        private columnSelectionLineHandle: Selection<any>;
        private animator: IMekkoChartAnimator;
        private interactivityService: IInteractivityService;
        private viewportHeight: number;
        private viewportWidth: number;

        private static validLabelPositions = [1];

        public setupVisualProps(columnChartProps: MekkoColumnChartContext): void {
            this.graphicsContext = columnChartProps;
            this.margin = columnChartProps.margin;
            this.width = this.graphicsContext.width;
            this.height = this.graphicsContext.height;
            this.categoryLayout = columnChartProps.layout;
            this.animator = columnChartProps.animator;
            this.interactivityService = columnChartProps.interactivityService;
            this.viewportHeight = columnChartProps.viewportHeight;
            this.viewportWidth = columnChartProps.viewportWidth;
        }

        public setData(data: MekkoColumnChartData) {
            this.data = data;
        }

        private static createFormatter(
            scaleDomain: any[],
            dataDomain: any[],
            dataType,
            isScalar: boolean,
            formatString: string,
            bestTickCount: number,
            tickValues: any[],
            getValueFn: any,
            useTickIntervalForDisplayUnits: boolean = false): IValueFormatter {

            let formatter: IValueFormatter;

            if (dataType.dateTime) {
                if (isScalar) {
                    let value: Date = new Date(scaleDomain[0]),
                        value2: Date = new Date(scaleDomain[1]);
                    // datetime with only one value needs to pass the same value
                    // (from the original dataDomain value, not the adjusted scaleDomain)
                    // so formatting works correctly.
                    if (bestTickCount === 1) {
                        value = value2 = new Date(dataDomain[0]);
                    }

                    formatter = valueFormatter.create({
                        format: formatString,
                        value: value,
                        value2: value2,
                        tickCount: bestTickCount
                    });
                }
                else {
                    const minDate: Date = getValueFn(0, dataType),
                        maxDate: Date = getValueFn(scaleDomain.length - 1, dataType);

                    formatter = valueFormatter.create({
                        format: formatString,
                        value: minDate,
                        value2: maxDate,
                        tickCount: bestTickCount
                    });
                }
            }
            else {
                if (useTickIntervalForDisplayUnits && isScalar && tickValues.length > 1) {
                    const domainMin: number = tickValues[1] - tickValues[0],
                        domainMax: number = 0; //force tickInterval to be used with display units

                    formatter = valueFormatter.create({
                        format: formatString,
                        value: domainMin,
                        value2: domainMax,
                        allowFormatBeautification: true
                    });
                }
                else {
                    // do not use display units, just the basic value formatter
                    // datetime is handled above, so we are ordinal and either boolean, numeric, or text.
                    formatter = valueFormatter.createDefaultFormatter(formatString, true);
                }
            }

            return formatter;
        }

        /**
         * Format the linear tick labels or the category labels.
         */
        private static formatAxisTickValues(
            axis: Axis,
            tickValues: any[],
            formatter: IValueFormatter,
            dataType: ValueType,
            isScalar: boolean,
            getValueFn?: (index: number, type: ValueType) => any) {

            var formattedTickValues = [];
            if (formatter) {
                // getValueFn takes an ordinal axis index or builds DateTime from milliseconds, do not pass a numeric scalar value.
                if (getValueFn && !(dataType.numeric && isScalar)) {
                    axis.tickFormat(d => formatter.format(getValueFn(d, dataType)));
                    formattedTickValues = tickValues.map(d => formatter.format(getValueFn(d, dataType)));
                }
                else {
                    axis.tickFormat(d => formatter.format(d));
                    formattedTickValues = tickValues.map((d) => formatter.format(d));
                }
            }
            else {
                formattedTickValues = tickValues.map((d) => getValueFn(d, dataType));
            }

            return formattedTickValues;
        }

        /**
         * Create a D3 axis including scale. Can be vertical or horizontal, and either datetime, numeric, or text.
         * @param options The properties used to create the axis.
         */
        private createAxis(options): IAxisProperties {
            var pixelSpan = options.pixelSpan,
                dataDomain = options.dataDomain,
                metaDataColumn = options.metaDataColumn,
                outerPadding = options.outerPadding || 0,
                isCategoryAxis = !!options.isCategoryAxis,
                isScalar = !!options.isScalar,
                isVertical = !!options.isVertical,
                useTickIntervalForDisplayUnits = !!options.useTickIntervalForDisplayUnits, // DEPRECATE: same meaning as isScalar?
                getValueFn = options.getValueFn,
                categoryThickness = options.categoryThickness;

            var formatString = valueFormatter.getFormatStringByColumn(metaDataColumn);
            var dataType: ValueType = AxisHelper.getCategoryValueType(metaDataColumn, isScalar);
            var isLogScaleAllowed = AxisHelper.isLogScalePossible(dataDomain, dataType);

            var scale = d3.scale.linear();
            var scaleDomain = [0, 1];
            var bestTickCount = dataDomain.length || 1;

            var borderWidth: number = columnChart.BaseColumnChart.getBorderWidth(options.borderSettings);
            var chartWidth = pixelSpan - borderWidth * (bestTickCount - 1);

            if (chartWidth < MekkoChart.MinOrdinalRectThickness) {
                chartWidth = MekkoChart.MinOrdinalRectThickness;
            }

            scale.domain(scaleDomain)
                .range([0, chartWidth]);
            var tickValues = dataDomain;

            var formatter = BaseVisualStrategy.createFormatter(
                scaleDomain,
                dataDomain,
                dataType,
                isScalar,
                formatString,
                bestTickCount,
                tickValues,
                getValueFn,
                useTickIntervalForDisplayUnits);

            // sets default orientation only, cartesianChart will fix y2 for comboChart
            // tickSize(pixelSpan) is used to create gridLines
            var axis = d3.svg.axis()
                .scale(scale)
                .tickSize(6, 0)
                .orient(isVertical ? 'left' : 'bottom')
                .ticks(bestTickCount)
                .tickValues(dataDomain);

            var formattedTickValues = [];
            if (metaDataColumn) {
                formattedTickValues = BaseVisualStrategy.formatAxisTickValues(axis, tickValues, formatter, dataType, isScalar, getValueFn);
            }

            var xLabelMaxWidth;
            // Use category layout of labels if specified, otherwise use scalar layout of labels
            if (!isScalar && categoryThickness) {
                xLabelMaxWidth = Math.max(1, categoryThickness - MekkoChart.TickLabelPadding * 2);
            }
            else {
                // When there are 0 or 1 ticks, then xLabelMaxWidth = pixelSpan
                // When there is > 1 ticks then we need to +1 so that their widths don't overlap
                // Example: 2 ticks are drawn at 33.33% and 66.66%, their width needs to be 33.33% so they don't overlap.
                var labelAreaCount = tickValues.length > 1 ? tickValues.length + 1 : tickValues.length;
                xLabelMaxWidth = labelAreaCount > 1 ? pixelSpan / labelAreaCount : pixelSpan;
                xLabelMaxWidth = Math.max(1, xLabelMaxWidth - MekkoChart.TickLabelPadding * 2);
            }

            return {
                scale: scale,
                axis: axis,
                formatter,
                values: formattedTickValues,
                axisType: dataType,
                axisLabel: null,
                isCategoryAxis: isCategoryAxis,
                xLabelMaxWidth: xLabelMaxWidth,
                categoryThickness: categoryThickness,
                outerPadding: outerPadding,
                usingDefaultDomain: false,//scaleResult.usingDefaultDomain,
                isLogScaleAllowed: isLogScaleAllowed
            };
        }

        private getCategoryAxis(
            data: MekkoColumnChartData,
            size: number,
            layout: MekkoChartCategoryLayout,
            isVertical: boolean,
            forcedXMin?: DataViewPropertyValue,
            forcedXMax?: DataViewPropertyValue,
            axisScaleType?: string): IAxisProperties {

            var categoryThickness = layout.categoryThickness;
            var isScalar: boolean = layout.isScalar;
            var outerPaddingRatio = layout.outerPaddingRatio;
            var dw = new DataWrapper(data, isScalar);
            var domain: number[] = [];

            if (data.series &&
                (data.series.length > 0) &&
                data.series[0].data &&
                (data.series[0].data.length > 0)
            ) {
                var domainDoubles = data.series[0].data.map((item: MekkoChartColumnDataPoint) => {
                    return item.originalPosition + (item.value / 2);
                });

                domain = domainDoubles.filter(function (item, pos) {
                    return domainDoubles.indexOf(item) === pos;
                });
            }

            var axisProperties: IAxisProperties = this.createAxis({
                pixelSpan: size,
                dataDomain: domain,
                metaDataColumn: data.categoryMetadata,
                outerPadding: categoryThickness * outerPaddingRatio,
                isCategoryAxis: true,
                isScalar: isScalar,
                isVertical: isVertical,
                categoryThickness: categoryThickness,
                useTickIntervalForDisplayUnits: true,
                getValueFn: (index, type) => {
                    var domainIndex = domain.indexOf(index);
                    var value = dw.lookupXValue(domainIndex, type);
                    return value;
                },
                scaleType: axisScaleType,
                borderSettings: data.borderSettings
            });
            // intentionally updating the input layout by ref
            layout.categoryThickness = axisProperties.categoryThickness;
            return axisProperties;
        }

        public setXScale(is100Pct: boolean, forcedTickCount?: number, forcedXDomain?: any[], axisScaleType?: string): IAxisProperties {
            var width = this.width;
            var forcedXMin, forcedXMax;

            if (forcedXDomain && forcedXDomain.length === 2) {
                forcedXMin = forcedXDomain[0];
                forcedXMax = forcedXDomain[1];
            }

            var props = this.xProps = this.getCategoryAxis(
                this.data,
                width,
                this.categoryLayout,
                false,
                forcedXMin,
                forcedXMax,
                axisScaleType);

            return props;
        }

        public setYScale(is100Pct: boolean, forcedTickCount?: number, forcedYDomain?: any[], axisScaleType?: string): IAxisProperties {
            var height = this.viewportHeight;
            var valueDomain = utils.calcValueDomain(this.data.series, is100Pct);
            var valueDomainArr = [valueDomain.min, valueDomain.max];
            var combinedDomain = AxisHelper.combineDomain(forcedYDomain, valueDomainArr);
            var shouldClamp = AxisHelper.scaleShouldClamp(combinedDomain, valueDomainArr);
            var metadataColumn = this.data.valuesMetadata[0];
            var formatString = is100Pct ? // TODO: check it
                /*this.graphicsContext.hostService.getLocalizedString('Percentage')*/"#,0.##%"
                : valueFormatter.getFormatStringByColumn(metadataColumn);

            var mekkoMekkoCreateAxisOptions: MekkoCreateAxisOptions = {
                pixelSpan: height,
                dataDomain: combinedDomain,
                metaDataColumn: metadataColumn,
                formatString: formatString,
                outerPadding: 0,
                isScalar: true,
                isVertical: true,
                forcedTickCount: forcedTickCount,
                useTickIntervalForDisplayUnits: true,
                isCategoryAxis: false,
                scaleType: axisScaleType,
                axisDisplayUnits: 0,
                axisPrecision: 0,
                is100Pct: is100Pct,
                shouldClamp: shouldClamp,
                formatStringProp: undefined,
            };

            this.yProps = AxisHelper.createAxis(mekkoMekkoCreateAxisOptions);
            return this.yProps;
        }

        public drawColumns(useAnimation: boolean): MekkoChartDrawInfo {
            var data = this.data;
            this.columnsCenters = null; // invalidate the columnsCenters so that will be calculated again

            var axisOptions: MekkoColumnAxisOptions = {
                columnWidth: 0,
                xScale: this.xProps.scale,
                yScale: this.yProps.scale,
                isScalar: this.categoryLayout.isScalar,
                margin: this.margin,
            };
            var stackedColumnLayout = this.layout = BaseVisualStrategy.getLayout(data, axisOptions);
            //var dataLabelSettings = data.labelSettings;
            var labelDataPoints: LabelDataPoint[] = this.createMekkoLabelDataPoints();
            var result: MekkoChartAnimationResult;
            var shapes: UpdateSelection<any>;
            var series = utils.drawSeries(data, this.graphicsContext.mainGraphicsContext, axisOptions);
            if (this.animator && useAnimation) {
                // TODO: check it
                // result = this.animator.animate({
                //     viewModel: data,
                //     series: series,
                //     layout: stackedColumnLayout,
                //     itemCS: MekkoChartStrategy.Classes["item"],
                //     interactivityService: this.interactivityService,
                //     mainGraphicsContext: this.graphicsContext.mainGraphicsContext,
                //     viewPort: { height: this.height, width: this.width },
                // });
                // shapes = result.shapes;
            }
            if (!this.animator || !useAnimation /*|| result.failed*/) {
                shapes = BaseVisualStrategy.drawDefaultShapes(data,
                    series,
                    stackedColumnLayout,
                    BaseVisualStrategy.Classes["item"],
                    !this.animator,
                    this.interactivityService && this.interactivityService.hasSelection());
            }

            utils.applyInteractivity(shapes, this.graphicsContext.onDragStart);

            return {
                shapesSelection: shapes,
                viewport: { height: this.height, width: this.width },
                axisOptions,
                labelDataPoints: labelDataPoints,
            };
        }

        private static drawDefaultShapes(data: MekkoColumnChartData,
            series: UpdateSelection<any>,
            layout: IMekkoColumnLayout,
            itemCS: ClassAndSelector,
            filterZeros: boolean,
            hasSelection: boolean): UpdateSelection<any> {
            // We filter out invisible (0, null, etc.) values from the dataset
            // based on whether animations are enabled or not, Dashboard and
            // Exploration mode, respectively.

            var rectName: string = 'rect';
            filterZeros = false;

            var dataSelector: (d: MekkoChartSeries) => any[];
            if (filterZeros) {
                dataSelector = (d: MekkoChartSeries) => {
                    var filteredData = _.filter(d.data, (datapoint: MekkoChartColumnDataPoint) => !!datapoint.value);
                    return filteredData;
                };
            }
            else {
                dataSelector = (d: MekkoChartSeries) => d.data;
            }

            var shapeSelection = series.selectAll(itemCS.selector);
            var shapes = shapeSelection.data(dataSelector, (d: MekkoChartColumnDataPoint) => d.key);

            shapes.enter()
                .append(rectName)
                .attr("class", (d: MekkoChartColumnDataPoint) => itemCS.class.concat(d.highlight ? " highlight" : ""));

            shapes
                .style("fill", (d: MekkoChartColumnDataPoint) => data.showAllDataPoints
                    ? d.color
                    : data.defaultDataPointColor)
                .style("fill-opacity", (d: MekkoChartColumnDataPoint) => utils.getFillOpacity(
                    d.selected,
                    d.highlight,
                    hasSelection,
                    data.hasHighlights))
                .attr(layout.shapeLayout as any);

            shapes
                .exit()
                .remove();

            var borderSelection = series.selectAll(columnChart.BaseColumnChart.BorderClass.selector);
            var borders = borderSelection.data(dataSelector, (d: MekkoChartColumnDataPoint) => d.key);

            var borderColor = columnChart.BaseColumnChart.getBorderColor(data.borderSettings);

            borders.enter()
                .append(rectName)
                .classed(columnChart.BaseColumnChart.BorderClass.class, true);

            borders
                .style("fill", (d: MekkoChartColumnDataPoint) => borderColor)
                .style("fill-opacity", (d: MekkoChartColumnDataPoint) => {
                    return data.hasHighlights
                        ? utils.DimmedOpacity
                        : utils.DefaultOpacity;
                })
                .attr(layout.shapeBorder as any);

            borders
                .exit()
                .remove();

            return shapes;
        }

        public selectColumn(selectedColumnIndex: number, lastSelectedColumnIndex: number): void {
            utils.setChosenColumnOpacity(
                this.graphicsContext.mainGraphicsContext,
                BaseVisualStrategy.Classes["item"].selector,
                selectedColumnIndex,
                lastSelectedColumnIndex);

            this.moveHandle(selectedColumnIndex);
        }

        public getClosestColumnIndex(x: number, y: number): number {
            return utils.getClosestColumnIndex(x, this.getColumnsCenters());
        }

        /**
         * Get the chart's columns centers (x value).
         */
        private getColumnsCenters(): number[] {
            if (!this.columnsCenters) { // lazy creation
                var categoryWidth: number = this.categoryLayout.categoryThickness * (1 - MekkoChart.InnerPaddingRatio);
                // use the axis scale and first series data to get category centers
                if (this.data.series.length > 0) {
                    var xScaleOffset = 0;
                    if (!this.categoryLayout.isScalar) {
                        xScaleOffset = categoryWidth / 2;
                    }
                    var firstSeries = this.data.series[0];
                    if (firstSeries &&
                        firstSeries.data) {
                        this.columnsCenters = firstSeries.data.map(d => this.xProps.scale(this.categoryLayout.isScalar ? d.categoryValue : d.categoryIndex) + xScaleOffset);
                    }
                }
            }
            return this.columnsCenters;
        }

        private moveHandle(selectedColumnIndex: number) {
            var columnCenters = this.getColumnsCenters();
            var x = columnCenters[selectedColumnIndex];

            if (!this.columnSelectionLineHandle) {
                var handle = this.columnSelectionLineHandle = this.graphicsContext.mainGraphicsContext.append('g');
                handle.append('line')
                    .classed('interactive-hover-line', true)
                    .attr({
                        x1: x,
                        x2: x,
                        y1: 0,
                        y2: this.height,
                    });

                handle.append('circle')
                    .attr({
                        cx: x,
                        cy: this.height,
                        r: '6px',
                    })
                    .classed('drag-handle', true);
            }
            else {
                var handle = this.columnSelectionLineHandle;
                handle.select('line').attr({ x1: x, x2: x });
                handle.select('circle').attr({ cx: x });
            }
        }

        public static getLayout(data: MekkoColumnChartData, axisOptions: MekkoColumnAxisOptions): IMekkoColumnLayout {
            var xScale = axisOptions.xScale;
            var yScale = axisOptions.yScale;
            var scaledY0 = yScale(0);
            var scaledX0 = xScale(0);

            var borderWidth: number = columnChart.BaseColumnChart.getBorderWidth(data.borderSettings);

            var columnWidthScale = (d: MekkoChartColumnDataPoint) => {
                var value: number = AxisHelper.diffScaled(xScale, d.value, 0);
                return value;
            };

            var columnStart = (d: MekkoChartColumnDataPoint) => {
                var value: number = scaledX0 +
                    AxisHelper.diffScaled(xScale, d.originalPosition, 0) +
                    borderWidth * d.categoryIndex;
                return value;
            };

            var borderStart = (d: MekkoChartColumnDataPoint) => {
                var value: number = scaledX0 +
                    AxisHelper.diffScaled(xScale, d.originalPosition, 0) +
                    AxisHelper.diffScaled(xScale, d.value, 0) +
                    borderWidth * d.categoryIndex;

                return value;
            };

            return {
                shapeLayout: {
                    width: columnWidthScale,
                    x: columnStart,
                    y: (d: MekkoChartColumnDataPoint) => scaledY0 + AxisHelper.diffScaled(yScale, d.position, 0),
                    height: (d: MekkoChartColumnDataPoint) => utils.getSize(yScale, d.valueAbsolute)
                },
                shapeBorder: {
                    width: (d: MekkoChartColumnDataPoint) => borderWidth,
                    x: borderStart,
                    y: (d: MekkoChartColumnDataPoint) => scaledY0 + AxisHelper.diffScaled(yScale, d.position, 0),
                    height: (d: MekkoChartColumnDataPoint) => utils.getSize(yScale, d.valueAbsolute)
                },
                shapeLayoutWithoutHighlights: {
                    width: columnWidthScale,
                    x: columnStart,
                    y: (d: MekkoChartColumnDataPoint) => scaledY0 + AxisHelper.diffScaled(yScale, d.position, 0),
                    height: (d: MekkoChartColumnDataPoint) => utils.getSize(yScale, d.originalValueAbsolute)
                },
                zeroShapeLayout: {
                    width: columnWidthScale,
                    x: columnStart,
                    y: (d: MekkoChartColumnDataPoint) => scaledY0 + AxisHelper.diffScaled(yScale, d.position, 0) + utils.getSize(yScale, d.valueAbsolute),
                    height: (d: MekkoChartColumnDataPoint) => 0
                },
                shapeXAxis: {
                    width: columnWidthScale,
                    x: columnStart,
                    y: (d: MekkoChartColumnDataPoint) => scaledY0 + AxisHelper.diffScaled(yScale, d.position, 0),
                    height: (d: MekkoChartColumnDataPoint) => utils.getSize(yScale, d.valueAbsolute)
                },
            };
        }

        private createMekkoLabelDataPoints(): LabelDataPoint[] {
            let labelDataPoints: LabelDataPoint[] = [],
                data: MekkoChartData = this.data,
                dataSeries: MekkoChartSeries[] = data.series,
                formattersCache: IColumnFormatterCacheManager = createColumnFormatterCacheManager(),
                shapeLayout = this.layout.shapeLayout;

            for (var currentSeries of dataSeries) {
                const labelSettings = currentSeries.labelSettings
                    ? currentSeries.labelSettings
                    : data.labelSettings;

                if (!labelSettings.show || !currentSeries.data) {
                    continue;
                }

                const axisFormatter: number = getDisplayUnitValueFromAxisFormatter(
                    this.yProps.formatter,
                    labelSettings);

                for (let dataPoint of currentSeries.data) {
                    if ((data.hasHighlights && !dataPoint.highlight)
                        || dataPoint.value == null) {
                        continue;
                    }

                    // Calculate parent rectangle
                    const parentRect: IRect = {
                        left: shapeLayout.x(dataPoint),
                        top: shapeLayout.y(dataPoint),
                        width: shapeLayout.width(dataPoint),
                        height: shapeLayout.height(dataPoint),
                    };

                    let formatString: string = null,
                        value: number = dataPoint.valueOriginal;

                    if (!labelSettings.displayUnits) {
                        formatString = hundredPercentFormat;
                        value = dataPoint.valueAbsolute;
                    }

                    const formatter: IValueFormatter = formattersCache.getOrCreate(
                        formatString,
                        labelSettings,
                        axisFormatter);

                    labelDataPoints.push({
                        parentRect,
                        text: formatter.format(value),
                        fillColor: labelSettings.labelColor
                            ? labelSettings.labelColor
                            : BaseVisualStrategy.DefaultLabelFillColor
                    });
                }
            }

            return labelDataPoints;
        }
    }

    export function getDisplayUnitValueFromAxisFormatter(
        axisFormatter: IValueFormatter,
        labelSettings: VisualDataLabelsSettings): number {

        if (axisFormatter
            && axisFormatter.displayUnit
            && labelSettings.displayUnits === 0) {
            return axisFormatter.displayUnit.value;
        }

        return null;
    }
}
