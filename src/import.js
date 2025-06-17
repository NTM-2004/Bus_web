const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { connectDB, sql } = require('./config/db');
const turf = require('@turf/turf'); // npm install @turf/turf

// Helper: Generate unique node id from coordinates
function nodeIdFromCoords(lng, lat) {
    return `${lng.toFixed(7)},${lat.toFixed(7)}`;
}

// Helper: Insert node if not exists
async function insertNode(pool, node) {
    const check = await pool.request()
        .input('id', sql.VarChar, node.id)
        .query('SELECT id FROM Node WHERE id = @id');
    if (check.recordset.length === 0) {
        await pool.request()
            .input('id', sql.VarChar, node.id)
            .input('latitude', sql.Float, node.latitude)
            .input('longitude', sql.Float, node.longitude)
            .input('address', sql.NVarChar, node.address || null)
            .input('is_bus_stop', sql.Int, node.is_bus_stop ? 1 : 0)
            .query('INSERT INTO Node (id, latitude, longitude, address, is_bus_stop) VALUES (@id, @latitude, @longitude, @address, @is_bus_stop)');
    }
}

// Helper: Insert route if not exists
async function insertRoute(pool, route) {
    const check = await pool.request()
        .input('id', sql.VarChar, route.id)
        .query('SELECT id FROM Route WHERE id = @id');
    if (check.recordset.length === 0) {
        await pool.request()
            .input('id', sql.VarChar, route.id)
            .input('number', sql.VarChar, route.number)
            .input('name', sql.NVarChar, route.name)
            .input('direction', sql.VarChar, route.direction)
            .input('distance', sql.VarChar, route.distance || null)
            .input('ticket_price', sql.VarChar, route.ticket_price || null)
            .query('INSERT INTO Route (id, number, name, direction, distance, ticket_price) VALUES (@id, @number, @name, @direction, @distance, @ticket_price)');
    }
}

// Helper: Insert route_node
async function insertRouteNode(pool, route_id, node_id, order_in_route) {
    await pool.request()
        .input('route_id', sql.VarChar, route_id)
        .input('node_id', sql.VarChar, node_id)
        .input('order_in_route', sql.Int, order_in_route)
        .query('INSERT INTO Route_node (route_id, node_id, order_in_route) VALUES (@route_id, @node_id, @order_in_route)');
}

// Helper: Generate id like N00001, N00002, ...
function generateNodeId(counter) {
    return 'N' + counter.toString().padStart(5, '0');
}

// Haversine distance (km)
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

async function updateBusStops(pool, busStops) {
  for (const stop of busStops) {
    // Tìm node gần nhất trong DB
    const result = await pool.request().query(`
      SELECT TOP 1 id, latitude, longitude
      FROM Node
      ORDER BY
        POWER(latitude - ${stop.latitude}, 2) + POWER(longitude - ${stop.longitude}, 2)
    `);
    if (result.recordset.length > 0) {
      const node = result.recordset[0];
      const distance = haversine(stop.latitude, stop.longitude, node.latitude, node.longitude);
      if (distance < 0.03) { // 30m
        await pool.request()
          .input('id', node.id)
          .query('UPDATE Node SET is_bus_stop = 1 WHERE id = @id');
      }
    }
  }
}

// Helper: Check if a Route_node already exists in DB
async function routeNodeExists(pool, route_id, node_id) {
    const check = await pool.request()
        .input('route_id', sql.VarChar, route_id)
        .input('node_id', sql.VarChar, node_id)
        .query('SELECT 1 FROM Route_node WHERE route_id = @route_id AND node_id = @node_id');
    return check.recordset.length > 0;
}

