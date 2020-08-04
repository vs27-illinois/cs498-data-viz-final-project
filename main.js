let base_url = 'https://raw.githubusercontent.com/vs27-illinois/cs498-data-viz-final-project/master/';

// Map Width and Height
let map_width = 1200;
let map_height = 600;

// Stacked Bar Chart Width, Height and Margin
let sb_width = 1000;
let sb_height = 2100;
let margin = {top: 100, right: 30, bottom: 30, left: 150};

// Bar Chart Width, Height and Margin
let b_width = 500;
let b_height = 400;
let b_margin = {top: 100, right: 30, bottom: 30, left: 50};

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
                .duration(500)
                .delay((d, i) => i * 10)
                .style("opacity", 0.85);

            add_annotation(svg, 'M 910 170L 820 75', [650, 70],
                           'New York City has the largest police force in the country');
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
      .delay((d, i) => i * 10)
      .attr("width", d => x(d[1]) - x(d[0]));

  add_annotation(svg, 'M 390 138L 510 210', [520,215],
                 'More than 80% of the Officers in Chicago and Philly PD are living in the city');
  add_annotation(svg, 'M 250 245L 510 210', [], '');
  add_annotation(svg, 'M 175 1165L 300 1165', [310,1170],
                   '93% of the Officers in Laredo PD are living in the city which is the highest among all the cities in the list');
  add_annotation(svg, 'M 165 1610L 310 1650', [320,1655],
                   'Most of the Officers in Richmond and Minneapolis PD are living out of the city');
  add_annotation(svg, 'M 165 1690L 310 1650', [], '');

  let legend = svg.selectAll(".legend")
    .data(colors)
    .enter().append("g")
    .attr("class", "legend")
    .attr("transform", (d, i) => "translate(" + (300 + i * 100) + ",30)");

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
              .padding(0.5);

  let y = d3.scaleLinear()
              .domain([0, d3.max(b_data, d => d['count'])]).nice()
              .range([b_height - b_margin.bottom, b_margin.top])

  svg.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(0," + (b_height - b_margin.bottom) + ")")
            .call(d3.axisBottom(x))
            .attr('font-size', 8);

  svg.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(" + b_margin.left + ",0)")
            .call(d3.axisLeft(y).ticks(10, "%"))
            .attr('font-size', 8)
            .append("text")
            .attr("y", 6)
            .attr("dy", "0.71em")
            .attr("text-anchor", "end");

  let f_data = b_data.filter(d => {
      let sq = d3.select("#cities").property("value");
      return d['city'] === sq;
    });

  svg.selectAll("rect")
        .data(f_data)
        .enter().append("rect")
        .attr("x", d => x(d['race']))
        .attr("y", d => y(d['count']))
        .attr("width", x.bandwidth())
        .attr("fill", "#10a778");

  svg.selectAll("rect")
        .transition().duration(1000)
        .delay((d, i) => i * 10)
        .attr("height", d => b_height - b_margin.bottom - y(d['count']));

  let text1 = add_annotation(svg, 'M 107 40L 107 370', [80,30],
                   'White cops', 8);
  let text2 = add_annotation(svg, 'M 183 70L 183 370', [140,60],
                     'Non-White cops', 8);

  d3.select("#cities").on("change", () => {
       let sq = d3.select("#cities").property("value");
       let data = b_data.filter(d => d['city'] === sq)

       text1.text('White cop in ' + sq);
       text2.text('Non-White cop in ' + sq);

       svg.selectAll("rect")
         .data(data)
         .transition().duration(1000)
         .delay((d, i) => i * 10)
         .attr("x", d => x(d['race']))
         .attr("y", d => y(d['count']))
         .attr("height", d => b_height - b_margin.bottom - y(d['count']));
   });
}

function add_annotation(svg, l_coord, t_coord, note, font_size) {
    let path = svg.append('path')
                  .attr('d', l_coord)
                  .style('fill', 'none')
                  .style('stroke', 'black')
                  .style('stroke-width', 1);

    var totalLength = path.node().getTotalLength();
    path.attr("stroke-dasharray", totalLength + " " + totalLength)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(500)
        .delay(1000)
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0);

    let text = null;
    if (t_coord.length > 0) {
        text = svg.append('text')
                .attr('x', t_coord[0])
                .attr('y', t_coord[1])
                .attr('font-size', font_size || 10)
                .text(note);
        text.style("opacity", 0)
                .transition()
                .duration(1000)
                .delay(1100)
                .style("opacity", 1);
    }

    return text;
}
