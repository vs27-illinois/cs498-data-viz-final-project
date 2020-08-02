let base_url = 'https://raw.githubusercontent.com/vs27-illinois/cs498-data-viz-final-project/master/';

// Load GeoJSON data and merge with states data
d3.json(base_url + "us-states.json")
  .then(function(json) {
    //Width and height of map
    let width = 1000;
    let height = 600;

    // D3 Projection
    let projection = d3.geoAlbersUsa()
                       .translate([width/2, height/2])
                       .scale(1200);

    // Define path generator
    let path = d3.geoPath()
                 .projection(projection);

    let div = d3.select("body")
                .append("div")
                .attr("class", "tooltip")
                .style("opacity", 0);

    //Create SVG element and append map to the SVG
    let svg = d3.select("#map")
    			.append("svg")
    			.attr("width", width)
    			.attr("height", height)
    			.attr("viewBox", "0 0 " + width + " " + height)
    			.attr("preserveAspectRatio", "xMidYMid meet");

	// Bind the data to the SVG and create one path per GeoJSON feature
	svg.selectAll("path")
		.data(json.features)
		.enter()
		.append("path")
		.attr("d", path)
		.style("stroke", "#fff")
		.style("stroke-width", "1")
		.style("fill", "rgb(213,222,217)");
  }).catch(err => console.log(err));