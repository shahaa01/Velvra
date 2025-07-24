// Mobile menu toggle
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const sidebar = document.getElementById('sidebar');
const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');

mobileMenuBtn.addEventListener('click', () => {
    sidebar.classList.toggle('-translate-x-full');
    mobileMenuOverlay.classList.toggle('hidden');
});

mobileMenuOverlay.addEventListener('click', () => {
    sidebar.classList.add('-translate-x-full');
    mobileMenuOverlay.classList.add('hidden');
});

// Chart functionality
let salesChart = null;
let currentPeriod = '7';

// Initialize chart
function initializeChart() {
    const ctx = document.getElementById('salesChart').getContext('2d');
    
    // Get initial data
    const initialData = window.chartData['7'];
    
    salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: initialData.labels,
            datasets: [{
                label: 'Sales',
                data: initialData.values,
                borderColor: '#d4af37',
                backgroundColor: 'rgba(212, 175, 55, 0.1)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#d4af37',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 750,
                easing: 'easeInOutQuart'
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#1a1a1a',
                    titleColor: '#d4af37',
                    bodyColor: '#fff',
                    borderColor: '#d4af37',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return '₹' + context.parsed.y.toLocaleString();
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#a8a196',
                        font: {
                            size: 11
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#e8dcc6',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#a8a196',
                        font: {
                            size: 11
                        },
                        callback: function(value) {
                            return '₹' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

// Update chart with new data
function updateChart(period) {
    if (!salesChart) return;
    
    const newData = window.chartData[period];
    if (!newData) return;
    
    // Add loading state
    const chartContainer = document.querySelector('.chart-container');
    chartContainer.style.opacity = '0.7';
    
    // Update chart data with smooth transition
    salesChart.data.labels = newData.labels;
    salesChart.data.datasets[0].data = newData.values;
    
    // Update chart with animation
    salesChart.update('active');
    
    // Remove loading state after animation
    setTimeout(() => {
        chartContainer.style.opacity = '1';
    }, 750);
    
    currentPeriod = period;
}

// Handle period selection change
function handlePeriodChange() {
    const periodSelect = document.getElementById('chartPeriodSelect');
    if (!periodSelect) return;
    
    periodSelect.addEventListener('change', function() {
        const selectedPeriod = this.value;
        if (selectedPeriod !== currentPeriod) {
            updateChart(selectedPeriod);
        }
    });
}

// Fetch chart data from API (fallback method)
async function fetchChartData(period) {
    try {
        const response = await fetch(`/seller-dashboard/api/chart-data/${period}`);
        const result = await response.json();
        
        if (result.success) {
            // Update the global chart data
            window.chartData[period] = {
                labels: result.data.labels,
                values: result.data.values
            };
            
            // Update chart if this is the current period
            if (period === currentPeriod) {
                updateChart(period);
            }
        }
    } catch (error) {
        console.error('Error fetching chart data:', error);
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize chart
    initializeChart();
    
    // Set up period change handler
    handlePeriodChange();
    
    // Pre-fetch data for other periods to ensure smooth transitions
    if (window.chartData) {
        // Fetch 30 and 90 days data if not already available
        if (!window.chartData['30']) {
            fetchChartData('30');
        }
        if (!window.chartData['90']) {
            fetchChartData('90');
        }
    }
});

// Simulate loading states
window.addEventListener('load', () => {
    // Add any additional initialization here
    console.log('Dashboard loaded successfully');
});
