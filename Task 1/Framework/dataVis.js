/*
* Data Visualization - Framework
* Copyright (C) University of Passau
*   Faculty of Computer Science and Mathematics
*   Chair of Cognitive sensor systems
* Maintenance:
*   2025, Alexander Gall <alexander.gall@uni-passau.de>
*
* All rights reserved.
*/

// scatterplot axes
let xScales, yScales, rScales;
let xAxis, yAxis, xAxisLabel, yAxisLabel;
// radar chart axes
let radarAxes, radarAxesAngle;

let dimensions = [];

// Stores the parsed data from the csv
// Use this to modify the plots
let data = []

// the visual channels we can use for the scatterplot
let channels = ["scatterX", "scatterY", "size"];

// size of the plots
let margin, width, height, radius;
// svg containers
let scatter, radar, dataTable;

// Add additional variables
let selectedItems = [];
let colorUsedMap = new Map();


function init() {
    // define size of plots
    margin = {top: 20, right: 20, bottom: 20, left: 50};
    width = 600;
    height = 500;
    radius = width / 2;

    // Start at default tab
    document.getElementById("defaultOpen").click();

	// data table
	dataTable = d3.select('#dataTable');
 
    // scatterplot SVG container and axes
    scatter = d3.select("#sp").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g");

    // radar chart SVG container and axes
    radar = d3.select("#radar").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + (width / 2) + "," + (height / 2) + ")");

    // read and parse input file
    let fileInput = document.getElementById("upload"), readFile = function () {

        // clear existing visualizations
        clear();

        let reader = new FileReader();
        reader.onloadend = function () {

            let parsedData = d3.csvParse(reader.result); // list of objects
            data = parsedData
            // Debug: view the csv
            // delete commen and log later
            // console.log("Parsed CSV data:", parsedData);

            // TODO: parse reader.result data and call the init functions with the parsed data!
            initVis(parsedData);
            createDataTable(parsedData);
            // TODO: possible place to call the dashboard file for Part 2
            initDashboard(null);
        };
        reader.readAsBinaryString(fileInput.files[0]);
    };
    fileInput.addEventListener('change', readFile);
}


/**
 *
 * @param parsedData DSVRowArray<string> that contains the list of parsed objects
 */
