// Data structure
let products = [];
let sales = [];

// DOM elements
const loadingOverlay = document.getElementById('loadingOverlay');
const toastContainer = document.getElementById('toastContainer');

// Load data from JSON files
async function loadData() {
    try {
        showLoading();
        console.log('Loading data from Electron...');
        
        // Use the Electron API to load data
        const data = await window.electronAPI.loadAllData();
        products = data.products || [];
        sales = data.sales || [];
        
        console.log('Data loaded - Products:', products.length, 'Sales:', sales.length);
        showToast('Data loaded successfully');
    } catch (error) {
        console.error('Error loading data:', error);
        showToast('Error loading data: ' + error.message, 'error');
        // Initialize empty arrays if loading fails
        products = [];
        sales = [];
    } finally {
        hideLoading();
    }
}

// Save data to JSON files
async function saveData() {
    try {
        showLoading();
        console.log('Saving data to Electron...');
        
        // Save products and sales to separate files using Electron API
        await window.electronAPI.writeFile('products.json', products);
        await window.electronAPI.writeFile('sales.json', sales);
        
        console.log('Data saved successfully');
    } catch (error) {
        console.error('Error saving data:', error);
        showToast('Error saving data: ' + error.message, 'error');
        throw error;
    } finally {
        hideLoading();
    }
}

// Debug function to check data path
async function debugDataPath() {
    try {
        const path = await window.electronAPI.getDataPath();
        console.log('Data storage path:', path);
        
        const productsExist = await window.electronAPI.fileExists('products.json');
        const salesExist = await window.electronAPI.fileExists('sales.json');
        
        console.log('Products file exists:', productsExist);
        console.log('Sales file exists:', salesExist);
        
        showToast(`Data path: ${path}`, 'info');
    } catch (error) {
        console.error('Debug error:', error);
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM loaded, initializing app...');
    
    
    await loadData();
    updateDashboard();
    renderInventoryTable();
    renderSalesTable();
    setupEventListeners();
    renderQuickSaleButtons();
    setupAutocomplete();
});

// Set up event listeners
function setupEventListeners() {
    // Save product
    document.getElementById('save-product').addEventListener('click', addProduct);
    
    // Update product
    document.getElementById('update-product').addEventListener('click', updateProduct);
    
    // Record sale
    document.getElementById('record-sale').addEventListener('click', recordSale);
    
    // Quick record sale
    document.getElementById('quick-record-sale').addEventListener('click', quickRecordSale);
    
    // Export data
    document.getElementById('export-data-btn').addEventListener('click', exportData);
    
    // Reset data
    document.getElementById('reset-data-btn').addEventListener('click', resetData);
    
    // Search functionality
    document.getElementById('search-product').addEventListener('input', filterProducts);
    
    // Calculate total amount when quantity or price changes
    document.getElementById('sell-quantity').addEventListener('input', calculateTotalAmount);
    document.getElementById('sell-price').addEventListener('input', calculateTotalAmount);
    
    // Calculate quick sale total amount
    document.getElementById('quick-sale-quantity').addEventListener('input', calculateQuickTotalAmount);
    document.getElementById('quick-sale-price').addEventListener('input', calculateQuickTotalAmount);
}

// Setup autocomplete for product search in sales form
function setupAutocomplete() {
    const productInput = document.getElementById('sell-product-name');
    
    productInput.addEventListener('input', function() {
        const val = this.value;
        closeAllLists();
        
        if (!val) return;
        
        const matchingProducts = products.filter(product => 
            product.name.toLowerCase().includes(val.toLowerCase()) && product.stock > 0
        );
        
        if (matchingProducts.length === 0) return;
        
        const list = document.createElement('div');
        list.setAttribute('id', 'autocomplete-list');
        list.setAttribute('class', 'autocomplete-items');
        this.parentNode.appendChild(list);
        
        matchingProducts.forEach(product => {
            const item = document.createElement('div');
            item.innerHTML = `
                <strong>${product.name}</strong>
                <small class="text-muted"> - Stock: ${product.stock} | Price: ₱${product.price.toFixed(2)}</small>
            `;
            item.innerHTML += `<input type='hidden' value='${product.name}'>`;
            
            item.addEventListener('click', function() {
                productInput.value = product.name;
                document.getElementById('sell-price').value = product.price;
                closeAllLists();
                calculateTotalAmount();
            });
            
            list.appendChild(item);
        });
    });
    
    function closeAllLists(elmnt) {
        const items = document.getElementsByClassName('autocomplete-items');
        for (let i = 0; i < items.length; i++) {
            if (elmnt !== items[i] && elmnt !== productInput) {
                items[i].parentNode.removeChild(items[i]);
            }
        }
    }
    
    document.addEventListener('click', function(e) {
        closeAllLists(e.target);
    });
}

