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
let mapChart, gMap;
const mapWidth = "100%";  // base width for map
const mapHeight = 500; // base height for map
const projection = d3.geoEquirectangular().scale(160);
const path = d3.geoPath(projection);

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
}

function createMap() {
    d3.json('../data/worldMap.geojson')
        .then(worldData => {
            const countriesFeature = worldData.features;
            console.log(countriesFeature);

            gMap.selectAll('path')
                .data(countriesFeature)
                .enter()
                .append('path')
                .attr('class', 'country')
                .attr('d', path)
                .on('click', (event, d) => {
                    const countryName = d.properties.name;

                    // Optional: prevent duplicates
                    if (!selectedCountry.includes(countryName) && countryName!== "") {
                        selectedCountry.push(countryName);
                        updateCountryList();
                    }
                });
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