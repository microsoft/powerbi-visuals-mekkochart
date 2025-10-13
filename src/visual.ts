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

import "./../style/visual.less";

import powerbi from "powerbi-visuals-api";

import IViewport = powerbi.IViewport;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import DataViewMetadataColumn = powerbi.DataViewMetadataColumn;
import DataViewMetadata = powerbi.DataViewMetadata;
import PrimitiveValue = powerbi.PrimitiveValue;
import DataViewObjectPropertyIdentifier = powerbi.DataViewObjectPropertyIdentifier;
import DataView = powerbi.DataView;
import ValueTypeDescriptor = powerbi.ValueTypeDescriptor;
import Fill = powerbi.Fill;
import VisualUpdateType = powerbi.VisualUpdateType;

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import ILocalizationManager = powerbi.extensibility.ILocalizationManager;
import ISandboxExtendedColorPalette = powerbi.extensibility.ISandboxExtendedColorPalette;

import {
    MekkoColumnChartData,
    MekkoChartVisualInitOptions,
    MekkoChartCategoryLayout,
    MekkoBorderSettings,
    MekkoSeriesSortSettings,
    MekkoLegendSortSettings,
    MekkoXAxisLabelsSettings,
    MekkoCategoryColorSettings,
    MekkoDataPointSettings,
    MekkoLegendDataPoint,
    MekkoVisualRenderResult,
    MekkoChartConstructorBaseOptions,
    MekkoChartAxisProperties,
    MekkoChartSmallViewPortProperties,
    MekkoChartAxesLabels,
    MekkoAxisRenderingOptions,
    MekkoChartCategoryLayoutOptions,
    MekkoChartData,
    LabelDataPoint,
    IGrouppedLegendData,
    MekkoLabelSettings,
    MekkoChartBaseSeries,
    MekkoChartDataPoint,
    ILegendGroup,
    Selection,
    MekkoColumnAxisOptions,
    RectDataPoint,
} from "./dataInterfaces";

import {
    MekkoChartType,
    MekkoVisualChartType
} from "./visualChartType";

import * as dataViewUtils from "./dataViewUtils";

import * as labelUtils from "./labelUtils";

import * as axisType from "./axis/type";
import * as axisPosition from "./axis/position";
import * as axisUtils from "./axis/utils";

import { dataViewObjects } from "powerbi-visuals-utils-dataviewutils";

import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import { LegendSettings, MekkoChartObjectNames, VisualFormattingSettingsModel } from "./settings";

import { max, sum } from "d3-array";
import { select } from "d3-selection";
import { brushX, BrushBehavior } from "d3-brush";
import { ScaleLinear as d3ScaleLinear } from "d3-scale";

import type { TickLabelMargins } from "./labelUtils";
type ScaleLinear<T> = d3ScaleLinear<T, T, never>;

// powerbi.extensibility.utils.chart
import {
    axis as AxisHelper,
    axisInterfaces,
    dataLabelInterfaces,
    dataLabelUtils,
    legendInterfaces,
    legendData as LegendData,
    legend
} from "powerbi-visuals-utils-chartutils";

import IAxisProperties = axisInterfaces.IAxisProperties;
import ILegend = legendInterfaces.ILegend;
import ILegendData = legendInterfaces.LegendData;
import ISelectableDataPoint = legendInterfaces.ISelectableDataPoint;

import createLegend = legend.createLegend;
import ILabelLayout = dataLabelInterfaces.ILabelLayout;
import LegendPosition = legendInterfaces.LegendPosition;
import drawDefaultLabelsForDataPointChart = dataLabelUtils.drawDefaultLabelsForDataPointChart;

// powerbi.extensibility.utils.svg
import {
    IMargin,
    manipulation,
    CssConstants
} from "powerbi-visuals-utils-svgutils";
import ClassAndSelector = CssConstants.ClassAndSelector;
import createClassAndSelector = CssConstants.createClassAndSelector;

// powerbi.extensibility.utils.formatting
import {
    valueFormatter,
    textMeasurementService,
    interfaces as tmsInterfaces
} from "powerbi-visuals-utils-formattingutils";
import TextProperties = tmsInterfaces.TextProperties;

// powerbi.extensibility.utils.type

import {
    double as Double,
    prototype as Prototype,
    valueType,
    pixelConverter as PixelConverter
} from "powerbi-visuals-utils-typeutils";

import ValueType = valueType.ValueType;

// powerbi.visuals.subselections
import { HtmlSubSelectableClass, SubSelectableDirectEdit, SubSelectableDisplayNameAttribute, SubSelectableObjectNameAttribute, SubSelectableTypeAttribute } from "powerbi-visuals-utils-onobjectutils";
import CustomVisualSubSelection = powerbi.visuals.CustomVisualSubSelection;
import SubSelectionStylesType = powerbi.visuals.SubSelectionStylesType;

// behavior
import { CustomVisualBehavior } from "./behavior/customVisualBehavior";
import { CustomVisualBehaviorOptions } from "./behavior/customVisualBehaviorOptions";
import { VisualBehaviorOptions } from "./behavior/visualBehaviorOptions";

import * as columnChart from "./columnChart/columnChartVisual";
import * as columnChartBaseColumnChart from "./columnChart/baseColumnChart";

import { MekkoChartOnObjectService } from "./onObject/onObjectService";

// columnChart
import IColumnChart = columnChart.IColumnChart;
import BaseColumnChart = columnChartBaseColumnChart.BaseColumnChart;
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import { titleEditSubSelection } from "./onObject/references";
import { BaseVisualStrategy } from "./visualStrategy/baseVisualStrategy";

export interface MekkoChartProperty {
    [propertyName: string]: DataViewObjectPropertyIdentifier;
}

export interface MekkoChartProperties {
    [propertyName: string]: MekkoChartProperty;
}

export interface MekkoChartSettings {
    columnBorder: MekkoBorderSettings;
    labelSettings: MekkoLabelSettings;

    sortSeries: MekkoSeriesSortSettings;
    sortLegend: MekkoLegendSortSettings;
    xAxisLabels: MekkoXAxisLabelsSettings;
    categoryColor: MekkoCategoryColorSettings;
    dataPoint: MekkoDataPointSettings;
    categoryAxis: MekkoCategoryXAxisSettings;
    valueAxis: MekkoCategoryXAxisSettings;
}
export interface MekkoCategoryXAxisSettings {
    labelColor: Fill;
}

/**
 * Renders a data series as a cartesian visual.
 */
export class MekkoChart implements IVisual {
    private static XAxisYPositionOffset: number = 33;
    private static WidthDelimiter: number = 2;
    private static XDelimiter: number = 2;
    private static TransformRotate: string = "rotate(-90)";
    private static DefaultDy: string = "1em";

    private static LabelGraphicsContextClass: ClassAndSelector = createClassAndSelector("labelGraphicsContext");
    private static BaseXAxisSelector: ClassAndSelector = createClassAndSelector("x.axis");
    private static AxisLabelSelector: ClassAndSelector = createClassAndSelector("label");
    private static LegendSelector: ClassAndSelector = createClassAndSelector("legend");
    private static XBrushSelector: ClassAndSelector = createClassAndSelector("x brush");
    private static BrushSelector: ClassAndSelector = createClassAndSelector("brush");
    private static LabelMiddleSelector: ClassAndSelector = createClassAndSelector("labelMiddle");
    private static ZeroLineSelector: ClassAndSelector = createClassAndSelector("zero-line");
    private static SvgScrollableSelector: ClassAndSelector = createClassAndSelector("svgScrollable");
    private static XSelector: ClassAndSelector = createClassAndSelector("x");
    private static YSelector: ClassAndSelector = createClassAndSelector("y");
    private static AxisSelector: ClassAndSelector = createClassAndSelector("axis");
    private static XAxisSelector: ClassAndSelector = createClassAndSelector("x axis");
    private static YAxisSelector: ClassAndSelector = createClassAndSelector("y axis");
    private static ShowLinesOnAxisSelector: ClassAndSelector = createClassAndSelector("showLinesOnAxis");
    private static HideLinesOnAxisSelector: ClassAndSelector = createClassAndSelector("hideLinesOnAxis");
    private static RootSvgSelector: ClassAndSelector = createClassAndSelector("root-svg-element");

    private static DefaultLabelDx: string = "0em";
    private static DefaultLabelDy: string = "1em";
    private static DefaultLabelRotate: string = "rotate(0)";

    private static DefaultLabelFontSizeInPt: number = 9;

    private static XFontSizeDelimiter: number = 1.5;
    private static XFontSizeOffset: number = 12;

    private static TickLabelMarginsXMaxFactor: number = 1.8;

    private static MarginTopFactor: number = 2;

    private static OuterPaddingRatioFactor: number = 2;
    private static OuterPaddingRatioDelimiter: number = 2;
    private static OuterPaddingRatioOffset: number = 3;

    private static ClassName: string = "mekkoChart";
    private static AxisGraphicsContextClassName: string = "axisGraphicsContext";
    private static BgRectClassname: string = "bg-rect";
    private static MaxMarginFactor: number = 0.25;
    private static MinBottomMargin: number = 50;
    private static LeftPadding: number = 17;
    private static RightPadding: number = 10;
    private static BottomPadding: number = 22;
    private static YAxisLabelPadding: number = 20;
    private static XAxisLabelPadding: number = 20;
    private static TickPaddingY: number = 10;
    private static TickPaddingRotatedX: number = 5;
    private static FontSize: number = 11;

