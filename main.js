let base_url = 'https://raw.githubusercontent.com/vs27-illinois/cs498-data-viz-final-project/master/';

// SVG Width and Height
let width = 1200;
let height = 600;

// Width, Height and Margin of the Bar chart
let margin = {top: 10, right: 30, bottom: 20, left: 50};
let bar_width = width - margin.left - margin.right;
let bar_height = height - margin.top - margin.bottom;

let div = d3.select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

d3.csv(base_url + "police-locals.csv")
  .then(function(data) {
    d3.json(base_url + "us-states.json")
      .then(function(json) {
        let projection = d3.geoAlbersUsa()
                       .translate([width/2, height/2])
                       .scale(1200);

        let path = d3.geoPath()
                     .projection(projection);

        // Create SVG element and append map to the SVG
        let svg = d3.select("#map")
    			.append("svg")
    			.attr("width", width)
    			.attr("height", height)
    			.attr("viewBox", "0 0 " + width + " " + height)
    			.attr("preserveAspectRatio", "xMidYMid meet");

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
                    let text = 'City: ' + d['city'] + '<br/># of Officers: ' + f(d['police_force_size']);
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

      let svg = d3.select("stack-bar")
                  .append("svg")
                  .attr("width", width)
                  .attr("height", height);

      let g = svg.append("g")
                 .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      let x = d3.scaleBand()
                .rangeRound([0, bar_width])
                .paddingInner(0.05)
                .align(0.1);

      let y = d3.scaleLinear()
                .rangeRound([bar_height, 0]);

      let z = d3.scaleOrdinal()
                .range(["b33040", "#d25c4d"]);

      let keys = ["Locals", "Non-Locals"];

      let b_data = [];
      data.forEach(function(d) {
        b_data['city'] = d['city'];
        b_data['total'] = d['police_force_size'];
        b_data['Locals'] = Math.round(b_data['total'] * d['all']);
        b_data['Non-Locals'] = b_data['total'] - b_data['Locals'];
      });

      b_data.sort(function(a, b) { return b['total'] - a['total']; });
      x.domain(b_data.map(function(d) { return d['city']; }));
      y.domain([0, d3.max(data, function(d) { return d['total']; })]).nice();
      z.domain(keys);

      g.append("g")
          .selectAll("g")
          .data(d3.stack().keys(keys)(b_data))
          .enter().append("g")
            .attr("fill", function(d) { return z(d.key); })
          .selectAll("rect")
          .data(function(d) { return d; })
          .enter().append("rect")
            .attr("x", function(d) { return x(d.data['city']); })
            .attr("y", function(d) { return y(d[1]); })
            .attr("height", function(d) { return y(d[0]) - y(d[1]); })
            .attr("width", x.bandwidth())
          .on("mouseover", function() { tooltip.style("display", null); })
          .on("mouseout", function() { tooltip.style("display", "none"); })
          .on("mousemove", function(d) {
            var xPosition = d3.mouse(this)[0] - 5;
            var yPosition = d3.mouse(this)[1] - 5;
            tooltip.attr("transform", "translate(" + xPosition + "," + yPosition + ")");
            tooltip.select("text").text(d[1]-d[0]);
          });

      g.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(0," + bar_height + ")")
            .call(d3.axisBottom(x));

      g.append("g")
            .attr("class", "axis")
            .call(d3.axisLeft(y).ticks(null, "s"))
          .append("text")
            .attr("x", 2)
            .attr("y", y(y.ticks().pop()) + 0.5)
            .attr("dy", "0.32em")
            .attr("fill", "#000")
            .attr("font-weight", "bold")
            .attr("text-anchor", "start");
  }).catch(err => console.log(err));
