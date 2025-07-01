/* variables for parallel chart */
let parallelChart;
let gParallelChart;

const viewBoxHeightParallel = 100;
const viewBoxWidthParallel = 100;

const excludedDimensions = ["Year", "GDP", "GiniC", "Population"];
let dimensionsParallelOrder;

const tickLength = 2;

function createParallelChart() {
    dimensionsParallelOrder = numericalColumnsData.filter(dim => !excludedDimensions.includes(dim));

    const container = d3.select(".parallel-chart");

    parallelChart = container
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("viewBox", `0 0 ${viewBoxWidthParallel} ${viewBoxHeightParallel}`);

    gParallelChart = parallelChart.append("g");

    // Define y-scales
    const y = {};
    dimensionsParallelOrder.forEach(dim => {
        y[dim] = d3.scaleLinear()
            .domain(domainScales.get(dim))
            .range([viewBoxHeightParallel, 0]);
    });

    // Create groups for each dimension, positioned horizontally
    const axisGroups = gParallelChart.selectAll("g.axis-group")
        .data(dimensionsParallelOrder, d => d)
        .enter()
        .append("g")
        .attr("class", "axis-group")
        .attr("transform", (_, i) =>
            `translate(${(i / (dimensionsParallelOrder.length - 1)) * viewBoxWidthParallel},0)`)
        .call(
            d3.drag()
                .on("start", dragStarted)
                .on("drag", dragged)
                .on("end", dragEnded)
        );

    // Draw vertical axis line inside each group
    axisGroups.append("line")
        .attr("class", "axis")
        .attr("x1", 0)
        .attr("x2", 0)
        .attr("y1", 0)
        .attr("y2", viewBoxHeightParallel)
        .attr("stroke", "black")
        .attr("stroke-width", 0.3);

    // Dimension label above the axis line
    axisGroups.append("text")
        .attr("class", "dimension-label")
        .attr("x", 0)
        .attr("y", -1)
        .attr("text-anchor", "middle")
        .attr("font-size", 2)
        .attr("fill", "black")
        .style("cursor", "grab")
        .text(d => {
            switch (d) {
                case "FertilityR": return "Fertility Rate";
                case "LifeExpectacyB": return "Life Expectancy";
                case "GR": return "Growth Rate";
                case "U5MortalityR": return "Infant Mortality";
                default: return d;
            }
        });

    // Min tick (bottom)
    axisGroups.append("line")
        .attr("x1", -tickLength)
        .attr("x2", 0)
        .attr("y1", viewBoxHeightParallel)
        .attr("y2", viewBoxHeightParallel)
        .attr("stroke", "black")
        .attr("stroke-width", 0.3);

    // Max tick (top)
    axisGroups.append("line")
        .attr("x1", -tickLength)
        .attr("x2", 0)
        .attr("y1", 0)
        .attr("y2", 0)
        .attr("stroke", "black")
        .attr("stroke-width", 0.3);

    // Min value label
    axisGroups.append("text")
        .attr("class", "min-label")
        .attr("x", -tickLength - 1)
        .attr("y", viewBoxHeightParallel - 1)
        .attr("dy", "0.35em")
        .attr("text-anchor", "end")
        .attr("font-size", 2)
        .attr("fill", "black")
        .text(d => {
            const domain = domainScales.get(d);
            return domain ? domain[0].toFixed(2) : "";
        });

    // Max value label
    axisGroups.append("text")
        .attr("class", "max-label")
        .attr("x", -tickLength - 1)
        .attr("y", 1)
        .attr("dy", "0.35em")
        .attr("text-anchor", "end")
        .attr("font-size", 2)
        .attr("fill", "black")
        .text(d => {
            const domain = domainScales.get(d);
            return domain ? domain[1].toFixed(2) : "";
        });

    // Fertility segments
    axisGroups.filter(d => d === "FertilityR")
        .each(function(d) {
            const fertilityDomain = domainScales.get("FertilityR");
            const segmentCount = 8;
            const fertilitySegments = [];
            for (let i = 0; i < segmentCount; i++) {
                const valueStart = fertilityDomain[0] + (i / segmentCount) * (fertilityDomain[1] - fertilityDomain[0]);
                const valueEnd = fertilityDomain[0] + ((i + 1) / segmentCount) * (fertilityDomain[1] - fertilityDomain[0]);
                fertilitySegments.push({ valueStart, valueEnd });
            }

            d3.select(this).selectAll("line.fertility-segment")
                .data(fertilitySegments)
                .enter()
                .append("line")
                .attr("class", "fertility-segment")
                .attr("x1", 0)
                .attr("x2", 0)
                .attr("y1", d => y["FertilityR"](d.valueEnd))
                .attr("y2", d => y["FertilityR"](d.valueStart))
                .attr("stroke", d => getFertilityColor(d.valueStart))
                .attr("stroke-width", 1);
        });

    // Keep reference for drag
    axisGroups.each(function(d) {
        d3.select(this).attr("data-dim", d);
    });
}

