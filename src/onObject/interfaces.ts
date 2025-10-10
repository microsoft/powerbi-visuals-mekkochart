import powerbi from "powerbi-visuals-api";

import GroupFormattingModelReference = powerbi.visuals.GroupFormattingModelReference;
import FormattingId = powerbi.visuals.FormattingId;

export interface IFontReference extends GroupFormattingModelReference {
    fontFamily: FormattingId;
    bold: FormattingId;
    italic: FormattingId;
    underline: FormattingId;
    fontSize: FormattingId;
    color: FormattingId;
}

export interface ILegendReference extends IFontReference {
    show: FormattingId;
    showTitle: FormattingId;
    titleText: FormattingId;
}

export interface ISortLegendReference extends GroupFormattingModelReference {
    enabled: FormattingId;
    direction: FormattingId;
    groupByCategory: FormattingId;
    groupByCategoryDirection: FormattingId;
}

export interface ILabelsReference extends IFontReference {
    show: FormattingId;
    forceDisplay: FormattingId;
    displayUnits: FormattingId;
    precision: FormattingId;
}

export interface IAxisReference extends IFontReference {
    show: FormattingId;
    showTitle: FormattingId;
}

export interface IYAxisReference extends IAxisReference {
    visualMode: FormattingId;
    gridlineColor: FormattingId;
}

export interface IXAxisLabelsRotationReference extends IAxisReference {
    enableRotation: FormattingId;
}

export interface IDataPointReference extends GroupFormattingModelReference {
    fill: FormattingId;
    defaultColor: FormattingId;
    showAllDataPoints: FormattingId;
}

export interface IColumnBorderReference extends GroupFormattingModelReference {
    border: FormattingId;
    show: FormattingId;
}

export interface ISortSeriesReference extends GroupFormattingModelReference {
    enabled: FormattingId;
    direction: FormattingId;
    displayPercents: FormattingId;
}