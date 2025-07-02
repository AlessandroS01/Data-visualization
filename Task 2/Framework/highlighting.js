let brushingAppliedIntervals = new Map();
let continentHovered = "";
let selectedCountry = [];
let hoveredCountry = "";
let hoveredTimelineInterval = "";

/**
 * Handles the highlighting complete logic
 */
function chartsHighlighting() {
    const selectedCountryEmpty = selectedCountry.length === 0;
    const brushingIntervalsEmpty = brushingAppliedIntervals.size === 0;
    const continentHoveringEmpty = continentHovered.length === 0;
    const hoveredCountryEmpty = hoveredCountry.length === 0;
    const hoveredTimelineEmpty = hoveredTimelineInterval.length === 0;

    const countries = d3.selectAll('path.country');
    const parallelLines = d3.selectAll('.data-line');
    const continents = d3.selectAll('.legend-item');

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
            .style('opacity', 1)
            .style("stroke", (d) => getColorByContinent(mapCountryContinent.get(d.Name)))
            .attr("stroke-width", 0.3);
    }

    // if a country is selected, highlight it
    if (
        selectedCountryEmpty &&
        brushingIntervalsEmpty &&
        continentHoveringEmpty &&
        !hoveredCountryEmpty &&
        hoveredTimelineEmpty
    ) {
        const countryID = hoveredCountry.replace(/[\s.]/g, '_')
        const parallelLine = `line-${countryID}`
        d3.selectAll('path.country')
            .style('opacity', 0.2);
        d3.select(`path#${countryID}`)
            .style('opacity', 1);

        d3.selectAll('.data-line')
            .style('opacity', 0.1);
        d3.select(`#${parallelLine}`)
            .style('opacity', 1)
            .style('stroke', d => getFertilityColor(d.FertilityR))
            .attr("stroke-width", 2);
    }



}