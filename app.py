from flask import Flask, render_template, redirect, jsonify, request, url_for, flash, send_from_directory, send_file
from flask_login import UserMixin, login_user, LoginManager, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm.attributes import flag_modified
from datetime import datetime
import configparser
import requests
import secrets
import string
import base64
import random
import json
import io

# Inizializza app e servizi
config = configparser.ConfigParser()
config.read("gestionale.conf")

app = Flask(__name__)

db_type = config.get("Database", "db_type")
if db_type == "sqlite":
    uri = f"{db_type}:///{config.get("Database", "db_name")}"
elif db_type == "postgresql":
    uri = f"{db_type}://{config.get("Database", "db_user")}:{config.get("Database", "db_password")}@{config.get("Database", "db_host")}:{config.get("Database", "db_port")}/{config.get("Database", "db_name")}"
else:
    app.logger.info("Errore nella configurazione del DB")
    exit()
app.logger.info("DB Configurato con successo")
app.config["SQLALCHEMY_DATABASE_URI"] =  uri
app.config["SECRET_KEY"] = secrets.token_hex()
db = SQLAlchemy(app)

login_manager = LoginManager(app)
login_manager.login_view = "index"

# Classi Database
class User(db.Model, UserMixin):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(128), nullable=False, unique=True)
    mail = db.Column(db.String(128), nullable=False)
    password = db.Column(db.String(128), nullable=False)
    gruppo = db.Column(db.Integer, nullable=False)
    api_key = db.Column(db.JSON, nullable=False)

class GruppiUser(db.Model):
    __tablename__ = "gruppi_user"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128), nullable=False, unique=True)
    permessi = db.Column(db.JSON, nullable=False)

class SysOption(db.Model):
    __tablename__ = "system_option"
    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(128), nullable=False, unique=True)
    value = db.Column(db.JSON, nullable=False)

class Paracadutista(db.Model):
    __tablename__ = "paracadutisti"
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(128), nullable=False)
    cognome = db.Column(db.String(128), nullable=False)
    licenza = db.Column(db.JSON, nullable=False)
    visita = db.Column(db.JSON, nullable=False)
    videoman = db.Column(db.JSON, nullable=False)

class Aereo(db.Model):
    __tablename__ = "aerei"
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(128), nullable=False)
    posti = db.Column(db.Integer, nullable=False)

class Pilota(db.Model):
    __tablename__ = "piloti"
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(128), nullable=False)
    cognome = db.Column(db.String(128), nullable=False)
    licenza = db.Column(db.JSON, nullable=False)
    visita = db.Column(db.JSON, nullable=False)

class Disciplina(db.Model):
    __tablename__ = "discipline"
    id = db.Column(db.Integer, primary_key=True)
    tipologia = db.Column(db.String(128), nullable=False)
    nome = db.Column(db.String(128), nullable=False)

class Giornata(db.Model):
    __tablename__ = "giornate"
    id = db.Column(db.Integer, primary_key=True)
    data = db.Column(db.String(128), nullable=False)
    ip_giornata = db.Column(db.Integer, nullable=False)
    pilota = db.Column(db.Integer, nullable=False)
    aereo = db.Column(db.Integer, nullable=False)

class Decollo(db.Model):
    __tablename__ = "decolli"
    id = db.Column(db.Integer, primary_key=True)
    ordine_decollo = db.Column(db.Integer, nullable=False)
    giornata = db.Column(db.Integer, nullable=False)
    pilota = db.Column(db.Integer, nullable=False)
    tandem = db.Column(db.JSON, nullable=False)
    aff = db.Column(db.JSON, nullable=False)
    formazioni = db.Column(db.JSON, nullable=False)
    paracadutisti = db.Column(db.JSON, nullable=False)
    carburante = db.Column(db.JSON, nullable=False)

with app.app_context():
    db.create_all()

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@app.route("/")
def index():
    if len(User.query.all()) == 0:
        return redirect(url_for("welcome"))
    if current_user.is_authenticated:
        return redirect(url_for("dashboard"))
    return render_template("index.html")

@app.route("/dashboard")
@login_required
def dashboard():
    return render_template("dashboard.html", page="dashboard")

@app.route("/manifest")
@login_required
def manifest():
    return render_template("manifest.html", page="manifest")

@app.route("/account")
@login_required
def account():
    return render_template("account.html")

