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

module powerbi.extensibility.visual {
    // powerbi
    import IDataViewObjects = powerbi.DataViewObjects;

    // powerbi.visuals
    import ISelectionId = powerbi.visuals.ISelectionId;

    // d3
    import Axis = d3.svg.Axis;
    import Brush = d3.svg.Brush;
    import Selection = d3.Selection;
    import LinearScale = d3.scale.Linear;
    import UpdateSelection = d3.selection.Update;

    // powerbi.extensibility.utils.dataview
    import DataViewObject = powerbi.extensibility.utils.dataview.DataViewObject;
    import DataViewObjects = powerbi.extensibility.utils.dataview.DataViewObjects;
    import converterHelper = powerbi.extensibility.utils.dataview.converterHelper;

    // powerbi.extensibility.utils.chart
    import AxisHelper = powerbi.extensibility.utils.chart.axis;
    import axisScale = AxisHelper.scale;
    import axisStyle = AxisHelper.style;
    import IAxisProperties = AxisHelper.IAxisProperties;
    import TickLabelMargins = AxisHelper.TickLabelMargins;
    import ILegend = powerbi.extensibility.utils.chart.legend.ILegend;
    import LegendData = powerbi.extensibility.utils.chart.legend.data;
    import ILegendData = powerbi.extensibility.utils.chart.legend.LegendData;
    import legendPosition = powerbi.extensibility.utils.chart.legend.position;
    import legendProps = powerbi.extensibility.utils.chart.legend.legendProps;
    import dataLabelUtils = powerbi.extensibility.utils.chart.dataLabel.utils;
    import createLegend = powerbi.extensibility.utils.chart.legend.createLegend;
    import ILabelLayout = powerbi.extensibility.utils.chart.dataLabel.ILabelLayout;
    import LegendPosition = powerbi.extensibility.utils.chart.legend.LegendPosition;
    import DataLabelObject = powerbi.extensibility.utils.chart.dataLabel.DataLabelObject;
    import LabelEnabledDataPoint = powerbi.extensibility.utils.chart.dataLabel.LabelEnabledDataPoint;
    import VisualDataLabelsSettings = powerbi.extensibility.utils.chart.dataLabel.VisualDataLabelsSettings;
    import drawDefaultLabelsForDataPointChart = powerbi.extensibility.utils.chart.dataLabel.utils.drawDefaultLabelsForDataPointChart;

    // powerbi.extensibility.utils.svg
    import SVGUtil = powerbi.extensibility.utils.svg;
    import IMargin = SVGUtil.IMargin;
    import ISize = SVGUtil.shapes.ISize;
    import ClassAndSelector = SVGUtil.CssConstants.ClassAndSelector;
    import createClassAndSelector = SVGUtil.CssConstants.createClassAndSelector;

    // powerbi.extensibility.utils.interactivity
    import ISelectionHandler = powerbi.extensibility.utils.interactivity.ISelectionHandler;
    import appendClearCatcher = powerbi.extensibility.utils.interactivity.appendClearCatcher;
    import interactivityUtils = powerbi.extensibility.utils.interactivity.interactivityUtils;
    import SelectableDataPoint = powerbi.extensibility.utils.interactivity.SelectableDataPoint;
    import IInteractiveBehavior = powerbi.extensibility.utils.interactivity.IInteractiveBehavior;
    import IInteractivityService = powerbi.extensibility.utils.interactivity.IInteractivityService;
    import createInteractivityService = powerbi.extensibility.utils.interactivity.createInteractivityService;

    // powerbi.extensibility.utils.formatting
    import wordBreaker = powerbi.extensibility.utils.formatting.wordBreaker;
    import TextProperties = powerbi.extensibility.utils.formatting.TextProperties;
    import valueFormatter = powerbi.extensibility.utils.formatting.valueFormatter;
    import ITextAsSVGMeasurer = powerbi.extensibility.utils.formatting.ITextAsSVGMeasurer;
    import DisplayUnitSystemType = powerbi.extensibility.utils.formatting.DisplayUnitSystemType;
    import textMeasurementService = powerbi.extensibility.utils.formatting.textMeasurementService;

    // powerbi.extensibility.utils.type
    import Double = powerbi.extensibility.utils.type.Double;
    import Prototype = powerbi.extensibility.utils.type.Prototype;
    import ValueType = powerbi.extensibility.utils.type.ValueType;
    import PixelConverter = powerbi.extensibility.utils.type.PixelConverter;
    import ArrayExtensions = powerbi.extensibility.utils.type.ArrayExtensions;

    // behavior
    import VisualBehavior = behavior.VisualBehavior;
    import CustomVisualBehavior = behavior.CustomVisualBehavior;
    import VisualBehaviorOptions = behavior.VisualBehaviorOptions;
    import CustomVisualBehaviorOptions = behavior.CustomVisualBehaviorOptions;

    // visualStrategy
    import IVisualStrategy = visualStrategy.IVisualStrategy;
    import BaseVisualStrategy = visualStrategy.BaseVisualStrategy;

    // columnChart
    import IColumnChart = columnChart.IColumnChart;
    import createBaseColumnChartLayer = columnChart.createBaseColumnChartLayer;

    // dataViewUtils
    import isScalar = dataViewUtils.isScalar;
    import getValueAxisProperties = dataViewUtils.getValueAxisProperties;
    import getCategoryAxisProperties = dataViewUtils.getCategoryAxisProperties;

    export interface MekkoChartProperty {
        [propertyName: string]: DataViewObjectPropertyIdentifier;
    }

    export interface MekkoChartProperties {
        [propertyName: string]: MekkoChartProperty;
    }

    export interface MekkoChartClasses {
        [className: string]: ClassAndSelector;
    }

    export interface MekkoChartSettings {
        columnBorder: MekkoBorderSettings;
        labelSettings: MekkoLabelSettings;
    }

    /**
     * Renders a data series as a cartesian visual.
     */
    export class MekkoChart implements IVisual {
        private static LabelGraphicsContextClass: ClassAndSelector = createClassAndSelector("labelGraphicsContext");

        public static Classes: MekkoChartClasses = {
            series: createClassAndSelector('series')
        };

        public static Properties: MekkoChartProperties = {
            dataPoint: {
                defaultColor: { objectName: 'dataPoint', propertyName: 'defaultColor' },
                fill: { objectName: 'dataPoint', propertyName: 'fill' },
                showAllDataPoints: { objectName: 'dataPoint', propertyName: 'showAllDataPoints' },
            },
            columnBorder: {
                show: { objectName: 'columnBorder', propertyName: 'show', },
                color: { objectName: 'columnBorder', propertyName: 'color' },
                width: { objectName: 'columnBorder', propertyName: 'width' }
            }
        };

        public static DefaultSettings: MekkoChartSettings = {
            columnBorder: {
                show: true,
                color: '#fff',
                width: 2,
                maxWidth: 5,
            },
            labelSettings: {
                maxPrecision: 4,
                minPrecision: 0,
            }
        };

        private static getTextProperties(fontSize: number = MekkoChart.FontSize): TextProperties {
            return {
                fontFamily: 'helvetica, arial, sans-serif',
                fontSize: PixelConverter.toString(fontSize),
            };
        }

        public static MinOrdinalRectThickness = 20;
        public static MinScalarRectThickness = 2;
        public static OuterPaddingRatio = 0.4;
        public static InnerPaddingRatio = 0.2;
        public static TickLabelPadding = 2;

        private static ClassName = 'mekkoChart';
        private static AxisGraphicsContextClassName = 'axisGraphicsContext';
        private static MaxMarginFactor = 0.25;
        private static MinBottomMargin = 50;
        private static LeftPadding = 10;
        private static RightPadding = 10;
        private static BottomPadding = 16;
        private static YAxisLabelPadding = 20;
        private static XAxisLabelPadding = 20;
        private static TickPaddingY = 10;
        private static TickPaddingRotatedX = 5;
        private static FontSize = 11;

        public static MaxNumberOfLabels = 100;

        private static MinWidth: number = 100;
        private static MinHeight: number = 100;

        private rootElement: Selection<any>;

        private axisGraphicsContext: Selection<any>;
        private xAxisGraphicsContext: Selection<any>;
        private y1AxisGraphicsContext: Selection<any>;
        private y2AxisGraphicsContext: Selection<any>;
        private svg: Selection<any>;
        private clearCatcher: Selection<any>;

        private margin: IMargin = {
            top: 1,
            right: 1,
            bottom: 1,
            left: 1
        };

        private type: MekkoChartType;
        private visualHost: IVisualHost;
        private layers: IColumnChart[] = [];
        private legend: ILegend;
        private legendMargins: IViewport;
        private layerLegendData: ILegendData;
        private hasSetData: boolean;
        private visualInitOptions: VisualConstructorOptions;

        private borderObjectProperties: DataViewObject;
        private legendObjectProperties: DataViewObject;
        private categoryAxisProperties: DataViewObject;

