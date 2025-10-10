import powerbi from "powerbi-visuals-api";

import SubSelectionStyles = powerbi.visuals.SubSelectionStyles;
import VisualSubSelectionShortcuts = powerbi.visuals.VisualSubSelectionShortcuts;
import SubSelectionStylesType = powerbi.visuals.SubSelectionStylesType;
import VisualShortcutType = powerbi.visuals.VisualShortcutType;
import TextSubSelectionStyles = powerbi.visuals.TextSubSelectionStyles;
import NumericTextSubSelectionStyles = powerbi.visuals.NumericTextSubSelectionStyles;
import CustomVisualSubSelection = powerbi.visuals.CustomVisualSubSelection;
import CustomSubSelectionStyleType = powerbi.visuals.CustomSubSelectionStyleType;

import ILocalizationManager = powerbi.extensibility.ILocalizationManager;

import { IAxisReference, IFontReference, IXAxisLabelsRotationReference } from "./interfaces";
import { columnBorderReferences, dataPointReferences, labelsReferences, legendReferences, sortLegendReferences, sortSeriesReferences, xAxisReferences, yAxisReferences } from "./references";

export class SubSelectionStylesService {
    private static GetSubselectionStylesForText(objectReference: IFontReference): TextSubSelectionStyles {
        return {
            type: SubSelectionStylesType.Text,
            fontFamily: {
                reference: {
                    ...objectReference.fontFamily
                },
                label: objectReference.fontFamily.propertyName
            },
            bold: {
                reference: {
                    ...objectReference.bold
                },
                label: objectReference.bold.propertyName
            },
            italic: {
                reference: {
                    ...objectReference.italic
                },
                label: objectReference.italic.propertyName
            },
            underline: {
                reference: {
                    ...objectReference.underline
                },
                label: objectReference.underline.propertyName
            },
            fontSize: {
                reference: {
                    ...objectReference.fontSize
                },
                label: objectReference.fontSize.propertyName
            },
            fontColor: {
                reference: {
                    ...objectReference.color
                },
                label: objectReference.color.propertyName
            }
        };
    }

    public static GetLegendStyles(): SubSelectionStyles {
        return SubSelectionStylesService.GetSubselectionStylesForText(legendReferences);
    }

    public static GetLabelsStyles(): SubSelectionStyles {
        const textStyles: NumericTextSubSelectionStyles = {
            ...this.GetSubselectionStylesForText(labelsReferences),
            type: SubSelectionStylesType.NumericText,
            displayUnits: {
                reference: {
                    ...labelsReferences.displayUnits
                },
                label: labelsReferences.displayUnits.propertyName
            },
            precision: {
                reference: {
                    ...labelsReferences.precision
                },
                label: labelsReferences.precision.propertyName
            }
        };

        return textStyles;
    }

    public static GetXAxisStyles(): SubSelectionStyles {
        return SubSelectionStylesService.GetSubselectionStylesForText(xAxisReferences);
    }

    public static GetYAxisStyles(localizationManager: ILocalizationManager): SubSelectionStyles | null {
        return {
            type: SubSelectionStylesType.Shape,
            fill: {
                reference: {
                    ...yAxisReferences.gridlineColor
                },
                label: localizationManager.getDisplayName("Visual_Gridline_Color")
            }
        }
    }

    public static GetYAxisTickTextStyles(): SubSelectionStyles {
        return SubSelectionStylesService.GetSubselectionStylesForText(yAxisReferences);
    }

    public static GetDataPointStyles(subSelections: CustomVisualSubSelection[], localizationManager: ILocalizationManager): SubSelectionStyles {
        const selector = subSelections[0].customVisualObjects[0].selectionId?.getSelector();
        return {
            type: SubSelectionStylesType.Shape,
            fill: {
                reference: {
                    ...dataPointReferences.fill,
                    selector
                },
                label: localizationManager.getDisplayName("Visual_Fill")
            },
            stroke: {
                reference: {
                    ...columnBorderReferences.border
                },
                label: localizationManager.getDisplayName("Visual_ColumnBorder")
            },
        }
    }
}

