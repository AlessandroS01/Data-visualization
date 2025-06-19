/* variables for timeline */
let timeline, timelineSlider, timelineScale, sliderHandler, sliderLabel;
const viewBoxWidthTimeline = 400;
const viewBoxHeightTimeline = 30;
const timelineHeight = 90 + "px";


/**
 * Definition of timeline grid
 */
function createTimeline() {
    timeline = d3.select(".map").append("div")
        .attr("class", "timeline")
        .attr("width", mapWidth)
        .attr("height", timelineHeight)
        .style("padding", "5px")
        .style("display", "grid")
        .style("grid-template-columns", "1fr 4fr")
        .style("grid-template-rows", "1fr 1fr")
        .style("gap", "10px");

    // First cell (empty)
    timeline.append("div");

    // Timeline legend (color schema) - Second cell
    creationTimelineLegend();

    // Button logic - Third cell
    creationTimelineButtonLogic();

    // Effective timeline slider - Fourth cell
    creationSlider();
}

/**
 * Creates timeline legend schema and append it in the second position of the grid
 * Position upper right
 */
function creationTimelineLegend() {
    let legendTimeline = timeline.append("div")
        .attr("width", "100%")
        .attr("height", "10px")
        .style("display", "flex")
        .style("flex-orientation", "row")
        .style("justify-content", "center")
        .style("align-items", "center")
        .append("svg")
        .attr("width", "80%")
        .attr("height", "10px")
        .style("overflow", "visible");

    for(let i = 0; i < classNames.length; i++) {
        const isFirst = i === 0;
        const x = 5 + i * 10;
        const width = isFirst ? 5 : 10;

        // Append rects first
        const rect = legendTimeline.append("rect")
            .attr("x", `${x}%`)
            .attr("width", `${width}%`)
            .attr("height", "100%")
            .attr("class", classNames[i])
            .on("mouseover", function () {
                const hoveredClassLine = d3.select(this).attr("class") || "";
                // If multiple classes, take the one you want; if single class, just use it directly
                const secondClass = hoveredClassLine.split(' ')[1];

                const hoveredSelection = gMap.selectAll(`path.country.${secondClass}`);

                // Dim all countries first
                gMap.selectAll('path.country')
                    .style('opacity', 0.2);

                // Then reset opacity back to 1 for hovered group
                hoveredSelection.style('opacity', 1);
            })
            .on("mouseout", function() {
                // Optional: reset fill on mouseout
                const hoveredClassLine = d3.select(this).attr("class") || "";
                // If multiple classes, take the one you want; if single class, just use it directly
                const secondClass = hoveredClassLine.split(' ')[1];

                gMap.selectAll('path.country')
                    .style('opacity', 1);
            });

        if (isFirst) {
            rect.attr("class", classNames[0]);
        }

        if (isFirst) {
            legendTimeline.append("line")
                .attr("x1", `${x + 2.5}%`)
                .attr("x2", `${x + 2.5}%`)
                .attr("y1", "100%")
                .attr("y2", "150%")
                .attr("stroke", "#bbbbbb")
                .attr("stroke-width", 2);

            legendTimeline.append("text")
                .attr("x", `${x + .5}%`)  // Offset to right of line (if calc is supported)
                .attr("y", "220%")                  // Slightly above SVG (you can tweak this)
                .attr("text-anchor", "start")
                .attr("font-size", "10px")
                .text("No data");
        } else if( (i - 1) % 2 === 0) {
            legendTimeline.append("line")
                .attr("x1", `${x}%`)
                .attr("x2", `${x}%`)
                .attr("y1", "100%")
                .attr("y2", "180%")
                .attr("stroke", "#bbbbbb")
                .attr("stroke-width", 2);

            if ( i - 1 === 0) {
                legendTimeline.append("text")
                    .attr("x", `${x + .5}%`)  // Offset to right of line (if calc is supported)
                    .attr("y", "240%")                  // Slightly above SVG (you can tweak this)
                    .attr("text-anchor", "start")
                    .attr("font-size", "10px")
                    .text(i - 1 + " birth");
            } else {
                legendTimeline.append("text")
                    .attr("x", `${x + .5}%`)  // Offset to right of line (if calc is supported)
                    .attr("y", "240%")                  // Slightly above SVG (you can tweak this)
                    .attr("text-anchor", "start")
                    .attr("font-size", "10px")
                    .text(i - 1 + " births");
            }
        } else {
            legendTimeline.append("line")
                .attr("x1", `${x}%`)
                .attr("x2", `${x}%`)
                .attr("y1", "100%")
                .attr("y2", "240%")
                .attr("stroke", "#bbbbbb")
                .attr("stroke-width", 2);

            legendTimeline.append("text")
                .attr("x", `${x + .5}%`)  // Offset to right of line (if calc is supported)
                .attr("y", "280%")                  // Slightly above SVG (you can tweak this)
                .attr("text-anchor", "start")
                .attr("font-size", "10px")
                .text(i - 1 + " births");
        }
    }
}

