let base_url = 'https://raw.githubusercontent.com/vs27-illinois/cs498-data-viz-final-project/master/';

// Map Width and Height
let map_width = 1200;
let map_height = 600;

// Stacked Bar Chart Width, Height and Margin
let sb_width = 1000;
let sb_height = 2000;
let margin = {top: 30, right: 30, bottom: 30, left: 150};

d3.csv(base_url + "police-locals.csv")
  .then(function(data) {
    let f = d3.format(",");

    let div = d3.select("body")
                .append("div")
                .attr("class", "tooltip")
                .style("opacity", 0);

    d3.json(base_url + "us-states.json")
      .then(function(json) {
        let projection = d3.geoAlbersUsa()
                       .translate([map_width/2, map_height/2])
                       .scale(1200);

        let path = d3.geoPath()
                     .projection(projection);

        // Create SVG element and append map to the SVG
        let svg = d3.select("#map")
    			.append("svg")
    			.attr("width", map_width)
    			.attr("height", map_height)
    			.attr("viewBox", "0 0 " + map_width + " " + map_height)
    			.attr("preserveAspectRatio", "xMidYMid meet");

        svg.selectAll("path")
            .data(json.features)
            .enter()
            .append("path")
            .attr("d", path)
            .style("stroke", "#888")
            .style("stroke-width", "1")
            .style("fill", "#e5e5e5");

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
                .style("fill", "#d25c4d")
                .style("opacity", 0.85)
                .style("stroke", "#ff0000")
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
                .attr('d', 'M 910 170L 820 75')
                .style('fill', 'none')
                .style('stroke', 'black')
                .style('stroke-width', 1);

            svg.append('text')
                .attr('x', 650)
                .attr('y', 70)
                .text('New York City has the largest police force in the country');
          }).catch(err => console.log(err));
      }).catch(err => console.log(err));

      let keys = ["Locals", "Non-Locals"];
      let colors = ["#10a778", "#d25c4d"];

      let b_data = [];

      data.forEach(function(d) {
        var b = {};
        b['city'] = d['city'];
        b['total'] = parseInt(d['police_force_size']);
        b['Locals'] = Math.round(b['total'] * d['all']);
        b['Non-Locals'] = b['total'] - b['Locals'];
        b_data.push(b);
      });

      b_data.sort(function(a, b) { return b['total'] - a['total']; });

      let svg = d3.select("#stack-bar")
                  .append("svg")
                  .attr("viewBox", [0, 0, sb_width, sb_height]);

      let x = d3.scaleLinear()
                .domain([0, d3.max(b_data, function(d) { return d['total']; })])
                .range([margin.left, sb_width - margin.right]);

      let y = d3.scaleBand()
                .domain(b_data.map(function(d) { return d['city']; }))
                .range([margin.top, sb_height - margin.bottom])
                .padding(0.08);

      let z = d3.scaleOrdinal()
                .domain(keys)
                .range(colors);

      svg.append("g")
          .selectAll("g")
          .data(d3.stack().keys(keys)(b_data))
          .enter()
          .append("g")
          .attr("fill", function(d) { return z(d.key); })
          .selectAll("rect")
          .data(function(d) { return d; })
          .enter()
          .append("rect")
          .attr("x", function(d) { return x(d[0]); })
          .attr("y", function(d) { return y(d.data['city']); })
          .attr("height", y.bandwidth())
          .attr("width", function(d) { return x(d[1]) - x(d[0]); })
          .on("mouseover", function(d) {
              let text = 'City: ' + d.data['city'] + '<br/># of Locals: ' + f(d.data['Locals']) +
                         '<br/># of Non-Locals: ' + f(d.data['Non-Locals']);
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

      svg.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(0," + margin.top + ")")
            .style("font-size", "12")
            .call(d3.axisTop(x).ticks(sb_width / 100, "s"))
            .call(g => g.selectAll(".domain").remove());

      svg.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(" + margin.left + ",0)")
            .style("font-size", "12")
            .call(d3.axisLeft(y).tickSizeOuter(0))
            .call(g => g.selectAll(".domain").remove());

      svg.append('path')
         .attr('d', 'M 410 65L 510 140')
         .style('fill', 'none')
         .style('stroke', 'black')
         .style('stroke-width', 1);

      svg.append('path')
         .attr('d', 'M 270 170L 510 140')
         .style('fill', 'none')
         .style('stroke', 'black')
         .style('stroke-width', 1);

      svg.append('text')
         .attr('x', 520)
         .attr('y', 145)
         .text('More than 80% of the Officers in Chicago and Philly PD are living in the city');

      svg.append('path')
         .attr('d', 'M 175 1075L 300 1075')
         .style('fill', 'none')
         .style('stroke', 'black')
         .style('stroke-width', 1);

      svg.append('text')
         .attr('x', 310)
         .attr('y', 1080)
         .text('93% of the Officers in Laredo PD are living in the city which is the highest among all the cities in the list');

      svg.append('path')
         .attr('d', 'M 165 1510L 310 1550')
         .style('fill', 'none')
         .style('stroke', 'black')
         .style('stroke-width', 1);

      svg.append('path')
         .attr('d', 'M 165 1590L 310 1550')
         .style('fill', 'none')
         .style('stroke', 'black')
         .style('stroke-width', 1);

      svg.append('text')
         .attr('x', 320)
         .attr('y', 1555)
         .text('Most of the Officers in Richmond and Minneapolis PD are living out of the city');

      let legend = svg.selectAll(".legend")
        .data(colors)
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) {return "translate(600," + (300 + (i * 30)) + ")";});

      legend.append("rect")
        .attr("x", 150)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", function(d, i) {return colors.slice()[i];});

      legend.append("text")
        .attr("x", 175)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "start")
        .text(function(d, i) {
          switch (i) {
            case 0: return "Locals";
            case 1: return "Non-Locals";
          }
        });
  }).catch(err => console.log(err));
