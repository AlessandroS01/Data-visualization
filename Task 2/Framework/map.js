/* variables for main map */
let mapChart, gMap;
const mapWidth = "80%";  // base width for map
const mapHeight = 400 + "px"; // base height for map
const projection = d3.geoEquirectangular().scale(160);
const path = d3.geoPath(projection); // generate paths according to the projection used and the geojson data

/* variables for map legend */
let xScale, yFertilityScale, yPopulationScale;
const chartHeight = 110;

/* variables for map tooltip */
let hoveredCountry = "";

/**
 * Creates the map of the world with countries
 */
function createMap() {
    // Select .map div and append an svg
    mapChart = d3.select(".map").append("svg")
        .attr("width", mapWidth)
        .attr("height", mapHeight)
        .style("margin", "0 10%")
        .attr("viewBox", "0 0 1000 400") // This defines the coordinate system of your map content
        .attr("preserveAspectRatio", "xMidYMid meet");

    gMap = mapChart.append("g");

    d3.json('../data/worldMap.geojson')
        .then(worldData => {
            const countriesFeature = worldData.features;

            gMap.selectAll('path')
                .data(countriesFeature)
                .enter()
                .append('path')
                .attr('class', 'country')
                .attr('id', d => d.properties.name.replace(/[\s.]/g, '_')) // replace spaces with underscores for valid IDs
                .attr('d', path)
                .on('mouseover', function(event, d) {
                    createPopulationLineChart(d.properties.name);
                })
                .on('mousemove', function(event) {
                    // Update position if mouse moves
                    d3.select(".map-tooltip")
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY + 10) + "px");
                })
                .on('mouseout', function() {
                    // Remove tooltip on mouse out
                    d3.select(".map-tooltip").remove();
                    hoveredCountry = "";
                })
                .on('click', (event, d) => {
                    const countryName = d.properties.name;

                    // Optional: prevent duplicates
                    if (!selectedCountry.includes(countryName)) {
                        if (selectedCountry.length === 8) {
                            window.confirm("You've selected the maximum number of countries. \n " +
                                "To continue the selection remove at least one of them.");
                        } else {
                            addSelectedCountry(countryName, d);
                        }
                    } else {
                        removeSelectedCountry(countryName);
                    }
                });

            updateMap();
        });
}

/**
 * Updates the map based on the current year and fertility data.
 *
 * Handles change of the fertility value inside each selected country.
 *
 * Updates map tooltip.
 */
function updateMap() {
    gMap.selectAll('path.country')
        .each(function(d) {
            const countryName = d.properties.name;
            const dataCountryByYear = fertilityData.find(
                entry =>
                    entry.Name === countryName && +entry.Year === +currentYear
            );

            const assignClass = classNames.map(d => d.split(' ')[1]);

            if (dataCountryByYear) {
                const fertilityValue = +dataCountryByYear.FertilityR;
                if (fertilityValue === 0 || isNaN(fertilityValue)) {
                    d3.select(this)
                        .attr('class', `country ${assignClass[0]}`)
                        .attr('stroke', '#999');
                }
                for (let interval = 1; interval < assignClass.length; interval++) { // skip no country interval
                    if (fertilityValue > interval - 1 && fertilityValue < interval) {
                        d3.select(this)
                            .attr('class', `country ${assignClass[interval]}`);
                        break;
                    }
                    if (interval === classNames.length - 1 && fertilityValue >= interval) {
                        d3.select(this)
                            .attr('class', `country ${assignClass[interval]}`);
                    }
                }
            } else {
                d3.select(this)
                    .attr('class', `country ${assignClass[0]}`)
                    .attr('stroke', '#999');
            }
        });

    // responsible for updating the values inside selected countries
    selectedCountry.forEach(countryName => {
        const textId = `label-${countryName.replace(/[\s.]/g, '_')}`;

        const matchedEntry = fertilityData.find(value =>
            +value.Year === +currentYear && value.Name === countryName
        );
        const fertilityValue = matchedEntry ? matchedEntry.FertilityR : "NaN";
        d3.select(`#${textId}`)
            .text(fertilityValue);
    });

    // responsible for updating map tooltip
    updateTooltipData();
}


