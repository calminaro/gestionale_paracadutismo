function sidebarData() {
    return {
        data: '',
        id_enac: localStorage.getItem("id_enac"),
        username: localStorage.getItem("username"),
        async init() {
            let response = await fetch("/sidebardata");
            this.data = await response.json();
            localStorage.setItem("id_enac", this.data.response.id_enac);
            localStorage.setItem("username", this.data.response.username);
        }
    }
}