// Show loading overlay
function showLoading() {
    loadingOverlay.style.display = 'flex';
}

// Hide loading overlay
function hideLoading() {
    loadingOverlay.style.display = 'none';
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon">
            ${type === 'success' ? '<i class="fas fa-check-circle"></i>' : 
              type === 'error' ? '<i class="fas fa-exclamation-circle"></i>' : 
              '<i class="fas fa-exclamation-triangle"></i>'}
        </div>
        <div class="toast-message">${message}</div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Update dashboard with current data
function updateDashboard() {
    // Update product count
    document.getElementById('total-products').textContent = products.length;
    
    // Calculate total sales
    const totalSales = sales.reduce((total, sale) => total + (sale.quantity * sale.price), 0);
    document.getElementById('total-sales').textContent = `₱${totalSales.toFixed(2)}`;
    
    // Count low stock items (less than 10)
    const lowStockCount = products.filter(product => product.stock > 0 && product.stock < 10).length;
    document.getElementById('low-stock-count').textContent = lowStockCount;
    
    // Count out of stock items
    const outOfStockCount = products.filter(product => product.stock === 0).length;
    document.getElementById('out-of-stock-count').textContent = outOfStockCount;
    
    // Update recent sales table
    renderRecentSales();
    
    // Update low stock alerts
    renderLowStockAlerts();
}

// Render inventory table
function renderInventoryTable() {
    const tableBody = document.getElementById('inventory-table');
    tableBody.innerHTML = '';
    
    if (products.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4">
                    <i class="fas fa-box-open fa-2x text-muted mb-2"></i>
                    <p class="text-muted">No products found. Add your first product to get started.</p>
                </td>
            </tr>
        `;
        return;
    }
    

    products.forEach((product, index) => {
        const status = getStockStatus(product.stock);
        const statusClass = status === 'In Stock' ? 'status-in-stock' : 
                          status === 'Low Stock' ? 'status-low-stock' : 'status-out-of-stock';
        
        const row = document.createElement('tr');
        row.className = product.stock === 0 ? 'out-of-stock' : product.stock < 10 ? 'low-stock' : '';
        row.innerHTML = `
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>₱${product.price.toFixed(2)}</td>
            <td>${product.stock}</td>
            <td>
                <span class="status-indicator ${statusClass}"></span>
                ${status}
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-primary edit-product" data-index="${index}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger delete-product" data-index="${index}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // Add event listeners to edit and delete buttons
    document.querySelectorAll('.edit-product').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            editProduct(index);
        });
    });
    
    document.querySelectorAll('.delete-product').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            deleteProduct(index);
        });
    });
}

