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
import toString = pixelConverter.toString;
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
    MekkoVisualChartType
} from "./../src/visualChartType";

import {
    BaseColumnChart
} from "./../src/columnChart/baseColumnChart";

import { MekkoChartBuilder } from "./visualBuilder";

import {
    getSolidColorStructuralObject,
    isTextElementInOrOutElement
} from "./helpers/helpers";

import * as _ from "lodash";
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

        it("main element created", () => {
            visualBuilder.updateRenderTimeout(dataView, () => {
                expect(visualBuilder.mainElement[0]).toBeInDOM();
            });
        });

        it("update", (done) => {
            visualBuilder.updateRenderTimeout(dataView, () => {
                expect(visualBuilder.categoriesAxis[0]).toBeInDOM();
                expect(visualBuilder.categoriesAxis.children("g.tick").length)
                    .toBe(dataView.categorical.categories[0].values.length);

                expect(visualBuilder.columnElement[0]).toBeInDOM();

                let series: JQuery = visualBuilder.columnElement.children("g.series"),
                    grouped: DataViewValueColumnGroup[] = dataView.categorical.values.grouped();

                expect(series.length).toBe(grouped.length);

                for (let i: number = 0, length = series.length; i < length; i++) {
                    expect($(series[i]).children("rect.column").length)
                        .toBe((i === 0
                            ? grouped[i].values[0].values
                            : grouped[i].values[0].values.filter(_.isNumber)).length);
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
                const xTicksElements: HTMLElement[] = visualBuilder.categoriesAxisTicks
                    .children("text")
                    .toArray();

                const columnsBottomPosition: number = visualBuilder.columnElement[0]
                    .getBoundingClientRect()
                    .bottom;

                const xTicksElementsTopPosition: number[] = xTicksElements.map((element: HTMLElement) => {
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
                expect($(visualBuilder.element).find(".legend")).toHaveCss({ display: "none" });
                expect(visualBuilder.mainElement[0]).toHaveCss({ display: "none" });

                done();
            });
        });

        it("visual is visible when chart height is great or equal minimum height", (done) => {
            visualBuilder.viewport = {
                height: 80,
                width: 350
            };

            visualBuilder.updateRenderTimeout(dataView, () => {
                expect($(visualBuilder.element).find(".legend")).toHaveCss({ display: "block" });
                expect(visualBuilder.mainElement[0]).toHaveCss({ display: "block" });

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
                expect($(visualBuilder.element).find(".legend")).toHaveCss({ display: "none" });
                expect(visualBuilder.mainElement[0]).toHaveCss({ display: "none" });

                done();
            });
        });

        it("visual is hidden when chart width is less than minimum width", (done) => {
            visualBuilder.viewport = {
                height: 350,
                width: 49
            };

            visualBuilder.updateRenderTimeout(dataView, () => {
                expect($(visualBuilder.mainElement[0])).toHaveCss({ display: "none" });
                expect($(visualBuilder.element).find(".legend")).toHaveCss({ display: "none" });

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
                expect(visualBuilder.xAxisLabel[0]).not.toBeInDOM();
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
                    visualBuilder.mainElement[0],
                    visualBuilder.xAxisLabel[0]);

                checkAxisLabels(
                    visualBuilder.mainElement[0],
                    visualBuilder.yAxisLabel[0]);

                done();
            }, 300);
        });

        function checkAxisLabels(mainElement: Element, textElement: Element): void {
            expect(isTextElementInOrOutElement(
                visualBuilder.mainElement[0],
                visualBuilder.xAxisLabel[0],
                (firstValue: number, secondValue: number) => firstValue >= secondValue)).toBeTruthy();
        }

        // test case requires new powerbi-visuals-utils-testutils with API 2.1.0 support
        it("multi-selection test", () => {
            dataView = defaultDataViewBuilder.getDataView([
                MekkoChartData.ColumnCategory,
                MekkoChartData.ColumnY
            ]);

            visualBuilder.updateFlushAllD3Transitions(dataView);

            const columns: JQuery = visualBuilder.columnsWithSize;

            const firstColumn: JQuery = columns.eq(0),
                secondColumn: JQuery = columns.eq(1),
                thirdColumn: JQuery = columns.eq(2);

            d3Click(firstColumn, 1, 1, ClickEventType.Default, 0);
            d3Click(secondColumn, 1, 1, ClickEventType.CtrlKey, 0);

            expect(parseFloat(firstColumn.css("fill-opacity"))).toBe(1);
            expect(parseFloat(secondColumn.css("fill-opacity"))).toBe(1);
            expect(parseFloat(thirdColumn.css("fill-opacity"))).toBeLessThan(1);
        });
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
                    .toArray()
                    .forEach((element: Element) => {
                        expect(parseFloat($(element).attr("width"))).toBeGreaterThan(0);
                    });

                (dataView.metadata.objects as any).columnBorder.show = false;

                visualBuilder.updateFlushAllD3Transitions(dataView);

                visualBuilder.borders
                    .toArray()
                    .forEach((element: Element) => {
                        expect(parseFloat($(element).attr("width"))).toBe(0);
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

                expect(visualBuilder.dataLabels[0]).toBeInDOM();

                (dataView.metadata.objects as any).labels.show = false;

                visualBuilder.updateFlushAllD3Transitions(dataView);
                expect(visualBuilder.dataLabels[0]).not.toBeInDOM();
            });

            it("color", () => {
                const color: string = "#ABCDEF";

                (dataView.metadata.objects as any).labels.color = getSolidColorStructuralObject(color);
                visualBuilder.updateFlushAllD3Transitions(dataView);

                visualBuilder.dataLabels
                    .toArray()
                    .forEach((element: Element) => {
                        assertColorsMatch($(element).css("fill"), color);
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

                expect(visualBuilder.legendGroup.children()[0]).toBeInDOM();

                (dataView.metadata.objects as any).legend.show = false;
                visualBuilder.updateFlushAllD3Transitions(dataView);

                expect(visualBuilder.legendGroup.children()[0]).not.toBeInDOM();
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

                expect(visualBuilder.xAxisTicks[0]).toBeInDOM();

                (dataView.metadata.objects as any).categoryAxis.show = false;
                visualBuilder.updateFlushAllD3Transitions(dataView);
                expect(visualBuilder.xAxisTicks[0]).toBeUndefined();
            });

            it("show title", () => {
                (dataView.metadata.objects as any).categoryAxis.showAxisTitle = true;
                visualBuilder.updateFlushAllD3Transitions(dataView);

                expect(visualBuilder.xAxisLabel[0]).toBeInDOM();

                (dataView.metadata.objects as any).categoryAxis.showAxisTitle = false;
                visualBuilder.updateFlushAllD3Transitions(dataView);

                expect(visualBuilder.xAxisLabel[0]).not.toBeInDOM();
            });

            it("color", () => {
                const color: string = "#ABCDEF";

                (dataView.metadata.objects as any).categoryAxis.labelColor = getSolidColorStructuralObject(color);
                visualBuilder.updateFlushAllD3Transitions(dataView);

                visualBuilder.xAxisTicks
                    .children("text")
                    .toArray()
                    .forEach((element: Element) => {
                        assertColorsMatch($(element).css("fill"), color);
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

                expect(visualBuilder.yAxisTicks[0]).toBeInDOM();

                (dataView.metadata.objects as any).valueAxis.show = false;
                visualBuilder.updateFlushAllD3Transitions(dataView);

                expect(visualBuilder.yAxisTicks[0]).not.toBeInDOM();
            });

            it("show title", () => {
                (dataView.metadata.objects as any).valueAxis.showAxisTitle = false;
                visualBuilder.updateFlushAllD3Transitions(dataView);
                expect(visualBuilder.yAxisLabel[0]).not.toBeInDOM();

                (dataView.metadata.objects as any).valueAxis.showAxisTitle = true;
                visualBuilder.updateFlushAllD3Transitions(dataView);
                expect(visualBuilder.yAxisLabel[0]).toBeInDOM();
            });

            it("color", () => {
                const color: string = "#ABCDEF";

                (dataView.metadata.objects as any).valueAxis.labelColor = getSolidColorStructuralObject(color);
                visualBuilder.updateFlushAllD3Transitions(dataView);

                visualBuilder.yAxisTicks
                    .children("text")
                    .toArray()
                    .forEach((element: Element) => {
                        assertColorsMatch($(element).css("fill"), color);
                    });
            });
        });
    });

    describe("MekkoColumnChartData", () => {
        describe("converter", () => {
            let mekkoColumnChartData: MekkoColumnChartData;

            beforeEach(() => {
                const visualHost: IVisualHost = createVisualHost();

                mekkoColumnChartData = BaseColumnChart.converter(
                    visualHost,
                    dataView.categorical,
                    visualHost.colorPalette,
                    true,
                    false,
                    false,
                    dataView.metadata,
                    null,
                    MekkoVisualChartType.hundredPercentStackedBar);
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

            describe("MekkoColumnChartData", () => {
                describe("converter", () => {
                    it("nodes border change color", done => {
                        let color: string = "#123123";

                        dataView.metadata.objects = {
                            columnBorder: {
                                color: getSolidColorStructuralObject(color)
                            }
                        };

                        visualBuilder.updateRenderTimeout(dataView, () => {
                            const fillColor: string = visualBuilder.mainElement
                                .find("rect.mekkoborder")
                                .first()
                                .css("fill");

                            assertColorsMatch(fillColor, color);

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
                            const xAxisFontSize: string = visualBuilder.mainElement
                                .find(".x.axis g.tick text")
                                .first()
                                .attr("font-size");

                            expect(xAxisFontSize).toBe(toString(fromPointToPixel(categoryAxisFontSize)));

                            const yAxisFontSize: string = visualBuilder.mainElement
                                .find(".y.axis g.tick text")
                                .first()
                                .attr("font-size");

                            expect(yAxisFontSize).toBe(toString(fromPointToPixel(valueAxisFontSize)));

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
                            const firstLabelText: string = visualBuilder.dataLabels
                                .first()
                                .text();

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
                            const firstLabelText: string = visualBuilder.dataLabels
                                .first()
                                .text();

                            expect(firstLabelText).toMatch(/[0-9.]*K/);

                            done();
                        });

                    });

                    it("Limit Decimal Places value", done => {
                        dataView.metadata.objects = {
                            labels: {
                                show: true,
                                labelDisplayUnits: 0,
                                labelPrecision: 99
                            }
                        };

                        visualBuilder.updateRenderTimeout(dataView, () => {
                            const firstLabelText: string = visualBuilder.dataLabels
                                .first()
                                .text();

                            expect(firstLabelText).toMatch(/\d*[.]\d{4}%/);

                            done();
                        });
                    });
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

            let data = dataView.categorical.values.grouped().map(v => { return { key: v.name, data: _.sum(v.values[0].values) }; });

            let reduced = {};
            data.forEach(d => {
                reduced[d.key.toString()] = reduced[d.key.toString()] || { data: 0 };
                reduced[d.key.toString()].data += d.data;
            });

            let index = 0;
            let array = [];
            for (let key in reduced) {
                array[index++] = {
                    key: key,
                    data: reduced[key].data
                };
            }

            array = _.sortBy(array, "data");
            visualBuilder.updateRenderTimeout(dataView, () => {
                expect(visualBuilder.legendGroup[0]).toBeInDOM();
                array.forEach((element, index) => {
                    let textElements = visualBuilder.legendGroup.children("g").children("text");
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
            let catigoried = data.map(d => { return { name: d.name, values: d.values[0].values, category: _.findIndex(d.values[0].values, i => i !== null) }; });
            catigoried = _.sortBy(catigoried, "values");

            interface CategoryLegendDom {
                position: string;
                dom: Element;
            }

            visualBuilder.updateRenderTimeout(dataView, () => {
                expect(visualBuilder.categoryLegendGroup[0]).toBeInDOM();
                expect(visualBuilder.categoryLegendGroup.length).toEqual(dataView.categorical.categories[0].values.length);

                let mappedCategoryLegendGroup: JQuery<CategoryLegendDom> = visualBuilder.categoryLegendGroup.map((index, clg) => {
                    return <CategoryLegendDom>{
                        position: clg.parentElement.parentElement.style.top.replace("px", ""),
                        dom: clg
                    };
                });

                dataView.categorical.categories[0].values.forEach((category, index) => {
                    let filteredByCategory = catigoried.filter(cat => cat.category === index);
                    filteredByCategory = _.sortBy(filteredByCategory, "values");
                    let categoryDOM: any = mappedCategoryLegendGroup.filter((val: any) => { return <any>$((<any>mappedCategoryLegendGroup[val]).dom).children("text.legendTitle").children("title").text() === category; });
                    let legentItem = $((categoryDOM[0].dom)).children("g").children("text");
                    expect(filteredByCategory.length).toEqual(legentItem.length);
                    filteredByCategory.forEach((categoryItem, index) => {
                        expect(legentItem[index].textContent).toEqual(categoryItem.name);
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
                visualBuilder.xAxisTicks.children("text").each((index, element) => {
                    expect(MekkoChart.getTranslation(select(element).attr("transform"))[2]).toBeCloseTo(expectedDegree);
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
                let seriesElements = visualBuilder.mainElement.find(".columnChartMainGraphicsContext")[0].children;
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
                    let sortedByHeight = _.sortBy(element, "height");
                    let sortedByPosition = _.sortBy(element, "y");
                    sortedByHeight.forEach((el, index) => expect(sortedByHeight[index] === sortedByPosition[index]).toBeTruthy());
                });
                done();
            }, 300);
        });
    });

    describe("Highlight test", () => {
        let dataLabels: JQuery<any>[];
        let columns: JQuery<any>[];
        let columnsWithoutSize: JQuery<any>[];
        let dataViewWithHighLighted: DataView;
        let highlightedColumnWithoutHeight: boolean = false;

        beforeEach(() => {
            dataViewWithHighLighted = defaultDataViewBuilder.getDataView(undefined, true);
            visualBuilder.update(dataViewWithHighLighted);

            columns = visualBuilder.columnsWithSize.toArray().map($);
            columnsWithoutSize = visualBuilder.columnsWithoutSize.toArray().map($);
        });

        it("bars rendering", (done) => {
            visualBuilder.updateRenderTimeout(dataViewWithHighLighted, () => {
                const allColumnsLength: number = columns.length;
                let notHighligtedColumnsCount: number = 0;

                columnsWithoutSize.forEach(column => {
                    if (column.hasClass("highlight")) {
                        highlightedColumnWithoutHeight = true;
                        return;
                    }
                });
                columns.forEach(column => {
                    if (Number(column.css("fill-opacity")) !== 1)
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
                    if (column.hasClass("highlight")) {
                        highlightedColumnWithoutHeight = true;
                        return;
                    }
                });
                dataLabels = visualBuilder.dataLabels.toArray().map($);

                const expectedHighlightedDataLabelsCount: number = highlightedColumnWithoutHeight ? 0 : 1;
                // for data with tiny values
                expect(dataLabels.length).toBeGreaterThanOrEqual(expectedHighlightedDataLabelsCount);
                done();
            });
        });
    });
});
