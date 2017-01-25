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

module powerbi.extensibility.visual.utils {
    // d3
    import Selection = d3.Selection;
    import LinearScale = d3.scale.Linear;
    import UpdateSelection = d3.selection.Update;

    // powerbi.extensibility.utils.chart
    import AxisHelper = powerbi.extensibility.utils.chart.axis;

    // powerbi.extensibility.utils.type
    import Double = powerbi.extensibility.utils.type.Double;

    // powerbi.extensibility.utils.type
    import Prototype = powerbi.extensibility.utils.type.Prototype;

    var PctRoundingError = 0.0001;
    var rectName = 'rect';

    export var DimmedOpacity = 0.4;
    export var DefaultOpacity = 1.0;

    export function getSize(scale: LinearScale<any, any>, size: number, zeroVal: number = 0): number {
        return AxisHelper.diffScaled(scale, zeroVal, size);
    }

    export function calcValueDomain(data: MekkoChartSeries[], is100pct: boolean): NumberRange {
        var defaultNumberRange = {
            min: 0,
            max: 10
        };

        if (data.length === 0)
            return defaultNumberRange;

        // Can't use AxisHelper because Stacked layout has a slightly different calc, (position - valueAbs)
        var min = d3.min<MekkoChartSeries, number>(data, d => {
            return d3.min<MekkoChartColumnDataPoint, number>(d.data, e => e.position - e.valueAbsolute);
        });

        var max = d3.max<MekkoChartSeries, number>(data, d => {
            return d3.max<MekkoChartColumnDataPoint, number>(d.data, e => e.position);
        });

        if (is100pct) {
            min = Double.roundToPrecision(min, PctRoundingError);
            max = Double.roundToPrecision(max, PctRoundingError);
        }

        return {
            min: min,
            max: max,
        };
    }

    export function drawSeries(
        data: MekkoChartData,
        graphicsContext: Selection<any>,
        axisOptions: MekkoChartAxisOptions): UpdateSelection<any> {

        var colGroupSelection = graphicsContext.selectAll(MekkoChart.Classes["series"].selector);
        var series = colGroupSelection.data(data.series, (d: MekkoChartSeries) => d.key);

        series
            .enter()
            .append('g')
            .classed(MekkoChart.Classes["series"].class, true);

        series
            .style({
                fill: (d: MekkoChartSeries) => d.color,
            });

        series
            .exit()
            .remove();

        return series;
    }

    export function applyInteractivity(columns: Selection<any>, onDragStart): void {
        if (onDragStart) {
            columns
                .attr('draggable', 'true')
                .on('dragstart', onDragStart);
        }
    }

    export function getFillOpacity(selected: boolean, highlight: boolean, hasSelection: boolean, hasPartialHighlights: boolean): number {
        if ((hasPartialHighlights && !highlight) || (hasSelection && !selected))
            return DimmedOpacity;
        return DefaultOpacity;
    }

    export function setChosenColumnOpacity(
        mainGraphicsContext: Selection<any>,
        columnGroupSelector: string,
        selectedColumnIndex: number,
        lastColumnIndex: number): void {

        var series = mainGraphicsContext.selectAll(MekkoChart.Classes["series"].selector);
        var lastColumnUndefined = typeof lastColumnIndex === 'undefined';
        // find all columns that do not belong to the selected column and set a dimmed opacity with a smooth animation to those columns
        series.selectAll(rectName + columnGroupSelector).filter((d: MekkoChartColumnDataPoint) => {
            return (d.categoryIndex !== selectedColumnIndex) && (lastColumnUndefined || d.categoryIndex === lastColumnIndex);
        }).transition().style('fill-opacity', DimmedOpacity);

        // set the default opacity for the selected column
        series.selectAll(rectName + columnGroupSelector).filter((d: MekkoChartColumnDataPoint) => {
            return d.categoryIndex === selectedColumnIndex;
        }).style('fill-opacity', DefaultOpacity);
    }

    export function getClosestColumnIndex(coordinate: number, columnsCenters: number[]): number {
        var currentIndex = 0;
        var distance: number = Number.MAX_VALUE;
        for (var i = 0, ilen = columnsCenters.length; i < ilen; i++) {
            var currentDistance = Math.abs(coordinate - columnsCenters[i]);
            if (currentDistance < distance) {
                distance = currentDistance;
                currentIndex = i;
            }
        }

        return currentIndex;
    }

    export function applyUserMinMax(isScalar: boolean, dataView: DataViewCategorical, xAxisCardProperties: DataViewObject): DataViewCategorical {
        if (isScalar) {
            var min = xAxisCardProperties['start'];
            var max = xAxisCardProperties['end'];

            return transformDomain(dataView, min, max);
        }

        return dataView;
    }

    export function transformDomain(dataView: DataViewCategorical, min: DataViewPropertyValue, max: DataViewPropertyValue): DataViewCategorical {
        if (!dataView.categories || !dataView.values || dataView.categories.length === 0 || dataView.values.length === 0)
            return dataView;// no need to do something when there are no categories

        if (typeof min !== "number" && typeof max !== "number")
            return dataView;//user did not set min max, nothing to do here

        var category = dataView.categories[0];//at the moment we only support one category
        var categoryType = category ? category.source.type : null;

        // Min/Max comparison won't work if category source is Ordinal
        if (AxisHelper.isOrdinal(categoryType))
            return;

        var categoryValues = category.values;
        var categoryObjects = category.objects;

        if (!categoryValues || !categoryObjects)
            return dataView;
        var newcategoryValues = [];
        var newValues = [];
        var newObjects = [];

        //get new min max
        if (typeof min !== "number") {
            min = categoryValues[0];
        }
        if (typeof max !== "number") {
            max = categoryValues[categoryValues.length - 1];
        }

        //don't allow this
        if (min > max)
            return dataView;

        //build measure array
        for (var j = 0, len = dataView.values.length; j < len; j++) {
            newValues.push([]);
        }

        for (var t = 0, len = categoryValues.length; t < len; t++) {
            if (categoryValues[t] >= min && categoryValues[t] <= max) {
                newcategoryValues.push(categoryValues[t]);
                if (categoryObjects) {
                    newObjects.push(categoryObjects[t]);
                }

                //on each measure set the new range
                if (dataView.values) {
                    for (var k = 0; k < dataView.values.length; k++) {
                        newValues[k].push(dataView.values[k].values[t]);
                    }
                }
            }
        }

        //don't write directly to dataview
        var resultDataView = Prototype.inherit(dataView);
        var resultDataViewValues = resultDataView.values = Prototype.inherit(resultDataView.values);
        var resultDataViewCategories = resultDataView.categories = Prototype.inherit(dataView.categories);
        var resultDataViewCategories0 = resultDataView.categories[0] = Prototype.inherit(resultDataViewCategories[0]);

        resultDataViewCategories0.values = newcategoryValues;
        //only if we had objects, then you set the new objects
        if (resultDataViewCategories0.objects) {
            resultDataViewCategories0.objects = newObjects;
        }

        //update measure array
        for (var t = 0, len = dataView.values.length; t < len; t++) {
            var measureArray = resultDataViewValues[t] = Prototype.inherit(resultDataViewValues[t]);
            measureArray.values = newValues[t];
        }

        return resultDataView;
    }

}
