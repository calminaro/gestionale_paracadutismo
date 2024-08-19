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
        }
    }
}

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
