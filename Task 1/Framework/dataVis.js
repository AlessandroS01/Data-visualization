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
    let yScales = new Map();

    // x scalings for scatter plot
    // TODO: set x domain for each dimension
    let x = d3.scaleLinear()
        .range([margin.left, width - margin.left - margin.right]);
    let xScales = new Map();

    // radius scalings for radar chart
    // TODO: set radius domain for each dimension
    let r = d3.scaleLinear()
        .range([0, radius]);
    let rScales = new Map();


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
        /*
        radar.selectAll(`.grid-point-${i}`)
            .data(points)
            .enter()
            .append("circle")
            .attr("class", `grid-point-${i}`)
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("r", 3)
            .style("fill", "red");

        // Append labels separately
        radar.selectAll(`.grid-label-${i}`)
            .data(points)
            .enter()
            .append("text")
            .attr("class", `grid-label-${i}`)
            .attr("x", d => d.x + 5)  // offset so text isn't on top of circle
            .attr("y", d => d.y + 3)
            .text(d => "Point " + d.x + ", " + d.y)
            .style("text-anchor", "start")
            .style("font-size", "10px")
            .style("fill", "black");
         */
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
        /*
        console.log("Table row data: " + rowData);
        Object.values(rowData).forEach(function(d){
            console.log("Value of row data item: " + d);
        })
         */

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

    console.log("here")
    // TODO: get domain names from menu and label x- and y-axis
    // --------------------------------------------------------------------------------------------------------
    // Possible future updates : update the text and font to make the axes more readable

    // Read what the axes is set to on the dropdown menu
    let xText = readMenu("scatterX");
    let yText = readMenu("scatterY");

    // Update the axes' text accordingly
    xAxisLabel.text(xText)
    yAxisLabel.text(yText)


    // TODO: re-render axes
    // --------------------------------------------------------------------------------------------------------
    


    // TODO: render dots
    // --------------------------------------------------------------------------------------------------------

    addSelectedPoint(data[0]);
    addSelectedPoint(data[1]);
    addSelectedPoint(data[2]);
    addSelectedPoint(data[3]);
    addSelectedPoint(data[4]);
    addSelectedPoint(data[5]);
}

function renderRadarChart(){

    console.log("Radar chart")
    console.log(selectedItems)

    // TODO: show selected items in legend
    let legend = d3.select("#legend");
    let ul = legend.append("ul")
        .attr("id", "legend-list");

    // Bind data and create <li> elements
    let li = ul.selectAll("li")
        .data(selectedItems)
        .enter()
        .append("li")
        .attr("id", function(_, i) {
            return i;
        }); // defines an id for each <li> element equal to the list position to handle the removal

    // Append span with first attribute
    li.append("span")
        .text(d => d[Object.keys(d)[0]] + " ");

    // Append button
    li.append("button")
        .text("X")
        .attr("class", "close")
        .on("click", function(event, d, i) {
            console.log(i);
            // Remove the item from selectedItems
            removeSelectedPointByIndex(i);
            renderRadarChart();
        });
    // TODO: render polylines in a unique color
}

// handle selected points addition
function addSelectedPoint(point) {
    selectedItems.push(point);
}

// handle selected points removal
function removeSelectedPointByIndex(index) {
    selectedItems.splice(index, 1);
    radar.selectAll("#legend-list").remove();
    radar.selectAll("#"+index).remove();
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