/**
 * Used to set the behavior of the timeline button
 */
function creationTimelineButtonLogic() {
    let timelineButton = timeline.append("div")
        .style("display", "flex")
        .style("justify-content", "center")
        .style("align-items", "center")
        .append("button")
        .attr("id", "play-button")
        .text("Play time-lapse ");
    timelineButton.append("i")
        .attr("class", "fa-solid fa-play")
        .style("font-size", "10px");
    // The line fills the SVG horizontally (full width of SVG)
    timelineScale = d3.scaleLinear()
        .domain([startYear, endYear])
        .range([0, viewBoxWidthTimeline]);

    let isTimelinePlaying = false;

    let playInterval = null; // defines the interval for the play button in ms

    timelineButton.on("click", function () {
        isTimelinePlaying = !isTimelinePlaying;
        const icon = d3.select("#play-button .fa-solid");
        if (isTimelinePlaying) {
            icon.remove();
            timelineButton.text("Stop time-lapse ");
            timelineButton.append("i")
                .attr("class", "fa-solid fa-pause")
                .style("font-size", "10px");

            // Reset currentYear to the current slider position
            let currentX = +sliderHandler.attr("cx");
            currentYear = Math.round(timelineScale.invert(currentX));

            playInterval = setInterval(() => {
                if (currentYear < endYear) {
                    currentYear++;
                    updateSlider();
                } else {
                    clearInterval(playInterval);
                    isTimelinePlaying = false;
                    timelineButton.text("Play time-lapse ");
                    timelineButton.append("i")
                        .attr("class", "fa-solid fa-play")
                        .style("font-size", "10px");
                }
            }, 500); // 0ms for instant update
        } else {
            icon.remove();
            timelineButton.text("Play time-lapse ");
            timelineButton.append("i")
                .attr("class", "fa-solid fa-play")
                .style("font-size", "10px");
            clearInterval(playInterval);
        }
    });
}

/**
 * Used to create the timeline slider
 */
function creationSlider() {
    timelineSlider = timeline.append("div")
        .attr("class", "slider-container");

    timelineSlider.append("div")
        .attr("class", "year-container")
        .text(startYear);

    // Set up SVG dimensions and viewBox for responsive scaling
    const svg = timelineSlider.append("svg")
        .attr("viewBox", `0 0 ${viewBoxWidthTimeline} ${viewBoxHeightTimeline}`)
        .attr("id", "slider")
        .style("width", "80%") // SVG is 80% of container width
        .style("height", `${viewBoxHeightTimeline}px`) // Fixed height in px
        .attr("preserveAspectRatio", "none"); // Stretch to fill container, no aspect ratio

    svg.append("line")
        .attr("x1", 0)
        .attr("x2", viewBoxWidthTimeline)
        .attr("y1", viewBoxHeightTimeline / 2)
        .attr("y2", viewBoxHeightTimeline / 2)
        .attr("stroke", "#bbbbbb")
        .attr("stroke-width", viewBoxHeightTimeline / 5)
        .attr("stroke-linecap", "round");

    // Slider handle (make it visually come out of the line)
    sliderHandler = svg.append("circle")
        .attr("cx", timelineScale(startYear))
        .attr("cy", viewBoxHeightTimeline / 2)
        .attr("r", viewBoxHeightTimeline / 4)
        .attr("fill", "#bbbbbb")
        .attr("cursor", "pointer");

    // Add a label below the slider showing the selected year
    sliderLabel = svg.append("text")
        .attr("x", timelineScale(startYear))
        .attr("y", viewBoxHeightTimeline + 1)
        .attr("text-anchor", "middle")
        .attr("font-size", "8px")
        .attr("fill", "black")
        .text("");

    // Drag behavior
    const drag = d3.drag()
        .on("drag", function (event) {
            let xPos = Math.max(timelineScale(startYear), Math.min(timelineScale(endYear), event.x));
            currentYear = Math.round(timelineScale.invert(xPos));

            updateSlider();
        });
    sliderHandler.call(drag);

    // final year
    timelineSlider.append("div")
        .attr("class", "year-container")
        .text(endYear);
}

/**
 * Updates the slider position and label based on the current year
 */
function updateSlider() {
    const xPos = timelineScale(currentYear);
    sliderHandler.attr("cx", xPos);
    sliderLabel
        .attr("x", xPos)
        .text(currentYear);
    updateMap();
}