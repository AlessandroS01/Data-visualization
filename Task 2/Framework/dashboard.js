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
/* general variables */
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
let geoFeatureList = []; // list of geo features for the map

/* data variables */
let fertilityData = [];
let numericalColumnsData = [];
let domainScales = new Map();


/* data for visualization interaction */
const colorListWorld = [
    "#d6604d",
    "#f4a582",
    "#fddbc7",
    "#92c5de",
    "#4393c3",
    "#2166ac"
];
let colorCountryMap = new Map();
let mapCountryContinent = new Map();
const continentColors = {
    "Africa": "#8c510a",
    "Asia": "#dfc27d",
    "Europe": "#c7eae5",
    "North America": "#80cdc1",
    "Oceania": "#35978f",
    "South America": "#01665e"
};


async function initDashboardTask2(retrievedData) {
    fertilityData = retrievedData;

    startYear = d3.min(fertilityData, d => d.Year);
    currentYear = startYear;
    endYear = d3.max(fertilityData, d => d.Year);

    await initializeCountryContinentMap();

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

    initDashboardScatterplot({
        container: ".scatterplot",
        data: retrievedData,
        xCol: "Population",
        yCol: "FertilityR",
        sizeCol: "FertilityR"
    });
    updateDashboardScatterplot(startYear);

    createParallelChart(mapCountryContinent);

    createContinentLegend();
}

/**
 * Add new country to the selected list and handle color assignment
 * @param countryName of the country to be added
 * @param geoFeature the geo feature of the country to add the center label
 */
function addSelectedCountry(countryName, geoFeature) {
    selectedCountries.push(countryName);
    const replaceCountryName = countryName.replace(/[\s.]/g, '_');
    if(colorCountryMap.size === 0) { // no other element selected
        colorCountryMap.set(replaceCountryName, colorListWorld[0]);
    } else {
        let newColor = "";
        let usedColors = new Set(colorCountryMap.values()); // set of colors already used
        for (let i = 0; i < colorListWorld.length; i++) {
            if (!usedColors.has(colorListWorld[i])) {
                newColor = colorListWorld[i];
                break;
            }
        }
        colorCountryMap.set(replaceCountryName, newColor);
    }

    if (geoFeature === null) {
        geoFeatureList.forEach(feature => {
            if (feature.properties?.name === countryName) {
                geoFeature = feature;
            }
        });
    }

    const countryCentroid = getMainlandCentroid(geoFeature);
    if (countryCentroid !== null) {
        const textId = `label-${replaceCountryName}`;
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
    }
    updateCountryList();
    updateScatterplotSelection(); 
}

/**
 * Return the centroid of the mainland of the passed country
 * @param feature country geoFeature
 * @returns {[number, number]|number[]} centroid x and y coordinates of the mainland of the country
 */
function getMainlandCentroid(feature) {
    if (!feature || !feature.geometry) {
        console.log("Missing geometry:", feature);
        return null;
    }
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
    selectedCountries = selectedCountries.filter(country => country !== countryName);
    colorCountryMap.delete(countryName.replace(/[\s.]/g, '_'));

    d3.select(`#label-${countryName.replace(/[\s.]/g, '_')}`).remove();

    updateCountryList();
    updateScatterplotSelection(); 
}

/**
 * Updates the country list in the legend
 */
function updateCountryList() {
    const countryList = d3.select('#sel_countries');

    countryList.selectAll('div').remove();

    const divs = countryList.selectAll('div')
        .data(selectedCountries)
        .enter()
        .append('div')
        .attr("class", "map-legend")
        .attr("id", d => `${d.replace(/[\s.]/g, '_')}`)
        .attr('width', '100%')
        .style("background-color", d => colorCountryMap.get(d.replace(/[\s.]/g, '_')));

    divs
        .on("mouseover", function (event, countryName) {
            hoveredCountry = countryName;
            chartsHighlighting();
        })
        .on("mouseout", function(event, countryName) {
            hoveredCountry = "";
            chartsHighlighting();
        });

    divs.append('button')
        .attr("class", "remove-country-button")
        .text("X")
        .on('click', function(event, countryName) {
            removeSelectedCountry(countryName);
            hoveredCountry = "";
            chartsHighlighting();
        });
    divs.append('text')
        .text(d => d)
        .style("color", "black")
        .style("font", "Helvetica")
        .style("font-size", "12px");
}

/**
 * Initialize map that maps the countries to their continent
 */
function initializeCountryContinentMap() {
    return d3.csv("../data/continents.csv").then(function(countryContinentData) {
        let setCountryNames = new Set();
        fertilityData.forEach(d => setCountryNames.add(d.Name));

        setCountryNames.forEach(countryName => {
            const region = countryContinentData.find(
                country => country.Entity === countryName
            )?.Region;

            if (region !== undefined) {
                mapCountryContinent.set(countryName, region);

            }
        });
    }).catch(function(error) {
        console.error("Error loading the CSV file:", error);
    });
}

function createContinentLegend() {
    const legendContainer = d3.select(".continent-legend");

    const legendItems = legendContainer.selectAll(".legend-item")
        .data(Object.entries(continentColors))
        .enter()
        .append("div")
        .attr("class", "legend-item")
        .attr("id", d => `legend-${d[0].replace(/[\s.]/g, '_')}`)
        .style("display", "flex")
        .style("align-items", "center")
        .style("margin-bottom", "4px")
        .on("mouseover", function(event, d) {
            continentHovered = d[0]; // store hovered continent
            chartsHighlighting();
        })
        .on("mouseout", function(event, d) {
            continentHovered = "";
            chartsHighlighting();
        });

    legendItems.append("div")
        .attr("class", "legend-color")
        .style("width", "12px")
        .style("height", "12px")
        .style("margin-right", "6px")
        .style("background-color", d => d[1])
        .style("border", "1px solid #000");

    legendItems.append("span")
        .text(d => d[0]);
}



function getColorByContinent(continent) {
    switch(continent) {
        case "Africa":
            return "#8c510a";
        case "Asia":
            return "#dfc27d";
        case "Europe":
            return "#c7eae5";
        case "North America":
            return "#80cdc1";
        case "Oceania":
            return "#35978f";
        case "South America":
            return "#01665e";
        default:
            return "#999"; // Default color for unknown continents
    }
}


// clear files if changes (dataset) occur
function clearDashboardTask2() {
    mapChart.selectAll("*").remove();
    timeline.selectAll("*").remove();
    d3.select(".scatterplot").selectAll("*").remove();

    currentYear = startYear;
    selectedCountries = [];
    fertilityData = [];
    numericalColumnsData = [];
    domainScales.clear();
}