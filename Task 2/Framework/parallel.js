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
        .attr("id", d => `axis-${d}`)
        .attr("transform", (_, i) =>
            `translate(${(i / (dimensionsParallelOrder.length - 1)) * viewBoxWidthParallel},0)`)
        .style("pointer-events", "bounding-box");

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
        .attr("y", -2)
        .attr("text-anchor", "middle")
        .attr("font-size", 2.5)
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

    // Add brush to each axis group
    axisGroups.append("g")
        .attr("class", "brush")
        .each(function(dim) {
            const brushG = d3.select(this);

            brushG.call(
                d3.brushY()
                    .extent([[-2, 0], [2, viewBoxHeightParallel]])
                    .on("start brush end", (event) => {
                        event.sourceEvent.stopPropagation();
                        brushChanged(event, dim);
                        chartsHighlighting();
                    })
            );

            const axisGroup = gParallelChart.select(`#axis-${dim}`);

            // Right-click handler to clear brush
            brushG.on("contextmenu", (event) => {
                event.preventDefault();  // prevent default context menu

                // Clear the brush programmatically
                brushG.call(d3.brushY().move, null);
                brushingAppliedIntervals.delete(dim);
                chartsHighlighting();

                // Optionally reset your brush labels and line opacity here:
                axisGroup.select(`#brush-max-${dim}`)
                    .style("opacity", 0)
                    .text("");
                axisGroup.select(`#brush-min-${dim}`)
                    .style("opacity", 0)
                    .text("");

                chartsHighlighting();
            });


            axisGroup.append("text")
                .attr("class", "brush-max-label")
                .attr("id", `brush-max-${dim}`)
                .style("font-size", "2.2")
                .attr("x", 0)
                .attr("pointer-events", "none")
                .text("");
            axisGroup.append("text")
                .attr("class", "brush-min-label")
                .attr("id", `brush-min-${dim}`)
                .style("font-size", "2.2")
                .attr("x", 0)
                .attr("pointer-events", "none")
                .text("");
        });

    axisGroups.call(d3.drag()
        .filter(function(event) {
            const target = event.target;
            if (!target) return true;  // Allow drag if no target (should not happen)
            return !(
                target.closest(".brush") ||
                target.classList.contains("brush") ||
                target.classList.contains("selection") ||
                target.classList.contains("handle")
            );
        })
        .on("start", dragStarted)
        .on("drag", dragged)
        .on("end", dragEnded));


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
        .attr("pointer-events", "none")
        .text(d => {
            const domain = domainScales.get(d);
            if (domain[0] === 0 ) return "N/A";
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
        .attr("pointer-events", "none")
        .text(d => {
            const domain = domainScales.get(d);
            return domain ? domain[1].toFixed(2) : "";
        });

    // Keep reference for drag
    axisGroups.each(function(d) {
        d3.select(this).attr("data-dim", d);
    });

    drawDataLines(mapCountryContinent, false);
}


function drawDataLines(mapCountryContinent, update) {
    let data = fertilityData.filter(d => +d.Year === +currentYear);
    d3.selectAll(".tooltip-country").remove(); // Remove old tooltip if exists

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
    const filteredData = data.filter(d =>
        mapCountryContinent.has(d.Name) &&
        !isInvalid(d.FertilityR) &&
        !isInvalid(d.LifeExpectacyB) &&
        !isInvalid(d.GR) &&
        !isInvalid(d.U5MortalityR)
    );

    // Remove old lines before drawing new ones (optional but recommended)
    gParallelChart.selectAll(".data-line").remove();

    const lines = gParallelChart.selectAll(".data-line")
        .data(filteredData, d => d.Name); // Use 'Name' as the key to track items

// EXIT: remove paths that are no longer needed
    lines.exit().remove();

// UPDATE: update attributes for existing lines
    lines
        .attr("d", d => buildLinePath(d));

// ENTER: create new paths as needed
    lines.enter()
        .append("path")
        .attr("class", d => `data-line ${mapCountryContinent.get(d.Name).replace(/[\s.]/g, '_')}`)
        .attr("id", d => `line-${d.Name.replace(/[\s.]/g, '_')}`)
        .attr("fill", "none")
        .attr("stroke", d => getColorByContinent(mapCountryContinent.get(d.Name)))
        .attr("stroke-width", 0.3)
        .attr("d", d => buildLinePath(d))
        .on("mouseover", function(event, d) {
            hoveredCountry = d.Name;
            const fRate = d.FertilityR ? d.FertilityR : "N/A";
            const lExpB = d.LifeExpectacyB ? d.LifeExpectacyB : "N/A";
            const gR = d.GR ? d.GR : "N/A";
            const iMort = d.U5MortalityR ? d.U5MortalityR : "N/A";

            tooltip
                .style("opacity", 1)
                .html(`
                <strong>
                ${d.Name} <br><br>
                Fertility rate: ${fRate} <br>
                Life expectancy: ${lExpB} <br>
                Growth rate: ${gR} <br>
                Infant mortality: ${iMort} <br>
                </strong>
            `)
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY - 20}px`);

            chartsHighlighting();
        })
        .on("mousemove", function(event) {
            tooltip
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY - 20}px`);
        })
        .on("mouseout", function(event, d) {
            hoveredCountry = "";
            chartsHighlighting();
            tooltip.style("opacity", 0);
        })
        .on("click", function(event, d) {
            const countryName = d.Name;

            if (!selectedCountries.includes(countryName)) {
                if (selectedCountries.length === colorListWorld.length) {
                    window.confirm("You've selected the maximum number of countries.\nTo continue the selection remove at least one of them.");
                } else {
                    addSelectedCountry(countryName, null);
                    chartsHighlighting();
                }
            } else {
                removeSelectedCountry(countryName);
                chartsHighlighting();
            }
        });
    chartsHighlighting();
}


