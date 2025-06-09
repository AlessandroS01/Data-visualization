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
let mapChart, gMap, timeline;
const mapWidth = "100%";  // base width for map
const mapHeight = 500; // base height for map
const projection = d3.geoEquirectangular().scale(160);
const path = d3.geoPath(projection); // generate paths according to the projection used and the geojson data

const timelineHeight = 90;
const startYear = 1960;
const endYear = 2023;
const periodInterval = d3.range(startYear, endYear + 1); // for the timeline

let selectedCountry = [];


function initDashboard(retrievedData) {

    // Select .map div and append an svg
    mapChart = d3.select(".map").append("svg")
        .attr("width", mapWidth)
        .attr("height", mapHeight)
        .attr("viewBox", "0 0 1000 400") // This defines the coordinate system of your map content
        .attr("preserveAspectRatio", "xMidYMid meet");
    gMap = mapChart.append("g");

    createMap();
    createTimeline();
}

function createMap() {
    d3.json('../data/worldMap.geojson')
        .then(worldData => {
            const countriesFeature = worldData.features;

            gMap.selectAll('path')
                .data(countriesFeature)
                .enter()
                .append('path')
                .attr('class', 'country')
                .attr('d', path)
                .on('click', (event, d) => {
                    const countryName = d.properties.name;

                    // Optional: prevent duplicates
                    if (!selectedCountry.includes(countryName)) {
                        selectedCountry.push(countryName);
                        updateCountryList();
                    }
                });
        });
}

function createTimeline() {
    const xScaleTimeline = d3.scaleLinear()
        .domain([startYear, endYear])
        .range([40, mapWidth - 20]);

    const xAxisTimeline = d3.axisBottom(xScaleTimeline)
        .tickFormat(d3.format("d")) // show whole years like "1960"
        .ticks(endYear - startYear); // one tick per year (or use fewer if crowded)


    timeline = d3.select(".map").append("div")
        .attr("width", mapWidth)
        .attr("height", timelineHeight)
        .style("padding", "5px")
        .style("display", "grid")
        .style("grid-template-columns", "10% 85%")
        .style("grid-template-rows", "45% 45%")
        .style("gap", "5%");

    // First cell (empty)
    timeline.append("div")
        .style("border", "1px solid transparent"); // or no border if you want it invisible

    // Other cells with content
    timeline.append("div")
        .style("border", "1px solid lightgray")
        .style("padding", "10px")
        .text("Cell 2 (top-right)");

    // Button logic
    let timelineButton = timeline.append("div")
        .style("display", "flex")
        .style("justify-content", "center")
        .style("align-items", "center")
        .append("button")
        .attr("id", "play-button");
    timelineButton.append("i")
        .attr("class", "fa-solid fa-play")
        .style("font-size", "15px");
    creationTimelineButtonLogic();

    // effective timeline
    timeline.append("div")
        .style("border", "1px solid lightgray")
        .style("padding", "10px")
        .text("Cell 4 (bottom-right)");

    //let button = timeline.append("button").text("AFAFD");
    //let g = timeline.append("svg");
}

/**
 * Used to set the behavior of the timeline button
 */
function creationTimelineButtonLogic() {
    let isTimelinePlaying = false;
    let timelineButton = d3.select("#play-button");
    timelineButton.on("click", function () {
        isTimelinePlaying = !isTimelinePlaying;

        const icon = d3.select("#play-button .fa-solid");

        if (isTimelinePlaying) {
            icon.remove();
            timelineButton.append("i")
                .attr("class", "fa-solid fa-pause")
                .style("font-size", "15px");
        } else {
            icon.remove();
            timelineButton.append("i")
                .attr("class", "fa-solid fa-play")
                .style("font-size", "15px");
        }

        // Trigger your timeline animation here based on isPlaying
    });
}

function updateCountryList() {
    const list = d3.select('#sel_countries');
    list.selectAll('li').remove(); // Clear old list

    list.selectAll('li')
        .data(selectedCountry)
        .enter()
        .append('li')
        .text(d => d);
}


// clear files if changes (dataset) occur
function clearDashboard() {

    chart1.selectAll("*").remove();
    chart2.selectAll("*").remove();
    chart3.selectAll("*").remove();
    chart4.selectAll("*").remove();
}