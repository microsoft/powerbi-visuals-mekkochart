import powerbi from "powerbi-visuals-api";
import ISandboxExtendedColorPalette = powerbi.extensibility.ISandboxExtendedColorPalette;
import ISelectionId = powerbi.visuals.ISelectionId;

import { valueFormatter } from "powerbi-visuals-utils-formattingutils";
import IValueFormatter = valueFormatter.IValueFormatter;

import { ColorHelper } from "powerbi-visuals-utils-colorutils";
import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import FormattingSettingsSimpleCard = formattingSettings.SimpleCard;
import FormattingSettingsCompositeCard = formattingSettings.CompositeCard;
import FormattingSettingsGroup = formattingSettings.Group;
import FormattingSettingsCard = formattingSettings.Cards;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;

import { IColumnChart } from "./columnChart/columnChartVisual";
import { BaseColumnChart } from "./columnChart/baseColumnChart";
import { MekkoChartColumnDataPoint, MekkoColumnChartData } from "./dataInterfaces";
import { dataViewWildcard } from "powerbi-visuals-utils-dataviewutils";

class ColumnBorderWidthDefaultOptions {
    public static Width: number = 2;
    public static MinWidth: number = 0;
    public static MaxWidth: number = 5;
}

class FontSizeDefaultOptions {
    public static FontSize: number = 9;
    public static MinFontSize: number = 9;
    public static MaxFontSize: number = 30;
}

class LabelPrecisionDefaultOptions {
    public static LabelPrecision: number = 2;
    public static MinLabelPrecision: number = 0;
    public static MaxLabelPrecision: number = 4;
}

export class ColumnBorderSettings extends FormattingSettingsSimpleCard {

    public name: string = "columnBorder";
    public displayNameKey?: string = "Visual_ColumnBorder";
    
    public show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayNameKey: "Visual_Show",
        value: true
    });

    public topLevelSlice = this.show;

    public color = new formattingSettings.ColorPicker({
        name: "color",
        displayNameKey: "Visual_Color",
        descriptionKey: "Visual_Description_Color",
        value: {value: "#fff"},
    });

    public width = new formattingSettings.NumUpDown({
        name: "width",
        displayNameKey: "Visual_Width",
        value: ColumnBorderWidthDefaultOptions.Width,
        options: {
            minValue: {
                type: powerbi.visuals.ValidatorType.Min,
                value: ColumnBorderWidthDefaultOptions.MinWidth,
            },
            maxValue: {
                type: powerbi.visuals.ValidatorType.Max,
                value: ColumnBorderWidthDefaultOptions.MaxWidth,
            }
        }
    });
    
    public slices: FormattingSettingsSlice[] = [this.color, this.width];
}

export class LegendSettings extends FormattingSettingsCompositeCard {
    public name: string = "legend";
    public displayNameKey: string = "Visual_Legend";
    public visible: boolean = false;

    public show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayNameKey: "Visual_Show",
        value: true
    });

    public topLevelSlice = this.show;

    public showTitle = new formattingSettings.ToggleSwitch({
        name: "showTitle",
        displayNameKey: "Visual_Title",
        value: true
    });

    public titleText = new formattingSettings.TextInput({
        name: "titleText",
        displayNameKey: "Visual_Text",
        value: "",
        placeholder: "Title Text"
    });

    public color = new formattingSettings.ColorPicker({
        name: "color",
        displayNameKey: "Visual_Color",
        descriptionKey: "Visual_Description_Color",
        value: {value: "#252423"},
    });

    public fontControl: formattingSettings.FontControl = new formattingSettings.FontControl({
        name: "fontControl",
        displayNameKey: "Visual_Font_Control",
        fontFamily: new formattingSettings.FontPicker({
            name: "fontFamily",
            displayNameKey: "Visual_Font",
            value: "Arial"
        }),
        fontSize: new formattingSettings.NumUpDown({
            name: "fontSize",
            displayNameKey: "Visual_Font_Size",
            value: FontSizeDefaultOptions.FontSize,
            options: {
                minValue: {
                    type: powerbi.visuals.ValidatorType.Min,
                    value: FontSizeDefaultOptions.MinFontSize,
                },
                maxValue: {
                    type: powerbi.visuals.ValidatorType.Max,
                    value: FontSizeDefaultOptions.MaxFontSize,
                }
            }
        }),
        bold: new formattingSettings.ToggleSwitch({
            name: "fontBold",
            displayNameKey: "Visual_Font_Bold",
            value: false
        }),
        italic: new formattingSettings.ToggleSwitch({
            name: "fontItalic",
            displayNameKey: "Visual_Font_Italic",
            value: false
        }),
        underline: new formattingSettings.ToggleSwitch({
            name: "fontUnderline",
            displayNameKey: "Visual_Font_Underline",
            value: false
        })
    });

    public legendTitleGroup = new formattingSettings.Group({
        name: "titleGroup",
        slices: [this.showTitle, this.titleText, this.color, this.fontControl]
    });

    public groups: FormattingSettingsGroup[] = [this.legendTitleGroup]
}