    private static MinWidth: number = 100;
    private static MinHeight: number = 80;

    private static ScrollBarWidth: number = 10;

    private static AnimationDuration: number = 0;

    private static ShowAxisTitlePropertyName: string = "showAxisTitle";
    private static SecondShowAxisTitlePropertyName: string = "secShowAxisTitle";

    private static SortDirectionDescending: string = "des";
    private static SortDirectionAscending: string = "asc";

    private static CategoryTextRotataionDegree: number = 45.0;

    private static LegendBarHeightMargin: number = 5;

    private static LegendBarTextFont: string = "helvetica, arial, sans-serif;";

    private static getTextProperties(fontSize: number = MekkoChart.FontSize, fontFamily: string): TextProperties {
        return {
            fontFamily: fontFamily,
            fontSize: PixelConverter.fromPoint(fontSize),
        };
    }

    public static SeriesSelector: ClassAndSelector = createClassAndSelector("series");

    public static Properties: MekkoChartProperties = <MekkoChartProperties>{
        dataPoint: {
            defaultColor: { objectName: "dataPoint", propertyName: "defaultColor" },
            fill: { objectName: "dataPoint", propertyName: "fill" }
        }
    };

    public static MinOrdinalRectThickness: number = 20;
    public static MinScalarRectThickness: number = 2;
    public static OuterPaddingRatio: number = 0.4;
    public static InnerPaddingRatio: number = 0.2;
    public static TickLabelPadding: number = 2;
    public static DefaultAxisLinesColor: string = "black";

    private rootElement: Selection;
    private legendParent: Selection;
    private axisGraphicsContext: Selection;
    private xAxisGraphicsContext: Selection;
    private y1AxisGraphicsContext: Selection;
    private svg: Selection;
    private legendSelection: Selection;

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
    private categoryLegends: ILegend[];
    private legendMargins: IViewport;
    private layerLegendData: ILegendData;
    private hasSetData: boolean;
    private visualInitOptions: VisualConstructorOptions;

    private categoryAxisProperties: powerbi.DataViewObject;

    private valueAxisProperties: powerbi.DataViewObject;
    private cartesianSmallViewPortProperties: MekkoChartSmallViewPortProperties;

    private behavior: CustomVisualBehavior;

    private categoryAxisHasUnitType: boolean;
    private valueAxisHasUnitType: boolean;
    private hasCategoryAxis: boolean;
    private yAxisIsCategorical: boolean;
    private secValueAxisHasUnitType: boolean;
    private axes: MekkoChartAxisProperties;
    private yAxisOrientation: string;
    private bottomMarginLimit: number;
    private leftRightMarginLimit: number;

    private isScrollable: boolean = false;
    private scrollY: boolean;
    private scrollX: boolean;
    private isXScrollBarVisible: boolean;
    private isYScrollBarVisible: boolean;
    private svgScrollable: Selection;
    private axisGraphicsContextScrollable: Selection;
    private labelGraphicsContextScrollable: Selection;
    private brushGraphicsContext: Selection;

    private dataViews: DataView[];
    private currentViewport: IViewport;

    private brush: BrushBehavior<any>;

    private formattingSettingsService: FormattingSettingsService;
    private localizationManager: ILocalizationManager;
    private selectionManager: ISelectionManager;
    private colorPalette: ISandboxExtendedColorPalette;

    public visualOnObjectFormatting: MekkoChartOnObjectService;
    public settingsModel: VisualFormattingSettingsModel;

    constructor(options: VisualConstructorOptions) {
        this.init(options);
    }

    public init(options: VisualConstructorOptions) {
        this.visualInitOptions = options;
        this.visualHost = options.host;
        this.colorPalette = options.host.colorPalette;

        select("body").style(
            "-webkit-tap-highlight-color", "transparent"
        );

        this.rootElement = select(options.element)
            .append("div")
            .classed(MekkoChart.ClassName, true);

        this.brush = brushX();
        this.yAxisOrientation = axisPosition.left;

        this.svg = this.rootElement
            .append("svg")
            .classed(MekkoChart.RootSvgSelector.className, true);

        this.axisGraphicsContext = this.svg
            .append("g")
            .classed(MekkoChart.AxisGraphicsContextClassName, true);

        this.svgScrollable = this.svg
            .append("svg")
            .classed(MekkoChart.SvgScrollableSelector.className, true);

        this.axisGraphicsContextScrollable = this.svgScrollable
            .append("g")
            .classed(MekkoChart.AxisGraphicsContextClassName, true);

        this.labelGraphicsContextScrollable = this.svgScrollable
            .append("g")
            .classed(MekkoChart.LabelGraphicsContextClass.className, true);

        this.xAxisGraphicsContext = this.axisGraphicsContext
            .append("g")
            .classed(MekkoChart.XAxisSelector.className, true);

        this.y1AxisGraphicsContext = this.axisGraphicsContextScrollable
            .append("g")
            .classed(MekkoChart.YAxisSelector.className, true);

        this.xAxisGraphicsContext
            .classed(MekkoChart.ShowLinesOnAxisSelector.className, true)
            .classed(MekkoChart.HideLinesOnAxisSelector.className, false);

        this.y1AxisGraphicsContext
            .classed(MekkoChart.ShowLinesOnAxisSelector.className, true)
            .classed(MekkoChart.HideLinesOnAxisSelector.className, false);


        this.selectionManager = options.host.createSelectionManager();
        this.behavior = new CustomVisualBehavior(this.selectionManager, this.colorPalette);

        this.localizationManager = this.visualHost.createLocalizationManager();
        this.formattingSettingsService = new FormattingSettingsService(this.localizationManager);
        this.visualOnObjectFormatting = new MekkoChartOnObjectService(options.element, options.host, this.localizationManager, this.getSeriesDataPoints.bind(this));

        const legendParent = select(this.rootElement.node()).append("div").classed("legendParentDefault", true);

        this.legend = createLegend(
            <HTMLElement>legendParent.node(),
            true);
    }

    private calculateXAxisAdditionalHeight(categories: PrimitiveValue[]): number {
        const sortedByLength: PrimitiveValue[] = categories.sort((a: string, b: string) => a.length > b.length ? 1 : -1);
        let longestCategory: PrimitiveValue = sortedByLength[categories.length - 1] || "";
        const shortestCategory: PrimitiveValue = sortedByLength[0] || "";

        if (longestCategory instanceof Date) {
            const metadataColumn: DataViewMetadataColumn = this.dataViews[0].categorical.categories[0].source;
            const formatString: string = valueFormatter.getFormatStringByColumn(metadataColumn);

            const formatter = valueFormatter.create({
                format: formatString,
                value: shortestCategory,
                value2: longestCategory,
                columnType: <ValueTypeDescriptor>{
                    dateTime: true
                }
            });

            longestCategory = formatter.format(longestCategory);
        }

        const xAxisTextProperties: TextProperties = MekkoChart.getTextProperties(this.settingsModel.categoryAxis.fontControl.fontSize.value, this.settingsModel.categoryAxis.fontControl.fontFamily.value);

        const longestCategoryWidth = textMeasurementService.measureSvgTextWidth(xAxisTextProperties, longestCategory.toString());
        const requiredHeight = longestCategoryWidth * Math.tan(MekkoChart.CategoryTextRotataionDegree * Math.PI / 180);
        return requiredHeight;
    }

    public static getTranslation(transform): [number, number, number] {
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");

        g.setAttributeNS(null, "transform", transform);

        const matrix = g.transform.baseVal.consolidate().matrix;

        return [matrix.e, matrix.f, -Math.asin(matrix.a) * 180 / Math.PI];
    }

