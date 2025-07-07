let brushingAppliedIntervals = new Map();
let continentHovered = "";
let selectedCountries = [];
let hoveredCountry = "";
let hoveredTimelineInterval = "";


/**
 * Handles the highlighting complete logic
 */
function chartsHighlighting() {
    const currentState = getHighlightStateKey();

    for (const handler of highlightHandlers) {
        if (matchesCondition(currentState, handler.condition)) {
            handler.action();
            break;
        }
    }
}

/**
 * Returns the highlight state key for the current highlighting state
 * @returns {
 * {selected: boolean, brushed: boolean, continent: boolean, hoveredCountry: boolean, hoveredTimeline: boolean}
 * }
 */
function getHighlightStateKey() {
    return {
        selected: selectedCountries.length > 0,
        brushed: brushingAppliedIntervals.size > 0,
        continent: continentHovered.length > 0,
        hoveredCountry: hoveredCountry.length > 0,
        hoveredTimeline: hoveredTimelineInterval.length > 0,
    };
}

/**
 * Handles the highlighting actions based on the current state of the charts.
 * @type {[{condition: {selected: boolean, brushed: boolean, continent: boolean, hoveredCountry: boolean, hoveredTimeline: boolean}, action: (function(): void)},{condition: {selected: boolean, brushed: boolean, continent: boolean, hoveredCountry: boolean, hoveredTimeline: boolean}, action: (function(): void)},{condition: {selected: boolean, brushed: boolean, continent: boolean, hoveredCountry: boolean, hoveredTimeline: boolean}, action: (function(): void)},{condition: {selected: boolean, brushed: boolean, continent: boolean, hoveredCountry: boolean, hoveredTimeline: boolean}, action: (function(): void)},{condition: {selected: boolean, brushed: boolean, continent: boolean, hoveredCountry: boolean, hoveredTimeline: boolean}, action: *}]}
 */
const highlightHandlers = [
    {   // nothing is selected or hovered -> reset everything to normal
        condition: { selected: false, brushed: false, continent: false, hoveredCountry: false, hoveredTimeline: false },
        action: () => resetHighlighting(),
    },
    {   // only a country is hovered -> highlight it in all charts
        condition: { selected: false, brushed: false, continent: false, hoveredCountry: true, hoveredTimeline: false },
        action: () => highCountryParallel(),
    },
    {   // only timeline legend is hovered -> highlight all countries in that interval
        condition: { selected: false, brushed: false, continent: false, hoveredCountry: false, hoveredTimeline: true },
        action: () => timelineHighlighting(),
    },
    {   // only continent legend is hovered -> highlight all countries in that continent
        condition: { selected: false, brushed: false, continent: true, hoveredCountry: false, hoveredTimeline: false },
        action: () => continentHighlighting(),
    },
    {   // only country selection is applied -> make it pop up in all charts
        condition: { selected: true, brushed: false, continent: false, hoveredCountry: false, hoveredTimeline: false },
        action: () => {
            d3.selectAll('path.country').style('opacity', 1);
            d3.selectAll(".data-line").style("display", "none");
            colorParallelLines(true);
        }
    },
];

/**
 * Checks if the current state matches the given condition.
 * @param state
 * @param condition
 * @returns {this is string[]}
 */
function matchesCondition(state, condition) {
    return Object.keys(condition).every(key => state[key] === condition[key]);
}

