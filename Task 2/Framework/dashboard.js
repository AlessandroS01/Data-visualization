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
const mapWidth = "80%";  // base width for map
const mapHeight = 400 + "px"; // base height for map
const projection = d3.geoEquirectangular().scale(160);
const path = d3.geoPath(projection); // generate paths according to the projection used and the geojson data

/* variables for timeline */
let timeline, timelineSlider, timelineScale, sliderHandler, sliderLabel;
const viewBoxWidthTimeline = 400;
const viewBoxHeightTimeline = 30;
const timelineHeight = 90 + "px";
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
let selectedCountry = [];
let fertilityData = [];
let numericalColumnsData = [];
let domainScales = new Map();


function initDashboardTask2(retrievedData) {
    fertilityData = retrievedData;

    startYear = d3.min(fertilityData, d => d.Year);
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


    // Select .map div and append an svg
    mapChart = d3.select(".map").append("svg")
        .attr("width", mapWidth)
        .attr("height", mapHeight)
        .style("margin", "0 10%")
        .attr("viewBox", "0 0 1000 400") // This defines the coordinate system of your map content
        .attr("preserveAspectRatio", "xMidYMid meet");
    gMap = mapChart.append("g");

    createMap();
    createTimeline();
}

/**
 * Creates the map of the world with countries
 */
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

/**
 * Creates the timeline for the map
 */
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

    // Timeline legend (color schema) - Second cell
    let legendTimeline = timeline.append("div")
        .attr("width", "100%")
        .attr("height", "10px")
        .style("display", "flex")
        .style("flex-orientation", "row")
        .style("justify-content", "center")
        .style("align-items", "center")
        .append("svg")
        .attr("width", "80%")
        .attr("height", "10px")
        .style("overflow", "visible");

    let defs = legendTimeline.append("defs");
    defs.append("pattern")
        .attr("id", "noDataPattern")
        .attr("patternUnits", "userSpaceOnUse")
        .attr("width", 8)
        .attr("height", 8)
        .attr("patternTransform", "rotate(45)"); // for -45deg angle
    // Light stripe (bottom part)
    defs.select("pattern")
        .append("rect")
        .attr("width", 5)
        .attr("height", 8)
        .attr("x", 0)
        .attr("y", 0)
        .attr("fill", "whitesmoke");

    // Dark stripe (overlay on right side of light stripe)
    defs.select("pattern")
        .append("rect")
        .attr("width", 2)
        .attr("height", 8)
        .attr("x", 5)
        .attr("y", 0)
        .attr("fill", "#bbbbbb");

    for(let i = 0; i < classNames.length; i++) {
        const isFirst = i === 0;
        const x = 5 + i * 10;
        const width = isFirst ? 5 : 10;

        // Append rects first
        const rect = legendTimeline.append("rect")
            .attr("x", `${x}%`)
            .attr("width", `${width}%`)
            .attr("height", "100%")
            .attr("class", classNames[i]);

        if (isFirst) {
            rect.attr("fill", "url(#noDataPattern)");
        }

        if (isFirst) {
            legendTimeline.append("line")
                .attr("x1", `${x + 2.5}%`)
                .attr("x2", `${x + 2.5}%`)
                .attr("y1", "100%")
                .attr("y2", "150%")
                .attr("stroke", "#bbbbbb")
                .attr("stroke-width", 2);

            legendTimeline.append("text")
                .attr("x", `${x + .5}%`)  // Offset to right of line (if calc is supported)
                .attr("y", "220%")                  // Slightly above SVG (you can tweak this)
                .attr("text-anchor", "start")
                .attr("font-size", "10px")
                .text("No data");
        } else if( i % 2 === 0) {
            legendTimeline.append("line")
                .attr("x1", `${x}%`)
                .attr("x2", `${x}%`)
                .attr("y1", "100%")
                .attr("y2", "180%")
                .attr("stroke", "#bbbbbb")
                .attr("stroke-width", 2);

            if ( i === 1) {
                legendTimeline.append("text")
                    .attr("x", `${x + .5}%`)  // Offset to right of line (if calc is supported)
                    .attr("y", "240%")                  // Slightly above SVG (you can tweak this)
                    .attr("text-anchor", "start")
                    .attr("font-size", "10px")
                    .text(i + " birth");
            } else {
                legendTimeline.append("text")
                    .attr("x", `${x + .5}%`)  // Offset to right of line (if calc is supported)
                    .attr("y", "240%")                  // Slightly above SVG (you can tweak this)
                    .attr("text-anchor", "start")
                    .attr("font-size", "10px")
                    .text(i + " births");
            }
        } else {
            legendTimeline.append("line")
                .attr("x1", `${x}%`)
                .attr("x2", `${x}%`)
                .attr("y1", "100%")
                .attr("y2", "240%")
                .attr("stroke", "#bbbbbb")
                .attr("stroke-width", 2);

            legendTimeline.append("text")
                .attr("x", `${x + .5}%`)  // Offset to right of line (if calc is supported)
                .attr("y", "280%")                  // Slightly above SVG (you can tweak this)
                .attr("text-anchor", "start")
                .attr("font-size", "10px")
                .text(i + " births");
        }


    }


    // Button logic - Third cell
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
    // The line fills the SVG horizontally (full width of SVG)
    timelineScale = d3.scaleLinear()
        .domain([startYear, endYear])
        .range([0, viewBoxWidthTimeline]);


    // Effective timeline slider - Fourth cell
    timelineSlider = timeline.append("div")
        .attr("class", "slider-container");


    creationSlider();
    creationTimelineButtonLogic();
}