export class SortLegendSettings extends FormattingSettingsSimpleCard {
    public name: string = "sortLegend";
    public displayNameKey: string = "Visual_SortLegend";
    public visible: boolean = false;

    public enabled = new formattingSettings.ToggleSwitch({
        name: "enabled",
        displayNameKey: "Visual_Enabled",
        value: false
    });

    public topLevelSlice = this.enabled;

    public direction = new formattingSettings.AutoDropdown({
        name: "direction",
        displayNameKey: "Visual_Direction",
        value: "asc"
    });

    public groupByCategory = new formattingSettings.ToggleSwitch({
        name: "groupByCategory",
        displayNameKey: "Visual_Group_Legend",
        value: false,
    });

    public groupByCategoryDirection = new formattingSettings.AutoDropdown({
        name: "groupByCategoryDirection",
        displayNameKey: "Visual_Group_Direction",
        value: "asc"
    });

    public slices: FormattingSettingsSlice[] = [this.direction, this.groupByCategory, this.groupByCategoryDirection];
}

export class LabelsSettings extends FormattingSettingsSimpleCard {
    public name: string = "labels";
    public displayNameKey: string = "Visual_Data_Labels";
    public descriptionKey: string = "Visual_Description_DataLabels";

    public show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayNameKey: "Visual_Show",
        value: false
    });

    public topLevelSlice = this.show;

    public forceDisplay = new formattingSettings.ToggleSwitch({
        name: "forceDisplay",
        displayNameKey: "Visual_Force_Display",
        value: false
    });

    public color = new formattingSettings.ColorPicker({
        name: "color",
        displayNameKey: "Visual_Color",
        descriptionKey: "Visual_Description_Color",
        value: {value: "white"},
    });

    public fontControl: formattingSettings.FontControl = new formattingSettings.FontControl({
        name: "fontControl",
        displayNameKey: "Visual_Font_Control",
        fontFamily: new formattingSettings.FontPicker({
            name: "fontFamily",
            displayNameKey: "Visual_Font",
            value: "Segoe UI, wf_segoe-ui_normal, helvetica, arial, sans-serif"
        }),
        fontSize: new formattingSettings.NumUpDown({
            name: "fontSize",
            displayNameKey: "Visual_Font_Size",
            value: 12,
            options: {
                minValue: {
                    type: powerbi.visuals.ValidatorType.Min,
                    value: FontSizeDefaultOptions.MinFontSize,
                },
                maxValue: {
                    type: powerbi.visuals.ValidatorType.Max,
                    value: FontSizeDefaultOptions.MaxFontSize,
                }
            }
        }),
        bold: new formattingSettings.ToggleSwitch({
            name: "fontBold",
            displayNameKey: "Visual_Font_Bold",
            value: false
        }),
        italic: new formattingSettings.ToggleSwitch({
            name: "fontItalic",
            displayNameKey: "Visual_Font_Italic",
            value: false
        }),
        underline: new formattingSettings.ToggleSwitch({
            name: "fontUnderline",
            displayNameKey: "Visual_Font_Underline",
            value: false
        })
    });

    public displayUnits = new formattingSettings.AutoDropdown({
        name: "labelDisplayUnits",
        displayName: "Display units",
        displayNameKey: "Visual_Display_Units",
        value: 0
    });

    public labelPrecision = new formattingSettings.NumUpDown({
        name: "labelPrecision",
        displayNameKey: "Visual_Decimal_Places",
        descriptionKey: "Visual_Description_DecimalPlaces",
        value: LabelPrecisionDefaultOptions.LabelPrecision,
        options: {
            minValue: {
                type: powerbi.visuals.ValidatorType.Min,
                value: LabelPrecisionDefaultOptions.MinLabelPrecision,
            },
            maxValue: {
                type: powerbi.visuals.ValidatorType.Max,
                value: LabelPrecisionDefaultOptions.MaxLabelPrecision,
            }
        }
    });

    public slices: FormattingSettingsSlice[] = [this.color, this.fontControl, this.displayUnits, this.labelPrecision, this.forceDisplay];
}