export class SubSelectionShortcutsService {
    public static GetLegendShortcuts(localizationManager: ILocalizationManager): VisualSubSelectionShortcuts {
        return [
            {
                type: VisualShortcutType.Toggle,
                ...legendReferences.show,
                disabledLabel: localizationManager.getDisplayName("Visual_Delete")
            },
            {
                type: VisualShortcutType.Toggle,
                ...legendReferences.showTitle,
                enabledLabel: localizationManager.getDisplayName("Visual_AddTitle")
            },
            {
                type: VisualShortcutType.Toggle,
                ...sortLegendReferences.enabled,
                enabledLabel: localizationManager.getDisplayName("Visual_EnableSort"),
                disabledLabel: localizationManager.getDisplayName("Visual_DisableSort")
            },
            {
                type: VisualShortcutType.Picker,
                ...sortLegendReferences.direction,
                label: localizationManager.getDisplayName("Visual_Direction")
            },
            {
                type: VisualShortcutType.Toggle,
                ...sortLegendReferences.groupByCategory,
                enabledLabel: localizationManager.getDisplayName("Visual_EnableGroupByCategory"),
                disabledLabel: localizationManager.getDisplayName("Visual_DisableGroupByCategory")
            },
            {
                type: VisualShortcutType.Picker,
                ...sortLegendReferences.groupByCategoryDirection,
                label: localizationManager.getDisplayName("Visual_Group_Direction")
            },
            {
                type: VisualShortcutType.Divider,
            },
            {
                type: VisualShortcutType.Reset,
                relatedResetFormattingIds: [
                    legendReferences.bold,
                    legendReferences.fontFamily,
                    legendReferences.fontSize,
                    legendReferences.italic,
                    legendReferences.underline,
                    legendReferences.color,
                    legendReferences.showTitle,
                    legendReferences.titleText,
                    sortLegendReferences.enabled,
                    sortLegendReferences.direction,
                    sortLegendReferences.groupByCategory,
                    sortLegendReferences.groupByCategoryDirection,
                ]
            },
            {
                type: VisualShortcutType.Navigate,
                destinationInfo: { cardUid: legendReferences.cardUid, groupUid: legendReferences.groupUid },
                label: localizationManager.getDisplayName("Visual_FormatLegend")
            }
        ];
    }

    public static GetLegendTitleShortcuts(localizationManager: ILocalizationManager): VisualSubSelectionShortcuts {
        return [
            {
                type: VisualShortcutType.Toggle,
                ...legendReferences.showTitle,
                disabledLabel: localizationManager.getDisplayName("Visual_Delete")
            },
            {
                type: VisualShortcutType.Divider,
            },
            {
                type: VisualShortcutType.Reset,
                relatedResetFormattingIds: [
                    legendReferences.showTitle,
                    legendReferences.titleText
                ]
            },
            {
                type: VisualShortcutType.Navigate,
                destinationInfo: { cardUid: legendReferences.cardUid, groupUid: legendReferences.groupUid },
                label: localizationManager.getDisplayName("Visual_FormatTitle")
            }
        ];
    }

    public static GetLabelsShortcuts(localizationManager: ILocalizationManager): VisualSubSelectionShortcuts {
        return [
            {
                type: VisualShortcutType.Toggle,
                ...labelsReferences.show,
                disabledLabel: localizationManager.getDisplayName("Visual_Delete")
            },
            {
                type: VisualShortcutType.Toggle,
                ...labelsReferences.forceDisplay,
                enabledLabel: localizationManager.getDisplayName("Visual_EnableForceDisplay"),
                disabledLabel: localizationManager.getDisplayName("Visual_DisableForceDisplay")
            },
            {
                type: VisualShortcutType.Divider,
            },
            {
                type: VisualShortcutType.Reset,
                relatedResetFormattingIds: [
                    labelsReferences.show,
                    labelsReferences.forceDisplay
                ]
            },
            {
                type: VisualShortcutType.Navigate,
                destinationInfo: { cardUid: labelsReferences.cardUid, groupUid: labelsReferences.groupUid },
                label: localizationManager.getDisplayName("Visual_FormatLabels")
            }
        ];
    }

    private static GetAxisShortcuts(axisReference: IAxisReference, displayKey: string, localizationManager: ILocalizationManager): VisualSubSelectionShortcuts {
        const xAxisInterface = axisReference as IXAxisLabelsRotationReference;
        return [
            {
                type: VisualShortcutType.Toggle,
                ...axisReference.show,
                disabledLabel: localizationManager.getDisplayName("Visual_Delete")
            },
            {
                type: VisualShortcutType.Toggle,
                ...axisReference.showTitle,
                enabledLabel: localizationManager.getDisplayName("Visual_AddTitle")
            },
            xAxisInterface?.enableRotation ? {
                type: VisualShortcutType.Toggle,
                ...xAxisInterface.enableRotation,
                enabledLabel: localizationManager.getDisplayName("Visual_EnableLabelsRotation"),
                disabledLabel: localizationManager.getDisplayName("Visual_DisableLabelsRotation")
            } : null,
            {
                type: VisualShortcutType.Divider,
            },
            {
                type: VisualShortcutType.Reset,
                relatedResetFormattingIds: [
                    axisReference.bold,
                    axisReference.fontFamily,
                    axisReference.fontSize,
                    axisReference.italic,
                    axisReference.underline,
                    axisReference.color,
                    axisReference.show,
                    xAxisInterface?.enableRotation
                ]
            },
            {
                type: VisualShortcutType.Navigate,
                destinationInfo: { cardUid: axisReference.cardUid, groupUid: axisReference.groupUid },
                label: localizationManager.getDisplayName(displayKey)
            }
        ];
    }

