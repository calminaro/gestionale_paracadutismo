// System Option

function system_optionForm() {
    return {
        formData: {
            nome_scuola: "",
            id_enac: "",
            nome_direttore: "",
            cognome_direttore: "",
            smtp_server: "",
            smtp_port: "",
            mail_indirizzo: "",
            mail_passwd: "",
        },
        formMessage: "",
            formLoading: false,
                loadData() {
                    fetch(`/system_option`)
                    .then(response => response.json())
                    .then(data => {
                        this.formData.nome_scuola = data.response.nome_scuola;
                        this.formData.id_enac = data.response.id_enac;
                        this.formData.nome_direttore = data.response.nome_direttore;
                        this.formData.cognome_direttore = data.response.cognome_direttore;
                        this.formData.smtp_server = data.response.smtp_server;
                        this.formData.smtp_port = data.response.smtp_port;
                        this.formData.mail_indirizzo = data.response.mail_indirizzo;
                        this.formData.mail_passwd = data.response.mail_passwd;
                    });
                },
                submitForm() {
                    this.formMessage = "";
                    this.formLoading = true;
                    if (window.confirm("Stai aggiornando le System Option.")) {
                        fetch("/system_option", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                              Accept: "application/json",
                            },
                            body: JSON.stringify(this.formData),
                        })
                        .then(response => {
                            if (!response.ok) {
                                throw new Error('Network response was not ok');
                            }
                            return response.json();
                        })
                    };
                    this.formLoading = false;
                },
    };
}

// Paracadutisti
function paracadutisti() {
    return {
        elenco_para: '',
        async init() {
            await this.refreshPara();
        },
        async refreshPara() {
            let response = await fetch("/paracadutisti");
            this.elenco_para = await response.json();
        }
    }
}

