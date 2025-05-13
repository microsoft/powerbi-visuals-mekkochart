import powerbi from "powerbi-visuals-api";

import SubSelectionStyles = powerbi.visuals.SubSelectionStyles;
import VisualSubSelectionShortcuts = powerbi.visuals.VisualSubSelectionShortcuts;
import SubSelectionStylesType = powerbi.visuals.SubSelectionStylesType;
import VisualShortcutType = powerbi.visuals.VisualShortcutType;
import TextSubSelectionStyles = powerbi.visuals.TextSubSelectionStyles;
import NumericTextSubSelectionStyles = powerbi.visuals.NumericTextSubSelectionStyles;

import ILocalizationManager = powerbi.extensibility.ILocalizationManager;

import { IFontReference } from "./interfaces";
import { labelsReferences, legendReferences, sortLegendReferences } from "./references";

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
}

export class SubSelectionShortcutsService {
    public static GetLegendShortcuts(localizationManager: ILocalizationManager): VisualSubSelectionShortcuts{
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
}