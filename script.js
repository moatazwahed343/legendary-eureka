const DB_KEY = "abu_hamdy_furniture_db_v2";

let db = {
    products: [],
    sales: [],
    supplierDebts: [],
    expenses: []
};

const teamMembers = [
    "يوسف حمدي (صاحب المعرض / أبو حمدي)",
    "جمال حامد (عامل/بائع)",
    "حمادة أبو السحار (عامل/بائع)"
];

let currentUserIndex = 0;

function loadDatabase() {
    try {
        const stored = localStorage.getItem(DB_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            db.products = parsed.products || [];
            db.sales = parsed.sales || [];
            db.supplierDebts = parsed.supplierDebts || [];
            db.expenses = parsed.expenses || [];
        }
    } catch (e) {
        console.error("Error parsing localStorage data", e);
        saveDatabase();
    }
}

function saveDatabase() {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
    renderAll();
}

document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
        
        this.classList.add('active');
        const targetId = this.getAttribute('data-target');
        document.getElementById(targetId).classList.add('active');
        
        const titles = {
            'dashboard': 'لوحة التحكم الذكية',
            'products': 'إدارة المنتجات والمخزون',
            'kanban': 'سير العمل - Kanban',
            'sales': 'سجل المبيعات والفواتير',
            'debts': 'إدارة الديون والحسابات',
            'expenses': 'المصاريف والتقارير المالية المتقدمة'
        };
        document.getElementById('page-title').innerText = titles[targetId] || 'النظام الشامل';
    });
});

function switchUser() {
    currentUserIndex = (currentUserIndex + 1) % teamMembers.length;
    document.getElementById('current-user-display').innerText = teamMembers[currentUserIndex];
}

function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
function openBackupModal() { openModal('backupModal'); }

// دوال الآلة الحاسبة
function openCalculatorModal() {
    calcClear();
    openModal('calculatorModal');
}

function calcClear() {
    document.getElementById('calcScreen').value = '0';
}

function calcAppend(val) {
    const screen = document.getElementById('calcScreen');
    if (screen.value === '0' && val !== '.') {
        screen.value = val;
    } else {
        screen.value += val;
    }
}

function calcCalculate() {
    const screen = document.getElementById('calcScreen');
    try {
        let result = Function('"use strict";return (' + screen.value + ')')();
        screen.value = result;
    } catch (e) {
        screen.value = 'خطأ';
    }
}

function openProductModal() {
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('product-modal-title').innerText = 'إضافة منتج جديد للمخزون';
    openModal('productModal');
}

function openCheckoutModal() {
    const showroomItems = db.products.filter(p => p.stage === 'المعرض');
    const select = document.getElementById('saleProductSelect');
    select.innerHTML = '';
    if (showroomItems.length === 0) {
        select.innerHTML = '<option value="">لا توجد منتجات جاهزة في المعرض حالياً</option>';
    } else {
        showroomItems.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = `${p.name} - (${p.category}) - سعر البيع: ${p.sellingPrice} ج.م`;
            opt.setAttribute('data-price', p.sellingPrice);
            select.appendChild(opt);
        });
        onSaleProductSelected();
    }
    document.getElementById('checkoutForm')?.reset();
    const d = new Date();
    d.setDate(d.getDate() + 30);
    document.getElementById('saleDueDate').value = d.toISOString().split('T')[0];
    openModal('checkoutModal');
}

function openSupplierDebtModal() {
    document.getElementById('supplierDebtForm').reset();
    const d = new Date();
    d.setDate(d.getDate() + 15);
    document.getElementById('supDueDate').value = d.toISOString().split('T')[0];
    openModal('supplierDebtModal');
}

function openExpenseModal() {
    document.getElementById('expenseForm').reset();
    openModal('expenseModal');
}