/**
 * Generate line charts when hovering over a country
 */
function createPopulationLineChart(countryName) {
    hoveredCountry = "";
    hoveredCountry = countryName;

    // Create the tooltip on hover
    let tooltip = d3.select("body")
        .append("div")
        .attr("class", "map-tooltip");

    let header = tooltip.append("div")
        .attr("class", "map-tooltip-header");
    header.append("h3").text(countryName).style("margin", 0).style("fill", "#1a1a1a");
    header.append("text").text(currentYear).style("fill", "#1a1a1a");

    let linecharts = tooltip.append("div")
        .attr("class", "map-tooltip-charts-container");


    let filteredCountryData = fertilityData
        .filter(value => value.Name === countryName)
        .sort((a, b) => +a.Year - +b.Year);

    if (filteredCountryData.length === 0) {
        linecharts
            .append("h4")
            .text("No Data Available")
            .style("box-sizing", "border-box")
            .style("margin", "0")
            .style("font-size", "14px")
            .style("color", "whitesmoke");
    } else {
        const currentData = filteredCountryData.find(
            d => +d.Year === +currentYear
        );

        const countryPopulationData = currentData.Population;
        const countryFertilityData = currentData.FertilityR;

        if (countryFertilityData) {
            linecharts
                .append("div")
                .attr("id", "fertility")
                .style("box-sizing", "border-box")
                .style("margin", "3px 0 5px 0")
                .style("font-size", "12px")
                .html(`
                    <span style="color: whitesmoke; font-weight: bold">Fertility rate: </span>
                    <span style="color: ${getFertilityColor(countryFertilityData)}; font-weight: bold;">
                      ${countryFertilityData}
                    </span>
                `);
        } else {
            linecharts
                .append("h4")
                .attr("id", "fertility")
                .text("No fertility data")
                .style("box-sizing", "border-box")
                .style("margin", "3px 0 5px 0")
                .style("font-size", "12px")
                .style("fill", "whitesmoke");
        }

        if (countryPopulationData) {
            linecharts
                .append("h4")
                .attr("id", "population")
                .text("Population: " + d3.format(".2s")(countryPopulationData).replace("G", "B"))
                .style("box-sizing", "border-box")
                .style("margin", "2px 0")
                .style("font-size", "12px")
                .style("color", "whitesmoke");
        } else {
            linecharts
                .append("h4")
                .attr("id", "population")
                .text("No population data")
                .style("box-sizing", "border-box")
                .style("margin", "2px 0")
                .style("font-size", "12px")
                .style("color", "whitesmoke");
        }





        let fertilityDomain = d3.extent(
            filteredCountryData, d => +d["FertilityR"]
        );
        let populationDomain = d3.extent(
            filteredCountryData, d => +d["Population"]
        );

        const gap = 20;
        const totalHeight = chartHeight * 2 + gap + 50;

        const width = linecharts.node().getBoundingClientRect().width;

        const svg = linecharts.append("svg")
            .attr("class", "svg-line-charts")
            .attr("viewBox", `0 0 ${width} ${totalHeight}`)
            .attr("preserveAspectRatio", "xMidYMid meet")
            .style("width", "100%")
            .style("height", "auto")
            .style("margin-top", "10px")
            .style("overflow", "visible");

        // X Scale
        xScale = d3.scaleLinear()
            .domain([startYear, endYear])
            .range([0, width]);

        // Y Scales
        yFertilityScale = d3.scaleLinear()
            .domain(fertilityDomain)
            .range([chartHeight, 0]);

        yPopulationScale = d3.scaleLinear()
            .domain(populationDomain)
            .range([chartHeight, 0]);

        // Line Generator
        const linePop = d3.line()
            .x(d => xScale(d.Year))
            .y(d => yPopulationScale(d.Population));

        // Chart 1: Fertility (custom segmented lines)
        const gFert = svg.append("g");
        gFert.append("line")
            .attr("x1", 0)
            .attr("x2", width)
            .attr("y1", 0)
            .attr("y2", 0)
            .attr("stroke", "whitesmoke");
        gFert.append("text")
            .attr("x", width - 5)
            .attr("y", -3) // a little above the bottom line
            .attr("font-size", "10px")
            .attr("fill", "whitesmoke")
            .attr("text-anchor", "end")
            .text("Fertility rate");
        gFert.append("text")
            .attr("x", width - 5)
            .attr("y", 10) // a little below the top line
            .attr("font-size", "10px")
            .attr("fill", "whitesmoke")
            .attr("text-anchor", "end")
            .text(fertilityDomain[1].toFixed(4));


        for (let i = 0; i < filteredCountryData.length - 1; i++) {
            const d1 = filteredCountryData[i];
            const d2 = filteredCountryData[i + 1];

            gFert.append("line")
                .attr("x1", xScale(d1.Year))
                .attr("y1", yFertilityScale(d1.FertilityR))
                .attr("x2", xScale(d2.Year))
                .attr("y2", yFertilityScale(d2.FertilityR))
                .attr("stroke", getFertilityColor(d1.FertilityR)) // or average of d1/d2
                .attr("stroke-width", 3);
        }
        gFert.append("line")
            .attr("x1", 0)
            .attr("x2", width)
            .attr("y1", chartHeight)
            .attr("y2", chartHeight)
            .attr("stroke", "whitesmoke");
        gFert.append("text")
            .attr("x", width - 5)
            .attr("y", chartHeight - 3) // a little above the bottom line
            .attr("font-size", "10px")
            .attr("fill", "whitesmoke")
            .attr("text-anchor", "end")
            .text(fertilityDomain[0].toFixed(4));

        // Highlight Point (Fertility)
        if (currentData) {
            const xVal = xScale(currentYear);
            const yVal = yFertilityScale(currentData.FertilityR);

            gFert.append("line")
                .attr("x1", xVal)
                .attr("x2", xVal)
                .attr("y1", 0)
                .attr("y2", chartHeight)
                .attr("id", "fer-highlight-line")
                .attr("stroke", "whitesmoke")
                .attr("stroke-dasharray", "2,2");

            gFert.append("circle")
                .attr("id", "fer-highlight-circle")
                .attr("cx", xVal)
                .attr("cy", yVal)
                .attr("r", 4)
                .attr("fill", getFertilityColor(countryFertilityData));
        }

        // Chart 2: Population
        const gPop = svg.append("g")
            .attr("transform", `translate(0, ${chartHeight + gap})`);
        gPop.append("line")
            .attr("x1", 0)
            .attr("x2", width)
            .attr("y1", 0)
            .attr("y2", 0)
            .attr("stroke", "whitesmoke");
        gPop.append("text")
            .attr("x", width - 5)
            .attr("y", -3) // a little above the bottom line
            .attr("font-size", "10px")
            .attr("fill", "whitesmoke")
            .attr("text-anchor", "end")
            .text("Population");
        gPop.append("text")
            .attr("x", width - 5)
            .attr("y", 10) // a little below the top line
            .attr("font-size", "10px")
            .attr("fill", "whitesmoke")
            .attr("text-anchor", "end")
            .text(d3.format(".2s")(populationDomain[1]).replace("G", "B"));

        gPop.append("path")
            .datum(filteredCountryData)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 3)
            .attr("d", linePop);

        // Highlight Point (Population)
        if (currentData) {
            const xVal = xScale(currentYear);
            const yVal = yPopulationScale(countryPopulationData);

            gPop.append("line")
                .attr("x1", xVal)
                .attr("x2", xVal)
                .attr("y1", 0)
                .attr("y2", chartHeight)
                .attr("id", "pop-highlight-line")
                .attr("stroke", "whitesmoke")
                .attr("stroke-dasharray", "2,2");

            gPop.append("circle")
                .attr("id", "pop-highlight-circle")
                .attr("cx", xVal)
                .attr("cy", yVal)
                .attr("r", 4)
                .attr("fill", "steelblue");
        }

        // Append x-axis group at the bottom
        const xAxisGroup = svg.append("g")
            .attr("transform", `translate(0, ${chartHeight * 2 + gap})`);

        // Draw the main horizontal x-axis line
        xAxisGroup.append("line")
            .attr("x1", 0)
            .attr("x2", width)
            .attr("y1", 0)
            .attr("y2", 0)
            .attr("stroke", "whitesmoke");

        xAxisGroup.append("text")
            .attr("x", width - 5)
            .attr("y", -3) // a little above the bottom line
            .attr("font-size", "10px")
            .attr("fill", "whitesmoke")
            .attr("text-anchor", "end")
            .text(d3.format(".2s")(populationDomain[0]).replace("G", "B"));

        // Data for ticks: only start and end year
        const xTicks = [startYear, endYear];

        // Draw ticks
        xAxisGroup.selectAll("line.tick")
            .data(xTicks)
            .enter()
            .append("line")
            .attr("class", "tick")
            .attr("x1", d => xScale(d))
            .attr("x2", d => xScale(d))
            .attr("y1", 0)
            .attr("y2", 5)
            .attr("stroke", "whitesmoke");

    // Add labels under the ticks
        xAxisGroup.selectAll("text.tick-label")
            .data(xTicks)
            .enter()
            .append("text")
            .attr("class", "tick-label")
            .attr("x", d => xScale(d))
            .attr("y", 10)
            .attr("text-anchor", d => d === startYear ? "start" : "end")
            .attr("font-size", "10px")
            .text(d => d)
            .attr("fill", "whitesmoke");
    }
}

