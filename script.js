document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('tableBody');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const pageInfo = document.getElementById('pageInfo');
    
    // DOM Elements for Metrics
    const netWorthEl = document.querySelector('.balance-amount');
    const savingsGoalEl = document.querySelector('.metric-card:nth-child(1) .metric-value');
    const expensesEl = document.querySelector('.metric-card:nth-child(2) .metric-value');
    const investmentsEl = document.querySelector('.metric-card:nth-child(3) .metric-value');
    // const chartContainer = document.querySelector('.chart-container'); // No longer needed directly

    let allTransactions = [];
    let currentPage = 1;
    let financeChart = null; // Store chart instance
    const rowsPerPage = 10;
    const INITIAL_NET_WORTH = 1000000000; // 1 Billion IDR Base

    // Format currency to IDR
    const formatIDR = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Format compact currency (e.g. 1.2M)
    const formatCompact = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            notation: "compact",
            compactDisplay: "short"
        }).format(amount);
    };

    // Fetch and parse CSV
    fetch('transactions.csv')
        .then(response => response.text())
        .then(csvText => {
            const lines = csvText.trim().split('\n');
            
            // Skip header row
            allTransactions = lines.slice(1).map(line => {
                const [date, details, amount, account, category] = line.split(',');
                return {
                    date,
                    details,
                    amount: parseFloat(amount),
                    account,
                    category
                };
            });

            // Sort transactions by date (oldest first for calculation, but we display newest first)
            // The CSV is generated newest first, so we reverse for calculation
            const sortedForCalc = [...allTransactions].sort((a, b) => new Date(a.date) - new Date(b.date));
            
            calculateMetrics(sortedForCalc);
            renderTable();
            updatePagination();
        })
        .catch(error => console.error('Error loading transactions:', error));

    function calculateMetrics(transactions) {
        // 1. Net Worth Calculation
        let currentNetWorth = INITIAL_NET_WORTH;
        const dailyBalances = [];

        transactions.forEach(tx => {
            currentNetWorth += tx.amount;
            dailyBalances.push({ date: tx.date, balance: currentNetWorth });
        });

        netWorthEl.textContent = formatIDR(currentNetWorth);

        // 2. Monthly Metrics (Current Month based on latest transaction)
        const latestDate = new Date(transactions[transactions.length - 1].date);
        const currentMonth = latestDate.getMonth();
        const currentYear = latestDate.getFullYear();

        let monthlyExpenses = 0;
        let totalInvestments = 0;
        // For Savings Goal, let's assume "Salary" contributes to savings potential or just track Cash flow
        // Actually, let's track Total Assets (Net Worth) vs Target as "Savings Goal"
        // Or simplified: "Income - Expenses" for the month as Savings
        let monthlyIncome = 0;

        transactions.forEach(tx => {
            const txDate = new Date(tx.date);
            
            // Calculate Total Investments (Lifetime or YTD)
            // Note: In CSV generator, Investment is negative (money leaving account), so we flip sign
            if (tx.category === 'Investment') {
                totalInvestments += Math.abs(tx.amount);
            }

            // Monthly calculations
            if (txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear) {
                if (tx.amount < 0 && tx.category !== 'Investment') {
                    monthlyExpenses += Math.abs(tx.amount);
                } else if (tx.amount > 0) {
                    monthlyIncome += tx.amount;
                }
            }
        });

        expensesEl.textContent = formatIDR(monthlyExpenses);
        investmentsEl.textContent = formatIDR(totalInvestments);
        
        // Savings Goal: Let's display Monthly Savings (Income - Expense)
        const monthlySavings = monthlyIncome - monthlyExpenses;
        savingsGoalEl.textContent = formatIDR(monthlySavings);

        // 3. Update Chart (Last 30 Days Trend)
        updateChart(dailyBalances.slice(-32)); // Show roughly last month
    }

    function updateChart(data) {
        const ctx = document.getElementById('financeChart').getContext('2d');
        
        // Prepare labels and data
        // Since data can be dense, we might want to simplify labels (e.g., show every Nth label)
        const labels = data.map(d => {
            const date = new Date(d.date);
            return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
        });
        const values = data.map(d => d.balance);

        // Destroy previous chart if exists
        if (financeChart) {
            financeChart.destroy();
        }

        // Create Gradient for the line
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(117, 251, 144, 0.5)'); // Brand Green low opacity
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        financeChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    // Line Overlay (Trend)
                    {
                        type: 'line',
                        label: 'Trend',
                        data: values,
                        borderColor: '#000000',
                        borderWidth: 2,
                        tension: 0.4, // Smooth curve
                        pointRadius: 0, // Hide points by default
                        pointHoverRadius: 6,
                        fill: false,
                        order: 1 // Draw on top
                    },
                    // Bar Chart (Daily Volume/Balance)
                    {
                        type: 'bar',
                        label: 'Net Worth',
                        data: values,
                        backgroundColor: '#F0EFF2', // Light Gray Bars
                        hoverBackgroundColor: '#75FB90', // Green on Hover
                        borderRadius: 4,
                        barPercentage: 0.6,
                        order: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false // Hide legend
                    },
                    tooltip: {
                        // Replicating the "White Card" style
                        backgroundColor: '#FFFFFF',
                        titleColor: '#000000',
                        titleFont: {
                            family: 'Urbanist',
                            size: 14,
                            weight: 'bold'
                        },
                        bodyColor: '#888888',
                        bodyFont: {
                            family: 'Urbanist',
                            size: 12
                        },
                        padding: 12,
                        cornerRadius: 8,
                        borderColor: 'rgba(0,0,0,0.05)',
                        borderWidth: 1,
                        displayColors: false, // Hide the color box
                        callbacks: {
                            title: (context) => formatIDR(context[0].raw),
                            label: (context) => context.label // Correct: context is the item itself for label callback
                        },
                        // Shadow effect via filter (Chart.js specific trick or just rely on border)
                        // Standard Chart.js doesn't support box-shadow on tooltip easily without custom HTML
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false,
                            drawBorder: false
                        },
                        ticks: {
                            display: true, // Hide x-axis labels for cleaner look? Or keep them small
                            font: {
                                family: 'Urbanist',
                                size: 10
                            },
                            maxTicksLimit: 8
                        },
                        border: {
                            display: false
                        }
                    },
                    y: {
                        display: false, // Hide y-axis completely as per design
                        min: Math.min(...values) * 0.99, // Start slightly below min value to show variation
                        max: Math.max(...values) * 1.01
                    }
                },
                interaction: {
                    mode: 'index',
                    intersect: false,
                }
            }
        });
    }

    function renderTable() {
        tableBody.innerHTML = '';
        
        const start = (currentPage - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        const pageData = allTransactions.slice(start, end);

        pageData.forEach(tx => {
            const row = document.createElement('tr');
            
            // Format Date
            const dateObj = new Date(tx.date);
            const dateStr = dateObj.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });

            // Amount Styling
            const amountClass = tx.amount >= 0 ? 'amount-positive' : 'amount-negative';
            const formattedAmount = formatIDR(tx.amount);

            row.innerHTML = `
                <td>${dateStr}</td>
                <td>
                    <div style="font-weight: 600;">${tx.details}</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">${tx.account}</div>
                </td>
                <td>
                    <span style="background: var(--bg-light); padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 500;">
                        ${tx.category}
                    </span>
                </td>
                <td style="text-align: right;" class="${amountClass}">
                    ${tx.amount > 0 ? '+' : ''}${formattedAmount}
                </td>
            `;
            
            tableBody.appendChild(row);
        });
    }

    function updatePagination() {
        const totalPages = Math.ceil(allTransactions.length / rowsPerPage);
        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
        
        prevBtn.disabled = currentPage === 1;
        nextBtn.disabled = currentPage === totalPages;
    }

    // Event Listeners
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTable();
            updatePagination();
        }
    });

    nextBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(allTransactions.length / rowsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderTable();
            updatePagination();
        }
    });
});