/*
function chartsHighlighting(node, name) {
    const selectedCountryEmpty = selectedCountries.length === 0;
    const brushingIntervalsEmpty = brushingAppliedIntervals.size === 0;
    const continentHoveringEmpty = continentHovered.length === 0;
    const hoveredCountryEmpty = hoveredCountry.length === 0;
    const hoveredTimelineEmpty = hoveredTimelineInterval.length === 0;

    // ONE VALUE NOT EMPTY

    // nothing is selected, so reset everything to normal opacity
    if (
        selectedCountryEmpty &&
        brushingIntervalsEmpty &&
        continentHoveringEmpty &&
        hoveredCountryEmpty &&
        hoveredTimelineEmpty
    ) {
        resetHighlighting();
    }
    // if a country is selected, highlight it
    if (
        selectedCountryEmpty &&
        brushingIntervalsEmpty &&
        continentHoveringEmpty &&
        !hoveredCountryEmpty &&
        hoveredTimelineEmpty
    ) {
        highCountryParallel();
    }

    // if timeline legend is hovered, highlight all countries in that interval
    if (
        selectedCountryEmpty &&
        brushingIntervalsEmpty &&
        continentHoveringEmpty &&
        hoveredCountryEmpty &&
        !hoveredTimelineEmpty
    ) {
        timelineHighlighting();
    }

    // if continent legend is hovered, highlight all countries in that continent
    if (
        selectedCountryEmpty &&
        brushingIntervalsEmpty &&
        !continentHoveringEmpty &&
        hoveredCountryEmpty &&
        hoveredTimelineEmpty
    ) {
        continentHighlighting();
    }

    // SELECTED COUNTRY NOT EMPTY
    if (
        !selectedCountryEmpty &&
        brushingIntervalsEmpty &&
        continentHoveringEmpty &&
        hoveredCountryEmpty &&
        hoveredTimelineEmpty
    ) {
        d3.selectAll('path.country')
            .style('opacity', 1);

        d3.selectAll(".data-line")
            .style("display", "none");

        colorParallelLines(hoveredCountryEmpty);
    }
    if (
        !selectedCountryEmpty &&
        brushingIntervalsEmpty &&
        continentHoveringEmpty &&
        !hoveredCountryEmpty &&
        hoveredTimelineEmpty
    ) {
        highCountryParallel();

        colorParallelLines(hoveredCountryEmpty);
    }
    if (
        !selectedCountryEmpty &&
        brushingIntervalsEmpty &&
        continentHoveringEmpty &&
        hoveredCountryEmpty &&
        !hoveredTimelineEmpty
    ) {
        colorParallelLines(hoveredCountryEmpty);

        timelineHighlighting();
    }

    // BRUSHING INTERVALS NOT EMPTY
    if (
        selectedCountryEmpty &&
        !brushingIntervalsEmpty &&
        continentHoveringEmpty &&
        hoveredCountryEmpty &&
        hoveredTimelineEmpty
    ) {
        brushingEffect();
    }
    if (
        !selectedCountryEmpty &&
        !brushingIntervalsEmpty &&
        continentHoveringEmpty &&
        hoveredCountryEmpty &&
        hoveredTimelineEmpty
    ) {
        brushingEffect();
        selectedCountries.forEach(country => {
            d3.select(`path#${country.replace(/[\s.]/g, '_')}`)
                .style("opacity", 1);
            d3.select(`.data-line#line-${country.replace(/[\s.]/g, '_')}`)
                .style("stroke", colorCountryMap.get(country.replace(/[\s.]/g, '_')))
                .style("stroke-width", 1.5)
                .style("display", "inline");
        });
    }
}
*/

/**
 * Resets the highlighting of all countries and parallel lines
 */
function resetHighlighting() {
    d3.selectAll('path.country')
        .style('opacity', 1);
    d3.selectAll('.data-line')
        .style("display", "inline")
        .style("stroke",
            (d) => getColorByContinent(mapCountryContinent.get(d.Name))
        )
        .style("stroke-width", 0.3);
    d3.selectAll('.legend-item')
        .style('opacity', 1);
}

/**
 * Highlights the country and parallel
 */
function highCountryParallel() {
    const countryID = hoveredCountry.replace(/[\s.]/g, '_');
    const parallelLine = `line-${countryID}`;

    d3.selectAll('path.country')
        .style('opacity', 0.2);
    d3.select(`path#${countryID}`)
        .style('opacity', 1);

    d3.selectAll('.data-line')
        .style("display", "none");

    d3.select(`#${parallelLine}`)
        .style("display", "inline")
        .style('stroke', getColorByContinent(mapCountryContinent.get(hoveredCountry)));

    if (selectedCountries.filter(country => country.replace(/[\s.]/g, '_') === countryID).length > 0) {
        d3.select(`#${parallelLine}`)
            .style('stroke', colorCountryMap.get(countryID));
    }
}

