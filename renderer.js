// renderer.js
document.addEventListener('DOMContentLoaded', async () => {
  const productForm = document.getElementById('add-product-form');
  const saveProductBtn = document.getElementById('save-product');
  const productTableBody = document.getElementById('inventory-table');
  const filename = 'products.json';
  let products = [];

  // === Load existing products ===
  async function loadProducts() {
    const exists = await window.electronAPI.fileExists(filename);
    products = exists ? await window.electronAPI.readFile(filename) : [];
    renderProducts();
  }

  // === Render products ===
  function renderProducts() {
    productTableBody.innerHTML = '';

    if (products.length === 0) {
      productTableBody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center text-muted">No products found</td>
        </tr>`;
      return;
    }

    products.forEach((p, i) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${p.name}</td>
        <td>${p.category}</td>
        <td>₱${p.price.toFixed(2)}</td>
        <td>${p.stock}</td>
        <td>
          <button class="btn btn-danger btn-sm delete-btn" data-index="${i}">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      `;
      productTableBody.appendChild(row);
    });
  }

  // === Save new product ===
  saveProductBtn.addEventListener('click', async () => {
    const name = document.getElementById('product-name').value.trim();
    const category = document.getElementById('product-category').value.trim();
    const price = parseFloat(document.getElementById('product-price').value);
    const stock = parseInt(document.getElementById('product-stock').value);

    if (!name || !category || isNaN(price) || isNaN(stock)) {
      alert('Please fill out all fields correctly.');
      return;
    }

    products.push({ name, category, price, stock });
    await window.electronAPI.writeFile(filename, products);
    renderProducts();

    // Reset form and close modal
    productForm.reset();
    const modal = bootstrap.Modal.getInstance(document.getElementById('addProductModal'));
    modal.hide();
  });

  // === Delete product ===
  productTableBody.addEventListener('click', async (e) => {
    if (e.target.closest('.delete-btn')) {
      const index = e.target.closest('.delete-btn').getAttribute('data-index');
      if (confirm('Are you sure you want to delete this product?')) {
        products.splice(index, 1);
        await window.electronAPI.writeFile(filename, products);
        renderProducts();
      }
    }
  });

  // === Initial load ===
  loadProducts();
});