@app.route("/impostazioni")
@login_required
def impostazioni():
    return render_template("impostazioni.html")

@app.route("/quaderno_tecnico")
@login_required
def quaderno_tecnico():
    return render_template("quaderno_tecnico.html")

@app.route("/sidebardata")
@login_required
def sidebardata():
    id_enac = SysOption.query.filter_by(key="id_enac").first().value
    return jsonify({"status": "success", "response": {"username": current_user.username, "id_enac": id_enac}})

@app.route("/manifest_oggi")
@login_required
def manifest_oggi():
    giornata = Giornata.query.filter_by(data=str(datetime.now().date())).first()
    if not giornata:
        giornata = False
    else:
        ip_giornata = Paracadutista.query.filter_by(id=int(giornata.ip_giornata)).first()
        pilota = Pilota.query.filter_by(id=int(giornata.pilota)).first()
        aereo = Aereo.query.filter_by(id=int(giornata.aereo)).first()
        tmp_decolli = Decollo.query.filter_by(giornata=int(giornata.id))
        decolli = []
        for i in tmp_decolli:
            tmp_decollo = {
                "id": i.id,
                "ordine_decollo": i.ordine_decollo,
                "pilota": {"id": i.pilota, "nome": Pilota.query.filter_by(id=int(i.pilota)).first().nome},
                "tandem": i.tandem,
                "aff": i.aff,
                "formazioni": i.formazioni,
                "paracadutisti": i.paracadutisti,
                "carburante": i.carburante
                }
            decolli.append(tmp_decollo)
        decolli.sort(key=lambda e: e["ordine_decollo"])
        giornata = {
            "id": giornata.id,
            "data": giornata.data,
            "ip_giornata": {"id": giornata.ip_giornata, "nome": f"{ip_giornata.nome} {ip_giornata.cognome}"},
            "pilota": {"id": giornata.ip_giornata, "nome": f"{pilota.nome} {pilota.cognome}"},
            "aereo": {"id": giornata.ip_giornata, "nome": aereo.nome},
            "decolli": decolli
            }
    return jsonify({"status": "success", "response": giornata})

@app.route("/manifest_storico")
@login_required
def manifest_storico():
    giornate = {"anni": []}
    tmp_giornate = Giornata.query.all()
    for i in tmp_giornate:
        ip_giornata = Paracadutista.query.filter_by(id=int(i.ip_giornata)).first()
        pilota = Pilota.query.filter_by(id=int(i.pilota)).first()
        aereo = Aereo.query.filter_by(id=int(i.aereo)).first()
        tmp_giornata = {
            "id": i.id,
            "data": i.data,
            "ip_giornata": {"id": i.ip_giornata, "nome": f"{ip_giornata.nome} {ip_giornata.cognome}"},
            "pilota": {"id": i.ip_giornata, "nome": f"{pilota.nome} {pilota.cognome}"},
            "aereo": {"id": i.ip_giornata, "nome": aereo.nome}
            }
        if i.data[0:4] in giornate["anni"]:
            giornate[i.data[0:4]].append(tmp_giornata)
        else:
            giornate["anni"].append(i.data[0:4])
            giornate[i.data[0:4]] = []
            giornate[i.data[0:4]].append(tmp_giornata)
    return jsonify({"status": "success", "response": giornate})

@app.route("/avvia_giornata", methods=["POST", "DELETE"])
@login_required
def avvia_giornata():
    if request.json["todo"] == "crea":
        giornata = Giornata.query.filter_by(data=request.json["data"]).first()
        if giornata:
            return jsonify({"status": "success", "response": "error"})
        giornata = Giornata(data=request.json["data"], ip_giornata=request.json["ip_giornata"], pilota=request.json["pilota"], aereo=request.json["aereo"])
        db.session.add(giornata)
        db.session.commit()
        return jsonify({"status": "success", "response": "ok"})
    if request.json["todo"] == "aggiorna":
        giornata = Giornata.query.filter_by(data=request.json["data"]).first()
        if not giornata:
            return jsonify({"status": "success", "response": "error"})
        giornata.ip_giornata = request.json["ip_giornata"]
        giornata.pilota = request.json["pilota"]
        giornata.aereo = request.json["aereo"]
        db.session.commit()
        return jsonify({"status": "success", "response": "ok"})
    return jsonify({"status": "success", "response": "error"})