/**
 * Used to set the behavior of the timeline button
 */
function creationTimelineButtonLogic() {
    let isTimelinePlaying = false;
    let timelineButton = d3.select("#play-button");

    let playInterval = null; // defines the interval for the play button in ms

    timelineButton.on("click", function () {
        isTimelinePlaying = !isTimelinePlaying;
        const icon = d3.select("#play-button .fa-solid");
        if (isTimelinePlaying) {
            icon.remove();
            timelineButton.text("Stop time-lapse ");
            timelineButton.append("i")
                .attr("class", "fa-solid fa-pause")
                .style("font-size", "10px");

            // Reset currentYear to the current slider position
            let currentX = +sliderHandler.attr("cx");
            currentYear = Math.round(timelineScale.invert(currentX));

            playInterval = setInterval(() => {
                if (currentYear < endYear) {
                    currentYear++;
                    updateSlider();
                } else {
                    clearInterval(playInterval);
                    isTimelinePlaying = false;
                    timelineButton.text("Play time-lapse ");
                    timelineButton.append("i")
                        .attr("class", "fa-solid fa-play")
                        .style("font-size", "10px");
                }
            }, 500); // 0ms for instant update
        } else {
            icon.remove();
            timelineButton.text("Play time-lapse ");
            timelineButton.append("i")
                .attr("class", "fa-solid fa-play")
                .style("font-size", "10px");
            clearInterval(playInterval);
        }
    });
}

/**
 * Used to create the timeline slider
 */
function creationSlider() {
    timelineSlider.append("div")
        .attr("class", "year-container")
        .text(startYear);

    // Set up SVG dimensions and viewBox for responsive scaling
    const svg = timelineSlider.append("svg")
        .attr("viewBox", `0 0 ${viewBoxWidthTimeline} ${viewBoxHeightTimeline}`)
        .attr("id", "slider")
        .style("width", "80%") // SVG is 80% of container width
        .style("height", `${viewBoxHeightTimeline}px`) // Fixed height in px
        .attr("preserveAspectRatio", "none"); // Stretch to fill container, no aspect ratio

    svg.append("line")
        .attr("x1", 0)
        .attr("x2", viewBoxWidthTimeline)
        .attr("y1", viewBoxHeightTimeline / 2)
        .attr("y2", viewBoxHeightTimeline / 2)
        .attr("stroke", "#bbbbbb")
        .attr("stroke-width", viewBoxHeightTimeline / 5)
        .attr("stroke-linecap", "round");

    // Slider handle (make it visually come out of the line)
    sliderHandler = svg.append("circle")
        .attr("cx", timelineScale(startYear))
        .attr("cy", viewBoxHeightTimeline / 2)
        .attr("r", viewBoxHeightTimeline / 4)
        .attr("fill", "#bbbbbb")
        .attr("cursor", "pointer");

    // Add a label below the slider showing the selected year
    sliderLabel = svg.append("text")
        .attr("x", timelineScale(startYear))
        .attr("y", viewBoxHeightTimeline + 1)
        .attr("text-anchor", "middle")
        .attr("font-size", "8px")
        .attr("fill", "black")
        .text("");

    // Drag behavior
    const drag = d3.drag()
        .on("drag", function (event) {
            let xPos = Math.max(timelineScale(startYear), Math.min(timelineScale(endYear), event.x));
            currentYear = Math.round(timelineScale.invert(xPos));

            updateSlider();
        });
    sliderHandler.call(drag);

    // final year
    timelineSlider.append("div")
        .attr("class", "year-container")
        .text(endYear);
}

/**
 * Updates the slider position and label based on the current year
 */
function updateSlider() {
    const xPos = timelineScale(currentYear);
    sliderHandler.attr("cx", xPos);
    sliderLabel
        .attr("x", xPos)
        .text(currentYear);
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
function clearDashboardTask2() {
    mapChart.selectAll("*").remove();
    timeline.selectAll("*").remove();

    currentYear = startYear;
    selectedCountry = [];
    fertilityData = [];
    numericalColumnsData = [];
    domainScales.clear();
}