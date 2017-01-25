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

module powerbi.extensibility.visual.axis.utils {
    // powerbi.extensibility.utils.svg
    import IMargin = powerbi.extensibility.utils.svg.IMargin;

    // powerbi.extensibility.utils.chart
    import AxisHelper = powerbi.extensibility.utils.chart.axis;
    import axisScale = AxisHelper.scale;

    // powerbi.extensibility.utils.formatting
    import valueFormatter = powerbi.extensibility.utils.formatting.valueFormatter;

    /**
     * Returns a boolean, that indicates if y axis title should be displayed.
     * @return True if y axis title should be displayed,
     * otherwise false.
     */
    export function shouldShowYAxisLabel(
        layerNumber: number,
        valueAxisProperties: DataViewObject,
        yAxisWillMerge: boolean): boolean {

        return (layerNumber === 0
            && !!valueAxisProperties
            && !!valueAxisProperties['showAxisTitle'])
            || (layerNumber === 1
                && !yAxisWillMerge
                && !!valueAxisProperties
                && !!valueAxisProperties['secShowAxisTitle']);
    }

    /**
     * Computes the Cartesian Chart axes from the set of layers.
     */
    export function calculateAxes(
        layers: columnChart.IColumnChart[],
        viewport: IViewport,
        margin: IMargin,
        categoryAxisProperties: DataViewObject,
        valueAxisProperties: DataViewObject,
        scrollbarVisible: boolean,
        existingAxisProperties: MekkoChartAxisProperties): MekkoChartAxisProperties {

        var visualOptions: MekkoCalculateScaleAndDomainOptions = {
            viewport: viewport,
            margin: margin,
            forcedXDomain: [
                categoryAxisProperties
                    ? categoryAxisProperties['start']
                    : null,
                categoryAxisProperties
                    ? categoryAxisProperties['end']
                    : null
            ],
            forceMerge: valueAxisProperties && valueAxisProperties['secShow'] === false,
            showCategoryAxisLabel: false,
            showValueAxisLabel: false,
            categoryAxisScaleType: categoryAxisProperties && categoryAxisProperties['axisScale'] != null
                ? <string>categoryAxisProperties['axisScale']
                : axisScale.linear,
            valueAxisScaleType: valueAxisProperties && valueAxisProperties['axisScale'] != null
                ? <string>valueAxisProperties['axisScale']
                : axisScale.linear,
            trimOrdinalDataOnOverflow: false
        };

        var yAxisWillMerge = false;

        if (valueAxisProperties) {
            visualOptions.forcedYDomain = AxisHelper.applyCustomizedDomain(
                [
                    valueAxisProperties['start'],
                    valueAxisProperties['end']
                ],
                visualOptions.forcedYDomain);
        }

        var result: MekkoChartAxisProperties;
        for (var layerNumber: number = 0, len: number = layers.length; layerNumber < len; layerNumber++) {
            var currentlayer = layers[layerNumber];
            visualOptions.showCategoryAxisLabel = (!!categoryAxisProperties && !!categoryAxisProperties['showAxisTitle']);//here
            //visualOptions.showBorder = (!!categoryAxisProperties && !!categoryAxisProperties['showBorder']);//here
            visualOptions.showValueAxisLabel = shouldShowYAxisLabel(layerNumber, valueAxisProperties, yAxisWillMerge);

            var axes = currentlayer.calculateAxesProperties(visualOptions);

            if (layerNumber === 0) {
                result = {
                    x: axes[0],
                    y1: axes[1]
                };
            }

            result.x.willLabelsFit = false;
            result.x.willLabelsWordBreak = false;
        }

        return result;
    }

    export function createAxesLabels(categoryAxisProperties: DataViewObject,
        valueAxisProperties: DataViewObject,
        category: DataViewMetadataColumn,
        values: DataViewMetadataColumn[]) {
        let xAxisLabel = null;
        let yAxisLabel = null;

        if (categoryAxisProperties) {

            // Take the value only if it's there
            if (category && category.displayName) {
                xAxisLabel = category.displayName;
            }
        }

        if (valueAxisProperties) {
            let valuesNames: string[] = [];

            if (values) {
                // Take the name from the values, and make it unique because there are sometimes duplications
                valuesNames = values
                    .map(v => v ? v.displayName : '')
                    .filter((value, index, self) => value !== '' && self.indexOf(value) === index);

                yAxisLabel = valueFormatter.formatListAnd(valuesNames);
            }
        }
        return { xAxisLabel: xAxisLabel, yAxisLabel: yAxisLabel };
    }
}
