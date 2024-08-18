function sidebarData() {
    return {
        data: '',
        async init() {
            let response = await fetch("/sidebardata");
            this.data = await response.json();
        }
    }
}