function saveProduct(e) {
    e.preventDefault();
    const id = document.getElementById('productId').value;
    const name = document.getElementById('prodName').value.trim();
    const category = document.getElementById('prodCategory').value;
    const stage = document.getElementById('prodStage').value;
    const specs = document.getElementById('prodSpecs').value.trim();
    const cost = parseFloat(document.getElementById('prodCost').value);
    const sellingPrice = parseFloat(document.getElementById('prodSellingPrice').value);
    const image = document.getElementById('prodImage').value.trim() || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80';

    if (cost < 0 || sellingPrice < 0) {
        alert('لا يمكن إدخال قيم سالبة!');
        return;
    }

    if (id) {
        const prod = db.products.find(p => p.id == id);
        if (prod) {
            prod.name = name;
            prod.category = category;
            prod.stage = stage;
            prod.specs = specs;
            prod.cost = cost;
            prod.sellingPrice = sellingPrice;
            prod.image = image;
        }
    } else {
        db.products.push({ id: Date.now(), name, category, stage, specs, cost, sellingPrice, image });
    }

    saveDatabase();
    closeModal('productModal');
}

function editProduct(id) {
    const p = db.products.find(item => item.id == id);
    if (!p) return;
    document.getElementById('productId').value = p.id;
    document.getElementById('prodName').value = p.name;
    document.getElementById('prodCategory').value = p.category;
    document.getElementById('prodStage').value = p.stage;
    document.getElementById('prodSpecs').value = p.specs;
    document.getElementById('prodCost').value = p.cost;
    document.getElementById('prodSellingPrice').value = p.sellingPrice;
    document.getElementById('prodImage').value = p.image;
    document.getElementById('product-modal-title').innerText = 'تعديل بيانات المنتج';
    openModal('productModal');
}

function deleteProduct(id) {
    if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
        db.products = db.products.filter(p => p.id != id);
        saveDatabase();
    }
}

function shareProductWhatsApp(id) {
    const p = db.products.find(item => item.id == id);
    if (!p) return;
    const phone = prompt('أدخل رقم هاتف العميل (مثال: 010xxxxxxxx):');
    if (!phone) return;
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '2' + cleanPhone;
    const msg = `أهلاً بك في أبو حمدي للأثاث الراقي 🛋️✨\n\nالقطعة: ${p.name}\nالمواصفات: ${p.specs}\nالسعر: ${p.sellingPrice} ج.م\nصورة: ${p.image}`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
}

function moveProductStage(id, newStage) {
    const p = db.products.find(item => item.id == id);
    if (p) {
        p.stage = newStage;
        saveDatabase();
    }
}

function onSaleProductSelected() {
    const select = document.getElementById('saleProductSelect');
    const opt = select.options[select.selectedIndex];
    if (opt && opt.getAttribute('data-price')) {
        const price = parseFloat(opt.getAttribute('data-price'));
        document.getElementById('saleFinalPrice').value = price;
        document.getElementById('saleDeposit').value = price;
        calcSaleDebt();
    }
}

function calcSaleDebt() {
    const finalPrice = parseFloat(document.getElementById('saleFinalPrice').value) || 0;
    const deposit = parseFloat(document.getElementById('saleDeposit').value) || 0;
    const remaining = Math.max(0, finalPrice - deposit);
    document.getElementById('saleRemaining').value = remaining.toFixed(2);
    document.getElementById('saleCommissionDisplay').value = (finalPrice * 0.02).toFixed(2) + ' ج.م';
}

