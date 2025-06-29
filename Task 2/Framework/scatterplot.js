/*
* Data Visualization - Dashboard Scatterplot Module
* This file contains all logic for creating and updating the dashboard scatterplot.
*/

// --- 1. DEFINE MODULE-LEVEL VARIABLES ---
// These variables will store the state of our chart so the update function can access them.
let svg,
    x,
    y,
    fullData,
    xAccessor,
    yAccessor;

/**
 * Initializes the dashboard scatterplot, creating the SVG, scales, and axes.
 * This should only be called once.
 * @param {object} config - A configuration object.
 * @param {string} config.container - The CSS selector for the chart's container.
 * @param {Array} config.data - The complete array of data objects.
 * @param {string} config.xCol - The name of the column for the X-axis.
 * @param {string} config.yCol - The name of the column for the Y-axis.
 */
function initDashboardScatterplot(config) {
    console.log("Initializing scatterplot module with config:", config);
    
    // Store the configuration in our module-level variables
    fullData = config.data;
    xAccessor = config.xCol;
    yAccessor = config.yCol;

    // --- Create the chart structure (similar to your previous create function) ---
    const container = d3.select(config.container);
    container.html(""); // Clear the container

    const width = 500, height = 350, marginTop = 30, marginRight = 30, marginBottom = 60, marginLeft = 70;

    // Create and store the scales
    x = d3.scaleLinear()
        .domain(d3.extent(fullData, d => +d[xAccessor])).nice()
        .range([marginLeft, width - marginRight]);

    y = d3.scaleLinear()
        .domain(d3.extent(fullData, d => +d[yAccessor])).nice()
        .range([height - marginBottom, marginTop]);

    // Create and store the main SVG element
    svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
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
    if (!svg) { // Don't run if the chart hasn't been initialized
        console.error("Scatterplot has not been initialized. Call initDashboardScatterplot first.");
        return;
    }
    
    // Filter the data for the given year
    const chartData = fullData.filter(d => +d.Year === +currentYear);

    // Select the dots group and update the data
    svg.select(".scatterplot-dots")
      .selectAll("circle")
      .data(chartData, d => d.Name)
      .join(
          enter => enter.append("circle")
              .attr("r", 4)
              .style("opacity", 0)
              .attr("cx", d => x(+d[xAccessor]))
              .attr("cy", d => y(+d[yAccessor]))
              .call(enter => enter.transition().duration(300).style("opacity", 1)),
          update => update
              .call(update => update.transition().duration(300)
                  .attr("cx", d => x(+d[xAccessor]))
                  .attr("cy", d => y(+d[yAccessor]))),
          exit => exit
              .call(exit => exit.transition().duration(300).style("opacity", 0).remove())
      );
}