/**
 * Builds the path string for a line connecting points in the parallel coordinates chart.
 * @param d {Object} Data object for a country containing values for each dimension.
 * @returns {string}
 */
function buildLinePath(d) {
    const lineGenerator = d3.line()
        .x(p => p.x)
        .y(p => p.y);

    const points = dimensionsParallelOrder.map((dim, i) => {
        const val = d[dim];

        const x = (i / (dimensionsParallelOrder.length - 1)) * viewBoxWidthParallel;

        if (val === null || val === undefined || Number.isNaN(val)) {
            return { x, y: null, value: null }; // mark as missing
        }

        return {
            x,
            y: yParallelScale[dim](val),
            value: val
        };
    });

    return lineGenerator(points);
}

function isInvalid(val) {
    return val === null || val === undefined || val === "" || val === "NA" || Number.isNaN(Number(val));
}


// Brushing

function brushChanged(event, dim) {
    const maxLabel = d3.select(`#brush-max-${dim}`);
    const minLabel = d3.select(`#brush-min-${dim}`);

    if (!event.selection) {
        maxLabel.style("opacity", 0);
        minLabel.style("opacity", 0);
        gParallelChart.selectAll(".data-line").style("opacity", 1);
        return;
    }

    const [y0, y1] = event.selection;

    const maxVal = yParallelScale[dim].invert(y0);
    const minVal = yParallelScale[dim].invert(y1);
    brushingAppliedIntervals.set(dim, [minVal, maxVal]);

    // Show labels at top and bottom of brush rectangle with small offsets
    maxLabel
        .style("opacity", 1)
        .attr("y", y0 - 2)
        .text(maxVal.toFixed(4));

    minLabel
        .style("opacity", 1)
        .attr("y", y1 + 4)
        .text(minVal.toFixed(2));
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

    gParallelChart.selectAll(".data-line")
        .transition()
        .duration(300)
        .attr("d", d => buildLinePath(d));
}