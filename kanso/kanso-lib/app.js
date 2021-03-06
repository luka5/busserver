/*
 * This file is part of busserver.

 * busserver is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * busserver is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.

 * You should have received a copy of the GNU General Public License
 * along with busserver.  If not, see <http://www.gnu.org/licenses/>.
 */

exports.views = {
    allByName: {
        map: function(doc) {
            emit(doc.district + " / " + doc.name, null);
        }
    },
    allByCoords: {
        map: function(doc) {
            emit([
                    doc.places[0].coordinates['longitude'],
                    doc.places[0].coordinates['latitude']],
                 {location: doc.district + " / " + doc.name});
        }
    }
};

/*
 [{['', '']}]
 */

exports.lists = {
    search: function (head, req) {
        if (! req.query.search) {
            return;
        }
        var row;
        var searches = req.query.search.toLowerCase().split(" ");
        var first = true;
        send('{"rows":[');
        var i = Number(req.query._limit);
        if(req.query._limit === undefined)
            i = undefined;
        while ((i > 0 || i === undefined) && (row = getRow())) {
            var hasMatch = true;
            for(var index in searches){
                var search = searches[index];
                if (row.key.toLowerCase().indexOf(search) === -1){
                    hasMatch = false;
                    break;
                }
            }
            if(hasMatch){
                if (! first) {
                    send(',');
                } else {
                    first = false;
                }
                send(JSON.stringify(row));
                if(i !== undefined)
                    i--;
            }
        }
        send(']}');
    },
    next: function (head, req) {
        var row;
        var coords = JSON.parse(req.query.coords);
        var range = 0.005;
        var choices = [];
        while ((row = getRow())) {
            var distance = Math.sqrt(Math.pow(row.key['longitude'] - coords[0], 2) +
                                     Math.pow(row.key['latitude'] - coords[1], 2));
            if (distance <= range)
                choices.push({id: row.id,
                              oldid: row.value.oldid,
                              location: row.value.location,
                              distance: distance});
        }
        choices.sort(function(b, a) {
            if (a.distance < b.distance)
                return -1;
            else if (a.distance === b.distance)
                return 0;
            else
                return 1;
        });
        send(JSON.stringify({total_rows: choices.length,
                             rows: choices}));
    }
};
