/*
* Data Visualization - Dashboard Scatterplot Module
* This file contains all logic for creating and updating the dashboard scatterplot.
*/

// --- 1. DEFINE MODULE-LEVEL VARIABLES ---
let svg,
    x,
    y,
    radiusScale,      // <-- ADD THIS
    fullData,
    xAccessor,
    yAccessor,
    sizeAccessor;     // <-- ADD THIS

/**
 * Initializes the dashboard scatterplot, creating the SVG, scales, and axes.
 * This should only be called once.
 * @param {object} config - A configuration object.
 * @param {string} config.container - The CSS selector for the chart's container.
 * @param {Array} config.data - The complete array of data objects.
 * @param {string} config.xCol - The name of the column for the X-axis.
 * @param {string} config.yCol - The name of the column for the Y-axis.
 * @param {string} config.sizeCol - The name of the column for the circle size.
 */
function initDashboardScatterplot(config) {
    console.log("Initializing scatterplot module with config:", config);
    
    // Store the configuration in our module-level variables
    fullData = config.data;
    xAccessor = config.xCol;
    yAccessor = config.yCol;
    sizeAccessor = config.sizeCol; // <-- ADD THIS

    const container = d3.select(config.container);
    container.html("");

    const width = 1000, height = 800, marginTop = 30, marginRight = 30, marginBottom = 60, marginLeft = 70;

    // Create and store the X and Y scales
    x = d3.scaleLinear()
        .domain(d3.extent(fullData, d => +d[xAccessor])).nice()
        .range([marginLeft, width - marginRight]);

    y = d3.scaleLinear()
        .domain(d3.extent(fullData, d => +d[yAccessor])).nice()
        .range([height - marginBottom, marginTop]);

    // --- (NEW) Create and store the Radius Scale ---
    radiusScale = d3.scaleSqrt()
        .domain(d3.extent(fullData, d => +d[sizeAccessor])).nice()
        .range([2, 18]); // Circles will have a radius between 2px and 18px
    // ---------------------------------------------

    // Create and store the main SVG element
    svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        // ... (rest of the init function is the same)
        // ...
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "max-width: 100%; height: auto;");

    // Create axes and labels
    svg.append("g")
        .attr("transform", `translate(0, ${height - marginBottom})`)
        .call(d3.axisBottom(x));
    svg.append("text")
        .attr("x", width - marginRight)
        .attr("y", height - 4)
        .attr("fill", "currentColor")
        .attr("text-anchor", "end")
        .text(`${xAccessor} →`);

    svg.append("g")
        .attr("transform", `translate(${marginLeft}, 0)`)
        .call(d3.axisLeft(y));
    svg.append("text")
        .attr("x", -marginLeft)
        .attr("y", 15)
        .attr("fill", "currentColor")
        .attr("text-anchor", "start")
        .text(`↑ ${yAccessor}`);
        
    // Add a group for the dots
    svg.append("g")
        .attr("class", "scatterplot-dots")
        .attr("stroke", "steelblue")
        .attr("fill", "steelblue")
        .attr("fill-opacity", 0.5);

    // Append the newly created SVG to the container
    container.node().append(svg.node());
}


/**
 * Updates the data points in the scatterplot based on a new year.
 * @param {number} currentYear - The year to display.
 */
function updateDashboardScatterplot(currentYear) {
    if (!svg) {
        console.error("Scatterplot has not been initialized. Call initDashboardScatterplot first.");
        return;
    }
    
    const chartData = fullData.filter(d => +d.Year === +currentYear);

    // --- (CORRECTED LOGIC) ---
    // The `circles` variable now stores the final, merged selection returned by .join()
    const circles = svg.select(".scatterplot-dots")
      .selectAll("circle")
      .data(chartData, d => d.Name)
      .join(
          enter => enter.append("circle")
              .style("opacity", 0)
              .attr("cx", d => x(+d[xAccessor]))
              .attr("cy", d => y(+d[yAccessor]))
              .attr("r", 0) // Start at radius 0
              .call(enter => enter.transition().duration(300)
                  .style("opacity", 1)
                  .attr("r", d => radiusScale(+d[sizeAccessor]))), // Animate to final radius
          update => update
              .call(update => update.transition().duration(300)
                  .attr("cx", d => x(+d[xAccessor]))
                  .attr("cy", d => y(+d[yAccessor]))
                  .attr("r", d => radiusScale(+d[sizeAccessor]))),
          exit => exit
              .call(exit => exit.transition().duration(300)
                  .style("opacity", 0)
                  .attr("r", 0)
                  .remove())
      );

    // Now, attach event listeners to the 'circles' selection,
    // which contains ALL circles (both new and updated).
    circles
        .on("mouseover", function(event, d) {
            d3.select(this)
              .transition().duration(100)
              .attr("r", radiusScale(+d[sizeAccessor]) * 1.5)
              .style("stroke", "black")
              .style("stroke-width", 1.5);
            createPopulationLineChart(d.Name);
        })
        .on("mousemove", function(event) {
            d3.select(".map-tooltip")
              .style("left", (event.pageX + 15) + "px")
              .style("top", (event.pageY + 10) + "px");
        })
        .on("mouseout", function(event, d) {
            d3.select(this)
              .transition().duration(100)
              .attr("r", radiusScale(+d[sizeAccessor]))
              .style("stroke", "none");
            d3.select(".map-tooltip").remove();
            hoveredCountry = "";
        });
}