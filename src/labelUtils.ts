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

module powerbi.extensibility.visual.labelUtils {
    // powerbi.extensibility.utils.formatting
    import wordBreaker = powerbi.extensibility.utils.formatting.wordBreaker;
    import TextProperties = powerbi.extensibility.utils.formatting.TextProperties;
    import ITextAsSVGMeasurer = powerbi.extensibility.utils.formatting.ITextAsSVGMeasurer;

    // powerbi.extensibility.utils.chart
    import AxisHelper = powerbi.extensibility.utils.chart.axis;
    import IAxisProperties = AxisHelper.IAxisProperties;
    import TickLabelMargins = AxisHelper.TickLabelMargins;

    export function getTickLabelMargins(
        viewport: IViewport,
        yMarginLimit: number,
        textWidthMeasurer: ITextAsSVGMeasurer,
        textHeightMeasurer: ITextAsSVGMeasurer,
        axes: MekkoChartAxisProperties,
        bottomMarginLimit: number,
        xAxisTextProperties: TextProperties,
        y1AxisTextProperties: TextProperties,
        y2AxisTextProperties: TextProperties,
        enableOverflowCheck: boolean,
        scrollbarVisible?: boolean,
        showOnRight?: boolean,
        renderXAxis?: boolean,
        renderY1Axis?: boolean,
        renderY2Axis?: boolean): TickLabelMargins {

        var XLabelMaxAllowedOverflow = 35;

        var xAxisProperties: IAxisProperties = axes.x;
        var y1AxisProperties: IAxisProperties = axes.y1;
        var y2AxisProperties: IAxisProperties = axes.y2;

        var xLabels = xAxisProperties.values;
        var y1Labels = y1AxisProperties.values;

        var leftOverflow = 0;
        var rightOverflow = 0;
        var maxWidthY1 = 0;
        var maxWidthY2 = 0;
        var xMax = 0; // bottom margin
        var ordinalLabelOffset = xAxisProperties.categoryThickness ? xAxisProperties.categoryThickness / 2 : 0;
        var scaleIsOrdinal = AxisHelper.isOrdinalScale(xAxisProperties.scale);

        var xLabelOuterPadding = 0;
        if (xAxisProperties.outerPadding !== undefined) {
            xLabelOuterPadding = xAxisProperties.outerPadding;
        }
        else if (xAxisProperties.xLabelMaxWidth !== undefined) {
            xLabelOuterPadding = Math.max(0, (viewport.width - xAxisProperties.xLabelMaxWidth * xLabels.length) / 2);
        }

        if (AxisHelper.getRecommendedNumberOfTicksForXAxis(viewport.width) !== 0
            || AxisHelper.getRecommendedNumberOfTicksForYAxis(viewport.height) !== 0) {
            var rotation;
            if (scrollbarVisible)
                rotation = AxisHelper.LabelLayoutStrategy.DefaultRotationWithScrollbar;
            else
                rotation = AxisHelper.LabelLayoutStrategy.DefaultRotation;

            if (renderY1Axis) {
                for (var i = 0, len = y1Labels.length; i < len; i++) {
                    y1AxisTextProperties.text = y1Labels[i];
                    maxWidthY1 = Math.max(maxWidthY1, textWidthMeasurer(y1AxisTextProperties));
                }
            }

            if (y2AxisProperties && renderY2Axis) {
                var y2Labels = y2AxisProperties.values;
                for (var i = 0, len = y2Labels.length; i < len; i++) {
                    y2AxisTextProperties.text = y2Labels[i];
                    maxWidthY2 = Math.max(maxWidthY2, textWidthMeasurer(y2AxisTextProperties));
                }
            }

            var textHeight = textHeightMeasurer(xAxisTextProperties);
            var maxNumLines = Math.floor(bottomMarginLimit / textHeight);
            var xScale = xAxisProperties.scale;
            var xDomain = xScale.domain();
            if (renderXAxis && xLabels.length > 0) {
                for (var i = 0, len = xLabels.length; i < len; i++) {
                    // find the max height of the x-labels, perhaps rotated or wrapped
                    var height: number;
                    xAxisTextProperties.text = xLabels[i];
                    var width = textWidthMeasurer(xAxisTextProperties);
                    if (xAxisProperties.willLabelsWordBreak) {
                        // Split label and count rows
                        var wordBreaks = wordBreaker.splitByWidth(xAxisTextProperties.text, xAxisTextProperties, textWidthMeasurer, xAxisProperties.xLabelMaxWidth, maxNumLines);
                        height = wordBreaks.length * textHeight;
                        // word wrapping will truncate at xLabelMaxWidth
                        width = xAxisProperties.xLabelMaxWidth;
                    }
                    else if (!xAxisProperties.willLabelsFit && scaleIsOrdinal) {
                        height = width * rotation.sine;
                        width = width * rotation.cosine;
                    }
                    else {
                        height = textHeight;
                    }

                    // calculate left and right overflow due to wide X labels
                    // (Note: no right overflow when rotated)
                    if (i === 0) {
                        if (scaleIsOrdinal) {
                            if (!xAxisProperties.willLabelsFit /*rotated text*/)
                                leftOverflow = width - ordinalLabelOffset - xLabelOuterPadding;
                            else
                                leftOverflow = (width / 2) - ordinalLabelOffset - xLabelOuterPadding;
                            leftOverflow = Math.max(leftOverflow, 0);
                        }
                        else if (xDomain.length > 1) {
                            // Scalar - do some math
                            var xPos = xScale(xDomain[0]);
                            // xPos already incorporates xLabelOuterPadding, don't subtract it twice
                            leftOverflow = (width / 2) - xPos;
                            leftOverflow = Math.max(leftOverflow, 0);
                        }
                    } else if (i === len - 1) {
                        if (scaleIsOrdinal) {
                            // if we are rotating text (!willLabelsFit) there won't be any right overflow
                            if (xAxisProperties.willLabelsFit || xAxisProperties.willLabelsWordBreak) {
                                // assume this label is placed near the edge
                                rightOverflow = (width / 2) - ordinalLabelOffset - xLabelOuterPadding;
                                rightOverflow = Math.max(rightOverflow, 0);
                            }
                        }
                        else if (xDomain.length > 1) {
                            // Scalar - do some math
                            var xPos = xScale(xDomain[1]);
                            // xPos already incorporates xLabelOuterPadding, don't subtract it twice
                            rightOverflow = (width / 2) - (viewport.width - xPos);
                            rightOverflow = Math.max(rightOverflow, 0);
                        }
                    }

                    xMax = Math.max(xMax, height * 1.4 - 15);
                }
                // trim any actual overflow to the limit
                leftOverflow = enableOverflowCheck ? Math.min(leftOverflow, XLabelMaxAllowedOverflow) : 0;
                rightOverflow = enableOverflowCheck ? Math.min(rightOverflow, XLabelMaxAllowedOverflow) : 0;
            }
        }

        var rightMargin = 0,
            leftMargin = 0,
            bottomMargin = Math.min(Math.ceil(xMax), bottomMarginLimit);

        if (showOnRight) {
            leftMargin = Math.min(Math.max(leftOverflow, maxWidthY2), yMarginLimit);
            rightMargin = Math.min(Math.max(rightOverflow, maxWidthY1), yMarginLimit);
        }
        else {
            leftMargin = Math.min(Math.max(leftOverflow, maxWidthY1), yMarginLimit);
            rightMargin = Math.min(Math.max(rightOverflow, maxWidthY2), yMarginLimit);
        }

        return {
            xMax: Math.ceil(bottomMargin),
            yLeft: Math.ceil(leftMargin),
            yRight: Math.ceil(rightMargin),
        };
    }
}
