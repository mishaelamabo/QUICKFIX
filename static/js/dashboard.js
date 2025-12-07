// Cloud Platform Dashboard JavaScript
// This file contains all the functionality for the dashboard page

function dashboardApp() {
  return {
    // User data (will be populated from server)
    user: {},
    
    // Application state
    nodes: [],
    stats: {
      total_nodes: 0,
      total_storage_gb: 0,
      used_storage_gb: 0,
      files_stored: 0,
      active_transfers: 0
    },
    
    // UI state
    showCreateNode: false,
    showFileUpload: false,
    showFileBrowser: false,
    showFileSharing: false,
    newNodeCapacity: 2,
    message: '',
    messageType: 'info',
    socket: null,
    selectedFile: null,
    uploadingFile: false,
    creatingNode: false,
    updatingProfile: false,
    userFiles: [],
    fileShares: [],
    
    // Profile form data
    profileForm: {
      full_name: '',
      email: '',
      phone: '',
      notifications: true,
      theme: 'dark',
      language: 'en'
    },

    // Initialize the application
    init(userData) {
      // Set user data
      this.user = userData || {};
      
      // Initialize profile form with user data
      this.profileForm = {
        full_name: this.user.full_name || '',
        email: this.user.email || '',
        phone: this.user.phone || '',
        notifications: this.user.profile_settings?.notifications ?? true,
        theme: this.user.profile_settings?.theme || 'dark',
        language: this.user.profile_settings?.language || 'en'
      };

      // Load initial data
      this.loadNodes();
      this.loadStats();
      this.loadFiles();
      this.loadShares();
      this.initSocket();

      // Auto-refresh stats every 30 seconds
      setInterval(() => {
        this.loadStats();
      }, 30000);
    },

    // API Methods
    async loadNodes() {
      try {
        const response = await fetch('/api/user/nodes');
        const data = await response.json();
        this.nodes = data.nodes || [];
      } catch (error) {
        console.error('Failed to load nodes:', error);
      }
    },

    async loadStats() {
      try {
        const response = await fetch('/api/user/storage/stats');
        const data = await response.json();
        this.stats = { ...this.stats, ...data };
      } catch (error) {
        console.error('Failed to load stats:', error);
      }
    },

    async loadFiles() {
      try {
        // Simulate file loading - in real app, this would come from API
        this.userFiles = [
          { id: 1, name: 'document.pdf', size: 1024000, date: '2024-01-15' },
          { id: 2, name: 'image.jpg', size: 512000, date: '2024-01-14' }
        ];
      } catch (error) {
        console.error('Failed to load files:', error);
      }
    },

    async loadShares() {
      try {
        const response = await fetch('/api/user/files/shares');
        const data = await response.json();
        this.fileShares = data.shares || [];
      } catch (error) {
        console.error('Failed to load shares:', error);
      }
    },

    // Node Management
    async createNode() {
      this.creatingNode = true;
      try {
        const response = await fetch('/api/user/nodes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ capacity_gb: this.newNodeCapacity })
        });

        const result = await response.json();

        if (result.success) {
          this.showMessage('Node created successfully!', 'success');
          this.showCreateNode = false;
          this.loadNodes();
        } else {
          this.showMessage('Failed to create node', 'error');
        }
      } catch (error) {
        this.showMessage('Failed to create node', 'error');
      }
      this.creatingNode = false;
    },

    // File Management
    handleFileSelect(event) {
      const file = event.target.files[0];
      if (file) {
        this.selectedFile = file.name;
      }
    },

    async uploadFile() {
      const fileInput = document.getElementById('fileInput');
      const file = fileInput.files[0];

      if (!file) {
        this.showMessage('Please select a file', 'error');
        return;
      }

      this.uploadingFile = true;
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('/api/user/files/upload', {
          method: 'POST',
          body: formData
        });

        const result = await response.json();

        if (result.success) {
          this.showMessage('File uploaded successfully!', 'success');
          this.showFileUpload = false;
          this.selectedFile = null;
          this.loadStats();
          this.loadFiles();
        } else {
          this.showMessage('Failed to upload file', 'error');
        }
      } catch (error) {
        this.showMessage('Failed to upload file', 'error');
      }
      this.uploadingFile = false;
    },

    // Profile Management
    async updateProfile() {
      this.updatingProfile = true;
      try {
        const response = await fetch('/api/user/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.profileForm)
        });

        const result = await response.json();

        if (result.success) {
          this.showMessage('Profile updated successfully!', 'success');
        } else {
          this.showMessage('Failed to update profile', 'error');
        }
      } catch (error) {
        this.showMessage('Failed to update profile', 'error');
      }
      this.updatingProfile = false;
    },

    // UI Methods
    updateTheme() {
      this.showMessage(`Theme changed to ${this.profileForm.theme}`, 'info');
      // Apply theme changes
      if (this.profileForm.theme === 'light') {
        document.body.classList.remove('gradient-bg');
        document.body.style.background = 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)';
        document.body.classList.add('text-gray-800');
      } else {
        document.body.classList.add('gradient-bg');
        document.body.style.background = '';
        document.body.classList.remove('text-gray-800');
      }
    },

    updateLanguage() {
      this.showMessage(`Language changed to ${this.profileForm.language}`, 'info');
      // Apply language changes (would need translation system)
    },

    // File Actions
    downloadFile(file) {
      this.showMessage(`Downloading ${file.name}...`, 'info');
    },

    shareFile(file) {
      this.showMessage(`Sharing ${file.name}...`, 'info');
    },

    removeShare(share) {
      this.showMessage('Share removed', 'success');
      this.loadShares();
    },

    // Node Actions
    manageNode(node) {
      this.showMessage(`Managing node: ${node.node_id}`, 'info');
    },

    viewNodeDetails(node) {
      this.showMessage(`Viewing details for: ${node.node_id}`, 'info');
    },

    // Socket.io
    initSocket() {
      this.socket = io();
      this.socket.on('connect', () => {
        console.log('Connected to server');
      });

      this.socket.on('stats_update', (data) => {
        this.stats = { ...this.stats, ...data };
      });
    },

    // Utility Methods
    formatUptime(seconds) {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
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