@app.route("/edit_decollo", methods=["POST", "DELETE"])
@login_required
def edit_decollo():
    if request.json["todo"] == "crea":
        giornata = Giornata.query.filter_by(id=request.json["id_giornata"]).first()
        if not giornata:
            return jsonify({"status": "success", "response": "error"})
        tmp_decolli = Decollo.query.filter_by(giornata=giornata.id)
        tmp_ordine = 0
        for i in tmp_decolli:
            if i.ordine_decollo > tmp_ordine:
                tmp_ordine = i.ordine_decollo
        tmp_ordine += 1
        decollo = Decollo(giornata=giornata.id, ordine_decollo=tmp_ordine, pilota=giornata.pilota, tandem=[], aff=[], formazioni=[], paracadutisti=[], carburante=False)
        db.session.add(decollo)
        db.session.commit()
        return jsonify({"status": "success", "response": decollo.id})
    if request.json["todo"] == "aggiorna":
        giornata = Giornata.query.filter_by(data=request.json["data"]).first()
        if not giornata:
            return jsonify({"status": "success", "response": "error"})
        giornata.ip_giornata = request.json["ip_giornata"]
        giornata.pilota = request.json["pilota"]
        giornata.aereo = request.json["aereo"]
        db.session.commit()
        return jsonify({"status": "success", "response": "ok"})
    if request.json["todo"] == "crea_td":
        max_id = 0
        tmp_decollo = Decollo.query.filter_by(id=request.json["decollo_id"]).first()
        if tmp_decollo.tandem:
            max_id = max(i['id'] for i in tmp_decollo.tandem)
        tmp_pilota_td = Paracadutista.query.filter_by(id=request.json["pilota_td"]).first()
        tmp_videoman = False
        if request.json["video_ext"]:
            videoman = Paracadutista.query.filter_by(id=request.json["videoman"]).first()
            tmp_videoman = {"id": videoman.id, "nome": f"{videoman.nome} {videoman.cognome}"}
        tandem = {"id": max_id+1, "pilota_td": {"id": tmp_pilota_td.id, "nome": f"{tmp_pilota_td.nome} {tmp_pilota_td.cognome}"}, "passeggero": request.json["passeggero"], "video_polso": request.json["video_polso"], "video_ext": request.json["video_ext"], "foto": request.json["foto"], "videoman": tmp_videoman}
        tmp_decollo.tandem.append(tandem)
        flag_modified(tmp_decollo, "tandem")
        db.session.commit()
        return jsonify({"status": "success", "response": "ok"})
    if request.json["todo"] == "crea_aff":
        max_id = 0
        tmp_decollo = Decollo.query.filter_by(id=request.json["decollo_id"]).first()
        if tmp_decollo.aff:
            max_id = max(i['id'] for i in tmp_decollo.aff)
        tmp_primario = Paracadutista.query.filter_by(id=request.json["ip_primario"]).first()
        tmp_allievo = Paracadutista.query.filter_by(id=request.json["allievo"]).first()
        tmp_secondario = Paracadutista.query.filter_by(id=request.json["ip_secondario"]).first()
        aff = {"id": max_id+1, "ip_primario": {"id": tmp_primario.id, "nome": f"{tmp_primario.nome} {tmp_primario.cognome}"}, "allievo": {"id": tmp_allievo.id, "nome": f"{tmp_allievo.nome} {tmp_allievo.cognome}"}, "ip_secondario": {"id": tmp_secondario.id, "nome": f"{tmp_secondario.nome} {tmp_secondario.cognome}"}, "livello_aff": request.json["livello_aff"]}
        tmp_decollo.aff.append(aff)
        flag_modified(tmp_decollo, "aff")
        db.session.commit()
        return jsonify({"status": "success", "response": "ok"})
    if request.json["todo"] == "crea_para":
        max_id = 0
        tmp_decollo = Decollo.query.filter_by(id=request.json["decollo_id"]).first()
        if tmp_decollo.paracadutisti:
            max_id = max(i['id'] for i in tmp_decollo.paracadutisti)
        tmp_para = Paracadutista.query.filter_by(id=request.json["paracadutista"]).first()
        tmp_disciplina = Disciplina.query.filter_by(id=request.json["disciplina"]).first()
        paracadutista = {"id": max_id+1, "paracadutista": {"id": tmp_para.id, "nome": f"{tmp_para.nome} {tmp_para.cognome}"}, "disciplina": {"id": tmp_disciplina.id, "nome": tmp_disciplina.nome}, "dl": request.json["dl"]}
        tmp_decollo.paracadutisti.append(paracadutista)
        flag_modified(tmp_decollo, "paracadutisti")
        db.session.commit()
        return jsonify({"status": "success", "response": "ok"})
    return jsonify({"status": "success", "response": "error"})

