import powerbi from "powerbi-visuals-api";
import SubSelectableDirectEdit = powerbi.visuals.SubSelectableDirectEdit;
import SubSelectableDirectEditStyle = powerbi.visuals.SubSelectableDirectEditStyle;

import { IAxisReference, IYAxisReference, IColumnBorderReference, IDataPointReference, IFontReference, ILabelsReference, ILegendReference, ISortLegendReference, ISortSeriesReference, IXAxisLabelsRotationReference } from "./interfaces";
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

export const xAxisReferences: IXAxisLabelsRotationReference = {
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
    enableRotation: {
        objectName: MekkoChartObjectNames.XAxisRotation,
        propertyName: "enableRotataion"
    }
}

export const yAxisReferences: IYAxisReference = {
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
    visualMode: {
        objectName: MekkoChartObjectNames.YAxis,
        propertyName: "visualMode"
    },
    gridlineColor: {
        objectName: MekkoChartObjectNames.YAxis,
        propertyName: "gridlineColor"
    }
}

export const dataPointReferences: IDataPointReference = {
    cardUid: "Visual-dataPoint-card",
    groupUid: "dataPoint-group",
    fill: {
        objectName: MekkoChartObjectNames.DataPoint,
        propertyName: "fill"
    },
    defaultColor: {
        objectName: MekkoChartObjectNames.DataPoint,
        propertyName: "defaultColor"
    },
    showAllDataPoints: {
        objectName: MekkoChartObjectNames.DataPoint,
        propertyName: "showAllDataPoints"
    }
}

export const columnBorderReferences: IColumnBorderReference = {
    cardUid: "Visual-columnBorder-card",
    groupUid: "columnBorder-group",
    border: {
        objectName: MekkoChartObjectNames.ColumnBorder,
        propertyName: "color"
    },
    show: {
        objectName: MekkoChartObjectNames.ColumnBorder,
        propertyName: "show"
    }
}

export const sortSeriesReferences: ISortSeriesReference = {
    cardUid: "Visual-sortSeries-card",
    enabled: {
        objectName: MekkoChartObjectNames.SortSeries,
        propertyName: "enabled"
    },
    direction: {
        objectName: MekkoChartObjectNames.SortSeries,
        propertyName: "direction"
    },
    displayPercents: {
        objectName: MekkoChartObjectNames.SortSeries,
        propertyName: "displayPercents"
    }
}
