document.addEventListener('DOMContentLoaded', () => {
    // Initialize Bar Chart
    initBarChart();
    // Initialize Donut Chart
    initDonutChart();
});

function initBarChart() {
    const ctx = document.getElementById('expensesBarChart').getContext('2d');
    
    // Data from Mockup (Visual estimation)
    // Labels: Dec, Feb, Mar, Apr, May, Jan
    const labels = ['Dec', 'Feb', 'Mar', 'Apr', 'May', 'Jan'];
    const data = [45, 80, 30, 60, 85, 65]; // Normalized values 0-100

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: '#F0EFF2', // Light Gray Bars matching homepage
                hoverBackgroundColor: '#75FB90', // Brand Green on hover
                borderRadius: 4,
                barPercentage: 0.6,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
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
                    displayColors: false,
                    callbacks: {
                        title: (context) => context[0].formattedValue,
                        label: (context) => context.label
                    }
                }
            },
            scales: {
                y: {
                    display: false,
                    beginAtZero: true,
                    max: 100
                },
                x: {
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        font: {
                            family: 'Urbanist',
                            size: 10
                        },
                        maxTicksLimit: 8
                    },
                    border: {
                        display: false
                    }
                }
            },
            interaction: {
                mode: 'index',
                intersect: false,
            }
        }
    });
}

function initDonutChart() {
    const ctx = document.getElementById('expensesDonutChart').getContext('2d');
    
    // Data with shades of black/gray from brand guidelines
    const chartData = [
        { label: 'Food & Grocery', value: 6156000, color: '#000000' },    // Black
        { label: 'Investment', value: 5000000, color: '#2B2B2B' },        // Very Dark Gray
        { label: 'Shopping', value: 4356000, color: '#555555' },          // Dark Gray
        { label: 'Travelling', value: 3670000, color: '#808080' },        // Medium Gray
        { label: 'Miscellaneous', value: 2749000, color: '#AAAAAA' },     // Light Gray
        { label: 'Bill & Subscription', value: 2162000, color: '#D3D2D4' } // Very Light Gray (from brand)
    ];
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: chartData.map(d => d.label),
            datasets: [{
                data: chartData.map(d => d.value),
                backgroundColor: chartData.map(d => d.color),
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%', // Thinner ring
            plugins: {
                legend: {
                    display: false // Custom legend
                },
                tooltip: {
                    backgroundColor: '#FFFFFF',
                    titleColor: '#000000',
                    bodyColor: '#888888',
                    bodyFont: {
                        family: 'Urbanist'
                    },
                    titleFont: {
                        family: 'Urbanist',
                        weight: 'bold'
                    },
                    padding: 12,
                    cornerRadius: 8,
                    borderColor: 'rgba(0,0,0,0.05)',
                    borderWidth: 1,
                    callbacks: {
                        title: (context) => {
                            return new Intl.NumberFormat('id-ID', {
                                style: 'currency',
                                currency: 'IDR',
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0
                            }).format(context[0].raw);
                        },
                        label: (context) => context.label
                    }
                }
            }
        }
    });

    // Legend removed - tooltip shows category information on hover
}
