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

import {
    interactivitySelectionService,
    interactivityBaseService
} from "powerbi-visuals-utils-interactivityutils";
import { Selection, select } from "d3-selection";
import { MekkoChartColumnDataPoint, MekkoChartSeries } from "./../dataInterfaces";
import { MekkoChart } from "../visual";

import { VisualBehaviorOptions } from "./visualBehaviorOptions";

import * as utils from "./../utils";

// powerbi.extensibility.utils.interactivity
import ISelectionHandler = interactivityBaseService.ISelectionHandler;
import IInteractiveBehavior = interactivityBaseService.IInteractiveBehavior;
import SelectionDataPoint = interactivitySelectionService.SelectableDataPoint;

export class VisualBehavior implements IInteractiveBehavior {
    private options: VisualBehaviorOptions;

    public bindEvents(
        options: VisualBehaviorOptions,
        selectionHandler: ISelectionHandler): void {

        this.options = options;

        const eventGroup: Selection<any, any, any, any> = options.eventGroup;

        eventGroup.on("click", function (mouseEvent: MouseEvent) {
            const dataOfTheLastEvent: SelectionDataPoint = VisualBehavior.getDatumForLastInputEvent(mouseEvent);

            selectionHandler.handleSelection(
                dataOfTheLastEvent,
                mouseEvent.ctrlKey || mouseEvent.metaKey || mouseEvent.shiftKey
            );
        });

        eventGroup.on("contextmenu", function (pointerEvent: PointerEvent) {
            const dataOfTheLastEvent: SelectionDataPoint = VisualBehavior.getDatumForLastInputEvent(pointerEvent);

            selectionHandler.handleContextMenu(
                dataOfTheLastEvent,
                {
                    x: pointerEvent.clientX,
                    y: pointerEvent.clientY
                });
                
            pointerEvent.preventDefault();
            pointerEvent.stopPropagation();
        });

        eventGroup.on("keydown", function(keyboardEvent: KeyboardEvent) {
            const dataOfTheLastEvent: SelectionDataPoint = VisualBehavior.getDatumForLastInputEvent(keyboardEvent);

            if (keyboardEvent.code !== "Enter" && keyboardEvent.code !== "Space") {
                return;
            }

            selectionHandler.handleSelection(
                dataOfTheLastEvent,
                keyboardEvent.ctrlKey || keyboardEvent.metaKey || keyboardEvent.shiftKey
            );
        });

    }

    public renderSelection(hasSelection: boolean): void {
        this.options.bars.style("fill-opacity", (dataPoint: MekkoChartColumnDataPoint) => {
            return utils.getFillOpacity(
                dataPoint.selected,
                dataPoint.highlight,
                !dataPoint.highlight && hasSelection,
                !dataPoint.selected && this.options.hasHighlights);
        });

        const series: Selection<any, any, any, any> = this.options.mainGraphicsContext
        .selectAll(MekkoChart.SeriesSelector.selectorName);

        series.attr("aria-selected", (dataPoint: MekkoChartSeries) => {
            let selectedCategory: boolean = false;
            dataPoint.data.forEach((seriesDataPoint: MekkoChartColumnDataPoint) => {
                if (seriesDataPoint.selected) {
                    selectedCategory = true;
                }
            });
            return (hasSelection && selectedCategory);
        });

        this.options.bars.attr("aria-selected", (dataPoint: MekkoChartColumnDataPoint) => {
            return (hasSelection && dataPoint.selected);
        });

    }

    private static getDatumForLastInputEvent(event: Event): SelectionDataPoint {
        const target: EventTarget = event.target;
        return select((<any>target)).datum() as any;
    }
}