        private valueAxisProperties: DataViewObject;
        private cartesianSmallViewPortProperties: MekkoChartSmallViewPortProperties;
        private interactivityService: IInteractivityService;
        private behavior: IInteractiveBehavior;
        private y2AxisExists: boolean;
        private categoryAxisHasUnitType: boolean;
        private valueAxisHasUnitType: boolean;
        private hasCategoryAxis: boolean;
        private yAxisIsCategorical: boolean;
        private secValueAxisHasUnitType: boolean;
        private axes: MekkoChartAxisProperties;
        private yAxisOrientation: string;
        private bottomMarginLimit: number;
        private leftRightMarginLimit: number;

        public animator: /*IGenericAnimator*/any;

        // Scrollbar related
        private isScrollable: boolean = false;
        private scrollY: boolean;
        private scrollX: boolean;
        private isXScrollBarVisible: boolean;
        private isYScrollBarVisible: boolean;
        private svgScrollable: Selection<any>;
        private axisGraphicsContextScrollable: Selection<any>;
        private labelGraphicsContextScrollable: Selection<any>;
        private brushGraphicsContext: Selection<any>;
        private brush: Brush<any>;
        private static ScrollBarWidth = 10;

        private dataViews: DataView[];
        private currentViewport: IViewport;

        constructor(options: VisualConstructorOptions) {
            this.init(options);
        }

        public init(options: VisualConstructorOptions) {
            this.visualInitOptions = options;
            this.visualHost = options.host;

            this.rootElement = d3.select(options.element)
                .append("div")
                .classed(MekkoChart.ClassName, true);

            this.behavior = new CustomVisualBehavior([new VisualBehavior()]);

            this.brush = d3.svg.brush();
            this.yAxisOrientation = axis.position.left;

            var showLinesOnX = true;
            var showLinesOnY = true;

            this.svg = this.rootElement.append('svg');
            this.svg.style('position', 'absolute');

            var axisGraphicsContext = this.axisGraphicsContext = this.svg
                .append('g')
                .classed(MekkoChart.AxisGraphicsContextClassName, true);

            this.svgScrollable = this.svg.append('svg')
                .classed('svgScrollable', true)
                .style('overflow', 'hidden');

            var axisGraphicsContextScrollable = this.axisGraphicsContextScrollable = this.svgScrollable.append('g')
                .classed(MekkoChart.AxisGraphicsContextClassName, true);

            this.labelGraphicsContextScrollable = this.svgScrollable
                .append('g')
                .classed(MekkoChart.LabelGraphicsContextClass.class, true);

            this.clearCatcher = appendClearCatcher(this.axisGraphicsContextScrollable);

            const axisGroup: Selection<any> = showLinesOnX
                ? axisGraphicsContextScrollable
                : axisGraphicsContext;

            this.xAxisGraphicsContext = showLinesOnX
                ? axisGraphicsContext
                    .append('g')
                    .attr('class', 'x axis')
                : axisGraphicsContextScrollable
                    .append('g')
                    .attr('class', 'x axis');

            this.y1AxisGraphicsContext = axisGroup
                .append('g')
                .attr('class', 'y axis');

            this.y2AxisGraphicsContext = axisGroup
                .append('g')
                .attr('class', 'y axis');

            this.xAxisGraphicsContext.classed('showLinesOnAxis', showLinesOnX);
            this.y1AxisGraphicsContext.classed('showLinesOnAxis', showLinesOnY);
            this.y2AxisGraphicsContext.classed('showLinesOnAxis', showLinesOnY);

            this.xAxisGraphicsContext.classed('hideLinesOnAxis', !showLinesOnX);
            this.y1AxisGraphicsContext.classed('hideLinesOnAxis', !showLinesOnY);
            this.y2AxisGraphicsContext.classed('hideLinesOnAxis', !showLinesOnY);

            this.interactivityService = createInteractivityService(this.visualHost);

            this.legend = createLegend(
                $(this.rootElement.node()),
                false,
                this.interactivityService,
                true);
        }

        private renderAxesLabels(options: MekkoAxisRenderingOptions, xFontSize: number): void {
            this.axisGraphicsContext
                .selectAll('.xAxisLabel')
                .remove();

            this.axisGraphicsContext
                .selectAll('.yAxisLabel')
                .remove();

            var margin = this.margin;
            var width = options.viewport.width - (margin.left + margin.right);
            var height = options.viewport.height;
            var fontSize = MekkoChart.FontSize;

            var showOnRight = this.yAxisOrientation === axis.position.right;

            if (!options.hideXAxisTitle) {
                var xAxisYPosition = <number>d3.transform(this.xAxisGraphicsContext.attr("transform")).translate[1] - fontSize + xFontSize + 33;

                var xAxisLabel = this.axisGraphicsContext.append("text")
                    .attr({
                        x: width / 2,
                        y: xAxisYPosition
                    })
                    .style({
                        "text-anchor": "middle",
                        "fill": options.xLabelColor ? options.xLabelColor.solid.color : null
                    })
                    .text(options.axisLabels.x)
                    .classed("xAxisLabel", true);

                xAxisLabel.call(
                    AxisHelper.LabelLayoutStrategy.clip,
                    width,
                    textMeasurementService.svgEllipsis);
            }

            if (!options.hideYAxisTitle) {
                var yAxisLabel = this.axisGraphicsContext.append("text")
                    .style("text-anchor", "middle")
                    .text(options.axisLabels.y)
                    .call((text: Selection<any>) => {
                        text.each(function () {
                            var text = d3.select(this);
                            text.attr({
                                "class": "yAxisLabel",
                                "transform": "rotate(-90)",
                                "y": showOnRight ? width + margin.right - fontSize : -margin.left,
                                "x": -((height - margin.top - options.legendMargin) / 2),
                                "dy": "1em"
                            });
                        });
                    });

                yAxisLabel.style("fill", options.yLabelColor ? options.yLabelColor.solid.color : null);

                yAxisLabel.call(AxisHelper.LabelLayoutStrategy.clip,
                    height - (margin.bottom + margin.top),
                    textMeasurementService.svgEllipsis);
            }

            if (!options.hideY2AxisTitle && options.axisLabels.y2) {
                var y2AxisLabel = this.axisGraphicsContext.append("text")
                    .style("text-anchor", "middle")
                    .text(options.axisLabels.y2)
                    .call((text: Selection<any>) => {
                        text.each(function () {
                            var text = d3.select(this);
                            text.attr({
                                "class": "yAxisLabel",
                                "transform": "rotate(-90)",
                                "y": showOnRight ? -margin.left : width + margin.right - fontSize,
                                "x": -((height - margin.top - options.legendMargin) / 2),
                                "dy": "1em"
                            });
                        });
                    });

                y2AxisLabel.style("fill", options.y2LabelColor ? options.y2LabelColor.solid.color : null);

                y2AxisLabel.call(AxisHelper.LabelLayoutStrategy.clip,
                    height - (margin.bottom + margin.top),
                    textMeasurementService.svgEllipsis);
            }
        }

        private adjustMargins(viewport: IViewport): void {
            const width: number = viewport.width - (this.margin.left + this.margin.right),
                height: number = viewport.height - (this.margin.top + this.margin.bottom);

            // Adjust margins if ticks are not going to be shown on either axis
            var xAxis = this.rootElement.selectAll('.x.axis');

            if (AxisHelper.getRecommendedNumberOfTicksForXAxis(width) === 0
                && AxisHelper.getRecommendedNumberOfTicksForYAxis(height) === 0) {

                this.margin = {
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0
                };

                xAxis.style("display", "none");
            } else {
                xAxis.style("display", null);
            }
        }

        private translateAxes(viewport: IViewport): void {
            this.adjustMargins(viewport);
            var margin = this.margin;

            var width = viewport.width - (margin.left + margin.right);
            var height = viewport.height - (margin.top + margin.bottom);

            var showY1OnRight = this.yAxisOrientation === axis.position.right;

            this.xAxisGraphicsContext
                .attr('transform', SVGUtil.translate(0, height));

            this.y1AxisGraphicsContext
                .attr('transform', SVGUtil.translate(showY1OnRight ? width : 0, 0));

            this.y2AxisGraphicsContext
                .attr('transform', SVGUtil.translate(showY1OnRight ? 0 : width, 0));

            this.svg.attr({
                'width': viewport.width,
                'height': viewport.height
            });

            this.svg.style('top', this.legend.isVisible() ? this.legend.getMargins().height + 'px' : 0);

            this.svgScrollable.attr({
                'width': viewport.width,
                'height': viewport.height
            });

            this.svgScrollable.attr({
                'x': 0
            });

            this.axisGraphicsContext.attr(
                'transform',
                SVGUtil.translate(margin.left, margin.top));

            this.axisGraphicsContextScrollable.attr(
                'transform',
                SVGUtil.translate(margin.left, margin.top));

            this.labelGraphicsContextScrollable.attr(
                'transform',
                SVGUtil.translate(margin.left, margin.top));

            if (this.isXScrollBarVisible) {
                this.svgScrollable.attr({
                    'x': this.margin.left
                });
                this.axisGraphicsContextScrollable.attr(
                    'transform',
                    SVGUtil.translate(0, margin.top));

                this.labelGraphicsContextScrollable.attr(
                    'transform',
                    SVGUtil.translate(0, margin.top));

                this.svgScrollable.attr('width', width);

                this.svg
                    .attr({
                        "width": viewport.width,
                        "height": viewport.height + MekkoChart.ScrollBarWidth
                    });
            }
            else if (this.isYScrollBarVisible) {
                this.svgScrollable.attr('height', height + margin.top);

                this.svg
                    .attr({
                        'height': viewport.height,
                        'width': viewport.width + MekkoChart.ScrollBarWidth
                    });
            }
        }

