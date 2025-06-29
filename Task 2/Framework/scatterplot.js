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
    brush;

/**
 * Initializes the dashboard scatterplot.
 */
function initDashboardScatterplot(config) {
    // ... (This function remains unchanged from the last version)
    console.log("Initializing scatterplot module with config:", config);
    
    fullData = config.data;
    xAccessor = config.xCol;
    yAccessor = config.yCol;
    sizeAccessor = config.sizeCol;

    const container = d3.select(config.container);
    container.html("");

    const width = 1000, height = 800, marginTop = 30, marginRight = 30, marginBottom = 60, marginLeft = 70;

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
        .range([2, 18]);

    svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "max-width: 100%; height: auto;");
        
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
        .call(d3.axisBottom(x));
    
    svg.append("g")
        .attr("class", "y-axis")
        .attr("transform", `translate(${marginLeft}, 0)`)
        .call(d3.axisLeft(y));
        
    brush = d3.brush()
        .extent([[marginLeft, marginTop], [width - marginRight, height - marginBottom]])
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
    
    const chartData = fullData.filter(d => +d.Year === +currentYear);
    
    const circles = svg.select(".scatterplot-dots")
      .selectAll("circle")
      .data(chartData, d => d.Name)
      .join(
          enter => enter.append("circle")
              .attr("r", 0)
              .attr("cx", d => x(+d[xAccessor]))
              .attr("cy", d => y(+d[yAccessor]))
              // Set initial opacity based on whether it's in the current view
              .style("opacity", d => isPointInBounds(d) ? 1 : 0)
              .call(enter => enter.transition().duration(300)
                  .attr("r", d => radiusScale(+d[sizeAccessor]))),
          update => update
              .call(update => update.transition().duration(300)
                  .attr("cx", d => x(+d[xAccessor]))
                  .attr("cy", d => y(+d[yAccessor]))),
          exit => exit
              .call(exit => exit.transition().duration(300)
                  .attr("r", 0)
                  .style("opacity", 0)
                  .remove())
      );
      
    circles.on("mouseover", /*... event listener logic ...*/);
}

/**
 * (NEW HELPER) Checks if a data point is within the current domains of the x and y scales.
 * @param {object} d - The data point object.
 * @returns {boolean} - True if the point is in bounds, false otherwise.
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
    // Update axes
    svg.select(".x-axis").transition().duration(750).call(d3.axisBottom(x));
    svg.select(".y-axis").transition().duration(750).call(d3.axisLeft(y));

    // Update circle positions AND opacity
    svg.select(".scatterplot-dots").selectAll("circle")
        .transition().duration(750)
        .attr("cx", d => x(+d[xAccessor]))
        .attr("cy", d => y(+d[yAccessor]))
        // --- (NEW) Set opacity based on whether the point is in the new view ---
        .style("opacity", d => isPointInBounds(d) ? 1.0 : 0.1);
}


/**
 * This function is called at the end of a brush gesture.
 */
function brushed({selection}) {
    // ... (This function remains unchanged from the last version)
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