function paracadutistiForm() {
    return {
        formData: {
            para_id: "",
            nome: "",
            cognome: "",
            licenza: false,
            num_licenza: "",
            scad_licenza: "",
            dl: false,
            videoman: false,
            ip: false,
            scad_ip: "",
            ip_aff: false,
            ip_td: false,
            visita: "",
        },
        formMessage: "",
        formLoading: false,
        init() {
            this.$watch('formData.ip', value => {
                if (value) {
                    this.formData.dl = true;
                }
            });
        },
        loadData(id_para) {
            if (!id_para) {
                this.formData.para_id = "";
                this.formData.nome = "";
                this.formData.cognome = "";
            } else {
                fetch(`/paracadutisti/${id_para}`)
                .then(response => response.json())
                .then(data => {
                    this.formData.para_id = id_para;
                    this.formData.nome = data.response.nome;
                    this.formData.cognome = data.response.cognome;
                    if (data.response.licenza.numero == "") {
                        this.formData.licenza = false;
                        this.formData.num_licenza = "";
                        this.formData.scad_licenza = "";
                    } else {
                        this.formData.licenza = true;
                        this.formData.num_licenza = data.response.licenza.numero;
                        this.formData.scad_licenza = data.response.licenza.scadenza;
                    };
                    this.formData.dl = data.response.videoman;
                    this.formData.videoman = data.response.videoman;
                    if (data.response.licenza.ip == false) {
                        this.formData.ip = false;
                        this.formData.scad_ip = "";
                        this.formData.ip_aff = false;
                        this.formData.ip_td = false;
                    } else {
                        this.formData.ip = true;
                        this.formData.scad_ip = data.response.licenza.ip.scadenza;
                        this.formData.ip_aff = data.response.licenza.ip.aff;
                        this.formData.ip_td = data.response.licenza.ip.td;
                    };
                    this.formData.visita = data.response.visita;
                });
            }
        },
        submitForm() {
            this.formMessage = "";
            this.formLoading = true;
            fetch("/paracadutisti", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify(this.formData),
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then((data) => {
                if (data.response == "ok") {
                    document.getElementById("refresh_para").click();
                }
            })
            .finally(() => {
                this.formLoading = false;
            });
        },
    };
}

document.addEventListener('DOMContentLoaded', function () {
    const paraModal = document.getElementById('paraModal');

    if (paraModal) {
        paraModal.addEventListener('show.bs.modal', event => {
            const button = event.relatedTarget;
            const id_para = button.getAttribute('data-bs-paraid');

            const modalComponent = Alpine.$data(paraModal.querySelector('[x-data]'));

            if (modalComponent) {
                modalComponent.loadData(id_para);
            }
        });
    }
});


function paracadutistiDeleteForm() {
    return {
        formData: {
            para_id: "",
        },
        formMessage: "",
            formLoading: false,
                loadData(id_para) {
                    this.formData.para_id = id_para;
                },
                submitForm() {
                    this.formMessage = "";
                    this.formLoading = true;
                    if (window.confirm("ATTENZIONE: Stai eliminando un paracadutista, operazione NON reversibile!")) {
                        fetch("/paracadutisti", {
                            method: "DELETE",
                            headers: {
                                "Content-Type": "application/json",
                              Accept: "application/json",
                            },
                            body: JSON.stringify(this.formData),
                        })
                        .then(response => {
                            if (!response.ok) {
                                throw new Error('Network response was not ok');
                            }
                            return response.json();
                        })
                        .then((data) => {
                            if (data.response == "ok") {
                                document.getElementById("refresh_para").click();
                            }
                        })
                    };
                    this.formLoading = false;
                },
    };
}

document.addEventListener('DOMContentLoaded', function () {
    const paraDeleteModal = document.getElementById('paraDeleteModal');

    if (paraDeleteModal) {
        paraDeleteModal.addEventListener('show.bs.modal', event => {
            const button = event.relatedTarget;
            const id_para = button.getAttribute('data-bs-paraid');

            const modalComponent = Alpine.$data(paraDeleteModal.querySelector('[x-data]'));

            if (modalComponent) {
                modalComponent.loadData(id_para);
            }
        });
    }
});

// Piloti
function pilots() {
    return {
        elenco_piloti: '',
        async init() {
            await this.refreshPiloti();
        },
        async refreshPiloti() {
            let response = await fetch("/piloti");
            this.elenco_piloti = await response.json();
        }
    }
}

function pilotiForm() {
    return {
        formData: {
            pilota_id: "",
            nome: "",
            cognome: "",
            num_licenza: "",
            scad_licenza: "",
            visita: "",
        },
        formMessage: "",
            formLoading: false,
                loadData(id_pilota) {
                    if (!id_pilota) {
                        this.formData.pilota_id = "";
                        this.formData.nome = "";
                        this.formData.cognome = "";
                    } else {
                        fetch(`/pilota/${id_pilota}`)
                        .then(response => response.json())
                        .then(data => {
                            this.formData.pilota_id = id_pilota;
                            this.formData.nome = data.response.nome;
                            this.formData.cognome = data.response.cognome;
                            this.formData.num_licenza = data.response.licenza.numero;
                            this.formData.scad_licenza = data.response.licenza.scadenza;
                            this.formData.visita = data.response.visita;
                        });
                    }
                },
                submitForm() {
                    this.formMessage = "";
                    this.formLoading = true;
                    fetch("/piloti", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                          Accept: "application/json",
                        },
                        body: JSON.stringify(this.formData),
                    })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Network response was not ok');
                        }
                        return response.json();
                    })
                    .then((data) => {
                        if (data.response == "ok") {
                            document.getElementById("refresh_piloti").click();
                        }
                    })
                    .finally(() => {
                        this.formLoading = false;
                    });
                },
    };
}

document.addEventListener('DOMContentLoaded', function () {
    const pilotiModal = document.getElementById('pilotiModal');

    if (pilotiModal) {
        pilotiModal.addEventListener('show.bs.modal', event => {
            const button = event.relatedTarget;
            const id_pilota = button.getAttribute('data-bs-pilotaid');

            const modalComponent = Alpine.$data(pilotiModal.querySelector('[x-data]'));

            if (modalComponent) {
                modalComponent.loadData(id_pilota);
            }
        });
    }
});