// Render sales table
function renderSalesTable() {
    const tableBody = document.getElementById('sales-table');
    tableBody.innerHTML = '';
    
    if (sales.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4">
                    <i class="fas fa-receipt fa-2x text-muted mb-2"></i>
                    <p class="text-muted">No sales records found. Record your first sale to get started.</p>
                </td>
            </tr>
        `;
        return;
    }
    
    // Sort sales by date (newest first)
    const sortedSales = [...sales].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedSales.forEach((sale, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(sale.date)}</td>
            <td>${sale.productName}</td>
            <td>${sale.quantity}</td>
            <td>₱${sale.price.toFixed(2)}</td>
            <td>₱${(sale.quantity * sale.price).toFixed(2)}</td>
            <td>
                <button class="btn btn-sm btn-danger delete-sale" data-index="${index}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-sale').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            deleteSale(index);
        });
    });
}

// Render recent sales for dashboard
function renderRecentSales() {
    const tableBody = document.getElementById('recent-sales-table');
    tableBody.innerHTML = '';
    
    if (sales.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-3 text-muted">
                    No recent sales
                </td>
            </tr>
        `;
        return;
    }
    
    // Get the 5 most recent sales
    const recentSales = [...sales]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
    
    recentSales.forEach(sale => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${sale.productName}</td>
            <td>${sale.quantity}</td>
            <td>₱${(sale.quantity * sale.price).toFixed(2)}</td>
            <td>${formatDate(sale.date)}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Render low stock alerts for dashboard
function renderLowStockAlerts() {
    const alertsContainer = document.getElementById('low-stock-alerts');
    alertsContainer.innerHTML = '';
    
    const lowStockProducts = products.filter(product => product.stock > 0 && product.stock < 10);
    
    if (lowStockProducts.length === 0) {
        alertsContainer.innerHTML = `
            <div class="text-center text-muted py-2">
                <i class="fas fa-check-circle text-success me-2"></i>
                All products have sufficient stock
            </div>
        `;
        return;
    }
    
    lowStockProducts.forEach(product => {
        const alert = document.createElement('div');
        alert.className = 'alert alert-warning py-2 mb-2';
        alert.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <span>${product.name}</span>
                <span class="badge bg-warning">${product.stock} left</span>
            </div>
        `;
        alertsContainer.appendChild(alert);
    });
}

// Render quick sale buttons
function renderQuickSaleButtons() {
    const buttonsContainer = document.getElementById('quick-sale-buttons');
    buttonsContainer.innerHTML = '';
    
    if (products.length === 0) {
        buttonsContainer.innerHTML = `
            <div class="alert alert-info text-center">
                <i class="fas fa-info-circle me-2"></i>
                Add products to enable quick sales
            </div>
        `;
        return;
    }
    
    // Show only products with stock
    const availableProducts = products.filter(product => product.stock > 0);
    
    if (availableProducts.length === 0) {
        buttonsContainer.innerHTML = `
            <div class="alert alert-warning text-center">
                <i class="fas fa-exclamation-triangle me-2"></i>
                No products in stock for quick sales
            </div>
        `;
        return;
    }
    
    availableProducts.forEach((product, index) => {
        const button = document.createElement('div');
        button.className = 'quick-sale-btn';
        button.setAttribute('data-product-id', index);
        button.innerHTML = `
            <div class="fw-bold">${product.name}</div>
            <div class="small">Stock: ${product.stock}</div>
            <div class="small">₱${product.price.toFixed(2)}</div>
        `;
        buttonsContainer.appendChild(button);
        
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            document.querySelectorAll('.quick-sale-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Open quick sale modal
            openQuickSaleModal(parseInt(this.getAttribute('data-product-id')));
        });
    });
}

// Open quick sale modal
function openQuickSaleModal(productIndex) {
    const product = products[productIndex];
    
    document.getElementById('quick-sale-product-id').value = productIndex;
    document.getElementById('quick-sale-product-name').value = product.name;
    document.getElementById('quick-sale-price').value = product.price;
    document.getElementById('quick-sale-quantity').value = 1;
    document.getElementById('quick-sale-quantity').max = product.stock;
    
    calculateQuickTotalAmount();
    
    // Show modal
    const quickSaleModal = new bootstrap.Modal(document.getElementById('quickSaleModal'));
    quickSaleModal.show();
}

// Add new product
async function addProduct() {
    const name = document.getElementById('product-name').value.trim();
    const category = document.getElementById('product-category').value;
    const price = parseFloat(document.getElementById('product-price').value);
    const stock = parseInt(document.getElementById('product-stock').value);
    const description = document.getElementById('product-description').value.trim();
    
    if (!name || !category || isNaN(price) || isNaN(stock)) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    const newProduct = {
        id: Date.now(),
        name,
        category,
        price,
        stock,
        description
    };
    
    products.push(newProduct);
    await saveData();
    
    // Close modal and reset form
    const modal = bootstrap.Modal.getInstance(document.getElementById('addProductModal'));
    modal.hide();
    document.getElementById('add-product-form').reset();
    
    // Update UI
    updateDashboard();
    renderInventoryTable();
    renderQuickSaleButtons();
    
    showToast('Product added successfully');
}

// Edit product
function editProduct(index) {
    const product = products[index];
    
    document.getElementById('edit-product-id').value = index;
    document.getElementById('edit-product-name').value = product.name;
    document.getElementById('edit-product-category').value = product.category;
    document.getElementById('edit-product-price').value = product.price;
    document.getElementById('edit-product-stock').value = product.stock;
    document.getElementById('edit-product-description').value = product.description || '';
    
    const modal = new bootstrap.Modal(document.getElementById('editProductModal'));
    modal.show();
}

// Update product
async function updateProduct() {
    const index = parseInt(document.getElementById('edit-product-id').value);
    const name = document.getElementById('edit-product-name').value.trim();
    const category = document.getElementById('edit-product-category').value;
    const price = parseFloat(document.getElementById('edit-product-price').value);
    const stock = parseInt(document.getElementById('edit-product-stock').value);
    const description = document.getElementById('edit-product-description').value.trim();
    
    if (!name || !category || isNaN(price) || isNaN(stock)) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    products[index] = {
        ...products[index],
        name,
        category,
        price,
        stock,
        description
    };
    
    await saveData();
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('editProductModal'));
    modal.hide();
    
    // Update UI
    updateDashboard();
    renderInventoryTable();
    renderQuickSaleButtons();
    
    showToast('Product updated successfully');
}

// Delete product
async function deleteProduct(index) {
    if (confirm('Are you sure you want to delete this product?')) {
        products.splice(index, 1);
        await saveData();
        
        // Update UI
        updateDashboard();
        renderInventoryTable();
        renderQuickSaleButtons();
        
        showToast('Product deleted successfully');
    }
}

// Record sale
async function recordSale() {
    const productName = document.getElementById('sell-product-name').value.trim();
    const quantity = parseInt(document.getElementById('sell-quantity').value);
    const price = parseFloat(document.getElementById('sell-price').value);
    
    if (!productName || isNaN(quantity) || isNaN(price)) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    // Find product by name
    const productIndex = products.findIndex(p => p.name.toLowerCase() === productName.toLowerCase());
    
    if (productIndex === -1) {
        showToast('Product not found', 'error');
        return;
    }
    
    const product = products[productIndex];
    
    if (quantity > product.stock) {
        showToast(`Not enough stock. Only ${product.stock} items available.`, 'error');
        return;
    }
    
    // Update product stock
    products[productIndex].stock -= quantity;
    
    // Record sale
    const newSale = {
        productId: product.id,
        productName: product.name,
        quantity,
        price,
        date: new Date().toISOString()
    };
    
    sales.push(newSale);
    await saveData();
    
    // Close modal and reset form
    const modal = bootstrap.Modal.getInstance(document.getElementById('sellProductModal'));
    modal.hide();
    document.getElementById('sell-product-form').reset();
    document.getElementById('total-amount').textContent = '0.00';
    
    // Update UI
    updateDashboard();
    renderInventoryTable();
    renderSalesTable();
    renderQuickSaleButtons();
    
    showToast('Sale recorded successfully');
}

// Quick record sale
async function quickRecordSale() {
    const productIndex = parseInt(document.getElementById('quick-sale-product-id').value);
    const quantity = parseInt(document.getElementById('quick-sale-quantity').value);
    const price = parseFloat(document.getElementById('quick-sale-price').value);
    
    if (isNaN(productIndex) || isNaN(quantity) || isNaN(price)) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    const product = products[productIndex];
    
    if (quantity > product.stock) {
        showToast(`Not enough stock. Only ${product.stock} items available.`, 'error');
        return;
    }
    
    // Update product stock
    products[productIndex].stock -= quantity;
    
    // Record sale
    const newSale = {
        productId: product.id,
        productName: product.name,
        quantity,
        price,
        date: new Date().toISOString()
    };
    
    sales.push(newSale);
    await saveData();
    
    // Close modal and reset form
    const modal = bootstrap.Modal.getInstance(document.getElementById('quickSaleModal'));
    modal.hide();
    
    // Update UI
    updateDashboard();
    renderInventoryTable();
    renderSalesTable();
    renderQuickSaleButtons();
    
    showToast('Sale recorded successfully');
}

// Delete sale
async function deleteSale(index) {
    if (confirm('Are you sure you want to delete this sale record?')) {
        // Restore product stock
        const sale = sales[index];
        const productIndex = products.findIndex(p => p.id === sale.productId);
        
        if (productIndex !== -1) {
            products[productIndex].stock += sale.quantity;
        }
        
        sales.splice(index, 1);
        await saveData();
        
        // Update UI
        updateDashboard();
        renderInventoryTable();
        renderSalesTable();
        renderQuickSaleButtons();
        
        showToast('Sale record deleted successfully');
    }
}

// Calculate total amount for sale
function calculateTotalAmount() {
    const quantity = parseInt(document.getElementById('sell-quantity').value) || 0;
    const price = parseFloat(document.getElementById('sell-price').value) || 0;
    const total = quantity * price;
    
    document.getElementById('total-amount').textContent = total.toFixed(2);
}

// Calculate total amount for quick sale
function calculateQuickTotalAmount() {
    const quantity = parseInt(document.getElementById('quick-sale-quantity').value) || 0;
    const price = parseFloat(document.getElementById('quick-sale-price').value) || 0;
    const total = quantity * price;
    
    document.getElementById('quick-total-amount').textContent = total.toFixed(2);
}

// Filter products based on search input
function filterProducts() {
    const searchTerm = document.getElementById('search-product').value.toLowerCase();
    const tableRows = document.querySelectorAll('#inventory-table tr');
    
    tableRows.forEach(row => {
        const productName = row.cells[0]?.textContent.toLowerCase() || '';
        const category = row.cells[1]?.textContent.toLowerCase() || '';
        
        if (productName.includes(searchTerm) || category.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Export data
function exportData() {
    const data = {
        products,
        sales,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sari-sari-store-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Data exported successfully');
}

// Reset data
async function resetData() {
    if (confirm('Are you sure you want to reset all data? This action cannot be undone.')) {
        products = [];
        sales = [];
        await saveData();
        
        // Update UI
        updateDashboard();
        renderInventoryTable();
        renderSalesTable();
        renderQuickSaleButtons();
        
        showToast('All data has been reset');
    }
}

// Helper function to get stock status
function getStockStatus(stock) {
    if (stock === 0) return 'Out of Stock';
    if (stock < 10) return 'Low Stock';
    return 'In Stock';
}

// Helper function to format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}