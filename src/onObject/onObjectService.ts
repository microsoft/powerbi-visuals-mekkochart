import powerbi from "powerbi-visuals-api";

import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import VisualOnObjectFormatting = powerbi.extensibility.visual.VisualOnObjectFormatting;
import ILocalizationManager = powerbi.extensibility.ILocalizationManager;

import ISelectionId = powerbi.visuals.ISelectionId;
import CustomVisualSubSelection = powerbi.visuals.CustomVisualSubSelection;
import SubSelectionStyles = powerbi.visuals.SubSelectionStyles;
import VisualSubSelectionShortcuts = powerbi.visuals.VisualSubSelectionShortcuts;
import SubSelectionStylesType = powerbi.visuals.SubSelectionStylesType;
import SubSelectionRegionOutlineFragment = powerbi.visuals.SubSelectionRegionOutlineFragment;
import SubSelectionOutlineType = powerbi.visuals.SubSelectionOutlineType;
import SubSelectionOutline = powerbi.visuals.SubSelectionOutline;

import { select as d3Select } from "d3-selection";
import { HtmlSubSelectionHelper, SubSelectableObjectNameAttribute } from "powerbi-visuals-utils-onobjectutils";

import { MekkoChartObjectNames } from "../settings";
import { SubSelectionStylesService, SubSelectionShortcutsService } from "./helperServices";
import { RectDataPoint } from "../dataInterfaces";

import { legendInterfaces } from "powerbi-visuals-utils-chartutils";
import ISelectableDataPoint = legendInterfaces.ISelectableDataPoint;

export class MekkoChartOnObjectService implements VisualOnObjectFormatting {
    private localizationManager: ILocalizationManager;
    private htmlSubSelectionHelper: HtmlSubSelectionHelper;
    private calculatePoints: (identity: ISelectionId) => RectDataPoint[];

    constructor(element: HTMLElement, host: IVisualHost, localizationManager: ILocalizationManager,
        calculatePoints?: (identity: ISelectionId) => RectDataPoint[]
    ) {
        this.localizationManager = localizationManager;
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

    public getSubSelectables(filter?: SubSelectionStylesType): CustomVisualSubSelection[] | undefined {
        return this.htmlSubSelectionHelper.getAllSubSelectables(filter);
    }

    public getSubSelectionStyles(subSelections: CustomVisualSubSelection[]): SubSelectionStyles | undefined {
        const visualObject = subSelections[0]?.customVisualObjects[0];

        if (visualObject) {
            switch (visualObject.objectName) {
                case MekkoChartObjectNames.Legend:
                    return SubSelectionStylesService.GetLegendStyles();
                case MekkoChartObjectNames.Labels:
                    return SubSelectionStylesService.GetLabelsStyles();
                case MekkoChartObjectNames.XAxis:
                    return SubSelectionStylesService.GetXAxisStyles();
                case MekkoChartObjectNames.YAxisTickText:
                    return SubSelectionStylesService.GetYAxisTickTextStyles();
                case MekkoChartObjectNames.YAxis:
                    return SubSelectionStylesService.GetYAxisStyles(this.localizationManager);
                case MekkoChartObjectNames.DataPoint:
                    return SubSelectionStylesService.GetDataPointStyles(subSelections, this.localizationManager);
            }
        }
    }

    public getSubSelectionShortcuts(subSelections: CustomVisualSubSelection[]): VisualSubSelectionShortcuts | undefined {
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
                case MekkoChartObjectNames.YAxis:
                case MekkoChartObjectNames.YAxisShort:
                    return SubSelectionShortcutsService.GetYAxisShortcuts(this.localizationManager);
                case MekkoChartObjectNames.YAxisTitle:
                    return SubSelectionShortcutsService.GetYAxisTitleShortcuts(this.localizationManager);
                case MekkoChartObjectNames.DataPoint:
                    return SubSelectionShortcutsService.GetDataPointShortcuts(this.localizationManager);
            }
        }
    }

    public selectionIdCallback(e: Element): powerbi.visuals.ISelectionId {
        const elementType: string = d3Select(e).attr(SubSelectableObjectNameAttribute);

        switch (elementType) {
            case MekkoChartObjectNames.DataPoint: {
                const datum = d3Select<Element, ISelectableDataPoint>(e).datum();
                return datum.identity;
            }
        }
    }

    public customOutlineCallback(subSelections: CustomVisualSubSelection): SubSelectionRegionOutlineFragment[] {
        const elementType: string = subSelections.customVisualObjects[0].objectName;

        switch (elementType) {
            case MekkoChartObjectNames.DataPoint: {
                const subSelectionIdentity: powerbi.visuals.ISelectionId = subSelections.customVisualObjects[0].selectionId;
                const points = this.calculatePoints(subSelectionIdentity);

                const getOutlines = (points: RectDataPoint[]): SubSelectionOutline[] => {
                    const outlines: SubSelectionOutline[] = [];
                    points.forEach((point: RectDataPoint) => {
                        const newOutline: SubSelectionOutline = {
                            type: SubSelectionOutlineType.Rectangle,
                            x: point.x,
                            y: point.y,
                            width: point.width,
                            height: point.height
                        }
                        outlines.push(newOutline);
                    });

                    return outlines;
                }

                const result: SubSelectionRegionOutlineFragment[] = [{
                    id: subSelectionIdentity.getKey(),
                    outline: {
                        type: SubSelectionOutlineType.Group,
                        outlines: getOutlines(points),
                    }
                }];

                return result;
            }
        }
    }
}