function pilotiDeleteForm() {
    return {
        formData: {
            pilota_id: "",
        },
        formMessage: "",
            formLoading: false,
                loadData(id_pilota) {
                    this.formData.pilota_id = id_pilota;
                },
                submitForm() {
                    this.formMessage = "";
                    this.formLoading = true;
                    if (window.confirm("ATTENZIONE: Stai eliminando un pilota, operazione NON reversibile!")) {
                        fetch("/piloti", {
                            method: "DELETE",
                            headers: {
                                "Content-Type": "application/json",
                              Accept: "application/json",
                            },
                            body: JSON.stringify(this.formData),
                        })
                        .then(response => {
                            if (!response.ok) {
                                throw new Error('Network response was not ok');
                            }
                            return response.json();
                        })
                        .then((data) => {
                            if (data.response == "ok") {
                                document.getElementById("refresh_piloti").click();
                            }
                        })
                    };
                    this.formLoading = false;
                },
    };
}

document.addEventListener('DOMContentLoaded', function () {
    const pilotiDeleteModal = document.getElementById('pilotiDeleteModal');

    if (pilotiDeleteModal) {
        pilotiDeleteModal.addEventListener('show.bs.modal', event => {
            const button = event.relatedTarget;
            const id_pilota = button.getAttribute('data-bs-pilotaid');

            const modalComponent = Alpine.$data(pilotiDeleteModal.querySelector('[x-data]'));

            if (modalComponent) {
                modalComponent.loadData(id_pilota);
            }
        });
    }
});

// Aerei
function planes() {
    return {
        elenco_aerei: '',
        async init() {
            await this.refreshAerei();
        },
        async refreshAerei() {
            let response = await fetch("/aerei");
            this.elenco_aerei = await response.json();
        }
    }
}

function aereiForm() {
    return {
        formData: {
            aereo_id: "",
            nome: "",
            posti: 0,
        },
        formMessage: "",
            formLoading: false,
                loadData(id_aereo) {
                    if (!id_aereo) {
                        this.formData.aereo_id = "";
                        this.formData.nome = "";
                        this.formData.posti = 0;
                    } else {
                        fetch(`/aereo/${id_aereo}`)
                        .then(response => response.json())
                        .then(data => {
                            this.formData.aereo_id = id_aereo;
                            this.formData.nome = data.response.nome;
                            this.formData.posti = data.response.posti;
                        });
                    }
                },
                submitForm() {
                    this.formMessage = "";
                    this.formLoading = true;
                    fetch("/aerei", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                          Accept: "application/json",
                        },
                        body: JSON.stringify(this.formData),
                    })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Network response was not ok');
                        }
                        return response.json();
                    })
                    .then((data) => {
                        if (data.response == "ok") {
                            document.getElementById("refresh_aerei").click();
                        }
                    })
                    .finally(() => {
                        this.formLoading = false;
                    });
                },
    };
}

document.addEventListener('DOMContentLoaded', function () {
    const aereiModal = document.getElementById('aereiModal');

    if (aereiModal) {
        aereiModal.addEventListener('show.bs.modal', event => {
            const button = event.relatedTarget;
            const id_aereo = button.getAttribute('data-bs-aereoid');

            const modalComponent = Alpine.$data(aereiModal.querySelector('[x-data]'));

            if (modalComponent) {
                modalComponent.loadData(id_aereo);
            }
        });
    }
});

function aereiDeleteForm() {
    return {
        formData: {
            aereo_id: "",
        },
        formMessage: "",
            formLoading: false,
                loadData(id_aereo) {
                    this.formData.aereo_id = id_aereo;
                },
                submitForm() {
                    this.formMessage = "";
                    this.formLoading = true;
                    if (window.confirm("ATTENZIONE: Stai eliminando un aereo, operazione NON reversibile!")) {
                        fetch("/aerei", {
                            method: "DELETE",
                            headers: {
                                "Content-Type": "application/json",
                              Accept: "application/json",
                            },
                            body: JSON.stringify(this.formData),
                        })
                        .then(response => {
                            if (!response.ok) {
                                throw new Error('Network response was not ok');
                            }
                            return response.json();
                        })
                        .then((data) => {
                            if (data.response == "ok") {
                                document.getElementById("refresh_aerei").click();
                            }
                        })
                    };
                    this.formLoading = false;
                },
    };
}

