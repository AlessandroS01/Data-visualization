/* variables for parallel chart */
let parallelChart;
let gParallelChart;
let yParallelScale;

const viewBoxHeightParallel = 100;
const viewBoxWidthParallel = 100;

const excludedDimensions = ["Year", "GDP", "GiniC", "Population"];
let dimensionsParallelOrder;

const tickLength = 2;

function createParallelChart(mapCountryContinent) {
    dimensionsParallelOrder = numericalColumnsData.filter(dim => !excludedDimensions.includes(dim));

    const container = d3.select(".parallel-chart");

    parallelChart = container
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("viewBox", `0 0 ${viewBoxWidthParallel} ${viewBoxHeightParallel}`);

    gParallelChart = parallelChart.append("g");

    // Define y-scales
    yParallelScale = {};
    dimensionsParallelOrder.forEach(dim => {
        yParallelScale[dim] = d3.scaleLinear()
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
        .each(function() {
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
                .attr("y1", d => yParallelScale["FertilityR"](d.valueEnd))
                .attr("y2", d => yParallelScale["FertilityR"](d.valueStart))
                .attr("stroke", d => getFertilityColor(d.valueStart))
                .attr("stroke-width", 1);
        });

    // Keep reference for drag
    axisGroups.each(function(d) {
        d3.select(this).attr("data-dim", d);
    });

    drawDataLines(fertilityData.filter(d => +d.Year === +currentYear), mapCountryContinent);
}

function drawDataLines(data, mapCountryContinent) {
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip-country")
        .style("position", "absolute")
        .style("background", "rgba(0, 0, 0, 0.75)")
        .style("color", "#fff")
        .style("padding", "4px 8px")
        .style("font-size", "12px")
        .style("border-radius", "4px")
        .style("pointer-events", "none")
        .style("opacity", 0);

    // Filter data for countries present in the map
    const filteredData = data.filter(d => mapCountryContinent.has(d.Name));


    // Remove old lines before drawing new ones (optional but recommended)
    gParallelChart.selectAll(".data-line").remove();

    // Draw one path per country
    gParallelChart.selectAll(".data-line")
        .data(filteredData)
        .enter()
        .append("path")
        .attr("class", "data-line")
        .attr("fill", "none")
        .attr("stroke", d => getColorByContinent(mapCountryContinent.get(d.Name))) // example coloring by continent
        .attr("stroke-width", 0.3)
        .attr("d", d => {
            console.log("Drawing line for", d.Name);
            // Build line path connecting each dimension point for this country
            return d3.line()(dimensionsParallelOrder.map(dim => {
                const x = (dimensionsParallelOrder.indexOf(dim) / (dimensionsParallelOrder.length - 1)) * viewBoxWidthParallel;
                const yVal = d[dim];
                const y = yParallelScale[dim](yVal); // your y scale for that dimension
                return [x, y];
            }));
        })
        .on("mouseover", function(event, d) {
            tooltip
                .style("opacity", 1)
                .html(`<strong>${d.Name}</strong>`)
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY - 20}px`);

            d3.select(this)
                .attr("stroke-width", 1)
                .attr("stroke", "black");
        })
        .on("mousemove", function(event) {
            tooltip
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY - 20}px`);
        })
        .on("mouseout", function(event, d) {
            tooltip
                .style("opacity", 0);

            d3.select(this)
                .attr("stroke-width", 0.3)
                .attr("stroke", d => getColorByContinent(mapCountryContinent.get(d.Name)));
        });
}


// Dragging variables

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