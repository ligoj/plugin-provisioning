/*
 * Licensed under MIT (https://github.com/ligoj/ligoj/blob/master/LICENSE)
 */
define(['jquery', 'cascade', 'd3'], function ($, $cascade, d3) {

	/*
	<script src="providerM/d3-data.js"
		integrity_="sha384-JOEpWYMPQJt9mXUdIYXIsbk5uXZa63FOqAkynqqZ76Y1KQHI1M4xJfJvJFSyQNPK"></script>
	<script src="providerM/d3-parse.js"
		integrity_="sha384-CGSxlvxHCQDwxBj9lMAnVcsbz/giQBMMR1m7jcFw/o/ROLFYSFq0aiIStDacv4NM"></script>
	<!-- REPLACE END -->
	*/
	function initialize() {
		var $container = $('#prov-assessment');
		$('#subscribe-configuration-prov > .tab-content').append($container);
		$('#service-prov-menu > .tab-content').append($('.tab-pane.tab-network.prov-filters'));

		const useTransition = false;
		const applicationLinkWidth = 1;
		const applicationStrength = 0.04;
		const animationLinkLimit = 100;
		const fillColors = {
			'PROD': '#f39264',
			'Production': '#f39264',
			DEFAULT: '#209ff9',
			NONE: 'grey'
		};
		const circleColors = {
			'windows': '#5b98ce',
			'rhel': '#c11a1a',
			'suse': '#17ce36',
			'centos': '#e262c1',
			'linux': '#e262c1',
			'other': '#848083',
			DEFAULT: '#ff0000',
			NONE: '#666666'
		};
		const circleStyles = {
			'2008 R2': '5,5',
			'2008': '5,5',
			DEFAULT: ''
		};
		var $frequencyModel;
		var $frequencyWeight;
		var $applications;
		var $not_applications;
		var $tags;
		var $not_tags;
		var $instances;
		var $environments;
		var $os;

		function initSelect2(type, byId, format) {
			var array = [];
			var keys = Object.keys(byId);
			keys.filter(k => k !== '' && k !== null && (typeof k !== 'undefined')).sort((a, b) => (byId[a].name || byId[a].id || byId[a] || a).toLowerCase().localeCompare((byId[b].name || byId[b].id || byId[b] || b).toLowerCase()));
			for (const key of keys) {
				let value = byId[key];
				array.push(format ? value : {
					id: value.id || value.name || key,
					text: value.name || value
				});
			};
			var $input = $('#prov-filter-' + type);
			return $select2 = $input.select2({
				multiple: true,
				formatSelection: format,
				formatResult: format,
				createSearchChoice: () => null,
				data: array
			});
		}

		function addApplications(applications, applicationsById) {
			if (applications === 'string') {
				applications = applications.split(',');
			}
			if (typeof applications.length === 'undefined') {
				let asArray = [];
				Object.keys(applications).filter(app => !!app).forEach(app => {
					if (!!applicationsById[app.toUpperCase()]) {
						asArray.push(app);
						applicationsById[app.toUpperCase()] = app.toUpperCase();
					}
				});
				return asArray;
			}
			// Add the applications
			for (const app of applications) {
				if (app && typeof applicationsById[app.toUpperCase()] === 'undefined') {
					applicationsById[app.toUpperCase()] = app.toUpperCase();
				}
			}
			return applications;
		}
		function normalize(instances, instancesById, applicationsById, osById, majorById, environmentsById, tagsById) {
			for (const instance of instances) {
				instance.id = instance.id || instance.name;
				instancesById[instance.id] = instance;
				if (instance.os) {
					osById[instance.os] = instance.os;
					if (instance.major) {
						majorById[instance.major] = instance.os + ' ' + instance.major;
					}
				}

				// Add environments
				if (typeof instance.env === 'string') {
					environmentsById[instance.env] = instance.env;
				} else if (instance.env && instance.env.length) {
					for (const env of instance.env) {
						environmentsById[env] = env;
					}
				}
				if (instance.tags) {
					// Extract the tags
					var tags = instance.tags.split(',');
					instance.tags = [];
					tags.filter(t => !!t && !t.startsWith('app:') && !t.startsWith('env:')).forEach(t => {
						tagsById[t] = t;
						instance.tags.push(t);
					});

					// Add the applications
					instance.applications = addApplications(tags.filter(t => t.startsWith('app:')).map(t => t.substring(4)), applicationsById);
				} else {
					instance.tags = [];
					if (typeof instance.applications === 'undefined') {
						if (instance.application) {
							instance.applications = [instance.application];
						} else {
							instance.applications = [];
						}
					} else {
						instance.applications = addApplications(instance.applications, applicationsById);
					}
				}

				// Parse the CSV cost
				if (instance.type === 'instance' || instance.type === 'elb' || typeof instance.type === 'undefined') {
					instance.iops = parseFloat(instance.iops || 0, 10);
					instance.cost = parseFloat(instance.cost || 0, 10);
					instance.cpu = parseInt(instance.cpu || 1, 10);
					instance.ram = parseInt(instance.ram || 16, 10);
					instance.disk = parseInt(instance.disk || 0, 10);
				}
			}
		}

		function median(links) {
			var values = [];
			var max = 0;
			for (const link of links) {
				var frequency = parseInt(link.frequency || 1, 10);
				if (frequency > max) {
					max = frequency;
				}
				values.push(frequency);
			}

			if (values.length === 0) {
				return 0;
			}
			values.sort(function (a, b) {
				return a - b;
			});
			var half = Math.floor(values.length / 2);
			if (values.length % 2) {
				return values[half];
			}
			console.log('Max frequency:' + max);
			return (values[half - 1] + values[half]) / 2.0;
		}

		function summaryValue(value1, value2) {
			return value1 === value2 ? value1 : (value2 + '/' + value1);
		}

		function summary(instances, applicationsById, links, instancesF, applicationsByIdF, linksF) {
			var visibleInstances = Object.keys(instancesF).length;
			var visibleApplications = Object.keys(applicationsByIdF).length;
			$('#applications-nb').text(summaryValue(Object.keys(applicationsById).length, visibleApplications));
			$('#instances-nb').text(summaryValue(instances.length, visibleInstances));
			var medianValue = median(links);
			var medianValueF = median(linksF);
			console.log('Median frequency:' + medianValue + '(' + medianValueF + ')');
			$('#frequency-median').text(summaryValue(medianValue, medianValueF));
			$('#frequency-nb').text(summaryValue(links.length, linksF.length));
			if (visibleApplications + visibleInstances == 0) {
				$('#no-filter').show();
			} else {
				$('#no-filter').hide();
			}
		}

		function normalizeLinks(links) {
			for (const link of links) {
				link.frequency = parseInt(link.frequency || 1, 10);
				link.throughput = parseInt(link.throughput || 0, 10);
				link.strength = link.strength || 0.01;
			}
		}

		function reduceLinks(links) {
			let reduced = [];
			let sourceTargets = {};
			let previous;
			for (const link of links) {
				if (typeof sourceTargets[link.source] !== 'undefined' && typeof sourceTargets[link.source][link.target] !== 'undefined') {
					// Aggregate links having same source/dest
					previous = sourceTargets[link.source][link.target]
					previous.streams++;
					previous.frequency += link.frequency;
					previous.throughput += link.throughput;
					previous.strength += link.strength;
					// Update the reverse link if found
					if (previous.reverseFrequency) {
						previous.reverseFrequency += link.frequency;
						previous.reverseThroughput += link.throughput;
					}
				} else if (typeof sourceTargets[link.target] !== 'undefined' && typeof sourceTargets[link.target][link.source] !== 'undefined') {
					// Merge with the reverse link
					previous = sourceTargets[link.target][link.source];
					previous.streams++;
					previous.frequency += link.frequency;
					previous.throughput += link.throughput;
					previous.strength += link.strength;
					previous.reverseFrequency += link.frequency;
					previous.reverseThroughput += link.throughput;
				} else {
					if (typeof sourceTargets[link.source] === 'undefined') {
						sourceTargets[link.source] = {};
					}
					if (typeof sourceTargets[link.source][link.target] === 'undefined') {
						sourceTargets[link.source][link.target] = link;
					}
					// Not bi-directional link
					link.streams = 1;
					link.reverseFrequency = 0;
					link.reverseThroughput = 0;
					reduced.push(link);
				}
			}
			return reduced;
		}

		function normalizeFrequency(links) {
			var frequencyWeight = parseFloat($frequencyWeight.val() || 1, 10);
			var model = Math[$frequencyModel.val() || 'log2'];
			for (const link of links) {
				link.frequencyModel = Math.max(model(link.frequency || 1) * frequencyWeight, 1);
			}
		}

		function selectDataSet(filter, $select2, datasetById, hasExclude, $select2Exclude) {
			var resultById = {};
			var excludeById = {};
			if (hasExclude) {
				$select2Exclude.select2('data').forEach(a => excludeById[a.id] = true);
			}
			if (filter) {
				$select2.select2('data').forEach(a => {
					if (!excludeById[a.id]) {
						resultById[a.id] = datasetById[a.id];
					}
				});
			} else if (hasExclude) {
				Object.keys(datasetById).filter(i => !excludeById[i]).forEach(i => resultById[i] = datasetById[i]);
			} else if ($select2Exclude || hasExclude === false) {
				resultById = datasetById;
			} else {
				resultById = [];
			}
			return resultById;
		}

		function hasIntersection(byId, tags) {
			for (const tag of tags) {
				if (typeof byId[tag] !== 'undefined') {
					return true;
				}
			}
			return false;
		}

		function render($service, nodes, volumes, instancesById, applicationsById, osById, majorById, environmentsById, tagsById, links) {
			normalizeFrequency(links);
			var filterApplications = $('#prov-filter-applications-check').is(':checked');
			var filterNotApplications = $('#prov-filter-not_applications-check').is(':checked');
			var filterNotTags = $('#prov-filter-not_tags-check').is(':checked');
			var enabledApplicationsById = selectDataSet(filterApplications, $applications, applicationsById, filterNotApplications, $not_applications);
			var disabledApplicationsById = selectDataSet(filterNotApplications, $not_applications, applicationsById);

			var filterTags = $('#prov-filter-tags-check').is(':checked');
			var filterNotTags = $('#prov-filter-not_tags-check').is(':checked');
			var enabledTagsById = selectDataSet(filterTags, $tags, tagsById, filterNotTags, $not_tags);
			var disabledTagsById = selectDataSet(filterNotTags, $not_tags, tagsById);

			var filterInstances = $('#prov-filter-instances-check').is(':checked');
			var enabledInstancesById = selectDataSet(filterInstances, $instances, instancesById, false);
			var filterEnvironments = $('#prov-filter-environments-check').is(':checked');
			var enabledEnvironmentsById = selectDataSet(filterEnvironments, $environments, environmentsById, false);
			var filterOs = $('#prov-filter-os-check').is(':checked');
			var filterMajor = $('#prov-filter-major-check').is(':checked');
			var enabledOsById = selectDataSet(filterOs, $os, osById, false);
			var enabledMajorById = selectDataSet(filterMajor, $major, majorById, false);
			var showNeighbours = $('#prov-filter-showNeighbours').is(':checked');
			var showNeighboursApplication = $('#prov-filter-showNeighbours-application').is(':checked');

			// TODO <use xlink:href="#one"></use>

			// Cleanup
			for (const node of nodes) {
				delete node.vx;
				delete node.vy;
				delete node.x;
				delete node.y;
				delete node.index;
			}
			for (const link of links) {
				delete link.index;
			}


			// Filter the enabled nodes
			var connectedNodes = {};
			var connectedApplications = {};
			var d3nodes = [];
			var d3links = [];

			function addApplicationLinks(node, applicationsById) {
				var id = node.id || node.name;
				for (const tag of node.applications) {
					if (showNeighboursApplication && !disabledApplicationsById[tag] || applicationsById[tag]) {
						connectedApplications[tag] = true;
						d3links.push({
							source: id,
							target: tag,
							strength: applicationStrength,
							type: 'application',
							frequency: 1
						});
					}
				}
			}
			function addNodeAndApplicationLinks(node, applicationsById) {
				d3nodes.push($.extend({}, node));
				var id = node.id || node.name;
				connectedNodes[id] = true;
				addApplicationLinks(node, applicationsById);
			}

			for (const n of Object.keys(enabledInstancesById)) {
				let node = enabledInstancesById[n];
				if ((!filterOs || (node.os && enabledOsById[node.os]))
					&& (!filterMajor || (node.major && enabledMajorById[node.major]))
					&& (!filterTags || (node.tags && hasIntersection(enabledTagsById, node.tags)))
					&& (!filterEnvironments || (node.env && enabledEnvironmentsById[node.env]))
					&& (!filterApplications || (node.applications && hasIntersection(enabledApplicationsById, node.applications)))) {
					addNodeAndApplicationLinks(node, enabledApplicationsById);
				} else if (!filterOs && !filterMajor && !filterTags && !filterEnvironments && !filterApplications) {
					// Not filtered node, add it
					d3nodes.push($.extend({}, node));
					connectedNodes[node.id || node.name] = true;
				}
			};

			// Filter the links relating two enabled nodes
			var showNeighboursNodes = {};
			function addNeighbour(link, node) {
				if (!hasIntersection(disabledApplicationsById, instancesById[node].applications)
					&& !hasIntersection(disabledTagsById, instancesById[node].tags)) {
					d3links.push($.extend({}, link));
					if (!showNeighboursNodes[node]) {
						d3nodes.push($.extend({}, instancesById[node]));
						showNeighboursNodes[node] = true;
						if (showNeighboursApplication) {
							addApplicationLinks(instancesById[node], applicationsById);
						}
					}
				}
			}

			for (const link of links) {
				if (connectedNodes[link.source] && connectedNodes[link.target]) {
					d3links.push($.extend({}, link))
				} else if (showNeighbours) {
					if (connectedNodes[link.source] && instancesById[link.target]) {
						addNeighbour(link, link.target)
					} else if (connectedNodes[link.target] && instancesById[link.source]) {
						addNeighbour(link, link.source)
					}
				}
			};

			// Add the enabled applications
			for (const a of Object.keys(connectedApplications)) {
				d3nodes.push($.extend({ name: a, type: 'application' }, applicationsById[a]));
			}

			Object.keys(showNeighboursNodes).forEach(n => connectedNodes[n] = true);
			summary(nodes, applicationsById, links, connectedNodes, connectedApplications, d3links);
			if (d3links.length > animationLinkLimit) {
				$container.removeClass('animated');
			} else {
				$container.addClass('animated');
			}
			nodes = d3nodes;
			links = d3links;

			var svg = d3.select('#prov-assessment svg');
			svg.selectAll('svg').remove();
			$container.find('svg').empty().remove();
			$container.find('.tooltip').remove();
			$container.append($('<svg width="100%" height="100vh"></svg>'));
			svg = d3.select('#prov-assessment svg');
			var width = $container[0].offsetWidth,
				height = $container[0].offsetHeight;

			//set up the simulation and add forces
			const radius = d => d.radius === -1 ? 0 : (d.radius || (d.cpu ? 4 + d.cpu * 4 + d.ram / 5 / 1024 : 0));
			const simulation = d3.forceSimulation(nodes)
				.force("link", d3.forceLink(links).id(d => d.id).strength(link => link.strength))
				.force("charge", d3.forceManyBody().strength(-100).distanceMin(radius))
				.force("center", d3.forceCenter(width / 2, height / 2))
				.force('collision', d3.forceCollide().radius(radius))
				.on("tick", ticked);

			const drag = simulation => {
				function dragstarted(d) {
					if (!d3.event.active) simulation.alphaTarget(0.3).restart();
					d.fx = d.x;
					d.fy = d.y;
				}

				function dragged(d) {
					d.fx = d3.event.x;
					d.fy = d3.event.y;
				}

				function dragended(d) {
					if (!d3.event.active) simulation.alphaTarget(0);
					d.fx = null;
					d.fy = null;
				}

				return d3.drag()
					.on("start", dragstarted)
					.on("drag", dragged)
					.on("end", dragended)
			}


			var tooltip = (function () {
				if ($('body').has('.d3-tooltip.tooltip-inner').length === 0) {
					return d3.select('body')
						.append('div')
						.attr('class', 'tooltip d3-tooltip tooltip-inner');
				} else {
					return d3.select('body .d3-tooltip.tooltip-inner');
				}
			})();
			function implied(node, other) {
				if (other.name === node.name) {
					return true;
				}
				for (const link of links) {
					if ((link.source.name === other.name && link.target.name === node.name)
						|| (link.target.name === other.name && link.source.name === node.name)) {
						return true;
					}
				}
				return false;
			}
			function impliedFromLink(link, node) {
				return link.source === node || link.target === node;
			}
			function impliedLink(node, link) {
				return link.source.name === node.name || link.target.name === node.name;
			}

			function transition(n) {
				if (useTransition) {
					n = n.transition();
				}
				return n;
			}

			function fade(opacity) {
				return function (d, i) {
					transition(svg.selectAll("g.node")
						.attr("selected", null)
						.filter(node => !implied(d, node)))
						.style("opacity", opacity);
					svg.selectAll("g.node")
						.filter(node => implied(d, node))
						.attr("selected", "true");
					transition(svg.selectAll("line")
						.attr("selected", null)
						.filter(link => !impliedLink(d, link)))
						.style("opacity", opacity);
					svg.selectAll("line")
						.filter(link => impliedLink(d, link))
						.attr("selected", "true");
				};
			}

			function fadeLink(opacity) {
				return function (link, i) {
					transition(svg.selectAll("g.node")
						.attr("selected", null)
						.filter(node => !impliedFromLink(link, node)))
						.style("opacity", opacity);
					svg.selectAll("g.node")
						.filter(node => impliedFromLink(link, node))
						.attr("selected", "true");
					transition(svg.selectAll("line")
						.attr("selected", null)
						.filter(l => l !== link))
						.style("opacity", opacity);
					svg.selectAll("line")
						.filter(l => l === link)
						.attr("selected", "true");
				};
			}

			//Highlight hovered over chord
			const opacityDefault = 1;

			const toHtmlListeners = ls =>
				ls.map(l => `&nbsp; &#8594; ${l.target.host}${(l.target.name && l.target.name !== l.target.host) ? '(' + l.target.name + ')' : ''}:${l.target.port}`).join('<br>');

			const toHtmlAccount = a =>
				a + (instancesById[a] && instancesById[a].name) ? ` (${instancesById[a].name}) [${instancesById[a].provider}]` : '';
			const toHtmlIp = ips =>
				typeof ips === 'string' ?
					ips :
					Object.keys(ips).length === 1 ?
						Object.keys(ips).map(ip => `${ip} (${ips[ip]})`)[0] :
						('<br>' + Object.keys(ips).map(ip => `&nbsp; ${ip} (${ips[ip]})`).join('<br>'));


			const toHtmlVHosts = vhs =>
				Object.keys(vhs).map(vh => {
					let l = vhs[vh];
					if (l.target) {
						return `&nbsp; ${vh}&#8594; ${l.target.host}${(l.target.name && l.target.name !== l.target.host) ? '(' + l.target.name + ')' : ''}:${l.target.port}${l.target.url ? ', ' + l.target.url : ''}`;
					}

					// Local resolution
					return `&nbsp; ${vh}&#8594; localhost`;
				}).join('<br>')

			const throughput = t => '@' + formatManager.formatSize((t || 0) * 1024, 3) + '/s';
			const frequencyOpt = f => f > 1 ? 'x' + f : '';
			const throughputOpt = t => t ? throughput(t) : '';
			const toHtml = d => {
				if (d.frequency) {
					// Link
					if (d.reverseFrequency) {
						// Bi-directional link
						return `<strong>Bi-directional link</strong><br>${d.streams} streams<br>${$service.formatQuoteResource(d.source)} &#8594; ${$service.formatQuoteResource(d.target)} ${frequencyOpt(d.frequency)}${throughputOpt(d.throughput)}<br>${$service.formatQuoteResource(d.target)} &#8594; ${$service.formatQuoteResource(d.source)} ${frequencyOpt(d.reverseFrequency)}${throughputOpt(d.reverseThroughput)}`
					} else {
						// Simple link
						return `<strong>Link</strong><br>${d.streams > 1 ? d.streams + 'streams<br>' : ''}${$service.formatQuoteResource(d.source)} &#8594; ${$service.formatQuoteResource(d.target)} ${frequencyOpt(d.frequency)}${throughputOpt(d.throughput)}`
					}
				}
				// Node
				if (d.type === 'application') {
					return "<strong>Application</strong>: " + d.name
						+ "<br><span class='coupled'><strong>Servers</strong>: " + countCoupled(d, 'application') + '</span>';
				}
				return "<strong>" + $service.$messages.name + "</strong>: " + $service.formatQuoteResource(d)
					+ (d.env ? `<br><strong>Environment</strong>: ${d.env}` : '')
					+ (d.applications && d.applications.length ? "<br><strong>Applications</strong>: " + d.applications.join(',') : '')
					+ (d.tags && d.tags.length ? title('tags') + d.tags.join(',') : '')
					+ (d.account ? "<br><strong>Account</strong>: " + toHtmlAccount(d.account) : '')
					+ (d.type ? title('instance-type') + d.type : '')
					+ (d.price ? title('instance-type') + d.price.type.name + ' (' + d.resourceType + ')' : '')
					+ (d.ip ? "<br><strong>IP</strong>: " + toHtmlIp(d.ip) : '')
					+ (d.type === 'elb' ? "<br><strong>ELB</strong>: " + d.dns : '')
					+ toPercent('cpu', [d.cpu_avg, d.cpu_max, d.cpu, d.price && d.price.type.cpu], $service.formatCpu)
					+ toPercent('ram', [d.ram_max, d.ram, d.price && d.price.type.ram], $service.formatRam)
					+ toPercent('storage', [d.disk_max, d.disk], $service.formatStorage)
					+ toVolumes(d)
					+ (d.iops ? "<br><strong>IOPS</strong>: " + d.iops : '')
					+ ((d.network_in || d.network_out) ? `<br><strong>Network</strong>: in${throughput(d.network_in)}, out${throughput(d.network_out)}` : '')
					+ (d.cost ? title('cost') + $service.formatCost(d) : '')
					+ (d.os ? title('os') + $service.formatOs(d.os) + (d.major ? ' ' + d.major : '') : '')
					+ (d.nginx ? "<br><strong>NGNIX</strong>:<br>" + toHtmlVHosts(d.nginx.vhosts) : '')
					+ (d['ha-proxy'] ? "<br><strong>HA-PROXY</strong>:<br>" + toHtmlListeners(d['ha-proxy'].listeners) : '')
					+ "<br><span class='coupled'><strong>Coupled</strong>: " + countCoupled(d, null, 'application') + '</span>';
			};


			const title = key => key ? '<br><strong>' + $service.$messages['service:prov:' + key] + '</strong>: ' : '';

			function toVolumes(node) {
				let nVolumes = volumes.filter(v => v.node === node.id);
				if (nVolumes.length) {
					let total = [0, 0, 0];
					let result = ''
					nVolumes.forEach(v => {
						result += `<br>&nbsp;${v.name}: ${toPercent(null, [v.size_max, v.size, v.price && v.price.type.min].filter(t => t > 0), $service.formatStorage)}`
						total[0] += v.size_max || 0;
						total[1] += v.size || 0;
						total[2] += v.price && v.price.type.min || 0;
					});
					return toPercent('storage', total.filter(t => t > 0), $service.formatStorage) + (nVolumes.length > 1 ? result : '');
				}
				return '';
			}

			function toPercent(key, dataArray, format) {
				dataArray.sort();
				dataArray = dataArray.filter(i => typeof i !== 'undefined' && i !== null).map(i => Math.round(parseFloat(i, 10) * 100) / 100);
				if (dataArray.length === 0 || dataArray[dataArray.length - 1] <= 0) {
					return '';
				}

				const min = dataArray[0];
				const max = dataArray[dataArray.length - 1];

				let last = min;
				let result = title(key) + format(min) + (min === max ? '' : ('(' + Math.round(min * 100 / max) + '%)'));
				dataArray.forEach(i => {
					if (i !== last) {
						result += '/' + format(i) + (i === max ? '' : ('(' + Math.round(i * 100 / max) + '%)'));
						last = i;
					}
				});
				return result;
			}
			const countCoupled = (d, type, excludedType) => {
				let count = 0;
				for (const link of links) {
					if ((link.source.name === d.name || link.target.name === d.name) && (typeof type === 'undefined' || type === null || link.type === type) && (typeof excludedType === 'undefined' || excludedType === null || link.type !== excludedType)) {
						count++;
					}
				}
				return count;
			};
			const mouseoverNodeOrLink = (d, i) =>
				tooltip
					.style("left", d3.event.pageX + 12 + "px")
					.style("top", d3.event.pageY + 12 + "px")
					.style('visibility', 'visible')
					.html(() => toHtml(d));

			const fillColour = d => d.env ? fillColors[d.env] || fillColors.DEFAULT : fillColors.NONE;
			const circleColour = d => d.os ? circleColors[d.os.toLowerCase()] || circleColors[(d.os.toLowerCase() || '').toLowerCase()] || circleColors.DEFAULT : circleColors.NONE;
			const circleStyle = d => circleStyles[d.major] || circleStyles.DEFAULT;

			function mouseoutChord(d) {
				tooltip.style('visibility', 'hidden')
				transition(svg.selectAll("g.node")
					.attr("selected", null))
					.style("opacity", opacityDefault);
				transition(svg.selectAll("line")
					.attr("selected", null))
					.style("opacity", opacityDefault);
			}

			var g = svg.append("g")
				.attr("class", "everything");

			g.append("g")
				.attr("class", "links")
				.selectAll("line")
				.data(links)
				.enter()
				.filter(d => (typeof d.type) !== 'undefined' && d.type !== 'account' && d.type !== 'provider' && d.type !== 'application')
				.append("line")
				.attr("stroke-width", linkWidth)
				.attr("class", d => d.type + (d.reverseFrequency ? ' dual' : ''))
				.on("mouseover", fadeLink(.15))
				.on("mouseout", mouseoutChord)
				.on("mousemove", mouseoverNodeOrLink);

			g.append("g")
				.attr("class", "links")
				.selectAll("line")
				.data(links)
				.enter()
				.filter(d => d.type === 'account' || d.type === 'application')
				.append("line")
				.attr("class", d => d.type)
				.attr("stroke-width", applicationLinkWidth)
				.style("stroke-dasharray", ("2, 5"))
				.style("stroke", "grey")
				.on("mouseout", mouseoutChord)
				.on("mousemove", mouseoverNodeOrLink);

			// draw circles for the nodes 
			var node = g.append("g")
				.attr("stroke-width", 3)
				.style("font-weight", "normal")
				.style("text-transform", "uppercase")
				.style("font-family", "sans-serif")
				.selectAll("circle")
				.data(nodes)
				.enter()
				.append("g")
				.attr("class", d => 'node ' + d.type)
				.call(drag(simulation));

			node.filter(d => d.type !== 'elb')
				.append('circle')
				.attr("stroke", circleColour)
				.attr("stroke-dasharray", circleStyle)
				.attr("r", radius)
				.attr("fill", fillColour)
				.on("mouseover", fade(.15))
				.on("mouseout", mouseoutChord)
				.on("mousemove", mouseoverNodeOrLink);

			node.filter(d => d.type === 'elb')
				.append('rect')
				.attr("stroke", circleColour)
				.attr("stroke-dasharray", circleStyle)
				.attr("width", 40)
				.attr("height", 40)
				.attr("ry", 10)
				.attr("ry", 10)
				.attr("fill", fillColour)
				.on("mouseover", fade(.15))
				.on("mouseout", mouseoutChord)
				.on("mousemove", mouseoverNodeOrLink);

			node.filter(d => typeof d.icon !== 'undefined')
				.append("svg:image")
				.attr("xlink:href", d => d.icon)
				.attr("x", d => -d.radius)
				.attr("y", d => -d.radius)
				.attr("height", d => 2 * d.radius)
				.attr("width", d => 2 * d.radius);


			node.filter(d => typeof d.icon === 'undefined')
				.append("text")
				.text(d => d.name)
				.attr("class", "text")
				.attr("text-anchor", "middle")
				.on("mouseover", fade(.15))
				.on("mouseout", mouseoutChord)
				.on("mousemove", mouseoverNodeOrLink);

			// Add zoom capabilities 
			var zoom_handler = d3.zoom()
				.on("zoom", zoom_actions);
			zoom_handler(svg);

			function linkWidth(d) {
				return d.frequencyModel || 0;
			}

			//Zoom functions 
			function zoom_actions() {
				g.attr("transform", d3.event.transform)
			}

			function ticked() {
				svg.selectAll("line")
					.attr("x1", d => d.source.x)
					.attr("y1", d => d.source.y)
					.attr("x2", d => d.target.x)
					.attr("y2", d => d.target.y);
				node.attr("transform", d => `translate(${d.x} ${d.y})`);
			}
		}
		function resetUi(data) {
			$('#prov-filter-applications-check').prop('checked', data.defaults && data.defaults.applicationsFilter || false);
			$('#prov-filter-applications').val(data.defaults && data.defaults.applications || '');
			$('#prov-filter-not_applications-check').prop('checked', data.defaults && data.defaults.not_applicationsFilter || false);
			$('#prov-filter-not_applications').val(data.defaults && data.defaults.not_applications && data.defaults.not_applications.join(',') || '');
			$('#prov-filter-tags-check').prop('checked', data.defaults && data.defaults.tagsFilter || false);
			$('#prov-filter-tags').val(data.defaults && data.defaults.tags || '');
			$('#prov-filter-not_tags-check').prop('checked', data.defaults && data.defaults.not_tagsFilter || false);
			$('#prov-filter-not_tags').val(data.defaults && data.defaults.not_tags || '');
			$('#prov-filter-instances-check').prop('checked', false);
			$('#prov-filter-instances').val('');
			$('#prov-filter-os-check').prop('checked', false);
			$('#prov-filter-os').val('');
			$('#prov-filter-major-check').prop('checked', false);
			$('#prov-filter-major').val('');
			$('#prov-filter-frequencyWeight').val(1);
		}

		function configure($service, conf) {
			var data = {
				nodes: conf.instances.map(n => {
					var n2 = {};
					Object.assign(n2, n);
					n2.id = 'i' + n.id;
					return n2;
				}).concat(conf.databases.map(n => {
					var n2 = {};
					Object.assign(n2, n);
					n2.id = 'd' + n.id;
					return n2;
				})),
				volumes: conf.storages.filter(v => v.quoteInstance || v.quoteDatabase).map(v => {
					var v2 = {};
					Object.assign(v2, v);
					v2.node = v.quoteInstance ? 'i' + v.quoteInstance.id : ('d' + v.quoteDatabase.id);
					return v2;
				}),
				links: conf.networks.map(l => {
					var l2 = {};
					Object.assign(l2, l);
					l2.source = l.sourceType.charAt(0) + l.source;
					l2.target = l.targetType.charAt(0) + l.target;
					l2.type = 'network';
					l2.frequency = l2.rate;
					return l2;
				})
			}
			resetUi(data);
			$frequencyModel = $('#prov-filter-frequencyModel').select2();
			$frequencyWeight = $('#prov-filter-frequencyWeight');

			var nodes = data.nodes;
			var data_links = data.links;
			var applicationsById = {}, tagsById = {}, osById = {}, majorById = {}, nodesById = {}, environmentsById = {};
			normalize(nodes, nodesById, applicationsById, osById, majorById, environmentsById, tagsById);
			normalizeLinks(data_links);
			data_links = reduceLinks(data_links);
			$applications = initSelect2('applications', applicationsById);
			$not_applications = initSelect2('not_applications', applicationsById);
			$tags = initSelect2('tags', tagsById);
			$not_tags = initSelect2('not_tags', tagsById);
			$instances = initSelect2('instances', nodesById, $service.formatQuoteResource);
			$environments = initSelect2('environments', environmentsById);
			$os = initSelect2('os', osById, $service.formatOs);
			$major = initSelect2('major', majorById);

			$("#prov-filters input:not(.ui-only), #prov-filters select:not(.ui-only)").off('change').on('change', function () {
				// Update the enabled filter UI state
				if (!$(this).is('input[type="checkbox"]')) {
					if ($(this).val()) {
						// Non empty updated value need a checked filter
						$(this).closest('.input-group').find('input[type="checkbox"]').prop('checked', true);
					} else if ($(this).is('.no-empty')) {
						$(this).closest('.input-group').find('input[type="checkbox"]').prop('checked', false);
					}
				}

				// Refresh the state
				render($service, nodes, data.volumes, nodesById, applicationsById, osById, majorById, environmentsById, tagsById, data_links);
			});

			$(document).ready(function () {
				render($service, nodes, data.volumes, nodesById, applicationsById, osById, majorById, environmentsById, tagsById, data_links);
			});
		}

		var $tab = _('prov-filters');
		$tab.off('change', '.toggle-advanced').on('change', '.toggle-advanced', () => $tab.toggleClass('advanced'));
		$tab.off('change', '.toggle-animated').on('change', '.toggle-animated', () => $container.toggleClass('disable-animated'));
		var current = $cascade.$current;
		var subscription = current.currentSubscription;
		var conf = subscription.configuration;
		$('#prov-filters-trigger').off('show.bs.tab').on('show.bs.tab', function () {
			current.$super('requireService')(current.$parent, 'service:prov', function ($service) {
				configure($service, conf);
			});
		});

	}

	var self = {
		initialize: initialize
	}
	return self;
});