document.addEventListener('DOMContentLoaded', function () {
    const aereiDeleteModal = document.getElementById('aereiDeleteModal');

    if (aereiDeleteModal) {
        aereiDeleteModal.addEventListener('show.bs.modal', event => {
            const button = event.relatedTarget;
            const id_aereo = button.getAttribute('data-bs-aereoid');

            const modalComponent = Alpine.$data(aereiDeleteModal.querySelector('[x-data]'));

            if (modalComponent) {
                modalComponent.loadData(id_aereo);
            }
        });
    }
});

// Discipline
function styles() {
    return {
        elenco_discipline: '',
        async init() {
            await this.refreshDiscipline();
        },
        async refreshDiscipline() {
            let response = await fetch("/discipline");
            this.elenco_discipline = await response.json();
        }
    }
}

function disciplineForm() {
    return {
        formData: {
            style_id: "",
            nome: "",
            tipo: "orizzontale",
        },
        formMessage: "",
            formLoading: false,
                loadData(id_disciplina) {
                    if (!id_disciplina) {
                        this.formData.style_id = "";
                        this.formData.nome = "";
                        this.formData.posti = 0;
                    } else {
                        fetch(`/disciplina/${id_disciplina}`)
                        .then(response => response.json())
                        .then(data => {
                            this.formData.style_id = id_disciplina;
                            this.formData.nome = data.response.nome;
                            this.formData.tipo = data.response.tipo;
                        });
                    }
                },
                submitForm() {
                    this.formMessage = "";
                    this.formLoading = true;
                    fetch("/discipline", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                          Accept: "application/json",
                        },
                        body: JSON.stringify(this.formData),
                    })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Network response was not ok');
                        }
                        return response.json();
                    })
                    .then((data) => {
                        if (data.response == "ok") {
                            document.getElementById("refresh_discipline").click();
                        }
                    })
                    .finally(() => {
                        this.formLoading = false;
                    });
                },
    };
}

document.addEventListener('DOMContentLoaded', function () {
    const disciplineModal = document.getElementById('disciplineModal');

    if (disciplineModal) {
        disciplineModal.addEventListener('show.bs.modal', event => {
            const button = event.relatedTarget;
            const id_disciplina = button.getAttribute('data-bs-disciplinaid');

            const modalComponent = Alpine.$data(disciplineModal.querySelector('[x-data]'));

            if (modalComponent) {
                modalComponent.loadData(id_disciplina);
            }
        });
    }
});

function disciplineDeleteForm() {
    return {
        formData: {
            style_id: "",
        },
        formMessage: "",
            formLoading: false,
                loadData(id_disciplina) {
                    this.formData.style_id = id_disciplina;
                },
                submitForm() {
                    this.formMessage = "";
                    this.formLoading = true;
                    if (window.confirm("ATTENZIONE: Stai eliminando una disciplina, operazione NON reversibile!")) {
                        fetch("/discipline", {
                            method: "DELETE",
                            headers: {
                                "Content-Type": "application/json",
                              Accept: "application/json",
                            },
                            body: JSON.stringify(this.formData),
                        })
                        .then(response => {
                            if (!response.ok) {
                                throw new Error('Network response was not ok');
                            }
                            return response.json();
                        })
                        .then((data) => {
                            if (data.response == "ok") {
                                document.getElementById("refresh_discipline").click();
                            }
                        })
                    };
                    this.formLoading = false;
                },
    };
}

document.addEventListener('DOMContentLoaded', function () {
    const disciplineDeleteModal = document.getElementById('disciplineDeleteModal');

    if (disciplineDeleteModal) {
        disciplineDeleteModal.addEventListener('show.bs.modal', event => {
            const button = event.relatedTarget;
            const id_disciplina = button.getAttribute('data-bs-disciplinaid');

            const modalComponent = Alpine.$data(disciplineDeleteModal.querySelector('[x-data]'));

            if (modalComponent) {
                modalComponent.loadData(id_disciplina);
            }
        });
    }
});