    private renderAxesLabels(options: MekkoAxisRenderingOptions, xFontSize: number): void {
        this.axisGraphicsContext
            .selectAll(MekkoChart.AxisLabelSelector.selectorName)
            .remove();

        const margin: IMargin = this.margin,
            width: number = options.viewport.width - (margin.left + margin.right),
            height: number = options.viewport.height,
            fontSize: number = MekkoChart.FontSize;

        const showOnRight: boolean = this.yAxisOrientation === axisPosition.right;

        if (!options.hideXAxisTitle && (this.settingsModel.categoryAxis.show.value)) {
            const xAxisYPosition: number = MekkoChart.getTranslation(this.xAxisGraphicsContext.attr("transform"))[1]
                - fontSize + xFontSize + MekkoChart.XAxisYPositionOffset;

            const rotataionEnabled = this.settingsModel.xAxisLabels.enableRotataion.value && this.settingsModel.categoryAxis.show.value;

            let shiftTitle: number = 0;
            if (rotataionEnabled) {
                const axes: MekkoChartAxisProperties = this.axes = axisUtils.calculateAxes(
                    this.layers,
                    options.viewport,
                    this.margin,
                    this.settingsModel.categoryAxis,
                    this.settingsModel.valueAxis,
                    this.settingsModel);
                shiftTitle = this.calculateXAxisAdditionalHeight(axes.x.values);
            }

            const xAxisLabel: Selection = this.axisGraphicsContext.append("text")
                .attr("x", width / MekkoChart.WidthDelimiter)
                .attr("y", xAxisYPosition + shiftTitle)
                .style("fill", options.xLabelColor)
                .text(options.axisLabels.x)
                .classed(MekkoChart.XSelector.className, true)
                .classed(MekkoChart.AxisSelector.className, true)
                .classed(MekkoChart.AxisLabelSelector.className, true);

            xAxisLabel.call(
                AxisHelper.LabelLayoutStrategy.clip,
                width,
                textMeasurementService.svgEllipsis);

            this.applyOnObjectStylesToAxisTitle(xAxisLabel, options.isFormatMode, MekkoChartObjectNames.XAxisTitle);
        }

        if (!options.hideYAxisTitle) {
            const yAxisLabel: Selection = this.axisGraphicsContext.append("text")
                .style(
                    "fill", options.yLabelColor
                )
                .text(options.axisLabels.y)
                .attr("transform", MekkoChart.TransformRotate)
                .attr(
                    "y", showOnRight
                    ? width + margin.right - fontSize
                    : -margin.left
                )
                .attr("x", -((height - margin.top - options.legendMargin) / MekkoChart.XDelimiter))
                .attr("dy", MekkoChart.DefaultDy)
                .classed(MekkoChart.YSelector.className, true)
                .classed(MekkoChart.YAxisSelector.className, true)
                .classed(MekkoChart.AxisLabelSelector.className, true);

            yAxisLabel.call(AxisHelper.LabelLayoutStrategy.clip,
                height - (margin.bottom + margin.top),
                textMeasurementService.svgEllipsis);

            this.applyOnObjectStylesToAxisTitle(yAxisLabel, options.isFormatMode, MekkoChartObjectNames.YAxisTitle);
        }

    }

    private applyOnObjectStylesToAxis(axis: Selection, isFormatMode: boolean, objectName: string, displayName: string = ""): void {
        axis
            .select(MekkoChart.AxisSelector.selectorName)
            .classed(HtmlSubSelectableClass, isFormatMode)
            .attr(SubSelectableObjectNameAttribute, objectName)
            .attr(SubSelectableTypeAttribute, SubSelectionStylesType.Text)
            .attr(SubSelectableDisplayNameAttribute, displayName);
    }

    private applyOnObjectStylesToAxisTitle(label: Selection, isFormatMode: boolean, objectName: string) {
        label
            .classed(HtmlSubSelectableClass, isFormatMode)
            .attr(SubSelectableObjectNameAttribute, objectName)
            .attr(SubSelectableTypeAttribute, SubSelectionStylesType.Text)
            .attr(SubSelectableDisplayNameAttribute, this.localizationManager.getDisplayName("Visual_Title"));
    }