/**
 * Colors the parallel lines based on the hovered country.
 * @param hoveredCountryEmpty - boolean indicating if hoveredCountry is empty
 */
function colorParallelLines(hoveredCountryEmpty) {
    const legendIds = d3.selectAll('.map-legend')
        .nodes()                     // Get array of DOM nodes
        .map(node => node.id);
    legendIds.forEach(id => {
        if (!hoveredCountryEmpty && id === hoveredCountry.replace(/[\s.]/g, '_')) {
            d3.select('.data-line#line-' + id)
                .style("display", "inline")
                .style('stroke', colorCountryMap.get(id))
                .style('stroke-width', 1.5);
        } else if (hoveredCountryEmpty) {
            d3.select('.data-line#line-' + id)
                .style("display", "inline")
                .style('stroke', colorCountryMap.get(id))
                .style('stroke-width', 1.5);
        }
    })
}

/**
 * Highlights the countries associated to the timeline intervals when hovered
 */
function timelineHighlighting() {
    // Dim all countries first
    gMap.selectAll('path.country')
        .style('opacity', 0.2);

    // Then reset opacity back to 1 for hovered group
    d3.selectAll(hoveredTimelineInterval)
        .style('opacity', 1);

    let maxFertValue = 0;
    switch (hoveredTimelineInterval.split(".")[2]) {
        case "no-data":
            maxFertValue = -1;
            break;
        case "first-interval":
            maxFertValue = 1;
            break;
        case "second-interval":
            maxFertValue = 2;
            break;
        case "third-interval":
            maxFertValue = 3;
            break;
        case "fourth-interval":
            maxFertValue = 4;
            break;
        case "fifth-interval":
            maxFertValue = 5;
            break;
        case "sixth-interval":
            maxFertValue = 6;
            break;
        case "seventh-interval":
            maxFertValue = 7;
            break;
        default:
            maxFertValue = 8;
            break;
    }

    d3.selectAll('.data-line')
        .style("display", "none");

    d3.selectAll('.data-line')
        .filter(d => {
            if (maxFertValue === 8) {
                return +d.FertilityR >= 7;
            } else {
                return (
                    +d.FertilityR <= maxFertValue &&
                    +d.FertilityR >= maxFertValue - 1
                )
            }
        })
        .style("stroke-width", 1)
        .style("display", "inline")
        .style("stroke", d => getColorByContinent(mapCountryContinent.get(d.Name)));
}

/**
 * Highlights the countries associated to the hovered continent
 */
function continentHighlighting() {
    const continentName = continentHovered.replace(/[\s.]/g, '_');
    // Dim all countries first
    d3.selectAll(".data-line")
        .style("display", "none");

    // Highlight only the lines for that continent
    d3.selectAll(`.data-line.${continentName}`)
        .style("display", "inline");

    const legendID = `legend-${continentName}`

    // Dim all legend items
    d3.selectAll(".legend-item")
        .style("opacity", 0.1);

    // Highlight the hovered legend item
    d3.select(`#${legendID}`)
        .style("opacity", 1);
}

/**
 * Applies the highlight effect according to the brushing effect of the parallel chart
 */
function brushingEffect() {
    let idList = [];
    gParallelChart.selectAll(".data-line")
        .each(function(d) {
            const countryId = this.id.split("-")[1];
            let visible = true;

            for (const [dim, [minVal, maxVal]] of brushingAppliedIntervals) {
                const val = d[dim];
                if (val === null || val === undefined || val < minVal || val > maxVal) {
                    visible = false;
                    break;
                }
            }

            d3.select(this).style("display", visible ? "inline" : "none");
            d3.select(this).style("stroke-width", "0.3");
            d3.select(this).style("stroke", colorCountryMap.get(countryId));
            if (visible) {
                idList.push(countryId); // only push if line is visible
            }
        });

    const idSet = new Set(idList);

    d3.selectAll("path.country")
        .each(function(d) {
            const countryId = d.properties.name.replace(/[\s.]/g, '_');

            d3.select(this).style("opacity", idSet.has(countryId) ? 1 : 0.2);
        })
}