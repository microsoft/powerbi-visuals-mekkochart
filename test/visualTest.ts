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
import DataView = powerbi.DataView;
import DataViewValueColumnGroup = powerbi.DataViewValueColumnGroup;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;

// powerbi.extensibility.utils.type
import { pixelConverter } from "powerbi-visuals-utils-typeutils";
import fromPointToPixel = pixelConverter.fromPointToPixel;
import { d3Click } from "powerbi-visuals-utils-testutils";

// powerbi.extensibility.utils.test
import {
    createVisualHost,
    assertColorsMatch,
} from "powerbi-visuals-utils-testutils";

import {
    MekkoChartSeries,
    MekkoColumnChartData
} from "./../src/dataInterfaces";

import {
    MekkoChartData
} from "./visualData";

import {
    BaseColumnChart
} from "./../src/columnChart/baseColumnChart";

import { MekkoChartBuilder } from "./visualBuilder";

import {
    getSolidColorStructuralObject,
    isTextElementInOrOutElement
} from "./helpers/helpers";

import sum from "lodash.sum";
import sortBy from "lodash.sortby";
import findIndex from "lodash.findindex";
import { select } from "d3-selection";
import { ClickEventType } from "powerbi-visuals-utils-testutils";
import { MekkoChart } from "../src/visual";