export class SeriesSortSettings extends FormattingSettingsSimpleCard {
    public name: string = "sortSeries";
    public displayNameKey: string = "Visual_SortSeries";
    public visible: boolean = false;

    public enabled = new formattingSettings.ToggleSwitch({
        name: "enabled",
        displayNameKey: "Visual_Enabled",
        value: false
    });

    public topLevelSlice = this.enabled;

    public direction = new formattingSettings.AutoDropdown({
        name: "direction",
        displayNameKey: "Visual_Direction",
        value: "asc"
    });

    public displayPercents = new formattingSettings.AutoDropdown({
        name: "displayPercents",
        displayNameKey: "Visual_DisplayPercents",
        value: "category"
    });

    public slices: FormattingSettingsSlice[] = [this.direction, this.displayPercents];
}

export class XAxisLabelsSettings extends FormattingSettingsSimpleCard {
    public name: string = "xAxisLabels";
    public displayNameKey: string = "Visual_XAxisLabelsRotation";

    public enableRotataion = new formattingSettings.ToggleSwitch({
        name: "enableRotataion",
        displayNameKey: "Visual_Enabled",
        value: false
    });

    public slices: FormattingSettingsSlice[] = [this.enableRotataion];
}

export class CategoryAxisSettings extends FormattingSettingsSimpleCard {
    public name: string = "categoryAxis";
    public displayNameKey:string = "Visual_XAxis";

    public show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayNameKey: "Visual_Show",
        value: true
    });

    public topLevelSlice = this.show;

    public showTitle = new formattingSettings.ToggleSwitch({
        name: "showAxisTitle",
        displayNameKey: "Visual_Title",
        value: false
    });

    public labelColor = new formattingSettings.ColorPicker({
        name: "labelColor",
        displayNameKey: "Visual_Color",
        descriptionKey: "Visual_Description_Color",
        value: {value: "black"}
    });

    public fontControl = new formattingSettings.FontControl({
        name: "fontControl",
        displayNameKey: "Visual_Font_Control",
        fontFamily: new formattingSettings.FontPicker({
            name: "fontFamily",
            displayNameKey: "Visual_Font",
            value: "Arial"
        }),
        fontSize: new formattingSettings.NumUpDown({
            name: "fontSize",
            displayNameKey: "Visual_Font_Size",
            value: FontSizeDefaultOptions.FontSize,
            options: {
                minValue: {
                    type: powerbi.visuals.ValidatorType.Min,
                    value: FontSizeDefaultOptions.MinFontSize,
                },
                maxValue: {
                    type: powerbi.visuals.ValidatorType.Max,
                    value: FontSizeDefaultOptions.MaxFontSize,
                }
            }
        }),
        bold: new formattingSettings.ToggleSwitch({
            name: "fontBold",
            displayNameKey: "Visual_Font_Bold",
            value: false
        }),
        italic: new formattingSettings.ToggleSwitch({
            name: "fontItalic",
            displayNameKey: "Visual_Font_Italic",
            value: false
        }),
        underline: new formattingSettings.ToggleSwitch({
            name: "fontUnderline",
            displayNameKey: "Visual_Font_Underline",
            value: false
        })
    });

    public slices: FormattingSettingsSlice[] = [this.showTitle, this.labelColor, this.fontControl];
}

export class ValueAxisSettings extends FormattingSettingsSimpleCard {
    public name: string = "valueAxis";
    public displayNameKey:string = "Visual_YAxis";