    private adjustMargins(viewport: IViewport): void {
        const width: number = viewport.width - (this.margin.left + this.margin.right),
            height: number = viewport.height - (this.margin.top + this.margin.bottom);

        const xAxis: Selection = this.rootElement
            .selectAll(MekkoChart.BaseXAxisSelector.selectorName);

        if (<number>AxisHelper.getRecommendedNumberOfTicksForXAxis(width) === 0
            && <number>AxisHelper.getRecommendedNumberOfTicksForYAxis(height) === 0) {

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

        const margin: IMargin = this.margin,
            width: number = viewport.width - (margin.left + margin.right),
            height: number = viewport.height - (margin.top + margin.bottom),
            showY1OnRight: boolean = this.yAxisOrientation === axisPosition.right;

        this.xAxisGraphicsContext
            .attr("transform", manipulation.translate(0, height));

        this.y1AxisGraphicsContext
            .attr("transform", manipulation.translate(showY1OnRight ? width : 0, 0));

        this.svg.attr("width", viewport.width);
        this.svg.attr("height", viewport.height);

        this.svg.style("top", () => {
            return this.legend.isVisible() || this.categoryLegends.length > 0 && this.categoryLegends[0].isVisible() ? PixelConverter.toString(this.legendMargins.height) : 0;
        });

        this.svgScrollable.attr("width", viewport.width);
        this.svgScrollable.attr("height", viewport.height);

        this.svgScrollable.attr("x", 0);

        this.axisGraphicsContext.attr(
            "transform",
            manipulation.translate(margin.left, margin.top));

        this.axisGraphicsContextScrollable.attr(
            "transform",
            manipulation.translate(margin.left, margin.top));

        this.labelGraphicsContextScrollable.attr(
            "transform",
            manipulation.translate(margin.left, margin.top));

        if (this.isXScrollBarVisible) {
            this.svgScrollable.attr("x", this.margin.left);

            this.axisGraphicsContextScrollable.attr(
                "transform",
                manipulation.translate(0, margin.top));

            this.labelGraphicsContextScrollable.attr(
                "transform",
                manipulation.translate(0, margin.top));

            this.svgScrollable.attr("width", width);

            this.svg.attr("width", viewport.width);
            this.svg.attr("height", viewport.height + MekkoChart.ScrollBarWidth);
        }
        else if (this.isYScrollBarVisible) {
            this.svgScrollable.attr("height", height + margin.top);

            this.svg.attr("height", viewport.height);
            this.svg.attr("width", viewport.width + MekkoChart.ScrollBarWidth);
        }
    }

    /**
     * Returns preferred Category span if the visual is scrollable.
     */
    public static getPreferredCategorySpan(
        categoryCount: number,
        categoryThickness: number,
        noOuterPadding?: boolean): number {

        const span: number = (categoryThickness * categoryCount);

        if (noOuterPadding) {
            return span;
        }

        return span
            + categoryThickness * MekkoChart.OuterPaddingRatio * MekkoChart.OuterPaddingRatioFactor;
    }

    public static getIsScalar(
        objects: powerbi.DataViewObjects,
        propertyId: DataViewObjectPropertyIdentifier,
        type: ValueType): boolean {

        const axisTypeValue: any = dataViewObjects.getValue(objects, propertyId);

        if (!objects || axisTypeValue === undefined) {
            return !AxisHelper.isOrdinal(type);
        }

        return (axisTypeValue === axisType.scalar) && !AxisHelper.isOrdinal(type);
    }

    public checkDataset(): boolean {
        if (!this.dataViews ||
            !this.dataViews[0] ||
            !this.dataViews[0].categorical ||
            !this.dataViews[0].categorical.categories ||
            !this.dataViews[0].categorical.categories[0] ||
            !this.dataViews[0].categorical.categories[0].values[0] ||
            !this.dataViews[0].categorical.values ||
            !this.dataViews[0].categorical.values[0]
        ) {
            return false;
        }

        return true;
    }

    public update(options: VisualUpdateOptions) {
        this.visualHost.eventService.renderingStarted(options);

        this.dataViews = options.dataViews;
        this.currentViewport = options.viewport;
        if (!this.checkDataset()) {
            this.clearViewport();
            return;
        }

        if (this.layers.length === 0) {
            this.layers = this.createAndInitLayers(this.dataViews);
        }

        if (this.dataViews && this.dataViews.length > 0) {
            this.settingsModel = this.formattingSettingsService.populateFormattingSettingsModel(VisualFormattingSettingsModel, this.dataViews[0]);
            this.settingsModel.setHighContrastMode(this.colorPalette);
        }

        for (let layerIndex: number = 0, length: number = this.layers.length; layerIndex < length; layerIndex++) {
            this.layers[layerIndex].setData(dataViewUtils.getLayerData(this.dataViews, layerIndex, length), this.settingsModel, options.formatMode, this.localizationManager);
        }

        // enable/disable drill control
        const isDrillEnabled: boolean = this.settingsModel.drillControl.enabled.value;
        this.visualHost.setCanDrill(isDrillEnabled);

        const rotataionEnabled = this.settingsModel.xAxisLabels.enableRotataion.value && this.settingsModel.categoryAxis.show.value;
        let additionHeight: number = 0;
        if (rotataionEnabled) {
            const axes: MekkoChartAxisProperties = this.axes = axisUtils.calculateAxes(
                this.layers,
                this.currentViewport,
                this.margin,
                this.settingsModel.categoryAxis,
                this.settingsModel.valueAxis,
                this.settingsModel);
            additionHeight += this.calculateXAxisAdditionalHeight(axes.x.values);
        }

        if ((this.currentViewport.width < MekkoChart.MinWidth)
            || (this.currentViewport.height < MekkoChart.MinHeight + additionHeight)) {
            this.clearViewport();
            return;
        }

        this.renderLegend(this.settingsModel.legend, options.formatMode);

        this.render(options.formatMode);

        this.hasSetData = this.hasSetData
            || (this.dataViews && this.dataViews.length > 0);

        this.applyOnObjectFormatting(options.formatMode, options.type, options.subSelections);

        this.visualHost.eventService.renderingFinished(options);
    }

    private applyOnObjectFormatting(isFormatMode: boolean, updateType: VisualUpdateType, subSelections?: CustomVisualSubSelection[]): void {
        this.visualOnObjectFormatting.setFormatMode(isFormatMode);

        const shouldUpdateSubSelection = updateType & (powerbi.VisualUpdateType.Data
            | powerbi.VisualUpdateType.Resize
            | powerbi.VisualUpdateType.FormattingSubSelectionChange);

        if (isFormatMode && shouldUpdateSubSelection) {
            this.visualOnObjectFormatting.updateOutlinesFromSubSelections(subSelections, true);
        }
    }

    private getSeriesDataPoints(selectionId: powerbi.visuals.ISelectionId): RectDataPoint[] {
        const layer = this.layers[0] as BaseColumnChart;
        const data: MekkoColumnChartData = layer.getData();

        const currentSeries = data.series.find(s => s.identity.equals(selectionId));
        const currentDataPoints = currentSeries?.data
            ?? (() => {
                const foundDataPoint = data.series[0].data.find(dp => dp.identity.equals(selectionId));
                return foundDataPoint ? [foundDataPoint] : [];
            })();

        if (currentDataPoints.length === 0) {
            return [];
        }

        const axisProperties = layer.getAxisProperties();
        const axisOptions: MekkoColumnAxisOptions = {
            columnWidth: 0,
            xScale: axisProperties[0].scale,
            yScale: axisProperties[1].scale,
            isScalar: layer.categoryAxisType != null,
            margin: this.margin,
        };
        const layout = BaseVisualStrategy.getLayout(axisOptions, this.settingsModel);
        const result: RectDataPoint[] = [];
        const legendPosition: number = this.legend.getOrientation();
        const xShift: number = this.getXShift(legendPosition, this.margin);
        const yShift: number = this.getYShift(legendPosition, this.margin);

        currentDataPoints.forEach(dataPoint => {
            const currentrect: RectDataPoint = {
                x: layout.shapeLayout.x(dataPoint) + xShift,
                y: layout.shapeLayout.y(dataPoint) + yShift,
                height: layout.shapeLayout.height(dataPoint),
                width: layout.shapeLayout.width(dataPoint),
            };

            result.push(currentrect);
        });

        return result;
    }

    private getXShift(legendPosition: LegendPosition, margin: IMargin): number {
        const defaultShift: number = margin.left;
        switch (legendPosition) {
            case LegendPosition.Left:
            case LegendPosition.LeftCenter:
                return defaultShift + this.legend.getMargins().width;
            default:
                return defaultShift;
        }
    }

    private getYShift(legendPosition: LegendPosition, margin: IMargin): number {
        const defaultShift: number = margin.top;
        switch (legendPosition) {
            case LegendPosition.Top:
            case LegendPosition.TopCenter:
                return defaultShift + this.legend.getMargins().height;
            default:
                return defaultShift;
        }
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
            .selectAll(MekkoChart.LegendSelector.selectorName)
            .style("display", isVisible ? null : "none");
    }

    public static getLayout(data: MekkoChartData, options: MekkoChartCategoryLayoutOptions): MekkoChartCategoryLayout {
        const categoryCount: number = options.categoryCount,
            availableWidth: number = options.availableWidth,
            domain: number[] = options.domain,
            trimOrdinalDataOnOverflow: boolean = options.trimOrdinalDataOnOverflow,
            isScalar: boolean = !!options.isScalar,
            isScrollable: boolean = !!options.isScrollable;

        const categoryThickness: number = MekkoChart.getCategoryThickness(
            data
                ? data.series
                : null,
            categoryCount,
            availableWidth,
            domain,
            isScalar,
            trimOrdinalDataOnOverflow);

        const totalOuterPadding: number = categoryThickness
            * MekkoChart.OuterPaddingRatio
            * MekkoChart.OuterPaddingRatioFactor;

        const calculatedBarCount: number
            = Double.floorWithPrecision((availableWidth - totalOuterPadding) / categoryThickness);

        let visibleCategoryCount: number = Math.min(calculatedBarCount, categoryCount);

        const willScroll: boolean = visibleCategoryCount < categoryCount && isScrollable;

        let outerPaddingRatio: number = MekkoChart.OuterPaddingRatio;

        if (!isScalar && !willScroll) {
            const oneOuterPadding: number = (availableWidth - (categoryThickness * visibleCategoryCount))
                / MekkoChart.OuterPaddingRatioDelimiter;

            outerPaddingRatio = oneOuterPadding / categoryThickness;
        }

        if (!isScalar && isScrollable) {
            visibleCategoryCount = categoryCount;
        }

        return {
            categoryThickness,
            outerPaddingRatio,
            isScalar,
            categoryCount: visibleCategoryCount
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
    public static getCategoryThickness(
        seriesList: MekkoChartBaseSeries[],
        numCategories: number,
        plotLength: number,
        domain: number[],
        isScalar: boolean,
        trimOrdinalDataOnOverflow: boolean): number {

        let thickness: number;

        if (numCategories < 2) {
            thickness = plotLength * (1 - MekkoChart.OuterPaddingRatio);
        } else if (isScalar && domain && domain.length > 1) {
            const minInterval: number = MekkoChart.getMinInterval(seriesList),
                domainSpan: number = domain[domain.length - 1] - domain[0],
                ratio: number = minInterval
                    / (domainSpan
                        + (minInterval
                            * MekkoChart.OuterPaddingRatio
                            * MekkoChart.OuterPaddingRatioFactor));

            thickness = plotLength * ratio;
            thickness = Math.max(thickness, MekkoChart.MinScalarRectThickness);
        } else {
            thickness = plotLength
                / (numCategories
                    + (MekkoChart.OuterPaddingRatio * MekkoChart.OuterPaddingRatioFactor));

            if (trimOrdinalDataOnOverflow) {
                thickness = Math.max(thickness, MekkoChart.MinOrdinalRectThickness);
            }
        }

        const maxRectThickness: number = plotLength
            / (MekkoChart.OuterPaddingRatioOffset
                + (MekkoChart.OuterPaddingRatio
                    * MekkoChart.OuterPaddingRatioFactor));

        thickness = Math.min(thickness, maxRectThickness);

        if (!isScalar && numCategories >= 3 && trimOrdinalDataOnOverflow) {
            return Math.max(thickness, MekkoChart.MinOrdinalRectThickness);
        }

        return thickness;
    }

    private static getMinInterval(seriesList: MekkoChartBaseSeries[]): number {
        let minInterval: number = Number.MAX_VALUE;

        if (seriesList.length > 0) {
            const series0data: MekkoChartDataPoint[] = seriesList[0].data
                .filter((dataPoint: MekkoChartDataPoint) => {
                    return !dataPoint.highlight;
                });

            for (let i: number = 0; i < series0data.length - 1; i++) {
                minInterval = Math.min(
                    minInterval,
                    Math.abs(series0data[i + 1].categoryValue - series0data[i].categoryValue));
            }
        }

        return minInterval;
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        const data: MekkoColumnChartData = (<BaseColumnChart>this.layers[0]).getData();
        const seriesCount: number = data.series.length;

        this.settingsModel.setVisibilityOfFileds(data);

        if (data.hasDynamicSeries || seriesCount > 1 || !data.categoryMetadata) {
            this.settingsModel.setDataPointColorPickerSlices(this.layers);
        }
        else {
            // For single-category, single-measure column charts, the user can color the individual bars
            this.settingsModel.setDataPointColorPickerSlicesSingleSeries(data);
        }

        const formattingModel = this.formattingSettingsService.buildFormattingModel(this.settingsModel);
        return formattingModel;
    }

    private createAndInitLayers(dataViews: DataView[]): IColumnChart[] {
        let objects: powerbi.DataViewObjects;

        if (dataViews && dataViews.length > 0) {
            const dataViewMetadata: DataViewMetadata = dataViews[0].metadata;

            if (dataViewMetadata) {
                objects = dataViewMetadata.objects;
            }
        }

        const layers: IColumnChart[] = createLayers(
            this.type,
            objects,
            this.isScrollable);

        const cartesianOptions: MekkoChartVisualInitOptions
            = Prototype.inherit(this.visualInitOptions) as MekkoChartVisualInitOptions;

        cartesianOptions.svg = this.axisGraphicsContextScrollable;

        cartesianOptions.cartesianHost = {
            updateLegend: data => {
                this.legend.drawLegend(data, this.currentViewport);
            },
            getSharedColors: () => this.visualHost.colorPalette,
            triggerRender: undefined,
        };

        for (let i: number = 0; i < layers.length; i++) {
            layers[i].init(cartesianOptions);
        }

        return layers;
    }

    private renderLegend(legendSettings: LegendSettings, isFormatMode: boolean): void {
        const layers: IColumnChart[] = this.layers,
            legendData: ILegendData = {
                title: "",
                fontSize: legendSettings.fontControl.fontSize.value,
                fontFamily: legendSettings.fontControl.fontFamily.value,
                dataPoints: []
            };

        for (let i: number = 0; i < layers.length; i++) {
            this.layerLegendData = layers[i].calculateLegend();

            if (this.layerLegendData) {
                legendData.title = i === 0
                    ? this.layerLegendData.title || ""
                    : legendData.title;

                if (legendSettings.titleText.value) {
                    if (!this.settingsModel.sortLegend.groupByCategory.value) {
                        legendData.title = legendSettings.titleText.value;
                    }
                }
                else {
                    legendSettings.titleText.value = legendData.title;
                }

                legendData.dataPoints = legendData.dataPoints
                    .concat(this.layerLegendData.dataPoints || []);

                if (this.layerLegendData.grouped) {
                    legendData.grouped = true;
                }

                if (this.layerLegendData.labelColor) {
                    legendData.labelColor = this.layerLegendData.labelColor;
                }
            }
        }

        const legendProperties: powerbi.DataViewObject = {
            fontSize: legendSettings.fontControl.fontSize.value,
            fontFamily: legendSettings.fontControl.fontFamily.value,
            showTitle: legendSettings.showTitle.value,
            show: legendSettings.show.value
        }
        LegendData.update(legendData, legendProperties);
        this.legend.changeOrientation(LegendPosition.Top);

        if ((legendData.dataPoints.length === 1 && !legendData.grouped) || this.hideLegends()) {
            legendData.dataPoints = [];
        }

        let reducedLegends: IGrouppedLegendData[] = [];

        if (this.settingsModel.sortLegend.enabled.value) {
            if (this.settingsModel.sortLegend.groupByCategory.value) {
                const mappedLegends = legendData.dataPoints.map((dataPoint: MekkoLegendDataPoint) => {
                    const maxVal = max(dataPoint.categoryValues as number[]);
                    const index = dataPoint.categoryValues.indexOf(maxVal as PrimitiveValue);
                    return {
                        categoryIndex: index,
                        data: dataPoint,
                        categoryValue: 0
                    };
                });

                mappedLegends.forEach(element => {
                    reducedLegends[element.categoryIndex] =
                        reducedLegends[element.categoryIndex] || {
                            category: this.layers[0].getData().categories[element.categoryIndex],
                            index: element.categoryIndex,
                            data: [],
                            dataValues: 0,
                            categorySorting: null
                        };
                    reducedLegends[element.categoryIndex].data.push(element.data);
                });
                reducedLegends.forEach(element => {
                    element.dataValues = sum(element.data.map((d) => d.valueSum));
                });

                reducedLegends.forEach(legend => {
                    if (legend === undefined) {
                        return;
                    }
                    legend.data = legend.data.sort((a, b) => a?.valueSum > b?.valueSum ? 1 : -1);
                    if (this.settingsModel.sortLegend.groupByCategoryDirection.value === MekkoChart.SortDirectionDescending) {
                        legend.data = legend.data.reverse();
                    }
                });

                reducedLegends = reducedLegends.sort((a, b) => a.categorySorting > b.categorySorting ? 1 : -1);

                if (this.settingsModel.sortLegend.direction.value === MekkoChart.SortDirectionDescending) {
                    reducedLegends = reducedLegends.reverse();
                }

                legendData.dataPoints = [];
                reducedLegends.forEach(legend => {
                    if (legend === undefined) {
                        return;
                    }
                    legendData.dataPoints = legendData.dataPoints.concat(legend.data);
                });
            }
            else {
                legendData.dataPoints = legendData.dataPoints.sort((a: MekkoLegendDataPoint, b: MekkoLegendDataPoint) => a?.valueSum > b?.valueSum ? 1 : -1);
                if (this.settingsModel.sortLegend.direction.value === MekkoChart.SortDirectionDescending) {
                    legendData.dataPoints = legendData.dataPoints.reverse();
                }
            }
        }

        const svgHeight: number = textMeasurementService.estimateSvgTextHeight({
            // fontFamily: MekkoChart.LegendBarTextFont,
            fontFamily: legendSettings.fontControl.fontFamily.value,
            fontSize: PixelConverter.fromPoint(legendSettings.fontControl.fontSize.value),
            text: "AZ"
        });

        select(this.rootElement.node()).selectAll("div.legendParent").remove();
        this.categoryLegends = [];
        const legendParents = select(this.rootElement.node()).selectAll("div.legendParent");

        reducedLegends = reducedLegends.filter((l: IGrouppedLegendData) => l !== undefined);
        const legendParentsWithData = legendParents.data(reducedLegends);
        const legendParentsWithChilds = legendParentsWithData.enter().append("div");
        const legendParentsWithChildsAttr = legendParentsWithChilds.classed("legendParent", true)
            .style("position", "absolute")
            .style("top", (data, index) => PixelConverter.toString((svgHeight + MekkoChart.LegendBarHeightMargin) * index));

        const mekko = this;
        this.categoryLegends = this.categoryLegends || [];
        legendParentsWithChildsAttr.each(function (data, index) {
            const legendSvg = select(this);
            legendSvg.style("font-family", mekko.settingsModel.legend.fontControl.fontFamily.value);
            if (legendSvg.select("svg").node() === null) {
                const legend: ILegend = createLegend(
                    <any>this,
                    true);

                mekko.categoryLegends[index] = <ILegend>legend;
            }
        });

        if (reducedLegends.length > 0) {
            this.categoryLegends.forEach((legend: ILegend) => {
                (<ILegendGroup>legend).position = +select((<ILegendGroup>legend).element).style("top").replace("px", "");
            });
            this.categoryLegends = this.categoryLegends.sort((a: ILegendGroup, b: ILegendGroup) => a?.position > b?.position ? 1 : -1).reverse();
            this.categoryLegends.forEach((legend, index) => {
                if (reducedLegends[index] === undefined) {
                    LegendData.update({
                        dataPoints: []
                    }, legendProperties);
                    legend.changeOrientation(LegendPosition.None);
                    legend.drawLegend({
                        dataPoints: []
                    }, this.currentViewport);

                    return;
                }

                const legendData: ILegendData = {
                    title: reducedLegends[index].category,
                    dataPoints: reducedLegends[index].data,
                    labelColor: this.layerLegendData?.labelColor
                };

                LegendData.update(legendData, legendProperties);
                legend.drawLegend(legendData, this.currentViewport);
            });
        }
        legendParentsWithData.exit().remove();

        if (legendSettings.show.value === false) {
            legendData.dataPoints = [];
            this.categoryLegends.forEach(legend => {
                legend.changeOrientation(LegendPosition.None);
                LegendData.update(legendData, legendProperties);
                legend.drawLegend(legendData, this.currentViewport);
            });
        }

        if (reducedLegends.length > 0) {
            this.legend.changeOrientation(LegendPosition.None);
        }

        this.legend.drawLegend(legendData, this.currentViewport);

        if (reducedLegends.length) {
            this.legendMargins = this.categoryLegends[0].getMargins();
            this.legendMargins.height = (svgHeight + MekkoChart.LegendBarHeightMargin) * reducedLegends.length + MekkoChart.LegendBarHeightMargin;
        }
        else if (this.legendMargins) {
            this.legendMargins.height = 0;
        }

        this.legendSelection = this.rootElement
            .selectAll(MekkoChart.LegendSelector.selectorName);

        this.legendSelection.style("font-weight", legendSettings.fontControl.bold.value ? "bold" : "normal");
        this.legendSelection.style("font-style", legendSettings.fontControl.italic.value ? "italic" : "normal");
        this.legendSelection.style("text-decoration", legendSettings.fontControl.underline.value ? "underline" : "none");
        this.legendSelection.style("fill", this.colorPalette.isHighContrast ? this.colorPalette.foreground.value : legendSettings.color.value.value);

        this.applyOnObjectStylesToLegend(isFormatMode, legendSettings);
    }

    private hideLegends(): boolean {
        if (this.cartesianSmallViewPortProperties) {
            if (this.cartesianSmallViewPortProperties.hideLegendOnSmallViewPort
                && (this.currentViewport.height < this.cartesianSmallViewPortProperties.MinHeightLegendVisible)) {
                return true;
            }
        }

        return false;
    }

    private shouldRenderAxis(
        axisProperties: IAxisProperties): boolean {

        if (axisProperties) {
            if (axisProperties.isCategoryAxis && this.settingsModel.categoryAxis.show.value) {

                return axisProperties.values
                    && axisProperties.values.length > 0;
            }
            else if (!axisProperties.isCategoryAxis && this.settingsModel.valueAxis.show.value) {

                return axisProperties.values
                    && axisProperties.values.length > 0;
            }
        }

        return false;
    }

    private applyOnObjectStylesToLegend(isFormatMode: boolean, settings: LegendSettings): void {
        this.legendSelection.select("#legendGroup")
            .classed(HtmlSubSelectableClass, isFormatMode && settings.show.value)
            .attr(SubSelectableObjectNameAttribute, MekkoChartObjectNames.Legend)
            .attr(SubSelectableTypeAttribute, SubSelectionStylesType.Text)
            .attr(SubSelectableDisplayNameAttribute, this.localizationManager.getDisplayName("Visual_Legend"));

        this.legendSelection.select(".legendTitle")
            .classed(HtmlSubSelectableClass, isFormatMode && settings.show.value && settings.showTitle.value)
            .attr(SubSelectableObjectNameAttribute, MekkoChartObjectNames.LegendTitle)
            .attr(SubSelectableTypeAttribute, SubSelectionStylesType.Text)
            .attr(SubSelectableDisplayNameAttribute, this.localizationManager.getDisplayName("Visual_LegendName"))
            .attr(SubSelectableDirectEdit, titleEditSubSelection);
    }

    private render(formatMode: boolean, suppressAnimations: boolean = true): void {
        this.setVisibility(true);
        this.legendMargins = this.legendMargins || this.legend.getMargins();

        if (this.legend.isVisible()) {
            this.legendMargins = this.legend.getMargins();
        }

        const viewport: IViewport = {
            height: this.currentViewport.height - this.legendMargins.height,
            width: this.currentViewport.width - this.legendMargins.width
        };

        const maxMarginFactor: number = this.getMaxMarginFactor(),
            leftRightMarginLimit: number
                = this.leftRightMarginLimit
                = viewport.width * maxMarginFactor;

        this.bottomMarginLimit = Math.max(
            MekkoChart.MinBottomMargin,
            Math.ceil(viewport.height * maxMarginFactor));

        const xAxisTextProperties: TextProperties = MekkoChart.getTextProperties(this.settingsModel.categoryAxis.fontControl.fontSize.value, this.settingsModel.categoryAxis.fontControl.fontFamily.value);

        const y1AxisTextProperties: TextProperties = MekkoChart.getTextProperties(this.settingsModel.valueAxis.fontControl.fontSize.value, this.settingsModel.valueAxis.fontControl.fontFamily.value);

        const margin: IMargin = this.margin;

        // reset defaults
        margin.top = parseFloat(y1AxisTextProperties.fontSize) / MekkoChart.MarginTopFactor;
        margin.bottom = MekkoChart.MinBottomMargin;
        margin.right = 0;

        let axes: MekkoChartAxisProperties = this.axes = axisUtils.calculateAxes(
            this.layers,
            viewport,
            margin,
            this.settingsModel.categoryAxis,
            this.settingsModel.valueAxis,
            this.settingsModel);

        this.yAxisIsCategorical = axes.y1.isCategoryAxis;

        this.hasCategoryAxis = this.yAxisIsCategorical
            ? axes.y1 && axes.y1.values.length > 0
            : axes.x && axes.x.values.length > 0;

        const renderXAxis: boolean = this.shouldRenderAxis(axes.x),
            renderY1Axis: boolean = this.shouldRenderAxis(axes.y1);

        let width: number = viewport.width - (margin.left + margin.right),
            isScalar: boolean = false,
            mainAxisScale,
            preferredViewport: IViewport;

        this.isXScrollBarVisible = false;
        this.isYScrollBarVisible = false;

        const yAxisOrientation: string = this.yAxisOrientation,
            showY1OnRight: boolean = yAxisOrientation === axisPosition.right;

        if (this.layers) {
            if (this.layers[0].getVisualCategoryAxisIsScalar) {
                isScalar = this.layers[0].getVisualCategoryAxisIsScalar();
            }

            if (!isScalar && this.isScrollable && this.layers[0].getPreferredPlotArea) {
                const categoryThickness: number = this.scrollX
                    ? axes.x.categoryThickness
                    : axes.y1.categoryThickness;

                const categoryCount: number = this.scrollX
                    ? axes.x.values.length
                    : axes.y1.values.length;

                preferredViewport = this.layers[0].getPreferredPlotArea(
                    isScalar,
                    categoryCount,
                    categoryThickness);

                if (this.scrollX
                    && preferredViewport
                    && preferredViewport.width > viewport.width) {

                    this.isXScrollBarVisible = true;

                    viewport.height -= MekkoChart.ScrollBarWidth;
                }

                if (this.scrollY
                    && preferredViewport
                    && preferredViewport.height > viewport.height) {

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
                    .classed(MekkoChart.XBrushSelector.className, true);
            }
        }
        else {
            // clear any existing brush if no scrollbar is shown
            this.svg
                .selectAll(MekkoChart.BrushSelector.selectorName)
                .remove();

            this.brushGraphicsContext = undefined;
        }

        // Recalculate axes now that scrollbar visible variables have been set
        axes = axisUtils.calculateAxes(
            this.layers,
            viewport,
            margin,
            this.settingsModel.categoryAxis,
            this.settingsModel.valueAxis,
            this.settingsModel);

        // we need to make two passes because the margin changes affect the chosen tick values, which then affect the margins again.
        // after the second pass the margins are correct.
        const maxIterations: number = 2;
        let doneWithMargins: boolean = false,
            numIterations: number = 0,
            tickLabelMargins: TickLabelMargins = undefined,
            chartHasAxisLabels: boolean = undefined,
            axisLabels: MekkoChartAxesLabels = undefined;

        while (!doneWithMargins && numIterations < maxIterations) {
            numIterations++;

            tickLabelMargins = labelUtils.getTickLabelMargins(
                { width, height: viewport.height },
                leftRightMarginLimit,
                textMeasurementService.measureSvgTextWidth,
                textMeasurementService.estimateSvgTextHeight,
                axes,
                this.bottomMarginLimit,
                xAxisTextProperties,
                y1AxisTextProperties,
                false,
                this.isXScrollBarVisible || this.isYScrollBarVisible,
                showY1OnRight,
                renderXAxis,
                renderY1Axis);

            // We look at the y axes as main and second sides, if the y axis orientation is right so the main side represents the right side
            let maxMainYaxisSide: number = showY1OnRight
                ? tickLabelMargins.yRight
                : tickLabelMargins.yLeft;

            let maxSecondYaxisSide: number = showY1OnRight
                ? tickLabelMargins.yLeft
                : tickLabelMargins.yRight;

            let xMax: number = renderXAxis
                ? (tickLabelMargins.xMax / MekkoChart.TickLabelMarginsXMaxFactor)
                : 0;

            maxMainYaxisSide += MekkoChart.LeftPadding;
            maxSecondYaxisSide += MekkoChart.RightPadding;
            xMax += MekkoChart.BottomPadding;

            const rotataionEnabled = this.settingsModel.xAxisLabels.enableRotataion.value && this.settingsModel.categoryAxis.show.value;

            if (rotataionEnabled) {
                const axes: MekkoChartAxisProperties = this.axes = axisUtils.calculateAxes(
                    this.layers,
                    this.currentViewport,
                    this.margin,
                    this.settingsModel.categoryAxis,
                    this.settingsModel.valueAxis,
                    this.settingsModel);

                xMax += this.calculateXAxisAdditionalHeight(axes.x.values);
            }

            if (this.hideAxisLabels(this.legendMargins)) {
                axes.x.axisLabel = null;
                axes.y1.axisLabel = null;
            }

            axisLabels = {
                x: axes.x.axisLabel,
                y: axes.y1.axisLabel
            };

            chartHasAxisLabels = (axisLabels.x != null)
                || (axisLabels.y != null);

            if (axisLabels.x != null) {
                xMax += MekkoChart.XAxisLabelPadding;
            }

            if (axisLabels.y != null) {
                maxMainYaxisSide += MekkoChart.YAxisLabelPadding;
            }

            margin.left = showY1OnRight
                ? maxSecondYaxisSide
                : maxMainYaxisSide;

            margin.right = showY1OnRight
                ? maxMainYaxisSide
                : maxSecondYaxisSide;

            margin.bottom = xMax;

            this.margin = margin;

            width = viewport.width - (margin.left + margin.right);

            // re-calculate the axes with the new margins
            const previousTickCountY1: number = axes.y1.values.length;

            axes = axisUtils.calculateAxes(
                this.layers,
                viewport,
                margin,
                this.settingsModel.categoryAxis,
                this.settingsModel.valueAxis,
                this.settingsModel);

            if (axes.y1.values.length === previousTickCountY1) {
                doneWithMargins = true;
            }
        }

        this.renderChart(
            mainAxisScale,
            axes,
            width,
            tickLabelMargins,
            chartHasAxisLabels,
            axisLabels,
            viewport,
            suppressAnimations,
            formatMode
        );
    }

    private hideAxisLabels(legendMargins: IViewport): boolean {
        if (this.cartesianSmallViewPortProperties) {
            if (this.cartesianSmallViewPortProperties.hideAxesOnSmallViewPort
                && ((this.currentViewport.height + legendMargins.height)
                    < this.cartesianSmallViewPortProperties.MinHeightAxesVisible)) {

                return true;
            }
        }

        return false;
    }

    private getMaxMarginFactor(): number {
        return MekkoChart.MaxMarginFactor;
    }

    private static getChartViewport(
        viewport: IViewport,
        margin: IMargin): IViewport {

        return {
            width: viewport.width - margin.left - margin.right,
            height: viewport.height - margin.top - margin.bottom
        };
    }

    private static wordBreak(
        text: Selection,
        axisProperties: IAxisProperties,
        columnsWidth: number[],
        maxHeight: number): void {

        text.each(function (data: any, index: number) {
            let width: number,
                allowedLength: number;

            const node: Selection = select(this);

            if (columnsWidth.length >= index) {
                width = columnsWidth[index];
                allowedLength = axisProperties.scale(width);
            } else {
                allowedLength = axisProperties.xLabelMaxWidth;
            }

            node
                .classed(MekkoChart.LabelMiddleSelector.className, true)
                .attr("dx", MekkoChart.DefaultLabelDx)
                .attr("dy", MekkoChart.DefaultLabelDy)
                .attr("transform", MekkoChart.DefaultLabelRotate);

            textMeasurementService.wordBreak(
                this,
                allowedLength,
                axisProperties.willLabelsWordBreak
                    ? maxHeight
                    : 0);
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
        isFormatMode: boolean): void {

        const bottomMarginLimit: number = this.bottomMarginLimit,
            leftRightMarginLimit: number = this.leftRightMarginLimit,
            layers: IColumnChart[] = this.layers,
            duration: number = MekkoChart.AnimationDuration;

        let xLabelColor: string,
            yLabelColor: string,
            xFontSize: number,
            yFontSize: number,
            xFontFamily: string,
            yFontFamily: string,
            xFontBold: boolean,
            yFontBold: boolean,
            xFontItalic: boolean,
            yFontItalic: boolean,
            xFontUnderline: boolean,
            yFontUnderline: boolean;
        if (this.shouldRenderAxis(axes.x)) {
            if (axes.x.isCategoryAxis) {
                xLabelColor = this.settingsModel.categoryAxis.labelColor.value.value;
                xFontSize = this.settingsModel.categoryAxis.fontControl.fontSize.value;
                xFontFamily = this.settingsModel.categoryAxis.fontControl.fontFamily.value;
                xFontBold = this.settingsModel.categoryAxis.fontControl.bold.value;
                xFontItalic = this.settingsModel.categoryAxis.fontControl.italic.value;
                xFontUnderline = this.settingsModel.categoryAxis.fontControl.underline.value;
            } else {
                xLabelColor = this.settingsModel.valueAxis.labelColor.value.value;
                xFontSize = this.settingsModel.valueAxis.fontControl.fontSize.value;
                xFontFamily = this.settingsModel.valueAxis.fontControl.fontFamily.value;
                xFontBold = this.settingsModel.valueAxis.fontControl.bold.value;
                xFontItalic = this.settingsModel.valueAxis.fontControl.italic.value;
                xFontUnderline = this.settingsModel.valueAxis.fontControl.underline.value;
            }

            xFontSize = PixelConverter.fromPointToPixel(xFontSize);

            // axes.x.axis.orient("bottom");
            if (!axes.x.willLabelsFit) {
                axes.x.axis.tickPadding(MekkoChart.TickPaddingRotatedX);
            }

            const xAxisGraphicsElement: Selection = this.xAxisGraphicsContext;

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
                .call(MekkoChart.setAxisLabelFontSize, xFontSize)
                .call(MekkoChart.setAxisLabelFontFamily, xFontFamily)
                .call(MekkoChart.setAxisLabelFontStyle, xFontBold, xFontItalic, xFontUnderline);

            const xWidth = viewport.width - (this.margin.left + this.margin.right);
            const xHeight = this.margin.bottom;

            let backgroundRect = MekkoChart.createBgRect(xAxisGraphicsElement);

            backgroundRect
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", xWidth)
                .attr("height", xHeight)
                .style("pointer-events", "all")
                .style("fill", "transparent")
                .lower(); // Move rectangle behind text

            const xAxisTextNodes: Selection = xAxisGraphicsElement.selectAll("text");

            let columnWidth: number[] = [],
                borderWidth: number = 0;

            if (this.layers && this.layers.length) {
                columnWidth = this.layers[0].getColumnsWidth();
                borderWidth = this.settingsModel.columnBorder.show.value ? this.settingsModel.columnBorder.width.value : 0;
            }

            xAxisGraphicsElement
                .call(
                    MekkoChart.moveBorder,
                    axes.x.scale,
                    borderWidth,
                    xFontSize / MekkoChart.XFontSizeDelimiter - MekkoChart.XFontSizeOffset);

            const rotationEnabled: boolean = this.settingsModel.xAxisLabels.enableRotataion.value;
            if (!rotationEnabled) {
                xAxisTextNodes
                    .call(
                        MekkoChart.wordBreak,
                        axes.x,
                        columnWidth,
                        bottomMarginLimit);
            }
            else {
                xAxisTextNodes
                    .classed(MekkoChart.LabelMiddleSelector.className, true)
                    .attr("dx", MekkoChart.DefaultLabelDx)
                    .attr("dy", MekkoChart.DefaultLabelDy)
                    .attr("transform", `rotate(-${MekkoChart.CategoryTextRotataionDegree})`);

                // fix positions
                const categoryLabels = xAxisGraphicsElement.selectAll(".tick");
                categoryLabels.each(function () {
                    const shiftX: number = (<any>this).getBBox().width / Math.tan(MekkoChart.CategoryTextRotataionDegree * Math.PI / 180) / 2.0;
                    const shiftY: number = (<any>this).getBBox().width * Math.tan(MekkoChart.CategoryTextRotataionDegree * Math.PI / 180) / 2.0;
                    const currTransform: string = (<any>this).attributes.transform.value;
                    const translate: [number, number, number] = MekkoChart.getTranslation(currTransform);
                    select(<any>this)
                        .attr("transform", () => {
                            return manipulation.translate(+translate[0] - shiftX, +translate[1] + shiftY);
                        });
                });
            }
        }
        else {
            this.xAxisGraphicsContext
                .selectAll("*")
                .remove();
        }

        if (this.shouldRenderAxis(axes.y1)) {
            if (axes.y1.isCategoryAxis) {
                yLabelColor = this.settingsModel.categoryAxis.labelColor.value.value;
                yFontSize = this.settingsModel.categoryAxis.fontControl.fontSize.value;
                yFontFamily = this.settingsModel.categoryAxis.fontControl.fontFamily.value;
                yFontBold = this.settingsModel.categoryAxis.fontControl.bold.value;
                yFontItalic = this.settingsModel.categoryAxis.fontControl.italic.value;
                yFontUnderline = this.settingsModel.categoryAxis.fontControl.underline.value;
            } else {
                yLabelColor = this.settingsModel.valueAxis.labelColor.value.value;
                yFontSize = this.settingsModel.valueAxis.fontControl.fontSize.value;
                yFontFamily = this.settingsModel.valueAxis.fontControl.fontFamily.value;
                yFontBold = this.settingsModel.valueAxis.fontControl.bold.value;
                yFontItalic = this.settingsModel.valueAxis.fontControl.italic.value;
                yFontUnderline = this.settingsModel.valueAxis.fontControl.underline.value;
            }

            yFontSize = PixelConverter.fromPointToPixel(yFontSize);

            // Configure Y-axis ticks and grid lines
            axes.y1.axis
                .tickSize(-width)
                .tickPadding(MekkoChart.TickPaddingY);

            const y1AxisGraphicsElement: Selection = this.y1AxisGraphicsContext;

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

            if (this.settingsModel.valueAxis.visualMode.value === "absolute") {
                this.applyGridSettings();
            }

            y1AxisGraphicsElement
                .call(MekkoChart.darkenZeroLine)
                .call(MekkoChart.setAxisLabelColor, yLabelColor)
                .call(MekkoChart.setAxisLabelFontSize, yFontSize)
                .call(MekkoChart.setAxisLabelFontFamily, yFontFamily)
                .call(MekkoChart.setAxisLabelFontStyle, yFontBold, yFontItalic, yFontUnderline);

            const showY1OnRight = this.yAxisOrientation === axisPosition.right;

            // Calculate width for tick labels only (excluding title area)
            let tickAreaWidth = showY1OnRight ? this.margin.right : this.margin.left;

            // Check if Y-axis title is present and subtract title padding
            const hasYAxisTitle = axisLabels && axisLabels.y != null;
            if (hasYAxisTitle) {
                tickAreaWidth -= MekkoChart.YAxisLabelPadding; // Subtract title area
            }

            const yHeight = viewport.height - this.margin.bottom;

            const backgroundRect = MekkoChart.createBgRect(y1AxisGraphicsElement);

            backgroundRect
                .attr("x", showY1OnRight ? 0 : -tickAreaWidth)
                .attr("y", 0)
                .attr("width", tickAreaWidth)
                .attr("height", yHeight)
                .style("pointer-events", "all")
                .style("fill", "transparent")
                .lower(); // Move rectangle behind text

            if (tickLabelMargins.yLeft >= leftRightMarginLimit) {
                y1AxisGraphicsElement
                    .selectAll("text")
                    .call(AxisHelper.LabelLayoutStrategy.clip,
                        leftRightMarginLimit - MekkoChart.LeftPadding,
                        textMeasurementService.svgEllipsis);
            }
        }
        else {
            this.y1AxisGraphicsContext
                .selectAll("*")
                .remove();
        }

        this.translateAxes(viewport);

        // Axis labels
        if (chartHasAxisLabels) {
            const hideXAxisTitle: boolean = !this.shouldRenderAxis(axes.x);

            const hideYAxisTitle: boolean = !this.shouldRenderAxis(axes.y1);

            const renderAxisOptions: MekkoAxisRenderingOptions = {
                axisLabels: axisLabels,
                legendMargin: this.legendMargins.height,
                viewport: viewport,
                hideXAxisTitle: hideXAxisTitle,
                hideYAxisTitle: hideYAxisTitle,
                xLabelColor: xLabelColor,
                yLabelColor: yLabelColor,
                margin: undefined,
                isFormatMode
            };

            this.renderAxesLabels(renderAxisOptions, xFontSize);
        }
        else {
            this.axisGraphicsContext
                .selectAll(MekkoChart.AxisLabelSelector.selectorName)
                .remove();
        }

        let dataPoints: ISelectableDataPoint[] = [];
        let legendDataPoints: ISelectableDataPoint[] = [];
        const layerBehaviorOptions: VisualBehaviorOptions[] = [];

        if (this.behavior) {
            let resultsLabelDataPoints: LabelDataPoint[] = [];

            for (let layerIndex: number = 0; layerIndex < layers.length; layerIndex++) {
                const layerLegend: ILegendData = layers[layerIndex].calculateLegend();
                legendDataPoints = legendDataPoints.concat(layerLegend.dataPoints);

                const result: MekkoVisualRenderResult = layers[layerIndex].render(suppressAnimations, this.settingsModel);
                if (result) {
                    dataPoints = dataPoints.concat(result.dataPoints);
                    layerBehaviorOptions.push(result.behaviorOptions);

                    resultsLabelDataPoints = resultsLabelDataPoints.concat(result.labelDataPoints);
                }
            }

            const forceDisplay: boolean = this.settingsModel.labels.forceDisplay.value;
            drawDefaultLabelsForDataPointChart({
                data: resultsLabelDataPoints,
                context: this.labelGraphicsContextScrollable,
                layout: this.getLabelLayout(forceDisplay),
                viewport: this.currentViewport,
                isAnimator: false,
                animationDuration: 0,
                hasSelection: false,
                hideCollidedLabels: !forceDisplay
            });

            this.applyOnObjectStylesToLabels(isFormatMode);
            this.applyOnObjectStylesToAxisTickText(this.y1AxisGraphicsContext, isFormatMode);
            this.applyOnObjectStylesToAxis(this.axisGraphicsContext, isFormatMode, MekkoChartObjectNames.XAxis, this.localizationManager.getDisplayName("Visual_X_Axis"));

            const showGridStyles = this.settingsModel.valueAxis.visualMode.value === "absolute";
            this.applyOnObjectStylesToAxis(this.axisGraphicsContextScrollable, isFormatMode, showGridStyles ? MekkoChartObjectNames.YAxis : MekkoChartObjectNames.YAxisShort, this.localizationManager.getDisplayName("Visual_Y_Axis"));

            const behaviorOptions: CustomVisualBehaviorOptions = {
                layerOptions: layerBehaviorOptions,
                clearCatcher: this.rootElement,
                legend: this.legendSelection,
                legendDataPoints: legendDataPoints,
                isFormatMode
            };
            this.behavior.bindEvents(behaviorOptions);
            this.behavior.renderSelection();
        }
    }

    private applyOnObjectStylesToAxisTickText(axisContext: Selection, isFormatMode: boolean): void {
        const tickLines = MekkoChart.getTickText(axisContext);

        tickLines
            .classed(HtmlSubSelectableClass, isFormatMode)
            .attr(SubSelectableObjectNameAttribute, MekkoChartObjectNames.YAxisTickText)
            .attr(SubSelectableTypeAttribute, SubSelectionStylesType.Text)
            .attr(SubSelectableDisplayNameAttribute, this.localizationManager.getDisplayName("Visual_Y_Axis_Tick_Text"));
    }

    private applyOnObjectStylesToLabels(isFormatMode: boolean): void {
        this.labelGraphicsContextScrollable
            .selectAll(".data-labels")
            .classed(HtmlSubSelectableClass, isFormatMode)
            .style("pointer-events", "auto")
            .attr(SubSelectableObjectNameAttribute, MekkoChartObjectNames.Labels)
            .attr(SubSelectableTypeAttribute, SubSelectionStylesType.NumericText)
            .attr(SubSelectableDisplayNameAttribute, this.localizationManager.getDisplayName("Visual_Data_Labels"));
    }

    private getLabelLayout(forceDisplay: boolean = false): ILabelLayout {
        return {
            labelText: (dataPoint: LabelDataPoint) => {
                return dataPoint.text;
            },
            labelLayout: {
                x: (dataPoint: LabelDataPoint) => {
                    return dataPoint.parentRect.left
                        + dataPoint.parentRect.width / MekkoChart.WidthDelimiter;
                },
                y: (dataPoint: LabelDataPoint) => {
                    return dataPoint.parentRect.top
                        + dataPoint.parentRect.height / MekkoChart.WidthDelimiter;
                }
            },
            filter: (dataPoint: LabelDataPoint) => {
                return dataPoint != null
                    && dataPoint.size.height < dataPoint.parentRect.height
                    && dataPoint.size.width < dataPoint.parentRect.width || (forceDisplay && dataPoint.parentRect.height > 6 && dataPoint.size.height > 0);
            },
            style: {
                "fill": (dataPoint: LabelDataPoint) => {
                    return dataPoint.fillColor;
                },
                "font-family": (dataPoint: LabelDataPoint) => {
                    return dataPoint.fontFamily;
                },
                "font-size": (dataPoint: LabelDataPoint) => {
                    return dataPoint.fontSize;
                },
                "font-weight": (dataPoint: LabelDataPoint) => {
                    return dataPoint.bold ? "bold" : "normal";
                },
                "font-style": (dataPoint: LabelDataPoint) => {
                    return dataPoint.italic ? "italic" : "normal";
                },
                "text-decoration": (dataPoint: LabelDataPoint) => {
                    return dataPoint.underline ? "underline" : "none";
                },
            }
        };
    }

    private applyGridSettings(): void {
        const gridlineStyle = this.settingsModel.valueAxis.gridlineStyle?.value;
        const gridlineWidth = this.settingsModel.valueAxis.gridlineWidth?.value;
        const gridlineScale = this.settingsModel.valueAxis.gridlineScale?.value;
        let dashArray = "none";
        let lineCap = this.settingsModel.valueAxis.gridlineDashCap?.value;

        switch (gridlineStyle) {
            case "dashed":
                dashArray = `${gridlineWidth * 4}, ${gridlineWidth * 2}`;
                break;
            case "dotted":
                dashArray = `${gridlineWidth * 0.1}, ${gridlineWidth * 3}`;
                lineCap = "round";
                break;
            case "custom":
                const customPattern = this.settingsModel.valueAxis.gridlineDashArray?.value;
                dashArray = customPattern;
                // Scale the dash pattern by gridlineWidth if it's a numeric pattern
                if (gridlineScale) {
                    dashArray = dashArray
                        .split(",")
                        .map(s => parseFloat(s.trim()) * gridlineWidth)
                        .join(", ");
                }
                break;
            case "solid":
            default:
                dashArray = "none";
                break;
        }

        const tickslines = MekkoChart.getTickLines(this.y1AxisGraphicsContext);

        tickslines
            .style("stroke", this.settingsModel.valueAxis.gridlineColor.value.value)
            .style("stroke-width", this.settingsModel.valueAxis.gridlineWidth.value)
            .style("stroke-dasharray", dashArray)
            .style("stroke-linecap", lineCap)
            .style("opacity", (100 - this.settingsModel.valueAxis.gridlineTransparency.value) / 100);

        // Remove domain lines when grid lines are shown
        this.y1AxisGraphicsContext
            .select(".domain")
            .remove();
        this.xAxisGraphicsContext
            .select(".domain")
            .remove();

    }

    /**
     * Within the context of the given selection (g), find the offset of
     * the zero tick using the d3 attached datum of g.tick elements.
     * "Classed" is undefined for transition selections
     */
    private static darkenZeroLine(selection: Selection): void {
        const zeroTick: any = MekkoChart.getTicks(selection)
            .filter((data: any) => data === 0)
            .node();

        if (zeroTick) {
            select(zeroTick)
                .select("line")
                .classed(MekkoChart.ZeroLineSelector.className, true);
        }
    }

    private static getTicks(selection: Selection): Selection {
        return selection.selectAll("g.tick");
    }

    private static getTickText(selection: Selection): Selection {
        return selection.selectAll("g.tick text");
    }

    private static getTickLines(selection: Selection): Selection {
        return selection.selectAll("g.tick line");
    }

    private static setAxisLabelColor(selection: Selection, fill: string): void {
        MekkoChart.getTickText(selection)
            .style("fill", fill);
    }

    private static setAxisLabelFontSize(selection: Selection, fontSize: number): void {
        MekkoChart.getTickText(selection)
            .attr("font-size", PixelConverter.toString(fontSize));
    }

    private static setAxisLabelFontFamily(selection: Selection, fontFamily: string): void {
        MekkoChart.getTickText(selection)
            .style("font-family", fontFamily);
    }

    private static setAxisLabelFontStyle(
        selection: Selection,
        fontBold: boolean,
        fontItalic: boolean,
        fontUnderline: boolean): void {

        MekkoChart.getTickText(selection)
            .style("font-weight", fontBold ? "bold" : "normal")
            .style("font-style", fontItalic ? "italic" : "normal")
            .style("text-decoration", fontUnderline ? "underline" : "none");
    }
    private static moveBorder(
        selection: Selection,
        scale: ScaleLinear<number>,
        borderWidth: number,
        yOffset: number = 0): void {

        MekkoChart.getTicks(selection)
            .attr("transform", (value: number, index: number) => {
                return manipulation.translate(scale(value) + (borderWidth * index), yOffset);
            });
    }

    private static createBgRect(selection: Selection): Selection {
        let backgroundRect = selection.select(`.${MekkoChart.BgRectClassname}`);

        if (backgroundRect.empty()) {
            backgroundRect = selection
                .append("rect")
                .attr("class", MekkoChart.BgRectClassname);
        }
        return backgroundRect;
    }
}

export function createLayers(
    type: MekkoChartType,
    objects: powerbi.DataViewObjects,
    isScrollable: boolean = true): IColumnChart[] {

    const layers: IColumnChart[] = [];

    const cartesianOptions: MekkoChartConstructorBaseOptions = {
        isScrollable
    };

    layers.push(columnChartBaseColumnChart.createBaseColumnChartLayer(
        MekkoVisualChartType.hundredPercentStackedColumn,
        cartesianOptions));

    return layers;
}