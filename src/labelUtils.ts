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

import IViewport = powerbi.IViewport;
import {
    wordBreaker,
    interfaces as formattingInterfaces
} from "powerbi-visuals-utils-formattingutils";

import {
    MekkoChartAxisProperties
} from "./dataInterfaces";

import {
    axis as AxisHelper,
    axisInterfaces
} from "powerbi-visuals-utils-chartutils";

// powerbi.extensibility.utils.formatting
import TextProperties = formattingInterfaces.TextProperties;
import ITextAsSVGMeasurer = formattingInterfaces.ITextAsSVGMeasurer;

// powerbi.extensibility.utils.chart
import IAxisProperties = axisInterfaces.IAxisProperties;

// Define TickLabelMargins interface locally since it's no longer exported from chartutils
export interface TickLabelMargins {
    xMax: number;
    yLeft: number;
    yRight: number;
}

const XLabelMaxAllowedOverflow: number = 35;
const OffsetDelimiter: number = 2;
const WidthDelimiter: number = 2;
const DefaultOverflow: number = 0;
const HeightFactor: number = 1.4;
const HeightOffset: number = 15;

export function getTickLabelMargins(
    viewport: IViewport,
    yMarginLimit: number,
    textWidthMeasurer: ITextAsSVGMeasurer,
    textHeightMeasurer: ITextAsSVGMeasurer,
    axes: MekkoChartAxisProperties,
    bottomMarginLimit: number,
    xAxisTextProperties: TextProperties,
    y1AxisTextProperties: TextProperties,
    enableOverflowCheck: boolean,
    scrollbarVisible?: boolean,
    showOnRight?: boolean,
    renderXAxis?: boolean,
    renderY1Axis?: boolean): TickLabelMargins {

    const xAxisProperties: IAxisProperties = axes.x,
        y1AxisProperties: IAxisProperties = axes.y1,
        xLabels: any[] = xAxisProperties.values,
        y1Labels: any[] = y1AxisProperties.values;

    let leftOverflow: number = 0,
        rightOverflow: number = 0,
        maxWidthY1: number = 0,
        xMax: number = 0; // bottom margin

    const ordinalLabelOffset: number = xAxisProperties.categoryThickness
        ? xAxisProperties.categoryThickness / OffsetDelimiter
        : 0;

    const scaleIsOrdinal: boolean = AxisHelper.isOrdinalScale(xAxisProperties.scale);

    let xLabelOuterPadding: number = 0;

    if (xAxisProperties.outerPadding !== undefined) {
        xLabelOuterPadding = xAxisProperties.outerPadding;
    }
    else if (xAxisProperties.xLabelMaxWidth !== undefined) {
        xLabelOuterPadding = Math.max(
            0,
            (viewport.width - xAxisProperties.xLabelMaxWidth * xLabels.length) / OffsetDelimiter);
    }

    if (<number>AxisHelper.getRecommendedNumberOfTicksForXAxis(viewport.width) !== 0
        || <number>AxisHelper.getRecommendedNumberOfTicksForYAxis(viewport.height) !== 0) {

        const rotation: any = scrollbarVisible
            ? AxisHelper.LabelLayoutStrategy.DefaultRotationWithScrollbar
            : AxisHelper.LabelLayoutStrategy.DefaultRotation;

        if (renderY1Axis) {
            for (let i: number = 0; i < y1Labels.length; i++) {
                y1AxisTextProperties.text = y1Labels[i];

                maxWidthY1 = Math.max(
                    maxWidthY1,
                    textWidthMeasurer(y1AxisTextProperties));
            }
        }

        const textHeight: number = textHeightMeasurer(xAxisTextProperties),
            maxNumLines: number = Math.floor(bottomMarginLimit / textHeight),
            xScale: any = xAxisProperties.scale,
            xDomain: any = xScale.domain();

        if (renderXAxis && xLabels.length > 0) {
            for (let i: number = 0, len = xLabels.length; i < len; i++) {
                let height: number;

                xAxisTextProperties.text = xLabels[i];

                let width: number = textWidthMeasurer(xAxisTextProperties);

                if (xAxisProperties.willLabelsWordBreak) {
                    // Split label and count rows
                    const wordBreaks: string[] = wordBreaker.splitByWidth(
                        xAxisTextProperties.text,
                        xAxisTextProperties,
                        textWidthMeasurer,
                        xAxisProperties.xLabelMaxWidth,
                        maxNumLines);

                    height = wordBreaks.length * textHeight;
                    width = xAxisProperties.xLabelMaxWidth;
                }
                else if (!xAxisProperties.willLabelsFit && scaleIsOrdinal) {
                    height = width * rotation.sine;
                    width = width * rotation.cosine;
                }
                else {
                    height = textHeight;
                }

                if (i === 0) {
                    if (scaleIsOrdinal) {
                        if (!xAxisProperties.willLabelsFit) {
                            leftOverflow = width - ordinalLabelOffset - xLabelOuterPadding;
                        } else {
                            leftOverflow = (width / WidthDelimiter) - ordinalLabelOffset - xLabelOuterPadding;
                        }

                        leftOverflow = Math.max(leftOverflow, 0);
                    }
                    else if (xDomain.length > 1) {
                        const xPos: number = xScale(xDomain[0]);

                        leftOverflow = (width / WidthDelimiter) - xPos;
                        leftOverflow = Math.max(leftOverflow, 0);
                    }
                } else if (i === len - 1) {
                    if (scaleIsOrdinal) {
                        if (xAxisProperties.willLabelsFit || xAxisProperties.willLabelsWordBreak) {
                            rightOverflow = (width / WidthDelimiter) - ordinalLabelOffset - xLabelOuterPadding;
                            rightOverflow = Math.max(rightOverflow, 0);
                        }
                    }
                    else if (xDomain.length > 1) {
                        const xPos: number = xScale(xDomain[1]);

                        rightOverflow = (width / WidthDelimiter) - (viewport.width - xPos);
                        rightOverflow = Math.max(rightOverflow, 0);
                    }
                }

                xMax = Math.max(xMax, height * HeightFactor - HeightOffset);
            }
            // trim any actual overflow to the limit
            leftOverflow = enableOverflowCheck
                ? Math.min(leftOverflow, XLabelMaxAllowedOverflow)
                : DefaultOverflow;

            rightOverflow = enableOverflowCheck
                ? Math.min(rightOverflow, XLabelMaxAllowedOverflow)
                : DefaultOverflow;
        }
    }

    let rightMargin: number = 0,
        leftMargin: number = 0;

    const bottomMargin: number = Math.min(Math.ceil(xMax), bottomMarginLimit);

    if (showOnRight) {
        leftMargin = Math.min(leftOverflow, yMarginLimit);
        rightMargin = Math.min(Math.max(rightOverflow, maxWidthY1), yMarginLimit);
    }
    else {
        leftMargin = Math.min(Math.max(leftOverflow, maxWidthY1), yMarginLimit);
        rightMargin = Math.min(rightOverflow, yMarginLimit);
    }

    return {
        xMax: Math.ceil(bottomMargin),
        yLeft: Math.ceil(leftMargin),
        yRight: Math.ceil(rightMargin),
    };
}
