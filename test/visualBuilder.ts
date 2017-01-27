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

        public get mainElement() {
            return this.rootElement
                .children("svg");
        }

        public get categoriesAxis() {
            return this.mainElement
                .children("g.axisGraphicsContext")
                .children("g.x.axis.showLinesOnAxis");
        }

        public get categoriesAxisTicks() {
            return this.categoriesAxis.children("g.tick");
        }

        public get rootAxisGraphicsContext() {
            return this.mainElement.children("g.axisGraphicsContext");
        }

        public get svgScrollableAxisGraphicsContext() {
            return this.mainElement
                .children("svg.svgScrollable")
                .children("g.axisGraphicsContext");
        }

        public get xAxisTicks() {
            return this.rootAxisGraphicsContext
                .children("g.x.axis")
                .children("g.tick");
        }

        public get yAxisTicks() {
            return this.svgScrollableAxisGraphicsContext
                .children("g.y.axis")
                .children("g.tick");
        }

        public get xAxisLabel() {
            return this.rootAxisGraphicsContext
                .children("text.xAxisLabel");
        }

        public get yAxisLabel() {
            return this.rootAxisGraphicsContext
                .children("text.yAxisLabel");
        }

        public get columnElement() {
            return this.mainElement
                .find("svg.svgScrollable g.axisGraphicsContext .columnChartMainGraphicsContext");
        }

        public get series() {
            return this.columnElement.children("g.series");
        }

        public get columns() {
            return this.series.children("rect.column");
        }

        public get borders() {
            return this.series.children("rect.mekkoborder");
        }

        public get dataLabels() {
            return this.mainElement
                .children("svg.svgScrollable")
                .find(".labels")
                .children(".data-labels");
        }

        public get columnsWithSize() {
            return this.series
                .children("rect.column")
                .filter((i, element: Element) => {
                    return parseFloat($(element).attr("height")) > 0;
                });
        }

        public get legendGroup() {
            return this.rootElement
                .children("svg.legend")
                .children("g#legendGroup");
        }

        public get legendTitle() {
            return this.legendGroup.children(".legendTitle");
        }

        public get legendItemText() {
            return this.legendGroup
                .children(".legendItem")
                .children("text.legendText");
        }
    }
}
