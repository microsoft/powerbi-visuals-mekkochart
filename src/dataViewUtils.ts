/*
 *  Power BI Visualizations
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

import powerbi from "powerbi-visuals-api";

import * as axisType from "./axis/type";

import DataViewObject = powerbi.DataViewObject;
import DataViewObjects = powerbi.DataViewObjects;
import DataViewMetadata = powerbi.DataViewMetadata;

export function getCategoryAxisProperties(
    dataViewMetadata: DataViewMetadata,
    axisTitleOnByDefault?: boolean): DataViewObject {

    let toReturn: DataViewObject = {};

    if (!dataViewMetadata) {
        return toReturn;
    }

    const objects: DataViewObjects = dataViewMetadata.objects;

    if (objects) {
        const categoryAxisObject: DataViewObject = objects["categoryAxis"];

        if (categoryAxisObject) {
            toReturn = {
                show: categoryAxisObject["show"],
                axisType: categoryAxisObject["axisType"],
                axisScale: categoryAxisObject["axisScale"],
                start: categoryAxisObject["start"],
                end: categoryAxisObject["end"],
                showAxisTitle: categoryAxisObject["showAxisTitle"] == null
                    ? axisTitleOnByDefault
                    : categoryAxisObject["showAxisTitle"],
                axisStyle: categoryAxisObject["axisStyle"],
                labelColor: categoryAxisObject["labelColor"],
                labelDisplayUnits: categoryAxisObject["labelDisplayUnits"],
                labelPrecision: categoryAxisObject["labelPrecision"],
                duration: categoryAxisObject["duration"],
            };
        }
    }

    return toReturn;
}

export function getValueAxisProperties(
    dataViewMetadata: DataViewMetadata,
    axisTitleOnByDefault?: boolean): DataViewObject {

    let toReturn: DataViewObject = {};

    if (!dataViewMetadata) {
        return toReturn;
    }

    const objects: DataViewObjects = dataViewMetadata.objects;

    if (objects) {
        const valueAxisObject: DataViewObject = objects["valueAxis"];

        if (valueAxisObject) {
            toReturn = {
                show: valueAxisObject["show"],
                position: valueAxisObject["position"],
                axisScale: valueAxisObject["axisScale"],
                start: valueAxisObject["start"],
                end: valueAxisObject["end"],
                showAxisTitle: valueAxisObject["showAxisTitle"] == null
                    ? axisTitleOnByDefault
                    : valueAxisObject["showAxisTitle"],
                axisStyle: valueAxisObject["axisStyle"],
                labelColor: valueAxisObject["labelColor"],
                labelDisplayUnits: valueAxisObject["labelDisplayUnits"],
                labelPrecision: valueAxisObject["labelPrecision"],
                secShow: valueAxisObject["secShow"],
                secPosition: valueAxisObject["secPosition"],
                secAxisScale: valueAxisObject["secAxisScale"],
                secStart: valueAxisObject["secStart"],
                secEnd: valueAxisObject["secEnd"],
                secShowAxisTitle: valueAxisObject["secShowAxisTitle"],
                secAxisStyle: valueAxisObject["secAxisStyle"],
                secLabelColor: valueAxisObject["secLabelColor"],
                secLabelDisplayUnits: valueAxisObject["secLabelDisplayUnits"],
                secLabelPrecision: valueAxisObject["secLabelPrecision"]
            };
        }
    }

    return toReturn;
}

export function isScalar(isScalar: boolean, xAxisCardProperties: DataViewObject): boolean {
    if (isScalar) {
        isScalar = xAxisCardProperties && xAxisCardProperties["axisType"]
            ? xAxisCardProperties["axisType"] === axisType.scalar
            : true;
    }

    return isScalar;
}

export function getLayerData(
    dataViews: powerbi.DataView[],
    currentIdx: number,
    totalLayers: number): powerbi.DataView[] {

    if (totalLayers > 1) {
        if (dataViews && dataViews.length > currentIdx) {
            return [dataViews[currentIdx]];
        }

        return [];
    }

    return dataViews;
}
