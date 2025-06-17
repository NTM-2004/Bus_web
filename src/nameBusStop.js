const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { connectDB, sql } = require('./config/db');

// Helper to round coordinates for matching
function roundCoord(coord) {
    return Number(coord).toFixed(7);
}

async function main() {
    const pool = await connectDB();

    // Load all bus stop features from BusStop.geojson
    const geojsonPath = path.join(__dirname, 'BusStop.geojson');
    const geojson = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));

    let updated = 0, notFound = 0;

    for (const feature of geojson.features) {
        if (
            feature.geometry &&
            feature.geometry.type === 'Point' &&
            feature.properties &&
            feature.properties.name
        ) {
            const [lng, lat] = feature.geometry.coordinates;
            const name = feature.properties.name;

            // Find the closest node in the database (within a small threshold)
            const result = await pool.request()
                .input('lat', sql.Float, lat)
                .input('lng', sql.Float, lng)
                .query(`
                    SELECT TOP 1 id, latitude, longitude
                    FROM Node
                    WHERE is_bus_stop = 1
                    ORDER BY POWER(latitude - @lat, 2) + POWER(longitude - @lng, 2)
                `);

            if (result.recordset.length > 0) {
                const node = result.recordset[0];
                // Only update if the node is very close (e.g., within 30 meters)
                const dist = Math.sqrt(
                    Math.pow(node.latitude - lat, 2) + Math.pow(node.longitude - lng, 2)
                );
                if (dist < 0.0003) { // ~30 meters
                    await pool.request()
                        .input('id', node.id)
                        .input('address', sql.NVarChar, name)
                        .query('UPDATE Node SET address = @address WHERE id = @id');
                    updated++;
                } else {
                    notFound++;
                }
            } else {
                notFound++;
            }
        }
    }

    await pool.close();
    console.log(`Updated ${updated} bus stop names. Not matched: ${notFound}`);
}

main().catch(console.error);