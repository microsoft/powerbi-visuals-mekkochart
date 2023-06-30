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
import VisualObjectInstance = powerbi.VisualObjectInstance;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import DataViewObjectPropertyIdentifier = powerbi.DataViewObjectPropertyIdentifier;
import DataView = powerbi.DataView;
import ValueTypeDescriptor = powerbi.ValueTypeDescriptor;
import Fill = powerbi.Fill;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import DataViewPropertyValue = powerbi.DataViewPropertyValue;
import SortDirection = powerbi.SortDirection;
import IVisual = powerbi.extensibility.visual.IVisual;
import VisualObjectInstanceEnumeration = powerbi.VisualObjectInstanceEnumeration;
import ILocalizationManager = powerbi.extensibility.ILocalizationManager;

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
    MekkoChartLabelSettings,
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
    MekkoChartDataLabelObject,
    Selection
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

import {
    dataViewObjects,
    dataViewObject
}
    from "powerbi-visuals-utils-dataviewutils";

import {
    ColorHelper
}
    from "powerbi-visuals-utils-colorutils";

import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import { VisualFormattingSettingsModel } from "./settings";

import { max, sum } from "d3-array";
import { select } from "d3-selection";
import { brushX, BrushBehavior } from "d3-brush";

// powerbi.extensibility.utils.chart
import {
    axis as AxisHelper,
    axisInterfaces,
    axisScale,
    axisStyle,
    dataLabelInterfaces,
    dataLabelUtils,
    legendInterfaces,
    legendData as LegendData,
    legend,
    legendPosition,
    axis,
} from "powerbi-visuals-utils-chartutils";

import IAxisProperties = axisInterfaces.IAxisProperties;
import TickLabelMargins = axisInterfaces.TickLabelMargins;
import ILegend = legendInterfaces.ILegend;
import ILegendData = legendInterfaces.LegendData;

import legendProps = legendInterfaces.legendProps;
import createLegend = legend.createLegend;
import ILabelLayout = dataLabelInterfaces.ILabelLayout;
import LegendPosition = legendInterfaces.LegendPosition;
import VisualDataLabelsSettings = dataLabelInterfaces.VisualDataLabelsSettings;
import drawDefaultLabelsForDataPointChart = dataLabelUtils.drawDefaultLabelsForDataPointChart;

// powerbi.extensibility.utils.svg
import {
    IMargin,
    manipulation,
    CssConstants
} from "powerbi-visuals-utils-svgutils";
import ClassAndSelector = CssConstants.ClassAndSelector;
import createClassAndSelector = CssConstants.createClassAndSelector;

// powerbi.extensibility.utils.interactivity
import {
    interactivityBaseService,
    interactivitySelectionService as interactivityService
} from "powerbi-visuals-utils-interactivityutils";

import appendClearCatcher = interactivityBaseService.appendClearCatcher;
import SelectableDataPoint = interactivityService.SelectableDataPoint;
import IInteractiveBehavior = interactivityBaseService.IInteractiveBehavior;
import IInteractivityServiceCommon = interactivityBaseService.IInteractivityService;
import createInteractivityService = interactivityService.createInteractivitySelectionService;

type IInteractivityService = IInteractivityServiceCommon<SelectableDataPoint>;

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

// behavior
import { VisualBehavior } from "./behavior/visualBehavior";
import { CustomVisualBehavior } from "./behavior/customVisualBehavior";
import { CustomVisualBehaviorOptions } from "./behavior/customVisualBehaviorOptions";

import * as columnChart from "./columnChart/columnChartVisual";
import * as columnChartBaseColumnChart from "./columnChart/baseColumnChart";

// columnChart
import IColumnChart = columnChart.IColumnChart;
import BaseColumnChart = columnChartBaseColumnChart.BaseColumnChart;
import createBaseColumnChartLayer = columnChartBaseColumnChart.createBaseColumnChartLayer;

