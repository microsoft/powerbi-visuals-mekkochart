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
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
// powerbi.extensibility.utils.test
import { VisualBuilderBase } from "powerbi-visuals-utils-testutils";
// MekkoChart1449744733038
import { MekkoChart } from "./../src/visual";
export class MekkoChartBuilder extends VisualBuilderBase<MekkoChart> {
    constructor(width: number, height: number) {
        super(width, height, "MekkoChart1449744733038");
    }

    protected build(options: VisualConstructorOptions) {
        return new MekkoChart(options);
    }

    public get instance(): MekkoChart {
        return this.visual;
    }

    public get rootElement(): HTMLElement {
        return this.element.querySelector(".mekkoChart");
    }

    public get mainElement(): SVGElement {
        return this.rootElement.querySelector("svg");
    }

    public get categoriesAxis(): HTMLElement {
        return this.mainElement
            .querySelector("g.axisGraphicsContext > g.x.axis.showLinesOnAxis");
    }

    public get categoriesAxisTicks(): NodeListOf<HTMLElement> {
        return this.categoriesAxis.querySelectorAll("g.tick");
    }

    public get rootAxisGraphicsContext(): HTMLElement {
        return this.mainElement.querySelector("g.axisGraphicsContext");
    }

    public get svgScrollableAxisGraphicsContext(): HTMLElement {
        return this.mainElement
            .querySelector("svg.svgScrollable > g.axisGraphicsContext");
    }

    public get xAxisTicks(): NodeListOf<HTMLElement> {
        return this.rootAxisGraphicsContext
            .querySelectorAll("g.x.axis > g.tick");
    }

    public get yAxisTicks(): NodeListOf<HTMLElement> {
        return this.svgScrollableAxisGraphicsContext
            .querySelectorAll("g.y.axis > g.tick");
    }

    public get xAxisLabel(): HTMLElement {
        return this.rootAxisGraphicsContext
            .querySelector("text.x.axis.label");
    }

    public get yAxisLabel(): HTMLElement {
        return this.rootAxisGraphicsContext
            .querySelector("text.y.axis.label");
    }

    public get columnElement(): HTMLElement {
        return this.mainElement
            .querySelector("svg.svgScrollable g.axisGraphicsContext .columnChartMainGraphicsContext");
    }

    public get series(): NodeListOf<HTMLElement> {
        return this.columnElement.querySelectorAll("g.series");
    }

    public get columns(): NodeListOf<HTMLElement> {
        return this.series[0].querySelectorAll("rect.column");
    }

    public get borders(): NodeListOf<HTMLElement> {
        return this.series[0].querySelectorAll("rect.mekkoborder");
    }

    public get dataLabels(): NodeListOf<HTMLElement> {
        return this.mainElement
            .querySelectorAll("svg.svgScrollable .labels > .data-labels");
    }

    public get columnsWithSize(): Element[] {
        return Array.from(this.series[0]
            .querySelectorAll("rect.column"))
            .filter((element) => {
                const elementComputedStyle: CSSStyleDeclaration = getComputedStyle(element);
                const elementHeight: string = elementComputedStyle.getPropertyValue("height");
                return parseFloat(elementHeight) > 0;
            });
    }

    public get columnsWithoutSize(): Element[] {
        return Array.from(this.series[0]
            .querySelectorAll("rect.column"))
            .filter((element) => {
                const elementComputedStyle: CSSStyleDeclaration = getComputedStyle(element);
                const elementHeight: string = elementComputedStyle.getPropertyValue("height");
                return parseFloat(elementHeight) === 0;
            });
    }

    public get legendGroup(): HTMLElement {
        return this.rootElement
            .querySelector(".legendParentDefault > svg.legend > g#legendGroup");
    }

    public get categoryLegendGroup(): NodeListOf<HTMLElement> {
        return this.rootElement
            .querySelectorAll(".legendParent >  svg.legend > g#legendGroup");
    }

    public get legendTitle(): HTMLElement {
        return this.legendGroup.querySelector(".legendTitle");
    }

    public get legendItemText(): NodeListOf<HTMLElement> {
        return this.legendGroup
            .querySelectorAll(".legendItem > text.legendText");
    }
}