async function main() {
    const routeFiles = [
        '01.geojson',
        '02.geojson',
        '03A.geojson',
        '04.geojson',
        '05.geojson',
        '06A.geojson',
        '06B.geojson',
        '08A.geojson',
        '24.geojson',
        '142.geojson',
        '28.geojson',
        '38.geojson',
        '51.geojson'
    ];

    const pool = await connectDB();

    let routeCounter = 1;
    let nodeCounter = 1;
    let busStopCounter = 1;

    // Thêm map để kiểm tra trùng tuyến
    const routeMap = new Map(); // key: unique route key, value: routeId

    // Maps to avoid duplicates across all files
    const nodeMap = new Map(); // key: lng,lat, value: nodeId
    const busStopMap = new Map(); // key: lng,lat, value: nodeId

    // Helper to add node if not exists (shared for all files)
    async function addNode(lng, lat, isBusStop) {
        const key = `${lng.toFixed(7)},${lat.toFixed(7)}`;
        if (isBusStop) {
            if (!busStopMap.has(key)) {
                const id = 'B' + busStopCounter.toString().padStart(6, '0');
                await insertNode(pool, {
                    id,
                    latitude: lat,
                    longitude: lng,
                    address: 'Bến xe buýt',
                    is_bus_stop: 1
                });
                busStopMap.set(key, id);
                busStopCounter++;
            }
            return busStopMap.get(key);
        } else {
            if (!nodeMap.has(key)) {
                const id = 'N' + nodeCounter.toString().padStart(6, '0');
                await insertNode(pool, {
                    id,
                    latitude: lat,
                    longitude: lng,
                    address: '',
                    is_bus_stop: 0
                });
                nodeMap.set(key, id);
                nodeCounter++;
            }
            return nodeMap.get(key);
        }
    }

    for (const file of routeFiles) {
        const geojson = JSON.parse(fs.readFileSync(path.join(__dirname, file), 'utf8'));

        // Skip file if any feature is MultiLineString
        const hasMultiLineString = geojson.features.some(
            feature => feature.geometry && feature.geometry.type === 'MultiLineString'
        );
        if (hasMultiLineString) {
            console.log(`Skipping file ${file} because it contains MultiLineString.`);
            continue;
        }

        // 1. Parse all bus stops (Point features)
        const busStops = [];
        for (const feature of geojson.features) {
            if (feature.geometry && feature.geometry.type === 'Point') {
                const rels = feature.properties['@relations'] || [];
                for (const rel of rels) {
                    busStops.push({
                        lng: feature.geometry.coordinates[0],
                        lat: feature.geometry.coordinates[1],
                        rel: rel.rel // route relation id
                    });
                }
            }
        }

        // 2. Parse all LineString (route) features in this file
        for (const feature of geojson.features) {
            if (
                feature.geometry &&
                feature.geometry.type === 'LineString' &&
                feature.properties &&
                feature.properties.ref // only process if ref exists
            ) {
                // Tạo key duy nhất cho tuyến (có thể dùng @id hoặc ref+name+direction)
                const routeProps = feature.properties;
                const uniqueKey = routeProps['@id'] || (routeProps.ref + '-' + (routeProps.name || '') + '-' + ((routeCounter % 2 === 1) ? 'forward' : 'backward'));

                let routeId;
                if (routeMap.has(uniqueKey)) {
                    routeId = routeMap.get(uniqueKey);
                } else {
                    routeId = 'R' + routeCounter.toString().padStart(3, '0');
                    const direction = (routeCounter % 2 === 1) ? 'forward' : 'backward';
                    await insertRoute(pool, {
                        id: routeId,
                        number: routeProps.ref || '',
                        name: routeProps.name || '',
                        direction: direction,
                        distance: '',
                        ticket_price: routeProps.charge || ''
                    });
                    routeMap.set(uniqueKey, routeId);
                    routeCounter++;
                }

                // Track inserted (node_id, order_in_route) for this route to avoid duplicates
                const insertedRouteNodes = new Set();

                // 2.1. Add all nodes in LineString to Node table (no duplicates)
                const lineNodes = [];
                for (const coord of feature.geometry.coordinates) {
                    const nodeId = await addNode(coord[0], coord[1], 0);
                    lineNodes.push({ nodeId, lng: coord[0], lat: coord[1] });
                }

                // 2.2. Find bus stops belonging to this route
                const relId = routeProps['@id'] ? routeProps['@id'].split('/')[1] : null;
                const stopsInRoute = busStops.filter(bs => bs.rel == relId);
                // Insert all bus stops as Node (if not already)
                for (const stop of stopsInRoute) {
                    await addNode(stop.lng, stop.lat, 1);
                }

                // 2.3. Build ordered list for Route_node (nodes only, no extra bus stop nodes yet)
                const finalNodes = [];
                const seen = new Set();
                for (const node of lineNodes) {
                    if (!seen.has(node.nodeId)) {
                        finalNodes.push(node.nodeId);
                        seen.add(node.nodeId);
                    }
                }

                // 2.4. Insert into Route_node for all nodes (avoid duplicates)
                for (let i = 0; i < finalNodes.length; i++) {
                    const nodeId = finalNodes[i];
                    const key = `${routeId}-${nodeId}`;
                    if (!insertedRouteNodes.has(key)) {
                        // Check in DB as well
                        if (!(await routeNodeExists(pool, routeId, nodeId))) {
                            await insertRouteNode(pool, routeId, nodeId, i + 1);
                        }
                        insertedRouteNodes.add(key);
                    }
                }

                // 2.5. For each bus stop, find nearest node in lineNodes and insert bus stop node into Route_node with same order_in_route
                for (const stop of stopsInRoute) {
                    const busStopNodeId = await addNode(stop.lng, stop.lat, 1);
                    let minDist = Infinity;
                    let nearestOrder = null;
                    for (let i = 0; i < lineNodes.length; i++) {
                        const node = lineNodes[i];
                        const dist = turf.distance(
                            [node.lng, node.lat],
                            [stop.lng, stop.lat],
                            { units: 'meters' }
                        );
                        if (dist < minDist) {
                            minDist = dist;
                            nearestOrder = i + 1; // order_in_route is i+1
                        }
                    }
                    if (nearestOrder !== null) {
                        const key = `${routeId}-${busStopNodeId}`;
                        if (!insertedRouteNodes.has(key)) {
                            if (!(await routeNodeExists(pool, routeId, busStopNodeId))) {
                                await insertRouteNode(pool, routeId, busStopNodeId, nearestOrder);
                            }
                            insertedRouteNodes.add(key);
                        }
                    }
                }

                routeCounter++;
            }
        }
    }

    await pool.close();
    console.log('Import completed!');
}

main().catch(console.error);