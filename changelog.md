## 3.8.0.0

### New features
* Added new formatting setting "Visual mode" to switch between absolute and percentage display modes
* Added formatting setting for "Grid"
* Added on-Object formatting for "Visual mode" and "Grid" settings

## 3.7.0.0

### New features
* Added on-Object formatting API

### Other
* Updated dependencies

## 3.6.3.0
* Remove interactivity utils
* Update packages
* Increase selection visibility in high contrast mode
* Use API 5.11.0

## 3.6.2.0
* Add high contrast mode support

## 3.6.1.0
* Show context menu when right-clicking on empty spot inside the visual
* Update powerbi utils and tools dependencies

## 3.6.0.0
* Add dynamic drill control support

## 3.5.1.0
* Fix grouped legend overlapping the visual
* Update dataview validation

## 3.5.0.0
* Fix a bug with reassigning colors
* Fix a bug with incorrect mekko height 
* Add shift and meta keys for multiselection
* Add conditional formatting to default color picker

## 3.4.0.0
* Add aria-selected attribute, option role, and listbox role for screen readers
* Add aria-label attribute for screen readers
* Add keyboard navigation with Tab, Enter, and Space 

## 3.3.0
* Update powerbi-visuals-api to 5.4.0
* Update powerbi-visuals-tools to 4.3.2
* Implement new format pane using the updated powerbi-visuals-api 
* Add font control to x and y axis settings
* Add font picker for the legend

## 3.1.0
* Fix selection rendering issue
* Fix rendering of filtered series
* Update powerbi-visuals-tools to 3.0.7
* Azure Pipelines integration
* Visual packages and powerbi utils update

## 3.0.0
* powerbi-visuals-tools@3.0.1 based visual

## 2.1.2

* Additional minimal height calculation now is applied only if rotation option is enabled
* Length of X-axis labels now is calculated based on formatted labels

## 2.1.1

* Minimal height was reduced from 100 to 80

## 2.1.0

* Added localization for all supported languages

## 2.0.0

* Added Power BI bookmarks support

## 1.9.4

* Legend category sorts by category sort datafield
* Fix sort series properties

## 1.9.3

* Displaying the legend with specific dataset breaks the visual - fixed

## 1.9.2

* Prevent creating visual SVG with negative sizes when no enough space for svg elements

## 1.9.1

* Fix x-axis title position, when axis labels rotated to 45 degrees
* Fix color selection, when visual doesn't have series
* Displaying category with null value

## 1.9.0

* Add sorting of legend items by value
* Add sorting values of series in each category
* Add property to configure displaying of percent value in a scope of each category or all data
* Add property to rotate category labels to 45 degrees for displaying text without truncating
* Add property to force display the labels in case no enough space to display label

Features for a specific dataset.
The options available only when each value belongs to only one category

* Gradient color for each category
* Grouping legend items by category
* Sort legend each category items by value

## 1.8.1

* Fix for bug - X-axis label hided incorrectly