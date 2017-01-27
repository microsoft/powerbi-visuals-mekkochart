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

/// <reference path="_references.ts"/>

module powerbi.extensibility.visual.test {
    // powerbi.extensibility.utils.test
    import VisualBuilderBase = powerbi.extensibility.utils.test.VisualBuilderBase;

    // MekkoChart1449744733038
    import VisualPlugin = powerbi.visuals.plugins.MekkoChart1449744733038;
    import VisualClass = powerbi.extensibility.visual.MekkoChart1449744733038.MekkoChart;

    export class MekkoChartBuilder extends VisualBuilderBase<VisualClass> {
        constructor(width: number, height: number) {
            super(width, height, VisualPlugin.name);
        }

        protected build(options: VisualConstructorOptions) {
            return new VisualClass(options);
        }

        public get rootElement(): JQuery {
            return this.element.find(".mekkoChart");
        }

        public get mainElement(): JQuery {
            return this.rootElement
                .children("svg");
        }

        public get categoriesAxis(): JQuery {
            return this.mainElement
                .children("g.axisGraphicsContext")
                .children("g.x.axis.showLinesOnAxis");
        }

        public get categoriesAxisTicks(): JQuery {
            return this.categoriesAxis.children("g.tick");
        }

        public get rootAxisGraphicsContext(): JQuery {
            return this.mainElement.children("g.axisGraphicsContext");
        }

        public get svgScrollableAxisGraphicsContext(): JQuery {
            return this.mainElement
                .children("svg.svgScrollable")
                .children("g.axisGraphicsContext");
        }

        public get xAxisTicks(): JQuery {
            return this.rootAxisGraphicsContext
                .children("g.x.axis")
                .children("g.tick");
        }

        public get yAxisTicks(): JQuery {
            return this.svgScrollableAxisGraphicsContext
                .children("g.y.axis")
                .children("g.tick");
        }

        public get xAxisLabel(): JQuery {
            return this.rootAxisGraphicsContext
                .children("text.xAxisLabel");
        }

        public get yAxisLabel(): JQuery {
            return this.rootAxisGraphicsContext
                .children("text.yAxisLabel");
        }

        public get columnElement(): JQuery {
            return this.mainElement
                .find("svg.svgScrollable g.axisGraphicsContext .columnChartMainGraphicsContext");
        }

        public get series(): JQuery {
            return this.columnElement.children("g.series");
        }

        public get columns(): JQuery {
            return this.series.children("rect.column");
        }

        public get borders(): JQuery {
            return this.series.children("rect.mekkoborder");
        }

        public get dataLabels(): JQuery {
            return this.mainElement
                .children("svg.svgScrollable")
                .find(".labels")
                .children(".data-labels");
        }

        public get columnsWithSize(): JQuery {
            return this.series
                .children("rect.column")
                .filter((i, element: Element) => {
                    return parseFloat($(element).attr("height")) > 0;
                });
        }

        public get legendGroup(): JQuery {
            return this.rootElement
                .children("svg.legend")
                .children("g#legendGroup");
        }

        public get legendTitle(): JQuery {
            return this.legendGroup.children(".legendTitle");
        }

        public get legendItemText(): JQuery {
            return this.legendGroup
                .children(".legendItem")
                .children("text.legendText");
        }
    }
}