function processCheckout(e) {
    e.preventDefault();
    const prodId = document.getElementById('saleProductSelect').value;
    const product = db.products.find(p => p.id == prodId);
    if (!product) return;

    const customerName = document.getElementById('saleCustomerName').value.trim();
    const customerPhone = document.getElementById('saleCustomerPhone').value.trim();
    const seller = document.getElementById('saleSeller').value;
    const finalPrice = parseFloat(document.getElementById('saleFinalPrice').value);
    const deposit = parseFloat(document.getElementById('saleDeposit').value);
    const remaining = parseFloat(document.getElementById('saleRemaining').value);
    const dueDate = document.getElementById('saleDueDate').value;

    product.stage = 'المباعة';

    const sale = {
        id: 'AH-' + Math.floor(100000 + Math.random() * 900000),
        productId: product.id,
        productName: product.name,
        productSpecs: product.specs,
        customerName,
        customerPhone,
        seller,
        finalPrice,
        deposit,
        remaining,
        dueDate,
        date: new Date().toISOString().split('T')[0],
        paymentHistory: [{ date: new Date().toISOString().split('T')[0], amount: deposit, note: 'دفعة مقدمة' }]
    };

    db.sales.push(sale);
    saveDatabase();
    closeModal('checkoutModal');
    showInvoice(sale.id);
}

let activeInvoiceSale = null;

function showInvoice(saleId) {
    const sale = db.sales.find(s => s.id == saleId);
    if (!sale) return;
    activeInvoiceSale = sale;

    document.getElementById('invoice-details-content').innerHTML = `
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 0.9rem;">
            <div>
                <p><strong>رقم الفاتورة:</strong> ${sale.id}</p>
                <p><strong>التاريخ:</strong> ${sale.date}</p>
                <p><strong>البائع:</strong> ${sale.seller}</p>
            </div>
            <div style="text-align: left;">
                <p><strong>العميل:</strong> ${sale.customerName}</p>
                <p><strong>الهاتف:</strong> ${sale.customerPhone}</p>
            </div>
        </div>
        <table style="margin-bottom: 20px;">
            <thead><tr><th>القطعة</th><th>المواصفات</th><th>السعر</th></tr></thead>
            <tbody><tr><td><strong>${sale.productName}</strong></td><td>${sale.productSpecs}</td><td><strong>${sale.finalPrice.toLocaleString()} ج.م</strong></td></tr></tbody>
        </table>
        <div style="background: #f8fafc; padding: 16px; border-radius: var(--radius); border: 1px solid var(--border);">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;"><span>الإجمالي:</span><strong>${sale.finalPrice.toLocaleString()} ج.م</strong></div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: var(--success);"><span>المقدم:</span><strong>${sale.deposit.toLocaleString()} ج.م</strong></div>
            <div style="display: flex; justify-content: space-between; color: var(--danger);"><span>المتبقي:</span><strong>${sale.remaining.toLocaleString()} ج.م</strong></div>
        </div>
    `;
    openModal('invoiceModal');
}

function printInvoice() { window.print(); }

function shareInvoiceWhatsApp() {
    if (!activeInvoiceSale) return;
    const s = activeInvoiceSale;
    let cleanPhone = s.customerPhone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '2' + cleanPhone;
    const msg = `فاتورة شراء من أبو حمدي للأثاث الراقي\nرقم: ${s.id}\nالقطعة: ${s.productName}\nالمتبقي: ${s.remaining} ج.م`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
}

function deleteSale(id) {
    if (confirm('حذف هذه الفاتورة؟')) {
        db.sales = db.sales.filter(s => s.id != id);
        saveDatabase();
    }
}

function openDebtPaymentModal(saleId) {
    const sale = db.sales.find(s => s.id == saleId);
    if (!sale || sale.remaining <= 0) return;
    document.getElementById('payDebtSaleId').value = sale.id;
    document.getElementById('payCustomerName').value = sale.customerName;
    document.getElementById('payCurrentRemaining').value = sale.remaining.toFixed(2) + ' ج.م';
    document.getElementById('payAmount').value = '';
    openModal('debtPaymentModal');
}

function submitDebtPayment(e) {
    e.preventDefault();
    const saleId = document.getElementById('payDebtSaleId').value;
    const amount = parseFloat(document.getElementById('payAmount').value);
    const sale = db.sales.find(s => s.id == saleId);
    if (!sale || amount <= 0 || amount > sale.remaining) return;

    sale.remaining -= amount;
    sale.deposit += amount;
    sale.paymentHistory.push({ date: new Date().toISOString().split('T')[0], amount, note: 'سداد دفعة' });
    saveDatabase();
    closeModal('debtPaymentModal');
}

