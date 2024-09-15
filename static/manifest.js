function data_oggi() {
    const today = new Date();
    let day = today.getDate();
    let month = today.getMonth() + 1;
    const year = today.getFullYear();
    if (day < 10) {
        day = '0' + day;
    }
    if (month < 10) {
        month = '0' + month;
    }
    const formattedDate = `${year}-${month}-${day}`;
    return formattedDate
}

function manifestOggi() {
    return {
        manifest_oggi: false,
        async init() {
            let response = await fetch("/manifest_oggi");
            this.manifest_oggi = await response.json();
        },
        async refreshManifest() {
            let response = await fetch("/manifest_oggi");
            this.manifest_oggi = await response.json();
        }
    }
}

function refresh_automatico() {
    const manifestElement = document.getElementById('manifest');
    const manifestComponent = Alpine.$data(manifestElement);

    if (manifestComponent) {
        manifestComponent.refreshManifest();
    }
}
setInterval(refresh_automatico, 20000);

function manifestStorico() {
    return {
        giornate_storico: [],
        async init() {
            let response = await fetch("/manifest_storico");
            this.giornate_storico = await response.json();
        }
    }
}

function avviaGiornataForm() {
    return {
        formData: {
            todo: "",
            data: "",
            ip_giornata: 1,
            pilota: 1,
            aereo: 1,
        },
        elenco_para: [],
        elenco_piloti: [],
        elenco_aerei: [],
        formMessage: "",
            formLoading: false,
                async loadPara() {
                    let tmp_elenco = []
                    let response = await fetch("/paracadutisti");
                    tmp_elenco = await response.json();
                    tmp_elenco = tmp_elenco.response;
                    for (let i in tmp_elenco) {
                        if (tmp_elenco[i].licenza.ip) {
                            this.elenco_para.push(tmp_elenco[i])
                        }
                    }

                },
                async loadPiloti() {
                    let response = await fetch("/piloti");
                    this.elenco_piloti = await response.json();
                    this.elenco_piloti = this.elenco_piloti.response;
                },
                async loadAerei() {
                    let response = await fetch("/aerei");
                    this.elenco_aerei = await response.json();
                    this.elenco_aerei = this.elenco_aerei.response;
                },
                loadData(data, todo) {
                    this.formData.todo = todo;
                    this.formData.data = data;
                    this.formData.ip_giornata = 1;
                    this.formData.pilota = 1;
                    this.formData.aereo = 1;
                },
                submitForm() {
                    this.formMessage = "";
                    this.formLoading = true;
                    fetch("/avvia_giornata", {
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
                            const manifestElement = document.getElementById('manifest');
                            const manifestComponent = Alpine.$data(manifestElement);

                            if (manifestComponent) {
                                manifestComponent.init();
                            }
                        }
                    })
                    .finally(() => {
                        this.formLoading = false;
                    });
                },

                async init() {
                    await this.loadPara();
                    await this.loadPiloti();
                    await this.loadAerei();
                }
    };
}

document.addEventListener('DOMContentLoaded', function () {
    const avviaGiornataBtn = document.getElementById('avviaGiornataBtn');
    const todayDate = data_oggi();

    avviaGiornataBtn.setAttribute('data-data', todayDate);

    const avviaGiornataModal = document.getElementById('avviaGiornataModal');

    if (avviaGiornataModal) {
        avviaGiornataModal.addEventListener('show.bs.modal', event => {
            const button = event.relatedTarget;
            const data = button.getAttribute('data-data');

            const modalComponent = Alpine.$data(avviaGiornataModal.querySelector('[x-data]'));

            const todo = button.getAttribute('data-bs-todo');

            if (modalComponent) {
                modalComponent.loadData(data, todo);
            }
        });
    }
});

function setDecollo(id_decollo) {
    const url = new URL(window.location);
    url.searchParams.set('decollo_id', id_decollo);
    window.location.href = url;

}

