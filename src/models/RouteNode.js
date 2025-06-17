const { sql } = require("../config/db");

class RouteNode {
  constructor({ route_id, node_id, order_in_route }) {
    this.route_id = route_id;
    this.node_id = node_id;
    this.order_in_route = order_in_route;
  }

  static async findByRoute(pool, route_id) {
    const result = await pool.request()
      .input('route_id', sql.VarChar, route_id)
      .query(`
        SELECT route_id, node_id, order_in_route
        FROM Route_node
        WHERE route_id = @route_id
        ORDER BY order_in_route ASC
      `);
    return result.recordset.map(row => new RouteNode(row));
  }

  static async findByNode(pool, node_id) {
    const result = await pool.request()
      .input('node_id', sql.VarChar, node_id)
      .query(`
        SELECT route_id, node_id, order_in_route
        FROM Route_node
        WHERE node_id = @node_id
        ORDER BY order_in_route ASC
      `);
    return result.recordset.map(row => new RouteNode(row));
  }

  async save(pool) {
    await pool.request()
      .input('route_id', sql.VarChar, this.route_id)
      .input('node_id', sql.VarChar, this.node_id)
      .input('order_in_route', sql.Int, this.order_in_route)
      .query(`
        INSERT INTO Route_node (route_id, node_id, order_in_route)
        VALUES (@route_id, @node_id, @order_in_route)
      `);
  }
}

module.exports = RouteNode;