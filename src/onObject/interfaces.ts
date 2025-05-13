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