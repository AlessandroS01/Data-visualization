let brushingAppliedIntervals = new Map();
let continentHovered = "";
let selectedCountries = [];
let hoveredCountry = "";
let hoveredTimelineInterval = "";

/**
 * Handles the highlighting complete logic
 */
function chartsHighlighting() {
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
        d3.selectAll('path.country')
            .style('opacity', 1);
        d3.selectAll('.data-line')
            .style("display", "inline")
            .style("stroke",
                (d) => getColorByContinent(mapCountryContinent.get(d.Name))
            )
            .style("stroke-width", 0.3);
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
        .style('stroke', "black")
        .attr("stroke-width", 1);
}

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