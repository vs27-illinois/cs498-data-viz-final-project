let base_url = 'https://raw.githubusercontent.com/vs27-illinois/cs498-data-viz-final-project/master/';

//Width and height of map
let width = 1200;
let height = 600;

let div = d3.select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

d3.csv(base_url + "police-locals.csv")
  .then(function(data) {
    // Load GeoJSON data
    d3.json(base_url + "us-states.json")
      .then(function(json) {
        // D3 Projection
        let projection = d3.geoAlbersUsa()
                       .translate([width/2, height/2])
                       .scale(1200);

        // Define path generator
        let path = d3.geoPath()
                     .projection(projection);

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

        d3.csv(base_url + "us-city-lat-long.csv")
          .then(function(city) {
            data.forEach(function(d) {
                city.forEach(function(c) {
                    if (d['city'] === c['city']) {
                      d['lat'] = c['lat'];
                      d['long'] = c['long'];
                    }
                });
            });

            let f = d3.format(",");

            svg.selectAll("circle")
                .data(data)
                .enter()
                .append("circle")
                .attr("cx", function(d) {
                    return projection([d['long'], d['lat']])[0];
                })
                .attr("cy", function(d) {
                    return projection([d['long'], d['lat']])[1];
                })
                .attr("r", function(d) {
                    return d['police_force_size'] / 500;
                })
                .style("fill", "rgb(217,91,67)")
                .style("opacity", 0.85)
                .style("stroke", "red")
                .style("stroke-width", "1")
                .on("mouseover", function(d) {
                    let text = 'City: ' + d['city'] + '<br/>Police Force Size: ' + f(d['police_force_size']);
                    div.transition()
                       .duration(200)
                       .style("opacity", .9);
                    div.html(text)
                       .style("left", (d3.event.pageX) + "px")
                       .style("top", (d3.event.pageY - 28) + "px");
                })
                .on("mouseout", function(d) {
                    div.transition()
                       .duration(500)
                       .style("opacity", 0);
                });

            svg.append('path')
                .attr('d', 'M 910 170L 820 105')
                .style('fill', 'none')
                .style('stroke', 'black')
                .style('stroke-width', 1);

            svg.append('text')
                .attr('x', 700)
                .attr('y', 100)
                .text('New York City has the largest police force in the country');
          }).catch(err => console.log(err));
      }).catch(err => console.log(err));

      let dataset = d3.layout.stack()(["Local", "Non-Local"].map(function(type) {
        return data.map(function(d) {
          let value = d['police_force_size'];
          if (type == 'Local') {
              value = Math.round(value * d['all']);
          }
          return {x: parse(d['city']), y: value};
        });
      }));
  }).catch(err => console.log(err));