function settleDebtDiscount(saleId) {
    const sale = db.sales.find(s => s.id == saleId);
    if (!sale || sale.remaining <= 0) return;
    if (confirm(`تسوية وإبراء ذمة للمبلغ المتبقي (${sale.remaining} ج.م)؟`)) {
        sale.remaining = 0;
        saveDatabase();
    }
}

function remindDebtWhatsApp(saleId) {
    const s = db.sales.find(item => item.id == saleId);
    if (!s || s.remaining <= 0) return;
    let cleanPhone = s.customerPhone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '2' + cleanPhone;
    const msg = `مرحباً بك أ/ ${s.customerName}، تذكير بوجود متبقي مستحق بقيمة ${s.remaining} ج.م لدى أبو حمدي للأثاث الراقي.`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
}

function calcSupRemaining() {
    const total = parseFloat(document.getElementById('supTotal').value) || 0;
    const paid = parseFloat(document.getElementById('supPaid').value) || 0;
    document.getElementById('supRemaining').value = Math.max(0, total - paid).toFixed(2);
}

function saveSupplierDebt(e) {
    e.preventDefault();
    const name = document.getElementById('supName').value.trim();
    const material = document.getElementById('supMaterial').value.trim();
    const total = parseFloat(document.getElementById('supTotal').value);
    const paid = parseFloat(document.getElementById('supPaid').value);
    const remaining = parseFloat(document.getElementById('supRemaining').value);
    const dueDate = document.getElementById('supDueDate').value;

    db.supplierDebts.push({ id: Date.now(), name, material, total, paid, remaining, dueDate });
    saveDatabase();
    closeModal('supplierDebtModal');
}

function paySupplierDebt(id) {
    const sup = db.supplierDebts.find(s => s.id == id);
    if (!sup || sup.remaining <= 0) return;
    const amt = parseFloat(prompt(`المتبقي ${sup.remaining} ج.م. أدخل المبلغ المراد سداده:`));
    if (isNaN(amt) || amt <= 0 || amt > sup.remaining) return;
    sup.paid += amt;
    sup.remaining -= amt;
    saveDatabase();
}

function deleteSupplierDebt(id) {
    if (confirm('حذف سجل دين التاجر؟')) {
        db.supplierDebts = db.supplierDebts.filter(s => s.id != id);
        saveDatabase();
    }
}

function saveExpense(e) {
    e.preventDefault();
    const title = document.getElementById('expTitle').value.trim();
    const category = document.getElementById('expCategory').value;
    const amount = parseFloat(document.getElementById('expAmount').value);
    const notes = document.getElementById('expNotes').value.trim();

    db.expenses.push({ id: Date.now(), title, category, amount, notes, date: new Date().toISOString().split('T')[0] });
    saveDatabase();
    closeModal('expenseModal');
}

function deleteExpense(id) {
    if (confirm('حذف المصروف؟')) {
        db.expenses = db.expenses.filter(e => e.id != id);
        saveDatabase();
    }
}

function exportDataJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
}

function importDataJSON() {
    const fileInput = document.getElementById('importFile');
    if (fileInput.files.length === 0) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            db = JSON.parse(e.target.result);
            saveDatabase();
            closeModal('backupModal');
            alert('تمت الاستعادة بنجاح!');
        } catch (err) {
            alert('ملف غير صالح.');
        }
    };
    reader.readAsText(fileInput.files[0]);
}

function renderAll() {
    renderDashboard();
    renderProducts();
    renderKanban();
    renderSales();
    renderDebts();
    renderExpenses();
}

