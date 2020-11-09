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


// function children(e, selector) {
//     if (e instanceof Element) {
//         return Array.from(e.querySelectorAll(":scope > " + selector));
//     }

//     return Array.from(e).flatMap(elem => children(elem, selector));
// }

export class MekkoChartBuilder extends VisualBuilderBase<MekkoChart> {
    constructor(width: number, height: number) {
        super(width, height, "MekkoChart1449744733038");
    }

    protected build(options: VisualConstructorOptions) {
        return new MekkoChart(options);
    }

    public get rootElement(): HTMLElement {
        return this.element.querySelector(".mekkoChart");

        // return this.element.find(".mekkoChart");
    }

    public get mainElement(): SVGSVGElement {
        return this.rootElement
            .querySelector(":scope > svg");

        // .children("svg");
    }

    public get categoriesAxis(): NodeListOf<Element> {
        return this.mainElement
            .querySelectorAll(":scope > g.axisGraphicsContext > g.x.axis.showLinesOnAxis");

        // .children("g.axisGraphicsContext")
        // .children("g.x.axis.showLinesOnAxis");
    }

    public get categoriesAxisTicks(): NodeListOf<Element> {
        return this.mainElement
            .querySelectorAll(":scope > g.axisGraphicsContext > g.x.axis.showLinesOnAxis > g.tick");

        // let res: any = [];
        // this.categoriesAxis.forEach((el) => res.push(el.querySelectorAll(":scope > g.tick")))
        // return this.categoriesAxis.children("g.tick");
    }

    public get rootAxisGraphicsContext(): HTMLElement {
        return this.mainElement.querySelector(":scope > g.axisGraphicsContext");
        // return this.mainElement.children("g.axisGraphicsContext");
    }

    public get svgScrollableAxisGraphicsContext(): HTMLElement {
        return this.mainElement
            .querySelector(":scope > svg.svgScrollable > g.axisGraphicsContext");

        // return this.mainElement
        //     .children("svg.svgScrollable")
        //     .children("g.axisGraphicsContext");
    }

    public get xAxisTicks(): NodeListOf<HTMLElement> {
        return this.rootAxisGraphicsContext
            .querySelectorAll(":scope > g.x.axis > g.tick");

        // return this.rootAxisGraphicsContext
        //     .children("g.x.axis")
        //     .children("g.tick");
    }

    public get yAxisTicks(): NodeListOf<HTMLElement> {
        return this.svgScrollableAxisGraphicsContext
            .querySelectorAll(":scope > g.y.axis > g.tick");

        // return this.svgScrollableAxisGraphicsContext
        //     .children("g.y.axis")
        //     .children("g.tick");
    }

    public get xAxisLabel(): NodeListOf<HTMLElement> {
        return this.rootAxisGraphicsContext
            .querySelectorAll(":scope > text.xAxisLabel");

        // return this.rootAxisGraphicsContext
        //     .children("text.xAxisLabel");
    }

    public get yAxisLabel(): NodeListOf<HTMLElement> {
        return this.rootAxisGraphicsContext
            .querySelectorAll(":scope > text.yAxisLabel");

        // return this.rootAxisGraphicsContext
        //     .children("text.yAxisLabel");
    }

    public get columnElement(): NodeListOf<HTMLElement> {
        return this.mainElement
            .querySelectorAll("svg.svgScrollable g.axisGraphicsContext .columnChartMainGraphicsContext");

        // return this.mainElement
        //     .find("svg.svgScrollable g.axisGraphicsContext .columnChartMainGraphicsContext");
    }

    public get series(): NodeListOf<HTMLElement> {
        return this.mainElement
            .querySelectorAll(":scope > svg.svgScrollable g.axisGraphicsContext .columnChartMainGraphicsContext > g.series");

        // let res: any = [];
        // this.columnElement.forEach((el) => res.push(el.querySelectorAll(":scope > g.series")))
        // return res;

        // return this.columnElement.children("g.series");
    }