function getDecollo() {
    return {
        manifest_oggi: false,
        decollo_selezionato: false,
        async init() {
            const params = new URLSearchParams(window.location.search);
            const decolloId = params.get('decollo_id');

            let response = await fetch("/manifest_oggi");
            this.manifest_oggi = await response.json();
            for (let item of this.manifest_oggi.response.decolli) {
                if (item.id == decolloId) {
                    this.decollo_selezionato = item;
                }
            }
        },
        async refreshDecollo() {
            const params = new URLSearchParams(window.location.search);
            const decolloId = params.get('decollo_id');

            let response = await fetch("/manifest_oggi");
            this.manifest_oggi = await response.json();
            for (let item of this.manifest_oggi.response.decolli) {
                if (item.id == decolloId) {
                    this.decollo_selezionato = item;
                }
            }
        }
    }
}

function unsetDecollo(id_decollo) {
    const url = new URL(window.location);
    url.search = '';
    window.location.href = url;
}

function editDecollo() {
    return {
        async aggiungiDecollo(giornata_id) {
            console.log(giornata_id);
            fetch("/edit_decollo", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                  Accept: "application/json",
                },
                body: JSON.stringify({
                    "id_giornata": giornata_id,
                    "todo": "crea",
                }),
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then((data) => {
                if (data.response != "error") {

                    document.getElementById("refresh_manifest").click();
                    setTimeout(() => {
                        const dynamicButtonId = `edit_decollo-${data.response}`;
                        const button = document.getElementById(dynamicButtonId);
                        if (button) {
                            button.click();
                        } else {
                            console.error("Pulsante con ID dinamico non trovato:", dynamicButtonId);
                        }
                    }, 500);
                }
            })
        }
    }
}

function aggiungiTDForm() {
    return {
        formData: {
            todo: "",
            decollo_id: "",
            td_id: "",
            pilota_td: 1,
            passeggero: "",
            video_polso: false,
            video_ext: false,
            foto: false,
            videoman: 1,
        },
        elenco_piloti_td: [],
        elenco_videoman: [],
        formMessage: "",
            formLoading: false,
                init() {
                    this.$watch('formData.ip', value => {
                        if (value) {
                            this.formData.dl = true;
                        }
                    });
                },
                loadData(decolloid, tdid) {
                    if (!tdid) {
                        this.formData.todo = "crea_td";
                        this.formData.decollo_id = decolloid;
                        this.formData.td_id = "";
                        fetch(`/paracadutisti`)
                        .then(response => response.json())
                        .then(data => {
                            for (let i in data.response) {
                                if (data.response[i].licenza && data.response[i].licenza.ip && data.response[i].licenza.ip.td) {
                                    this.elenco_piloti_td.push(data.response[i]);
                                }
                            }
                            for (let i in data.response) {
                                if (data.response[i].videoman) {
                                    this.elenco_videoman.push(data.response[i]);
                                }
                            }
                        });
                    } else {
                        // Codice da eseguire se tdid è definito (non specificato nell'esempio)
                    }
                },
                submitForm() {
                    this.formMessage = "";
                    this.formLoading = true;
                    fetch("/edit_decollo", {
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
                            document.getElementById("refresh_decollo").click();
                        }
                    })
                    .finally(() => {
                        this.formLoading = false;
                    });
                },
    };
}

document.addEventListener('DOMContentLoaded', function () {
    const aggiungiTDModal = document.getElementById('aggiungiTDModal');

    if (aggiungiTDModal) {
        aggiungiTDModal.addEventListener('show.bs.modal', event => {
            const button = event.relatedTarget;
            const decolloid = button.getAttribute('data-decolloid');
            const tdid = button.getAttribute('data-tdid');

            const modalComponent = Alpine.$data(aggiungiTDModal.querySelector('[x-data]'));

            if (modalComponent) {
                modalComponent.loadData(decolloid, tdid);
            }
        });
    }
});