function renderDashboard() {
    let totalDeposits = 0;
    db.sales.forEach(s => s.paymentHistory.forEach(ph => totalDeposits += ph.amount));

    let totalExpenses = 0;
    db.expenses.forEach(e => totalExpenses += e.amount);

    let totalSupplierPaid = 0;
    db.supplierDebts.forEach(sd => totalSupplierPaid += sd.paid);

    const safeCash = totalDeposits - totalExpenses - totalSupplierPaid;
    let totalCustomerDebts = 0;
    db.sales.forEach(s => totalCustomerDebts += s.remaining);

    let totalSupplierDebts = 0;
    db.supplierDebts.forEach(sd => totalSupplierDebts += sd.remaining);

    document.getElementById('stat-safe-cash').innerText = safeCash.toLocaleString() + ' ج.م';
    document.getElementById('stat-customer-debts').innerText = totalCustomerDebts.toLocaleString() + ' ج.م';
    document.getElementById('stat-supplier-debts').innerText = totalSupplierDebts.toLocaleString() + ' ج.م';
    document.getElementById('stat-total-expenses').innerText = totalExpenses.toLocaleString() + ' ج.م';

    let totalBookSales = 0;
    db.sales.forEach(s => totalBookSales += s.finalPrice);
    let netProfit = totalBookSales - totalExpenses;

    document.getElementById('dash-book-profit').innerText = totalBookSales.toLocaleString() + ' ج.م';
    document.getElementById('dash-cash-liquidity').innerText = totalDeposits.toLocaleString() + ' ج.م';
    document.getElementById('dash-net-profit').innerText = netProfit.toLocaleString() + ' ج.م';

    const alertsContainer = document.getElementById('alerts-container');
    alertsContainer.innerHTML = '';
    let alertsCount = 0;
    const todayStr = new Date().toISOString().split('T')[0];

    db.sales.forEach(s => {
        if (s.remaining > 0 && s.dueDate <= todayStr) {
            alertsCount++;
            alertsContainer.innerHTML += `
                <div class="alert-item danger">
                    <div class="alert-icon"><i class="fas fa-exclamation-triangle"></i></div>
                    <div class="alert-content">
                        <div class="alert-title">دين مستحق على العميل: ${s.customerName}</div>
                        <div class="alert-desc">متبقي ${s.remaining} ج.م - موعد الاستحقاق: ${s.dueDate}</div>
                    </div>
                    <button class="btn btn-primary btn-sm" onclick="remindDebtWhatsApp('${s.id}')">تذكير واتساب</button>
                </div>
            `;
        }
    });

    if (alertsCount === 0) {
        alertsContainer.innerHTML = `
            <div class="alert-item success">
                <div class="alert-icon"><i class="fas fa-check-circle"></i></div>
                <div class="alert-content">
                    <div class="alert-title">كل الأمور ممتازة!</div>
                    <div class="alert-desc">لا توجد ديون مستحقة اليوم.</div>
                </div>
            </div>
        `;
    }
}

function renderProducts() {
    const tbody = document.getElementById('products-table-body');
    tbody.innerHTML = '';
    if (db.products.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 30px;">لا توجد منتجات مسجلة.</td></tr>`;
        return;
    }
    db.products.forEach(p => {
        let badgeClass = p.stage === 'المعرض' ? 'badge-success' : (p.stage === 'المباعة' ? 'badge-info' : 'badge-warning');
        tbody.innerHTML += `
            <tr>
                <td><img src="${p.image}" alt="" style="width: 48px; height: 48px; object-fit: cover; border-radius: 8px;"></td>
                <td><strong>${p.name}</strong></td>
                <td>${p.category}</td>
                <td><small>${p.specs}</small></td>
                <td>${p.cost.toLocaleString()} ج.م</td>
                <td><strong>${p.sellingPrice.toLocaleString()} ج.م</strong></td>
                <td><span class="badge ${badgeClass}">${p.stage}</span></td>
                <td>
                    <div style="display: flex; gap: 6px;">
                        <button class="btn btn-outline btn-sm" onclick="shareProductWhatsApp(${p.id})"><i class="fab fa-whatsapp" style="color: #27ae60;"></i></button>
                        <button class="btn btn-outline btn-sm" onclick="editProduct(${p.id})"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-danger btn-sm" onclick="deleteProduct(${p.id})"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `;
    });
}

