import powerbi from "powerbi-visuals-api";

import IPoint = powerbi.extensibility.IPoint;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import VisualOnObjectFormatting = powerbi.extensibility.visual.VisualOnObjectFormatting;
import ILocalizationManager = powerbi.extensibility.ILocalizationManager;

import ISelectionId = powerbi.visuals.ISelectionId;
import CustomVisualSubSelection = powerbi.visuals.CustomVisualSubSelection;
import SubSelectionStyles = powerbi.visuals.SubSelectionStyles;
import VisualSubSelectionShortcuts = powerbi.visuals.VisualSubSelectionShortcuts;
import SubSelectionStylesType = powerbi.visuals.SubSelectionStylesType;

import { select as d3Select } from "d3-selection";
import { HtmlSubSelectionHelper, SubSelectableObjectNameAttribute } from "powerbi-visuals-utils-onobjectutils";

import { MekkoChartObjectNames } from "../settings";
import { SubSelectionStylesService, SubSelectionShortcutsService } from "./helperServices";

export class MekkoChartOnObjectService implements VisualOnObjectFormatting {
    private localizationManager: ILocalizationManager;
    private htmlSubSelectionHelper: HtmlSubSelectionHelper;
    private getSelectionId: (stackedValue: any) => ISelectionId;
    private calculatePoints: (identity: ISelectionId) => IPoint[];

    constructor(element: HTMLElement, host: IVisualHost, localizationManager: ILocalizationManager,
        getSelectionId?: (stackedValue: any) => ISelectionId,
        calculatePoints?: (identity: ISelectionId) => IPoint[]
    ) {
        this.localizationManager = localizationManager;
        this.getSelectionId = getSelectionId;
        this.calculatePoints = calculatePoints;
        this.htmlSubSelectionHelper = HtmlSubSelectionHelper.createHtmlSubselectionHelper({
            hostElement: element,
            subSelectionService: host.subSelectionService,
            selectionIdCallback: (e) => this.selectionIdCallback(e),
            customOutlineCallback: (e) => this.customOutlineCallback(e)
        });
    }

    public setFormatMode(isFormatMode: boolean): void {
        this.htmlSubSelectionHelper.setFormatMode(isFormatMode);
    }

    public updateOutlinesFromSubSelections(subSelections: CustomVisualSubSelection[], clearExistingOutlines?: boolean, suppressRender?: boolean): void {
        this.htmlSubSelectionHelper.updateOutlinesFromSubSelections(subSelections, clearExistingOutlines, suppressRender);
    }

    public getSubSelectables(filter?: SubSelectionStylesType): CustomVisualSubSelection[] | undefined{
        return this.htmlSubSelectionHelper.getAllSubSelectables(filter);
    }

    public getSubSelectionStyles(subSelections: CustomVisualSubSelection[]): SubSelectionStyles | undefined{
        const visualObject = subSelections[0]?.customVisualObjects[0];

        if (visualObject) {
            switch (visualObject.objectName) {
                case MekkoChartObjectNames.Legend:
                    return SubSelectionStylesService.GetLegendStyles();
                case MekkoChartObjectNames.Labels:
                    return SubSelectionStylesService.GetLabelsStyles();
                case MekkoChartObjectNames.XAxis:
                    return SubSelectionStylesService.GetXAxisStyles();
            }
        }
    }

    public getSubSelectionShortcuts(subSelections: CustomVisualSubSelection[]): VisualSubSelectionShortcuts | undefined{
        const visualObject = subSelections[0]?.customVisualObjects[0];

        if (visualObject) {
            switch (visualObject.objectName) {
                case MekkoChartObjectNames.Legend:
                    return SubSelectionShortcutsService.GetLegendShortcuts(this.localizationManager);
                case MekkoChartObjectNames.LegendTitle:
                    return SubSelectionShortcutsService.GetLegendTitleShortcuts(this.localizationManager);
                case MekkoChartObjectNames.Labels:
                    return SubSelectionShortcutsService.GetLabelsShortcuts(this.localizationManager);
                case MekkoChartObjectNames.XAxis:
                    return SubSelectionShortcutsService.GetXAxisShortcuts(this.localizationManager);
                case MekkoChartObjectNames.XAxisTitle:
                    return SubSelectionShortcutsService.GetXAxisTitleShortcuts(this.localizationManager);
            }
        }
    }

    public selectionIdCallback(e: Element): powerbi.visuals.ISelectionId {
        const elementType: string = d3Select(e).attr(SubSelectableObjectNameAttribute);

        switch (elementType) {
            default:
                return undefined;
        }
    }

    public customOutlineCallback(subSelections: CustomVisualSubSelection): powerbi.visuals.SubSelectionRegionOutlineFragment[] {
        const elementType: string = subSelections.customVisualObjects[0].objectName;

        switch (elementType) {
            default:
                return undefined;
        }
    }
}