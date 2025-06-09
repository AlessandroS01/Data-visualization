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
/* variables for main map */
let mapChart, gMap;
const mapWidth = "100%";  // base width for map
const mapHeight = 500 + "px"; // base height for map
const projection = d3.geoEquirectangular().scale(160);
const path = d3.geoPath(projection); // generate paths according to the projection used and the geojson data

/* variables for timeline */
let timeline, timelineSlider;
const timelineHeight = 90 + "px";
const startYear = 1960;
const endYear = 2023;
// used for defining timeline legend classes and ranges
const classNames = [
    "timeline-range no-data",
    "timeline-range first-interval",
    "timeline-range second-interval",
    "timeline-range third-interval",
    "timeline-range fourth-interval"
];
const fertilityRanges = ["No data available", "0 - 2.5", "2.5 - 5.0", "5.0 - 7.5", "7.5 - 10"];


/* variables for data */
let selectedCountry = [];
let fertilityData = [];


function initDashboard(retrievedData) {
    fertilityData = retrievedData;

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
                    } else {
                        selectedCountry = selectedCountry.filter(country => country.name !== countryName);
                    }
                });
        });
}

function createTimeline() {
    timeline = d3.select(".map").append("div")
        .attr("class", "timeline")
        .attr("width", mapWidth)
        .attr("height", timelineHeight)
        .style("padding", "5px")
        .style("display", "grid")
        .style("grid-template-columns", "1fr 4fr")
        .style("grid-template-rows", "1fr 1fr")
        .style("gap", "10px");

    // First cell (empty)
    timeline.append("div")
        .style("border", "1px solid transparent"); // or no border if you want it invisible

    // Timeline legend (color schema)
    let legendTimeline = timeline.append("div")
        .style("display", "flex")
        .style("flex-direction", "row")
        .style("align-items", "center");

    for(let i = 0; i < 5; i++) {
        legendTimeline.append("div")
            .attr("class", classNames[i])
            .text(fertilityRanges[i]);
    }


    // Button logic
    let timelineButton = timeline.append("div")
        .style("display", "flex")
        .style("justify-content", "center")
        .style("align-items", "center")
        .append("button")
        .attr("id", "play-button")
        .text("Play time-lapse ");
    timelineButton.append("i")
        .attr("class", "fa-solid fa-play")
        .style("font-size", "10px");
    creationTimelineButtonLogic();

    // Effective timeline
    timelineSlider = timeline.append("div")
        .attr("class", "slider-container");
    creationSlider();
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
            timelineButton.text("Stop time-lapse ");
            timelineButton.append("i")
                .attr("class", "fa-solid fa-pause")
                .style("font-size", "10px");
        } else {
            icon.remove();
            timelineButton.text("Play time-lapse ");
            timelineButton.append("i")
                .attr("class", "fa-solid fa-play")
                .style("font-size", "10px");
        }

        // Trigger your timeline animation here based on isPlaying
    });
}

/**
 * Used to create the timeline slider
 */
function creationSlider() {
    timelineSlider.append("div")
        .attr("class", "year-container")
        .text(startYear);

    const svg = timelineSlider.append("svg")
        .attr("id", "slider"); // Let CSS handle the size

    timelineSlider.append("div")
        .attr("class", "year-container")
        .text(endYear);

    // Get actual dimensions from the rendered SVG (after it's in the DOM)
    const bbox = svg.node().getBoundingClientRect();
    const width = bbox.width;
    const height = bbox.height;

    const xScale = d3.scaleLinear()
        .domain([startYear, endYear])
        .range([0, width]); // add margin

    svg.append("line")
        .attr("x1", xScale(startYear))
        .attr("x2", xScale(endYear))
        .attr("y1", height / 2)
        .attr("y2", height / 2)
        .attr("stroke", "#999")
        .attr("stroke-width", 4);

    const handle = svg.append("circle")
        .attr("r", 8)
        .attr("cx", xScale(startYear))
        .attr("cy", height / 2)
        .attr("fill", "#333")
        .style("cursor", "pointer");

    const drag = d3.drag()
        .on("drag", function (event) {
            let posX = event.x;
            posX = Math.max(xScale(startYear), Math.min(xScale(endYear), posX));

            handle.attr("cx", posX);

            const year = Math.round(xScale.invert(posX));
            console.log("Year:", year);
        });

    handle.call(drag);
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