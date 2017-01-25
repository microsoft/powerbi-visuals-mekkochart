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

    // formattingUtils
    import getFormattedLegendLabel = formattingUtils.getFormattedLegendLabel;

    export class BaseConverterStrategy implements ConverterStrategy {
        private dataView: DataViewCategorical;
        private visualHost: IVisualHost;

        constructor(dataView: DataViewCategorical, visualHost: IVisualHost) {
            this.dataView = dataView;
            this.visualHost = visualHost;
        }

        private static hasRole(column: DataViewMetadataColumn, name: string): boolean {
            var roles = column.roles;
            return roles && roles[name];
        }

        public getLegend(colorPalette: IColorPalette, defaultColor?: string): LegendSeriesInfo {
            var legend: MekkoLegendDataPoint[] = [];
            var seriesSources: DataViewMetadataColumn[] = [];
            var seriesObjects: DataViewObjects[][] = [];
            var grouped: boolean = false;

            var colorHelper = new ColorHelper(colorPalette, MekkoChart.Properties["dataPoint"]["fill"], defaultColor);
            var legendTitle = undefined;
            if (this.dataView && this.dataView.values) {
                var allValues = this.dataView.values;
                var valueGroups = allValues.grouped();

                var hasDynamicSeries = !!(allValues && allValues.source);

                for (var valueGroupsIndex = 0, valueGroupsLen = valueGroups.length; valueGroupsIndex < valueGroupsLen; valueGroupsIndex++) {
                    var valueGroup = valueGroups[valueGroupsIndex],
                        valueGroupObjects = valueGroup.objects,
                        values = valueGroup.values;

                    for (var valueIndex = 0, valuesLen = values.length; valueIndex < valuesLen; valueIndex++) {
                        var series: DataViewValueColumn = values[valueIndex];
                        var source: DataViewMetadataColumn = series.source;
                        // Gradient measures do not create series.
                        if (BaseConverterStrategy.hasRole(source, 'Width') && !BaseConverterStrategy.hasRole(source, 'Y')) {
                            continue;
                        }

                        seriesSources.push(source);
                        seriesObjects.push(series.objects);

                        // TODO: check it
                        /* var selectionId = undefined;/*series.identity
                            ? SelectionId.createWithIdAndMeasure(series.identity, source.queryName)
                            : SelectionId.createWithMeasure(this.getMeasureNameByIndex(valueIndex));*/

                        const categoryColumn: DataViewCategoryColumn = {
                            source: series.source,
                            identity: [series.identity],
                            values: undefined
                        };

                        var selectionId: ISelectionId = this.visualHost.createSelectionIdBuilder()
                            .withCategory(categoryColumn, 0)
                            .withMeasure(this.getMeasureNameByIndex(valueIndex))
                            .createSelectionId();

                        var label = getFormattedLegendLabel(source, allValues);

                        var color = hasDynamicSeries
                            ? colorHelper.getColorForSeriesValue(valueGroupObjects || source.objects, /*allValues.identityFields,*/ source.groupName)
                            : colorHelper.getColorForMeasure(valueGroupObjects || source.objects, source.queryName);

                        legend.push({
                            icon: LegendIcon.Box,
                            color: color,
                            label: label,
                            identity: selectionId,
                            selected: false,
                        });

                        if (series.identity && source.groupName !== undefined) {
                            grouped = true;
                        }
                    }
                }

                var dvValues: DataViewValueColumns = this.dataView.values;
                legendTitle = dvValues && dvValues.source ? dvValues.source.displayName : "";
            }

            var legendData = {
                title: legendTitle,
                dataPoints: legend,
                grouped: grouped,
            };

            return {
                legend: legendData,
                seriesSources: seriesSources,
                seriesObjects: seriesObjects,
            };
        }

        public getValueBySeriesAndCategory(series: number, category: number): number {
            return <number>this.dataView.values[series].values[category];
        }

        public getMeasureNameByIndex(index: number): string {
            return this.dataView.values[index].source.queryName;
        }

        public hasHighlightValues(series: number): boolean {
            var column = this.dataView && this.dataView.values ? this.dataView.values[series] : undefined;
            return column && !!column.highlights;
        }

        public getHighlightBySeriesAndCategory(series: number, category: number): number {
            return <number>this.dataView.values[series].highlights[category];
        }
    }
}