        /**
         * Returns preferred Category span if the visual is scrollable.
         */
        public static getPreferredCategorySpan(categoryCount: number, categoryThickness: number, noOuterPadding?: boolean): number {
            var span = (categoryThickness * categoryCount);
            if (noOuterPadding)
                return span;
            return span + (categoryThickness * MekkoChart.OuterPaddingRatio * 2);
        }

        public static getIsScalar(objects: IDataViewObjects, propertyId: DataViewObjectPropertyIdentifier, type: ValueType): boolean {
            var axisTypeValue = DataViewObjects.getValue(objects, propertyId);

            if (!objects || axisTypeValue === undefined) {
                // If we don't have anything set (Auto), show charts as Scalar if the category type is numeric or time.
                // If we have the property, it will override the type.
                return !AxisHelper.isOrdinal(type);
            }

            // also checking type here to be in sync with AxisHelper, which ignores scalar if the type is non-numeric.
            return (axisTypeValue === axis.type.scalar) && !AxisHelper.isOrdinal(type);
        }

        private populateObjectProperties(dataViews: DataView[]) {
            if (dataViews && dataViews.length > 0) {
                var dataViewMetadata = dataViews[0].metadata;

                if (dataViewMetadata) {
                    this.legendObjectProperties = DataViewObjects.getObject(dataViewMetadata.objects, 'legend', {});
                    this.borderObjectProperties = DataViewObjects.getObject(dataViewMetadata.objects, 'columnBorder', {});
                }
                else {
                    this.legendObjectProperties = {};
                    this.borderObjectProperties = {};
                }

                this.categoryAxisProperties = getCategoryAxisProperties(dataViewMetadata);
                this.valueAxisProperties = getValueAxisProperties(dataViewMetadata);

                if (dataViewMetadata &&
                    dataViewMetadata.objects) {
                    var categoryAxis = dataViewMetadata.objects['categoryAxis'];
                    var valueAxis = dataViewMetadata.objects['valueAxis'];

                    if (categoryAxis) {
                        this.categoryAxisProperties['showBorder'] = categoryAxis['showBorder'];
                        this.categoryAxisProperties['fontSize'] = categoryAxis['fontSize'];
                    }

                    if (valueAxis) {
                        this.valueAxisProperties['fontSize'] = valueAxis['fontSize'];
                    }
                }
                var axisPosition = this.valueAxisProperties['position'];
                this.yAxisOrientation = axisPosition ? axisPosition.toString() : axis.position.left;
            }
        }

        public update(options: VisualUpdateOptions) {
            var dataViews = this.dataViews = options.dataViews;
            this.currentViewport = options.viewport;

            if (!dataViews) {
                this.clearViewport();
                return;
            }

            if ((this.currentViewport.width < MekkoChart.MinWidth) ||
                (this.currentViewport.height < MekkoChart.MinHeight)) {
                this.clearViewport();
                return;
            }

            if (this.layers.length === 0) {
                // Lazily instantiate the chart layers on the first data load.
                this.layers = this.createAndInitLayers(dataViews);

            }

            var layers = this.layers;

            if (dataViews && dataViews.length > 0) {
                // var warnings = getInvalidValueWarnings(
                //     dataViews,
                //     false /*supportsNaN*/,
                //     false /*supportsNegativeInfinity*/,
                //     false /*supportsPositiveInfinity*/);

                // if (warnings && warnings.length > 0) {
                //     this.hostServices.setWarnings(warnings);
                // }
                this.populateObjectProperties(dataViews);
            }

            // this.sharedColorPalette.clearPreferredScale();
            for (var i: number = 0, len: number = layers.length; i < len; i++) {
                layers[i].setData(dataViewUtils.getLayerData(dataViews, i, len));

                // if (len > 1) {
                //     this.sharedColorPalette.rotateScale();
                // }
            }

            // Note: interactive legend shouldn't be rendered explicitly here
            // The interactive legend is being rendered in the render method of ICartesianVisual
            //if (!(this.visualInitOptions.interactivity && this.visualInitOptions.interactivity.isInteractiveLegend)) {
            this.renderLegend(); // TODO: check it
            //}
            this.render(!this.hasSetData /*|| options.suppressAnimations*/);// TODO: check it
            this.hasSetData = this.hasSetData || (dataViews && dataViews.length > 0);
        }

        /**
         * Clear the viewport area
         */
        private clearViewport(): void {
            this.legend.reset();
            this.setVisibility(false);
        }

        private setVisibility(isVisible: boolean = true): void {
            this.svg.style("display", isVisible ? "block" : "none");

            this.rootElement
                .selectAll(".legend")
                .style("display", isVisible ? null : "none");
        }

        public static getLayout(data: MekkoChartData, options: MekkoChartCategoryLayoutOptions): MekkoChartCategoryLayout {
            var categoryCount = options.categoryCount,
                availableWidth = options.availableWidth,
                domain = options.domain,
                trimOrdinalDataOnOverflow = options.trimOrdinalDataOnOverflow,
                isScalar = !!options.isScalar,
                isScrollable = !!options.isScrollable;

            var categoryThickness = MekkoChart.getCategoryThickness(data ? data.series : null, categoryCount, availableWidth, domain, isScalar, trimOrdinalDataOnOverflow);

            // Total width of the outer padding, the padding that exist on the far right and far left of the chart.
            var totalOuterPadding = categoryThickness * MekkoChart.OuterPaddingRatio * 2;

            // visibleCategoryCount will be used to discard data that overflows on ordinal-axis charts.
            // Needed for dashboard visuals            
            var calculatedBarCount = Double.floorWithPrecision((availableWidth - totalOuterPadding) / categoryThickness);
            var visibleCategoryCount = Math.min(calculatedBarCount, categoryCount);
            var willScroll = visibleCategoryCount < categoryCount && isScrollable;

            var outerPaddingRatio = MekkoChart.OuterPaddingRatio;
            if (!isScalar && !willScroll) {
                // use dynamic outer padding to improve spacing when we have few categories
                var oneOuterPadding = (availableWidth - (categoryThickness * visibleCategoryCount)) / 2;
                outerPaddingRatio = oneOuterPadding / categoryThickness;
            }

            // If scrollable, visibleCategoryCount will be total categories
            if (!isScalar && isScrollable)
                visibleCategoryCount = categoryCount;

            return {
                categoryCount: visibleCategoryCount,
                categoryThickness: categoryThickness,
                outerPaddingRatio: outerPaddingRatio,
                isScalar: isScalar
            };
        }

        /** 
         * Returns the thickness for each category.
         * For clustered charts, you still need to divide by
         * the number of series to get column width after calling this method.
         * For linear or time scales, category thickness accomodates for
         * the minimum interval between consequtive points.
         * For all types, return value has accounted for outer padding,
         * but not inner padding.
         */
        public static getCategoryThickness(seriesList: MekkoChartBaseSeries[], numCategories: number, plotLength: number, domain: number[], isScalar: boolean, trimOrdinalDataOnOverflow: boolean): number {
            var thickness;
            if (numCategories < 2)
                thickness = plotLength * (1 - MekkoChart.OuterPaddingRatio);
            else if (isScalar && domain && domain.length > 1) {
                // the smallest interval defines the column width.
                var minInterval = MekkoChart.getMinInterval(seriesList);
                var domainSpan = domain[domain.length - 1] - domain[0];
                // account for outside padding
                var ratio = minInterval / (domainSpan + (minInterval * MekkoChart.OuterPaddingRatio * 2));
                thickness = plotLength * ratio;
                thickness = Math.max(thickness, MekkoChart.MinScalarRectThickness);
            }
            else {
                // Divide the available width up including outer padding (in terms of category thickness) on
                // both sides of the chart, and categoryCount categories. Reverse math:
                // availableWidth = (categoryThickness * categoryCount) + (categoryThickness * (outerPadding * 2)),
                // availableWidth = categoryThickness * (categoryCount + (outerPadding * 2)),
                // categoryThickness = availableWidth / (categoryCount + (outerpadding * 2))
                thickness = plotLength / (numCategories + (MekkoChart.OuterPaddingRatio * 2));
                if (trimOrdinalDataOnOverflow) {
                    thickness = Math.max(thickness, MekkoChart.MinOrdinalRectThickness);
                }
            }

            // spec calls for using the whole plot area, but the max rectangle thickness is "as if there were three categories"
            // (outerPaddingRatio has the same units as '# of categories' so they can be added)
            var maxRectThickness = plotLength / (3 + (MekkoChart.OuterPaddingRatio * 2));

            thickness = Math.min(thickness, maxRectThickness);

            if (!isScalar && numCategories >= 3 && trimOrdinalDataOnOverflow) {
                return Math.max(thickness, MekkoChart.MinOrdinalRectThickness);
            }

            return thickness;
        }

