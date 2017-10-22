from flask import Flask, request
import sqlite3
from flask import g
import sys
import json
from json import dumps
reload(sys)
sys.setdefaultencoding('utf-8')
from flask import session


app = Flask(__name__)

@app.route('/')
def index():
    return app.send_static_file('flask.html')   


DATABASE = "C:\\spatialite\\tuebingen_map.sqlite"


def connect_db():
    return sqlite3.connect(DATABASE)


@app.before_request
def before_request():
    g.db = connect_db()
    g.db.enable_load_extension(True)
    g.db.execute("SELECT load_extension('C:/spatialite/mod_spatialite')")
    print "succesful"
	

@app.route('/adress', methods=['GET'])
def adress():
	conn = g.db.cursor()
	c = request.args['c']
	
	query = conn.execute('''SELECT ST_X(geometry), ST_Y(geometry),node_id, streets FROM adressen_tuebingen
		WHERE streets LIKE (?) ''', ['%'+c+'%'])
	string_result = conn.fetchall()
	string_result = json.dumps(string_result)
	print string_result
	return string_result

@app.route('/long_lat', methods=['POST', 'GET'])
def long_lat():
	conn = g.db.cursor()
	x = request.form['x']
	y = request.form['y']

	distanz = request.args['distanz']
	cat = request.args['selectid']
	conn.execute('''SELECT ST_X(a.geometry), ST_Y(a.geometry), a.name, a.node_id
        FROM shops_tuebingen
        AS a 
        WHERE Contains(Buffer(GeomFromText('POINT(%s %s)', 3857), %s), a.geometry) AND name = '%s' AND a.ROWID 
        IN (SELECT ROWID FROM SpatialIndex WHERE f_table_name = 'shops_tuebingen' 
        AND search_frame = Buffer(GeomFromText('POINT(%s %s)', 3857), %s)) ''' % (x, y, distanz, cat, x, y, distanz))

	result_buffer = conn.fetchall()
	result_buffer = json.dumps(result_buffer)
	print result_buffer
	return result_buffer



@app.route('/draw', methods=['POST'])
def draw():
	conn = g.db.cursor()
	x = request.form['x']
	y = request.form['y']
	desc = request.args['desc']
	print x,y,desc
	conn.execute('''INSERT INTO adressen_tuebingen(node_id, streets, geometry) 
		VALUES (default, '%s', GeomFromText('POINT(%s %s)', 3857))''' % (desc, x, y))
	result = conn.fetchall()
	result = json.dumps(result)
	return result
	


@app.teardown_request
def teardown_request(exception):
    if hasattr(g, 'db'):
        g.db.close()