@app.route("/system_option", methods=["GET", "POST"])
@login_required
def system_option():
    if request.method == "POST":
        SysOption.query.filter_by(key="nome_scuola")[0].value = request.json["nome_scuola"]
        SysOption.query.filter_by(key="id_enac")[0].value = request.json["id_enac"]
        SysOption.query.filter_by(key="nome_direttore")[0].value = request.json["nome_direttore"]
        SysOption.query.filter_by(key="cognome_direttore")[0].value = request.json["cognome_direttore"]
        SysOption.query.filter_by(key="smtp_server")[0].value = request.json["smtp_server"]
        SysOption.query.filter_by(key="smtp_port")[0].value = int(request.json["smtp_port"])
        SysOption.query.filter_by(key="mail_indirizzo")[0].value = request.json["mail_indirizzo"]
        SysOption.query.filter_by(key="mail_passwd")[0].value = request.json["mail_passwd"]
        db.session.commit()
    tmp_sysop = SysOption.query.all()
    elenco_sysop = {}
    for i in tmp_sysop:
        elenco_sysop[i.key] = i.value
    return jsonify({"status": "success", "response": elenco_sysop})

@app.route("/paracadutisti", methods=["GET", "POST", "DELETE"])
@login_required
def paracadutisti():
    if request.method == "DELETE":
        if request.json["para_id"] != "":
            paracadutista = Paracadutista.query.filter_by(id=int(request.json["para_id"]))[0]
            db.session.delete(paracadutista)
            db.session.commit()
            return jsonify({"status": "success", "response": "ok"})
    if request.method == "POST":
        if request.json["para_id"] != "":
            paracadutista = Paracadutista.query.filter_by(id=int(request.json["para_id"]))[0]
            ip = False
            if request.json["ip"]:
                ip = {
                    "scadenza": request.json["scad_ip"],
                    "aff": request.json["ip_aff"],
                    "td": request.json["ip_td"]
                    }

            licenza = {
                "numero": request.json["num_licenza"],
                "scadenza": request.json["scad_licenza"],
                "dl": request.json["dl"],
                "ip": ip
                }
            paracadutista.nome=request.json["nome"]
            paracadutista.cognome=request.json["cognome"]
            paracadutista.licenza=licenza
            paracadutista.visita=request.json["visita"]
            paracadutista.videoman=request.json["videoman"]
            db.session.commit()
            return jsonify({"status": "success", "response": "ok"})
        ip = False
        if request.json["ip"]:
            ip = {
                "scadenza": request.json["scad_ip"],
                "aff": request.json["ip_aff"],
                "td": request.json["ip_td"]
                }

        licenza = {
            "numero": request.json["num_licenza"],
            "scadenza": request.json["scad_licenza"],
            "dl": request.json["dl"],
            "ip": ip
            }
        paracadutista = Paracadutista(nome=request.json["nome"], cognome=request.json["cognome"], licenza=licenza, visita=request.json["visita"], videoman=request.json["videoman"])
        db.session.add(paracadutista)
        db.session.commit()
        return jsonify({"status": "success", "response": "ok"})
    tmp_para = Paracadutista.query.all()
    elenco_para = []
    for i in tmp_para:
        ip = False
        if i.licenza["ip"]:
            ip = {
                "scadenza": i.licenza["ip"]["scadenza"],
                "aff": i.licenza["ip"]["aff"],
                "td": i.licenza["ip"]["td"]
                }
        para = {
            "id": i.id,
            "nome": i.nome,
            "cognome": i.cognome,
            "licenza": {
                "numero": i.licenza["numero"],
                "scadenza": i.licenza["scadenza"],
                "dl": i.licenza["dl"],
                "ip": ip
                },
            "videoman": i.videoman,
            "visita": i.visita
            }
        elenco_para.append(para)
    return jsonify({"status": "success", "response": elenco_para})

