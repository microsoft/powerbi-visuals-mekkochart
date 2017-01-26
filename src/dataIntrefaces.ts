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
    // d3
    import Selection = d3.Selection;
    import LinearScale = d3.scale.Linear;
    import UpdateSelection = d3.selection.Update;

    // powerbi
    import IDataViewObjects = powerbi.DataViewObjects;

    // powerbi.visuals
    import ISelectionId = powerbi.visuals.ISelectionId;

    // powerbi.extensibility.utils.svg
    import IRect = powerbi.extensibility.utils.svg.IRect;
    import IMargin = powerbi.extensibility.utils.svg.IMargin;
    import ISize = powerbi.extensibility.utils.svg.shapes.ISize;
    import ClassAndSelector = powerbi.extensibility.utils.svg.CssConstants.ClassAndSelector;

    // powerbi.extensibility.utils.chart
    import ILegendData = powerbi.extensibility.utils.chart.legend.LegendData;
    import IAxisProperties = powerbi.extensibility.utils.chart.axis.IAxisProperties;
    import LegendDataPoint = powerbi.extensibility.utils.chart.legend.LegendDataPoint;
    import CreateAxisOptions = powerbi.extensibility.utils.chart.axis.CreateAxisOptions;
    import IInteractivityService = powerbi.extensibility.utils.interactivity.IInteractivityService;
    import LabelEnabledDataPoint = powerbi.extensibility.utils.chart.dataLabel.LabelEnabledDataPoint;
    import VisualDataLabelsSettings = powerbi.extensibility.utils.chart.dataLabel.VisualDataLabelsSettings;

    // powerbi.extensibility.utils.interactivity
    import SelectableDataPoint = powerbi.extensibility.utils.interactivity.SelectableDataPoint;

    // powerbi.extensibility.utils.tooltip
    import TooltipEnabledDataPoint = powerbi.extensibility.utils.tooltip.TooltipEnabledDataPoint;

    // powerbi.extensibility.utils.formatting
    import IValueFormatter = powerbi.extensibility.utils.formatting.IValueFormatter;

    export interface ValueMultiplers {
        pos: number;
        neg: number;
    }

    export interface LegendSeriesInfo {
        legend: ILegendData;
        seriesSources: DataViewMetadataColumn[];
        seriesObjects: IDataViewObjects[][];
    }

    export interface IMekkoChartVisualHost {
        updateLegend(data: ILegendData): void;
        getSharedColors(): IColorPalette;
        triggerRender(suppressAnimations: boolean): void;
    }

    export interface MekkoChartAnimationOptions /*extends IAnimationOptions*/ {
        viewModel: MekkoChartData;
        series: UpdateSelection<any>;
        layout: IMekkoChartLayout;
        itemCS: ClassAndSelector;
        mainGraphicsContext: Selection<any>;
        viewPort: IViewport;
    }

    export interface MekkoChartAnimationResult /*extends IAnimationResult*/ {
        shapes: UpdateSelection<any>;
    }

    // export type IMekkoChartAnimator = IAnimator<IAnimatorOptions, MekkoChartAnimationOptions, MekkoChartAnimationResult>;

    export interface IMekkoChartAnimator { }

    export interface MekkoChartAxisOptions {
        xScale: LinearScale<any, any>;
        yScale: LinearScale<any, any>;
        seriesOffsetScale?: LinearScale<any, any>;
        columnWidth: number;
        /** Used by clustered only since categoryWidth !== columnWidth */
        categoryWidth?: number;
        isScalar: boolean;
        margin: IMargin;
    }

    export interface MekkoChartDataPoint {
        categoryValue: any;
        value: number;
        categoryIndex: number;
        seriesIndex: number;
        highlight?: boolean;
    }

    export interface MekkoChartBaseSeries {
        data: MekkoChartDataPoint[];
    }

    export interface MekkoChartBaseData {
        series: MekkoChartBaseSeries[];
        categoryMetadata: DataViewMetadataColumn;
        categories: any[];
        hasHighlights?: boolean;
    }

    export interface MekkoChartAxesLabels {
        x: string;
        y: string;
        y2?: string;
    }

    export interface MekkoChartAxisProperties {
        x: IAxisProperties;
        y1: IAxisProperties;
        y2?: IAxisProperties;
    }

    export interface MekkoChartCategoryLayoutOptions {
        availableWidth: number;
        categoryCount: number;
        domain: any;
        trimOrdinalDataOnOverflow: boolean;
        isScalar?: boolean;
        isScrollable?: boolean;
    }

    export interface MekkoChartColumnDataPoint extends
        MekkoChartDataPoint,
        SelectableDataPoint,
        TooltipEnabledDataPoint,
        LabelEnabledDataPoint {

        categoryValue: number;
        /** Adjusted for 100% stacked if applicable */
        value: number;
        /** The top (column) or right (bar) of the rectangle, used for positioning stacked rectangles */
        position: number;
        valueAbsolute: number;
        /** Not adjusted for 100% stacked */
        valueOriginal: number;
        seriesIndex: number;
        labelSettings: VisualDataLabelsSettings;
        categoryIndex: number;
        color: string;
        /** The original values from the highlighted rect, used in animations */
        originalValue: number;
        originalPosition: number;
        originalValueAbsolute: number;

        /**
         * True if this data point is a highlighted portion and overflows (whether due to the highlight
         * being greater than original or of a different sign), so it needs to be thinner to accomodate.
         */
        drawThinner?: boolean;
        key: string;
        lastSeries?: boolean;
        chartType: MekkoVisualChartType;
    }

    export interface MekkoChartSeries extends MekkoChartBaseSeries {
        displayName: string;
        key: string;
        index: number;
        data: MekkoChartColumnDataPoint[];
        identity: ISelectionId;
        color: string;
        labelSettings: VisualDataLabelsSettings;
    }

    export interface MekkoChartData extends MekkoChartBaseData {
        categoryFormatter: IValueFormatter;
        series: MekkoChartSeries[];
        valuesMetadata: DataViewMetadataColumn[];
        legendData: ILegendData;
        hasHighlights: boolean;
        categoryMetadata: DataViewMetadataColumn;
        scalarCategoryAxis: boolean;
        labelSettings: VisualDataLabelsSettings;
        axesLabels: MekkoChartAxesLabels;
        hasDynamicSeries: boolean;
        isMultiMeasure: boolean;
        defaultDataPointColor?: string;
        showAllDataPoints?: boolean;
    }

    export interface MekkoChartSmallViewPortProperties {
        hideLegendOnSmallViewPort: boolean;
        hideAxesOnSmallViewPort: boolean;
        MinHeightLegendVisible: number;
        MinHeightAxesVisible: number;
    }

    export interface LabelDataPoint {
        parentRect: IRect;
        size?: ISize;
        text: string;
        fillColor: string;
    }

    export interface MekkoChartVisualInitOptions extends VisualConstructorOptions/*extends VisualInitOptions*/ {
        svg: Selection<any>;
        cartesianHost: IMekkoChartVisualHost;
        labelsContext?: Selection<any>; //TEMPORARY - for PlayAxis
    }

    export interface IMekkoChartLayout {
        shapeLayout: {
            width: (d: MekkoChartColumnDataPoint) => number;
            x: (d: MekkoChartColumnDataPoint) => number;
            y: (d: MekkoChartColumnDataPoint) => number;
            height: (d: MekkoChartColumnDataPoint) => number;
        };
        shapeLayoutWithoutHighlights: {
            width: (d: MekkoChartColumnDataPoint) => number;
            x: (d: MekkoChartColumnDataPoint) => number;
            y: (d: MekkoChartColumnDataPoint) => number;
            height: (d: MekkoChartColumnDataPoint) => number;
        };
        zeroShapeLayout: {
            width: (d: MekkoChartColumnDataPoint) => number;
            x: (d: MekkoChartColumnDataPoint) => number;
            y: (d: MekkoChartColumnDataPoint) => number;
            height: (d: MekkoChartColumnDataPoint) => number;
        };
    }

    export interface MekkoVisualRenderResult {
        dataPoints: SelectableDataPoint[];
        behaviorOptions: any;
        labelDataPoints: LabelDataPoint[];
        labelsAreNumeric: boolean;
    }

    export interface MekkoCalculateScaleAndDomainOptions {
        viewport: IViewport;
        margin: IMargin;
        showCategoryAxisLabel: boolean;
        showValueAxisLabel: boolean;
        forceMerge: boolean;
        categoryAxisScaleType: string;
        valueAxisScaleType: string;
        trimOrdinalDataOnOverflow: boolean;
        // optional
        playAxisControlLayout?: IRect;
        forcedTickCount?: number;
        forcedYDomain?: any[];
        forcedXDomain?: any[];
        ensureXDomain?: NumberRange;
        ensureYDomain?: NumberRange;
        categoryAxisDisplayUnits?: number;
        categoryAxisPrecision?: number;
        valueAxisDisplayUnits?: number;
        valueAxisPrecision?: number;
    }

    export interface MekkoColumnChartData extends MekkoChartData {
        borderSettings: MekkoBorderSettings;
        categoriesWidth: number[];
    }

    export interface MekkoBorderSettings {
        show: boolean;
        color: any;
        width: number;
        maxWidth?: number;
    }

    export interface MekkoLabelSettings {
        maxPrecision: number;
        minPrecision: number;
    }

    export interface MekkoColumnAxisOptions extends MekkoChartAxisOptions { }

    export interface IMekkoColumnLayout extends IMekkoChartLayout {
        shapeBorder?: {
            width: (d: MekkoChartColumnDataPoint) => number;
            x: (d: MekkoChartColumnDataPoint) => number;
            y: (d: MekkoChartColumnDataPoint) => number;
            height: (d: MekkoChartColumnDataPoint) => number;
        };
        shapeXAxis?: {
            width: (d: MekkoChartColumnDataPoint) => number;
            x: (d: MekkoChartColumnDataPoint) => number;
            y: (d: MekkoChartColumnDataPoint) => number;
            height: (d: MekkoChartColumnDataPoint) => number;
        };
    }

    export interface MekkoAxisRenderingOptions {
        axisLabels: MekkoChartAxesLabels;
        legendMargin: number;
        viewport: IViewport;
        margin: IMargin;
        hideXAxisTitle: boolean;
        hideYAxisTitle: boolean;
        hideY2AxisTitle?: boolean;
        xLabelColor?: Fill;
        yLabelColor?: Fill;
        y2LabelColor?: Fill;
    }

    export interface MekkoDataPoints {
        categoriesWidth: number[];
        series: MekkoChartSeries[];
        hasHighlights: boolean;
        hasDynamicSeries: boolean;
    }

    export interface MekkoLegendDataPoint extends LegendDataPoint {
        fontSize?: number;
    }


    export interface MekkoCreateAxisOptions extends CreateAxisOptions {
        formatString: string;
        is100Pct?: boolean;
        shouldClamp?: boolean;
        formatStringProp?: DataViewObjectPropertyIdentifier;
    }

    export interface MekkoChartCategoryLayout {
        categoryCount: number;
        categoryThickness: number;
        outerPaddingRatio: number;
        isScalar?: boolean;
    }

    export interface MekkoChartContext {
        height: number;
        width: number;
        duration: number;
        hostService: IVisualHost;
        margin: IMargin;
        /** A group for graphics can be placed that won't be clipped to the data area of the chart. */
        unclippedGraphicsContext: Selection<any>;
        /** A SVG for graphics that should be clipped to the data area, e.g. data bars, columns, lines */
        mainGraphicsContext: Selection<any>;
        layout: MekkoChartCategoryLayout;
        animator: IMekkoChartAnimator;
        onDragStart?: (datum: MekkoChartColumnDataPoint) => void;
        interactivityService: IInteractivityService;
        viewportHeight: number;
        viewportWidth: number;
        is100Pct: boolean;
        isComboChart: boolean;
    }

    export interface MekkoColumnChartContext extends MekkoChartContext {
        height: number;
        width: number;
        duration: number;
        margin: IMargin;
        mainGraphicsContext: Selection<any>;
        labelGraphicsContext: Selection<any>;
        layout: MekkoChartCategoryLayout;
        animator: IMekkoChartAnimator;
        onDragStart?: (datum: MekkoChartColumnDataPoint) => void;
        interactivityService: IInteractivityService;
        viewportHeight: number;
        viewportWidth: number;
        is100Pct: boolean;
        hostService: IVisualHost;
        isComboChart: boolean;
    }

    export interface MekkoChartConstructorBaseOptions {
        isScrollable: boolean;
        interactivityService?: IInteractivityService;
        animator?: /*IGenericAnimator;*/any; // TODO: check it
        isLabelInteractivityEnabled?: boolean;
        tooltipsEnabled?: boolean;
        tooltipBucketEnabled?: boolean;
        cartesianLoadMoreEnabled?: boolean;
    }

    export interface MekkoChartConstructorOptions extends MekkoChartConstructorBaseOptions {
        chartType: MekkoVisualChartType;
        animator: IMekkoChartAnimator;
    }

    export interface MekkoChartDrawInfo {
        eventGroup?: Selection<any>;
        shapesSelection: Selection<TooltipEnabledDataPoint>;
        viewport: IViewport;
        axisOptions: MekkoChartAxisOptions;
        labelDataPoints: LabelDataPoint[];
    }

}
