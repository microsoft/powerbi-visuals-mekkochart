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
import ISandboxExtendedColorPalette = powerbi.extensibility.ISandboxExtendedColorPalette;
import ISelectionId = powerbi.visuals.ISelectionId;
import ISelectionManager = powerbi.extensibility.ISelectionManager;

import { Selection as d3Selection } from "d3-selection";
type Selection<T> = d3Selection<any, T, any, any>;

import { legendInterfaces } from "powerbi-visuals-utils-chartutils";
import LegendDataPoint = legendInterfaces.LegendDataPoint;
import  ISelectableDataPoint = legendInterfaces.ISelectableDataPoint;

import { CustomVisualBehaviorOptions } from "./customVisualBehaviorOptions";

import { MekkoChartUtils }  from "./../utils";
import { VisualBehaviorOptions } from "./visualBehaviorOptions";
import { MekkoChartColumnDataPoint } from "../dataInterfaces";

enum EventCode {
    Enter = "Enter",
    Space = "Space"
}

export class CustomVisualBehavior {
    private legend: Selection<any>;
    private legendIcons: Selection<LegendDataPoint>;
    private legendItems: Selection<LegendDataPoint>;
    private legendDataPoints: ISelectableDataPoint[];

    private clearCatcher: Selection<any>;
    private selectionManager: ISelectionManager;
    private layerOptions: VisualBehaviorOptions[];

    private colorPalette: ISandboxExtendedColorPalette;

    constructor(selectionManager: ISelectionManager, colorPalette: ISandboxExtendedColorPalette){
        this.selectionManager = selectionManager;
        this.colorPalette = colorPalette;
        this.selectionManager.registerOnSelectCallback(this.onSelectCallback.bind(this));
    }

    private onSelectCallback(selectionIds?: ISelectionId[]){
        this.applySelectionStateToData(selectionIds);
        this.renderSelection();
    }

    private applySelectionStateToData(selectionIds?: ISelectionId[]): void {
        const selectedIds: ISelectionId[] = <ISelectionId[]>this.selectionManager.getSelectionIds();
        this.setSelectedToDataPoints(this.legendDataPoints, selectionIds || selectedIds);

        this.layerOptions.forEach((layer: VisualBehaviorOptions) => {
            this.setSelectedToDataPoints(layer.bars.data(), selectionIds || selectedIds);
        });
    }

    private setSelectedToDataPoints(dataPoints: ISelectableDataPoint[], ids: ISelectionId[]): void{
        dataPoints.forEach((dataPoint: ISelectableDataPoint) => {
            dataPoint.selected = ids.some((id=> id.includes(dataPoint.identity)));
        });
    }

    private bindContextMenuEvent(elements: Selection<any>): void {
        elements.on("contextmenu", (event: PointerEvent, dataPoint: ISelectableDataPoint | undefined) => {
            this.selectionManager.showContextMenu(dataPoint ? dataPoint.identity : {},
                {
                    x: event.clientX,
                    y: event.clientY
                }
            );
            event.preventDefault();
            event.stopPropagation();
        });
    }

    private bindClickEvent(elements: Selection<ISelectableDataPoint | undefined>): void {
        elements.on("click", (event: PointerEvent, dataPoint: ISelectableDataPoint | undefined) => {
            const isMultiSelection: boolean = event.ctrlKey || event.metaKey || event.shiftKey;

            if ((<ISelectableDataPoint>dataPoint)?.identity){
                this.selectionManager.select(dataPoint.identity, isMultiSelection);
                event.stopPropagation();
            }
            else {
                // need to update legend elements after the click on legend arrow
                const isLegendArrowClicked: boolean = (<Element>event.target).parentElement.matches(".navArrow");
                if (isLegendArrowClicked){
                    this.updateLegendElements();
                    this.bindClickEvent(this.legendItems);
                }
                else {
                    this.selectionManager.clear();
                }
            }
            this.onSelectCallback();
        });
    }

