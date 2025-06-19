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
                    // Create the tooltip on hover
                    d3.select("body")
                        .append("div")
                        .attr("class", "hover-tooltip")
                        .attr("width", "250px")
                        .attr("hieght", "200px")
                        .style("position", "absolute")
                        .style("background", "#fff")
                        .style("border", "1px solid #ccc")
                        .style("padding", "6px 10px")
                        .style("border-radius", "4px")
                        .style("box-shadow", "0 0 6px rgba(0,0,0,0.2)")
                        .style("font-size", "12px")
                        .style("pointer-events", "none")
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY + 10) + "px")
                        .text(d.properties.name);
                })
                .on('mousemove', function(event) {
                    // Update position if mouse moves
                    d3.select(".hover-tooltip")
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY + 10) + "px");
                })
                .on('mouseout', function() {
                    // Remove tooltip on mouse out
                    d3.select(".hover-tooltip").remove();
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
 * Updates the map based on the current year and fertility data and handles
 * change of the fertility value inside each selected country
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

    selectedCountry.forEach(countryName => {
        const textId = `label-${countryName.replace(/[\s.]/g, '_')}`;

        const matchedEntry = fertilityData.find(value =>
            +value.Year === +currentYear && value.Name === countryName
        );
        const fertilityValue = matchedEntry ? matchedEntry.FertilityR : "NaN";
        d3.select(`#${textId}`)
            .text(fertilityValue);
    })
}