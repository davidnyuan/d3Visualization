
$(function () {
    // Read in  data. 
    d3.csv('/data/movie_metadata.csv', function (error, allData) {

        var colorScale;

        //  defaults
        var margin = {
            top: 40,
            right: 10,
            bottom: 100,
            left: 100
        },
            width = 960,
            height = 500,
            drawWidth = width - margin.left - margin.right,
            drawHeight = height - margin.top - margin.bottom,
            measure = 'title_year'; // variable to visualize

        // Wrapper div for class
        var svg = d3.select('#vis')
            .append("svg")
            .attr('height', height)
            .attr('width', width)

        var g = svg.append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
            .attr('height', drawHeight)
            .attr('width', drawWidth);

        // xAxis label
        var xAxisLabel = svg.append('g')
            .attr('transform', 'translate(' + margin.left + ',' + (drawHeight + margin.top) + ')')
            .attr('class', 'axis');

        // yxis label
        var yAxisLabel = svg.append('g')
            .attr('class', 'axis')
            .attr('transform', 'translate(' + margin.left + ',' + (margin.top) + ')');

        // xaxis text
        var xAxisText = svg.append('text')
            .attr('transform', 'translate(' + (margin.left + drawWidth / 2) + ',' + (drawHeight + margin.top + 60) + ')')
            .attr('class', 'title');

        // yaxis text
        var yAxisText = svg.append('text')
            .attr('transform', 'translate(' + (margin.left - 40) + ',' + (margin.top + drawHeight / 2) + ') rotate(-90)')
            .attr('class', 'title');

        var xAxis = d3.axisBottom();

        var yAxis = d3.axisLeft()
            .tickFormat(d3.format('.2s'));

        var xScale = d3.scaleBand();

        var yScale = d3.scaleLinear();

        // Function for setting the scales
        var setScales = function (data) {
            var genYear = data.map(function (d) {
                return d[0];
            });

            xScale.range([0, drawWidth])
                .padding(0.2)
                .domain(genYear, 1);

            var yMin = d3.min(data, function (d) {
                return +d[1];
            });

            var yMax = d3.max(data, function (d) {
                return +d[1];
            });

            yScale.range([drawHeight, 0])
                .domain([0, yMax]);
        };

        // Function for setting axes
        var setAxes = function () {
            // Set the scale of your xAxis object
            xAxis.scale(xScale);

            // Set the scale of your yAxis object
            yAxis.scale(yScale);

            xAxisLabel.transition().duration(1500).call(xAxis).selectAll('text').attr('transform', 'rotate(-45)').style('text-anchor', 'end');

            yAxisLabel.transition().duration(1500).call(yAxis);

            // Update xAxisText and yAxisText labels
            if (measure == 'title_year') {
                xAxisText.text('Year');
            } else {
                xAxisText.text('Genre');
            }

            if (measure == 'count') {
                yAxisText.text('Number of Movies in this Genre');
            } else if (measure == 'title_year') {
                yAxisText.text('Number of Movies');
            } else if (measure == 'gross') {
                yAxisText.text('Gross Earnings');
            } else {
                yAxisText.text('Total Budget');
            }
        }

        var filterData = function () {
            var graphData = {};
            var sortable = [];
            if (measure == 'title_year') {
                var yearData = d3.nest()
                    .key(function (d) { return d.title_year })
                    .entries(allData)
                for (var i = 0; i < yearData.length; i++) {
                    var year = yearData[i].key;
                    var count = yearData[i].values.length;
                    graphData[year] = count;
                }
                //Sort based on key, so we can see how counts vary over years
                Object.keys(graphData)
                    .sort()
                    .forEach(function (v, i) {
                        sortable.push([v, graphData[v]]);
                    });
                sortable.splice(0, 75);
            } else {
                genreList = allData.forEach(function (d) {
                    movieGenre = d.genres;
                    splitGenre = movieGenre.split('|');
                    if (measure == 'count') {
                        splitGenre.map(function (val) {
                            if (val in graphData) {
                                graphData[val] = graphData[val] + 1;
                            } else {
                                graphData[val] = 1;
                            }
                        })
                    } else if (measure == 'gross') {
                        var grossValue = Number.parseInt(d.gross);
                        if (!Number.isNaN(grossValue)) {
                            splitGenre.map(function (val) {
                                if (val in graphData) {
                                    graphData[val] = graphData[val] + grossValue;
                                } else {
                                    graphData[val] = grossValue;
                                }
                            })
                        }
                    } else {
                        var budgetValue = Number.parseInt(d.budget);
                        if (!Number.isNaN(budgetValue)) {
                            splitGenre.map(function (val) {
                                if (val in graphData) {
                                    graphData[val] = graphData[val] + budgetValue;
                                } else {
                                    graphData[val] = budgetValue;
                                }
                            })
                        }
                    }
                })

                for (var genre in graphData) {
                    sortable.push([genre, graphData[genre]]);
                }

                var genreNames = sortable.map(function (d) {
                    return d[0]
                });
                colorScale = d3.scaleOrdinal().domain(genreNames).range(d3.schemeCategory20);
                sortable.sort(function (a, b) {
                    return a[1] - b[1];
                });
                sortable.splice(0, 8);
                sortable.sort(function (a, b) {
                    return b[1] - a[1];
                });
            }
            return sortable;
        };

        // Add tip
        var tip = d3.tip().attr('class', 'd3-tip').html(function (d) {
            if (measure == 'title_year') {
                return 'Year: ' + d[0] + '; ' + 'Count: ' + d[1];
            } else if (measure == 'count') {
                return 'Genre: ' + d[0] + '; ' + 'Count: ' + d[1];
            } else if (measure == 'gross') {
                return 'Genre: ' + d[0] + '; ' + 'Gross: ' + d3.format("($.2f")(d[1]);
            } else if (measure == 'budget') {
                return 'Genre: ' + d[0] + '; ' + 'Budget: ' + d3.format("($.2f")(d[1]);
            }
        });
        g.call(tip);


        // Draw and bind data
        var draw = function (data) {
            // Set scales
            setScales(data);

            // Set axes
            setAxes();

            var nameList = data.map(function (d) {
                return d[0]
            })

            // Select all rects and bind data
            var bars = g.selectAll('rect').data(data);

            // Use the .enter() method to get your entering elements, and assign initial positions
            bars.enter().append('rect')
                .attr('x', function (d) {
                    return xScale(d[0]);
                })
                .attr('y', function (d) {
                    return drawHeight;
                })
                .attr('height', 0)
                .attr('class', 'bar')
                .on('mouseover', tip.show)
                .on('mouseout', tip.hide)
                .attr('width', xScale.bandwidth())
                .merge(bars)
                .style('fill', 'steelblue')
                .transition()
                .duration(1500)
                .delay(function (d, i) {
                    return i * 50;
                })
                .attr('x', function (d) {
                    return xScale(d[0]);
                })
                .attr('y', function (d) {
                    return yScale(d[1]);
                })
                .attr('height', function (d) {
                    return drawHeight - yScale(d[1]);
                })

            if (measure == 'title_year') {
                bars.style('fill', 'steelblue')
            } else {
                bars.style("fill", function (d, i) {
                    return colorScale(d[0]);
                })
            }
            // Use the .exit() and .remove() methods to remove elements that are no longer in the data
            bars.exit().remove();
        };

        // Call your draw function
        var currentData = filterData();
        draw(currentData);

        // Listen to change events on the input elements
        $("input").on('change', function () {
            // Set your measure variable to the value (which is used in the draw funciton)
            measure = $(this).val();
            // Draw your elements
            var currentData = filterData();
            draw(currentData);
        });
    });
});