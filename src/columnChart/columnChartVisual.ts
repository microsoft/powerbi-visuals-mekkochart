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
    // powerbi.extensibility.utils.chart
    import LegendData = powerbi.extensibility.utils.chart.legend.LegendData;
    import IAxisProperties = powerbi.extensibility.utils.chart.axis.IAxisProperties;

    /**
 * Renders a stacked and clustered column chart.
 */
    export interface IColumnChart /*extends ICartesianVisual*/ {
        getColumnsWidth(): number[];
        getBorderWidth(): number;

        init(options: MekkoChartVisualInitOptions): void;
        setData(dataViews: DataView[], resized?: boolean): void;
        calculateAxesProperties(options: MekkoCalculateScaleAndDomainOptions): IAxisProperties[];
        overrideXScale(xProperties: IAxisProperties): void;
        render(suppressAnimations: boolean): MekkoVisualRenderResult;
        calculateLegend(): LegendData;
        hasLegend(): boolean;
        onClearSelection(): void;
        enumerateObjectInstances?(
            instances: VisualObjectInstance[],
            options: EnumerateVisualObjectInstancesOptions): void;
        getVisualCategoryAxisIsScalar?(): boolean;
        getSupportedCategoryAxisType?(): string;
        getPreferredPlotArea?(
            isScalar: boolean,
            categoryCount: number,
            categoryThickness: number): IViewport;
        setFilteredData?(startIndex: number, endIndex: number): MekkoChartBaseData;
    }
}