/**
 * Handles the update of the map tooltip
 */
function updateTooltipData() {
    if (hoveredCountry !== "") {
        let tooltipHeader = d3.select(".map-tooltip-header");
        tooltipHeader.select("text").text(currentYear);

        const currentData = fertilityData.find(entry =>
            entry.Name === hoveredCountry && +entry.Year === +currentYear
        );

        let linecharts = d3
            .select(".map-tooltip-charts-container");

        const countryPopulationData = currentData.Population;
        const countryFertilityData = currentData.FertilityR;

        if (countryFertilityData) {
            linecharts
                .select("#fertility")
                .html(`
                <span style="color: whitesmoke; font-weight: bold">Fertility rate: </span>
                <span style="color: ${getFertilityColor(countryFertilityData)}; font-weight: bold;">
                  ${countryFertilityData}
                </span>
            `);
        } else {
            linecharts
                .select("#fertility")
                .text("No fertility data").style("fill", "whitesmoke");
        }

        if (countryPopulationData) {
            linecharts.select("#population").text("Population: " + d3.format(".2s")(countryPopulationData).replace("G", "B"));
        } else {
            linecharts.select("#population").text("No population data").style("fill", "whitesmoke");
        }

        const xVal = xScale(currentYear);
        const yValFertility = yFertilityScale(countryFertilityData);
        const yValPopulation = yPopulationScale(countryPopulationData);

        d3.select("#fer-highlight-line")
            .attr("x1", xVal)
            .attr("x2", xVal)
            .attr("y1", 0)
            .attr("y2", chartHeight);

        d3.select("#fer-highlight-circle")
            .attr("cx", xVal)
            .attr("cy", yValFertility)
            .attr("fill", getFertilityColor(countryFertilityData));

        d3.select("#pop-highlight-line")
            .attr("x1", xVal)
            .attr("x2", xVal)
            .attr("y1", 0)
            .attr("y2", chartHeight);

        d3.select("#pop-highlight-circle")
            .attr("cx", xVal)
            .attr("cy", yValPopulation);
    }
}

/**
 * Retrieves the correspondent color for fertility rate according to the value
 * @param value of the fertility rate
 * @returns {string} of the color
 */
function getFertilityColor(value) {
    if (value <= 1.0) return "#ffffe5";
    if (value <= 2.0) return "#f7fcb9";
    if (value <= 3.0) return "#d9f0a3";
    if (value <= 4.0) return "#addd8e";
    if (value <= 5.0) return "#78c679";
    if (value <= 6.0) return "#41ab5d";
    if (value <= 7.0) return "#238443";
    return "#005a32";
}