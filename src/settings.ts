import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

import FormattingSettingsCard = formattingSettings.Card;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;

import { MekkoChart } from "./visual";

export class ColumnBorderSettings extends FormattingSettingsCard {

    public name: string = "columnBorder";
    public displayNameKey?: string = "Visual_ColumnBorder";

    public show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayNameKey: "Visual_Show",
        value: true,
        topLevelToggle: true
    });

    public color = new formattingSettings.ColorPicker({
        name: "color",
        displayNameKey: "Visual_Color",
        descriptionKey: "Visual_Description_Color",
        value: {value: MekkoChart.DefaultSettings.columnBorder.color},
    });

    public width = new formattingSettings.NumUpDown({
        name: "width",
        displayNameKey: "Visual_Width",
        value: MekkoChart.DefaultSettings.columnBorder.width
    });

    public slices: FormattingSettingsSlice[] = [this.show, this.color, this.width];
}

export class LegendSettings extends FormattingSettingsCard {
    public name: string = "legend";
    public displayNameKey: string = "Visual_Legend";

    public show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayNameKey: "Visual_Show",
        value: true,
        topLevelToggle: true
    });

    public showTitle = new formattingSettings.ToggleSwitch({
        name: "showTitle",
        displayNameKey: "Visual_Title",
        value: true
    });

    public titleText = new formattingSettings.TextInput({
        name: "titleText",
        displayNameKey: "Visual_Text",
        value: "Title Text",
        placeholder: "Title Text"
    });
    
    public fontFamily = new formattingSettings.FontPicker({
        name: "fontFamily",
        displayNameKey: "Visual_Font",
        value: "Arial"
    });

    public fontSize = new formattingSettings.NumUpDown({
        name: "fontSize",
        displayNameKey: "Visual_Font_Size",
        value: 9
    });

    public slices: FormattingSettingsSlice[] = [this.show, this.showTitle, this.titleText, this.fontFamily, this.fontSize];
}

export class SortLegendSettings extends FormattingSettingsCard {
    public name: string = "sortLegend";
    public displayNameKey: string = "Visual_SortLegend";

    public enabled = new formattingSettings.ToggleSwitch({
        name: "enabled",
        displayNameKey: "Visual_Enabled",
        value: false,
        topLevelToggle: true
    });

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
    public slices: FormattingSettingsSlice[] = [this.enabled, this.direction, this.groupByCategory, this.groupByCategoryDirection];
}
export class LabelsSettings extends FormattingSettingsCard {
    public name: string = "labels";
    public displayNameKey: string = "Visual_Data_Labels";
    public descriptionKey: string = "Visual_Description_DataLabels";

    public show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayNameKey: "Visual_Show",
        value: false,
        topLevelToggle: true
    });

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

    public labelPrecision = new formattingSettings.NumUpDown({
        name: "labelPrecision",
        displayNameKey: "Visual_Decimal_Places",
        descriptionKey: "Visual_Description_DecimalPlaces",
        value: 1
    });

    public showAll = new formattingSettings.ToggleSwitch({
        name: "showAll",
        displayNameKey: "Visual_Show_All",
        value: false
    });

    public fontSize = new formattingSettings.NumUpDown({
        name: "fontSize",
        displayNameKey: "Visual_Font_Size",
        value: 9
    });

    public slices: FormattingSettingsSlice[] = [this.show, this.forceDisplay, this.color, this.labelPrecision, this.fontSize];
}

export class SeriesSortSettings extends FormattingSettingsCard {
    public name: string = "sortSeries";
    public displayNameKey: string = "Visual_SortSeries";

    public enabled = new formattingSettings.ToggleSwitch({
        name: "enabled",
        displayNameKey: "Visual_Enabled",
        value: false,
        topLevelToggle: true
    });

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

    public slices: FormattingSettingsSlice[] = [this.enabled, this.direction, this.displayPercents];
}

export class XAxisLabelsSettings extends FormattingSettingsCard {
    public name: string = "xAxisLabels";
    public displayNameKey: string = "Visual_XAxisLabelsRotation";

    public enableRotataion = new formattingSettings.ToggleSwitch({
        name: "enableRotataion",
        displayNameKey: "Visual_Enabled",
        value: false,
        topLevelToggle: true
    });

    public slices: FormattingSettingsSlice[] = [this.enableRotataion];
}

export class CategoryAxisSettings extends FormattingSettingsCard {
    public name: string = "categoryAxis";
    public displayNameKey:string = "Visual_XAxis";

    public show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayNameKey: "Visual_Show",
        value: true,
        topLevelToggle: true
    });

    public showTitle = new formattingSettings.ToggleSwitch({
        name: "showAxisTitle",
        displayNameKey: "Visual_Title",
        value: true,
    });

    public intersections = new formattingSettings.NumUpDown({
        name: "intersections",
        displayNameKey: "Visual_Intersection",
        value: 0
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
            value: 9
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

    public slices: FormattingSettingsSlice[] = [this.show, this.showTitle, this.intersections, this.labelColor, this.fontControl];
}

export class ValueAxisSettings extends FormattingSettingsCard {
    public name: string = "valueAxis";
    public displayNameKey:string = "Visual_YAxis";

    public show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayNameKey: "Visual_Show",
        value: true,
        topLevelToggle: true
    });

    public showTitle = new formattingSettings.ToggleSwitch({
        name: "showAxisTitle",
        displayNameKey: "Visual_Title",
        value: true,
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
            value: 9
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

    public slices: FormattingSettingsSlice[] = [this.show, this.showTitle, this.labelColor, this.fontControl];
}

export class VisualFormattingSettingsModel extends FormattingSettingsModel {
    public columnBorder: FormattingSettingsCard = new ColumnBorderSettings();
    public legend: FormattingSettingsCard = new LegendSettings();
    public sortLegend: FormattingSettingsCard = new SortLegendSettings();
    public labels: FormattingSettingsCard = new LabelsSettings();
    public sortSeries: FormattingSettingsCard = new SeriesSortSettings();
    public xAxisLabels: FormattingSettingsCard = new XAxisLabelsSettings();
    public categoryAxis: FormattingSettingsCard = new CategoryAxisSettings();
    public valueAxis: FormattingSettingsCard = new ValueAxisSettings();

    public cards: FormattingSettingsCard[] = [
        this.columnBorder,
        this.legend,
        this.sortLegend,
        this.labels, this.sortSeries,
        this.xAxisLabels,
        this.categoryAxis,
        this.valueAxis
    ];

}
