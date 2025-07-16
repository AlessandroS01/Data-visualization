/*
* Data Visualization - Dashboard Scatterplot Module
*/

// --- MODULE-LEVEL VARIABLES ---
let svg,
    x, y, radiusScale,
    originalX, originalY,
    fullData,
    xAccessor, yAccessor, sizeAccessor,
    brush,
    isBrushing = false; // NEW: State flag to track brushing/zooming action

// the formatter we used to use - had a problem of outputting billions as G
// const xAxisFormatter = d3.format("$.2s"); 

// custom formattter - outputs billions as B, makes more sense for money
const xAxisFormatter = (d) => {
    const absD = Math.abs(d);

    if (absD >= 1e12) { // Trillions
        return `$${(d / 1e12).toFixed(0)}T`;
    } else if (absD >= 1e9) { // Billions
        return `$${(d / 1e9).toFixed(0)}B`; // Changed G to B here
    } else if (absD >= 1e6) { // Millions
        return `$${(d / 1e6).toFixed(0)}M`;
    } else if (absD >= 1e3) { // Thousands
        return `$${(d / 1e3).toFixed(0)}k`;
    } else {
        return `$${d.toFixed(2)}`; // For values less than 1000
    }
};
// --- SCATTERPLOT INITIALIZATION ---

/**
 * Initializes the dashboard scatterplot.
 */