    public show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayNameKey: "Visual_Show",
        value: true
    });

    public topLevelSlice = this.show;

    public showTitle = new formattingSettings.ToggleSwitch({
        name: "showAxisTitle",
        displayNameKey: "Visual_Title",
        value: false
    });

    public labelColor = new formattingSettings.ColorPicker({
        name: "labelColor",
        displayNameKey: "Visual_Color",
        descriptionKey: "Visual_Description_Color",
        value: {value: "black"}
    });

    public fontControl = new formattingSettings.FontControl({
        name: "fontControl",
        displayNameKey: "Visual_Font_Control",
        fontFamily: new formattingSettings.FontPicker({
            name: "fontFamily",
            displayNameKey: "Visual_Font",
            value: "Arial"
        }),
        fontSize: new formattingSettings.NumUpDown({
            name: "fontSize",
            displayNameKey: "Visual_Font_Size",
            value: FontSizeDefaultOptions.FontSize,
            options: {
                minValue: {
                    type: powerbi.visuals.ValidatorType.Min,
                    value: FontSizeDefaultOptions.MinFontSize,
                },
                maxValue: {
                    type: powerbi.visuals.ValidatorType.Max,
                    value: FontSizeDefaultOptions.MaxFontSize,
                }
            }
        }),
        bold: new formattingSettings.ToggleSwitch({
            name: "fontBold",
            displayNameKey: "Visual_Font_Bold",
            value: false
        }),
        italic: new formattingSettings.ToggleSwitch({
            name: "fontItalic",
            displayNameKey: "Visual_Font_Italic",
            value: false
        }),
        underline: new formattingSettings.ToggleSwitch({
            name: "fontUnderline",
            displayNameKey: "Visual_Font_Underline",
            value: false
        })
    });

    public slices: FormattingSettingsSlice[] = [this.showTitle, this.labelColor, this.fontControl];
}

export class DataPointSettings extends FormattingSettingsSimpleCard {
    public name: string = "dataPoint";
    public displayNameKey:string = "Visual_Data_Colors";
    public defaultStrokeColor: string = "transparent";

    public defaultColor = new formattingSettings.ColorPicker({
        name: "defaultColor",
        displayNameKey: "Visual_Default_Color",
        value: {value: "#01B8AA"},
        instanceKind: powerbi.VisualEnumerationInstanceKinds.ConstantOrRule,
        selector: dataViewWildcard.createDataViewWildcardSelector(dataViewWildcard.DataViewWildcardMatchingOption.InstancesAndTotals),
        altConstantSelector: null,
        visible: false
    });

    public showAllDataPoints = new formattingSettings.ToggleSwitch({
        name: "showAllDataPoints",
        displayNameKey: "Visual_DataPoint_Show_All",
        value: false,
        visible: false
    })

    public slices: FormattingSettingsSlice[] = [this.defaultColor, this.showAllDataPoints];
}

export class DrillControlCard extends FormattingSettingsSimpleCard{
    public name: string = "drillControl";
    public displayNameKey:string = "Visual_DrillControl";

    public enabled = new formattingSettings.ToggleSwitch({
        name: "enabled",
        displayNameKey: "Visual_Enabled",
        value: true
    });

    public slices: FormattingSettingsSlice[] = [this.enabled];
}

export class VisualFormattingSettingsModel extends FormattingSettingsModel {
    public columnBorder: ColumnBorderSettings = new ColumnBorderSettings();
    public legend: LegendSettings = new LegendSettings();
    public sortLegend: SortLegendSettings = new SortLegendSettings();
    public labels: LabelsSettings = new LabelsSettings();
    public sortSeries: SeriesSortSettings = new SeriesSortSettings();
    public xAxisLabels: XAxisLabelsSettings = new XAxisLabelsSettings();
    public categoryAxis: CategoryAxisSettings = new CategoryAxisSettings();
    public valueAxis: ValueAxisSettings = new ValueAxisSettings();
    public dataPoint: DataPointSettings = new DataPointSettings();
    public drillControl: DrillControlCard = new DrillControlCard();

