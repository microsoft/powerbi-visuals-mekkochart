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
    import CreateAxisOptionsBase = powerbi.extensibility.utils.chart.axis.CreateAxisOptions;
    import IInteractivityService = powerbi.extensibility.utils.interactivity.IInteractivityService;
    import LabelEnabledDataPoint = powerbi.extensibility.utils.chart.dataLabel.LabelEnabledDataPoint;
    import VisualDataLabelsSettings = powerbi.extensibility.utils.chart.dataLabel.VisualDataLabelsSettings;
    import ILegend = powerbi.extensibility.utils.chart.legend.ILegend;

    // powerbi.extensibility.utils.interactivity
    import SelectableDataPoint = powerbi.extensibility.utils.interactivity.SelectableDataPoint;

    // powerbi.extensibility.utils.tooltip
    import TooltipEnabledDataPoint = powerbi.extensibility.utils.tooltip.TooltipEnabledDataPoint;

    // powerbi.extensibility.utils.formatting
    import IValueFormatter = powerbi.extensibility.utils.formatting.IValueFormatter;

    import VisualDataLabelsSettingsOptions = powerbi.extensibility.utils.chart.dataLabel.VisualDataLabelsSettingsOptions;
    import DataLabelObject = powerbi.extensibility.utils.chart.dataLabel.DataLabelObject;

    export interface ValueMultiplers {
        pos: number;
        neg: number;
    }

    export interface LegendSeriesInfo {
        legend: ILegendData;
        seriesSources: DataViewMetadataColumn[];
        seriesObjects: IDataViewObjects[][];
    }

    export interface IGrouppedLegendData {
        category: string;
        index: number;
        data: any[];
        dataValues: number;
    }

    export interface ILegendGroup extends ILegend {
        element: HTMLElement;
        position: number;
    }

    export interface IMekkoChartVisualHost {
        updateLegend(data: ILegendData): void;
        getSharedColors(): IColorPalette;
        triggerRender(suppressAnimations: boolean): void;
    }

    export interface MekkoChartAnimationOptions {
        viewModel: MekkoChartData;
        series: UpdateSelection<any>;
        layout: IMekkoChartLayout;
        itemCS: ClassAndSelector;
        mainGraphicsContext: Selection<any>;
        viewPort: IViewport;
    }

    export interface MekkoChartAnimationResult {
        shapes: UpdateSelection<any>;
    }

    export interface MekkoChartAxisOptions {
        xScale: LinearScale<any, any>;
        yScale: LinearScale<any, any>;
        seriesOffsetScale?: LinearScale<any, any>;
        columnWidth: number;
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
        value: number;
        position: number;
        valueAbsolute: number;
        valueOriginal: number;
        seriesIndex: number;
        labelSettings: VisualDataLabelsSettings;
        categoryIndex: number;
        color: string;
        originalValue: number;
        originalPosition: number;
        originalValueAbsolute: number;
        originalValueAbsoluteByAlLData?: number;
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

    export interface MekkoChartLabelSettingsOptions extends VisualDataLabelsSettingsOptions {
        forceDisplay: boolean;
    }

    export interface MekkoChartLabelSettings extends VisualDataLabelsSettings {
        forceDisplay: boolean;
    }

    export interface MekkoChartDataLabelObject extends DataLabelObject {
        forceDisplay: boolean;
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

    export interface MekkoChartVisualInitOptions extends VisualConstructorOptions {
        svg: Selection<any>;
        cartesianHost: IMekkoChartVisualHost;
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
        sortSeries: MekkoSeriesSortSettings;
        sortlegend: MekkoLegendSortSettings;
        xAxisLabelsSettings: MekkoXAxisLabelsSettings;
        categoriesWidth: number[];
        categoryProperties: MekkoCategoryProperties[];
        dataPointSettings: MekkoDataPointSettings;
    }

    export interface MekkoBorderSettings {
        show: boolean;
        color: string;
        width: number;
        maxWidth?: number;
    }

    export interface MekkoLegendSortSettings {
        enabled: boolean;
        groupByCategory: boolean;
        direction: any;
        groupByCategoryDirection: any;
    }

    export interface MekkoDataPointSettings {
        categoryGradient: boolean;
        colorGradientEndColor: any;
        colorDistribution: boolean;
    }

    export interface MekkoSeriesSortSettings {
        enabled: boolean;
        direction: any;
        displayPercents: any;
    }

    export interface MekkoXAxisLabelsSettings {
        enableRotataion: boolean;
    }

    export interface MekkoCategoryColorSettings {
        color: string;
    }

    export interface CreateAxisOptions extends CreateAxisOptionsBase {
        borderSettings: MekkoBorderSettings;
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

    export interface MekkoCategoryProperties {
        color?: string;
        identity?: ISelectionId;
        name?: string;
        valueAbsolute?: any;
        series?: MekkoChartSeries;
    }

    export interface MekkoDataPoints {
        categoriesWidth: number[];
        series: MekkoChartSeries[];
        hasHighlights: boolean;
        hasDynamicSeries: boolean;
        categoryProperties?: MekkoCategoryProperties[];
    }

    export interface MekkoLegendDataPoint extends LegendDataPoint {
        fontSize?: number;
        valueSum?: number;
        categoryValues?: PrimitiveValue[];
    }

    export interface MekkoCreateAxisOptions extends CreateAxisOptionsBase {
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
        unclippedGraphicsContext: Selection<any>;
        mainGraphicsContext: Selection<any>;
        layout: MekkoChartCategoryLayout;
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
        isLabelInteractivityEnabled?: boolean;
        tooltipsEnabled?: boolean;
        tooltipBucketEnabled?: boolean;
        cartesianLoadMoreEnabled?: boolean;
    }

    export interface MekkoChartConstructorOptions extends MekkoChartConstructorBaseOptions {
        chartType: MekkoVisualChartType;
    }

    export interface MekkoChartDrawInfo {
        eventGroup?: Selection<any>;
        shapesSelection: Selection<TooltipEnabledDataPoint>;
        viewport: IViewport;
        axisOptions: MekkoChartAxisOptions;
        labelDataPoints: LabelDataPoint[];
    }

    export interface BaseColorIdentity {
        identity: DataViewScopeIdentity;
        category: string;
        color: string;
        group: DataViewValueColumnGroup;
    }

    export interface ICategotyValuesStatsCollection {
        [propName: number]: ICategotyValuesStats;
    }

    export interface ICategotyValuesStats {
        category: PrimitiveValue;
        maxValueOfCategory: number;
        maxItemOfCategory: number;
        minValueOfCategory: number;
    }

    export interface IFilteredValueGroups {
        gr: DataViewValueColumnGroup;
        categoryValue: PrimitiveValue;
        categoryIndex: number;
        category: PrimitiveValue;
        identity: DataViewScopeIdentity;
    }

    export class ICategoryValuesCollection extends Array<MekkoChartColumnDataPoint> {
        [index: number]: MekkoChartColumnDataPoint;
        categoryValue?: PrimitiveValue;
        identity?: powerbi.extensibility.ISelectionId;
        color?: string;
    }
}
