from flask import Flask, render_template, redirect, jsonify, request, url_for, flash, send_from_directory, send_file
from flask_login import UserMixin, login_user, LoginManager, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import requests
import secrets
import string
import base64
import random
import json
import io

# Inizializza app e servizi
app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] =  "sqlite:///gestionale.db"
app.config["SECRET_KEY"] = secrets.token_hex()
db = SQLAlchemy(app)

login_manager = LoginManager(app)
login_manager.login_view = "login"

# Classi Database
class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(128), nullable=False, unique=True)
    password = db.Column(db.String(128), nullable=False)
    livello = db.Column(db.JSON, nullable=False)

with app.app_context():
    #db.create_all()

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/login", methods=["GET", "POST"])
def login():
    if len(User.query.all()) == 0:
        return jsonify({"status": "success", "response": "no_user"})
    if request.method == "POST":
        utente = User.query.filter_by(username=request.form["username"]).first()
        if utente:
            if check_password_hash(utente.password, request.form["passwd"]):
                login_user(utente)
                return jsonify({"status": "success", "response": "success"})
            else:
                return jsonify({"status": "success", "response": "invalid"})
        else:
            return jsonify({"status": "success", "response": "not_found"})
    return jsonify({"status": "success", "response": "error"})

@app.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("index"))


@app.errorhandler(404)
def page_not_found(e):
    return return jsonify({"status": "error", "response": "not_found"}), 404
'''
@app.errorhandler(405)
def internal_error(e):
    return render_template("errore_generico.html"), 405

@app.errorhandler(500)
def internal_error(e):
    return render_template("errore_generico.html"), 500
'''
if __name__ == "__main__":
    app.run(port=8000, host="0.0.0.0")