        private static getMinInterval(seriesList: MekkoChartBaseSeries[]): number {
            var minInterval = Number.MAX_VALUE;
            if (seriesList.length > 0) {
                var series0data = seriesList[0].data.filter(d => !d.highlight);
                for (var i = 0, ilen = series0data.length - 1; i < ilen; i++) {
                    minInterval = Math.min(minInterval, Math.abs(series0data[i + 1].categoryValue - series0data[i].categoryValue));
                }
            }
            return minInterval;
        }

        public static parseLabelSettings(objects: IDataViewObjects): VisualDataLabelsSettings {
            var labelSettings: VisualDataLabelsSettings = dataLabelUtils.getDefaultColumnLabelSettings(true);
            var labelsObj: DataLabelObject = <DataLabelObject>objects['labels'];
            var minPrecision = MekkoChart.DefaultSettings.labelSettings.minPrecision,
                maxPrecision = MekkoChart.DefaultSettings.labelSettings.maxPrecision;

            dataLabelUtils.updateLabelSettingsFromLabelsObject(labelsObj, labelSettings);

            if (labelSettings.precision < minPrecision) {
                labelSettings.precision = minPrecision;
            }

            if (labelSettings.precision > maxPrecision) {
                labelSettings.precision = maxPrecision;
            }

            return labelSettings;
        }

        public static parseBorderSettings(objects: IDataViewObjects): MekkoBorderSettings {
            var show: boolean = DataViewObjects.getValue(
                objects,
                MekkoChart.Properties["columnBorder"]["show"],
                MekkoChart.DefaultSettings.columnBorder.show);

            var color = DataViewObjects.getFillColor(
                objects,
                MekkoChart.Properties["columnBorder"]["color"],
                MekkoChart.DefaultSettings.columnBorder.color);

            var width: number = DataViewObjects.getValue(
                objects,
                MekkoChart.Properties["columnBorder"]["width"],
                MekkoChart.DefaultSettings.columnBorder.width);

            var maxWidth: number = MekkoChart.DefaultSettings.columnBorder.maxWidth;

            if (width > maxWidth) {
                width = maxWidth;
            } else if (width < 0) {
                width = 0;
            }

            if (!show) {
                width = 0;
            }

            return {
                show: show,
                color: color,
                width: width,
            };
        }

        private enumerateBorder(instances: VisualObjectInstance[]): void {
            var objects: IDataViewObjects = {
                columnBorder: this.borderObjectProperties
            };

            var show = DataViewObjects.getValue(
                objects,
                MekkoChart.Properties["columnBorder"]["show"],
                MekkoChart.DefaultSettings.columnBorder.show);

            var color = DataViewObjects.getFillColor(
                objects,
                MekkoChart.Properties["columnBorder"]["color"],
                MekkoChart.DefaultSettings.columnBorder.color);

            var width = DataViewObjects.getValue(
                objects,
                MekkoChart.Properties["columnBorder"]["width"],
                MekkoChart.DefaultSettings.columnBorder.width);

            var maxWidth: number = MekkoChart.DefaultSettings.columnBorder.maxWidth;

            if (width > maxWidth) {
                width = maxWidth;
            } else if (width < 0) {
                width = 0;
            }

            var instance: VisualObjectInstance = {
                objectName: 'columnBorder',
                selector: null,
                properties: {
                    show: show,
                    color: color,
                    width: width,
                },
            };

            instances.push(instance);
        }

        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
            const instances: VisualObjectInstance[] = [];

            var layersLength: number = this.layers
                ? this.layers.length
                : 0;

            if (options.objectName === 'columnBorder') {
                this.enumerateBorder(instances);
            }
            else if (options.objectName === 'legend') {
                if (!this.shouldShowLegendCard()) {
                    return;
                }

                this.enumerateLegend(options, instances);
            }
            else if (options.objectName === 'categoryAxis' && this.hasCategoryAxis) {
                this.getCategoryAxisValues(instances);
            }
            else if (options.objectName === 'valueAxis') {
                this.getValueAxisValues(instances);
            }

            for (var i: number = 0, len: number = layersLength; i < len; i++) {
                var layer = this.layers[i];
                if (layer.enumerateObjectInstances) {
                    layer.enumerateObjectInstances(instances, options);
                }
            }

            return instances;
        }

        private enumerateLegend(
            options: EnumerateVisualObjectInstancesOptions,
            instances: VisualObjectInstance[]): void {

            var show: boolean,
                showTitle: boolean,
                titleText: string,
                fontSize: number,
                position: string;

            show = DataViewObject.getValue<boolean>(
                this.legendObjectProperties,
                legendProps.show,
                this.legend.isVisible());

            showTitle = DataViewObject.getValue<boolean>(
                this.legendObjectProperties,
                legendProps.showTitle,
                true);

            titleText = DataViewObject.getValue<string>(
                this.legendObjectProperties,
                legendProps.titleText,
                this.layerLegendData && this.layerLegendData.title
                    ? this.layerLegendData.title
                    : '');

            fontSize = DataViewObject.getValue<number>(
                this.legendObjectProperties,
                legendProps.fontSize,
                this.layerLegendData && this.layerLegendData.fontSize
                    ? this.layerLegendData.fontSize
                    : /*NewDataLabelUtils.DefaultLabelFontSizeInPt*/9);

            position = DataViewObject.getValue<string>(
                this.legendObjectProperties,
                legendProps.position,
                legendPosition.top);

            instances.push({
                selector: null,
                properties: {
                    show: show,
                    position: position,
                    showTitle: showTitle,
                    titleText: titleText,
                    fontSize: fontSize
                },
                objectName: options.objectName
            });
        }

        private shouldShowLegendCard(): boolean {
            var layers = this.layers;
            var dataViews = this.dataViews;

            if (layers && dataViews) {
                var layersLength = layers.length;
                var layersWithValuesCtr = 0;

                for (var i: number = 0; i < layersLength; i++) {
                    if (layers[i].hasLegend()) {
                        return true;
                    }

                    // if there are at least two layers with values legend card should be shown (even if each of the individual layers don't have legend)
                    var dataView = dataViews[i];
                    if (dataView
                        && dataView.categorical
                        && dataView.categorical.values
                        && dataView.categorical.values.length > 0) {

                        layersWithValuesCtr++;

                        if (layersWithValuesCtr > 1) {
                            return true;
                        }
                    }
                }
            }

            return false;
        }

        private getCategoryAxisValues(instances: VisualObjectInstance[]): void {
            var supportedType: string = axis.type.both;
            var isValueScalar: boolean = false;
            var logPossible: boolean = !!this.axes.x.isLogScaleAllowed;
            var scaleOptions: string[] = [axisScale.log, axisScale.linear];//until options can be update in propPane, show all options

            if (this.layers && this.layers[0].getSupportedCategoryAxisType) {
                supportedType = this.layers[0].getSupportedCategoryAxisType();
                if (supportedType === axis.type.scalar) {
                    isValueScalar = true;
                }
                else {
                    isValueScalar = isScalar(
                        supportedType === axis.type.both,
                        this.categoryAxisProperties);
                }
            }

            if (!isValueScalar) {
                if (this.categoryAxisProperties) {
                    this.categoryAxisProperties['start'] = null;
                    this.categoryAxisProperties['end'] = null;
                }
            }

            var instance: VisualObjectInstance = {
                selector: null,
                properties: {},
                objectName: 'categoryAxis',
                validValues: {
                    axisScale: scaleOptions
                }
            };

            instance.properties['show'] = this.categoryAxisProperties && this.categoryAxisProperties['show'] != null
                ? this.categoryAxisProperties['show']
                : true;

            if (this.yAxisIsCategorical)//in case of e.g. barChart
                instance.properties['position'] = this.valueAxisProperties && this.valueAxisProperties['position'] != null
                    ? this.valueAxisProperties['position']
                    : axis.position.left;
            if (supportedType === axis.type.both) {
                instance.properties['axisType'] = isValueScalar
                    ? axis.type.scalar
                    : axis.type.categorical;
            }
            if (isValueScalar) {
                instance.properties['axisScale'] = (this.categoryAxisProperties && this.categoryAxisProperties['axisScale'] != null && logPossible)
                    ? this.categoryAxisProperties['axisScale']
                    : axisScale.linear;

                instance.properties['start'] = this.categoryAxisProperties
                    ? this.categoryAxisProperties['start']
                    : null;

                instance.properties['end'] = this.categoryAxisProperties
                    ? this.categoryAxisProperties['end']
                    : null;
            }

            instance.properties['showAxisTitle'] = this.categoryAxisProperties && this.categoryAxisProperties['showAxisTitle'] != null
                ? this.categoryAxisProperties['showAxisTitle']
                : false;

            instance.properties['showBorder'] = this.categoryAxisProperties && this.categoryAxisProperties['showBorder'] != null
                ? this.categoryAxisProperties['showAxisTitle']
                : false;

            instance.properties['fontSize'] = this.categoryAxisProperties && this.categoryAxisProperties['fontSize'] != null
                ? this.categoryAxisProperties['fontSize']
                : /*NewDataLabelUtils.DefaultLabelFontSizeInPt*/9;

            instances
                .push(instance);

            instances
                .push({
                    selector: null,
                    properties: {
                        axisStyle: this.categoryAxisProperties && this.categoryAxisProperties['axisStyle']
                            ? this.categoryAxisProperties['axisStyle']
                            : axisStyle.showTitleOnly,
                        labelColor: this.categoryAxisProperties
                            ? this.categoryAxisProperties['labelColor']
                            : null
                    },
                    objectName: 'categoryAxis',
                    validValues: {
                        axisStyle: this.categoryAxisHasUnitType
                            ? [
                                axisStyle.showTitleOnly,
                                axisStyle.showUnitOnly,
                                axisStyle.showBoth
                            ]
                            : [axisStyle.showTitleOnly],
                    }
                });
        }

