import powerbi from "powerbi-visuals-api";

import { IFontReference } from "./interfaces";

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