function renderKanban() {
    const colWorkshop = document.getElementById('kanban-workshop');
    const colShowroom = document.getElementById('kanban-showroom');
    const colSold = document.getElementById('kanban-sold');

    colWorkshop.innerHTML = '';
    colShowroom.innerHTML = '';
    colSold.innerHTML = '';

    let countW = 0, countS = 0, countSold = 0;

    db.products.forEach(p => {
        const cardHTML = `
            <div class="kanban-card">
                <div class="kanban-card-title">${p.name}</div>
                <div class="kanban-card-details">
                    <div><strong>القسم:</strong> ${p.category}</div>
                    <div><strong>السعر:</strong> ${p.sellingPrice.toLocaleString()} ج.م</div>
                </div>
                <div class="kanban-card-footer">
                    <span class="badge badge-info">${p.category}</span>
                    <div>
                        ${p.stage === 'الورشة' ? `<button class="btn btn-success btn-sm" onclick="moveProductStage(${p.id}, 'المعرض')">للمعرض</button>` : ''}
                        ${p.stage === 'المعرض' ? `<button class="btn btn-primary btn-sm" onclick="moveProductStage(${p.id}, 'الورشة')">للورشة</button>` : ''}
                    </div>
                </div>
            </div>
        `;
        if (p.stage === 'الورشة') { countW++; colWorkshop.innerHTML += cardHTML; }
        else if (p.stage === 'المعرض') { countS++; colShowroom.innerHTML += cardHTML; }
        else { countSold++; colSold.innerHTML += cardHTML; }
    });

    document.getElementById('count-workshop').innerText = countW;
    document.getElementById('count-showroom').innerText = countS;
    document.getElementById('count-sold').innerText = countSold;
}