// dataViewUtils
import isScalar = dataViewUtils.isScalar;
import getValueAxisProperties = dataViewUtils.getValueAxisProperties;
import getCategoryAxisProperties = dataViewUtils.getCategoryAxisProperties;
import { getFillColorByPropertyName } from "powerbi-visuals-utils-dataviewutils/lib/dataViewObject";


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
    private static XAxisLabelSelector: ClassAndSelector = createClassAndSelector("xAxisLabel");
    private static YAxisLabelSelector: ClassAndSelector = createClassAndSelector("yAxisLabel");
    private static LegendSelector: ClassAndSelector = createClassAndSelector("legend");
    private static XBrushSelector: ClassAndSelector = createClassAndSelector("x brush");
    private static BrushSelector: ClassAndSelector = createClassAndSelector("brush");
    private static LabelMiddleSelector: ClassAndSelector = createClassAndSelector("labelMiddle");
    private static ZeroLineSelector: ClassAndSelector = createClassAndSelector("zero-line");
    private static SvgScrollableSelector: ClassAndSelector = createClassAndSelector("svgScrollable");
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

    private static getTextProperties(fontSize: number = MekkoChart.FontSize): TextProperties {
        return {
            fontFamily: "helvetica, arial, sans-serif",
            fontSize: PixelConverter.toString(fontSize),
        };
    }

    public static SeriesSelector: ClassAndSelector = createClassAndSelector("series");

    public static Properties: MekkoChartProperties = <MekkoChartProperties>{
        dataPoint: {
            defaultColor: { objectName: "dataPoint", propertyName: "defaultColor" },
            fill: { objectName: "dataPoint", propertyName: "fill" },
            showAllDataPoints: { objectName: "dataPoint", propertyName: "showAllDataPoints" },
            categoryGradient: { objectName: "dataPoint", propertyName: "categoryGradient" },
            colorGradientEndColor: { objectName: "dataPoint", propertyName: "colorGradientEndColor" },
            colorDistribution: { objectName: "dataPoint", propertyName: "colorDistribution" }
        },
        columnBorder: {
            show: { objectName: "columnBorder", propertyName: "show", },
            color: { objectName: "columnBorder", propertyName: "color" },
            width: { objectName: "columnBorder", propertyName: "width" }
        },
        sortSeries: {
            enabled: { objectName: "sortSeries", propertyName: "enabled", },
            direction: { objectName: "sortSeries", propertyName: "direction" },
            displayPercents: { objectName: "sortSeries", propertyName: "displayPercents" }
        },
        sortLegend: {
            enabled: { objectName: "sortLegend", propertyName: "enabled", },
            direction: { objectName: "sortLegend", propertyName: "direction" },
            groupByCategory: { objectName: "sortLegend", propertyName: "groupByCategory" },
            groupByCategoryDirection: { objectName: "sortLegend", propertyName: "groupByCategoryDirection" }
        },
        xAxisLabels: {
            enableRotataion: { objectName: "xAxisLabels", propertyName: "enableRotataion", },
        },
        categoryColors: {
            color: { objectName: "categoryColors", propertyName: "color" },
        }
    };

    public static DefaultSettings: MekkoChartSettings = {
        columnBorder: {
            show: true,
            color: "#fff",
            width: 2,
            maxWidth: 5,
        },
        labelSettings: {
            maxPrecision: 4,
            minPrecision: 0,
        },
        sortLegend: {
            enabled: false,
            groupByCategory: false,
            direction: SortDirection.Ascending,
            groupByCategoryDirection: SortDirection.Ascending
        },
        sortSeries: {
            enabled: false,
            direction: SortDirection.Ascending,
            displayPercents: "category"
        },
        xAxisLabels: {
            enableRotataion: false
        },
        categoryAxis: {
            labelColor: {
                solid: {
                    color: "#000000"
                }
            }
        },
        valueAxis: {
            labelColor: {
                solid: {
                    color: "#000000"
                }
            }
        },
        categoryColor: {
            color: "#ffffff",
        },
        dataPoint: {
            categoryGradient: false,
            colorDistribution: true,
            colorGradientEndColor: {
                solid: {
                    color: "#f9eaea"
                }
            }
        }
    };

    public static MinOrdinalRectThickness: number = 20;
    public static MinScalarRectThickness: number = 2;
    public static OuterPaddingRatio: number = 0.4;
    public static InnerPaddingRatio: number = 0.2;
    public static TickLabelPadding: number = 2;

    private rootElement: Selection;
    private legendParent: Selection;
    private axisGraphicsContext: Selection;
    private xAxisGraphicsContext: Selection;
    private y1AxisGraphicsContext: Selection;
    private y2AxisGraphicsContext: Selection;
    private svg: Selection;
    private clearCatcher: Selection;

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

    private borderObjectProperties: powerbi.DataViewObject;
    private legendObjectProperties: powerbi.DataViewObject;
    private categoryAxisProperties: powerbi.DataViewObject;

    private valueAxisProperties: powerbi.DataViewObject;
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

    private settingsModel: VisualFormattingSettingsModel;

    constructor(options: VisualConstructorOptions) {
        this.init(options);
    }

    public init(options: VisualConstructorOptions) {
        this.visualInitOptions = options;
        this.visualHost = options.host;

        select("body").style(
            "-webkit-tap-highlight-color", "transparent"
        );

        this.rootElement = select(options.element)
            .append("div")
            .classed(MekkoChart.ClassName, true);

        this.behavior = new CustomVisualBehavior([new VisualBehavior()]);

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

        this.clearCatcher = appendClearCatcher(this.axisGraphicsContextScrollable);

        this.xAxisGraphicsContext = this.axisGraphicsContext
            .append("g")
            .classed(MekkoChart.XAxisSelector.className, true);

        this.y1AxisGraphicsContext = this.axisGraphicsContextScrollable
            .append("g")
            .classed(MekkoChart.YAxisSelector.className, true);

        this.y2AxisGraphicsContext = this.axisGraphicsContextScrollable
            .append("g")
            .classed(MekkoChart.YAxisSelector.className, true);

        this.xAxisGraphicsContext
            .classed(MekkoChart.ShowLinesOnAxisSelector.className, true)
            .classed(MekkoChart.HideLinesOnAxisSelector.className, false);

        this.y1AxisGraphicsContext
            .classed(MekkoChart.ShowLinesOnAxisSelector.className, true)
            .classed(MekkoChart.HideLinesOnAxisSelector.className, false);

        this.y2AxisGraphicsContext
            .classed(MekkoChart.ShowLinesOnAxisSelector.className, true)
            .classed(MekkoChart.HideLinesOnAxisSelector.className, false);

        this.interactivityService = createInteractivityService(this.visualHost);
        
        this.localizationManager = this.visualHost.createLocalizationManager();
        this.formattingSettingsService = new FormattingSettingsService(this.localizationManager);

        let legendParent = select(this.rootElement.node()).append("div").classed("legendParentDefault", true);

        this.legend = createLegend(
            <HTMLElement>legendParent.node(),
            false,
            this.interactivityService,
            true);
    }

    private calculateXAxisAdditionalHeight(categories: PrimitiveValue[]): number {
        let sortedByLength: PrimitiveValue[] = categories.sort((a, b) => a["length"] > b["length"] ? 1 : -1);
        let longestCategory: PrimitiveValue = sortedByLength[categories.length - 1] || "";
        let shortestCategory: PrimitiveValue = sortedByLength[0] || "";

        if (longestCategory instanceof Date) {
            let metadataColumn: DataViewMetadataColumn = this.dataViews[0].categorical.categories[0].source;
            let formatString: string = valueFormatter.getFormatStringByColumn(metadataColumn);

            let formatter = valueFormatter.create({
                format: formatString,
                value: shortestCategory,
                value2: longestCategory,
                columnType: <ValueTypeDescriptor>{
                    dateTime: true
                }
            });

            longestCategory = formatter.format(longestCategory);
        }

        const xAxisTextProperties: TextProperties = MekkoChart.getTextProperties(this.categoryAxisProperties
            && PixelConverter.fromPointToPixel(
                parseFloat(<any>this.categoryAxisProperties["fontSize"])) || undefined);

        let longestCategoryWidth = textMeasurementService.measureSvgTextWidth(xAxisTextProperties, longestCategory.toString());
        let requiredHeight = longestCategoryWidth * Math.tan(MekkoChart.CategoryTextRotataionDegree * Math.PI / 180);
        return requiredHeight;
    }

    public static getTranslation(transform): [number, number, number] {
        let g = document.createElementNS("http://www.w3.org/2000/svg", "g");

        g.setAttributeNS(null, "transform", transform);

        let matrix = g.transform.baseVal.consolidate().matrix;

        return [matrix.e, matrix.f, -Math.asin(matrix.a) * 180 / Math.PI];
    }

    private renderAxesLabels(options: MekkoAxisRenderingOptions, xFontSize: number, yFontSize: number): void {
        this.axisGraphicsContext
            .selectAll(MekkoChart.XAxisLabelSelector.selectorName)
            .remove();

        this.axisGraphicsContext
            .selectAll(MekkoChart.YAxisLabelSelector.selectorName)
            .remove();

        const margin: IMargin = this.margin,
            width: number = options.viewport.width - (margin.left + margin.right),
            height: number = options.viewport.height,
            fontSize: number = MekkoChart.FontSize;

        const showOnRight: boolean = this.yAxisOrientation === axisPosition.right;

        if (!options.hideXAxisTitle && (this.categoryAxisProperties["show"] === undefined || this.categoryAxisProperties["show"])) {
            const xAxisYPosition: number = MekkoChart.getTranslation(this.xAxisGraphicsContext.attr("transform"))[1]
                - fontSize + xFontSize + MekkoChart.XAxisYPositionOffset;

            const rotataionEnabled = (<BaseColumnChart>this.layers[0]).getXAxisLabelsSettings().enableRotataion;

            let shiftTitle: number = 0;
            if (rotataionEnabled) {
                let axes: MekkoChartAxisProperties = this.axes = axisUtils.calculateAxes(
                    this.layers,
                    options.viewport,
                    this.margin,
                    this.categoryAxisProperties,
                    this.valueAxisProperties,
                    this.isXScrollBarVisible || this.isYScrollBarVisible,
                    null);
                shiftTitle = this.calculateXAxisAdditionalHeight(axes.x.values);
            }

            const xAxisLabel: Selection = this.axisGraphicsContext.append("text")
                .attr(
                    "x", width / MekkoChart.WidthDelimiter
                )
                .attr(
                    "y", xAxisYPosition + shiftTitle
                )
                .style(
                    "fill", options.xLabelColor
                    ? options.xLabelColor.solid.color
                    : null
                )
                .style("font-family", <string>(this.categoryAxisProperties["fontFamily"]) ?? "Arial")
                .style("font-size", xFontSize)
                .style("font-weight", <boolean>(this.categoryAxisProperties["fontBold"]) ? "bold" : "normal")
                .style("font-style", <boolean>(this.categoryAxisProperties["fontItalic"]) ? "italic" : "normal")
                .style("text-decoration", <boolean>(this.categoryAxisProperties["fontUnderline"]) ? "underline" : "none")
                .text(options.axisLabels.x)
                .classed(MekkoChart.XAxisLabelSelector.className, true);

                xAxisLabel.call(
                AxisHelper.LabelLayoutStrategy.clip,
                width,
                textMeasurementService.svgEllipsis);
        }

        if (!options.hideYAxisTitle) {
            const yAxisLabel: Selection = this.axisGraphicsContext.append("text")
                .style(
                    "fill", options.yLabelColor
                    ? options.yLabelColor.solid.color
                    : null
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
                .style("font-family", <string>(this.valueAxisProperties["fontFamily"]) ?? "Arial")
                .style("font-size", yFontSize)
                .style("font-weight", <boolean>(this.valueAxisProperties["fontBold"]) ? "bold" : "normal")
                .style("font-style", <boolean>(this.valueAxisProperties["fontItalic"]) ? "italic" : "normal")
                .style("text-decoration", <boolean>(this.valueAxisProperties["fontUnderline"]) ? "underline" : "none")
                .classed(MekkoChart.YAxisLabelSelector.className, true);

            yAxisLabel.call(AxisHelper.LabelLayoutStrategy.clip,
                height - (margin.bottom + margin.top),
                textMeasurementService.svgEllipsis);
        }

        if (!options.hideY2AxisTitle && options.axisLabels.y2) {
            const y2AxisLabel: Selection = this.axisGraphicsContext.append("text")
                .text(options.axisLabels.y2)
                .attr("transform", MekkoChart.TransformRotate)
                .attr("y", showOnRight ? -margin.left : width + margin.right - fontSize)
                .attr("x", -((height - margin.top - options.legendMargin) / MekkoChart.XDelimiter))
                .attr("dy", MekkoChart.DefaultDy)
                .style(
                    "fill", options.y2LabelColor
                    ? options.y2LabelColor.solid.color
                    : null
                )
                .classed(MekkoChart.YAxisLabelSelector.className, true);

            y2AxisLabel.call(AxisHelper.LabelLayoutStrategy.clip,
                height - (margin.bottom + margin.top),
                textMeasurementService.svgEllipsis);
        }
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

        this.y2AxisGraphicsContext
            .attr("transform", manipulation.translate(showY1OnRight ? 0 : width, 0));

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

    private populateObjectProperties(dataViews: DataView[]) {
        if (dataViews && dataViews.length > 0) {
            const dataViewMetadata: DataViewMetadata = dataViews[0].metadata;

            if (dataViewMetadata) {
                this.legendObjectProperties = dataViewObjects.getObject(
                    dataViewMetadata.objects,
                    "legend",
                    {});

                this.borderObjectProperties = dataViewObjects.getObject(
                    dataViewMetadata.objects,
                    "columnBorder",
                    {});
            }
            else {
                this.legendObjectProperties = {};
                this.borderObjectProperties = {};
            }

            this.categoryAxisProperties = getCategoryAxisProperties(dataViewMetadata);
            this.valueAxisProperties = getValueAxisProperties(dataViewMetadata);

            if (dataViewMetadata &&
                dataViewMetadata.objects) {
                const categoryAxis: powerbi.DataViewObject = dataViewMetadata.objects["categoryAxis"],
                    valueAxis: powerbi.DataViewObject = dataViewMetadata.objects["valueAxis"];

                if (categoryAxis) {
                    this.categoryAxisProperties["showBorder"] = categoryAxis["showBorder"];
                    this.categoryAxisProperties["fontSize"] = categoryAxis["fontSize"];
                }

                if (valueAxis) {
                    this.valueAxisProperties["fontSize"] = valueAxis["fontSize"];
                }
            }

            const axisPos: DataViewPropertyValue = this.valueAxisProperties["position"];

            this.yAxisOrientation = axisPos
                ? axisPos.toString()
                : axisPosition["left"];
        }
    }

    public checkDataset(): boolean {
        if (!this.dataViews ||
            !this.dataViews[0] ||
            !this.dataViews[0].categorical ||
            !this.dataViews[0].categorical.categories ||
            !this.dataViews[0].categorical.categories[0] ||
            !this.dataViews[0].categorical.categories[0].values[0]
        ) {
            return false;
        }

        return true;
    }

    public update(options: VisualUpdateOptions) {
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
            this.populateObjectProperties(this.dataViews);
            this.settingsModel = this.formattingSettingsService.populateFormattingSettingsModel(VisualFormattingSettingsModel, this.dataViews);
        }

        for (let layerIndex: number = 0, length: number = this.layers.length; layerIndex < length; layerIndex++) {
            this.layers[layerIndex].setData(dataViewUtils.getLayerData(this.dataViews, layerIndex, length));
        }

        const rotataionEnabled = (<BaseColumnChart>this.layers[0]).getXAxisLabelsSettings().enableRotataion;
        let additionHeight: number = 0;
        if (rotataionEnabled) {
            let axes: MekkoChartAxisProperties = this.axes = axisUtils.calculateAxes(
                this.layers,
                this.currentViewport,
                this.margin,
                this.categoryAxisProperties,
                this.valueAxisProperties,
                this.isXScrollBarVisible || this.isYScrollBarVisible,
                null);
            additionHeight += this.calculateXAxisAdditionalHeight(axes.x.values);
        }

        if ((this.currentViewport.width < MekkoChart.MinWidth)
            || (this.currentViewport.height < MekkoChart.MinHeight + additionHeight)) {
            this.clearViewport();
            return;
        }

        this.renderLegend();

        this.render();

        this.hasSetData = this.hasSetData
            || (this.dataViews && this.dataViews.length > 0);
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

    public static parseLabelSettings(objects: powerbi.DataViewObjects): VisualDataLabelsSettings {
        const labelSettings: VisualDataLabelsSettings = dataLabelUtils.getDefaultColumnLabelSettings(true),
            labelsObj: MekkoChartDataLabelObject = objects["labels"] as any,
            minPrecision: number = MekkoChart.DefaultSettings.labelSettings.minPrecision,
            maxPrecision: number = MekkoChart.DefaultSettings.labelSettings.maxPrecision;

        (<MekkoChartLabelSettings>labelSettings).forceDisplay = false;
        dataLabelUtils.updateLabelSettingsFromLabelsObject(labelsObj, labelSettings);
        (<MekkoChartLabelSettings>labelSettings).forceDisplay = <boolean>(labelsObj || { forceDisplay: false }).forceDisplay;

        if (labelSettings.precision < minPrecision) {
            labelSettings.precision = minPrecision;
        }

        if (labelSettings.precision > maxPrecision) {
            labelSettings.precision = maxPrecision;
        }

        return labelSettings;
    }

    public static parseXAxisLabelsSettings(objects: powerbi.DataViewObjects): MekkoXAxisLabelsSettings {
        const enableRotataion: boolean = dataViewObjects.getValue(
            objects,
            MekkoChart.Properties["xAxisLabels"]["enableRotataion"],
            MekkoChart.DefaultSettings.xAxisLabels.enableRotataion);

        return {
            enableRotataion
        };
    }

    public static parseDataPointSettings(objects: powerbi.DataViewObjects): MekkoDataPointSettings {
        const categoryGradient: boolean = dataViewObjects.getValue(
            objects,
            MekkoChart.Properties["dataPoint"]["categoryGradient"],
            MekkoChart.DefaultSettings.dataPoint.categoryGradient);

        const colorGradientEndColor: string = dataViewObjects.getValue(
            objects,
            MekkoChart.Properties["dataPoint"]["colorGradientEndColor"],
            MekkoChart.DefaultSettings.dataPoint.colorGradientEndColor);

        const colorDistribution: boolean = dataViewObjects.getValue(
            objects,
            MekkoChart.Properties["dataPoint"]["colorDistribution"],
            MekkoChart.DefaultSettings.dataPoint.colorDistribution);

        return {
            categoryGradient,
            colorGradientEndColor,
            colorDistribution
        };
    }
    public static parseSeriesSortSettings(objects: powerbi.DataViewObjects): MekkoSeriesSortSettings {
        const enabled: boolean = dataViewObjects.getValue(
            objects,
            MekkoChart.Properties["sortSeries"]["enabled"],
            MekkoChart.DefaultSettings.sortSeries.enabled);

        const direction: string = dataViewObjects.getValue(
            objects,
            MekkoChart.Properties["sortSeries"]["direction"],
            MekkoChart.DefaultSettings.sortSeries.direction);

        const displayPercents: string = dataViewObjects.getValue(
            objects,
            MekkoChart.Properties["sortSeries"]["displayPercents"],
            MekkoChart.DefaultSettings.sortSeries.displayPercents);

        return {
            enabled,
            direction,
            displayPercents
        };
    }

    public static parseLegendSortSettings(objects: powerbi.DataViewObjects): MekkoLegendSortSettings {
        const enabled: boolean = dataViewObjects.getValue(
            objects,
            MekkoChart.Properties["sortLegend"]["enabled"],
            MekkoChart.DefaultSettings.sortLegend.enabled);

        const direction: string = dataViewObjects.getValue(
            objects,
            MekkoChart.Properties["sortLegend"]["direction"],
            MekkoChart.DefaultSettings.sortLegend.direction);

        const groupByCategory: boolean = dataViewObjects.getValue(
            objects,
            MekkoChart.Properties["sortLegend"]["groupByCategory"],
            MekkoChart.DefaultSettings.sortLegend.groupByCategory);

        const groupByCategoryDirection: string = dataViewObjects.getValue(
            objects,
            MekkoChart.Properties["sortLegend"]["groupByCategoryDirection"],
            MekkoChart.DefaultSettings.sortLegend.groupByCategoryDirection);

        return {
            enabled,
            direction,
            groupByCategory,
            groupByCategoryDirection
        };
    }

    public static parseBorderSettings(objects: powerbi.DataViewObjects): MekkoBorderSettings {
        const show: boolean = dataViewObjects.getValue(
            objects,
            MekkoChart.Properties["columnBorder"]["show"],
            MekkoChart.DefaultSettings.columnBorder.show);

        const color: string = dataViewObjects.getFillColor(
            objects,
            MekkoChart.Properties["columnBorder"]["color"],
            MekkoChart.DefaultSettings.columnBorder.color);

        let width: number = dataViewObjects.getValue(
            objects,
            MekkoChart.Properties["columnBorder"]["width"],
            MekkoChart.DefaultSettings.columnBorder.width);

        const maxWidth: number = MekkoChart.DefaultSettings.columnBorder.maxWidth;

        if (width > maxWidth) {
            width = maxWidth;
        } else if (width < 0) {
            width = 0;
        }

        if (!show) {
            width = 0;
        }

        return {
            show,
            color,
            width
        };
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        const formattingModel = this.formattingSettingsService.buildFormattingModel(this.settingsModel);
        return formattingModel;
    }

    private getPointsFormattingCard(): powerbi.visuals.FormattingCard {
        const dataPointSettings: MekkoDataPointSettings = (<BaseColumnChart>this.layers[0]).getData().dataPointSettings;
        const showAllDataPoints: boolean = (<BaseColumnChart>this.layers[0]).getData().showAllDataPoints ?? false;

        let showGradientSlice: powerbi.visuals.FormattingSlice = {
            uid: "dataPointsCard_dataPoints_categoryGradient_uid",
            displayName: "Category Gradient",
            control: {
                type: powerbi.visuals.FormattingComponent.ToggleSwitch,
                properties: {
                    descriptor: {
                        objectName: "dataPoint",
                        propertyName: "categoryGradient"
                    },
                    value: dataPointSettings.categoryGradient
                }
            }
        };

        let pointsCardGroup: powerbi.visuals.FormattingGroup = {
            displayName: "Data Points",
            uid: "dataPointsCard_dataPoints_group_uid",
            slices: [
                {
                    uid: "dataPointsCard_dataPoints_showAllDataPoints_uid",
                    displayName: "Show All Data Points",
                    control: {
                        type: powerbi.visuals.FormattingComponent.ToggleSwitch,
                        properties: {
                            descriptor: {
                                objectName: "dataPoint",
                                propertyName: "showAllDataPoints"
                            },
                            value: showAllDataPoints
                        }
                    }
                },
            ]
        };

        if ((<BaseColumnChart>this.layers[0]).checkDataToFeatures()) {
            pointsCardGroup.slices.push(showGradientSlice);
        }

        pointsCardGroup = this.addCategoryColorFormattingSlices(pointsCardGroup);

        let pointsCard: powerbi.visuals.FormattingCard = {
            description: "Data Points",
            displayName: "Data Points",
            uid: "dataPoints_uid",
            groups: [
                pointsCardGroup
            ]
        };
        return pointsCard;
    }

    private addCategoryColorFormattingSlices(
        pointsCardGroup: powerbi.visuals.FormattingGroup): powerbi.visuals.FormattingGroup {

        const dataPointSettings: MekkoDataPointSettings = (<BaseColumnChart>this.layers[0]).getData().dataPointSettings;
        const layersLength: number = this.layers ? this.layers.length : 0;

        if (dataPointSettings.categoryGradient === false) {
            for (let i: number = 0; i < layersLength; i++) {
                for (let series of (<BaseColumnChart>this.layers[i]).getData().series) {
                    pointsCardGroup.slices.push({
                        uid: `dataPointsCard_dataPoints_${series.displayName}Color_uid`,
                        displayName: `${series.displayName} Color`,
                        control: {
                            type: powerbi.visuals.FormattingComponent.ColorPicker,
                            properties: {
                                descriptor: {
                                    objectName: "dataPoint",
                                    propertyName: "fill",
                                    selector: ColorHelper.normalizeSelector(series.identity.getSelector(), true),
                                },
                                value: { value: series.color }
                            }
                        }
                    });
                }
            }
        }
        else {
            for (let i: number = 0; i < layersLength; i++) {
                (<BaseColumnChart>this.layers[i]).getData().categories.forEach((category, index) => {
                    let categoryLegends: MekkoLegendDataPoint[] = (<BaseColumnChart>this.layers[i]).getData().legendData.dataPoints.filter(legend => legend.category === category);
                    if (categoryLegends[0] === undefined) {
                        return;
                    }
                    pointsCardGroup.slices.push({
                        uid: `dataPointsCard_dataPoints_${category}Start_uid`,
                        displayName: `${category} Start`,
                        control: {
                            type: powerbi.visuals.FormattingComponent.ColorPicker,
                            properties: {
                                descriptor: {
                                    objectName: "categoryColorStart",
                                    propertyName: "categoryGradient",
                                    selector: ColorHelper.normalizeSelector(categoryLegends[0].categoryIdentity.getSelector(), true),
                                },
                                value: { value: categoryLegends[0].categoryStartColor }
                            }
                        }
                    });
                    pointsCardGroup.slices.push({
                        uid: `dataPointsCard_dataPoints_${category}End_uid`,
                        displayName: `${category} End`,
                        control: {
                            type: powerbi.visuals.FormattingComponent.ColorPicker,
                            properties: {
                                descriptor: {
                                    objectName: "categoryColorEnd",
                                    propertyName: "categoryGradient",
                                    selector: ColorHelper.normalizeSelector(categoryLegends[0].categoryIdentity.getSelector(), true),
                                },
                                value: { value: categoryLegends[0].categoryEndColor }
                            }
                        }
                    });
                });
            }
        }
        return pointsCardGroup;
    }

    public onClearSelection(): void {
        if (this.hasSetData) {
            for (let layer of this.layers) {
                layer.onClearSelection();
                layer.render(true);
            }
        }
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
            this.interactivityService,
            this.isScrollable);

        let cartesianOptions: MekkoChartVisualInitOptions
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

    private renderLegend(): void {
        let layers: IColumnChart[] = this.layers,
            legendData: ILegendData = {
                title: "",
                fontSize: <number>this.legendObjectProperties.fontSize,
                fontFamily: <string>this.legendObjectProperties.fontFamily,
                dataPoints: []
            };

        for (let i: number = 0; i < layers.length; i++) {
            this.layerLegendData = layers[i].calculateLegend();

            if (this.layerLegendData) {
                legendData.title = i === 0
                    ? this.layerLegendData.title || ""
                    : legendData.title;

                legendData.dataPoints = legendData.dataPoints
                    .concat(this.layerLegendData.dataPoints || []);

                if (this.layerLegendData.grouped) {
                    legendData.grouped = true;
                }
            }
        }

        const legendProperties: powerbi.DataViewObject = this.legendObjectProperties;

        if (legendProperties) {
            if (!legendProperties["fontSize"]) {
                legendProperties["fontSize"] = MekkoChart.DefaultLabelFontSizeInPt;
            }

            LegendData.update(legendData, legendProperties);

            const position: string = legendProperties[legendProps.position] as string;

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

        let reducedLegends: IGrouppedLegendData[] = [];
        let legendSortSettings: MekkoLegendSortSettings = (<BaseColumnChart>this.layers[0]).getLegendSortSettings();
        if (legendSortSettings.enabled) {
            if (legendSortSettings.groupByCategory) {
                let mappedLegends = legendData.dataPoints.map((dataPoint: MekkoLegendDataPoint) => {
                    let maxVal = max(dataPoint.categoryValues as Number[]);
                    let index = dataPoint.categoryValues.indexOf(maxVal as PrimitiveValue);
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
                    legend.data = legend.data.sort((a, b) => a["valueSum"] > b["valueSum"] ? 1 : -1);
                    if (legendSortSettings.groupByCategoryDirection === MekkoChart.SortDirectionDescending) {
                        legend.data = legend.data.reverse();
                    }
                });

                reducedLegends = reducedLegends.sort((a, b) => a["categorySort"] > b["categorySort"] ? 1 : -1);

                if (legendSortSettings.direction === MekkoChart.SortDirectionDescending) {
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
                legendData.dataPoints = legendData.dataPoints.sort((a, b) => a["valueSum"] > b["valueSum"] ? 1 : -1);
                if (legendSortSettings.direction === MekkoChart.SortDirectionDescending) {
                    legendData.dataPoints = legendData.dataPoints.reverse();
                }
            }
        }

        let svgHeight: number = textMeasurementService.estimateSvgTextHeight({
            // fontFamily: MekkoChart.LegendBarTextFont,
            fontFamily: <string>this.legendObjectProperties.fontFamily ?? "helvetica, arial, sans-serif;",
            fontSize: PixelConverter.toString(+legendProperties["fontSize"] + MekkoChart.LegendBarHeightMargin),
            text: "AZ"
        });

        select(this.rootElement.node()).selectAll("div.legendParent").remove();
        this.categoryLegends = [];
        let legendParents = select(this.rootElement.node()).selectAll("div.legendParent");

        reducedLegends = reducedLegends.filter((l: IGrouppedLegendData) => l !== undefined);
        let legendParentsWithData = legendParents.data(reducedLegends);
        let legendParentsWithChilds = legendParentsWithData.enter().append("div");
        let legendParentsWithChildsAttr = legendParentsWithChilds.classed("legendParent", true)
            .style("position", "absolute")
            .style("top", (data, index) => PixelConverter.toString(svgHeight * index));

        let mekko = this;
        this.categoryLegends = this.categoryLegends || [];
        legendParentsWithChildsAttr.each(function (data, index) {
            let legendSvg = select(this);
            legendSvg.style("font-family", <string>legendProperties["fontFamily"]);
            if (legendSvg.select("svg").node() === null) {
                let legend: ILegend = createLegend(
                    <any>this,
                    false,
                    mekko.interactivityService,
                    true);

                mekko.categoryLegends[index] = <ILegend>legend;
            }
        });

        if (reducedLegends.length) {
            this.legendMargins = this.categoryLegends[0].getMargins();
            this.legendMargins.height = this.legendMargins.height - MekkoChart.LegendBarHeightMargin;
            this.legendMargins.height = this.legendMargins.height * reducedLegends.length;
        }
        if (reducedLegends.length > 0) {
            this.categoryLegends.forEach((legend: ILegend, index: number) => {
                (<ILegendGroup>legend).position = +select((<ILegendGroup>legend).element).style("top").replace("px", "");
            });
            this.categoryLegends = this.categoryLegends.sort((a, b) => a["position"] > b["position"] ? 1 : -1).reverse();
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

                let legendData: ILegendData = {
                    title: reducedLegends[index].category,
                    dataPoints: reducedLegends[index].data
                };

                LegendData.update(legendData, legendProperties);
                legend.drawLegend(legendData, this.currentViewport);

                if (index === 0) {
                    if (legendParentsWithChildsAttr.node() === null) {
                        svgHeight = +legendParents.select("svg").attr("height").replace("px", "");
                    } else {
                        svgHeight = +select(legendParentsWithChildsAttr.node()).select("svg").attr("height").replace("px", "");
                    }
                }
            });
        }
        legendParentsWithData.exit().remove();

        if (legendProperties["show"] === false) {
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

    private addUnitTypeToAxisLabel(axes: MekkoChartAxisProperties): void {
        let unitType: string = MekkoChart.getUnitType(
            axes,
            (axis: MekkoChartAxisProperties) => axis.x);

        if (axes.x.isCategoryAxis) {
            this.categoryAxisHasUnitType = unitType !== null;
        }
        else {
            this.valueAxisHasUnitType = unitType !== null;
        }

        if (axes.x.axisLabel && unitType) {
            if (axes.x.isCategoryAxis) {
                axes.x.axisLabel = AxisHelper.createAxisLabel(
                    this.categoryAxisProperties,
                    axes.x.axisLabel,
                    unitType);
            }
            else {
                axes.x.axisLabel = AxisHelper.createAxisLabel(
                    this.valueAxisProperties,
                    axes.x.axisLabel,
                    unitType);
            }
        }

        unitType = MekkoChart.getUnitType(
            axes,
            (axis: MekkoChartAxisProperties) => axis.y1);

        if (!axes.y1.isCategoryAxis) {
            this.valueAxisHasUnitType = unitType !== null;
        }
        else {
            this.categoryAxisHasUnitType = unitType !== null;
        }

        if (axes.y1.axisLabel && unitType) {
            if (!axes.y1.isCategoryAxis) {
                axes.y1.axisLabel = AxisHelper.createAxisLabel(
                    this.valueAxisProperties,
                    axes.y1.axisLabel,
                    unitType);
            }
            else {
                axes.y1.axisLabel = AxisHelper.createAxisLabel(
                    this.categoryAxisProperties,
                    axes.y1.axisLabel,
                    unitType);
            }
        }

        if (axes.y2) {
            let unitType: string = MekkoChart.getUnitType(
                axes,
                (axis: MekkoChartAxisProperties) => axis.y2);

            this.secValueAxisHasUnitType = unitType !== null;

            if (axes.y2.axisLabel && unitType) {
                if (this.valueAxisProperties && this.valueAxisProperties["secAxisStyle"]) {
                    if (this.valueAxisProperties["secAxisStyle"] === axisStyle.showBoth) {
                        axes.y2.axisLabel = `${axes.y2.axisLabel} (${unitType})`;
                    }
                    else if (this.valueAxisProperties["secAxisStyle"] === axisStyle.showUnitOnly) {
                        axes.y2.axisLabel = unitType;
                    }
                }
            }
        }
    }

    private shouldRenderSecondaryAxis(axisProperties: IAxisProperties): boolean {
        if (axisProperties
            && (!this.valueAxisProperties
                || this.valueAxisProperties["secShow"] == null
                || this.valueAxisProperties["secShow"])) {

            return axisProperties.values && axisProperties.values.length > 0;
        }

        return false;
    }

    private shouldRenderAxis(
        axisProperties: IAxisProperties,
        propertyName: string = "show"): boolean {

        if (axisProperties) {
            if (axisProperties.isCategoryAxis
                && (!this.categoryAxisProperties
                    || this.categoryAxisProperties[propertyName] == null
                    || this.categoryAxisProperties[propertyName])) {

                return axisProperties.values
                    && axisProperties.values.length > 0;
            }
            else if (!axisProperties.isCategoryAxis
                && (!this.valueAxisProperties
                    || this.valueAxisProperties[propertyName] == null
                    || this.valueAxisProperties[propertyName])) {

                return axisProperties.values
                    && axisProperties.values.length > 0;
            }
        }

        return false;
    }

    private render(suppressAnimations: boolean = true): void {
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

        const xAxisTextProperties: TextProperties = MekkoChart.getTextProperties(this.categoryAxisProperties
            && PixelConverter.fromPointToPixel(
                parseFloat(<any>this.categoryAxisProperties["fontSize"])) || undefined);

        const y1AxisTextProperties: TextProperties = MekkoChart.getTextProperties(this.valueAxisProperties
            && PixelConverter.fromPointToPixel(
                parseFloat(<any>this.valueAxisProperties["fontSize"])) || undefined);

        const margin: IMargin = this.margin;

        // reset defaults
        margin.top = parseFloat(y1AxisTextProperties.fontSize) / MekkoChart.MarginTopFactor;
        margin.bottom = MekkoChart.MinBottomMargin;
        margin.right = 0;

        let axes: MekkoChartAxisProperties = this.axes = axisUtils.calculateAxes(
            this.layers,
            viewport,
            margin,
            this.categoryAxisProperties,
            this.valueAxisProperties,
            this.isXScrollBarVisible || this.isYScrollBarVisible,
            null);

        this.yAxisIsCategorical = axes.y1.isCategoryAxis;

        this.hasCategoryAxis = this.yAxisIsCategorical
            ? axes.y1 && axes.y1.values.length > 0
            : axes.x && axes.x.values.length > 0;

        const renderXAxis: boolean = this.shouldRenderAxis(axes.x),
            renderY1Axis: boolean = this.shouldRenderAxis(axes.y1),
            renderY2Axis: boolean = this.shouldRenderSecondaryAxis(axes.y2);

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
            this.categoryAxisProperties,
            this.valueAxisProperties,
            this.isXScrollBarVisible || this.isYScrollBarVisible,
            null);

        // we need to make two passes because the margin changes affect the chosen tick values, which then affect the margins again.
        // after the second pass the margins are correct.
        let doneWithMargins: boolean = false,
            maxIterations: number = 2,
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
                null,
                false,
                this.isXScrollBarVisible || this.isYScrollBarVisible,
                showY1OnRight,
                renderXAxis,
                renderY1Axis,
                renderY2Axis);

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

            const rotataionEnabled = (<BaseColumnChart>this.layers[0]).getXAxisLabelsSettings().enableRotataion;

            if (rotataionEnabled) {
                let axes: MekkoChartAxisProperties = this.axes = axisUtils.calculateAxes(
                    this.layers,
                    this.currentViewport,
                    this.margin,
                    this.categoryAxisProperties,
                    this.valueAxisProperties,
                    this.isXScrollBarVisible || this.isYScrollBarVisible,
                    null);

                xMax += this.calculateXAxisAdditionalHeight(axes.x.values);
            }

            if (this.hideAxisLabels(this.legendMargins)) {
                axes.x.axisLabel = null;
                axes.y1.axisLabel = null;

                if (axes.y2) {
                    axes.y2.axisLabel = null;
                }
            }

            this.addUnitTypeToAxisLabel(axes);
            axisLabels = {
                x: axes.x.axisLabel,
                y: axes.y1.axisLabel,
                y2: axes.y2
                    ? axes.y2.axisLabel
                    : null
            };

            chartHasAxisLabels = (axisLabels.x != null)
                || (axisLabels.y != null || axisLabels.y2 != null);

            if (axisLabels.x != null) {
                xMax += MekkoChart.XAxisLabelPadding;
            }

            if (axisLabels.y != null) {
                maxMainYaxisSide += MekkoChart.YAxisLabelPadding;
            }

            if (axisLabels.y2 != null) {
                maxSecondYaxisSide += MekkoChart.YAxisLabelPadding;
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
            const previousTickCountY1: number = axes.y1.values.length,
                previousTickCountY2: number = axes.y2 && axes.y2.values.length;

            axes = axisUtils.calculateAxes(
                this.layers,
                viewport,
                margin,
                this.categoryAxisProperties,
                this.valueAxisProperties,
                this.isXScrollBarVisible || this.isYScrollBarVisible,
                axes);

            if (axes.y1.values.length === previousTickCountY1
                && (!axes.y2 || axes.y2.values.length === previousTickCountY2)) {
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
            suppressAnimations);
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

    private static getUnitType(
        axis: MekkoChartAxisProperties,
        axisPropertiesLookup: (axis: MekkoChartAxisProperties) => IAxisProperties): string {

        if (axisPropertiesLookup(axis).formatter &&
            axisPropertiesLookup(axis).formatter.displayUnit &&
            axisPropertiesLookup(axis).formatter.displayUnit.value > 1) {

            return axisPropertiesLookup(axis).formatter.displayUnit.title;
        }

        return null;
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
        maxHeight: number,
        borderWidth: number): void {

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
        scrollScale?: any,
        extent?: number[]) {

        const bottomMarginLimit: number = this.bottomMarginLimit,
            leftRightMarginLimit: number = this.leftRightMarginLimit,
            layers: IColumnChart[] = this.layers,
            duration: number = MekkoChart.AnimationDuration,
            chartViewport: IViewport = MekkoChart.getChartViewport(viewport, this.margin);

        let xLabelColor: Fill,
            yLabelColor: Fill,
            y2LabelColor: Fill,
            xFontSize: any,
            yFontSize: any,
            xFontFamily: any,
            yFontFamily: any,
            xFontBold: any,
            yFontBold: any,
            xFontItalic: any,
            yFontItalic: any,
            xFontUnderline: any,
            yFontUnderline: any;
        if (this.shouldRenderAxis(axes.x)) {
            if (axes.x.isCategoryAxis) {
                xLabelColor = this.categoryAxisProperties
                    && this.categoryAxisProperties["labelColor"]
                    ? <Fill>this.categoryAxisProperties["labelColor"]
                    : MekkoChart.DefaultSettings.categoryAxis.labelColor;

                xFontSize = this.categoryAxisProperties
                    && this.categoryAxisProperties["fontSize"] != null
                    ? <Fill>this.categoryAxisProperties["fontSize"]
                    : MekkoChart.DefaultLabelFontSizeInPt;

                xFontFamily = this.categoryAxisProperties
                    && this.categoryAxisProperties["fontFamily"] != null
                    ? <string>this.categoryAxisProperties["fontFamily"]
                    : "Arial";

                xFontBold = this.categoryAxisProperties
                    && this.categoryAxisProperties["fontBold"] != null
                    ? <boolean>this.categoryAxisProperties["fontBold"]
                    : false;

                xFontItalic = this.categoryAxisProperties
                    && this.categoryAxisProperties["fontItalic"] != null
                    ? <boolean>this.categoryAxisProperties["fontItalic"]
                    : false;

                xFontUnderline = this.categoryAxisProperties
                    && this.categoryAxisProperties["fontUnderline"] != null
                    ? <boolean>this.categoryAxisProperties["fontUnderline"]
                    : false;
            } else {
                xLabelColor = this.valueAxisProperties
                    && this.valueAxisProperties["labelColor"]
                    ? <Fill>this.valueAxisProperties["labelColor"]
                    : MekkoChart.DefaultSettings.valueAxis.labelColor;

                xFontSize = this.valueAxisProperties
                    && this.valueAxisProperties["fontSize"]
                    ? this.valueAxisProperties["fontSize"]
                    : MekkoChart.DefaultLabelFontSizeInPt;

                xFontFamily = this.valueAxisProperties
                    && this.valueAxisProperties["fontFamily"] != null
                    ? <string>this.valueAxisProperties["fontFamily"]
                    : "Arial";

                xFontBold = this.valueAxisProperties
                    && this.valueAxisProperties["fontBold"] != null
                    ? <boolean>this.valueAxisProperties["fontBold"]
                    : false;

                xFontItalic = this.valueAxisProperties
                    && this.valueAxisProperties["fontItalic"] != null
                    ? <boolean>this.valueAxisProperties["fontItalic"]
                    : false;

                xFontUnderline = this.valueAxisProperties
                    && this.valueAxisProperties["fontUnderline"] != null
                    ? <boolean>this.valueAxisProperties["fontUnderline"]
                    : false;
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

            const xAxisTextNodes: Selection = xAxisGraphicsElement.selectAll("text");

            let columnWidth: number[] = [],
                borderWidth: number = 0;

            if (this.layers && this.layers.length) {
                columnWidth = this.layers[0].getColumnsWidth();
                borderWidth = this.layers[0].getBorderWidth();
            }

            xAxisGraphicsElement
                .call(
                    MekkoChart.moveBorder,
                    axes.x.scale,
                    borderWidth,
                    xFontSize / MekkoChart.XFontSizeDelimiter - MekkoChart.XFontSizeOffset);

            let xAxisLabelssettings: MekkoXAxisLabelsSettings = (<BaseColumnChart>this.layers[0]).getXAxisLabelsSettings();
            if (!xAxisLabelssettings.enableRotataion) {
                xAxisTextNodes
                    .call(
                        MekkoChart.wordBreak,
                        axes.x,
                        columnWidth,
                        bottomMarginLimit,
                        borderWidth);
            }
            else {
                xAxisTextNodes
                    .classed(MekkoChart.LabelMiddleSelector.className, true)
                    .attr("dx", MekkoChart.DefaultLabelDx)
                    .attr("dy", MekkoChart.DefaultLabelDy)
                    .attr("transform", `rotate(-${MekkoChart.CategoryTextRotataionDegree})`);

                // fix positions
                let categoryLabels = xAxisGraphicsElement.selectAll(".tick");
                categoryLabels.each(function (tick, index) {
                    let shiftX: number = (<any>this).getBBox().width / Math.tan(MekkoChart.CategoryTextRotataionDegree * Math.PI / 180) / 2.0;
                    let shiftY: number = (<any>this).getBBox().width * Math.tan(MekkoChart.CategoryTextRotataionDegree * Math.PI / 180) / 2.0;
                    let currTransform: string = (<any>this).attributes.transform.value;
                    let translate: [number, number, number] = MekkoChart.getTranslation(currTransform);
                    select(<any>this)
                        .attr("transform", (value: number, index: number) => {
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
                yLabelColor = this.categoryAxisProperties && this.categoryAxisProperties["labelColor"]
                    ? <Fill>this.categoryAxisProperties["labelColor"]
                    : null;

                yFontSize = this.categoryAxisProperties && this.categoryAxisProperties["fontSize"] != null
                    ? this.categoryAxisProperties["fontSize"]
                    : MekkoChart.DefaultLabelFontSizeInPt;

                yFontFamily = this.categoryAxisProperties
                    && this.categoryAxisProperties["fontFamily"] != null
                    ? <string>this.categoryAxisProperties["fontFamily"]
                    : "Arial";

                yFontBold = this.categoryAxisProperties
                    && this.categoryAxisProperties["fontBold"] != null
                    ? <boolean>this.categoryAxisProperties["fontBold"]
                    : false;

                yFontItalic = this.categoryAxisProperties
                    && this.categoryAxisProperties["fontItalic"] != null
                    ? <boolean>this.categoryAxisProperties["fontItalic"]
                    : false;

                yFontUnderline = this.categoryAxisProperties
                    && this.categoryAxisProperties["fontUnderline"] != null
                    ? <boolean>this.categoryAxisProperties["fontUnderline"]
                    : false;
            } else {
                yLabelColor = this.valueAxisProperties && this.valueAxisProperties["labelColor"]
                    ? <Fill>this.valueAxisProperties["labelColor"]
                    : null;

                yFontSize = this.valueAxisProperties && this.valueAxisProperties["fontSize"] != null
                    ? this.valueAxisProperties["fontSize"]
                    : MekkoChart.DefaultLabelFontSizeInPt;

                yFontFamily = this.valueAxisProperties
                    && this.valueAxisProperties["fontFamily"] != null
                    ? <string>this.valueAxisProperties["fontFamily"]
                    : "Arial";

                yFontBold = this.valueAxisProperties
                    && this.valueAxisProperties["fontBold"] != null
                    ? <boolean>this.valueAxisProperties["fontBold"]
                    : false;

                yFontItalic = this.valueAxisProperties
                    && this.valueAxisProperties["fontItalic"] != null
                    ? <boolean>this.valueAxisProperties["fontItalic"]
                    : false;

                yFontUnderline = this.valueAxisProperties
                    && this.valueAxisProperties["fontUnderline"] != null
                    ? <boolean>this.valueAxisProperties["fontUnderline"]
                    : false;
            }

            yFontSize = PixelConverter.fromPointToPixel(yFontSize);

            const yAxisOrientation: string = this.yAxisOrientation,
                showY1OnRight: boolean = yAxisOrientation === axisPosition.right;

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

            y1AxisGraphicsElement
                .call(MekkoChart.darkenZeroLine)
                .call(MekkoChart.setAxisLabelColor, yLabelColor)
                .call(MekkoChart.setAxisLabelFontSize, yFontSize)
                .call(MekkoChart.setAxisLabelFontFamily, yFontFamily)
                .call(MekkoChart.setAxisLabelFontStyle, yFontBold, yFontItalic, yFontUnderline);

            if (tickLabelMargins.yLeft >= leftRightMarginLimit) {
                y1AxisGraphicsElement
                    .selectAll("text")
                    .call(AxisHelper.LabelLayoutStrategy.clip,
                        leftRightMarginLimit - MekkoChart.LeftPadding,
                        textMeasurementService.svgEllipsis);
            }

            if (axes.y2
                && (!this.valueAxisProperties
                    || this.valueAxisProperties["secShow"] == null
                    || this.valueAxisProperties["secShow"])) {

                y2LabelColor = this.valueAxisProperties && this.valueAxisProperties["secLabelColor"]
                    ? <Fill>this.valueAxisProperties["secLabelColor"]
                    : null;

                axes.y2.axis
                    .tickPadding(MekkoChart.TickPaddingY);

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
                        .selectAll("text")
                        .call(AxisHelper.LabelLayoutStrategy.clip,
                            leftRightMarginLimit - MekkoChart.RightPadding,
                            textMeasurementService.svgEllipsis);
                }
            }
            else {
                this.y2AxisGraphicsContext
                    .selectAll("*")
                    .remove();
            }
        }
        else {
            this.y1AxisGraphicsContext
                .selectAll("*")
                .remove();

            this.y2AxisGraphicsContext
                .selectAll("*")
                .remove();
        }

        this.translateAxes(viewport);

        // Axis labels
        if (chartHasAxisLabels) {
            const hideXAxisTitle: boolean = !this.shouldRenderAxis(
                axes.x,
                MekkoChart.ShowAxisTitlePropertyName);

            const hideYAxisTitle: boolean = !this.shouldRenderAxis(
                axes.y1,
                MekkoChart.ShowAxisTitlePropertyName);

            const hideY2AxisTitle: boolean = this.valueAxisProperties
                && this.valueAxisProperties[MekkoChart.SecondShowAxisTitlePropertyName] != null
                && this.valueAxisProperties[MekkoChart.SecondShowAxisTitlePropertyName] === false;

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

            this.renderAxesLabels(renderAxisOptions, xFontSize, yFontSize);
        }
        else {
            this.axisGraphicsContext
                .selectAll(MekkoChart.XAxisLabelSelector.selectorName)
                .remove();

            this.axisGraphicsContext
                .selectAll(MekkoChart.XAxisLabelSelector.selectorName)
                .selectAll(MekkoChart.YAxisLabelSelector.selectorName)
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

            let forceDisplay: boolean = (<MekkoChartLabelSettings>(<MekkoColumnChartData>layers[0].getData()).labelSettings).forceDisplay;
            drawDefaultLabelsForDataPointChart(
                resultsLabelDataPoints,
                this.labelGraphicsContextScrollable,
                this.getLabelLayout(forceDisplay),
                this.currentViewport, false, 0, false, !forceDisplay);

            if (this.interactivityService) {
                const behaviorOptions: CustomVisualBehaviorOptions = {
                    layerOptions: layerBehaviorOptions,
                    clearCatcher: this.clearCatcher,
                    dataPoints: dataPoints,
                    behavior: this.behavior,
                };

                this.interactivityService.bind(behaviorOptions);
            }
        }
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
                }
            }
        };
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

    private static setAxisLabelColor(selection: Selection, fill: Fill): void {
        MekkoChart.getTickText(selection)
            .style("fill", fill ? fill.solid.color : null);
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
        scale: d3.ScaleLinear<number, number>,
        borderWidth: number,
        yOffset: number = 0): void {

        MekkoChart.getTicks(selection)
            .attr("transform", (value: number, index: number) => {
                return manipulation.translate(scale(value) + (borderWidth * index), yOffset);
            });
    }
}

export function createLayers(
    type: MekkoChartType,
    objects: powerbi.DataViewObjects,
    interactivityService: IInteractivityService,
    isScrollable: boolean = true): IColumnChart[] {

    const layers: IColumnChart[] = [];

    const cartesianOptions: MekkoChartConstructorBaseOptions = {
        isScrollable,
        interactivityService
    };

    layers.push(createBaseColumnChartLayer(
        MekkoVisualChartType.hundredPercentStackedColumn,
        cartesianOptions));

    return layers;
}


