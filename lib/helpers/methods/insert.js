'use strict';

var $npm = {
    ColumnSet: require('../columnSet'),
    formatting: require('../../formatting'),
    utils: require('../../utils')
};

/**
 * @method helpers.insert
 * @description
 * Generates an `INSERT` query for either one object or an array of objects.
 *
 * @param {Object|Object[]} data
 * An insert object with properties for insert values, or an array of such objects.
 *
 * When `data` is not a non-null object and not an array, it will throw {@link external:TypeError TypeError} = `Invalid parameter 'data' specified.`
 *
 * And if `data` is an array that contains an invalid insert object, the method will throw {@link external:Error Error} =
 * `Invalid insert object at index N.`
 *
 * @param {Array|helpers.Column|helpers.ColumnSet} [columns]
 * Set of columns to be inserted.
 *
 * It is optional when `data` is a single object, and required when `data` is an array of objects. When not specified for an array
 * of objects, the method will throw {@link external:TypeError TypeError} = `Parameter 'columns' is required when inserting multiple records.`
 *
 * When `columns` is not a {@link helpers.ColumnSet ColumnSet} object, a temporary {@link helpers.ColumnSet ColumnSet}
 * is created - from the value of `columns` (if it was specified), or from the value of `data` (if it is not an array).
 *
 * @param {String} [table]
 * Destination table name.
 *
 * It is normally a required parameter. But when `columns` is passed in as a {@link helpers.ColumnSet ColumnSet} object
 * with `table` set in it, that will be used when this parameter isn't specified. When neither is available, the method
 * will throw {@link external:Error Error} = `Table name is unknown.`
 *
 * @returns {String}
 * The resulting query string.
 *
 * @see {@link helpers.ColumnSet ColumnSet}
 *
 * @example
 *
 * var pgp = require('pg-promise')({
 *    capSQL: true // if you want all generated SQL capitalized
 * });
 * 
 * var insert = pgp.helpers.insert, ColumnSet = pgp.helpers.ColumnSet;
 *
 * var dataSingle = {val: 123, msg: 'hello'};
 * var dataMulti = [{val: 123, msg: 'hello'}, {val: 456, msg: 'world!'}];
 *
 * // Column details can be taken from the data object:
 * var query1 = insert(dataSingle, null, 'my-table');
 * //=> INSERT INTO "my-table"("val","msg") VALUES(123,'hello')
 *
 * // Column details are required for a multi-object insert:
 * var query2 = insert(dataMulti, ['val', 'msg'], 'my-table');
 * //=> INSERT INTO "my-table"("val","msg") VALUES(123,'hello'),(456,'world!')
 *
 * // Using column details and table name from ColumnSet:
 * var cs = new ColumnSet(['val', 'msg'], {table: 'my-table'});
 * var query3 = insert(dataMulti, cs);
 * //=> INSERT INTO "my-table"("val","msg") VALUES(123,'hello'),(456,'world!')
 *
 */
function insert(data, columns, table, capSQL) {

    if (!data || typeof data !== 'object') {
        throw new TypeError("Invalid parameter 'data' specified.");
    }

    if (columns instanceof $npm.ColumnSet) {
        if ($npm.utils.isNull(table)) {
            table = columns.table;
        }
    } else {
        if (Array.isArray(data) && $npm.utils.isNull(columns)) {
            throw new TypeError("Parameter 'columns' is required when inserting multiple records.");
        }
        columns = new $npm.ColumnSet(columns || data);
    }

    if (!table) {
        throw new Error("Table name is unknown.");
    }

    var query = "insert into $1~($2^) values";

    if (capSQL) {
        query = query.toUpperCase();
    }

    // TODO: Check if inserting 0 records is possible

    var format = $npm.formatting.as.format;
    query = format(query, [table, columns.names]);

    if (Array.isArray(data)) {
        return query + data.$map(function (d, index) {
                if (!d || typeof d !== 'object') {
                    throw new Error("Invalid insert object at index " + index + ".");
                }
                return '(' + format(columns.variables, columns.prepare(d)) + ')';
            }).join();
    }
    return query + '(' + format(columns.variables, columns.prepare(data)) + ')';
}

module.exports = insert;