function initDashboardScatterplot(config) {
    fullData = config.data;
    xAccessor = config.xCol;
    yAccessor = config.yCol;
    sizeAccessor = config.sizeCol;

    const container = d3.select(config.container);
    container.html("");

    // console.log(container.node().clientWidth, container.node().clientHeight);

    // fixed height and width for internal usage
    const width = 1000;
    const height = 800;

    const marginTop = 30, marginRight = 30, marginBottom = 60, marginLeft = 70;

    x = d3.scaleLinear()
        .domain(d3.extent(fullData, d => +d[xAccessor])).nice()
        .range([marginLeft, width - marginRight]);
    y = d3.scaleLinear()
        .domain(d3.extent(fullData, d => +d[yAccessor])).nice()
        .range([height - marginBottom, marginTop]);

    originalX = x.copy();
    originalY = y.copy();

    radiusScale = d3.scaleSqrt()
        .domain(d3.extent(fullData, d => +d[sizeAccessor])).nice()
        .range([10, 20]);

    svg = d3.create("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .style("width", "100%")
        .style("height", "100%");

    const clipId = "scatterplot-clip-path";
    svg.append("defs").append("clipPath")
        .attr("id", clipId)
        .append("rect")
        .attr("x", marginLeft)
        .attr("y", marginTop)
        .attr("width", width - marginLeft - marginRight)
        .attr("height", height - marginTop - marginBottom);

    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${height - marginBottom})`)
        .call(d3.axisBottom(x)
            .tickFormat(xAxisFormatter));

    svg.append("g")
        .attr("class", "y-axis")
        .attr("transform", `translate(${marginLeft}, 0)`)
        .call(d3.axisLeft(y));

    svg.append("text")
        .attr("class", "x-axis-label") 
        .attr("x", width / 2)
        .attr("y", height - marginBottom / 2 + 15)
        .attr("text-anchor", "middle")
        .attr("fill", "#333")
        .text("GDP");
    
    svg.append("text")
        .attr("class", "y-axis-label") 
        .attr("x", -height / 2) 
        .attr("y", marginLeft / 2 - 15) 
        .attr("transform", "rotate(-90)")
        .attr("text-anchor", "middle")
        .attr("fill", "#333")
        .text("GINI Coefficient"); 

    brush = d3.brush()
        .extent([[marginLeft, marginTop], [width - marginRight, height - marginBottom]])
        .on("start", brushStarted)
        .on("end", brushed);

    svg.append("g")
        .attr("class", "brush")
        .call(brush);

    svg.append("g")
        .attr("class", "scatterplot-dots")
        .attr("clip-path", `url(#${clipId})`);


    svg.on("contextmenu", (event) => {
        event.preventDefault();
        x.domain(originalX.domain());
        y.domain(originalY.domain());
        updateView();
    });

    container.node().append(svg.node());
}

/**
 * Handles data changes according to the year
 * this function is also called to reflect color changes according to the selectedCountries from other charts
 */
function updateDashboardScatterplot(currentYear) {
    if (!svg) { return; }

    const chartData = fullData.filter(d => +d.Year === +currentYear && +d[xAccessor] !== 0 && +d[yAccessor] !== 0);

    const circles = svg.select(".scatterplot-dots")
        .selectAll("circle")
        .data(chartData, d => d.Name)
        .join(
            enter => enter.append("circle")
                .attr("class", d => {
                    const continent = mapCountryContinent.get(d.Name);
                    const continentClass = continent ? `continent-${continent.replace(/[\s.]/g, '_')}` : '';
                    return `scatter-circle ${continentClass}`;
                })
                .attr("id", d => `scatter-${d.Name.replace(/[\s.]/g, '_')}`)
                .attr("r", 0)
                .attr("cx", d => x(+d[xAccessor]))
                .attr("cy", d => y(+d[yAccessor]))
                .style("opacity", d => isPointInBounds(d) ? 1 : 0) // make points that are out of bounds invisible
                .attr("fill", d => {
                    const continent = mapCountryContinent.get(d.Name); // color countries according to its continent
                    return continentColors[continent] || "#ccc"; // Default to gray if continent not found
                })
                .call(enter => enter.transition().duration(300)
                    .attr("r", d => radiusScale(+d[sizeAccessor]))),
            update => update
                .call(update => update.transition().duration(300)
                    .attr("r", d => radiusScale(+d[sizeAccessor]))
                    .attr("cx", d => x(+d[xAccessor]))
                    .attr("cy", d => y(+d[yAccessor]))
                    .attr("fill", d => {
                        const continent = mapCountryContinent.get(d.Name);
                        return continentColors[continent] || "#ccc";
                    })
                ),
            exit => exit
                .call(exit => exit.transition().duration(300)
                    .attr("r", 0)
                    .style("opacity", 0)
                    .remove())
        );

    // add events to circles
    circles
        // bring up the line chart when its being hovered
        .on("mouseover", (event, d) => {
            if (isBrushing) return;

            hoveredCountry = d.Name;
            chartsHighlighting();

            createPopulationLineChart(d.Name);

            d3.select(".map-tooltip")
            .style("left", (event.pageX + 15) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        // remove the line chart
        .on("mouseout", () => {
            if (isBrushing) return;

            hoveredCountry = "";
            chartsHighlighting();

            d3.select(".map-tooltip").remove();
        })
        // add to dashboard when its clicked
        .on("click", function(event, d) {
            const countryName = d.Name;
            const geoFeatureForCountry = countriesGeoJsonFeatures.find(feature =>
                feature.properties.name === countryName
            );

            // Optional: prevent duplicates
            if (!selectedCountries.includes(countryName)) {
                if (selectedCountries.length === colorListWorld.length) {
                    window.confirm("You've selected the maximum number of countries. \n " +
                        "To continue the selection remove at least one of them.");
                } else {
                    addSelectedCountry(countryName, geoFeatureForCountry);
                }
            } else {
                removeSelectedCountry(countryName);
            }
    });

    // draw outlines for selected(clicked) countries
    updateScatterplotSelection();
}



// Brushing - zooming in and out(resetting)
// ---------------------------------------------------------------------------------------------


/**
 * marks the start of a brush gesture
*/
function brushStarted() {
    isBrushing = true;
    // Remove any tooltip that might be active when the brush starts
    d3.select(".map-tooltip").remove();
}

/**
 * marks the end of a brush gesture
*/
function brushed({selection}) {
    isBrushing = false;
    
    if (selection) {
        // new ranges to zoom in on
        const xValues = [selection[0][0], selection[1][0]].map(d => x.invert(d));
        const yValues = [selection[0][1], selection[1][1]].map(d => y.invert(d));
        
        // new domain - new scale for the x and y axis
        const newXDomain = d3.extent(xValues);
        const newYDomain = d3.extent(yValues);
        
        x.domain(newXDomain).nice();
        y.domain(newYDomain).nice();
        
        svg.select(".brush").call(brush.move, null);
        updateView();
    }
}

/**
 * returns whether a data point is within the current domains of the x and y scales
 */
function isPointInBounds(d) {
    const xVal = +d[xAccessor];
    const yVal = +d[yAccessor];
    const xDomain = x.domain();
    const yDomain = y.domain();

    return xVal >= xDomain[0] && xVal <= xDomain[1] &&
           yVal >= yDomain[0] && yVal <= yDomain[1];
}

/**
 * handles view change (i.e., after a zoom or reset).
 */
function updateView() {
    // update the axis with the new scale
    svg.select(".x-axis").transition().duration(750).call(d3.axisBottom(x)
        .tickFormat(xAxisFormatter));
    svg.select(".y-axis").transition().duration(750).call(d3.axisLeft(y));

    // update the circles and if they are out of bounds, lower their opacity
    svg.select(".scatterplot-dots").selectAll("circle")
        .transition().duration(750)
        .attr("cx", d => x(+d[xAccessor]))
        .attr("cy", d => y(+d[yAccessor]))
        .style("opacity", d => isPointInBounds(d) ? 1 : 0.1);
}

// Clicking - outlining points that are added to the dashboard(selectedCountries) with red
// ---------------------------------------------------------------------------------------------

function updateScatterplotSelection() {
    d3.select(".scatterplot").selectAll(".scatter-circle")
    .each(function(d) {
        const circle = d3.select(this);
        const countryName = d.Name;
        
        if (selectedCountries.includes(countryName)) {
            circle.classed("selected", true)
                    .style("opacity", 1)
                    .attr("stroke", "red")
                    .attr("stroke-width", 3)
                    .raise();
            } else {
                circle.classed("selected", false)
                    .attr("stroke", null)
                    .attr("stroke-width", null);
            }
        });
}