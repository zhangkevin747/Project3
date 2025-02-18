// Set the dimensions of the heatmap area
const margin = { top: 60, right: 60, bottom: 60, left: 60 };
const heatmapWidth = 800 - margin.left - margin.right;
const heatmapHeight = 600 - margin.top - margin.bottom;

// Legend dimensions and spacing
const legendWidth = 100;  // Narrow width for vertical legend
const legendHeight = 300;  // Increase height for vertical legend
const legendSpacing = 20;  // space between the heatmap and legend

// Increase overall SVG width to accommodate the legend
const totalWidth = heatmapWidth + margin.left + margin.right + legendWidth + legendSpacing;
const totalHeight = heatmapHeight + margin.top + margin.bottom;

// Append an outer SVG container with the new total width
const svgContainer = d3.select("svg")
    .attr("width", totalWidth)
    .attr("height", totalHeight);

// Append an inner group for the heatmap (translated by margins)
const svg = svgContainer.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Load the heatmap data from the JSON file
d3.json("heatmap_data.json").then(function(data) {
    // Define the columns (EstrusStage) and rows (Hour)
    const columns = Object.keys(data[0]).filter(key => key !== "Hour");
    const rows = data.map(d => d.Hour);

    // Define a sequential color scale (reversed: value 45 => red, value 10 => blue)
    const colorScale = d3.scaleSequential(d3.interpolateRdYlBu)
        .domain([50, 0]);

    // Define scales for x and y axes for the heatmap cells
    const x = d3.scaleBand()
        .domain(columns)
        .range([0, heatmapWidth])
        .padding(0.05);

    const y = d3.scaleBand()
        .domain(rows)
        .range([0, heatmapHeight])
        .padding(0.05);

    // Append heatmap cells to the SVG container
    svg.selectAll(".cell")
        .data(data.flatMap(d =>
            columns.map(col => ({
                x: x(col),
                y: y(d.Hour),
                value: d[col],
                hour: d.Hour,
                stage: col
            }))
        ))
        .enter().append("rect")
        .attr("class", "cell")
        .attr("x", d => d.x)
        .attr("y", d => d.y)
        .attr("width", x.bandwidth())
        .attr("height", y.bandwidth())
        .attr("fill", d => colorScale(d.value))
        .append("title")
        .text(d => `Hour: ${d.hour}, EstrusStage: ${d.stage}, Activity: ${d.value}`);

    // Add text labels to each cell (centered)
    svg.selectAll(".cell-text")
        .data(data.flatMap(d =>
            columns.map(col => ({
                x: x(col) + x.bandwidth() / 2,
                y: y(d.Hour) + y.bandwidth() / 2,
                value: d[col]
            }))
        ))
        .enter().append("text")
        .attr("class", "cell-text")
        .attr("x", d => d.x)
        .attr("y", d => d.y)
        .attr("dy", ".35em")
        .style("text-anchor", "middle")
        .text(d => d.value.toFixed(1));

    // Add X-axis labels for EstrusStage
    svg.append("g")
        .selectAll(".x-axis")
        .data(columns)
        .enter().append("text")
        .attr("class", "axis")
        .attr("x", d => x(d) + x.bandwidth() / 2)
        .attr("y", heatmapHeight + margin.bottom - 5)
        .style("text-anchor", "middle")
        .text(d => d);

    // Add Y-axis labels for Hour
    svg.append("g")
        .selectAll(".y-axis")
        .data(rows)
        .enter().append("text")
        .attr("class", "axis")
        .attr("x", -10)
        .attr("y", d => y(d) + y.bandwidth() / 2)
        .style("text-anchor", "end")
        .text(d => d);

    // ** Add Color Legend **

    // Append a legend group to the heatmap group, positioned to the right
        const legend = svg.append("g")
        .attr("transform", "translate(" + (heatmapWidth + legendSpacing + 10) + "," + (heatmapHeight / 2 - legendHeight / 2) + ")");

        // Create a linear scale for the legend axis
        const legendScale = d3.scaleLinear()
        .domain([50, 0])  // Reverse the domain to start with higher values
        .range([0, legendHeight]);  // Adjust the range for vertical layout

        // Append a defs element to the outer SVG container for the gradient
        const defs = svgContainer.append("defs");

        // Create the linear gradient
        const linearGradient = defs.append("linearGradient")
        .attr("id", "linear-gradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "0%")
        .attr("y2", "100%");  // Vertical gradient

        // Generate gradient stops (from 0 to 1)
        linearGradient.selectAll("stop")
        .data(d3.range(0, 1.01, 0.01))
        .enter().append("stop")
        .attr("offset", d => (d * 100) + "%")
        .attr("stop-color", d => {
            // Map fraction d to a value between 45 and 10
            const value = 45 - d * (45 - 10);  // Reverse the mapping
            return colorScale(value);
        });

        // Append a rectangle that uses the gradient for fill
        legend.append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#linear-gradient)");

        // Add an axis for the legend
        const legendAxis = d3.axisLeft(legendScale).ticks(5);  // Use left axis for vertical layout
        legend.append("g")
        .attr("transform", "translate(0,0)")  // Position at the top
        .call(legendAxis);

    // ** Add Axis Title **

    // Append a text element for the axis title
    legend.append("text")
    .attr("x", legendWidth / 2)  // Position title at the center of the legend
    .attr("y", -10)  // Position above the axis
    .style("text-anchor", "middle")  // Center align
    .style("font-size", "14px")
    .style("font-weight", "bold")
    .text("Activity Level");  // Customize the title as needed

    // ** Add X-axis Title (EstrusStage) **

    svg.append("text")
    .attr("x", heatmapWidth / 2)  // Position at the center of the heatmap width
    .attr("y", heatmapHeight + margin.bottom - 5)  // Below the x-axis
    .style("text-anchor", "middle")  // Center align
    .style("font-size", "14px")
    .style("font-weight", "bold")
    .text("Estrus Stage");  // Customize the title as needed

    // ** Add Y-axis Title (Hour) **

    svg.append("text")
    .attr("x", - (heatmapHeight / 2))  // Position at the center of the heatmap height
    .attr("y", - margin.left + 10)  // To the left of the y-axis
    .style("text-anchor", "middle")  // Center align
    .style("font-size", "14px")
    .style("font-weight", "bold")
    .attr("transform", "rotate(-90)")  // Rotate the text to make it vertical
    .text("Hour");  // Customize the title as needed

});
