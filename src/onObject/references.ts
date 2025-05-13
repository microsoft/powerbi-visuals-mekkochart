import powerbi from "powerbi-visuals-api";
import SubSelectableDirectEdit = powerbi.visuals.SubSelectableDirectEdit;
import SubSelectableDirectEditStyle = powerbi.visuals.SubSelectableDirectEditStyle;

import { IAxisReference, IFontReference, ILabelsReference, ILegendReference, ISortLegendReference } from "./interfaces";
import { MekkoChartObjectNames } from "../settings";

const createBaseFontReference = (objectName: string, colorName: string = ""): IFontReference => {
    return {
        fontFamily: {
            objectName: objectName,
            propertyName: `fontFamily`
        },
        bold: {
            objectName: objectName,
            propertyName: `fontBold`
        },
        italic: {
            objectName: objectName,
            propertyName: `fontItalic`
        },
        underline: {
            objectName: objectName,
            propertyName: `fontUnderline`
        },
        fontSize: {
            objectName: objectName,
            propertyName: `fontSize`
        },
        color: {
            objectName: objectName,
            propertyName: colorName ? `${colorName}Color` : `color`
        }
    }
}

export const legendReferences: ILegendReference = {
    ...createBaseFontReference(MekkoChartObjectNames.Legend),
    cardUid: "Visual-legend-card",
    groupUid: "legend-group",
    show: {
        objectName: MekkoChartObjectNames.Legend,
        propertyName: "show"
    },
    showTitle: {
        objectName: MekkoChartObjectNames.Legend,
        propertyName: "showTitle"
    },
    titleText: {
        objectName: MekkoChartObjectNames.Legend,
        propertyName: "titleText"
    }
}

export const TitleEdit: SubSelectableDirectEdit = {
    reference: {
        objectName: MekkoChartObjectNames.Legend,
        propertyName: "titleText"
    },
    style: SubSelectableDirectEditStyle.HorizontalLeft,
}

export const titleEditSubSelection = JSON.stringify(TitleEdit);

export const sortLegendReferences: ISortLegendReference = {
    cardUid: "Visual-sortLegend-card",
    enabled: {
        objectName: MekkoChartObjectNames.SortLegend,
        propertyName: "enabled"
    },
    direction: {
        objectName: MekkoChartObjectNames.SortLegend,
        propertyName: "direction"
    },
    groupByCategory: {
        objectName: MekkoChartObjectNames.SortLegend,
        propertyName: "groupByCategory"
    },
    groupByCategoryDirection: {
        objectName: MekkoChartObjectNames.SortLegend,
        propertyName: "groupByCategoryDirection"
    }
}

export const labelsReferences: ILabelsReference = {
    ...createBaseFontReference(MekkoChartObjectNames.Labels),
    cardUid: "Visual-labels-card",
    groupUid: "labels-group",
    show: {
        objectName: MekkoChartObjectNames.Labels,
        propertyName: "show"
    },
    forceDisplay: {
        objectName: MekkoChartObjectNames.Labels,
        propertyName: "forceDisplay"
    },
    displayUnits: {
        objectName: MekkoChartObjectNames.Labels,
        propertyName: "labelDisplayUnits"
    },
    precision: {
        objectName: MekkoChartObjectNames.Labels,
        propertyName: "labelPrecision"
    }
}

export const xAxisReferences: IAxisReference = {
    ...createBaseFontReference(MekkoChartObjectNames.XAxis, "label"),
    cardUid: "Visual-categoryAxis-card",
    groupUid: "categoryAxis-group",
    show: {
        objectName: MekkoChartObjectNames.XAxis,
        propertyName: "show"
    },
    showTitle: {
        objectName: MekkoChartObjectNames.XAxis,
        propertyName: "showAxisTitle"
    },
}

export const yAxisReferences: IAxisReference = {
    ...createBaseFontReference(MekkoChartObjectNames.YAxis, "label"),
    cardUid: "Visual-valueAxis-card",
    groupUid: "valueAxis-group",
    show: {
        objectName: MekkoChartObjectNames.YAxis,
        propertyName: "show"
    },
    showTitle: {
        objectName: MekkoChartObjectNames.YAxis,
        propertyName: "showAxisTitle"
    },
}