        //todo: wrap all these object getters and other related stuff into an interface
        private getValueAxisValues(instances: VisualObjectInstance[]): void {
            var scaleOptions: string[] = [axisScale.log, axisScale.linear];  //until options can be update in propPane, show all options
            var logPossible: boolean = !!this.axes.y1.isLogScaleAllowed;
            //var secLogPossible = this.axes.y2 != null && this.axes.y2.isLogScaleAllowed;

            var instance: VisualObjectInstance = {
                selector: null,
                properties: {},
                objectName: 'valueAxis',
                validValues: {
                    axisScale: scaleOptions,
                    secAxisScale: scaleOptions
                }
            };

            instance.properties['show'] = this.valueAxisProperties && this.valueAxisProperties['show'] != null
                ? this.valueAxisProperties['show']
                : true;

            if (!this.yAxisIsCategorical) {
                instance.properties['position'] = this.valueAxisProperties && this.valueAxisProperties['position'] != null
                    ? this.valueAxisProperties['position']
                    : axis.position.left;
            }

            instance.properties['axisScale'] = (this.valueAxisProperties && this.valueAxisProperties['axisScale'] != null && logPossible)
                ? this.valueAxisProperties['axisScale']
                : axisScale.linear;

            instance.properties['start'] = this.valueAxisProperties
                ? this.valueAxisProperties['start']
                : null;

            instance.properties['end'] = this.valueAxisProperties
                ? this.valueAxisProperties['end']
                : null;

            instance.properties['showAxisTitle'] = this.valueAxisProperties && this.valueAxisProperties['showAxisTitle'] != null
                ? this.valueAxisProperties['showAxisTitle']
                : false;

            instance.properties['fontSize'] = this.valueAxisProperties && this.valueAxisProperties['fontSize'] != null
                ? this.valueAxisProperties['fontSize']
                : /*NewDataLabelUtils.DefaultLabelFontSizeInPt*/9;

            instances
                .push(instance);

            instances
                .push({
                    selector: null,
                    properties: {
                        axisStyle: this.valueAxisProperties && this.valueAxisProperties['axisStyle'] != null
                            ? this.valueAxisProperties['axisStyle']
                            : axisStyle.showTitleOnly,
                        labelColor: this.valueAxisProperties
                            ? this.valueAxisProperties['labelColor']
                            : null
                    },
                    objectName: 'valueAxis',
                    validValues: {
                        axisStyle: this.valueAxisHasUnitType
                            ? [
                                axisStyle.showTitleOnly,
                                axisStyle.showUnitOnly,
                                axisStyle.showBoth
                            ]
                            : [axisStyle.showTitleOnly]
                    },
                });

            if (this.layers.length === 2) {
                instance.properties['secShow'] = this.valueAxisProperties && this.valueAxisProperties['secShow'] != null
                    ? this.valueAxisProperties['secShow']
                    : this.y2AxisExists;

                if (instance.properties['secShow']) {
                    instance.properties['axisLabel'] = '';//this.layers[0].getVisualType();//I will keep or remove this, depending on the decision made
                }
            }
        }

        public onClearSelection(): void {
            if (this.hasSetData) {
                for (var i: number = 0, len: number = this.layers.length; i < len; i++) {
                    var layer = this.layers[i];
                    layer.onClearSelection();
                    layer.render(true /* suppressAnimations */);
                }
            }
        }

        private createAndInitLayers(dataViews: DataView[]): IColumnChart[] {
            var objects: IDataViewObjects;
            if (dataViews && dataViews.length > 0) {
                var dataViewMetadata = dataViews[0].metadata;
                if (dataViewMetadata)
                    objects = dataViewMetadata.objects;
            }

            // Create the layers

            var layers: IColumnChart[] = createLayers(this.type, objects, this.interactivityService, this.animator, this.isScrollable);
            // TODO: check it
            // Initialize the layers
            var cartesianOptions = <MekkoChartVisualInitOptions>Prototype.inherit(this.visualInitOptions);
            cartesianOptions.svg = this.axisGraphicsContextScrollable;
            cartesianOptions.cartesianHost = {
                updateLegend: data => this.legend.drawLegend(data, this.currentViewport),
                getSharedColors: () => /*this.sharedColorPalette*/this.visualHost.colorPalette, // TODO: check it
                triggerRender: undefined,
            };

            for (var i: number = 0, len: number = layers.length; i < len; i++) {
                layers[i].init(cartesianOptions);
            }

            return layers;
        }

        private renderLegend(): void {
            var layers: IColumnChart[] = this.layers;
            var legendData: ILegendData = { title: "", dataPoints: [] };

            for (var i: number = 0, len: number = layers.length; i < len; i++) {
                this.layerLegendData = layers[i].calculateLegend();
                if (this.layerLegendData) {
                    legendData.title = i === 0 ? this.layerLegendData.title || ""
                        : legendData.title;
                    legendData.dataPoints = legendData.dataPoints.concat(this.layerLegendData.dataPoints || []);
                    if (this.layerLegendData.grouped) {
                        legendData.grouped = true;
                    }
                }
            }

            var legendProperties: DataViewObject = this.legendObjectProperties;
            if (legendProperties) {
                if (!legendProperties['fontSize']) {
                    legendProperties['fontSize'] = /*NewDataLabelUtils.DefaultLabelFontSizeInPt*/9;
                }

                LegendData.update(legendData, legendProperties);
                var position = <string>legendProperties[legendProps.position];

                if (position) {
                    this.legend.changeOrientation(LegendPosition[position]);
                }
            }
            else {
                this.legend.changeOrientation(LegendPosition.Top);
            }

            if ((legendData.dataPoints.length === 1 && !legendData.grouped) || this.hideLegends()) {
                legendData.dataPoints = [];
            }

            this.legend.drawLegend(legendData, this.currentViewport);
        }

        private hideLegends(): boolean {
            if (this.cartesianSmallViewPortProperties) {
                if (this.cartesianSmallViewPortProperties.hideLegendOnSmallViewPort && (this.currentViewport.height < this.cartesianSmallViewPortProperties.MinHeightLegendVisible)) {
                    return true;
                }
            }
            return false;
        }

