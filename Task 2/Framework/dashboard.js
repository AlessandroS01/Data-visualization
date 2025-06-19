/*
* Data Visualization - Framework
* Copyright (C) University of Passau
*   Faculty of Computer Science and Mathematics
*   Chair of Cognitive sensor systems
* Maintenance:
*   2025, Alexander Gall <alexander.gall@uni-passau.de>
*
* All rights reserved.
*/

// TODO: use descriptive names for variables
/* variables for timeline */
let startYear;
let endYear;
let currentYear; // handle current year in timeline
// used for defining timeline legend classes and ranges
const classNames = [
    "timeline-range no-data",
    "timeline-range first-interval",
    "timeline-range second-interval",
    "timeline-range third-interval",
    "timeline-range fourth-interval",
    "timeline-range fifth-interval",
    "timeline-range sixth-interval",
    "timeline-range seventh-interval",
    "timeline-range eighth-interval"
];


/* variables for data */
let fertilityData = [];
let numericalColumnsData = [];
let domainScales = new Map();

let selectedCountry = [];
const colorListWorld = [
    "#ffcdc8",
    "#c8e7ff",
    "#c6cbbe",
    "#fedcff",
    "#fff0dc",
    "#fff5a4",
    "#dcd5ff",
    "#ffd3eb"
];
let colorCountryMap = new Map();


function initDashboardTask2(retrievedData) {
    fertilityData = retrievedData;

    startYear = d3.min(fertilityData, d => d.Year);
    currentYear = startYear;
    endYear = d3.max(fertilityData, d => d.Year);

    retrievedData.columns.forEach(column => {
        if (!isNaN(+fertilityData[0][column])) { // take first row and defines the domain for each numeric attribute
            const domain = d3.extent(
                retrievedData,
                d => +d[column]
            ); // returns min and max value of the converted domain
            // console.log("Domain range: " + domain + " for " + col);

            numericalColumnsData.push(column); // adds only numeric attributes
            domainScales.set(column, domain);
        }
    });
    createMap();
    createTimeline();
}

/**
 * Add new country to the selected list and handle color assignment
 * @param countryName of the country to be added
 * @param geoFeature the geo feature of the country to add the center label
 */
function addSelectedCountry(countryName, geoFeature) {
    selectedCountry.push(countryName);
    if(colorCountryMap.size === 0) { // no other element selected
        // TODO: add here how to handle addition of new selected country from the charts (look comment below)
        /*d3.select("#point"+countryName)
            .transition()
            .duration(300)
            .attr("fill",colorListWorld)
            .attr("opacity", 1);

         */
        colorCountryMap.set(countryName, colorListWorld[0]);
    } else {
        let newColor = "";
        let usedColors = new Set(colorCountryMap.values()); // set of colors already used
        for (let i = 0; i < colorListWorld.length; i++) {
            if (!usedColors.has(colorListWorld[i])) {
                newColor = colorListWorld[i];
                break;
            }
        }
        // TODO: add here how to handle addition of new selected country from the charts (look comment below)
        /*d3.select("#point"+countryName)
            .transition()
            .duration(300)
            .attr("fill",newColor)
            .attr("opacity", 1);

         */
        colorCountryMap.set(countryName, newColor);
    }
    const countryCentroid = getMainlandCentroid(geoFeature);
    const textId = `label-${countryName.replace(/[\s.]/g, '_')}`;
    const matchedEntry = fertilityData.find(value =>
        +value.Year === +currentYear && value.Name === countryName
    );
    const fertilityValue = matchedEntry ? matchedEntry.FertilityR : "NaN";
    gMap.append("text")
        .attr("id", textId)
        .attr("x", countryCentroid[0])
        .attr("y", countryCentroid[1])
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "middle")
        .attr("font-size", "10px")
        .attr("font-weight", "bold")
        .attr("fill", "#333")
        .style("pointer-events", "none")
        .text(fertilityValue);

    updateCountryList();
}

/**
 * Return the centroid of the mainland of the passed country
 * @param feature country geoFeature
 * @returns {[number, number]|number[]} centroid x and y coordinates of the mainland of the country
 */
function getMainlandCentroid(feature) {
    const geometry = feature.geometry;

    if (geometry.type === "Polygon") {
        return path.centroid(feature);
    }

    if (geometry.type === "MultiPolygon") {
        let maxArea = -Infinity;
        let largestPolygon = null;

        // Loop through all polygons in the MultiPolygon
        geometry.coordinates.forEach(coords => {
            const poly = {
                type: "Feature",
                geometry: {
                    type: "Polygon",
                    coordinates: coords
                }
            };

            const area = d3.geoArea(poly);
            if (area > maxArea) {
                maxArea = area;
                largestPolygon = poly;
            }
        });

        return path.centroid(largestPolygon);
    }

    return [0, 0]; // Fallback for unsupported types
}

/**
 * Remove country from the selected list
 * @param countryName of the country to be removed
 */
function removeSelectedCountry(countryName) {
    selectedCountry = selectedCountry.filter(country => country !== countryName);
    colorCountryMap.delete(countryName);

    gMap.selectAll('path.country')
        .style('opacity', 1); // Reset opacity for all countries or bug occurs
    d3.select(`#label-${countryName.replace(/[\s.]/g, '_')}`).remove();

    updateCountryList();
}

/**
 * Updates the country list in the dashboard
 */
function updateCountryList() {
    const countryList = d3.select('#sel_countries');

    countryList.selectAll('div').remove(); // Clear old list

    const divs = countryList.selectAll('div')
        .data(selectedCountry)
        .enter()
        .append('div')
        .attr("class", "map-legend")
        .attr('width', '100%')
        .style("background-color", d => colorCountryMap.get(d));

    divs
        .on("mouseover", function (event, countryName) {
            const hoveredSelection = gMap.select(`#${countryName.replace(/[\s.]/g, '_')}`);

            // Dim all countries first
            gMap.selectAll('path.country')
                .style('opacity', 0.2);

            // Then reset opacity back to 1 for hovered group
            hoveredSelection.style('opacity', 1);
        })
        .on("mouseout", function(event, countryName) {
            gMap.selectAll('path.country')
                .style('opacity', 1);
        });

    divs.append('button')
        .attr("class", "remove-country-button")
        .text("X")
        .on('click', function(event, countryName) {
            removeSelectedCountry(countryName);
        });
    divs.append('text')
        .text(d => d)
        .style("color", "black")
        .style("font", "Helvetica")
        .style("font-size", "12px");
}


// clear files if changes (dataset) occur
function clearDashboardTask2() {
    mapChart.selectAll("*").remove();
    timeline.selectAll("*").remove();

    currentYear = startYear;
    selectedCountry = [];
    fertilityData = [];
    numericalColumnsData = [];
    domainScales.clear();
}