function initVis(parsedData){
    dimensions = [];
    let header = parsedData.columns;  // header of csv dataset

    let datasetDomainsScales = new Map(); // used to retrieve the domain scale of each single dimension
    header.forEach(col => {
        // + converts a string to a number
        if (!isNaN(+parsedData[0][col])) { // take first row and defines the domain for each numeric attribute
            const domain = d3.extent(
                parsedData,
                d => +d[col]
            ); // returns min and max value of the converted domain
            // console.log("Domain range: " + domain + " for " + col);

            dimensions.push(col); // adds only numeric attributes
            datasetDomainsScales.set(col, domain);
        }
    });

    // y scalings for scatter plot
    // TODO: set y domain for each dimension
    let y = d3.scaleLinear()
        .range([height - margin.bottom - margin.top, margin.top]);
    yScales = new Map();

    // x scalings for scatter plot
    // TODO: set x domain for each dimension
    let x = d3.scaleLinear()
        .range([margin.left, width - margin.left - margin.right]);
    xScales = new Map();

    // radius scalings for radar chart
    // TODO: set radius domain for each dimension
    let r = d3.scaleLinear()
        .range([0, radius]);
    rScales = new Map();


    // defines domain for x, y, and r
    dimensions.forEach(col => {
        const domain = datasetDomainsScales.get(col);

        // Create a linear scale for x dimension
        const xScale = d3.scaleLinear()
            .domain(domain)
            .range(x.range()); // reuse the range you set earlier

        // Create a linear scale for y dimension
        const yScale = d3.scaleLinear()
            .domain(domain)
            .range(y.range());  // reuse the range you set earlier

        // Create a linear scale for radius
        const rScale = d3.scaleLinear()
            .domain(domain)
            .range(r.range());  // reuse the range you set earlier

        yScales.set(col, yScale);
        xScales.set(col, xScale);
        rScales.set(col, rScale);
    });

    yScales.forEach(function(scale, key) {
        // console.log("yScale for " + key + ": " + scale);
    });
    xScales.forEach(function(scale, key) {
        // console.log("xScale for " + key + ": " + scale);
    });
    rScales.forEach(function(scale, key) {
        // console.log("rScale for " + key + ": " + scale);
    });

    // scatterplot axes
    yAxis = scatter.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(" + margin.left + ")")
        .call(d3.axisLeft(y));

    yAxisLabel = yAxis.append("text")
        .style("text-anchor", "middle")
        .attr("y", margin.top / 2)
        .text("y");

    xAxis = scatter.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0, " + (height - margin.bottom - margin.top) + ")")
        .call(d3.axisBottom(x));

    xAxisLabel = xAxis.append("text")
        .style("text-anchor", "middle")
        .attr("x", width - margin.right)
        .text("x");

    // radar chart axes
    radarAxesAngle = Math.PI * 2 / dimensions.length;
    let axisRadius = d3.scaleLinear()
        .range([0, radius]);
    let maxAxisRadius = 0.75,
        textRadius = 0.8,
        gridRadius = 0.1;

    // radar axes
    radarAxes = radar.selectAll(".axis")
        .data(dimensions)
        .enter()
        .append("g")
        .attr("class", "axis");
    
    radarAxes.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", function(d, i){ return radarX(axisRadius(maxAxisRadius), i); })
        .attr("y2", function(d, i){ return radarY(axisRadius(maxAxisRadius), i); })
        .attr("class", "line")
        .style("stroke", "black");

    // TODO: render grid lines in gray
    const axisLength = radius * maxAxisRadius; // defines the real maximum length of the axis

    for (let i = 1; i <= dimensions.length; i++) {
        const rLevel = axisLength * (i / dimensions.length); // evenly spaced radius steps

        const points = dimensions.map((_, j) => ({ // we do not care about the element, but only its index j
            x: radarX(rLevel, j), // return the (x, y) coordinate for each dimension at the specified radius
            y: radarY(rLevel, j)
        }));

        // points.forEach(p => console.log("Point: " + p.x + ", " + p.y));

        const lineFunction = d3.line() // line generator function
            .x(d => d.x) // for each point given uses x and y as horizontal and vertical coordinates
            .y(d => d.y)
            .curve(d3.curveLinearClosed); // draw straight line

        radar.append("path")
            .datum(points) // bind whole array to single closed line rather than n different elements
            .attr("class", "grid-circle-" + i)
            .attr("d", lineFunction) // defines how to draw the line according to the points given
            .style("fill", "none")
            .style("stroke", "gray")
            .style("stroke-dasharray", "2,2");
    }

    // TODO: render correct axes labels
    radar.selectAll(".axisLabel")
        .data(dimensions)
        .enter()
        .append("text")
            .attr("text-anchor", "middle")
            .attr("dy", "0.35em")
            .attr("x", function(d, i){ return radarX(axisRadius(textRadius), i); })
            .attr("y", function(d, i){ return radarY(axisRadius(textRadius), i); })
            .text(d => d);


    // init menu for the visual channels
    channels.forEach(function(c){
        initMenu(c, dimensions);
    });

    // refresh all select menus
    channels.forEach(function(c){
        refreshMenu(c);
    });

    renderScatterplot();
    renderRadarChart();
}

// clear visualizations before loading a new file
function clear(){
    scatter.selectAll("*").remove();
    radar.selectAll("*").remove();
    dataTable.selectAll("*").remove();


    // Clear any existing legend to avoid duplication
    selectedItems = [];
    colorUsedMap.clear();
    let legend = d3.select("#legend");
    legend.selectAll("ul").remove();
}