        private addUnitTypeToAxisLabel(axes: MekkoChartAxisProperties): void {
            var unitType = MekkoChart.getUnitType(axes, (axis: MekkoChartAxisProperties): IAxisProperties => axis.x);
            if (axes.x.isCategoryAxis) {
                this.categoryAxisHasUnitType = unitType !== null;
            }
            else {
                this.valueAxisHasUnitType = unitType !== null;
            }

            if (axes.x.axisLabel && unitType) {
                if (axes.x.isCategoryAxis) {
                    axes.x.axisLabel = AxisHelper.createAxisLabel(this.categoryAxisProperties, axes.x.axisLabel, unitType);
                }
                else {
                    axes.x.axisLabel = AxisHelper.createAxisLabel(this.valueAxisProperties, axes.x.axisLabel, unitType);
                }
            }

            unitType = MekkoChart.getUnitType(axes, (axis: MekkoChartAxisProperties): IAxisProperties => axis.y1);

            if (!axes.y1.isCategoryAxis) {
                this.valueAxisHasUnitType = unitType !== null;
            }
            else {
                this.categoryAxisHasUnitType = unitType !== null;
            }

            if (axes.y1.axisLabel && unitType) {
                if (!axes.y1.isCategoryAxis) {
                    axes.y1.axisLabel = AxisHelper.createAxisLabel(this.valueAxisProperties, axes.y1.axisLabel, unitType);
                }
                else {
                    axes.y1.axisLabel = AxisHelper.createAxisLabel(this.categoryAxisProperties, axes.y1.axisLabel, unitType);
                }
            }

            if (axes.y2) {
                var unitType = MekkoChart.getUnitType(axes, (axis: MekkoChartAxisProperties): IAxisProperties => axis.y2);
                this.secValueAxisHasUnitType = unitType !== null;
                if (axes.y2.axisLabel && unitType) {
                    if (this.valueAxisProperties && this.valueAxisProperties['secAxisStyle']) {
                        if (this.valueAxisProperties['secAxisStyle'] === axisStyle.showBoth) {
                            axes.y2.axisLabel = axes.y2.axisLabel + ' (' + unitType + ')';
                        }
                        else if (this.valueAxisProperties['secAxisStyle'] === axisStyle.showUnitOnly) {
                            axes.y2.axisLabel = unitType;
                        }
                    }
                }
            }
        }

        private shouldRenderSecondaryAxis(axisProperties: IAxisProperties): boolean {
            if (!axisProperties) {
                return false;
            }
            if (!this.valueAxisProperties || this.valueAxisProperties["secShow"] == null || this.valueAxisProperties["secShow"]) {
                return axisProperties.values && axisProperties.values.length > 0;
            }
            return false;
        }

        private shouldRenderAxis(axisProperties: IAxisProperties, propertyName: string = "show"): boolean {
            if (!axisProperties) {
                return false;
            }
            else if (axisProperties.isCategoryAxis && (!this.categoryAxisProperties || this.categoryAxisProperties[propertyName] == null || this.categoryAxisProperties[propertyName])) {
                return axisProperties.values && axisProperties.values.length > 0;
            }
            else if (!axisProperties.isCategoryAxis && (!this.valueAxisProperties || this.valueAxisProperties[propertyName] == null || this.valueAxisProperties[propertyName])) {
                return axisProperties.values && axisProperties.values.length > 0;
            }
            return false;
        }

        private render(suppressAnimations: boolean): void {
            this.setVisibility(true);

            var legendMargins: IViewport = this.legendMargins = this.legend.getMargins();
            var viewport: IViewport = {
                height: this.currentViewport.height - legendMargins.height,
                width: this.currentViewport.width - legendMargins.width
            };

            var maxMarginFactor = this.getMaxMarginFactor();
            var leftRightMarginLimit = this.leftRightMarginLimit = viewport.width * maxMarginFactor;
            this.bottomMarginLimit = Math.max(MekkoChart.MinBottomMargin, Math.ceil(viewport.height * maxMarginFactor));

            var xAxisTextProperties = MekkoChart.getTextProperties(this.categoryAxisProperties
                && PixelConverter.fromPointToPixel(parseFloat(<any>this.categoryAxisProperties['fontSize'])) || undefined);
            var y1AxisTextProperties = MekkoChart.getTextProperties(this.valueAxisProperties
                && PixelConverter.fromPointToPixel(parseFloat(<any>this.valueAxisProperties['fontSize'])) || undefined);

            var margin = this.margin;

            // reset defaults
            margin.top = parseFloat(y1AxisTextProperties.fontSize) / 2;
            margin.bottom = MekkoChart.MinBottomMargin;
            margin.right = 0;

            var axes: MekkoChartAxisProperties = this.axes = axis.utils.calculateAxes(
                this.layers,
                viewport,
                margin,
                this.categoryAxisProperties,
                this.valueAxisProperties,
                this.isXScrollBarVisible || this.isYScrollBarVisible,
                null);

            this.yAxisIsCategorical = axes.y1.isCategoryAxis;
            this.hasCategoryAxis = this.yAxisIsCategorical ? axes.y1 && axes.y1.values.length > 0 : axes.x && axes.x.values.length > 0;

            var renderXAxis = this.shouldRenderAxis(axes.x);
            var renderY1Axis = this.shouldRenderAxis(axes.y1);
            var renderY2Axis = this.shouldRenderSecondaryAxis(axes.y2);

            var width: number = viewport.width - (margin.left + margin.right);
            var isScalar: boolean = false;
            var mainAxisScale;
            var preferredViewport: IViewport;
            this.isXScrollBarVisible = false;
            this.isYScrollBarVisible = false;

            var yAxisOrientation = this.yAxisOrientation;
            var showY1OnRight = yAxisOrientation === axis.position.right;

            if (this.layers) {
                if (this.layers[0].getVisualCategoryAxisIsScalar) {
                    isScalar = this.layers[0].getVisualCategoryAxisIsScalar();
                }

                if (!isScalar && this.isScrollable && this.layers[0].getPreferredPlotArea) {
                    var categoryThickness = this.scrollX ? axes.x.categoryThickness : axes.y1.categoryThickness;
                    var categoryCount = this.scrollX ? axes.x.values.length : axes.y1.values.length;
                    preferredViewport = this.layers[0].getPreferredPlotArea(isScalar, categoryCount, categoryThickness);
                    if (this.scrollX && preferredViewport && preferredViewport.width > viewport.width) {
                        this.isXScrollBarVisible = true;
                        viewport.height -= MekkoChart.ScrollBarWidth;
                    }

                    if (this.scrollY && preferredViewport && preferredViewport.height > viewport.height) {
                        this.isYScrollBarVisible = true;
                        viewport.width -= MekkoChart.ScrollBarWidth;
                        width = viewport.width - (margin.left + margin.right);
                    }
                }
            }

            // Only create the g tag where there is a scrollbar
            if (this.isXScrollBarVisible || this.isYScrollBarVisible) {
                if (!this.brushGraphicsContext) {
                    this.brushGraphicsContext = this.svg.append("g")
                        .classed('x brush', true);
                }
            }
            else {
                // clear any existing brush if no scrollbar is shown
                this.svg.selectAll('.brush').remove();
                this.brushGraphicsContext = undefined;
            }

            // Recalculate axes now that scrollbar visible variables have been set
            axes = axis.utils.calculateAxes(
                this.layers,
                viewport,
                margin,
                this.categoryAxisProperties,
                this.valueAxisProperties,
                this.isXScrollBarVisible || this.isYScrollBarVisible,
                null);

            // we need to make two passes because the margin changes affect the chosen tick values, which then affect the margins again.
            // after the second pass the margins are correct.
            var doneWithMargins: boolean = false,
                maxIterations: number = 2,
                numIterations: number = 0;
            var tickLabelMargins = undefined;
            var chartHasAxisLabels = undefined;
            var axisLabels: MekkoChartAxesLabels = undefined;
            while (!doneWithMargins && numIterations < maxIterations) {
                numIterations++;
                tickLabelMargins = labelUtils.getTickLabelMargins(
                    { width: width, height: viewport.height },
                    leftRightMarginLimit,
                    textMeasurementService.measureSvgTextWidth,
                    textMeasurementService.estimateSvgTextHeight,
                    axes,
                    this.bottomMarginLimit,
                    xAxisTextProperties,
                    y1AxisTextProperties,
                    null,
                    false,
                    this.isXScrollBarVisible || this.isYScrollBarVisible,
                    showY1OnRight,
                    renderXAxis,
                    renderY1Axis,
                    renderY2Axis);

                // We look at the y axes as main and second sides, if the y axis orientation is right so the main side represents the right side
                var maxMainYaxisSide = showY1OnRight ? tickLabelMargins.yRight : tickLabelMargins.yLeft,
                    maxSecondYaxisSide = showY1OnRight ? tickLabelMargins.yLeft : tickLabelMargins.yRight,
                    xMax = renderXAxis ? (tickLabelMargins.xMax / 1.8) : 0;

                maxMainYaxisSide += MekkoChart.LeftPadding;
                maxSecondYaxisSide += MekkoChart.RightPadding;
                xMax += MekkoChart.BottomPadding;

                if (this.hideAxisLabels(legendMargins)) {
                    axes.x.axisLabel = null;
                    axes.y1.axisLabel = null;
                    if (axes.y2) {
                        axes.y2.axisLabel = null;
                    }
                }

                this.addUnitTypeToAxisLabel(axes);

                axisLabels = { x: axes.x.axisLabel, y: axes.y1.axisLabel, y2: axes.y2 ? axes.y2.axisLabel : null };
                chartHasAxisLabels = (axisLabels.x != null) || (axisLabels.y != null || axisLabels.y2 != null);

                if (axisLabels.x != null) {
                    xMax += MekkoChart.XAxisLabelPadding;
                }
                if (axisLabels.y != null) {
                    maxMainYaxisSide += MekkoChart.YAxisLabelPadding;
                }
                if (axisLabels.y2 != null) {
                    maxSecondYaxisSide += MekkoChart.YAxisLabelPadding;
                }

                margin.left = showY1OnRight ? maxSecondYaxisSide : maxMainYaxisSide;
                margin.right = showY1OnRight ? maxMainYaxisSide : maxSecondYaxisSide;
                margin.bottom = xMax;
                this.margin = margin;

                width = viewport.width - (margin.left + margin.right);

                // re-calculate the axes with the new margins
                var previousTickCountY1 = axes.y1.values.length;
                var previousTickCountY2 = axes.y2 && axes.y2.values.length;
                axes = axis.utils.calculateAxes(
                    this.layers,
                    viewport,
                    margin,
                    this.categoryAxisProperties,
                    this.valueAxisProperties,
                    this.isXScrollBarVisible || this.isYScrollBarVisible,
                    axes);

                // the minor padding adjustments could have affected the chosen tick values, which would then need to calculate margins again
                // e.g. [0,2,4,6,8] vs. [0,5,10] the 10 is wider and needs more margin.
                if (axes.y1.values.length === previousTickCountY1 && (!axes.y2 || axes.y2.values.length === previousTickCountY2))
                    doneWithMargins = true;
            }

            this.renderChart(mainAxisScale, axes, width, tickLabelMargins, chartHasAxisLabels, axisLabels, viewport, suppressAnimations);
        }