    public static GetAxisTitleShortcuts(axisReference: IAxisReference, localizationManager: ILocalizationManager): VisualSubSelectionShortcuts {
        return [
            {
                type: VisualShortcutType.Toggle,
                ...axisReference.showTitle,
                disabledLabel: localizationManager.getDisplayName("Visual_Delete")
            },
            {
                type: VisualShortcutType.Divider,
            },
            {
                type: VisualShortcutType.Reset,
                relatedResetFormattingIds: [
                    axisReference.showTitle
                ]
            },
            {
                type: VisualShortcutType.Navigate,
                destinationInfo: { cardUid: axisReference.cardUid, groupUid: axisReference.groupUid },
                label: localizationManager.getDisplayName("Visual_FormatTitle")
            }
        ];
    }

    public static GetXAxisShortcuts(localizationManager: ILocalizationManager): VisualSubSelectionShortcuts {
        return SubSelectionShortcutsService.GetAxisShortcuts(xAxisReferences, "Visual_FormatXAxis", localizationManager);
    }

    public static GetXAxisTitleShortcuts(localizationManager: ILocalizationManager): VisualSubSelectionShortcuts {
        return SubSelectionShortcutsService.GetAxisTitleShortcuts(xAxisReferences, localizationManager);
    }

    public static GetYAxisShortcuts(localizationManager: ILocalizationManager): VisualSubSelectionShortcuts {
        return [
            {
                type: VisualShortcutType.Picker,
                ...yAxisReferences.visualMode,
                label: localizationManager.getDisplayName("Visual_Mode"),
            },
            ...SubSelectionShortcutsService.GetAxisShortcuts(yAxisReferences, "Visual_FormatYAxis", localizationManager),
        ];
    }

    public static GetYAxisTitleShortcuts(localizationManager: ILocalizationManager): VisualSubSelectionShortcuts {
        return SubSelectionShortcutsService.GetAxisTitleShortcuts(yAxisReferences, localizationManager);
    }

    public static GetDataPointShortcuts(localizationManager: ILocalizationManager): VisualSubSelectionShortcuts {
        return [
            {
                type: VisualShortcutType.Toggle,
                ...dataPointReferences.showAllDataPoints,
                enabledLabel: localizationManager.getDisplayName("Visual_EnableShowAllDataPoints"),
                disabledLabel: localizationManager.getDisplayName("Visual_DisableShowAllDataPoints")
            },
            {
                type: VisualShortcutType.Toggle,
                ...columnBorderReferences.show,
                enabledLabel: localizationManager.getDisplayName("Visual_ShowBorder"),
                disabledLabel: localizationManager.getDisplayName("Visual_HideBorder")
            },
            {
                type: VisualShortcutType.Toggle,
                ...sortSeriesReferences.enabled,
                enabledLabel: localizationManager.getDisplayName("Visual_EnableSortSeries"),
                disabledLabel: localizationManager.getDisplayName("Visual_DisableSortSeries")
            },
            {
                type: VisualShortcutType.Picker,
                ...sortSeriesReferences.direction,
                label: localizationManager.getDisplayName("Visual_Direction")
            },
            {
                type: VisualShortcutType.Picker,
                ...sortSeriesReferences.displayPercents,
                label: localizationManager.getDisplayName("Visual_DisplayPercents")
            },
            {
                type: VisualShortcutType.Divider,
            },
            {
                type: VisualShortcutType.Reset,
                relatedResetFormattingIds: [
                    dataPointReferences.fill,
                    dataPointReferences.defaultColor,
                    dataPointReferences.showAllDataPoints,
                    columnBorderReferences.show,
                    columnBorderReferences.border,
                    sortSeriesReferences.enabled,
                    sortSeriesReferences.direction,
                    sortSeriesReferences.displayPercents
                ]
            },
            {
                type: VisualShortcutType.Navigate,
                destinationInfo: { cardUid: dataPointReferences.cardUid, groupUid: dataPointReferences.groupUid },
                label: localizationManager.getDisplayName("Visual_FormatDataColors")
            }
        ];
    }
}