@app.route("/paracadutisti/<para_id>")
@login_required
def paracadutista(para_id):
    i = Paracadutista.query.filter_by(id=int(para_id))[0]
    ip = False
    if i.licenza["ip"]:
        ip = {
            "scadenza": i.licenza["ip"]["scadenza"],
            "aff": i.licenza["ip"]["aff"],
            "td": i.licenza["ip"]["td"]
            }
    para = {
        "id": i.id,
        "nome": i.nome,
        "cognome": i.cognome,
        "licenza": {
            "numero": i.licenza["numero"],
            "scadenza": i.licenza["scadenza"],
            "dl": i.licenza["dl"],
            "ip": ip
            },
        "videoman": i.videoman,
        "visita": i.visita
        }
    return jsonify({"status": "success", "response": para})

@app.route("/piloti", methods=["GET", "POST", "DELETE"])
@login_required
def piloti():
    if request.method == "DELETE":
        if request.json["pilota_id"] != "":
            pilota = Pilota.query.filter_by(id=int(request.json["pilota_id"]))[0]
            db.session.delete(pilota)
            db.session.commit()
            return jsonify({"status": "success", "response": "ok"})
    if request.method == "POST":
        if request.json["pilota_id"] != "":
            pilota = Pilota.query.filter_by(id=int(request.json["pilota_id"]))[0]
            licenza = {
                "numero": request.json["num_licenza"],
                "scadenza": request.json["scad_licenza"]
                }
            pilota.nome=request.json["nome"]
            pilota.cognome=request.json["cognome"]
            pilota.licenza=licenza
            pilota.visita=request.json["visita"]
            db.session.commit()
            return jsonify({"status": "success", "response": "ok"})
        licenza = {
            "numero": request.json["num_licenza"],
            "scadenza": request.json["scad_licenza"]
            }
        pilota = Pilota(nome=request.json["nome"], cognome=request.json["cognome"], licenza=licenza, visita=request.json["visita"])
        db.session.add(pilota)
        db.session.commit()
        return jsonify({"status": "success", "response": "ok"})
    tmp_piloti = Pilota.query.all()
    elenco_piloti = []
    for i in tmp_piloti:
        pilota = {
            "id": i.id,
            "nome": i.nome,
            "cognome": i.cognome,
            "licenza": {
                "numero": i.licenza["numero"],
                "scadenza": i.licenza["scadenza"]
                },
            "visita": i.visita
            }
        elenco_piloti.append(pilota)
    return jsonify({"status": "success", "response": elenco_piloti})

@app.route("/pilota/<pilota_id>")
@login_required
def pilota(pilota_id):
    i = Pilota.query.filter_by(id=int(pilota_id))[0]
    pilota = {
        "id": i.id,
        "nome": i.nome,
        "cognome": i.cognome,
        "licenza": {
            "numero": i.licenza["numero"],
            "scadenza": i.licenza["scadenza"]
            },
        "visita": i.visita
        }
    return jsonify({"status": "success", "response": pilota})

@app.route("/aerei", methods=["GET", "POST", "DELETE"])
@login_required
def aerei():
    if request.method == "DELETE":
        if request.json["aereo_id"] != "":
            aereo = Aereo.query.filter_by(id=int(request.json["aereo_id"]))[0]
            db.session.delete(aereo)
            db.session.commit()
            return jsonify({"status": "success", "response": "ok"})
    if request.method == "POST":
        if request.json["aereo_id"] != "":
            aereo = Aereo.query.filter_by(id=int(request.json["aereo_id"]))[0]
            aereo.nome=request.json["nome"]
            aereo.posti=request.json["posti"]
            db.session.commit()
            return jsonify({"status": "success", "response": "ok"})
        aereo = Aereo(nome=request.json["nome"], posti=int(request.json["posti"]))
        db.session.add(aereo)
        db.session.commit()
        return jsonify({"status": "success", "response": "ok"})
    tmp_aerei = Aereo.query.all()
    elenco_aerei = []
    for i in tmp_aerei:
        aereo = {
            "id": i.id,
            "nome": i.nome,
            "posti": i.posti
            }
        elenco_aerei.append(aereo)
    return jsonify({"status": "success", "response": elenco_aerei})