    public get columns(): NodeListOf<HTMLElement> {
        return this.mainElement
            .querySelectorAll(":scope > svg.svgScrollable g.axisGraphicsContext .columnChartMainGraphicsContext > g.series > rect.column");

        // let res: any = [];
        // this.series.forEach((el) => res.push(el.querySelectorAll(":scope > rect.column")))
        // return res;

        // return this.series.children("rect.column");
    }

    public get borders(): NodeListOf<SVGRectElement> {
        return this.mainElement
            .querySelectorAll(":scope > svg.svgScrollable g.axisGraphicsContext .columnChartMainGraphicsContext > g.series > rect.mekkoborder");

        // let res: any = [];
        // this.series.forEach((el) => res.push(el.querySelectorAll(":scope > rect.mekkoborder")))
        // return res;

        // return this.series.children("rect.mekkoborder");
    }

    public get dataLabels(): NodeListOf<SVGTextElement> {
        return this.mainElement.querySelectorAll(":scope > svg.svgScrollable .labels > .data-labels");

        // return this.mainElement
        //     .children("svg.svgScrollable")
        //     .find(".labels")
        //     .children(".data-labels");
    }

    public get columnsWithSize(): NodeListOf<HTMLElement> {
        return this.mainElement
            .querySelectorAll(":scope > svg.svgScrollable g.axisGraphicsContext .columnChartMainGraphicsContext > g.series > rect.column:not([height='0'])");


        // let res: any = [];
        // this.series.forEach((el) => res.push(el.querySelectorAll(":scope > rect.column")))
        // return res.map((el) => Array.from(el)
        //     .filter((el: Element) => el.attributes.height.value > 0))
        //     .filter(el => el.length > 0)

        // return this.series
        //     .children("rect.column")
        //     .filter((i, element: Element) => {
        //         return parseFloat($(element).attr("height")) > 0;
        //     });
    }

    public get columnsWithoutSize(): NodeListOf<HTMLElement> {
        return this.mainElement
            .querySelectorAll(":scope > svg.svgScrollable g.axisGraphicsContext .columnChartMainGraphicsContext > g.series > rect.column[height='0']");

        // let res: any = [];
        // this.series.forEach((el) => res.push(el.querySelectorAll(":scope > rect.column")))
        // return res.map((el) => Array.from(el).filter((el: Element) => el.getAttribute("height") === "0")).filter(el => el.length > 0)

        // return this.series
        //     .children("rect.column")
        //     .filter((i, element: Element) => {
        //         return parseFloat($(element).attr("height")) === 0;
        //     });
    }

    public get legendGroup(): SVGGElement {
        return this.rootElement
            .querySelector(":scope > .legendParentDefault > svg.legend > g#legendGroup");

        // return this.rootElement
        //     .children(".legendParentDefault")
        //     .children("svg.legend")
        //     .children("g#legendGroup");
    }

    public get categoryLegendGroup(): NodeListOf<HTMLElement> {
        return this.rootElement.querySelectorAll(":scope > .legendParent > svg.legend > g#legendGroup");

        // return this.rootElement
        //     .children(".legendParent")
        //     .children("svg.legend")
        //     .children("g#legendGroup");
    }

    public get legendTitle(): HTMLElement {
        return this.rootElement
            .querySelector(":scope > .legendParentDefault > svg.legend > g#legendGroup > .legendTitle");

        // let res: any = [];
        // this.legendGroup.forEach((el) => res.push(el.querySelector(":scope > .legendTitle")))
        // return res;

        // return this.legendGroup.children(".legendTitle");
    }

    public get legendItemText(): NodeListOf<HTMLElement> {
        return this.legendGroup
            .querySelectorAll(":scope > .legendItem > text.legendText");

        // let res: any = [];
        // this.legendGroup.forEach((el) => res.push(el.querySelector(":scope > .legendItem > text.legendText")))
        // return res;

        // return this.legendGroup
        //     .children(".legendItem")
        //     .children("text.legendText");
    }
}