function aggiungiAFFForm() {
    return {
        formData: {
            todo: "",
            decollo_id: "",
            aff_id: "",
            livello_aff: 1,
            ip_primario: 1,
            allievo: 2,
            ip_secondario: 1,
        },
        elenco_ip_aff: [],
        elenco_allievi: [],
        livelli_aff: [1,2,3,4,5,6,7],
        formMessage: "",
            formLoading: false,
                loadData(decolloid, affid) {
                    if (!affid) {
                        this.formData.todo = "crea_aff";
                        this.formData.decollo_id = decolloid;
                        this.formData.aff_id = "";
                        fetch(`/paracadutisti`)
                        .then(response => response.json())
                        .then(data => {
                            for (let i in data.response) {
                                if (data.response[i].licenza && data.response[i].licenza.ip && data.response[i].licenza.ip.aff) {
                                    this.elenco_ip_aff.push(data.response[i]);
                                }
                            }
                            for (let i in data.response) {
                                if (data.response[i].licenza && data.response[i].licenza.numero == "") {
                                    this.elenco_allievi.push(data.response[i]);
                                }
                            }
                            if (this.elenco_allievi.length === 1) {
                                this.formData.allievo = this.elenco_allievi[0].id;
                            }
                        });
                    } else {
                        // Codice da eseguire se affid è definito (non specificato nell'esempio)
                    }
                },
                submitForm() {
                    this.formMessage = "";
                    this.formLoading = true;
                    fetch("/edit_decollo", {
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
                            document.getElementById("refresh_decollo").click();
                        }
                    })
                    .finally(() => {
                        this.formLoading = false;
                    });
                },
    };
}

document.addEventListener('DOMContentLoaded', function () {
    const aggiungiAFFModal = document.getElementById('aggiungiAFFModal');

    if (aggiungiAFFModal) {
        aggiungiAFFModal.addEventListener('show.bs.modal', event => {
            const button = event.relatedTarget;
            const decolloid = button.getAttribute('data-decolloid');
            const affid = button.getAttribute('data-affid');

            const modalComponent = Alpine.$data(aggiungiAFFModal.querySelector('[x-data]'));

            if (modalComponent) {
                modalComponent.loadData(decolloid, affid);
            }
        });
    }
});


function aggiungiParaForm() {
    return {
        formData: {
            todo: "",
            decollo_id: "",
            para_id: "",
            paracadutista: 1,
            dl: false,
            disciplina: 1,
        },
        elenco_para: [],
        elenco_discipline: [],
        formMessage: "",
        formLoading: false,
            init() {
                this.$watch('formData.dl', value => {
                    if (value) {
                        this.formData.dl = true;
                    }
                });
            },
            loadData(decolloid, paraid) {
                this.elenco_para = [];
                this.elenco_discipline = [];
                if (!paraid) {
                    this.formData.todo = "crea_para";
                    this.formData.decollo_id = decolloid;
                    this.formData.para_id = "";
                    this.formData.paracadutista = 1;
                    this.formData.dl = false;
                    this.formData.disciplina = 1;
                    fetch(`/paracadutisti`)
                    .then(response => response.json())
                    .then(data => {
                        for (let i in data.response) {
                            this.elenco_para.push(data.response[i]);
                        }
                    });
                    fetch(`/discipline`)
                    .then(response => response.json())
                    .then(data => {
                        for (let i in data.response) {
                            this.elenco_discipline.push(data.response[i]);
                        }
                    });
                } else {
                    // Codice da eseguire se paraid è definito (non specificato nell'esempio)
                }
            },
            submitForm() {
                this.formMessage = "";
                this.formLoading = true;
                fetch("/edit_decollo", {
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
                        document.getElementById("refresh_manifest").click();
                    }
                })
                .finally(() => {
                    this.formLoading = false;
                });
            },
    };
}

document.addEventListener('DOMContentLoaded', function () {
    const aggiungiParaModal = document.getElementById('aggiungiParaModal');

    if (aggiungiParaModal) {
        aggiungiParaModal.addEventListener('show.bs.modal', event => {
            const button = event.relatedTarget;
            const decolloid = button.getAttribute('data-decolloid');
            const paraid = button.getAttribute('data-paraid');

            const modalComponent = Alpine.$data(aggiungiParaModal.querySelector('[x-data]'));

            if (modalComponent) {
                modalComponent.loadData(decolloid, paraid);
            }
        });
    }
});