        private hideAxisLabels(legendMargins: IViewport): boolean {
            if (this.cartesianSmallViewPortProperties) {
                if (this.cartesianSmallViewPortProperties.hideAxesOnSmallViewPort
                    && ((this.currentViewport.height + legendMargins.height) < this.cartesianSmallViewPortProperties.MinHeightAxesVisible)
                /*&& !this.visualInitOptions.interactivity.isInteractiveLegend*/) { // TODO: check it
                    return true;
                }
            }
            return false;
        }

        private static getUnitType(axis: MekkoChartAxisProperties, axisPropertiesLookup: (axis: MekkoChartAxisProperties) => IAxisProperties) {
            if (axisPropertiesLookup(axis).formatter &&
                axisPropertiesLookup(axis).formatter.displayUnit &&
                axisPropertiesLookup(axis).formatter.displayUnit.value > 1) {
                return axisPropertiesLookup(axis).formatter.displayUnit.title;
            }
            return null;
        }

        private getMaxMarginFactor(): number {
            return /*this.visualInitOptions.style.maxMarginFactor ||*/ MekkoChart.MaxMarginFactor; // TODO: check it
        }

        private static getChartViewport(viewport: IViewport, margin: IMargin): IViewport {
            return {
                width: viewport.width - margin.left - margin.right,
                height: viewport.height - margin.top - margin.bottom,
            };
        }

        private static wordBreak(
            text: Selection<any>,
            axisProperties: IAxisProperties,
            columnsWidth: number[],
            maxHeight: number,
            borderWidth: number): void {

            //var allowedLength = axisProperties.xLabelMaxWidth;
            text.each(function (data: any, index: number) {
                var width: number, allowedLength: number;
                var node = d3.select(this);
                if (columnsWidth.length >= index) {
                    width = columnsWidth[index];
                    allowedLength = axisProperties.scale(width);
                } else {
                    allowedLength = axisProperties.xLabelMaxWidth;
                }
                // Reset style of text node
                node
                    .style('text-anchor', 'middle')
                    .attr({
                        'dx': '0em',
                        'dy': '1em',
                        'transform': 'rotate(0)'
                    });

                textMeasurementService.wordBreak(this, allowedLength, axisProperties.willLabelsWordBreak ? maxHeight : 0);
            });
        }

        private renderChart(
            mainAxisScale: any,
            axes: MekkoChartAxisProperties,
            width: number,
            tickLabelMargins: any,
            chartHasAxisLabels: boolean,
            axisLabels: MekkoChartAxesLabels,
            viewport: IViewport,
            suppressAnimations: boolean,
            scrollScale?: any,
            extent?: number[]) {

            var bottomMarginLimit: number = this.bottomMarginLimit;
            var leftRightMarginLimit: number = this.leftRightMarginLimit;
            var layers: IColumnChart[] = this.layers;
            var duration: number = /*GetAnimationDuration(this.animator, suppressAnimations);*/0; // TODO: check it
            var chartViewport: IViewport = MekkoChart.getChartViewport(viewport, this.margin);

            var xLabelColor: Fill;
            var yLabelColor: Fill;
            var y2LabelColor: Fill;

            var xFontSize: any;
            var yFontSize: any;
            //hide show x-axis here
            if (this.shouldRenderAxis(axes.x)) {
                if (axes.x.isCategoryAxis) {
                    xLabelColor = this.categoryAxisProperties && this.categoryAxisProperties['labelColor']
                        ? this.categoryAxisProperties['labelColor']
                        : null;

                    xFontSize = this.categoryAxisProperties && this.categoryAxisProperties['fontSize'] != null
                        ? this.categoryAxisProperties['fontSize']
                        : /*NewDataLabelUtils.DefaultLabelFontSizeInPt*/9;
                } else {
                    xLabelColor = this.valueAxisProperties && this.valueAxisProperties['labelColor']
                        ? this.valueAxisProperties['labelColor']
                        : null;

                    xFontSize = this.valueAxisProperties && this.valueAxisProperties['fontSize']
                        ? this.valueAxisProperties['fontSize']
                        : /*NewDataLabelUtils.DefaultLabelFontSizeInPt*/9;
                }

                xFontSize = PixelConverter.fromPointToPixel(xFontSize);

                axes.x.axis.orient("bottom");
                if (!axes.x.willLabelsFit) {
                    axes.x.axis.tickPadding(MekkoChart.TickPaddingRotatedX);
                }

                var xAxisGraphicsElement: Selection<any> = this.xAxisGraphicsContext;
                if (duration) {
                    xAxisGraphicsElement
                        .transition()
                        .duration(duration)
                        .call(axes.x.axis);
                }
                else {
                    xAxisGraphicsElement
                        .call(axes.x.axis);
                }

                xAxisGraphicsElement
                    .call(MekkoChart.darkenZeroLine)
                    .call(MekkoChart.setAxisLabelColor, xLabelColor)
                    .call(MekkoChart.setAxisLabelFontSize, xFontSize);

                var xAxisTextNodes = xAxisGraphicsElement.selectAll('text');

                var columnWidth: number[] = [];
                var borderWidth: number = 0;
                if (this.layers && this.layers.length) {
                    columnWidth = this.layers[0].getColumnsWidth();
                    borderWidth = this.layers[0].getBorderWidth();
                }

                xAxisGraphicsElement
                    .call(MekkoChart.moveBorder, axes.x.scale, borderWidth, xFontSize / 1.5 - 12);

                xAxisTextNodes
                    .call(MekkoChart.wordBreak, axes.x, columnWidth, bottomMarginLimit, borderWidth);
            }
            else {
                this.xAxisGraphicsContext.selectAll('*').remove();
            }

            if (this.shouldRenderAxis(axes.y1)) {
                if (axes.y1.isCategoryAxis) {
                    yLabelColor = this.categoryAxisProperties && this.categoryAxisProperties['labelColor']
                        ? this.categoryAxisProperties['labelColor']
                        : null;

                    yFontSize = this.categoryAxisProperties && this.categoryAxisProperties['fontSize'] != null
                        ? this.categoryAxisProperties['fontSize']
                        : /*NewDataLabelUtils.DefaultLabelFontSizeInPt*/9;
                } else {
                    yLabelColor = this.valueAxisProperties && this.valueAxisProperties['labelColor']
                        ? this.valueAxisProperties['labelColor']
                        : null;

                    yFontSize = this.valueAxisProperties && this.valueAxisProperties['fontSize'] != null
                        ? this.valueAxisProperties['fontSize']
                        : /*NewDataLabelUtils.DefaultLabelFontSizeInPt*/9;
                }

                yFontSize = PixelConverter.fromPointToPixel(yFontSize);

                var yAxisOrientation = this.yAxisOrientation;
                var showY1OnRight = yAxisOrientation === axis.position.right;
                axes.y1.axis
                    .tickSize(-width)
                    .tickPadding(MekkoChart.TickPaddingY)
                    .orient(yAxisOrientation.toLowerCase());

                var y1AxisGraphicsElement: Selection<any> = this.y1AxisGraphicsContext;
                if (duration) {
                    y1AxisGraphicsElement
                        .transition()
                        .duration(duration)
                        .call(axes.y1.axis);
                }
                else {
                    y1AxisGraphicsElement
                        .call(axes.y1.axis);
                }

                y1AxisGraphicsElement
                    .call(MekkoChart.darkenZeroLine)
                    .call(MekkoChart.setAxisLabelColor, yLabelColor)
                    .call(MekkoChart.setAxisLabelFontSize, yFontSize);

                if (tickLabelMargins.yLeft >= leftRightMarginLimit) {
                    y1AxisGraphicsElement.selectAll('text')
                        .call(AxisHelper.LabelLayoutStrategy.clip,
                        // Can't use padding space to render text, so subtract that from available space for ellipses calculations
                        leftRightMarginLimit - MekkoChart.LeftPadding,
                        textMeasurementService.svgEllipsis);
                }

                if (axes.y2 && (!this.valueAxisProperties || this.valueAxisProperties['secShow'] == null || this.valueAxisProperties['secShow'])) {
                    y2LabelColor = this.valueAxisProperties && this.valueAxisProperties['secLabelColor'] ? this.valueAxisProperties['secLabelColor'] : null;

                    axes.y2.axis
                        .tickPadding(MekkoChart.TickPaddingY)
                        .orient(showY1OnRight
                            ? axis.position.left.toLowerCase()
                            : axis.position.right.toLowerCase());

                    if (duration) {
                        this.y2AxisGraphicsContext
                            .transition()
                            .duration(duration)
                            .call(axes.y2.axis);
                    }
                    else {
                        this.y2AxisGraphicsContext
                            .call(axes.y2.axis);
                    }

                    this.y2AxisGraphicsContext
                        .call(MekkoChart.darkenZeroLine)
                        .call(MekkoChart.setAxisLabelColor, y2LabelColor);

                    if (tickLabelMargins.yRight >= leftRightMarginLimit) {
                        this.y2AxisGraphicsContext
                            .selectAll('text')
                            .call(
                            AxisHelper.LabelLayoutStrategy.clip,
                            // Can't use padding space to render text, so subtract that from available space for ellipses calculations
                            leftRightMarginLimit - MekkoChart.RightPadding,
                            textMeasurementService.svgEllipsis);
                    }
                }
                else {
                    this.y2AxisGraphicsContext
                        .selectAll('*')
                        .remove();
                }
            }
            else {
                this.y1AxisGraphicsContext
                    .selectAll('*')
                    .remove();

                this.y2AxisGraphicsContext
                    .selectAll('*')
                    .remove();
            }

            this.translateAxes(viewport);

            // Axis labels
            if (chartHasAxisLabels) {
                const hideXAxisTitle: boolean = !this.shouldRenderAxis(axes.x, "showAxisTitle"),
                    hideYAxisTitle: boolean = !this.shouldRenderAxis(axes.y1, "showAxisTitle");

                const hideY2AxisTitle: boolean = this.valueAxisProperties
                    && this.valueAxisProperties["secShowAxisTitle"] != null
                    && this.valueAxisProperties["secShowAxisTitle"] === false;

                const renderAxisOptions: MekkoAxisRenderingOptions = {
                    axisLabels: axisLabels,
                    legendMargin: this.legendMargins.height,
                    viewport: viewport,
                    hideXAxisTitle: hideXAxisTitle,
                    hideYAxisTitle: hideYAxisTitle,
                    hideY2AxisTitle: hideY2AxisTitle,
                    xLabelColor: xLabelColor,
                    yLabelColor: yLabelColor,
                    y2LabelColor: y2LabelColor,
                    margin: undefined
                };

                this.renderAxesLabels(renderAxisOptions, xFontSize);
            }
            else {
                this.axisGraphicsContext
                    .selectAll('.xAxisLabel')
                    .remove();

                this.axisGraphicsContext
                    .selectAll('.yAxisLabel')
                    .remove();
            }

            let dataPoints: SelectableDataPoint[] = [],
                layerBehaviorOptions: any[] = [];

            if (this.behavior) {
                let resultsLabelDataPoints: LabelDataPoint[] = [];

                for (let layerIndex: number = 0; layerIndex < layers.length; layerIndex++) {
                    const result: MekkoVisualRenderResult = layers[layerIndex].render(suppressAnimations);

                    if (result) {
                        dataPoints = dataPoints.concat(result.dataPoints);
                        layerBehaviorOptions.push(result.behaviorOptions);

                        resultsLabelDataPoints = resultsLabelDataPoints.concat(result.labelDataPoints);
                    }
                }

                drawDefaultLabelsForDataPointChart(
                    resultsLabelDataPoints,
                    this.labelGraphicsContextScrollable,
                    this.getLabelLayout(),
                    this.currentViewport);

                if (this.interactivityService) {
                    const behaviorOptions: CustomVisualBehaviorOptions = {
                        layerOptions: layerBehaviorOptions,
                        clearCatcher: this.clearCatcher,
                    };

                    this.interactivityService.bind(
                        dataPoints,
                        this.behavior,
                        behaviorOptions);
                }
            }
        }

