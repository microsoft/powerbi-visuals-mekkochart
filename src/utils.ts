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
import powerbi from "powerbi-visuals-api";

import NumberRange = powerbi.NumberRange;

import { MekkoChart } from "./visual";

import {
    double as Double
} from "powerbi-visuals-utils-typeutils";

import {
    MekkoChartSeries,
    MekkoChartColumnDataPoint,
    MekkoChartData,
} from "./dataInterfaces";

import {
    axis as AxisHelper
} from "powerbi-visuals-utils-chartutils";

import { HtmlSubSelectableClass, SubSelectableDisplayNameAttribute, SubSelectableObjectNameAttribute, SubSelectableTypeAttribute } from "powerbi-visuals-utils-onobjectutils";
import SubSelectionStylesType = powerbi.visuals.SubSelectionStylesType;

// d3
import { Selection as d3Selection } from "d3-selection";
import { ScaleLinear as d3ScaleLinear } from "d3-scale";
import { max as d3Max, min as d3Min } from "d3-array";
type Selection<T> = d3Selection<any, T, any, any>;
type ScaleLinear = d3ScaleLinear<any, any, never>;

import { MekkoChartObjectNames } from "./settings";

export class MekkoChartUtils {
    static PctRoundingError: number = 0.0001;
    static RectName: string = "rect";
    static DimmedOpacity = 0.4;
    static DefaultOpacity = 1.0;
    static DimmedColor = "#A6A6A6";
    static SelectedStrokeWidth = "5px";
    static DefaultStrokeWidth = "2px";

    static DefaultNumberRange: NumberRange = {
        min: 0,
        max: 10
    };

    static getSize(scale: ScaleLinear, size: number, zeroVal: number = 0): number {
        return AxisHelper.diffScaled(scale, zeroVal, size);
    }
    
    static calcValueDomain(data: MekkoChartSeries[], is100pct: boolean): NumberRange {
        if (data.length === 0) {
            return {
                min: MekkoChartUtils.DefaultNumberRange.min,
                max: MekkoChartUtils.DefaultNumberRange.max
            };
        }
    
        let min: number = d3Min<MekkoChartSeries, number>(
            data,
            (series: MekkoChartSeries) => {
                return d3Min<MekkoChartColumnDataPoint, number>(
                    series.data,
                    (dataPoint: MekkoChartColumnDataPoint) => {
                        return dataPoint.position - dataPoint.valueAbsolute;
                    });
            });
    
        let max: number = d3Max<MekkoChartSeries, number>(
            data,
            (series: MekkoChartSeries) => {
                return d3Max<MekkoChartColumnDataPoint, number>(
                    series.data,
                    (dataPoint: MekkoChartColumnDataPoint) => dataPoint.position);
            });
    
        if (is100pct) {
            min = Double.roundToPrecision(min, MekkoChartUtils.PctRoundingError);
            max = Double.roundToPrecision(max, MekkoChartUtils.PctRoundingError);
        }
    
        return {
            min,
            max
        };
    }
    
    static drawSeries(
        data: MekkoChartData,
        graphicsContext: Selection<any>): Selection<MekkoChartSeries> {
    
        const seriesData: Selection<MekkoChartSeries> = graphicsContext
            .selectAll(MekkoChart.SeriesSelector.selectorName)
            .data(data.series, (series: MekkoChartSeries) => series.key);
    
        const mergedSeries = seriesData
            .enter()
            .append("g")
            .classed(MekkoChart.SeriesSelector.className, true)
            .merge(seriesData);
        mergedSeries
            .style("fill", (series: MekkoChartSeries) => series.color)
            .attr("role", "listbox")
            .attr("aria-selected", false);
        seriesData
            .exit()
            .remove();

        MekkoChartUtils.applyOnObjectStylesToShapes(mergedSeries, data);

        return mergedSeries;
    }

