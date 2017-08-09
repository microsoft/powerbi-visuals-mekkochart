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
    import createLinearColorScale = powerbi.extensibility.utils.color.createLinearColorScale;

    // powerbi.extensibility.utils.chart
    import LegendIcon = powerbi.extensibility.utils.chart.legend.LegendIcon;
    import ILegendData = powerbi.extensibility.utils.chart.legend.LegendData;

    // formattingUtils
    import getFormattedLegendLabel = formattingUtils.getFormattedLegendLabel;

    export class BaseConverterStrategy implements ConverterStrategy {
        private static WidthColumnName: string = "Width";
        private static YColumnName: string = "Y";

        private static SortField: string = "categoryValue";

        private dataView: DataViewCategorical;
        private visualHost: IVisualHost;

        constructor(dataView: DataViewCategorical, visualHost: IVisualHost) {
            this.dataView = dataView;
            this.visualHost = visualHost;
        }

        private static hasRole(column: DataViewMetadataColumn, name: string): boolean {
            return column.roles && column.roles[name];
        }

        public getLegend(colorPalette: IColorPalette, defaultLabelLegendColor?: string, defaultColor?: string, colorGradient?: boolean, colorGradientEndColor?: string): LegendSeriesInfo {
            const legend: MekkoLegendDataPoint[] = [];
            const seriesSources: DataViewMetadataColumn[] = [];
            const seriesObjects: DataViewObjects[][] = [];

            let grouped: boolean = false;
            let legendTitle: string = undefined;

            const colorHelper: ColorHelper = new ColorHelper(
                colorPalette,
                MekkoChart.Properties["dataPoint"]["fill"],
                defaultLabelLegendColor
            );

            let categoryMaxValues: ICategotyValuesStatsCollection = { };
            this.dataView.categories[0].values.forEach( (category, index) => {
                categoryMaxValues[index] = {
                    category: category,
                    maxValueOfCategory: d3.max(this.dataView.values.map(v => <number>v.values[index])),
                    maxItemOfCategory: d3.sum(this.dataView.values.map(v => <number>v.values[index] !== undefined ? 1 : 0)),
                    minValueOfCategory: d3.min(this.dataView.values.map(v => <number>v.values[index]))
                };
            });

            // find base color identity
            // todo handle color change of 
            let valueGroups: DataViewValueColumnGroup[] = this.dataView.values.grouped();
            let categoryGradientStartBaseColorIdentities: BaseColorIdentity[] = [];
            let categoryGradientEndBaseColorIdentities: BaseColorIdentity[] = [];
            let categoryItemsCount: Array<IFilteredValueGroups[]> = [];
            this.dataView.categories[0].values.forEach( (category: PrimitiveValue, index: number) => {
                // gradiend start color
                let mappedItems: IFilteredValueGroups[] = valueGroups.map( group => {
                    return <IFilteredValueGroups>{
                        gr: group,
                        categoryValue: group.values[0].values[index],
                        categoryIndex: index,
                        category: category,
                        identity: group.identity
                    };
                }).filter(v => v.categoryValue !== null);

                categoryItemsCount[index] = mappedItems;

                if (colorGradient) {
                    categoryItemsCount[index] = _.sortBy(categoryItemsCount[index], BaseConverterStrategy.SortField);
                }

                let baseStartColorIdentity: IFilteredValueGroups = _.maxBy(mappedItems, BaseConverterStrategy.SortField);
                if (baseStartColorIdentity === undefined) {
                    return;
                }

                let colorStart: string = defaultLabelLegendColor;

                if (baseStartColorIdentity.gr.objects !== undefined && (<Fill>(<any>baseStartColorIdentity.gr.objects).dataPoint.fill).solid !== undefined) {
                    colorStart = (<Fill>(<any>baseStartColorIdentity.gr.objects).dataPoint.fill).solid.color;
                }

                categoryGradientStartBaseColorIdentities[index] = {
                    category: baseStartColorIdentity.category.toString(),
                    color: colorStart,
                    identity: baseStartColorIdentity.gr.identity,
                    group: baseStartColorIdentity.gr
                };

                // gradiend end color
                let baseEndColorIdentity: IFilteredValueGroups = _.minBy(valueGroups.map( group => {
                    return <IFilteredValueGroups>{
                        gr: group,
                        categoryValue: group.values[0].values[index],
                        categoryIndex: index,
                        category: category,
                        identity: group.identity
                    };
                }), BaseConverterStrategy.SortField);

                if (baseEndColorIdentity === undefined) {
                    return;
                }

                let colorEnd: string = defaultLabelLegendColor;

                if (baseEndColorIdentity.gr.objects !== undefined && (<Fill>(<any>baseEndColorIdentity.gr.objects).dataPoint.fill).solid !== undefined) {
                    colorEnd = (<Fill>(<any>baseEndColorIdentity.gr.objects).dataPoint.fill).solid.color;
                }

                categoryGradientEndBaseColorIdentities[index] = {
                    category: baseEndColorIdentity.category.toString(),
                    color: colorEnd,
                    identity: baseEndColorIdentity.gr.identity,
                    group: baseEndColorIdentity.gr
                };
            });

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
                        let category: string;

                        let color: string;
                        if (!colorGradient) {
                            color = hasDynamicSeries ? colorHelper.getColorForSeriesValue(valueGroupObjects || source.objects, source.groupName)
                                : colorHelper.getColorForMeasure(valueGroupObjects || source.objects, source.queryName);
                        }
                        else {
                            let categoryIndex: number = _.findIndex(series.values, value => value);

                            let positionIndex: number = _.findIndex(<IFilteredValueGroups[]>categoryItemsCount[categoryIndex], ser => ser.identity === series.identity );
                            category = categoryMaxValues[categoryIndex].category.toString();
                            let gradientBaseColorStart: string = colorHelper.getColorForSeriesValue(categoryGradientStartBaseColorIdentities[categoryIndex].group.objects, category);
                            let gradientBaseColorEnd: string = colorHelper.getColorForSeriesValue(categoryGradientEndBaseColorIdentities[categoryIndex].group.objects, category);

                            color = createLinearColorScale(
                                [0, categoryItemsCount[categoryIndex].length],
                                [gradientBaseColorEnd, gradientBaseColorStart], true)
                                (positionIndex);
                        }

                        legend.push({
                            color,
                            label,
                            icon: LegendIcon.Box,
                            identity: selectionId,
                            selected: false,
                            valueSum: d3.sum(<number[]>series.values),
                            categoryValues: series.values,
                            category: category
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