        private getLabelLayout(): ILabelLayout {
            return {
                labelText: (dataPoint: LabelDataPoint) => {
                    return dataPoint.text;
                },
                labelLayout: {
                    x: (dataPoint: LabelDataPoint) => {
                        return dataPoint.parentRect.left + dataPoint.parentRect.width / 2;
                    },
                    y: (dataPoint: LabelDataPoint) => {
                        return dataPoint.parentRect.top + dataPoint.parentRect.height / 2;
                    }
                },
                filter: (dataPoint: LabelDataPoint) => {
                    return dataPoint != null
                        && dataPoint.size.height < dataPoint.parentRect.height
                        && dataPoint.size.width < dataPoint.parentRect.width;
                },
                style: {
                    "fill": (dataPoint: LabelDataPoint) => {
                        return dataPoint.fillColor;
                    }
                }
            }
        }

        /**
         * Within the context of the given selection (g), find the offset of
         * the zero tick using the d3 attached datum of g.tick elements.
         * 'Classed' is undefined for transition selections
         */
        private static darkenZeroLine(g: Selection<any>): void {
            var zeroTick = g.selectAll('g.tick').filter((data) => data === 0).node();
            if (zeroTick) {
                d3.select(zeroTick).select('line').classed('zero-line', true);
            }
        }

        private static setAxisLabelColor(g: Selection<any>, fill: Fill): void {
            g.selectAll('g.tick text').style('fill', fill ? fill.solid.color : null);
        }

        private static setAxisLabelFontSize(g: Selection<any>, fontSize: number): void {
            var value = PixelConverter.toString(fontSize);
            g.selectAll('g.tick text').attr('font-size', value);
        }

        private static moveBorder(
            g: Selection<any>,
            scale: LinearScale<number, number>,
            borderWidth: number,
            yOffset: number = 0): void {

            g.selectAll('g.tick')
                .attr("transform", function (value: number, index: number) {
                    return SVGUtil.translate(scale(value) + (borderWidth * index), yOffset);
                });
        }
    }

    export function createLayers(
        type: MekkoChartType,
        objects: IDataViewObjects,
        interactivityService: IInteractivityService,
        animator?: any,
        isScrollable: boolean = true): IColumnChart[] {

        var layers: IColumnChart[] = [];

        var cartesianOptions: MekkoChartConstructorBaseOptions = {
            isScrollable: isScrollable,
            animator: animator,
            interactivityService: interactivityService
        };

        layers.push(createBaseColumnChartLayer(MekkoVisualChartType.hundredPercentStackedColumn, cartesianOptions));

        return layers;
    }




    // TODO: check this class.
    // export class MekkoChartSharedColorPalette implements IDataColorPalette {
    //     private palette: IColorPalette;
    //     private preferredScale: IColorScale;
    //     private rotated: boolean;

    //     constructor(palette: IColorPalette) {
    //         this.palette = palette;
    //         this.clearPreferredScale();
    //     }

    //     public getColorScaleByKey(scaleKey: string): IColorScale {
    //         this.setPreferredScale(scaleKey);
    //         return this.preferredScale;
    //     }

    //     public getNewColorScale(): IColorScale {
    //         return this.preferredScale;
    //     }

    //     public getColorByIndex(index: number): IColorInfo {
    //         return this.palette.getColorByIndex(index);
    //     }

    //     public getSentimentColors(): IColorInfo[] {
    //         return this.palette.getSentimentColors();
    //     }

    //     public getBasePickerColors(): IColorInfo[] {
    //         return this.palette.getBasePickerColors();
    //     }

    //     public clearPreferredScale(): void {
    //         this.preferredScale = this.palette.getNewColorScale();
    //         this.rotated = false;
    //     }

    //     public rotateScale(): void {
    //         // We create a new rotated the scale such that the first color of the new scale is the first
    //         // free color of the previous scale. Note that the new scale does not have any colors allocated
    //         // to particular keys.
    //         this.preferredScale = this.preferredScale.clone();
    //         this.preferredScale.clearAndRotateScale();
    //         this.rotated = true;
    //     }

    //     private setPreferredScale(scaleKey: string): void {
    //         if (!this.rotated) {
    //             // The first layer to express a preference sets the preferred scale.
    //             this.preferredScale = this.palette.getColorScaleByKey(scaleKey);
    //         }
    //     }
    // }
}