    private bindKeyboardEvent(elements: Selection<MekkoChartColumnDataPoint>): void {
        elements.on("keydown", (event : KeyboardEvent, dataPoint: MekkoChartColumnDataPoint) => {
            if (event.code !== EventCode.Enter && event.code !== EventCode.Space) {
                return;
            }

            const isMultiSelection: boolean = event.ctrlKey || event.metaKey || event.shiftKey;
            this.selectionManager.select(dataPoint.identity, isMultiSelection);

            event.stopPropagation();
            this.onSelectCallback();
        });
    }

    private updateLegendElements(): void {
        this.legendIcons = this.legend.selectAll(".legendIcon");
        this.legendItems = this.legend.selectAll(".legendItem");
    }

    public bindEvents(options: CustomVisualBehaviorOptions): void {
        this.legend = options.legend;
        this.legendDataPoints = options.legendDataPoints;
        this.updateLegendElements();

        this.layerOptions = options.layerOptions;
        this.clearCatcher = options.clearCatcher;

        this.applyOnObjectFormatMode(options.isFormatMode);
    }

    private applyOnObjectFormatMode(isFormatMode: boolean){
        if (isFormatMode){
            // remove event listeners which are irrelevant for format mode.
            this.removeEventListeners();
            this.selectionManager.clear();
        } else {
            this.addEventListeners();
        }
    }

    private removeEventListeners(): void {
        this.legendItems.on("click", null);
        this.clearCatcher.on("click", null);
        this.clearCatcher.on("contextmenu", null);

        this.layerOptions.forEach((layer: VisualBehaviorOptions) => {
            layer.bars.on("click", null);
            layer.bars.on("contextmenu", null);
            layer.bars.on("keydown", null);
        });
    }

    private addEventListeners(): void {
        this.bindClickEvent(this.legendItems);
        this.bindClickEvent(this.clearCatcher);
        this.bindContextMenuEvent(this.clearCatcher);

        this.layerOptions.forEach((layer: VisualBehaviorOptions) => {
            this.bindClickEvent(layer.bars);
            this.bindContextMenuEvent(layer.bars);
            this.bindKeyboardEvent(layer.bars);
        });

        this.applySelectionStateToData();
    }

    private applySelectionStyleToLegend(): void {
        const legendHasSelection: boolean = this.legendDataPoints.some((dataPoint: LegendDataPoint) => dataPoint.selected);

        this.legendIcons.style("fill-opacity", (legendDataPoint: LegendDataPoint) => {
            return MekkoChartUtils.getLegendFillOpacity(
                legendDataPoint.selected,
                legendHasSelection,
                this.colorPalette.isHighContrast
            );
        });

        this.legendIcons.style("fill", (legendDataPoint: LegendDataPoint) => {
            return MekkoChartUtils.getLegendFill(
                legendDataPoint.selected,
                legendHasSelection,
                legendDataPoint.color,
                this.colorPalette.isHighContrast
            );
        });
    }

    public applySelectionStyleToBars(): void {
        const dataPointHasSelection: boolean = this.selectionManager.hasSelection();

        this.layerOptions.forEach((layer: VisualBehaviorOptions) => {
            layer.bars.attr("aria-selected", (dataPoint: MekkoChartColumnDataPoint) => {
                return dataPoint.selected
            });

            layer.bars.style("fill-opacity", (dataPoint: MekkoChartColumnDataPoint) => {
                return MekkoChartUtils.getFillOpacity(
                    dataPoint.selected,
                    dataPoint.highlight,
                    !dataPoint.highlight && dataPointHasSelection,
                    !dataPoint.selected && layer.hasHighlights);
            });
    
            layer.bars.style("stroke-opacity", (dataPoint: MekkoChartColumnDataPoint) => {
                return MekkoChartUtils.getFillOpacity(
                    dataPoint.selected,
                    dataPoint.highlight,
                    !dataPoint.highlight && dataPointHasSelection,
                    !dataPoint.selected && layer.hasHighlights);
            });

            layer.bars.style("stroke-width", (dataPoint: MekkoChartColumnDataPoint) => {
                return MekkoChartUtils.getStrokeWidth(
                    dataPoint.selected,
                    dataPoint.highlight,
                    !dataPoint.highlight && dataPointHasSelection,
                    !dataPoint.selected && layer.hasHighlights
                );
            });
        });
    }

    public renderSelection(): void {
        this.applySelectionStyleToLegend();
        this.applySelectionStyleToBars();
    }
}
