let base_url = 'https://raw.githubusercontent.com/vs27-illinois/cs498-data-viz-final-project/master/';

// Map Width and Height
let map_width = 1200;
let map_height = 600;

// Stacked Bar Chart Width, Height and Margin
let sb_width = 1000;
let sb_height = 2000;
let margin = {top: 30, right: 30, bottom: 30, left: 150};

// Bar Chart Width, Height and Margin
let b_width = 500;
let b_height = 300;
let b_margin = {top: 30, right: 30, bottom: 30, left: 50};

let f = d3.format(",");

let div = d3.select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

d3.csv(base_url + "police-locals.csv")
  .then(data => {
      create_map(data);
      create_slide2(data);
      create_slide3(data);
  }).catch(err => console.log(err));

function create_map(data) {
    d3.json(base_url + "us-states.json")
      .then(json => {
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
          .then(city => {
            data.forEach(d => {
                city.forEach(c => {
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
                .attr("cx", d => projection([d['long'], d['lat']])[0])
                .attr("cy", d => projection([d['long'], d['lat']])[1])
                .attr("r", d => d['police_force_size'] / 500)
                .style("fill", "#d25c4d")
                .style("stroke", "#ff0000")
                .style("stroke-width", "1")
                .on("mouseover", d => {
                    let text = 'City: ' + d['city'] + '<br/># of Officers: ' + f(d['police_force_size']);
                    div.transition()
                       .duration(200)
                       .style("opacity", .9);
                    div.html(text)
                       .style("left", (d3.event.pageX) + "px")
                       .style("top", (d3.event.pageY - 28) + "px");
                })
                .on("mouseout", d => {
                    div.transition()
                       .duration(500)
                       .style("opacity", 0);
                });

            svg.selectAll("circle")
                .style("opacity", 0)
                .transition()
                .duration(1000)
                .delay((d, i) => i * 15)
                .style("opacity", 0.85);

            svg.append('path')
                .transition()
                .duration(1000)
                .delay((d, i) => i * 20)
                .attr('d', 'M 910 170L 820 75')
                .style('fill', 'none')
                .style('stroke', 'black')
                .style('stroke-width', 1);

            svg.append('text')
                .transition()
                .duration(1000)
                .delay((d, i) => i * 25)
                .attr('x', 650)
                .attr('y', 70)
                .text('New York City has the largest police force in the country');
          }).catch(err => console.log(err));
      }).catch(err => console.log(err));
}

function create_slide2(data) {
  let keys = ["Locals", "Non-Locals"];
  let colors = ["#10a778", "#d25c4d"];

  let b_data = [];

  data.forEach(d => {
    let b = {};
    b['city'] = d['city'];
    b['total'] = parseInt(d['police_force_size']);
    b['Locals'] = Math.round(b['total'] * d['all']);
    b['Non-Locals'] = b['total'] - b['Locals'];
    b_data.push(b);
  });

  b_data.sort((a, b) => b['total'] - a['total']);

  let svg = d3.select("#stack-bar")
              .append("svg")
              .attr("viewBox", [0, 0, sb_width, sb_height]);

  let x = d3.scaleLinear()
            .domain([0, d3.max(b_data, d => d['total'])]).nice()
            .range([margin.left, sb_width - margin.right]);

  let y = d3.scaleBand()
            .domain(b_data.map(d => d['city']))
            .range([margin.top, sb_height - margin.bottom])
            .padding(0.08);

  let z = d3.scaleOrdinal()
            .domain(keys)
            .range(colors);

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

  svg.append("g")
      .selectAll("g")
      .data(d3.stack().keys(keys)(b_data))
      .enter()
      .append("g")
      .attr("fill", d => z(d.key))
      .selectAll("rect")
      .data(d => d)
      .enter()
      .append("rect")
      .attr("x", d => x(d[0]))
      .attr("y", d => y(d.data['city']))
      .attr("height", y.bandwidth())
      .on("mouseover", d => {
          let text = 'City: ' + d.data['city'] + '<br/># of Locals: ' + f(d.data['Locals']) +
                     '<br/># of Non-Locals: ' + f(d.data['Non-Locals']);
          div.transition()
             .duration(200)
             .style("opacity", .9);
          div.html(text)
             .style("left", (d3.event.pageX) + "px")
             .style("top", (d3.event.pageY - 28) + "px");
      })
      .on("mouseout", d => {
          div.transition()
             .duration(500)
             .style("opacity", 0);
      });

  svg.selectAll('rect')
      .transition()
      .duration(1000)
      .delay((d, i) => i * 15)
      .attr("width", d => x(d[1]) - x(d[0]));

  svg.append('path')
     .attr('d', 'M 390 68L 510 140')
     .style('fill', 'none')
     .style('stroke', 'black')
     .style('stroke-width', 1);

  svg.append('path')
     .attr('d', 'M 250 170L 510 140')
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
    .attr("transform", (d, i) => "translate(600," + (300 + (i * 30)) + ")");

  legend.append("rect")
    .attr("x", 150)
    .attr("width", 18)
    .attr("height", 18)
    .style("fill", (d, i) => colors.slice()[i]);

  legend.append("text")
    .attr("x", 175)
    .attr("y", 9)
    .attr("dy", ".35em")
    .style("text-anchor", "start")
    .text((d, i) => {
      switch (i) {
        case 0: return "Locals";
        case 1: return "Non-Locals";
      }
    });
}

function create_slide3(data) {
  let b_data = [];

  let select = d3.select('#cities');

  data.forEach(d => {
    select.append('option').attr('value', d['city']).text(d['city']);

    let b = {};
    b['city'] = d['city'];
    b['race'] = 'White';
    b['count'] = (d['white'] !== '**') ? parseFloat(d['white']) : 0;
    b_data.push(b);
    b = {};
    b['city'] = d['city'];
    b['race'] = 'Non-White';
    b['count'] = (d['non-white'] !== '**') ? parseFloat(d['non-white']) : 0;
    b_data.push(b);
    b = {};
    b['city'] = d['city'];
    b['race'] = 'Black';
    b['count'] = (d['black'] !== '**') ? parseFloat(d['black']) : 0;
    b_data.push(b);
    b = {};
    b['city'] = d['city'];
    b['race'] = 'Hispanic';
    b['count'] = (d['hispanic'] !== '**') ? parseFloat(d['hispanic']) : 0;
    b_data.push(b);
    b = {};
    b['city'] = d['city'];
    b['race'] = 'Asian';
    b['count'] = (d['asian'] !== '**') ? parseFloat(d['asian']) : 0;
    b_data.push(b);
  });

  let svg = d3.select("#bar")
              .append("svg")
              .attr("viewBox", [0, 0, b_width, b_height]);

  let x = d3.scaleBand()
              .domain(b_data.map(d => d['race']))
              .range([b_margin.left, b_width - b_margin.right])
              .padding(0.1);

  let y = d3.scaleLinear()
              .domain([0, d3.max(b_data, d => d['count'])]).nice()
              .range([b_height - b_margin.bottom, b_margin.top])

  svg.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(0," + (b_height - b_margin.bottom) + ")")
            .call(d3.axisBottom(x));

  svg.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(" + b_margin.left + ",0)")
            .call(d3.axisLeft(y).ticks(10, "%"))
            .append("text")
            .attr("y", 6)
            .attr("dy", "0.71em")
            .attr("text-anchor", "end")
            .text("Count");

  let f_data = b_data.filter(d => {
      let sq = d3.select("#cities").property("value");
      console.log('sq: ' + sq);
      return d['city'] === sq;
    });

  svg.selectAll("rect")
        .data(f_data)
        .enter().append("rect")
        .attr("width", 30)
        .attr("fill", "#10a778");

  svg.selectAll("rect")
        .transition().duration(1000)
        .delay((d, i) => i * 15)
        .attr("x", d => x(d['race']))
        .attr("y", d => y(d['count']))
        .attr("height", d => b_height - y(d['count']));

  d3.select("#cities").on("change", () => {
       let sq = d3.select("#cities").property("value");
       let data = b_data.filter(d => d['city'] === sq)

       svg.selectAll("rect")
         .data(data)
         .transition().duration(1000)
         .delay((d, i) => i * 15)
         .attr("x", d => x(d['race']))
         .attr("y", d => y(d['count']))
         .attr("height", d => b_height - y(d['count']));
   });
}
