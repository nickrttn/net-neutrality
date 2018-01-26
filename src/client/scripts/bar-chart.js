import { scaleBand, scaleLinear } from 'd3-scale';
import { axisBottom, axisLeft } from 'd3-axis';
import { select } from 'd3-selection';
import { max } from 'd3-array';

import request from './request';

const margin = {
  top: 0,
  right: 0,
  bottom: 0 * 18,
  left: 7 * 18,
};

module.exports = function() {
  const nodes = document.querySelectorAll('[data-component="bar-chart"]');
  const isSmallScreen = window.matchMedia('(max-width: 46.5em)').matches;

  nodes.forEach(node => {
    const { file, filetype } = node.dataset;
    const chart = select(node.querySelector('svg'));
    let { width } = node.getBoundingClientRect();

    chart.attr(
      'viewBox',
      `0 0 ${width} ${width * (isSmallScreen ? 1.2 : 0.5)}`,
    );

    width = width - margin.left - margin.right;
    let height =
      width * (isSmallScreen ? 1.2 : 0.5) - margin.top - margin.bottom;

    const x = scaleBand()
      .rangeRound([0, width])
      .padding(0.1);

    const y = scaleLinear().range([height, 0]);

    request(file, filetype).then(data => {
      const arr = Object.keys(data)
        .map(key => data[key])
        .sort((elA, elB) => elB.packets - elA.packets);

      x.domain(
        arr.map(el => (isSmallScreen ? el.countryCode : el.countryName)),
      );
      y.domain([0, max(arr.map(el => el.packets))]).nice();

      const xAxis = chart
        .append('g')
        .attr('class', 'axis')
        .attr('transform', `translate(${margin.left}, ${margin.top + height})`)
        .call(axisBottom(x));

      const yAxis = chart
        .append('g')
        .attr('class', 'axis')
        .attr('transform', `translate(0, ${margin.top})`)
        .call(
          axisLeft(y)
            .ticks([5])
            .tickSize(-(width + margin.left))
            .tickFormat(function(d) {
              return this.parentNode.nextSibling ? d : `${d} IP addresses`;
            }),
        );

      yAxis
        .selectAll('.tick text')
        .attr('dy', -6)
        .attr('dx', 6)
        .attr('text-anchor', 'start');

      if (!isSmallScreen) {
        xAxis
          .selectAll('.tick text')
          .attr('text-anchor', 'end')
          .attr('dx', '-6')
          .attr('transform', 'rotate(-25)');
      }

      const bars = chart
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

      const bar = bars
        .selectAll('g')
        .data(arr)
        .enter()
        .append('g')
        .attr(
          'transform',
          d =>
            `translate(${x(isSmallScreen ? d.countryCode : d.countryName)}, 0)`,
        );

      bar
        .append('rect')
        .attr('y', d => y(d.packets))
        .attr('height', d => height - y(d.packets))
        .attr('width', x.bandwidth());

      bar
        .append('text')
        .attr('class', 'value')
        .attr('x', x.bandwidth() / 2)
        .attr('y', d => y(d.packets) + 3)
        .attr('dy', '-7')
        .attr('text-anchor', 'middle')
        .text(d => d.packets);
    });
  });
};