@app.route("/aereo/<aereo_id>")
@login_required
def aereo(aereo_id):
    i = Aereo.query.filter_by(id=int(aereo_id))[0]
    aereo = {
        "id": i.id,
        "nome": i.nome,
        "posti": i.posti
        }
    return jsonify({"status": "success", "response": aereo})

@app.route("/discipline", methods=["GET", "POST", "DELETE"])
@login_required
def discipline():
    if request.method == "DELETE":
        if request.json["style_id"] != "":
            disciplina = Disciplina.query.filter_by(id=int(request.json["style_id"]))[0]
            db.session.delete(disciplina)
            db.session.commit()
            return jsonify({"status": "success", "response": "ok"})
    if request.method == "POST":
        if request.json["style_id"] != "":
            disciplina = Disciplina.query.filter_by(id=int(request.json["style_id"]))[0]
            disciplina.nome=request.json["nome"]
            disciplina.tipologia=request.json["tipo"]
            db.session.commit()
            return jsonify({"status": "success", "response": "ok"})
        disciplina = Disciplina(nome=request.json["nome"], tipologia=request.json["tipo"])
        db.session.add(disciplina)
        db.session.commit()
        return jsonify({"status": "success", "response": "ok"})
    tmp_discipline = Disciplina.query.all()
    elenco_discipline = []
    for i in tmp_discipline:
        disciplina = {
            "id": i.id,
            "nome": i.nome,
            "tipo": i.tipologia
            }
        elenco_discipline.append(disciplina)
    return jsonify({"status": "success", "response": elenco_discipline})

@app.route("/disciplina/<style_id>")
@login_required
def disciplina(style_id):
    i = Disciplina.query.filter_by(id=int(style_id))[0]
    disciplina = {
        "id": i.id,
        "nome": i.nome,
        "tipo": i.tipologia
        }
    return jsonify({"status": "success", "response": disciplina})

@app.route("/login", methods=["GET", "POST"])
def login():
    if len(User.query.all()) == 0:
        return jsonify({"status": "success", "response": "no_user"})
    if request.method == "POST":
        utente = User.query.filter_by(username=request.json["username"]).first()
        if utente:
            if check_password_hash(utente.password, request.json["passwd"]):
                password = generate_password_hash(request.json["passwd"])
                utente.password = password
                db.session.commit()
                login_user(utente)
                app.logger.info("L'utente %s ha fatto login", utente.username)
                return jsonify({"status": "success", "response": "success"})
            else:
                return jsonify({"status": "success", "response": "invalid"})
        else:
            return jsonify({"status": "success", "response": "invalid"})
    return jsonify({"status": "success", "response": "error"})

@app.route("/welcome", methods=["GET", "POST"])
def welcome():
    if len(User.query.all()) > 0:
        return redirect(url_for("index"))
    if request.method == "POST":
        if request.form["passwd"] != request.form["conferma_passwd"]:
            return render_template("welcome.html")
        password = generate_password_hash(request.form["passwd"])
        gruppo = GruppiUser(name="admin", permessi=[])
        db.session.add(gruppo)
        app.logger.info("Creato gruppo utente %s", "admin")
        db.session.commit()
        utente = User(username=request.form["username"], password=password, mail=request.form["mail"], gruppo=gruppo.id, api_key=[])
        db.session.add(utente)
        app.logger.info("Creato utente %s del gruppo %s", utente.username, "admin")
        db.session.add(SysOption(key="nome_scuola", value=request.form["nome_scuola"]))
        db.session.add(SysOption(key="id_enac", value=request.form["id_enac"]))
        db.session.add(SysOption(key="nome_direttore", value=request.form["nome_direttore"]))
        db.session.add(SysOption(key="cognome_direttore", value=request.form["cognome_direttore"]))
        db.session.add(SysOption(key="smtp_server", value="smtp.gmail.com"))
        db.session.add(SysOption(key="smtp_port", value=587))
        db.session.add(SysOption(key="mail_indirizzo", value="mail@esempio.it"))
        db.session.add(SysOption(key="mail_passwd", value="PASSWORD"))
        db.session.commit()
        return redirect(url_for("index"))
    return render_template("welcome.html")

@app.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("index"))


@app.errorhandler(404)
def page_not_found(e):
    return jsonify({"status": "error", "response": "not_found"}), 404
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