//Create Table
function createDataTable(dataRetrieved) {
    let table = dataTable.append("table") // creation of the table
        .attr("class", "dataTableClass");

    let headerData = dataRetrieved.columns; // take the csv dataset attributes

    let tableHeader = table.append("thead"); // defines the header of the table

    tableHeader.append("tr") // generate the row for the header
        .selectAll("th") // used as placeholder that says we want to bind data to the new created th DOM elements
        .data(headerData)
        .enter()
        .append("th")
        .attr("class", "tableHeaderClass")
        .text(d => d); // give to each single cell the value of the corresponding index inside headerData

    let tbody = table.append("tbody");

    for (let i = 1; i < dataRetrieved.length; i++) {
        let rowData = dataRetrieved[i];

        let row = tbody.append("tr") // Append a row for each data entry
            .attr("class", "tableRowClass");

        row.selectAll("td") // generates new cells according to the values inside each object
            .data(Object.values(rowData))
            .enter()
            .append("td")
            .attr("class", "tableBodyClass")
            .text(d => d)
            .on("mouseover", function(_){
                return this.style.backgroundColor = "lightblue";
            })
            .on("mouseout", function(_){
                return this.style.backgroundColor = "white";
            });
    }
}


function renderScatterplot(){

    // TODO: get domain names from menu and label x- and y-axis
    // FINISHED
    // --------------------------------------------------------------------------------------------------------
    // Possible future updates : update the text and font to make the axes more readable

    // Read what the axes is set to on the dropdown menu
    let xText = readMenu("scatterX");
    let yText = readMenu("scatterY");
    let rText = readMenu("size");

    // Update the axes' text accordingly
    xAxisLabel.text(xText)
    yAxisLabel.text(yText)

    // TODO: re-render axes
    // FINISHED
    // --------------------------------------------------------------------------------------------------------
    let xScale = xScales.get(xText);
    let yScale = yScales.get(yText);
    let rScale = rScales.get(rText);

    xAxis.transition().duration(500).call(d3.axisBottom(xScale));
    yAxis.transition().duration(500).call(d3.axisLeft(yScale));

    // TODO: render dots
    // --------------------------------------------------------------------------------------------------------

    // Bind data to circles
    let circles = scatter.selectAll("circle").data(data);

    // ENTER: create new circles
    let circlesEnter = circles.enter()
        .append("circle")
        .attr("class", "dot")
        .attr("cx", d => xScale(+d[xText]))
        .attr("cy", d => yScale(+d[yText]))
        .attr("id", d => "point"+data.indexOf(d)) // gives id equal to the position inside the data array
        .attr("r", d => {
            let raw = rScale(+d[rText]);
            let minR = 2, maxR = 10;
            let norm = (raw - rScale.range()[0]) / (rScale.range()[1] - rScale.range()[0]);
            return minR + norm * (maxR - minR);
        }) // normalized scale between 2 and 10
        .attr("fill", "black")
        .attr("opacity", 0.3)
        .on("click", function(event, d) {
            const element = d3.select(this);
            if (selectedItems.includes(d)) { // remove the selection
                removeSelectedPoint(d);
                element.attr("stroke", null)
                    .attr("stroke-width", null);
            } else { // add the selection
                addSelectedPoint(d);
                element.attr("stroke", "black")
                    .attr("stroke-width", 1);
            }
        });

    // UPDATE: apply to both new and existing circles
    circlesEnter.merge(circles)
        .transition().duration(500)
        .attr("cx", d => xScale(+d[xText]))
        .attr("cy", d => yScale(+d[yText]))
        .attr("r", d => {
            let raw = rScale(+d[rText]);
            let minR = 2, maxR = 10;
            let norm = (raw - rScale.range()[0]) / (rScale.range()[1] - rScale.range()[0]);
            return minR + norm * (maxR - minR);
        });

    // EXIT: remove old circles
    circles.exit().remove();
}

function renderRadarChart(){
    // TODO: show selected items in legend
    let legend = d3.select("#legend");

    // Clear any existing list to avoid duplication
    legend.selectAll("ul").remove();

    let ul = legend.append("ul")
        .attr("id", "legend-list");

    let li = ul.selectAll("li")
        .data(selectedItems)
        .enter()
        .append("li")
        .style("display", "flex")
        .style("align-items", "center")
        .style("gap", "6px"); // space between dot and text

    // Add colored dot
    li.append("span")
        .attr("class", "color-circle")
        .style("background-color", (d) => colorUsedMap.get(d));

    // Add text
    li.append("span")
        .text(d => d[Object.keys(d)[0]]);

    // Add remove button
    li.append("button")
        .text("X")
        .attr("class", "close")
        .on("click", function(event, d) {
            removeSelectedPoint(d);
            renderRadarChart();  // Re-render after removal
        });
    // TODO: render polylines in a unique color
}

