
// Initialize
function init() {
    setupEventListeners();
    initializeCharts();
}

// Setup event listeners
function setupEventListeners() {
    // Mobile menu
    document.getElementById('mobileMenuBtn').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('-translate-x-full');
        document.getElementById('mobileMenuOverlay').classList.toggle('hidden');
    });

    document.getElementById('mobileMenuOverlay').addEventListener('click', () => {
        document.getElementById('sidebar').classList.add('-translate-x-full');
        document.getElementById('mobileMenuOverlay').classList.add('hidden');
    });

    // Period selector
    document.querySelectorAll('.period-button').forEach(button => {
        button.addEventListener('click', function() {
            document.querySelectorAll('.period-button').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            updateCharts(this.dataset.period);
        });
    });
}

// Initialize charts
function initializeCharts() {
    // Chart theme
    const chartTheme = {
        colors: ['#d4af37', '#a8a196', '#e8dcc6'],
        chart: {
            fontFamily: 'Inter, sans-serif',
            toolbar: {
                show: false
            }
        },
        grid: {
            borderColor: '#e8dcc6',
            strokeDashArray: 0
        },
        xaxis: {
            labels: {
                style: {
                    colors: '#a8a196',
                    fontSize: '12px'
                }
            }
        },
        yaxis: {
            labels: {
                style: {
                    colors: '#a8a196',
                    fontSize: '12px'
                }
            }
        }
    };

    // Sales Chart
    const salesOptions = {
        ...chartTheme,
        series: [{
            name: 'Revenue',
            type: 'area',
            data: [3200, 4100, 3800, 5100, 4200, 5200, 4800]
        }, {
            name: 'Orders',
            type: 'line',
            data: [28, 35, 31, 42, 36, 44, 39]
        }],
        chart: {
            height: 350,
            type: 'line',
            ...chartTheme.chart
        },
        stroke: {
            width: [0, 3],
            curve: 'smooth'
        },
        fill: {
            opacity: [0.25, 1],
            gradient: {
                inverseColors: false,
                shade: 'light',
                type: "vertical",
                opacityFrom: 0.85,
                opacityTo: 0.55,
                stops: [0, 100, 100, 100]
            }
        },
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        yaxis: [{
            title: {
                text: 'Revenue ($)',
                style: {
                    color: '#a8a196'
                }
            },
            ...chartTheme.yaxis
        }, {
            opposite: true,
            title: {
                text: 'Orders',
                style: {
                    color: '#a8a196'
                }
            },
            ...chartTheme.yaxis
        }],
        tooltip: {
            shared: true,
            intersect: false,
            y: {
                formatter: function (y, { seriesIndex }) {
                    if (seriesIndex === 0) {
                        return y.toFixed(0);
                    }
                    return y;
                }
            }
        }
    };

    const salesChart = new ApexCharts(document.querySelector("#salesChart"), salesOptions);
    salesChart.render();

    // Conversion Funnel Chart
    const conversionOptions = {
        ...chartTheme,
        series: [{
            name: 'Conversion',
            data: [100, 75, 45, 20, 15]
        }],
        chart: {
            type: 'bar',
            height: 350,
            ...chartTheme.chart
        },
        plotOptions: {
            bar: {
                borderRadius: 4,
                horizontal: true,
                distributed: true,
                dataLabels: {
                    position: 'bottom'
                }
            }
        },
        dataLabels: {
            enabled: true,
            formatter: function(val, opt) {
                return val + '%';
            },
            style: {
                fontSize: '12px',
                colors: ['#1a1a1a']
            }
        },
        xaxis: {
            categories: ['Views', 'Clicks', 'Add to Cart', 'Checkout', 'Purchase'],
            ...chartTheme.xaxis
        },
        tooltip: {
            y: {
                formatter: function(val) {
                    return val + '%';
                }
            }
        }
    };

    const conversionChart = new ApexCharts(document.querySelector("#conversionChart"), conversionOptions);
    conversionChart.render();

    // Category Chart
    const categoryOptions = {
        ...chartTheme,
        series: [35, 25, 20, 15, 5],
        chart: {
            type: 'donut',
            height: 350,
            ...chartTheme.chart
        },
        labels: ['Clothing', 'Accessories', 'Shoes', 'Bags', 'Other'],
        plotOptions: {
            pie: {
                donut: {
                    size: '65%',
                    labels: {
                        show: true,
                        total: {
                            show: true,
                            label: 'Total Views',
                            formatter: function() {
                                return '45.2K';
                            }
                        }
                    }
                }
            }
        },
        dataLabels: {
            enabled: false
        },
        legend: {
            position: 'bottom',
            offsetY: 0,
            labels: {
                colors: '#1a1a1a'
            }
        }
    };

    const categoryChart = new ApexCharts(document.querySelector("#categoryChart"), categoryOptions);
    categoryChart.render();

    // Store charts for updates
    window.charts = {
        sales: salesChart,
        conversion: conversionChart,
        category: categoryChart
    };
}

// Update charts based on period
function updateCharts(period) {
    // Simulate updating charts with new data
    showNotification(`Analytics updated for ${period}`, 'info');
}

// Show notification
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
        type === 'success' ? 'bg-green-500 text-white' : 
        type === 'error' ? 'bg-red-500 text-white' : 
        'bg-blue-500 text-white'
    }`;
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : 'info-circle'} mr-2"></i>
            ${message}
        </div>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Initialize on load
init();
