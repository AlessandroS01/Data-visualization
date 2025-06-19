/* variables for main map */
let mapChart, gMap;
const mapWidth = "80%";  // base width for map
const mapHeight = 400 + "px"; // base height for map
const projection = d3.geoEquirectangular().scale(160);
const path = d3.geoPath(projection); // generate paths according to the projection used and the geojson data


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
    let tooltipHeader = d3.select(".map-tooltip-header");
    tooltipHeader.select("text").text(currentYear);
}


/**
 * Generate line charts when hovering over a country
 */
function createPopulationLineChart(countryName) {
    // Create the tooltip on hover
    let tooltip = d3.select("body")
        .append("div")
        .attr("class", "map-tooltip");

    let header = tooltip.append("div")
        .attr("class", "map-tooltip-header");
    header.append("h3").text(countryName).style("margin", 0);
    header.append("text").text(currentYear);

    let linecharts = tooltip.append("div")
        .attr("class", "map-tooltip-charts-container");


    let filteredCountryData = fertilityData.filter(
        value => value.Name === countryName
    );

    if (filteredCountryData.length === 0) {
        linecharts
            .append("h4")
            .text("No Data Available")
            .style("box-sizing", "border-box")
            .style("margin", "0")
            .style("font-size", "14px")
            .style("color", "dimgray");
    } else {
        let fertilityDomain = d3.extent(
            filteredCountryData, d => +d["FertilityR"]
        );
        let populationDomain = d3.extent(
            filteredCountryData, d => +d["Population"]
        );
        const currentData = filteredCountryData.find(
            d => d.Year === currentYear
        );
        console.log(currentData)

        const chartHeight = 80;
        const gap = 10;
        const totalHeight = chartHeight * 2 + gap + 20;

        const width = linecharts.node().getBoundingClientRect().width;

        const svg = linecharts.append("svg")
            .attr("viewBox", `0 0 ${width} ${totalHeight}`)
            .attr("preserveAspectRatio", "xMidYMid meet")
            .style("width", "100%")
            .style("height", "auto");

        // X Scale
        const x = d3.scaleLinear()
            .domain([startYear, endYear])
            .range([0, width]);

        // Y Scales
        const yFertility = d3.scaleLinear()
            .domain(fertilityDomain).nice()
            .range([chartHeight, 0]);

        const yPop = d3.scaleLinear()
            .domain(populationDomain).nice()
            .range([chartHeight, 0]);

// Line Generators
        const lineFertility = d3.line()
            .x(d => x(d.Year))
            .y(d => yFertility(d.FertilityR));

        const linePop = d3.line()
            .x(d => x(d.Year))
            .y(d => yPop(d.Population));

// Chart 1: Fertility
        const gFert = svg.append("g");
        gFert.append("path")
            .datum(filteredCountryData)
            .attr("fill", "none")
            .attr("stroke", "mediumpurple")
            .attr("stroke-width", 2)
            .attr("d", lineFertility);

// Highlight Point (Fertility)

        if (currentData) {
            const xVal = x(currentYear);
            const yVal = yFertility(currentData.FertilityR);

            gFert.append("line")
                .attr("x1", xVal)
                .attr("x2", xVal)
                .attr("y1", 0)
                .attr("y2", chartHeight)
                .attr("stroke", "#ccc")
                .attr("stroke-dasharray", "2,2");

            gFert.append("circle")
                .attr("cx", xVal)
                .attr("cy", yVal)
                .attr("r", 4)
                .attr("fill", "mediumpurple");

            // Fertility Value Label
            gFert.append("text")
                .text(currentData.FertilityR.toFixed(1))
                .attr("x", xVal + 5)
                .attr("y", yVal - 10)
                .attr("fill", "mediumpurple")
                .style("font-size", "12px");
        }

// Chart 2: Population
        const gPop = svg.append("g")
            .attr("transform", `translate(0, ${chartHeight + gap})`);

        gPop.append("path")
            .datum(filteredCountryData)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 2)
            .attr("d", linePop);

// Highlight Point (Population)
        if (currentData) {
            const xVal = x(currentYear);
            const yVal = yPop(currentData.Population);

            gPop.append("line")
                .attr("x1", xVal)
                .attr("x2", xVal)
                .attr("y1", 0)
                .attr("y2", chartHeight)
                .attr("stroke", "#ccc")
                .attr("stroke-dasharray", "2,2");

            gPop.append("circle")
                .attr("cx", xVal)
                .attr("cy", yVal)
                .attr("r", 4)
                .attr("fill", "steelblue");

            // Population Value Label
            gPop.append("text")
                .text(d3.format(",")(currentData.Population))
                .attr("x", xVal + 5)
                .attr("y", yVal - 10)
                .attr("fill", "steelblue")
                .style("font-size", "12px");
        }

    }

}