/**
 * Add a point to the selected points list
 * @param dataPoint - object to be added
 */
function addSelectedPoint(dataPoint) {
    selectedItems.push(dataPoint);

    const indexDataPoint = data.indexOf(dataPoint);
    const colorList = [
        "#e41a1c", "#377eb8", "#4daf4a", "#984ea3", "#ff7f00",
        "#ffff33", "#a65628", "#f781bf", "#999999", "#66c2a5"
    ];

    if(colorUsedMap.size === 0) { // no other element selected

        d3.select("#point"+indexDataPoint)
            .transition()
            .duration(300)
            .attr("fill",colorList[0])
            .attr("opacity", 1);
        colorUsedMap.set(dataPoint, colorList[0]);

    } else {
        let attributeName = getNameKey(dataPoint); // takes name of the added element
        let newColor = "";

        // checks if no other selected element has the same "category"
        if (selectedItems.filter(item => getNameKey(item) === attributeName).length === 1) {
            let usedColors = new Set(colorUsedMap.values()); // set of colors already used
            for (let i = 0; i < colorList.length; i++) {
                if (!usedColors.has(colorList[i])) {
                    newColor = colorList[i];
                    break;
                }
            }
        } else {
            colorUsedMap.forEach(function(value, key) {
                if (getNameKey(key) === attributeName) {
                    newColor = value;
                }
            })
        }

        d3.select("#point"+indexDataPoint)
            .transition()
            .duration(300)
            .attr("fill",newColor)
            .attr("opacity", 1);
        colorUsedMap.set(dataPoint, newColor);
    }

    renderRadarChart();
}

/**
 * Remove an object from the selection
 * @param dataPoint - object to be removed
 */
function removeSelectedPoint(dataPoint) {
    selectedItems = selectedItems.filter(item => item !== dataPoint);

    const indexDataPoint = data.indexOf(dataPoint);
    d3.select("#point"+indexDataPoint)
        .transition()
        .duration(300)
        .attr("opacity", 0.3)
        .attr("fill","black"); // reset the color of the point to black
    colorUsedMap.delete(dataPoint);

    renderRadarChart();
}

/**
 * Returns the initial name of an instance by applying a split.
 * The name is extracted from the first element of the object.
 * @param obj - object of which it is needed the name
 * @returns {name}
 */
function getNameKey(obj) {
    const instance = obj[Object.keys(obj)[0]];

    const spaceIndex = instance.indexOf(" ");
    const dotIndex = instance.indexOf(".");

    if (spaceIndex !== -1 && (dotIndex === -1 || spaceIndex < dotIndex)) { // space comes first or dot not present
        return instance.split(" ")[0];
    } else if (dotIndex !== -1) { // dot comes first
        return instance.split(".")[0];
    } else { // no space or dot
        return instance;
    }
}



function radarX(radius, index){
    return radius * Math.cos(radarAngle(index));
}

function radarY(radius, index){
    return radius * Math.sin(radarAngle(index));
}

function radarAngle(index){
    return radarAxesAngle * index - Math.PI / 2;
}

// init scatterplot select menu
function initMenu(id, entries) {
    $("select#" + id).empty();

    entries.forEach(function (d) {
        $("select#" + id).append("<option>" + d + "</option>");
    });

    $("#" + id).selectmenu({
        select: function () {
            renderScatterplot();
        }
    });
}

// refresh menu after reloading data
function refreshMenu(id){
    $( "#"+id ).selectmenu("refresh");
}

// read current scatterplot parameters
function readMenu(id){
    return $( "#" + id ).val();
}

// switches and displays the tabs
function openPage(pageName,elmnt,color) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablink");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].style.backgroundColor = "";
    }
    document.getElementById(pageName).style.display = "block";
    elmnt.style.backgroundColor = color;
}