    private static applyOnObjectStylesToShapes(series: Selection<MekkoChartSeries>, data: MekkoChartData): void{
        const seriesCount: number = data.series.length;
        const isMultiSeries: boolean = data.hasDynamicSeries || seriesCount > 1 || !data.categoryMetadata;

        const getDisplayName = (dataPoint: MekkoChartSeries) => {
            const columnName = data.localizationManager.getDisplayName("Visual_Column");
            return `"${dataPoint.displayName}" ${columnName}`;
        }

        series
            .classed(HtmlSubSelectableClass, data.isFormatMode && isMultiSeries)
            .attr(SubSelectableObjectNameAttribute, MekkoChartObjectNames.DataPoint)
            .attr(SubSelectableTypeAttribute, SubSelectionStylesType.Shape)
            .attr(SubSelectableDisplayNameAttribute, getDisplayName);
    }

    static applyInteractivity(columns: Selection<any>, onDragStart): void {
        if (onDragStart) {
            columns
                .attr("draggable", "true")
                .on("dragstart", onDragStart);
        }
    }
    
    static getFillOpacity(
        selected: boolean,
        highlight: boolean,
        hasSelection: boolean,
        hasPartialHighlights: boolean): number {
    
        if ((hasPartialHighlights && !highlight) || (hasSelection && !selected)) {
            return MekkoChartUtils.DimmedOpacity;
        }
    
        return MekkoChartUtils.DefaultOpacity;
    }

    static getStrokeWidth(
        selected: boolean,
        highlight: boolean,
        hasSelection: boolean,
        hasPartialHighlights: boolean): string {

        return ((hasSelection && selected) || (hasPartialHighlights && highlight)) 
            ? MekkoChartUtils.SelectedStrokeWidth
            : MekkoChartUtils.DefaultStrokeWidth;
    }
    
    static getLegendFillOpacity(
        selected: boolean,
        hasSelection: boolean,
        isHighContrastMode: boolean): number {
    
        if ((hasSelection && !selected) && isHighContrastMode) {
            return MekkoChartUtils.DimmedOpacity;
        }
    
        return MekkoChartUtils.DefaultOpacity;
    }
    
    static getLegendFill(
        selected: boolean,
        hasSelection: boolean,
        defaultColor: string,
        isHighContrastMode: boolean): string {
    
        if ((hasSelection && !selected) && !isHighContrastMode) {
            return MekkoChartUtils.DimmedColor;
        }
    
        return defaultColor;
    }
    
    static getAriaLabel(
        toolTipInfo: powerbi.extensibility.VisualTooltipDataItem[]): string {
            let labelval: string = "";
            toolTipInfo.forEach(element => {
                labelval = labelval.concat(element.displayName);
                labelval = labelval.concat(" : ");
                labelval = labelval.concat(element.value);
                labelval = labelval.concat("\n");
            });
            return labelval;
    }
    
    static setChosenColumnOpacity(
        mainGraphicsContext: Selection<any>,
        columnGroupSelector: string,
        selectedColumnIndex: number,
        lastColumnIndex: number): void {
    
        const series: Selection<any> = mainGraphicsContext
            .selectAll(MekkoChart.SeriesSelector.selectorName);
    
        const lastColumnUndefined: boolean = typeof lastColumnIndex === "undefined";
    
        series.selectAll(MekkoChartUtils.RectName + columnGroupSelector)
            .filter((dataPoint: MekkoChartColumnDataPoint) => {
                return (dataPoint.categoryIndex !== selectedColumnIndex)
                    && (lastColumnUndefined || dataPoint.categoryIndex === lastColumnIndex);
            })
            .transition()
            .style("fill-opacity", MekkoChartUtils.DimmedOpacity);
    
        series.selectAll(MekkoChartUtils.RectName + columnGroupSelector)
            .filter((dataPoint: MekkoChartColumnDataPoint) => {
                return dataPoint.categoryIndex === selectedColumnIndex;
            })
            .style("fill-opacity", MekkoChartUtils.DefaultOpacity);
    }
    
    static getClosestColumnIndex(coordinate: number, columnsCenters: number[]): number {
        let currentIndex: number = 0,
            distance: number = Number.MAX_VALUE;
    
        for (let i: number = 0; i < columnsCenters.length; i++) {
            const currentDistance: number = Math.abs(coordinate - columnsCenters[i]);
    
            if (currentDistance < distance) {
                distance = currentDistance;
                currentIndex = i;
            }
        }
    
        return currentIndex;
    }
}