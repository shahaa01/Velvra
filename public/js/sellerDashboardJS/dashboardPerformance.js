
// Global variables
let currentPeriod = 'week';
let charts = {};

// Initialize
function init() {
    setupEventListeners();
    loadAnalyticsData();
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
            currentPeriod = this.dataset.period;
            loadAnalyticsData();
        });
    });

    // Mobile period selector
    const mobilePeriodSelect = document.querySelector('select');
    if (mobilePeriodSelect) {
        mobilePeriodSelect.addEventListener('change', function() {
            currentPeriod = this.value;
            loadAnalyticsData();
        });
    }

    // Export button
    document.getElementById('exportBtn').addEventListener('click', exportData);
}

// Load analytics data from API
async function loadAnalyticsData() {
    try {
        showLoadingState();
        
        const response = await fetch(`/seller-dashboard/analytics/data?period=${currentPeriod}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            updateKPICards(result.data.kpis);
            updateCharts(result.data.charts);
            updateTopProducts(result.data.topProducts);
            updatePerformanceSummary(result.data.performanceSummary);
        } else {
            showNotification('Failed to load analytics data: ' + (result.message || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error loading analytics data:', error);
        showNotification('Error loading analytics data: ' + error.message, 'error');
        
        // Show fallback data or message
        showFallbackData();
    } finally {
        hideLoadingState();
    }
}

// Update KPI cards
function updateKPICards(kpis) {
    // Views
    document.getElementById('totalViews').textContent = kpis.views.value;
    document.getElementById('viewsChange').textContent = `${kpis.views.change.toFixed(1)}%`;
    updateTrendIndicator('viewsTrendIcon', kpis.views.trend, 'viewsChange');

    // Clicks
    document.getElementById('totalClicks').textContent = kpis.clicks.value;
    document.getElementById('clicksChange').textContent = `${kpis.clicks.change.toFixed(1)}%`;
    updateTrendIndicator('clicksTrendIcon', kpis.clicks.trend, 'clicksChange');

    // Sales
    document.getElementById('totalSales').textContent = kpis.sales.value;
    document.getElementById('salesChange').textContent = `${kpis.sales.change.toFixed(1)}%`;
    updateTrendIndicator('salesTrendIcon', kpis.sales.trend, 'salesChange');

    // Return Rate
    document.getElementById('returnRate').textContent = kpis.returnRate.value;
    document.getElementById('returnChange').textContent = `${kpis.returnRate.change.toFixed(1)}%`;
    updateTrendIndicator('returnTrendIcon', kpis.returnRate.trend, 'returnChange');
}

// Update trend indicators
function updateTrendIndicator(iconId, trend, changeId) {
    const icon = document.getElementById(iconId);
    const changeElement = document.getElementById(changeId);
    
    if (trend === 'up') {
        icon.className = 'fas fa-arrow-up trend-up mr-1';
        changeElement.className = 'trend-up font-medium';
    } else {
        icon.className = 'fas fa-arrow-down trend-down mr-1';
        changeElement.className = 'trend-down font-medium';
    }
}

// Update charts
function updateCharts(chartData) {
    updateSalesChart(chartData.salesOverview);
    updateConversionChart(chartData.conversionFunnel);
}

// Update sales overview chart
function updateSalesChart(data) {
    const options = {
        series: [{
            name: 'Revenue',
            type: 'area',
            data: data.revenue
        }, {
            name: 'Orders',
            type: 'line',
            data: data.orders
        }],
        chart: {
            height: 350,
            type: 'line',
            fontFamily: 'Inter, sans-serif',
            toolbar: {
                show: false
            }
        },
        colors: ['#d4af37', '#a8a196'],
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
        labels: data.labels,
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
        yaxis: [{
            title: {
                text: 'Revenue (Rs.)',
                style: {
                    color: '#a8a196'
                }
            },
            labels: {
                style: {
                    colors: '#a8a196',
                    fontSize: '12px'
                }
            }
        }, {
            opposite: true,
            title: {
                text: 'Orders',
                style: {
                    color: '#a8a196'
                }
            },
            labels: {
                style: {
                    colors: '#a8a196',
                    fontSize: '12px'
                }
            }
        }],
        tooltip: {
            shared: true,
            intersect: false,
            y: {
                formatter: function (y, { seriesIndex }) {
                    if (seriesIndex === 0) {
                        return `Rs. ${y.toFixed(0)}`;
                    }
                    return y;
                }
            }
        }
    };

    const salesChartElement = document.querySelector("#salesChart");
    
    if (charts.sales) {
        charts.sales.updateOptions(options);
    } else {
        charts.sales = new ApexCharts(salesChartElement, options);
        charts.sales.render();
    }
}

// Update conversion funnel chart
function updateConversionChart(data) {
    const options = {
        series: [{
            name: 'Conversion',
            data: data.map(item => item.percentage)
        }],
        chart: {
            type: 'bar',
            height: 350,
            fontFamily: 'Inter, sans-serif',
            toolbar: {
                show: false
            }
        },
        colors: ['#d4af37', '#a8a196', '#e8dcc6', '#B8941F', '#8B7355'],
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
            categories: data.map(item => item.stage),
            labels: {
                style: {
                    colors: '#a8a196',
                    fontSize: '12px'
                }
            }
        },
        grid: {
            borderColor: '#e8dcc6',
            strokeDashArray: 0
        },
        tooltip: {
            y: {
                formatter: function(val) {
                    return val + '%';
                }
            }
        }
    };

    const conversionChartElement = document.querySelector("#conversionChart");
    
    if (charts.conversion) {
        charts.conversion.updateOptions(options);
    } else {
        charts.conversion = new ApexCharts(conversionChartElement, options);
        charts.conversion.render();
    }
}

// Update top products
function updateTopProducts(products) {
    const container = document.getElementById('topProductsContainer');
    
    if (products.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-4">No products sold in this period</p>';
        return;
    }

    const productsHTML = products.map(product => `
        <div class="flex items-center justify-between">
            <div class="flex items-center">
                <img src="${product.image || '/images/placeholder-product.jpg'}" 
                     alt="${product.name}" class="w-10 h-10 rounded-lg object-cover mr-3">
                <div>
                    <p class="font-medium text-charcoal text-sm">${product.name}</p>
                    <p class="text-xs text-gray-700">${product.sales} sold</p>
                </div>
            </div>
            <span class="text-sm font-semibold text-charcoal">Rs. ${product.revenue.toLocaleString()}</span>
        </div>
    `).join('');

    container.innerHTML = productsHTML;
}

// Update performance summary
function updatePerformanceSummary(summary) {
    // Average Order Value
    document.getElementById('avgOrderValue').textContent = summary.averageOrderValue.value;
    updateSummaryChange('avgOrderValueChange', summary.averageOrderValue);

    // Conversion Rate
    document.getElementById('conversionRate').textContent = summary.conversionRate.value;
    updateSummaryChange('conversionRateChange', summary.conversionRate);

    // Customer Retention
    document.getElementById('customerRetention').textContent = summary.customerRetention.value;
    updateSummaryChange('customerRetentionChange', summary.customerRetention);

    // Average Rating
    document.getElementById('avgRating').textContent = summary.averageRating.value;
    updateRatingStars(summary.averageRating.stars);
}

// Update summary change indicators
function updateSummaryChange(elementId, data) {
    const element = document.getElementById(elementId);
    const change = data.change || 0;
    const trend = data.trend || 'up';
    
    if (trend === 'up') {
        element.className = 'text-xs text-green-600 mt-1';
        element.textContent = `↑ ${Math.abs(change).toFixed(1)}% vs last period`;
    } else {
        element.className = 'text-xs text-red-600 mt-1';
        element.textContent = `↓ ${Math.abs(change).toFixed(1)}% vs last period`;
    }
}

// Update rating stars
function updateRatingStars(rating) {
    const starsContainer = document.getElementById('ratingStars');
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    let starsHTML = '';
    
    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            starsHTML += '<i class="fas fa-star text-gold"></i>';
        } else if (i === fullStars && hasHalfStar) {
            starsHTML += '<i class="fas fa-star-half-alt text-gold"></i>';
        } else {
            starsHTML += '<i class="far fa-star text-gold"></i>';
        }
    }
    
    starsContainer.innerHTML = starsHTML;
}

// Export data
async function exportData() {
    try {
        const response = await fetch(`/seller-dashboard/analytics/export?period=${currentPeriod}`);
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `seller-analytics-${currentPeriod}-${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            showNotification('Analytics data exported successfully', 'success');
        } else {
            showNotification('Failed to export data', 'error');
        }
    } catch (error) {
        console.error('Error exporting data:', error);
        showNotification('Error exporting data', 'error');
    }
}

// Show loading state
function showLoadingState() {
    // Add loading overlay to charts instead of clearing them
    const chartContainers = document.querySelectorAll('.chart-container');
    chartContainers.forEach(container => {
        // Create loading overlay
        const overlay = document.createElement('div');
        overlay.className = 'absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10';
        overlay.id = 'loading-overlay';
        overlay.innerHTML = '<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>';
        
        // Make container relative for absolute positioning
        container.style.position = 'relative';
        container.appendChild(overlay);
    });
}

// Hide loading state
function hideLoadingState() {
    // Remove loading overlays
    const overlays = document.querySelectorAll('#loading-overlay');
    overlays.forEach(overlay => overlay.remove());
}

// Show fallback data when API fails
function showFallbackData() {
    // Show message in chart containers
    const salesChartContainer = document.querySelector('#salesChart');
    const conversionChartContainer = document.querySelector('#conversionChart');
    
    if (salesChartContainer) {
        salesChartContainer.innerHTML = '<div class="flex items-center justify-center h-full text-gray-500"><p>Please log in as a seller to view analytics data</p></div>';
    }
    
    if (conversionChartContainer) {
        conversionChartContainer.innerHTML = '<div class="flex items-center justify-center h-full text-gray-500"><p>Please log in as a seller to view analytics data</p></div>';
    }
    
    // Show message in top products container
    const topProductsContainer = document.getElementById('topProductsContainer');
    if (topProductsContainer) {
        topProductsContainer.innerHTML = '<p class="text-gray-500 text-center py-4">Please log in as a seller to view top products</p>';
    }
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
document.addEventListener('DOMContentLoaded', init);
