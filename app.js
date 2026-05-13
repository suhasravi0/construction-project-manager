class ConstructionApp {
    constructor() {
        this.data = {
            rfis: JSON.parse(localStorage.getItem('construx_rfis')) || [],
            submittals: JSON.parse(localStorage.getItem('construx_submittals')) || []
        };

        this.init();
    }

    init() {
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // RFI Events
        document.getElementById('add-rfi').addEventListener('click', () => this.openModal('rfi'));
        document.getElementById('rfi-form').addEventListener('submit', (e) => this.handleRfiSubmit(e));
        document.getElementById('export-rfi').addEventListener('click', () => this.exportCSV('rfis'));

        // Submittal Events
        document.getElementById('add-submittal').addEventListener('click', () => this.openModal('submittal'));
        document.getElementById('submittal-form').addEventListener('submit', (e) => this.handleSubmittalSubmit(e));
        document.getElementById('export-submittal').addEventListener('click', () => this.exportCSV('submittals'));

        // Close modals
        document.querySelectorAll('.close, .close-modal').forEach(el => {
            el.addEventListener('click', () => this.closeAllModals());
        });

        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) this.closeAllModals();
        });

        this.render();
    }

    switchTab(tabId) {
        document.querySelectorAll('.tab-btn').forEach(btn =>
            btn.classList.toggle('active', btn.dataset.tab === tabId)
        );
        document.querySelectorAll('.tab-content').forEach(content =>
            content.classList.toggle('active', content.id === `${tabId}-section`)
        );
    }

    openModal(type, id = null) {
        const modal = document.getElementById(`${type}-modal`);
        const form = document.getElementById(`${type}-form`);
        const title = document.getElementById(`${type}-modal-title`);

        modal.style.display = 'block';

        if (id) {
            title.textContent = `Edit ${type === 'rfi' ? 'RFI' : 'Submittal'}`;
            const item = this.data[type === 'rfi' ? 'rfis' : 'submittals'].find(i => i.id === id);

            Object.keys(item).forEach(key => {
                const input = form.querySelector(`[name="${key}"]`);
                if (input) input.value = item[key];
            });
        } else {
            title.textContent = `Create ${type === 'rfi' ? 'RFI' : 'Submittal'}`;
            form.reset();
            form.querySelector('[name="id"]').value = '';
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
    }

    saveData() {
        localStorage.setItem('construx_rfis', JSON.stringify(this.data.rfis));
        localStorage.setItem('construx_submittals', JSON.stringify(this.data.submittals));
        this.render();
    }

    handleRfiSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const entry = Object.fromEntries(formData.entries());

        if (entry.id) {
            const index = this.data.rfis.findIndex(i => i.id === entry.id);
            this.data.rfis[index] = entry;
        } else {
            entry.id = Date.now().toString();
            this.data.rfis.push(entry);
        }

        this.saveData();
        this.closeAllModals();
    }

    handleSubmittalSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const entry = Object.fromEntries(formData.entries());

        if (entry.id) {
            const index = this.data.submittals.findIndex(i => i.id === entry.id);
            this.data.submittals[index] = entry;
        } else {
            entry.id = Date.now().toString();
            this.data.submittals.push(entry);
        }

        this.saveData();
        this.closeAllModals();
    }

    deleteItem(type, id) {
        if (confirm('Are you sure you want to delete this item?')) {
            const key = type === 'rfi' ? 'rfis' : 'submittals';
            this.data[key] = this.data[key].filter(i => i.id !== id);
            this.saveData();
        }
    }

    getStatusClass(status) {
        const s = status.toLowerCase();
        if (['open', 'pending'].includes(s)) return 'status-open';
        if (['closed', 'approved'].includes(s)) return 'status-closed';
        if (['rejected', 'revise and resubmit'].includes(s)) return 'status-rejected';
        return '';
    }

    render() {
        this.renderTable('rfi', this.data.rfis);
        this.renderTable('submittal', this.data.submittals);
    }

    renderTable(type, items) {
        const tbody = document.querySelector(`#${type}-table tbody`);
        tbody.innerHTML = '';

        items.forEach(item => {
            const tr = document.createElement('tr');

            let columns = '';
            if (type === 'rfi') {
                columns = `
                    <td>${item.number}</td>
                    <td>${item.date}</td>
                    <td>${item.subject}</td>
                    <td>${item.submittedBy}</td>
                    <td>${item.assignedTo}</td>
                    <td><span class="badge ${this.getStatusClass(item.status)}">${item.status}</span></td>
                    <td>${item.dueDate}</td>
                `;
            } else {
                columns = `
                    <td>${item.number}</td>
                    <td>${item.date}</td>
                    <td>${item.specSection}</td>
                    <td>${item.description}</td>
                    <td>${item.submittedBy}</td>
                    <td><span class="badge ${this.getStatusClass(item.status)}">${item.status}</span></td>
                `;
            }

            tr.innerHTML = `
                ${columns}
                <td>
                    <button class="btn-edit" onclick="app.openModal('${type}', '${item.id}')">Edit</button>
                    <button class="btn-danger" onclick="app.deleteItem('${type}', '${item.id}')">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    exportCSV(key) {
        const items = this.data[key];
        if (items.length === 0) return alert('No data to export');

        const headers = Object.keys(items[0]).filter(k => k !== 'id');
        const rows = items.map(item =>
            headers.map(header => `"${(item[header] || '').toString().replace(/"/g, '""')}"`).join(',')
        );

        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${key}_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

const app = new ConstructionApp();