// Helper: get index of axis position based on X coordinate
function getClosestIndex(x) {
    const step = viewBoxWidthParallel / (dimensionsParallelOrder.length - 1);
    let index = Math.round(x / step);
    index = Math.max(0, Math.min(index, dimensionsParallelOrder.length - 1));
    return index;
}

function updateAxisPositions() {
    gParallelChart.selectAll("g.axis-group")
        .data(dimensionsParallelOrder, d => d)
        .transition()
        .duration(500)
        .attr("transform", (_, i) => `translate(${(i / (dimensionsParallelOrder.length - 1)) * viewBoxWidthParallel},0)`);
}

function swapDimensions(dim1, dim2) {
    const i1 = dimensionsParallelOrder.indexOf(dim1);
    const i2 = dimensionsParallelOrder.indexOf(dim2);
    if (i1 === -1 || i2 === -1) return;

    [dimensionsParallelOrder[i1], dimensionsParallelOrder[i2]] = [dimensionsParallelOrder[i2], dimensionsParallelOrder[i1]];
    updateAxisPositions();
}


let draggedIndex = null;
let dragStartX = null;
let dragCurrentX = null;

const axisPositions = () =>
    dimensionsParallelOrder.map((_, i) => (i / (dimensionsParallelOrder.length - 1)) * viewBoxWidthParallel);

function dragStarted(event, d) {
    draggedIndex = dimensionsParallelOrder.indexOf(d);
    dragStartX = event.x; // screen coords of pointer
    dragCurrentX = dragStartX;

    d3.select(this).raise().classed("active", true);
}

function dragged(event, d) {
    const dx = event.x - dragCurrentX;
    dragCurrentX = event.x;

    // Current translate X + delta dx, parse current transform:
    const currentTransform = d3.select(this).attr("transform");
    const match = currentTransform.match(/translate\(([^,]+),/);
    let currentX = match ? parseFloat(match[1]) : 0;
    let newX = currentX + dx;

    // Limit newX to SVG width bounds (optional)
    newX = Math.max(0, Math.min(newX, viewBoxWidthParallel));

    d3.select(this).attr("transform", `translate(${newX},0)`);
}

function dragEnded(event, d) {
    d3.select(this).classed("active", false);

    // Parse final x after dragging
    const currentTransform = d3.select(this).attr("transform");
    const match = currentTransform.match(/translate\(([^,]+),/);
    let finalX = match ? parseFloat(match[1]) : 0;

    // Calculate closest axis position
    const positions = axisPositions();

    let closestIndex = 0;
    let minDist = Infinity;
    positions.forEach((pos, i) => {
        const dist = Math.abs(finalX - pos);
        if (dist < minDist) {
            minDist = dist;
            closestIndex = i;
        }
    });

    // Only reorder if moved enough (>5 units here)
    const oldIndex = draggedIndex;
    if (oldIndex !== closestIndex && Math.abs(finalX - positions[oldIndex]) > 5) {
        dimensionsParallelOrder.splice(oldIndex, 1);
        dimensionsParallelOrder.splice(closestIndex, 0, d);
    }

    // Reset indices
    draggedIndex = null;
    dragStartX = null;
    dragCurrentX = null;

    // Reset all axis positions smoothly
    gParallelChart.selectAll("g.axis-group")
        .data(dimensionsParallelOrder, d => d)
        .transition()
        .duration(300)
        .attr("transform", (_, i) => `translate(${positions[i]},0)`);
}