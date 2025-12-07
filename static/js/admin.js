// Admin Dashboard JavaScript
// This file contains all the functionality for the admin dashboard

function adminApp() {
  return {
    // User data (will be populated from server)
    user: {},
    
    // System metrics
    metrics: {
      total_users: 0,
      active_users: 0,
      total_nodes: 0,
      active_nodes: 0,
      total_storage_gb: 0,
      used_storage_gb: 0,
      total_files: 0,
      system_uptime: 0
    },

    // User management
    users: [],
    filteredUsers: [],
    selectedUser: null,
    userSearch: '',
    
    // Node management
    nodes: [],
    filteredNodes: [],
    nodeSearch: '',
    
    // System analytics
    analytics: {
      cpu_usage_percent: 0,
      memory_usage_percent: 0,
      network_io_mb: 0,
      disk_io_mb: 0,
      recent_logins: [],
      system_alerts: [],
      daily_active_users: 0,
      weekly_signups: 0,
      daily_logins: 0,
      total_storage_used_gb: 0,
      avg_storage_per_user: 0,
      total_files_stored: 0,
      top_storage_users: [],
      top_node_users: [],
      avg_response_time_ms: 0
    },

    // UI state
    showUserModal: false,
    showEditQuota: false,
    showSystemAlerts: false,
    message: '',
    messageType: 'info',
    loading: false,
    updatingQuota: false,
    newQuota: 0,

    // Charts
    userGrowthChart: null,
    resourceChart: null,

    // Initialize the application
    init(userData) {
      // Set user data
      this.user = userData || {};
      
      this.loadMetrics();
      this.loadUsers();
      this.loadNodes();
      this.loadAnalytics();
      this.initCharts();
      
      // Auto-refresh data every 30 seconds
      setInterval(() => {
        this.loadMetrics();
        this.loadAnalytics();
        this.updateCharts();
      }, 30000);
    },

    // Data Loading Methods
    async loadMetrics() {
      try {
        const response = await fetch('/api/admin/metrics');
        const data = await response.json();
        this.metrics = { ...this.metrics, ...data };
      } catch (error) {
        console.error('Failed to load metrics:', error);
      }
    },

    async loadUsers() {
      this.loading = true;
      try {
        const response = await fetch('/api/admin/users');
        const data = await response.json();
        this.users = data.users || [];
        this.filteredUsers = [...this.users];
      } catch (error) {
        console.error('Failed to load users:', error);
        this.showMessage('Failed to load users', 'error');
      }
      this.loading = false;
    },

    async loadNodes() {
      this.loading = true;
      try {
        const response = await fetch('/api/admin/nodes');
        const data = await response.json();
        this.nodes = data.nodes || [];
        this.filteredNodes = [...this.nodes];
      } catch (error) {
        console.error('Failed to load nodes:', error);
        this.showMessage('Failed to load nodes', 'error');
      }
      this.loading = false;
    },

    async loadAnalytics() {
      try {
        const response = await fetch('/api/admin/analytics');
        const data = await response.json();
        this.analytics = { ...this.analytics, ...data };
      } catch (error) {
        console.error('Failed to load analytics:', error);
      }
    },

    // User Management Methods
    filterUsers() {
      if (!this.userSearch) {
        this.filteredUsers = [...this.users];
      } else {
        const search = this.userSearch.toLowerCase();
        this.filteredUsers = this.users.filter(user => 
          user.username.toLowerCase().includes(search) ||
          user.email.toLowerCase().includes(search) ||
          (user.full_name && user.full_name.toLowerCase().includes(search))
        );
      }
    },

    refreshUsers() {
      this.loadUsers();
    },

    editUserQuota(user) {
      this.selectedUser = { ...user };
      this.newQuota = user.storage_quota_gb;
      this.showEditQuota = true;
      this.updatingQuota = false;
    },

    async updateUserQuota() {
      if (!this.selectedUser || !this.newQuota) return;
      
      this.updatingQuota = true;
      try {
        const response = await fetch(`/api/admin/users/${this.selectedUser.username}/quota`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quota_gb: parseFloat(this.newQuota) })
        });

        const result = await response.json();
        if (result.success) {
          this.showMessage('User quota updated successfully', 'success');
          this.showEditQuota = false;
          this.loadUsers();
        } else {
          this.showMessage(result.message || 'Failed to update user quota', 'error');
        }
      } catch (error) {
        console.error('Failed to update user quota:', error);
        this.showMessage('Failed to update user quota', 'error');
      }
      this.updatingQuota = false;
    },

    async toggleUserStatus(user) {
      if (!confirm(`Are you sure you want to ${user.is_active ? 'deactivate' : 'activate'} user "${user.username}"?`)) {
        return;
      }

      try {
        const response = await fetch(`/api/admin/users/${user.username}/toggle`, {
          method: 'POST'
        });

        const result = await response.json();
        if (result.success) {
          this.showMessage(result.message, 'success');
          this.loadUsers();
        } else {
          this.showMessage(result.message || 'Failed to update user status', 'error');
        }
      } catch (error) {
        console.error('Failed to toggle user status:', error);
        this.showMessage('Failed to update user status', 'error');
      }
    },

    filterNodes() {
      if (!this.nodeSearch) {
        this.filteredNodes = [...this.nodes];
      } else {
        const search = this.nodeSearch.toLowerCase();
        this.filteredNodes = this.nodes.filter(node => 
          node.username.toLowerCase().includes(search) ||
          node.node_id.toLowerCase().includes(search) ||
          node.ip.toLowerCase().includes(search)
        );
      }
    },

    async deleteNode(node) {
      if (!confirm(`Are you sure you want to delete node "${node.node_id}" belonging to user "${node.username}"? This action cannot be undone.`)) {
        return;
      }

      this.loading = true;
      try {
        const response = await fetch(`/api/admin/nodes/${node.username}/${node.node_id}`, {
          method: 'DELETE'
        });

        const result = await response.json();
        if (result.success) {
          this.showMessage('Node deleted successfully', 'success');
          this.loadNodes();
          this.loadMetrics();
        } else {
          this.showMessage(result.message || 'Failed to delete node', 'error');
        }
      } catch (error) {
        console.error('Failed to delete node:', error);
        this.showMessage('Failed to delete node', 'error');
      }
      this.loading = false;
    },

    viewNodeDetails(node) {
      // Create a detailed view of the node
      const details = `
Node Details:
===============
Node ID: ${node.node_id}
Username: ${node.username}
IP:Port: ${node.ip || 'N/A'}:${node.port || 'N/A'}
Status: ${node.status}
Uptime: ${this.formatUptime(node.uptime || 0)}
Storage Used: ${(node.storage?.used_storage_gb || 0).toFixed(2)} GB / ${(node.storage?.capacity_gb || 0)} GB
Files Stored: ${node.storage?.files_stored || 0}
Allocated Blocks: ${node.storage?.allocated_blocks || 0}
Total Blocks: ${node.storage?.total_blocks || 0}
Active Transfers: ${node.performance?.active_transfers || 0}
      `;
      
      alert(details);
    },

    selectUser(user) {
      this.selectedUser = { ...user };
      this.showUserModal = true;
    },

    // Chart Methods
    initCharts() {
      this.initUserGrowthChart();
      this.initResourceChart();
    },

    initUserGrowthChart() {
      const ctx = document.getElementById('userGrowthChart');
      if (!ctx) return;
      
      const chartCtx = ctx.getContext('2d');
      this.userGrowthChart = new Chart(chartCtx, {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [
            {
              label: 'Total Users',
              data: [120, 150, 180, 220, 280, this.metrics.total_users],
              borderColor: 'rgba(139, 92, 246, 1)',
              backgroundColor: 'rgba(139, 92, 246, 0.1)',
              tension: 0.4
            },
            {
              label: 'Active Users',
              data: [80, 110, 140, 170, 210, this.metrics.active_users],
              borderColor: 'rgba(34, 197, 94, 1)',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              tension: 0.4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: { color: '#fff' }
            }
          },
          scales: {
            y: {
              ticks: { color: '#fff' },
              grid: { color: 'rgba(255, 255, 255, 0.1)' }
            },
            x: {
              ticks: { color: '#fff' },
              grid: { color: 'rgba(255, 255, 255, 0.1)' }
            }
          }
        }
      });
    },

    initResourceChart() {
      const ctx = document.getElementById('resourceChart');
      if (!ctx) return;
      
      const resourceCtx = ctx.getContext('2d');
      this.resourceChart = new Chart(resourceCtx, {
        type: 'bar',
        data: {
          labels: ['Storage', 'CPU', 'Memory', 'Network'],
          datasets: [{
            label: 'Usage %',
            data: [
              (this.analytics.total_storage_used_gb / (this.metrics.total_users * 10)) * 100,
              this.analytics.cpu_usage_percent,
              this.analytics.memory_usage_percent,
              Math.random() * 60 + 20
            ],
            backgroundColor: [
              'rgba(139, 92, 246, 0.8)',
              'rgba(239, 68, 68, 0.8)',
              'rgba(16, 185, 129, 0.8)',
              'rgba(245, 158, 11, 0.8)'
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: { color: '#fff' }
            }
          },
          scales: {
            y: {
              ticks: { color: '#fff' },
              grid: { color: 'rgba(255, 255, 255, 0.1)' },
              max: 100
            },
            x: {
              ticks: { color: '#fff' },
              grid: { color: 'rgba(255, 255, 255, 0.1)' }
            }
          }
        }
      });
    },

    updateCharts() {
      if (this.userGrowthChart) {
        this.userGrowthChart.data.datasets[0].data[5] = this.metrics.total_users;
        this.userGrowthChart.data.datasets[1].data[5] = this.metrics.active_users;
        this.userGrowthChart.update();
      }
      
      if (this.resourceChart) {
        this.resourceChart.data.datasets[0].data = [
          (this.analytics.total_storage_used_gb / (this.metrics.total_users * 10)) * 100,
          this.analytics.cpu_usage_percent,
          this.analytics.memory_usage_percent,
          Math.random() * 60 + 20
        ];
        this.resourceChart.update();
      }
    },

    // UI Methods
    toggleSystemAlerts() {
      this.showSystemAlerts = !this.showSystemAlerts;
    },

    // Utility Methods
    formatUptime(seconds) {
      const days = Math.floor(seconds / 86400);
      const hours = Math.floor((seconds % 86400) / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${days}d ${hours}h ${minutes}m`;
    },

    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    },

    formatBytes(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    showMessage(message, type = 'info') {
      this.message = message;
      this.messageType = type;
      setTimeout(() => {
        this.message = '';
      }, 5000);
    },

    logout() {
      fetch('/api/auth/logout', { method: 'POST' })
        .then(() => window.location.href = '/');
    }
  };
}
