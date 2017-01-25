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

module powerbi.extensibility.visual.behavior {
    // d3
    import Selection = d3.Selection;

    // powerbi.extensibility.utils.interactivity
    import ISelectionHandler = powerbi.extensibility.utils.interactivity.ISelectionHandler;
    import interactivityUtils = powerbi.extensibility.utils.interactivity.interactivityUtils;
    import IInteractiveBehavior = powerbi.extensibility.utils.interactivity.IInteractiveBehavior;

    export class VisualBehavior implements IInteractiveBehavior {
        private options: VisualBehaviorOptions;

        public bindEvents(options: VisualBehaviorOptions, selectionHandler: ISelectionHandler) {
            this.options = options;

            const eventGroup: Selection<any> = options.eventGroup;

            eventGroup.on("click", () => {
                const dataOfTheLastEvent: any = VisualBehavior.getDatumForLastInputEvent();

                selectionHandler.handleSelection(
                    dataOfTheLastEvent,
                    (d3.event as MouseEvent).ctrlKey);
            });

            eventGroup.on("contextmenu", () => {
                const mouseEvent: MouseEvent = d3.event as MouseEvent

                if (mouseEvent.ctrlKey) {
                    return;
                }

                mouseEvent.preventDefault();

                // var d = MekkoChartWebBehavior.getDatumForLastInputEvent();
                // var position = interactivityUtils.getPositionOfLastInputEvent();

                // TODO: check it
                // selectionHandler.handleContextMenu(d, position);
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
        }

        private static getDatumForLastInputEvent(): any {
            const target: EventTarget = (d3.event as MouseEvent).target;

            return d3.select(target).datum();
        }
    }
}
