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

module powerbi.extensibility.visual.converterStrategy {
    // powerbi.extensibility.utils.color
    import ColorHelper = powerbi.extensibility.utils.color.ColorHelper;

    // powerbi.extensibility.utils.chart
    import LegendIcon = powerbi.extensibility.utils.chart.legend.LegendIcon;
    import ILegendData = powerbi.extensibility.utils.chart.legend.LegendData;

    // formattingUtils
    import getFormattedLegendLabel = formattingUtils.getFormattedLegendLabel;

    export class BaseConverterStrategy implements ConverterStrategy {
        private static WidthColumnName: string = "Width";
        private static YColumnName: string = "Y";

        private dataView: DataViewCategorical;
        private visualHost: IVisualHost;

        constructor(dataView: DataViewCategorical, visualHost: IVisualHost) {
            this.dataView = dataView;
            this.visualHost = visualHost;
        }

        private static hasRole(column: DataViewMetadataColumn, name: string): boolean {
            return column.roles && column.roles[name];
        }

        public getLegend(colorPalette: IColorPalette, defaultColor?: string): LegendSeriesInfo {
            const legend: MekkoLegendDataPoint[] = [];
            const seriesSources: DataViewMetadataColumn[] = [];
            const seriesObjects: DataViewObjects[][] = [];

            let grouped: boolean = false;
            let legendTitle: string = undefined;

            const colorHelper: ColorHelper = new ColorHelper(
                colorPalette,
                MekkoChart.Properties["dataPoint"]["fill"],
                defaultColor);

            if (this.dataView && this.dataView.values) {
                const allValues: DataViewValueColumns = this.dataView.values;
                const valueGroups: DataViewValueColumnGroup[] = allValues.grouped();
                const hasDynamicSeries: boolean = !!(allValues && allValues.source);

                for (let valueGroupsIndex: number = 0; valueGroupsIndex < valueGroups.length; valueGroupsIndex++) {
                    const valueGroup: DataViewValueColumnGroup = valueGroups[valueGroupsIndex];
                    const valueGroupObjects: DataViewObjects = valueGroup.objects;
                    const values: DataViewValueColumn[] = valueGroup.values;

                    for (let valueIndex: number = 0; valueIndex < values.length; valueIndex++) {
                        const series: DataViewValueColumn = values[valueIndex];
                        const source: DataViewMetadataColumn = series.source;

                        // Gradient measures do not create series.
                        if (BaseConverterStrategy.hasRole(source, BaseConverterStrategy.WidthColumnName)
                            && !BaseConverterStrategy.hasRole(source, BaseConverterStrategy.YColumnName)) {

                            continue;
                        }

                        seriesSources.push(source);
                        seriesObjects.push(series.objects);

                        const categoryColumn: DataViewCategoryColumn = {
                            source: series.source,
                            identity: [series.identity],
                            values: undefined
                        };

                        const selectionId: ISelectionId = this.visualHost.createSelectionIdBuilder()
                            .withCategory(categoryColumn, 0)
                            .withMeasure(this.getMeasureNameByIndex(valueIndex))
                            .createSelectionId();

                        const label: string = getFormattedLegendLabel(source, allValues);

                        const color: string = hasDynamicSeries
                            ? colorHelper.getColorForSeriesValue(
                                valueGroupObjects || source.objects,
                                source.groupName)
                            : colorHelper.getColorForMeasure(
                                valueGroupObjects || source.objects,
                                source.queryName);

                        let avialableCategories = {};
                        series.values.forEach((ser: PrimitiveValue, index: number) => {
                            avialableCategories[index] = ser;
                        });

                        legend.push({
                            color,
                            label,
                            icon: LegendIcon.Box,
                            identity: selectionId,
                            selected: false,
                            valueSum: d3.sum(<number[]>series.values),
                            categoryValues: series.values
                        });

                        if (series.identity && source.groupName !== undefined) {
                            grouped = true;
                        }
                    }
                }

                legendTitle = allValues && allValues.source
                    ? allValues.source.displayName
                    : "";
            }

            const legendData: ILegendData = {
                title: legendTitle,
                dataPoints: legend,
                grouped: grouped,
            };

            return {
                seriesSources,
                seriesObjects,
                legend: legendData
            };
        }

        public getValueBySeriesAndCategory(series: number, category: number): number {
            return this.dataView.values[series].values[category] as number;
        }

        public getMeasureNameByIndex(index: number): string {
            return this.dataView.values[index].source.queryName;
        }

        public hasHighlightValues(series: number): boolean {
            const valueColumn: DataViewValueColumn = this.dataView && this.dataView.values
                ? this.dataView.values[series]
                : undefined;

            return valueColumn && !!valueColumn.highlights;
        }

        public getHighlightBySeriesAndCategory(series: number, category: number): number {
            return this.dataView.values[series].highlights[category] as number;
        }
    }
}
