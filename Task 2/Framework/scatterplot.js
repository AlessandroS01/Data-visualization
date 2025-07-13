/*
* Data Visualization - Dashboard Scatterplot Module
* This file contains all logic for creating, updating, and interacting with the dashboard scatterplot.
*/

// --- 1. DEFINE MODULE-LEVEL VARIABLES ---
let svg,
    x, y, radiusScale,
    originalX, originalY,
    fullData,
    xAccessor, yAccessor, sizeAccessor,
    brush,
    isBrushing = false; // NEW: State flag to track brushing/zooming action

const xAxisFormatter = d3.format("$.2s"); // to avoid overlapping labels in the x axis 

// --- 3. SCATTERPLOT INITIALIZATION AND UPDATES ---

/**
 * Initializes the dashboard scatterplot.
 */
function initDashboardScatterplot(config) {
    // console.log("Initializing scatterplot module with config:", config);

    fullData = config.data;
    xAccessor = config.xCol;
    yAccessor = config.yCol;
    sizeAccessor = config.sizeCol;

    const container = d3.select(config.container);
    container.html("");

    console.log(container.node().clientWidth, container.node().clientHeight);

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
        .text("Birth Rates"); 

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
 * Main update function. Handles DATA changes (i.e., when the year changes).
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
                .style("opacity", d => isPointInBounds(d) ? 1 : 0)
                .attr("fill", d => {
                    const continent = mapCountryContinent.get(d.Name);
                    return continentColors[continent] || "#ccc"; // Default to gray if continent not found
                })
                .call(enter => enter.transition().duration(300)
                    .attr("r", d => radiusScale(+d[sizeAccessor]))),
            update => update
                .call(update => update.transition().duration(300)
                    .attr("cx", d => x(+d[xAccessor]))
                    .attr("cy", d => y(+d[yAccessor]))
                    .attr("fill", d => {
                        const continent = mapCountryContinent.get(d.Name);
                        return continentColors[continent] || "#ccc"; // Default to gray if continent not found
                    })
                ),
            exit => exit
                .call(exit => exit.transition().duration(300)
                    .attr("r", 0)
                    .style("opacity", 0)
                    .remove())
        );

    circles
        .on("mouseover", (event, d) => {
            if (isBrushing) return;

            hoveredCountry = d.Name;
            chartsHighlighting();

            // Call your function to create the tooltip
            createPopulationLineChart(d.Name);

            // Position the tooltip near the cursor
            d3.select(".map-tooltip")
            .style("left", (event.pageX + 15) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => {
            if (isBrushing) return;

            hoveredCountry = "";
            chartsHighlighting();

            d3.select(".map-tooltip").remove();
        })
        .on("click", function(event, d) {
            const countryName = d.Name;
            const geoFeatureForCountry = countriesGeoJsonFeatures.find(feature =>
                feature.properties.name === countryName
            );
            console.log(countryName);
            if (selectedCountries.includes(countryName)) { // Check against the central state
                removeSelectedCountry(countryName);
            } else {
                addSelectedCountry(countryName, geoFeatureForCountry);
            }
    });
}


/**
 * (NEW HELPER) Checks if a data point is within the current domains of the x and y scales.
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
 * This function handles VIEW changes (i.e., after a zoom or reset).
 */
function updateView() {
    svg.select(".x-axis").transition().duration(750).call(d3.axisBottom(x)
        .tickFormat(xAxisFormatter));
    svg.select(".y-axis").transition().duration(750).call(d3.axisLeft(y));

    svg.select(".scatterplot-dots").selectAll("circle")
        .transition().duration(750)
        .attr("cx", d => x(+d[xAccessor]))
        .attr("cy", d => y(+d[yAccessor]))
        .style("opacity", d => isPointInBounds(d) ? 1 : 0.1);
}

/**
 * (NEW) This function is called when a brush gesture STARTS.
 */
function brushStarted() {
    isBrushing = true;
    // Remove any tooltip that might be active when the brush starts
    d3.select(".map-tooltip").remove();
}

/**
 * This function is called at the end of a brush gesture.
 * (MODIFIED to update the isBrushing state)
 */
function brushed({selection}) {
    // Brushing is now complete
    isBrushing = false;

    if (selection) {
        const xValues = [selection[0][0], selection[1][0]].map(d => x.invert(d));
        const yValues = [selection[0][1], selection[1][1]].map(d => y.invert(d));

        const newXDomain = d3.extent(xValues);
        const newYDomain = d3.extent(yValues);

        x.domain(newXDomain).nice();
        y.domain(newYDomain).nice();

        svg.select(".brush").call(brush.move, null);
        updateView();
    }
}

function updateScatterplotSelection() {
    d3.select(".scatterplot").selectAll(".scatter-circle")
        .each(function(d) {
            const circle = d3.select(this);
            const countryName = d.Name; // Assuming 'd.Name' is the country name in scatterplot data

            if (selectedCountries.includes(countryName)) {
                circle.classed("selected", true)
                    .style("opacity", 1)
                    .attr("stroke", "red")
                    .attr("stroke-width", 3)
                    .raise();   // render the selected point above all other points
            } else {
                circle.classed("selected", false)
                    .attr("stroke", null)
                    .attr("stroke-width", null);
            }
        });
}