    public cards: FormattingSettingsCard[] = [
        this.columnBorder,
        this.labels, 
        this.legend,
        this.sortLegend,
        this.sortSeries,
        this.categoryAxis,
        this.xAxisLabels,
        this.valueAxis,
        this.dataPoint,
        this.drillControl
    ];

    public setHighContrastMode(colorPalette: ISandboxExtendedColorPalette): void {
        const isHighContrastMode: boolean = colorPalette.isHighContrast;
        if (isHighContrastMode){
            const foregroundColor: string = colorPalette.foreground.value;
            const backgroundColor: string = colorPalette.background.value;

            this.columnBorder.color.value.value = backgroundColor;
            this.labels.color.value.value = foregroundColor;
            this.categoryAxis.labelColor.value.value = foregroundColor;
            this.valueAxis.labelColor.value.value = foregroundColor;
            this.dataPoint.defaultStrokeColor = foregroundColor;
        }

        this.dataPoint.visible = !isHighContrastMode;
        this.columnBorder.color.visible = !isHighContrastMode;
        this.labels.color.visible = !isHighContrastMode;
        this.categoryAxis.labelColor.visible = !isHighContrastMode;
        this.valueAxis.labelColor.visible = !isHighContrastMode;
    }

    public setDataPointColorPickerSlices(layers: IColumnChart[]) {
        for (let i: number = 0; i < layers.length; i++) {
            for (const series of (<BaseColumnChart>layers[i]).getData().series) {
                if (this.dataPoint.slices.some((dataPointColorSelector: FormattingSettingsSlice) => dataPointColorSelector.displayName === series.displayName)){
                    return;
                }
                this.dataPoint.slices.push(
                    new formattingSettings.ColorPicker({
                        name: "fill",
                        displayName: series.displayName,
                        selector: ColorHelper.normalizeSelector(series.identity.getSelector()),
                        value: {value: series.color}
                    })
                );
            }
        }
    }
    public setDataPointColorPickerSlicesSingleSeries(data: MekkoColumnChartData){
        const singleSeriesData: MekkoChartColumnDataPoint[] = data.series[0].data;
        const categoryFormatter: IValueFormatter = data.categoryFormatter;

        for (let i: number = 0; i < singleSeriesData.length && this.dataPoint.showAllDataPoints.value; i++) {
            const singleSeriesDataPoint: MekkoChartColumnDataPoint = singleSeriesData[i];
            const categoryValue: any = data.categories[i];
            const formattedName: string = categoryFormatter ? categoryFormatter.format(categoryValue) : categoryValue;

            if (this.dataPoint.slices.some((dataPointColorSelector: FormattingSettingsSlice) => dataPointColorSelector.displayName === formattedName)){
                return;
            }
            this.dataPoint.slices.push(
                new formattingSettings.ColorPicker({
                    name: "fill",
                    displayName: formattedName,
                    selector: ColorHelper.normalizeSelector((singleSeriesDataPoint.identity as ISelectionId).getSelector(), true),
                    value: {value: singleSeriesDataPoint.color},
                    visible: data.showAllDataPoints
                })
            )
        }
    }
    public setVisibilityOfFileds(data: MekkoColumnChartData): void {
        // Hide xAxis labels rotation if the categoryAxis is off
        this.xAxisLabels.visible = this.categoryAxis.show.value;

        const seriesCount: number = data.series.length;
        if (data.hasDynamicSeries || seriesCount > 1 || !data.categoryMetadata) {
            this.legend.visible = true;
            this.sortLegend.visible = this.legend.show.value;
            this.sortSeries.visible = true;

            const defaultColorSlice: FormattingSettingsSlice = this.dataPoint.slices[0];
            const showAllSlice: FormattingSettingsSlice = this.dataPoint.slices[1];
            defaultColorSlice.visible = false;
            showAllSlice.visible = false;
        }
        else {
            // For single-category, single-measure column charts, the user cant sort legend or series
            this.legend.visible = false;
            this.sortLegend.visible = false;
            this.sortSeries.visible = false;

            const defaultColorSlice: FormattingSettingsSlice = this.dataPoint.slices[0];
            const showAllSlice: FormattingSettingsSlice = this.dataPoint.slices[1];
            defaultColorSlice.visible = true;
            showAllSlice.visible = true;
        }
    }
}