function renderSales() {
    const tbody = document.getElementById('sales-table-body');
    tbody.innerHTML = '';
    if (db.sales.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: var(--text-muted); padding: 30px;">لا توجد مبيعات.</td></tr>`;
        return;
    }
    db.sales.forEach(s => {
        tbody.innerHTML += `
            <tr>
                <td><strong>${s.id}</strong></td>
                <td>${s.customerName}</td>
                <td>${s.customerPhone}</td>
                <td>${s.productName}</td>
                <td><strong>${s.finalPrice.toLocaleString()} ج.م</strong></td>
                <td style="color: var(--success);">${s.deposit.toLocaleString()} ج.م</td>
                <td style="color: var(--danger);"><strong>${s.remaining.toLocaleString()} ج.م</strong></td>
                <td><small>${s.seller}</small></td>
                <td>${s.date}</td>
                <td>
                    <button class="btn btn-outline btn-sm" onclick="showInvoice('${s.id}')"><i class="fas fa-print"></i></button>
                    <button class="btn btn-danger btn-sm" onclick="deleteSale('${s.id}')"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    });
}

function renderDebts() {
    const custTbody = document.getElementById('customer-debts-body');
    custTbody.innerHTML = '';
    let activeCustSales = db.sales.filter(s => s.remaining > 0);

    if (activeCustSales.length === 0) {
        custTbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--text-muted); padding: 20px;">لا توجد ديون على العملاء.</td></tr>`;
    } else {
        activeCustSales.forEach(s => {
            custTbody.innerHTML += `
                <tr>
                    <td><strong>${s.customerName}</strong></td>
                    <td>${s.customerPhone}</td>
                    <td>${s.productName}</td>
                    <td>${s.finalPrice.toLocaleString()} ج.م</td>
                    <td style="color: var(--success);">${s.deposit.toLocaleString()} ج.م</td>
                    <td style="color: var(--danger);"><strong>${s.remaining.toLocaleString()} ج.م</strong></td>
                    <td>${s.dueDate}</td>
                    <td><span class="badge badge-warning">نشط</span></td>
                    <td>
                        <button class="btn btn-success btn-sm" onclick="openDebtPaymentModal('${s.id}')">دفعة</button>
                        <button class="btn btn-outline btn-sm" onclick="settleDebtDiscount('${s.id}')">تسوية</button>
                        <button class="btn btn-outline btn-sm" onclick="remindDebtWhatsApp('${s.id}')"><i class="fab fa-whatsapp" style="color: #27ae60;"></i></button>
                    </td>
                </tr>
            `;
        });
    }

    const supTbody = document.getElementById('supplier-debts-body');
    supTbody.innerHTML = '';
    if (db.supplierDebts.length === 0) {
        supTbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 20px;">لا توجد ديون على التجار.</td></tr>`;
    } else {
        db.supplierDebts.forEach(sd => {
            supTbody.innerHTML += `
                <tr>
                    <td><strong>${sd.name}</strong></td>
                    <td>${sd.material}</td>
                    <td>${sd.total.toLocaleString()} ج.م</td>
                    <td style="color: var(--success);">${sd.paid.toLocaleString()} ج.م</td>
                    <td style="color: var(--danger);"><strong>${sd.remaining.toLocaleString()} ج.م</strong></td>
                    <td>${sd.dueDate}</td>
                    <td><span class="badge badge-warning">جاري</span></td>
                    <td>
                        ${sd.remaining > 0 ? `<button class="btn btn-success btn-sm" onclick="paySupplierDebt(${sd.id})">سداد</button>` : ''}
                        <button class="btn btn-danger btn-sm" onclick="deleteSupplierDebt(${sd.id})"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        });
    }
}

function renderExpenses() {
    const tbody = document.getElementById('expenses-table-body');
    tbody.innerHTML = '';

    const now = new Date();
    const currentYear = now.getFullYear().toString();
    const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0');
    const currentYearMonth = `${currentYear}-${currentMonth}`;

    let monthSales = 0;
    let monthExpenses = 0;
    let yearSales = 0;
    let yearExpenses = 0;

    db.sales.forEach(s => {
        if (s.date) {
            if (s.date.startsWith(currentYearMonth)) {
                monthSales += s.finalPrice;
            }
            if (s.date.startsWith(currentYear)) {
                yearSales += s.finalPrice;
            }
        }
    });

    db.expenses.forEach(e => {
        if (e.date) {
            if (e.date.startsWith(currentYearMonth)) {
                monthExpenses += e.amount;
            }
            if (e.date.startsWith(currentYear)) {
                yearExpenses += e.amount;
            }
        }
    });

    document.getElementById('rep-month-sales').innerText = monthSales.toLocaleString() + ' ج.م';
    document.getElementById('rep-month-expenses').innerText = monthExpenses.toLocaleString() + ' ج.م';
    document.getElementById('rep-year-sales').innerText = yearSales.toLocaleString() + ' ج.م';
    document.getElementById('rep-year-expenses').innerText = yearExpenses.toLocaleString() + ' ج.م';

    if (db.expenses.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 20px;">لا توجد مصاريف مسجلة.</td></tr>`;
        return;
    }

    db.expenses.forEach(e => {
        tbody.innerHTML += `
            <tr>
                <td><strong>${e.title}</strong></td>
                <td><span class="badge badge-info">${e.category}</span></td>
                <td style="color: var(--danger);"><strong>${e.amount.toLocaleString()} ج.م</strong></td>
                <td><small>${e.notes || '-'}</small></td>
                <td>${e.date}</td>
                <td><button class="btn btn-danger btn-sm" onclick="deleteExpense(${e.id})"><i class="fas fa-trash"></i></button></td>
            </tr>
        `;
    });
}

window.addEventListener('DOMContentLoaded', () => {
    loadDatabase();
});