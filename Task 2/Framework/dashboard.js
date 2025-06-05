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

// TODO: File for Part 2
// TODO: You can edit this file as you wish - add new methods, variables etc. or change/delete existing ones.

// TODO: use descriptive names for variables
let mapChart;
const mapWidth = 960;  // base width for viewBox
const mapHeight = 500; // base height for viewBox

function initDashboard(_data) {
    // Select .map div and append an svg
    mapChart = d3.select(".map").append("svg")
        .attr("viewBox", `0 0 ${mapWidth} ${mapHeight}`)    // make svg scalable
        .attr("preserveAspectRatio", "xMidYMid meet") // keep aspect ratio and centered
        .classed("map-svg", true);

    createMap();
}

function createMap() {
    d3.xml("worldmap.svg").then(data => {
        const importedSVG = data.documentElement;
        // Clear previous content if any
        mapChart.selectAll("*").remove();
        // Append the imported SVG nodes into mapChart svg
        importedSVG.childNodes.forEach(node => {
            mapChart.node().appendChild(node.cloneNode(true));
        });
    }).catch(error => {
        console.error("Error loading SVG:", error);
    });
}


// clear files if changes (dataset) occur
function clearDashboard() {

    chart1.selectAll("*").remove();
    chart2.selectAll("*").remove();
    chart3.selectAll("*").remove();
    chart4.selectAll("*").remove();
}