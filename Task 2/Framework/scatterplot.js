/* variables for scatterplot */

/*
* Data Visualization - Dashboard Scatterplot
* This file contains the logic for the scatterplot on the main dashboard.
*/

// --- 1. DEFINE VARIABLES ---
// We define variables in this file's scope to avoid conflicts with other plots.
let dashboardScatterSvg, scatterplotWidth, scatterplotHeight, scatterplotMargin;
let xDashboardScale, yDashboardScale;
let xDashboardAxis, yDashboardAxis;
let xDashboardAxisLabel, yDashboardAxisLabel;


function appendChartToContainer(containerSelector, chartGenerator) {
    const container = d3.select(containerSelector);

    // Safety check: make sure the container exists
    if (container.empty()) {
        console.error(`Chart container "${containerSelector}" not found.`);
        return;
    }

    // 1. Clear the container of any previous content.
    container.html("");

    // 2. Call the generator function to create the chart node and append it.
    container.append(chartGenerator);
}

/**
 * Initializes an empty scatterplot on the dashboard.
 * This function sets up the SVG container, margins, scales, and axes.
 * It's called when the dashboard is first created.
 */
function createDashboardScatterplot() {
    console.log("Creating self-contained scatterplot node...");

    // 1. Specify the chart’s fixed dimensions.
    const width = 500; // You can adjust this size
    const height = 350; // You can adjust this size
    const marginTop = 30;
    const marginRight = 30;
    const marginBottom = 60;
    const marginLeft = 70;

    // 2. Prepare the scales with a default domain.
    const x = d3.scaleLinear()
        .domain([0, 100]) // Default placeholder domain
        .range([marginLeft, width - marginRight]);

    const y = d3.scaleLinear()
        .domain([0, 100]) // Default placeholder domain
        .range([height - marginBottom, marginTop]);

    // 3. Create the SVG container in memory.
    const svg = d3.create("svg")
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "max-width: 100%; height: auto;"); // Makes the SVG responsive

    // 4. Create the axes.
    svg.append("g")
        .attr("transform", `translate(0, ${height - marginBottom})`)
        .call(d3.axisBottom(x))
        .call(g => g.append("text")
            .attr("x", width - marginRight)
            .attr("y", marginBottom - 4)
            .attr("fill", "currentColor")
            .attr("text-anchor", "end")
            .text("X-Axis Placeholder →"));

    svg.append("g")
        .attr("transform", `translate(${marginLeft}, 0)`)
        .call(d3.axisLeft(y))
        .call(g => g.append("text")
            .attr("x", -marginLeft)
            .attr("y", 15)
            .attr("fill", "currentColor")
            .attr("text-anchor", "start")
            .text("↑ Y-Axis Placeholder"));
            
    // Here you would add your grid lines or initial elements if desired.
    // The `updateDashboardScatterplot` function will be used later to add the actual data points.

    // 5. Return the finished SVG node.
    return svg.node();
}

/**
 * Updates the scatterplot with data.
 * (This function will need to be adapted to work with the new structure if you use it later)
 */
function updateDashboardScatterplot(data) {
    console.log("updateDashboardScatterplot would be called with:", data);
    // Future logic to update the chart will go here.
}