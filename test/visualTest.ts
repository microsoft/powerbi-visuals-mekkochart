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
    // powerbi.extensibility.utils.type
    import toString = powerbi.extensibility.utils.type.PixelConverter.toString;
    import fromPointToPixel = powerbi.extensibility.utils.type.PixelConverter.fromPointToPixel;

    // powerbi.extensibility.utils.test
    import clickElement = powerbi.extensibility.utils.test.helpers.clickElement;
    import createVisualHost = powerbi.extensibility.utils.test.mocks.createVisualHost;
    import MockISelectionId = powerbi.extensibility.utils.test.mocks.MockISelectionId;
    import assertColorsMatch = powerbi.extensibility.utils.test.helpers.color.assertColorsMatch;

    // powerbi.extensibility.visual.test
    import MekkoChartData = powerbi.extensibility.visual.test.MekkoChartData;
    import MekkoChartBuilder = powerbi.extensibility.visual.test.MekkoChartBuilder;
    import isTextElementInOrOutElement = powerbi.extensibility.visual.test.helpers.isTextElementInOrOutElement;
    import getSolidColorStructuralObject = powerbi.extensibility.visual.test.helpers.getSolidColorStructuralObject;

    // MekkoChart1449744733038
    import MekkoChartSeries = powerbi.extensibility.visual.MekkoChart1449744733038.MekkoChartSeries;
    import MekkoVisualChartType = powerbi.extensibility.visual.MekkoChart1449744733038.MekkoVisualChartType;
    import MekkoColumnChartData = powerbi.extensibility.visual.MekkoChart1449744733038.MekkoColumnChartData;
    import BaseColumnChart = powerbi.extensibility.visual.MekkoChart1449744733038.columnChart.BaseColumnChart;

    describe("MekkoChart", () => {
        let visualBuilder: MekkoChartBuilder,
            defaultDataViewBuilder: MekkoChartData,
            dataView: DataView;

        beforeEach(() => {
            let selectionIndex: number = 0;

            visualBuilder = new MekkoChartBuilder(1000, 500);
            defaultDataViewBuilder = new MekkoChartData();

            dataView = defaultDataViewBuilder.getDataView();

            powerbi.extensibility.utils.test.mocks.createSelectionId = () => {
                return new MockISelectionId(`${++selectionIndex}`);
            };
        });

        describe("DOM tests", () => {
            it("main element created", () => {
                visualBuilder.updateRenderTimeout(dataView, () => {
                    expect(visualBuilder.mainElement[0]).toBeInDOM();
                });
            });

            it("update", (done) => {
                visualBuilder.updateRenderTimeout(dataView, () => {
                    expect(visualBuilder.categoriesAxis).toBeInDOM();
                    expect(visualBuilder.categoriesAxis.children("g.tick").length)
                        .toBe(dataView.categorical.categories[0].values.length);

                    expect(visualBuilder.columnElement).toBeInDOM();

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
                    expect(visualBuilder.element.find(".legend")).toHaveCss({ display: "none" });
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
                    expect(visualBuilder.element.find(".legend")).toHaveCss({ display: "none" });

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
                    expect(visualBuilder.xAxisLabel).not.toBeInDOM();
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

                clickElement(firstColumn);
                clickElement(secondColumn, true);

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

                    expect(visualBuilder.dataLabels).toBeInDOM();

                    (dataView.metadata.objects as any).labels.show = false;

                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    expect(visualBuilder.dataLabels).not.toBeInDOM();
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

                    expect(visualBuilder.legendGroup.children()).toBeInDOM();

                    (dataView.metadata.objects as any).legend.show = false;
                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    expect(visualBuilder.legendGroup.children()).not.toBeInDOM();
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

                    expect(visualBuilder.xAxisTicks).toBeInDOM();

                    (dataView.metadata.objects as any).categoryAxis.show = false;
                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    expect(visualBuilder.xAxisTicks).not.toBeInDOM();
                });

                it("show title", () => {
                    (dataView.metadata.objects as any).categoryAxis.showAxisTitle = true;
                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    expect(visualBuilder.xAxisLabel).toBeInDOM();

                    (dataView.metadata.objects as any).categoryAxis.showAxisTitle = false;
                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    expect(visualBuilder.xAxisLabel).not.toBeInDOM();
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

                    expect(visualBuilder.yAxisTicks).toBeInDOM();

                    (dataView.metadata.objects as any).valueAxis.show = false;
                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    expect(visualBuilder.yAxisTicks).not.toBeInDOM();
                });

                it("show title", () => {
                    (dataView.metadata.objects as any).valueAxis.showAxisTitle = true;
                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    expect(visualBuilder.yAxisLabel).toBeInDOM();

                    (dataView.metadata.objects as any).valueAxis.showAxisTitle = false;
                    visualBuilder.updateFlushAllD3Transitions(dataView);

                    expect(visualBuilder.yAxisLabel).not.toBeInDOM();
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
    });
}