describe("MekkoChart", () => {
    let visualBuilder: MekkoChartBuilder;
    let defaultDataViewBuilder: MekkoChartData;
    let dataView: DataView;

    beforeEach(() => {
        let selectionIndex: number = 0;

        visualBuilder = new MekkoChartBuilder(1000, 500);
        defaultDataViewBuilder = new MekkoChartData();

        dataView = defaultDataViewBuilder.getDataView();

        // powerbi.extensibility.utils.test.mocks.createSelectionId = () => {
        //     return new MockISelectionId(`${++selectionIndex}`);
        // };
    });

    describe("DOM tests", () => {

        it("main element created", (done) => {
            visualBuilder.updateRenderTimeout(dataView, () => {
                expect(document.body.contains(visualBuilder.mainElement)).toBeTruthy();
                done();
            });
        });

        it("update", (done) => {
            visualBuilder.updateRenderTimeout(dataView, () => {
                expect(document.body.contains(visualBuilder.categoriesAxis)).toBeTruthy();

                expect(visualBuilder.categoriesAxis.querySelectorAll("g.tick").length)
                    .toBe(dataView.categorical.categories[0].values.length);

                expect(document.body.contains(visualBuilder.columnElement)).toBeTruthy();

                let series: NodeListOf<HTMLElement> = visualBuilder.columnElement.querySelectorAll("g.series"),
                    grouped: DataViewValueColumnGroup[] = dataView.categorical.values.grouped();

                expect(series.length).toBe(grouped.length);

                for (let i: number = 0, length = series.length; i < length; i++) {
                    expect(series[i].querySelectorAll("rect.column").length)
                        .toBe((i === 0
                            ? grouped[i].values[0].values
                            : grouped[i].values[0].values.filter((a) => typeof a === 'number')).length);
                }

                done();
            });
        });

        it("validate that labels are not cut off", (done) => {
            const fontSize: number = 40;

            dataView.metadata.objects = {
                categoryAxis: { fontSize },
                valueAxis: { fontSize }
            };

            visualBuilder.updateRenderTimeout(dataView, () => {
                const xTicksElements: NodeListOf<HTMLElement> = visualBuilder.categoriesAxisTicks;

                const columnsBottomPosition: number = visualBuilder.columnElement
                    .getBoundingClientRect()
                    .bottom;

                const xTicksElementsTopPosition: number[] = Array.from(xTicksElements).map((element: HTMLElement) => {
                    return element.getBoundingClientRect().bottom
                        - parseFloat(window.getComputedStyle(element).fontSize);
                });

                expect(xTicksElementsTopPosition.every((position: number) => {
                    return position > columnsBottomPosition;
                })).toBeTruthy();

                done();
            });
        });

        it("visual is hidden when chart height is less than minimum height", (done) => {
            visualBuilder.viewport = {
                height: 49,
                width: 350
            };

            visualBuilder.updateRenderTimeout(dataView, () => {
                const legendElement: HTMLElement = visualBuilder.element.querySelector(".legend");
                const legendElementComputedStyle: CSSStyleDeclaration = getComputedStyle(legendElement);
                const legendElementDisplay: string = legendElementComputedStyle.getPropertyValue("display");
                expect(legendElementDisplay).toBe("none");

                const mainElement: SVGElement = visualBuilder.mainElement;
                const mainElementComputedStyle: CSSStyleDeclaration = getComputedStyle(mainElement);
                const mainElementDisplay: string = mainElementComputedStyle.getPropertyValue("display");
                expect(mainElementDisplay).toBe("none");

                done();
            });
        });

        it("visual is visible when chart height is great or equal minimum height", (done) => {
            visualBuilder.viewport = {
                height: 80,
                width: 350
            };

            visualBuilder.updateRenderTimeout(dataView, () => {
                const legendElement: HTMLElement = visualBuilder.element.querySelector(".legend");
                const legendElementComputedStyle: CSSStyleDeclaration = getComputedStyle(legendElement);
                const legendElementDisplay: string = legendElementComputedStyle.getPropertyValue("display");
                expect(legendElementDisplay).toBe("block");

                const mainElement: SVGElement = visualBuilder.mainElement;
                const mainElementComputedStyle: CSSStyleDeclaration = getComputedStyle(mainElement);
                const mainElementDisplay: string = mainElementComputedStyle.getPropertyValue("display");
                expect(mainElementDisplay).toBe("block");

                done();
            }, 300);
        });

        it("visual is hidden when chart height greater than minimum height because of rotation", (done) => {
            visualBuilder.viewport = {
                height: 90,
                width: 350
            };

            dataView.metadata.objects = {
                xAxisLabels: {
                    enableRotataion: true
                }
            };

            visualBuilder.updateRenderTimeout(dataView, () => {
                const legendElement: HTMLElement = visualBuilder.element.querySelector(".legend");
                const legendElementComputedStyle: CSSStyleDeclaration = getComputedStyle(legendElement);
                const legendElementDisplay: string = legendElementComputedStyle.getPropertyValue("display");
                expect(legendElementDisplay).toBe("none");

                const mainElement: SVGElement = visualBuilder.mainElement;
                const mainElementComputedStyle: CSSStyleDeclaration = getComputedStyle(mainElement);
                const mainElementDisplay: string = mainElementComputedStyle.getPropertyValue("display");
                expect(mainElementDisplay).toBe("none");

                done();
            });
        });

        it("visual is hidden when chart width is less than minimum width", (done) => {
            visualBuilder.viewport = {
                height: 350,
                width: 49
            };

            visualBuilder.updateRenderTimeout(dataView, () => {
                const legendElement: HTMLElement = visualBuilder.element.querySelector(".legend");
                const legendElementComputedStyle: CSSStyleDeclaration = getComputedStyle(legendElement);
                const legendElementDisplay: string = legendElementComputedStyle.getPropertyValue("display");
                expect(legendElementDisplay).toBe("none");

                const mainElement: SVGElement = visualBuilder.mainElement;
                const mainElementComputedStyle: CSSStyleDeclaration = getComputedStyle(mainElement);
                const mainElementDisplay: string = mainElementComputedStyle.getPropertyValue("display");
                expect(mainElementDisplay).toBe("none");

                done();
            });
        });

        it("X axis lable should not be visible if axis off", (done) => {
            dataView.metadata.objects = {
                categoryAxis: {
                    showAxisTitle: true,
                    show: false
                },
                valueAxis: {
                    show: true,
                    showAxisTitle: true
                }
            };

            visualBuilder.updateRenderTimeout(dataView, () => {
                expect(document.body.contains(visualBuilder.xAxisLabel)).toBeFalsy();
                done();
            }, 300);
        });

        it("axes labels shouldn't be cut off", (done) => {
            dataView.metadata.objects = {
                categoryAxis: {
                    show: true,
                    showAxisTitle: true
                },
                valueAxis: {
                    show: true,
                    showAxisTitle: true
                }
            };

            visualBuilder.updateRenderTimeout(dataView, () => {
                checkAxisLabels(
                    visualBuilder.mainElement,
                    visualBuilder.xAxisLabel);

                checkAxisLabels(
                    visualBuilder.mainElement,
                    visualBuilder.yAxisLabel);

                done();
            }, 300);
        });

        function checkAxisLabels(mainElement: Element, textElement: Element): void {
            expect(isTextElementInOrOutElement(
                mainElement,
                textElement,
                (firstValue: number, secondValue: number) => firstValue >= secondValue)).toBeTruthy();
        }

        // test case requires new powerbi-visuals-utils-testutils with API 2.1.0 support
        it("multi-selection should work with ctrlKey", () => {
            checkMultisilection(ClickEventType.CtrlKey);
        });

        it("multi-selection should work with metaKey", () => {
            checkMultisilection(ClickEventType.MetaKey);
        });

        it("multi-selection should work with shiftKey", () => {
            checkMultisilection(ClickEventType.ShiftKey);
        });

        function checkMultisilection(eventType: number): void{
            dataView = defaultDataViewBuilder.getDataView([
                MekkoChartData.ColumnCategory,
                MekkoChartData.ColumnY
            ]);

            visualBuilder.updateFlushAllD3Transitions(dataView);

            const columns: Element[] = visualBuilder.columnsWithSize;

            const firstColumn: Element = columns[0],
                secondColumn: Element = columns[1],
                thirdColumn: Element = columns[2];

            d3Click(firstColumn, 1, 1, ClickEventType.Default, 0);
            d3Click(secondColumn, 1, 1, eventType, 0);

            const firstColumnCSS: CSSStyleDeclaration = getComputedStyle(firstColumn);
            const firstColumnFillOpacity: string = firstColumnCSS.getPropertyValue("fill-opacity");

            const secondColumnCSS: CSSStyleDeclaration = getComputedStyle(secondColumn);
            const secondColumnFillOpacity: string = secondColumnCSS.getPropertyValue("fill-opacity");

            const thirdColumnCSS: CSSStyleDeclaration = getComputedStyle(thirdColumn);
            const thirdColumnFillOpacity: string = thirdColumnCSS.getPropertyValue("fill-opacity");

            expect(parseFloat(firstColumnFillOpacity)).toBe(1);
            expect(parseFloat(secondColumnFillOpacity)).toBe(1);
            expect(parseFloat(thirdColumnFillOpacity)).toBeLessThan(1);
        }
    });

    describe("Format settings test", () => {
        describe("Column border", () => {
            beforeEach(() => {
                dataView.metadata.objects = {
                    columnBorder: {
                        show: true
                    }
                };
            });

            it("show", () => {
                visualBuilder.updateFlushAllD3Transitions(dataView);

                visualBuilder.borders
                    .forEach((element: Element) => {
                        const elementComputedStyle: CSSStyleDeclaration = getComputedStyle(element);
                        const elementWidth: string = elementComputedStyle.getPropertyValue("width");
                        expect(parseFloat(elementWidth)).toBeGreaterThan(0);
                    });

                (dataView.metadata.objects as any).columnBorder.show = false;

                visualBuilder.updateFlushAllD3Transitions(dataView);

                visualBuilder.borders
                    .forEach((element: Element) => {
                        const elementComputedStyle: CSSStyleDeclaration = getComputedStyle(element);
                        const elementWidth: string = elementComputedStyle.getPropertyValue("width");
                        expect(parseFloat(elementWidth)).toBe(0);
                    });
            });
        });

        describe("Data labels", () => {
            beforeEach(() => {
                dataView.metadata.objects = {
                    labels: {
                        show: true
                    }
                };
            });

            it("show", () => {
                visualBuilder.updateFlushAllD3Transitions(dataView);

                expect(document.body.contains(visualBuilder.dataLabels[0])).toBeTruthy();

                (dataView.metadata.objects as any).labels.show = false;

                visualBuilder.updateFlushAllD3Transitions(dataView);
                expect(document.body.contains(visualBuilder.dataLabels[0])).toBeFalse();
            });

            it("color", () => {
                const color: string = "#ABCDEF";

                (dataView.metadata.objects as any).labels.color = getSolidColorStructuralObject(color);
                visualBuilder.updateFlushAllD3Transitions(dataView);

                visualBuilder.dataLabels
                    .forEach((element: Element) => {
                        const elementComputedStyle: CSSStyleDeclaration = getComputedStyle(element);
                        const elementFill: string = elementComputedStyle.getPropertyValue("fill");
                        assertColorsMatch(elementFill, color);
                    });
            });
        });

        describe("Legend", () => {
            beforeEach(() => {
                dataView.metadata.objects = {
                    legend: {
                        show: true
                    }
                };
            });

            it("show", () => {
                visualBuilder.updateFlushAllD3Transitions(dataView);

                expect(visualBuilder.legendItemText.length).toBe(dataView.categorical.categories[0].values.length);

                (dataView.metadata.objects as any).legend.show = false;
                visualBuilder.updateFlushAllD3Transitions(dataView);

                expect(visualBuilder.legendItemText.length).toBe(0);

            });
        });

        describe("X-axis", () => {
            beforeEach(() => {
                dataView.metadata.objects = {
                    categoryAxis: {
                        show: true
                    }
                };
            });

            it("show", () => {
                visualBuilder.updateFlushAllD3Transitions(dataView);

                expect(document.body.contains(visualBuilder.xAxisTicks[0])).toBeTruthy();

                (dataView.metadata.objects as any).categoryAxis.show = false;
                visualBuilder.updateFlushAllD3Transitions(dataView);
                expect(visualBuilder.xAxisTicks[0]).toBeUndefined();
            });

            it("show title", () => {
                (dataView.metadata.objects as any).categoryAxis.showAxisTitle = true;
                visualBuilder.updateFlushAllD3Transitions(dataView);

                expect(document.body.contains(visualBuilder.xAxisLabel)).toBeTruthy();

                (dataView.metadata.objects as any).categoryAxis.showAxisTitle = false;
                visualBuilder.updateFlushAllD3Transitions(dataView);

                expect(document.body.contains(visualBuilder.xAxisLabel)).toBeFalse();
            });

            it("color", () => {
                const color: string = "#ABCDEF";

                (dataView.metadata.objects as any).categoryAxis.labelColor = getSolidColorStructuralObject(color);
                visualBuilder.updateFlushAllD3Transitions(dataView);

                visualBuilder.xAxisTicks[0]
                    .querySelectorAll("text")
                    .forEach((element: Element) => {
                        const elementComputedStyle: CSSStyleDeclaration = getComputedStyle(element);
                        const elementColor: string = elementComputedStyle.getPropertyValue("fill");
                        assertColorsMatch(elementColor, color);
                    });
            });
        });

        describe("Y-axis", () => {
            beforeEach(() => {
                dataView.metadata.objects = {
                    valueAxis: {
                        show: true
                    }
                };
            });

            it("show", () => {
                visualBuilder.updateFlushAllD3Transitions(dataView);

                expect(document.body.contains(visualBuilder.yAxisTicks[0])).toBeTruthy();

                (dataView.metadata.objects as any).valueAxis.show = false;
                visualBuilder.updateFlushAllD3Transitions(dataView);

                expect(document.body.contains(visualBuilder.yAxisTicks[0])).toBeFalsy();

            });

            it("show title", () => {
                (dataView.metadata.objects as any).valueAxis.showAxisTitle = false;
                visualBuilder.updateFlushAllD3Transitions(dataView);
                expect(document.body.contains(visualBuilder.yAxisLabel)).toBeFalsy();

                (dataView.metadata.objects as any).valueAxis.showAxisTitle = true;
                visualBuilder.updateFlushAllD3Transitions(dataView);
                expect(document.body.contains(visualBuilder.yAxisLabel)).toBeTruthy();
            });

            it("color", () => {
                const color: string = "#ABCDEF";

                (dataView.metadata.objects as any).valueAxis.labelColor = getSolidColorStructuralObject(color);
                visualBuilder.updateFlushAllD3Transitions(dataView);

                visualBuilder.yAxisTicks[0]
                    .querySelectorAll("text")
                    .forEach((element: Element) => {
                        const elementComputedStyle: CSSStyleDeclaration = getComputedStyle(element);
                        const elementColor: string = elementComputedStyle.getPropertyValue("fill");
                        assertColorsMatch(elementColor, color);
                    });
            });

            describe("Y-axis grid settings", () => {
                beforeEach(() => {
                    dataView.metadata.objects = {
                        valueAxis: {
                            show: true,
                            visualMode: "absolute"
                        }
                    };
                });

                it("solid gridline style", () => {
                    (dataView.metadata.objects as any).valueAxis.gridlineStyle = "solid";
                    (dataView.metadata.objects as any).valueAxis.gridlineWidth = 2;
                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    visualBuilder.yAxisTicks[0].querySelectorAll("line").forEach((element: Element) => {
                        const elementComputedStyle: CSSStyleDeclaration = getComputedStyle(element);
                        const dashArray: string = elementComputedStyle.getPropertyValue("stroke-dasharray");
                        expect(dashArray).toBe("none");
                    });
                });

                it("dashed gridline style", () => {
                    const gridlineWidth: number = 2;
                    (dataView.metadata.objects as any).valueAxis.gridlineStyle = "dashed";
                    (dataView.metadata.objects as any).valueAxis.gridlineWidth = gridlineWidth;
                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    const expectedDashArray: string = `${gridlineWidth * 4}px, ${gridlineWidth * 2}px`;
                    visualBuilder.yAxisTicks[0].querySelectorAll("line").forEach((element: Element) => {
                        const elementComputedStyle: CSSStyleDeclaration = getComputedStyle(element);
                        const dashArray: string = elementComputedStyle.getPropertyValue("stroke-dasharray");
                        expect(dashArray).toBe(expectedDashArray);
                    });
                });

                it("dotted gridline style", () => {
                    const gridlineWidth: number = 2;
                    (dataView.metadata.objects as any).valueAxis.gridlineStyle = "dotted";
                    (dataView.metadata.objects as any).valueAxis.gridlineWidth = gridlineWidth;
                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    const expectedDashArray: string = `${gridlineWidth * 0.1}px, ${gridlineWidth * 3}px`;
                    visualBuilder.yAxisTicks[0].querySelectorAll("line").forEach((element: Element) => {
                        const elementComputedStyle: CSSStyleDeclaration = getComputedStyle(element);
                        const dashArray: string = elementComputedStyle.getPropertyValue("stroke-dasharray");
                        const lineCap: string = elementComputedStyle.getPropertyValue("stroke-linecap");
                        expect(dashArray).toBe(expectedDashArray);
                        expect(lineCap).toBe("round");
                    });
                });

                it("custom gridline style without scaling", () => {
                    const customPattern: string = "5, 3, 2, 3";
                    (dataView.metadata.objects as any).valueAxis.gridlineStyle = "custom";
                    (dataView.metadata.objects as any).valueAxis.gridlineDashArray = customPattern;
                    (dataView.metadata.objects as any).valueAxis.gridlineScale = false;
                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    visualBuilder.yAxisTicks[0].querySelectorAll("line").forEach((element: Element) => {
                        const elementComputedStyle: CSSStyleDeclaration = getComputedStyle(element);
                        const dashArray: string = elementComputedStyle.getPropertyValue("stroke-dasharray");
                        // Browser adds 'px' units to the dash array values
                        expect(dashArray).toBe("5px, 3px, 2px, 3px");
                    });
                });

                it("custom gridline style with scaling", () => {
                    const customPattern: string = "5, 3, 2, 3";
                    const gridlineWidth: number = 2;
                    (dataView.metadata.objects as any).valueAxis.gridlineStyle = "custom";
                    (dataView.metadata.objects as any).valueAxis.gridlineDashArray = customPattern;
                    (dataView.metadata.objects as any).valueAxis.gridlineScale = true;
                    (dataView.metadata.objects as any).valueAxis.gridlineWidth = gridlineWidth;
                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    const expectedDashArray: string = customPattern
                        .split(",")
                        .map(s => parseFloat(s.trim()) * gridlineWidth + "px")
                        .join(", ");

                    visualBuilder.yAxisTicks[0].querySelectorAll("line").forEach((element: Element) => {
                        const elementComputedStyle: CSSStyleDeclaration = getComputedStyle(element);
                        const dashArray: string = elementComputedStyle.getPropertyValue("stroke-dasharray");
                        expect(dashArray).toBe(expectedDashArray);
                    });
                });

                it("gridline transparency", () => {
                    const transparency: number = 30; // 30% transparency = 70% opacity
                    (dataView.metadata.objects as any).valueAxis.gridlineTransparency = transparency;
                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    const expectedOpacity: number = (100 - transparency) / 100;
                    visualBuilder.yAxisTicks[0].querySelectorAll("line").forEach((element: Element) => {
                        const elementComputedStyle: CSSStyleDeclaration = getComputedStyle(element);
                        const opacity: string = elementComputedStyle.getPropertyValue("opacity");
                        expect(parseFloat(opacity)).toBeCloseTo(expectedOpacity, 2);
                    });
                });

                it("gridline dash cap", () => {
                    const dashCap: string = "square";
                    (dataView.metadata.objects as any).valueAxis.gridlineStyle = "dashed";
                    (dataView.metadata.objects as any).valueAxis.gridlineDashCap = dashCap;
                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    visualBuilder.yAxisTicks[0].querySelectorAll("line").forEach((element: Element) => {
                        const elementComputedStyle: CSSStyleDeclaration = getComputedStyle(element);
                        const lineCap: string = elementComputedStyle.getPropertyValue("stroke-linecap");
                        expect(lineCap).toBe(dashCap);
                    });
                });

                it("should remove domain lines when grid lines are shown", () => {
                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    // Check that Y-axis domain line is removed
                    const yAxisDomain = visualBuilder.svgScrollableAxisGraphicsContext.querySelector(".domain");
                    expect(yAxisDomain).toBeNull();

                    // Check that X-axis domain line is removed  
                    const xAxisDomain = visualBuilder.rootAxisGraphicsContext.querySelector(".domain");
                    expect(xAxisDomain).toBeNull();
                });

                it("multiple gridline properties applied together", () => {
                    const color: string = "#FF5733";
                    const width: number = 3;
                    const transparency: number = 20;
                    const style: string = "dashed";

                    (dataView.metadata.objects as any).valueAxis = {
                        ...((dataView.metadata.objects as any).valueAxis),
                        gridlineColor: getSolidColorStructuralObject(color),
                        gridlineWidth: width,
                        gridlineTransparency: transparency,
                        gridlineStyle: style
                    };

                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    const expectedOpacity: number = (100 - transparency) / 100;
                    const expectedDashArray: string = `${width * 4}px, ${width * 2}px`; // Browser adds px units

                    visualBuilder.yAxisTicks[0].querySelectorAll("line").forEach((element: Element) => {
                        const elementComputedStyle: CSSStyleDeclaration = getComputedStyle(element);

                        assertColorsMatch(elementComputedStyle.getPropertyValue("stroke"), color);
                        expect(parseFloat(elementComputedStyle.getPropertyValue("stroke-width"))).toBe(width);
                        expect(parseFloat(elementComputedStyle.getPropertyValue("opacity"))).toBeCloseTo(expectedOpacity, 2);
                        expect(elementComputedStyle.getPropertyValue("stroke-dasharray")).toBe(expectedDashArray);
                    });
                });

                it("default gridline style fallback", () => {
                    (dataView.metadata.objects as any).valueAxis.gridlineStyle = "unknown";
                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    visualBuilder.yAxisTicks[0].querySelectorAll("line").forEach((element: Element) => {
                        const elementComputedStyle: CSSStyleDeclaration = getComputedStyle(element);
                        const dashArray: string = elementComputedStyle.getPropertyValue("stroke-dasharray");
                        expect(dashArray).toBe("none");
                    });
                });

                it("custom pattern with invalid numbers should not break", () => {
                    const invalidPattern: string = "5, abc, 2, 3";
                    (dataView.metadata.objects as any).valueAxis.gridlineStyle = "custom";
                    (dataView.metadata.objects as any).valueAxis.gridlineDashArray = invalidPattern;
                    (dataView.metadata.objects as any).valueAxis.gridlineScale = true;
                    (dataView.metadata.objects as any).valueAxis.gridlineWidth = 2;

                    expect(() => {
                        visualBuilder.updateFlushAllD3Transitions(dataView);
                    }).not.toThrow();

                    visualBuilder.yAxisTicks[0].querySelectorAll("line").forEach((element: Element) => {
                        const elementComputedStyle: CSSStyleDeclaration = getComputedStyle(element);
                        const dashArray: string = elementComputedStyle.getPropertyValue("stroke-dasharray");
                        expect(dashArray).toBe("none");
                    });
                });
            });
            describe("Visual Mode Settings", () => {
                it("should pass correct is100PercentStacked parameter to converter in percentage mode", (done) => {
                    // Spy on the converter to verify the parameter
                    spyOn(BaseColumnChart, 'converter').and.callThrough();

                    dataView.metadata.objects = {
                        valueAxis: {
                            visualMode: "percentage"
                        }
                    };

                    visualBuilder.updateRenderTimeout(dataView, () => {
                        expect(BaseColumnChart.converter).toHaveBeenCalled();

                        // Get the arguments passed to converter
                        const converterArgs = (BaseColumnChart.converter as jasmine.Spy).calls.mostRecent().args[0];
                        expect(converterArgs.is100PercentStacked).toBe(true);
                        done();
                    });
                });

                it("should pass correct is100PercentStacked parameter to converter in absolute mode", (done) => {
                    spyOn(BaseColumnChart, 'converter').and.callThrough();

                    dataView.metadata.objects = {
                        valueAxis: {
                            visualMode: "absolute"
                        }
                    };

                    visualBuilder.updateRenderTimeout(dataView, () => {
                        expect(BaseColumnChart.converter).toHaveBeenCalled();

                        const converterArgs = (BaseColumnChart.converter as jasmine.Spy).calls.mostRecent().args[0];
                        expect(converterArgs.is100PercentStacked).toBe(false);
                        done();
                    });
                });

            });
        });
    });

    describe("MekkoColumnChartData", () => {
        describe("converter", () => {
            let mekkoColumnChartData: MekkoColumnChartData;

            beforeEach((done) => {
                const visualHost: IVisualHost = createVisualHost({});
                visualBuilder.updateRenderTimeout(dataView, () => {
                    visualBuilder.instance.getFormattingModel();
                    mekkoColumnChartData = BaseColumnChart.converter({
                        visualHost,
                        categorical: dataView.categorical,
                        colors: visualHost.colorPalette,
                        is100PercentStacked: true,
                        isScalar: false,
                        supportsOverflow: false,
                        localizationManager: null,
                        settingsModel: visualBuilder.instance.settingsModel,
                        isFormatMode: false
                    });
                    done();
                });
            });

            it("mekkoColumnChartData is defined", () => {
                expect(mekkoColumnChartData).toBeDefined();
                expect(mekkoColumnChartData).not.toBeNull();
            });

            describe("series", () => {
                let series: MekkoChartSeries[];

                beforeEach(() => {
                    series = mekkoColumnChartData.series;
                });

                it("series are defined", () => {
                    expect(series).toBeDefined();
                    expect(series).not.toBeNull();
                });

                it("each element of series is defined", () => {
                    series.map((columnChartSeries: MekkoChartSeries) => {
                        expect(columnChartSeries).toBeDefined();
                        expect(columnChartSeries).not.toBeNull();
                    });
                });

                describe("identity", () => {
                    it("identity is defined", () => {
                        series.map((columnChartSeries: MekkoChartSeries) => {
                            expect(columnChartSeries.identity).toBeDefined();
                            expect(columnChartSeries.identity).not.toBeNull();
                        });
                    });

                    it("identity has key", () => {
                        series.map((columnChartSeries: MekkoChartSeries) => {
                            expect(columnChartSeries.identity.getKey()).toBeDefined();
                        });
                    });
                });
            });
        });
    });

    describe("Data Labels test", () => {
        describe("converter", () => {
            it("nodes border change color", done => {
                let color: string = "#123123";

                dataView.metadata.objects = {
                    columnBorder: {
                        color: getSolidColorStructuralObject(color)
                    }
                };

                visualBuilder.updateRenderTimeout(dataView, () => {
                    const element: HTMLElement = visualBuilder.mainElement.querySelector("rect.mekkoborder");
                    const borderElementComputedStyle: CSSStyleDeclaration = getComputedStyle(element);
                    const elementFillColor: string = borderElementComputedStyle.getPropertyValue("fill");

                    assertColorsMatch(elementFillColor, color);

                    done();
                });

            });

            it("category axes label font-size", done => {
                const categoryAxisFontSize: number = 17,
                    valueAxisFontSize: number = 15;

                dataView.metadata.objects = {
                    categoryAxis: {
                        fontSize: categoryAxisFontSize
                    },
                    valueAxis: {
                        fontSize: valueAxisFontSize
                    }
                };

                visualBuilder.updateRenderTimeout(dataView, () => {
                    const xAxisElement: HTMLElement = visualBuilder.mainElement.querySelector(".x.axis g.tick text");
                    const xAxisElementComputedStyle: CSSStyleDeclaration = getComputedStyle(xAxisElement);
                    const xAxisFontSize: number= parseFloat(xAxisElementComputedStyle.getPropertyValue("font-size"));

                    expect(Math.round(xAxisFontSize)).toBe(Math.round(fromPointToPixel(categoryAxisFontSize)));

                    const yAxisElement: HTMLElement = visualBuilder.mainElement.querySelector(".y.axis g.tick text");
                    const yAxisElementComputedStyle: CSSStyleDeclaration = getComputedStyle(yAxisElement);
                    const yAxisFontSize: number = parseFloat(yAxisElementComputedStyle.getPropertyValue("font-size"));

                    expect(Math.round(yAxisFontSize)).toBe(Math.round(fromPointToPixel(valueAxisFontSize)));

                    done();
                });

            });

            it("Display units - millions", done => {
                dataView.metadata.objects = {
                    labels: {
                        show: true,
                        labelDisplayUnits: 1000000
                    }
                };

                visualBuilder.updateRenderTimeout(dataView, () => {
                    const firstLabelText: string = visualBuilder.dataLabels[0].textContent;

                    expect(firstLabelText).toMatch(/[0-9.]*M/);

                    done();
                });
            });

            it("Display units - thousands", done => {
                dataView.metadata.objects = {
                    labels: {
                        show: true,
                        labelDisplayUnits: 1000
                    }
                };

                visualBuilder.updateRenderTimeout(dataView, () => {
                    const firstLabelText: string = visualBuilder.dataLabels[0].textContent;

                    expect(firstLabelText).toMatch(/[0-9.]*K/);

                    done();
                });

            });

            it("Limit Decimal Places value", done => {
                dataView.metadata.objects = {
                    labels: {
                        show: true,
                        labelDisplayUnits: 0,
                        labelPrecision: 4
                    }
                };
                visualBuilder.updateRenderTimeout(dataView, () => {
                    const firstLabelText: string = visualBuilder.dataLabels[0].textContent;

                    expect(firstLabelText).toMatch(/\d*[.]\d{4}%/);

                    done();
                });
            });
        });
    });

    describe("Mekko chart legend features:", () => {
        beforeEach(() => {
            dataView = defaultDataViewBuilder.getSpecificDataView();
        });

        it("sort legend by value", (done) => {
            dataView.metadata.objects = {
                sortLegend: {
                    enabled: true,
                    direction: "asc",
                    groupByCategory: false,
                    groupByCategoryDirection: "asc"
                }
            };

            interface ValueLegend {
                key: string;
                data: number;
            }
            
            let data = dataView.categorical.values.grouped().map(v => { return { key: v.name, data: sum(v.values[0].values) }; });

            let reduced = {};
            data.forEach(d => {
                reduced[d.key.toString()] = reduced[d.key.toString()] || { data: 0 };
                reduced[d.key.toString()].data += d.data;
            });

            let index = 0;
            let array: Array<ValueLegend> = [];

            for (let key in reduced) {
                array[index++] = {
                    key: key,
                    data: reduced[key].data
                };
            }

            array = array.sort((a, b) => a.data > b.data ? 1 : -1);
            visualBuilder.updateRenderTimeout(dataView, () => {
                expect(document.body.contains(visualBuilder.legendGroup)).toBeTruthy();
                let textElements = visualBuilder.legendGroup.querySelectorAll("g.legendItem > text");
                array.forEach((element, index) => {
                    expect(element.key).toEqual(textElements[index].textContent);
                });
                done();
            }, 300);
        });

        it("group legend by category", (done) => {
            dataView.metadata.objects = {
                sortLegend: {
                    enabled: true,
                    direction: "asc",
                    groupByCategory: true,
                    groupByCategoryDirection: "asc"
                }
            };

            let data = dataView.categorical.values.grouped();
            let catigoried = data.map(d => { return { name: d.name, values: d.values[0].values, category: findIndex(d.values[0].values, i => i !== null) }; });
            catigoried = sortBy(catigoried, "values");

            interface CategoryLegendDom {
                position: string;
                dom: Element;
            }

            visualBuilder.updateRenderTimeout(dataView, () => {
                expect(document.body.contains(visualBuilder.categoryLegendGroup[0])).toBeTruthy();
                expect(visualBuilder.categoryLegendGroup.length).toEqual(dataView.categorical.categories[0].values.length);

                let mappedCategoryLegendGroup: Array<CategoryLegendDom> = Array.from(visualBuilder.categoryLegendGroup).map((clg) => {
                    return <CategoryLegendDom>{
                        position: clg.parentElement.parentElement.style.top.replace("px", ""),
                        dom: clg
                    };
                });

                dataView.categorical.categories[0].values.forEach((category, index) => {
                    let filteredByCategory = catigoried.filter(cat => cat.category === index);
                    filteredByCategory = filteredByCategory.sort((a, b) => a.values > b.values ? 1 : -1);
                    let categoryDOM: Array<CategoryLegendDom> = mappedCategoryLegendGroup.filter((val: CategoryLegendDom, index: number) => { return ((mappedCategoryLegendGroup[index].dom).querySelector("text.legendTitle > title").textContent === category); });
                    let legentItem = ((categoryDOM[0].dom)).querySelectorAll("g.legendItem > title");
                    expect(filteredByCategory.length).toEqual(legentItem.length);
                    filteredByCategory.forEach((categoryItem, index) => {
                        expect(legentItem[index].textContent).toEqual(categoryItem.name?.toString());
                    });
                });
                done();
            }, 300);
        });
    });

    describe("Mekko chart label features:", () => {
        beforeEach(() => {
            dataView = defaultDataViewBuilder.getSpecificDataView();
        });

        it("force display", (done) => {
            dataView.metadata.objects = {
                labels: {
                    show: true,
                    forceDisplay: true
                }
            };

            let countBefore: number = 0;
            visualBuilder.updateRenderTimeout(dataView, () => {
                countBefore = visualBuilder.dataLabels.length;
            });

            dataView.metadata.objects = {
                labels: {
                    show: true,
                    forceDisplay: false
                }
            };

            visualBuilder.updateRenderTimeout(dataView, () => {
                expect(countBefore).toBeGreaterThanOrEqual(visualBuilder.dataLabels.length);
                done();
            });
        });

        it("rotate category label to 45 degrees", (done) => {
            dataView.metadata.objects = {
                xAxisLabels: {
                    enableRotataion: true
                },
                categoryAxis: {
                    showAxisTitle: true,
                    show: true
                },
                valueAxis: {
                    show: true,
                    showAxisTitle: true
                }
            };

            visualBuilder.updateRenderTimeout(dataView, () => {
                let expectedDegree: number = -45;
                visualBuilder.xAxisTicks.forEach((element: HTMLElement) => {
                    const selection = select(element.querySelector("text"));
                    expect(MekkoChart.getTranslation(selection.attr("transform"))[2]).toBeCloseTo(expectedDegree);
                });
                done();
            }, 300);
        });
    });

    describe("Mekko chart series features:", () => {
        beforeEach(() => {
            dataView = defaultDataViewBuilder.getSpecificDataView();
        });

        it("sort series by value", (done) => {
            dataView.metadata.objects = {
                labels: {
                    show: true,
                    forceDisplay: true
                },
                sortSeries: {
                    enabled: true,
                    direction: "asc",
                    displayPercents: "category"
                }
            };

            visualBuilder.updateRenderTimeout(dataView, () => {
                let seriesElements = visualBuilder.mainElement.querySelectorAll(".columnChartMainGraphicsContext > .series");
                let mappedSeries = [];
                const firstCtegory: number = 0;
                const secondCtegory: number = 1;
                const thirdCtegory: number = 2;
                const seriesMainRectanglePositionIndex: number = 0;
                // first category elements
                mappedSeries[firstCtegory] = [];
                mappedSeries[firstCtegory].push(seriesElements[0].children[seriesMainRectanglePositionIndex]);
                mappedSeries[firstCtegory].push(seriesElements[1].children[seriesMainRectanglePositionIndex]);
                mappedSeries[firstCtegory].push(seriesElements[2].children[seriesMainRectanglePositionIndex]);

                // second category elements
                mappedSeries[secondCtegory] = [];
                mappedSeries[secondCtegory].push(seriesElements[3].children[seriesMainRectanglePositionIndex]);
                mappedSeries[secondCtegory].push(seriesElements[4].children[seriesMainRectanglePositionIndex]);
                mappedSeries[secondCtegory].push(seriesElements[5].children[seriesMainRectanglePositionIndex]);

                // third category elements
                mappedSeries[thirdCtegory] = [];
                mappedSeries[thirdCtegory].push(seriesElements[6].children[seriesMainRectanglePositionIndex]);
                mappedSeries[thirdCtegory].push(seriesElements[7].children[seriesMainRectanglePositionIndex]);
                mappedSeries[thirdCtegory].push(seriesElements[8].children[seriesMainRectanglePositionIndex]);

                mappedSeries.forEach((element: any[]) => {
                    let sortedByHeight = sortBy(element, "height");
                    let sortedByPosition = sortBy(element, "y");
                    sortedByHeight.forEach((el, index) => expect(sortedByHeight[index] === sortedByPosition[index]).toBeTruthy());
                });
                done();
            }, 300);
        });
    });

    describe("Highlight test", () => {
        let dataLabels: NodeListOf<HTMLElement>;
        let columns: Element[];
        let columnsWithoutSize: Element[];
        let dataViewWithHighLighted: DataView;
        let highlightedColumnWithoutHeight: boolean = false;

        beforeEach(() => {
            dataViewWithHighLighted = defaultDataViewBuilder.getDataView(undefined, true);
            visualBuilder.update(dataViewWithHighLighted);

            columns = visualBuilder.columnsWithSize;
            columnsWithoutSize = visualBuilder.columnsWithoutSize;
        });

        it("bars rendering", (done) => {
            visualBuilder.updateRenderTimeout(dataViewWithHighLighted, () => {
                const allColumnsLength: number = columns.length;
                let notHighligtedColumnsCount: number = 0;

                columnsWithoutSize.forEach(column => {
                    if (column.matches('.highlight')) {
                        highlightedColumnWithoutHeight = true;
                        return;
                    }
                });
                columns.forEach(column => {
                    const columnComputedStyle: CSSStyleDeclaration = getComputedStyle(column);
                    const columnFillOpacity: string = columnComputedStyle.getPropertyValue("fill-opacity");
                    if (Number(columnFillOpacity) !== 1)
                        notHighligtedColumnsCount++;
                });

                const expectedNonHighlightedColumnsCount: number = highlightedColumnWithoutHeight ? allColumnsLength : allColumnsLength - 1;
                // for data with tiny values
                expect(notHighligtedColumnsCount).toBeLessThanOrEqual(expectedNonHighlightedColumnsCount);
                done();
            });
        });

        it("labels rendering", (done) => {
            dataViewWithHighLighted.metadata.objects = {
                labels: {
                    show: true,
                    forceDisplay: true
                }
            };
            visualBuilder.update(dataViewWithHighLighted);
            visualBuilder.updateRenderTimeout(dataViewWithHighLighted, () => {
                columnsWithoutSize.forEach(column => {
                    if (column.matches(".highlight")) {
                        highlightedColumnWithoutHeight = true;
                        return;
                    }
                });
                dataLabels = visualBuilder.dataLabels;

                const expectedHighlightedDataLabelsCount: number = highlightedColumnWithoutHeight ? 0 : 1;
                // for data with tiny values
                expect(dataLabels.length).toBeGreaterThanOrEqual(expectedHighlightedDataLabelsCount);
                done();
            });
        });
    });

    describe("Keyboard navigation test", () => {
        it("enter toggles the correct column", (done) => {
            const enterEvent = new KeyboardEvent("keydown", { code: "Enter", bubbles: true });
            visualBuilder.updateRenderTimeout(
                dataView, () => {
                    const columns: HTMLElement[] = [...visualBuilder.columns];

                    columns[0].dispatchEvent(enterEvent);
                    expect(columns[0].getAttribute("aria-selected")).toBe("true");

                    const otherColumns: HTMLElement[] = columns.slice(1);
                    otherColumns.forEach((column: HTMLElement) => {
                        expect(column.getAttribute("aria-selected")).toBe("false");
                    });

                    columns[1].dispatchEvent(enterEvent);
                    expect(columns[1].getAttribute("aria-selected")).toBe("true");

                    columns.splice(1,1);
                    columns.forEach((column: HTMLElement) => {
                        expect(column.getAttribute("aria-selected")).toBe("false");
                    });
                    done();
                },
            );
        });

        it("space toggles the correct column", (done) => {
            const enterEvent = new KeyboardEvent("keydown", { code: "Space", bubbles: true });
            visualBuilder.updateRenderTimeout(
                dataView, () => {
                    const columns: HTMLElement[] = [...visualBuilder.columns];

                    columns[0].dispatchEvent(enterEvent);
                    expect(columns[0].getAttribute("aria-selected")).toBe("true");

                    const otherColumns: HTMLElement[] = columns.slice(1);
                    otherColumns.forEach((column: HTMLElement) => {
                        expect(column.getAttribute("aria-selected")).toBe("false");
                    });

                    columns[1].dispatchEvent(enterEvent);
                    expect(columns[1].getAttribute("aria-selected")).toBe("true");

                    columns.splice(1,1);
                    columns.forEach((column: HTMLElement) => {
                        expect(column.getAttribute("aria-selected")).toBe("false");
                    });
                    done();
                },
            );
        });

        it("multiselection should work with ctrlKey", (done) => {
            const enterEventCtrlKey = new KeyboardEvent("keydown", { code: "Enter", bubbles: true, ctrlKey: true });
            visualBuilder.updateRenderTimeout(
                dataView, () => {
                    checkKeyboardMultiSelection(enterEventCtrlKey);
                    done();
                },
            );
        });

        it("multiselection should work with metaKey", (done) => {
            const enterEventMetaKey = new KeyboardEvent("keydown", { code: "Enter", bubbles: true, metaKey: true });
            visualBuilder.updateRenderTimeout(
                dataView, () => {
                    checkKeyboardMultiSelection(enterEventMetaKey);
                    done();
                },
            );
        });

        it("multiselection should work with shiftKey", (done) => {
            const enterEventShiftKey = new KeyboardEvent("keydown", { code: "Enter", bubbles: true, shiftKey: true });
            visualBuilder.updateRenderTimeout(
                dataView, () => {
                    checkKeyboardMultiSelection(enterEventShiftKey);
                    done();
                },
            );
        });

        it("columns can be focused", (done) => {
            visualBuilder.updateRenderTimeout(
                dataView, () => {
                    const columns: HTMLElement[] = [...visualBuilder.columns];
                    columns.forEach((column: HTMLElement) => {
                        expect(column.matches(":focus-visible")).toBeFalse();
                    });

                    columns[0].focus();
                    expect(columns[0].matches(':focus-visible')).toBeTrue();

                    const otherColumns: HTMLElement[] = columns.slice(1);
                    otherColumns.forEach((column: HTMLElement) => {
                        expect(column.matches(":focus-visible")).toBeFalse();
                    });

                    done();
                },
            );
        });

        function checkKeyboardMultiSelection(keyboardMultiselectionEvent: KeyboardEvent): void{
            const enterEvent = new KeyboardEvent("keydown", { code: "Enter", bubbles: true });

            const columns: HTMLElement[] = [...visualBuilder.columns];
            const firstColumn: HTMLElement = columns[0];
            const secondColumn: HTMLElement = columns[1];

            // select first column
            firstColumn.dispatchEvent(enterEvent);
            const firstColumnCSS: CSSStyleDeclaration = getComputedStyle(firstColumn);
            const firstColumnFillOpacity: string = firstColumnCSS.getPropertyValue("fill-opacity");
            // multiselect second column
            secondColumn.dispatchEvent(keyboardMultiselectionEvent);
            const secondColumnCSS: CSSStyleDeclaration = getComputedStyle(secondColumn);
            const secondColumnFillOpacity: string = secondColumnCSS.getPropertyValue("fill-opacity");

            expect(firstColumn.getAttribute("aria-selected")).toBe("true");
            expect(parseFloat(firstColumnFillOpacity)).toBe(1);

            expect(secondColumn.getAttribute("aria-selected")).toBe("true");
            expect(parseFloat(secondColumnFillOpacity)).toBe(1);

            const notSelectedColumns: HTMLElement[] = columns.slice(2);
            notSelectedColumns.forEach((column: HTMLElement) => {
                const columnCSS: CSSStyleDeclaration = getComputedStyle(column);
                const columnFillOpacity: string = columnCSS.getPropertyValue("fill-opacity");
                expect(parseFloat(columnFillOpacity)).toBeLessThan(1);
                expect(column.getAttribute("aria-selected")).toBe("false");
            });
        }
    });
});
