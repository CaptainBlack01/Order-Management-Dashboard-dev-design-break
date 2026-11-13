document.addEventListener('DOMContentLoaded', () => {
  const tableBody = document.getElementById('orderTableBody');
  const rows = Array.from(tableBody.querySelectorAll('tr'));
  const statusFilter = document.getElementById('status-filter');
  const paymentFilter = document.getElementById('payment-filter');
  const dateFilter = document.getElementById('date-filter');
  const searchInput = document.getElementById('order-search');
  const pageBtns = Array.from(document.querySelectorAll('.page-btn'));
  const orderCount = document.getElementById('orderCount');
  const downloadBtn = document.getElementById('downloadOrders');

  const customerName = document.getElementById('customerName');
  const customerEmail = document.getElementById('customerEmail');
  const customerPhone = document.getElementById('customerPhone');
  const customerAddress = document.getElementById('customerAddress');

  const rowsPerPage = 4;
  let currentPage = 1;
  let filteredRows = [...rows];

  // Give every row a real date based on its days-ago value.
  const formatMonthYear = (date) => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${month}/${date.getFullYear()}`;
  };

  rows.forEach((row) => {
    const daysAgo = Number(row.getAttribute('data-days-ago'));
    if (Number.isNaN(daysAgo)) return;
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    const dateCell = row.querySelector('td:nth-child(3)');
    if (dateCell) dateCell.textContent = formatMonthYear(date);
  });

  const matchesDate = (row, value) => {
    if (!value || value === 'date') return true;
    const daysAgo = Number(row.getAttribute('data-days-ago'));
    if (Number.isNaN(daysAgo)) return true;
    if (value === 'today') return daysAgo === 0;
    if (value === 'this-week') return daysAgo <= 6;
    if (value === 'this-month') return daysAgo <= 29;
    if (value === 'this-year') return daysAgo <= 364;
    return true;
  };

  const matchesFilters = (row) => {
    const status = statusFilter ? statusFilter.value : '';
    const payment = paymentFilter ? paymentFilter.value : '';
    const date = dateFilter ? dateFilter.value : '';
    const term = searchInput ? searchInput.value.trim().toLowerCase() : '';

    if (status && row.getAttribute('data-status') !== status) return false;
    if (payment && row.getAttribute('data-payment') !== payment) return false;
    if (!matchesDate(row, date)) return false;
    if (term && !row.textContent.toLowerCase().includes(term)) return false;
    return true;
  };

  const updatePagination = (totalPages) => {
    pageBtns.forEach((btn) => {
      const page = Number(btn.getAttribute('data-page'));
      btn.hidden = page > totalPages;
      btn.classList.toggle('active', page === currentPage);
      if (page === currentPage) {
        btn.setAttribute('aria-current', 'page');
      } else {
        btn.removeAttribute('aria-current');
      }
    });
  };

  const renderPage = () => {
    const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));
    if (currentPage > totalPages) currentPage = totalPages;

    rows.forEach((row) => {
      row.style.display = 'none';
      row.classList.remove('selected');
    });

    const start = (currentPage - 1) * rowsPerPage;
    const pageRows = filteredRows.slice(start, start + rowsPerPage);
    pageRows.forEach((row) => {
      row.style.display = '';
    });

    updatePagination(totalPages);

    if (orderCount) {
      const shownStart = filteredRows.length === 0 ? 0 : start + 1;
      const shownEnd = Math.min(start + rowsPerPage, filteredRows.length);
      orderCount.textContent = `Showing ${shownStart}–${shownEnd} of ${filteredRows.length} orders`;
    }
  };

  const applyFilters = () => {
    filteredRows = rows.filter(matchesFilters);
    currentPage = 1;
    renderPage();
  };

  [statusFilter, paymentFilter, dateFilter].forEach((select) => {
    if (select) select.addEventListener('change', applyFilters);
  });

  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }

  pageBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      currentPage = Number(btn.getAttribute('data-page'));
      renderPage();
    });
  });

  const updateCustomer = (row) => {
    if (!row) return;
    if (customerName) customerName.textContent = row.getAttribute('data-customer') || '';
    if (customerEmail) customerEmail.textContent = row.getAttribute('data-email') || '';
    if (customerPhone) customerPhone.textContent = row.getAttribute('data-phone') || '';
    if (customerAddress) customerAddress.textContent = row.getAttribute('data-address') || '';
  };

  rows.forEach((row) => {
    row.addEventListener('click', () => {
      rows.forEach((r) => r.classList.remove('selected'));
      row.classList.add('selected');
      updateCustomer(row);
    });
  });

  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      const header = ['Order ID', 'Customer', 'Date', 'Amount', 'Status', 'Payment'];
      const lines = filteredRows.map((row) => {
        const cells = Array.from(row.querySelectorAll('td')).map((cell) =>
          cell.textContent.trim().replace(/"/g, '""')
        );
        return cells.map((cell) => `"${cell}"`).join(',');
      });
      const csv = [header.join(','), ...lines].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'order-list.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    });
  }

  // Select the first visible row so the details panel starts in sync.
  updateCustomer(rows[0]);
  renderPage();
});
