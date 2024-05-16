from flask import Flask, request, url_for, redirect, jsonify, make_response
from pymongo import MongoClient
from bson.objectid import ObjectId
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from flask_cors import CORS
import os, uuid

app = Flask(__name__)
CORS(app)
app.config["JWT_SECRET_KEY"] = "your-secret-key"  # Change this to a random secret key
app.config['UPLOAD_FOLDER'] = '/path/to/upload'
jwt = JWTManager(app)

'''
REQUIREMENTS
X Implement the OAuth2 Security using JWT for the existing/new project 
    (I.e., For example, while logging in, generate a JWT token, and for the subsequent calls, verify the token to access the endpoint)

X Implement cookies to store the information on the client side

X Implement a file upload for your application

X Create a small user interface (UI/Frontend) to connect with the Flask application

X Connect with the NoSQL database instead of SQL 

X Must follow rules from the mid-term project like Error Codes, Error Handling, Validations etc.
'''


client = MongoClient("mongodb://root:example@localhost:27017/")
db = client.main
users = db.users

def get_user_by_id(user_id):
    return users.find_one({"_id": ObjectId(user_id)})

def insert_user(id, name, email, password):
    return users.insert_one({"id": id,"name": name, "email": email, "password": password}).inserted_id

def get_user_by_email(email):
    return users.find_one({"email": email})

def delete_user(email):
    return users.delete_one({"email": email}).deleted_count

def update_user_name(email, new_name):
    return users.update_one({"email": email}, {"$set": {"name": new_name}}).modified_count


@app.route('/error')
def handle_error():
    # Retrieve status_code and error message from request parameters
    status_code = request.args.get('status_code', 400)
    error_message = request.args.get('error', 'Unknown error')

    # Create and return the error response
    response = {'error': error_message}
    return make_response(jsonify(response), status_code)

@app.route('/auth/token', methods=['POST'])
def handle_token():
    email = request.json.get('email')
    user = get_user_by_email(email)
    if user:
        access_token = create_access_token(identity=str(user['_id']))
        response = jsonify(access_token=access_token)
        response.set_cookie('jwt', access_token, httponly=True)
        return response
    else:
        return redirect(url_for('handle_error', status_code=401, error='Invalid credentials'))

@app.route('/count', methods=['GET'])
@jwt_required()
def get_count():
    user_id = get_jwt_identity()
    user_data = users.find_one({"id": user_id})
    if user_data and 'count' in user_data:
        return jsonify(count=user_data['count'])
    return jsonify(count=0)  # Default to 0 if no count is found

@app.route('/increment', methods=['POST'])
@jwt_required()
def increment_count():
    user_id = get_jwt_identity()

    user = users.find_one({"id": user_id})

    if not user:
        return redirect(url_for('handle_error', status_code=400, error='"user not found'))

    if user and 'count' in user:
        new_count = user['count'] + 1
        users.update_one({"id": user_id}, {"$set": {"count": new_count}})
    else:
        # Initialize count if it doesn't exist
        new_count = 1
        users.update_one({"id": user_id}, {"$set": {"count": new_count}})

    return jsonify(count=new_count)

@app.route('/signin', methods=['POST'])
def signin():
    email = request.json.get('email', None)
    password = request.json.get('password', None)

    if not email or not password:
        return jsonify({"error": "Missing email or password"}), 400

    user = users.find_one({"email": email})
    id = user.get('id')
    if user and user['password'] == password:
        access_token = create_access_token(identity=id)
        return jsonify(access_token=access_token), 200
    else:
        return redirect(url_for('handle_error', status_code=400, error='Bad email or password"'))

@app.route('/user', methods=['GET', 'POST', 'DELETE', 'PUT'])
def handle_users():
    method = request.method
    if method == 'GET':
        user_id = get_jwt_identity()
        if not user_id:
            return redirect(url_for('handle_error', status_code=403, error='Authorization required'))

        result = get_user_by_id(user_id)
        if not result:
            return redirect(url_for('handle_error', status_code=404, error='User not found'))

        return jsonify(result)

    elif method == 'POST':
        data = request.get_json()
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')

        if not name or not email or not password:
            return redirect(url_for('handle_error', status_code=400, error='name, email, and nickname are required'))

        if get_user_by_email(email):
            return redirect(url_for('handle_error', status_code=400, error='email already exists'))

        id = f'{uuid.uuid4()}'

        insert_user(id, name, email, password)
        return jsonify({'users': {
            'id': id,
            'name': name,
            'email': email,
            'password': password,
            'access_token': id
        }})

    elif method == 'DELETE':
        data = request.get_json()
        email = data.get('email')
        if not email:
            return redirect(url_for('handle_error', status_code=400, error='email is required'))

        if not get_user_by_email(email):
            return redirect(url_for('handle_error', status_code=404, error='user not found'))

        delete_user(email)
        return jsonify({'user': {
            'email': email
        }})

    elif method == 'PUT':

        data = request.get_json()
        email = data.get('email')
        new_name = data.get('name')
        if not email or not new_name:
            return redirect(url_for('handle_error', status_code=400, error='email and new_name are required'))

        if not get_user_by_email(email):
            return redirect(url_for('handle_error', status_code=404, error='user not found'))

        update_user_name(email, new_name)

        return jsonify({
            'user': {
                'email': email,
                'name': new_name
            }
        })

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file:
        filename = secure_filename(file.filename)
        file_path = os.path.join("/Users/james/Desktop/projects/449/backend", filename)
        file.save(file_path)

        return jsonify({'message': 'File uploaded and extracted successfully', 'filename': filename}), 200


@app.route('/user/<int:user_id>')
def get_user(user_id):
    return redirect(url_for('handle_users', id=user_id))

if __name__ == '__main__':
    app.run()
