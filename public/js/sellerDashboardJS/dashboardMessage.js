        // Sample messages data
        const messagesData = [
            {
                id: 1,
                buyer: "Emma Johnson",
                subject: "Question about Leather Jacket sizing",
                preview: "Hi, I'm interested in the brown leather jacket but I'm unsure about the sizing...",
                status: "open",
                date: new Date(Date.now() - 2 * 60 * 60 * 1000),
                orderId: "#12345",
                product: "Brown Leather Jacket",
                unread: true,
                messages: [
                    {
                        sender: "buyer",
                        content: "Hi, I'm interested in the brown leather jacket but I'm unsure about the sizing. I'm usually a medium in most brands, but I've heard leather can run small. Could you provide the measurements?",
                        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
                    }
                ]
            },
            {
                id: 2,
                buyer: "Michael Chen",
                subject: "Return request - Damaged item",
                preview: "I received my order today but the handbag has a scratch on the front...",
                status: "open",
                date: new Date(Date.now() - 5 * 60 * 60 * 1000),
                orderId: "#12342",
                product: "Designer Handbag",
                unread: true,
                isComplaint: true,
                messages: [
                    {
                        sender: "buyer",
                        content: "I received my order today but the handbag has a scratch on the front. This is unacceptable for a luxury item. I want to return it for a full refund.",
                        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
                        attachments: ["damage_photo.jpg"]
                    }
                ]
            },
            {
                id: 3,
                buyer: "Sarah Williams",
                subject: "Shipping update request",
                preview: "My order was placed 3 days ago but I haven't received tracking...",
                status: "replied",
                date: new Date(Date.now() - 24 * 60 * 60 * 1000),
                orderId: "#12340",
                product: "Silk Dress",
                messages: [
                    {
                        sender: "buyer",
                        content: "My order was placed 3 days ago but I haven't received tracking information yet. When will it ship?",
                        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000)
                    },
                    {
                        sender: "seller",
                        content: "Hello Sarah, thank you for your order! Your silk dress is being carefully packaged and will ship tomorrow. You'll receive tracking information via email once it's dispatched. Expected delivery is 3-5 business days.",
                        timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000)
                    }
                ]
            },
            {
                id: 4,
                buyer: "David Brown",
                subject: "Excellent product!",
                preview: "Just wanted to say the cashmere sweater is amazing! The quality exceeded...",
                status: "resolved",
                date: new Date(Date.now() - 48 * 60 * 60 * 1000),
                orderId: "#12338",
                product: "Cashmere Sweater",
                messages: [
                    {
                        sender: "buyer",
                        content: "Just wanted to say the cashmere sweater is amazing! The quality exceeded my expectations. Will definitely be ordering more from your store.",
                        timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000)
                    },
                    {
                        sender: "seller",
                        content: "Thank you so much for your kind words, David! We're thrilled you love your cashmere sweater. We'd be grateful if you could leave a review. As a thank you, here's a 10% discount code for your next purchase: VALUED10",
                        timestamp: new Date(Date.now() - 47 * 60 * 60 * 1000)
                    }
                ]
            },
            {
                id: 5,
                buyer: "Lisa Anderson",
                subject: "Custom order inquiry",
                preview: "I love your designs! Do you accept custom orders? I need a dress for...",
                status: "open",
                date: new Date(Date.now() - 3 * 60 * 60 * 1000),
                orderId: null,
                product: null,
                unread: true,
                messages: [
                    {
                        sender: "buyer",
                        content: "I love your designs! Do you accept custom orders? I need a dress for my daughter's wedding in June and would love something in blush pink.",
                        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000)
                    }
                ]
            }
        ];

        // State management
        let currentFilter = 'all';
        let selectedMessageId = null;
        let isLoading = false;

        // DOM elements
        const messagesContainer = document.getElementById('messagesContainer');
        const messagesList = document.getElementById('messagesList');
        const loadingState = document.getElementById('loadingState');
        const emptyState = document.getElementById('emptyState');
        const threadContent = document.getElementById('threadContent');
        const threadDefaultState = document.getElementById('threadDefaultState');
        const replyTextarea = document.getElementById('replyTextarea');
        const sendReplyBtn = document.getElementById('sendReplyBtn');
        const resolveBtn = document.getElementById('resolveBtn');
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const sidebar = document.getElementById('sidebar');
        const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');

        // Mobile menu functionality
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('-translate-x-full');
            mobileMenuOverlay.classList.toggle('hidden');
        });

        mobileMenuOverlay.addEventListener('click', () => {
            sidebar.classList.add('-translate-x-full');
            mobileMenuOverlay.classList.add('hidden');
        });

        // Filter functionality
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                currentFilter = tab.dataset.filter;
                updateFilterTabs();
                renderMessages();
            });
        });

        function updateFilterTabs() {
            document.querySelectorAll('.filter-tab').forEach(tab => {
                if (tab.dataset.filter === currentFilter) {
                    tab.classList.add('bg-gold', 'text-charcoal');
                    tab.classList.remove('text-gray-700', 'hover:bg-beige');
                } else {
                    tab.classList.remove('bg-gold', 'text-charcoal');
                    tab.classList.add('text-gray-700', 'hover:bg-beige');
                }
            });
        }

        // Render messages list
        function renderMessages() {
            const filteredMessages = messagesData.filter(msg => {
                if (currentFilter === 'all') return true;
                return msg.status === currentFilter;
            });

            if (filteredMessages.length === 0) {
                messagesList.classList.add('hidden');
                emptyState.classList.remove('hidden');
                return;
            }

            messagesList.classList.remove('hidden');
            emptyState.classList.add('hidden');

            messagesList.innerHTML = filteredMessages.map(msg => `
                <div class="message-row bg-cream rounded-lg p-4 border border-beige cursor-pointer hover:border-gold transition-all ${msg.unread ? 'border-l-4 border-l-gold' : ''}" data-message-id="${msg.id}">
                    <div class="flex items-start justify-between mb-2">
                        <h4 class="font-medium text-charcoal ${msg.unread ? 'font-semibold' : ''}">${msg.buyer}</h4>
                        <span class="text-xs text-gray-700">${formatTime(msg.date)}</span>
                    </div>
                    <p class="text-sm text-charcoal font-medium mb-1">${msg.subject}</p>
                    <p class="text-sm text-gray-700 line-clamp-2">${msg.preview}</p>
                    <div class="flex items-center justify-between mt-3">
                        <span class="status-badge text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(msg.status)}">
                            ${msg.status.charAt(0).toUpperCase() + msg.status.slice(1)}
                        </span>
                        ${msg.isComplaint ? '<i class="fas fa-exclamation-triangle text-yellow-600"></i>' : ''}
                    </div>
                </div>
            `).join('');

            // Add click handlers
            document.querySelectorAll('.message-row').forEach(row => {
                row.addEventListener('click', () => {
                    const messageId = parseInt(row.dataset.messageId);
                    selectMessage(messageId);
                });
            });
        }

        // Select and display message thread
        function selectMessage(messageId) {
            selectedMessageId = messageId;
            const message = messagesData.find(m => m.id === messageId);
            
            if (!message) return;

            // Mark as read
            message.unread = false;
            renderMessages();

            // Show thread content
            threadDefaultState.classList.add('hidden');
            threadContent.classList.remove('hidden');

            // Update thread header
            document.getElementById('threadTitle').textContent = message.buyer;
            document.getElementById('threadSubject').textContent = message.subject;
            document.getElementById('threadOrderInfo').textContent = message.orderId ? `Order: ${message.orderId} - ${message.product}` : 'General Inquiry';
            
            const statusEl = document.getElementById('threadStatus');
            statusEl.textContent = message.status.charAt(0).toUpperCase() + message.status.slice(1);
            statusEl.className = `text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(message.status)}`;

            // Update resolve button
            resolveBtn.style.display = message.status === 'resolved' ? 'none' : 'block';

            // Render messages
            renderThreadMessages(message);
        }

        // Render thread messages
        function renderThreadMessages(message) {
            const container = document.getElementById('messagesScrollContainer');
            
            container.innerHTML = message.messages.map(msg => `
                <div class="flex ${msg.sender === 'seller' ? 'justify-end' : 'justify-start'} fade-in">
                    <div class="max-w-lg">
                        <div class="flex items-end gap-2 ${msg.sender === 'seller' ? 'flex-row-reverse' : ''}">
                            <img src="https://ui-avatars.com/api/?name=${msg.sender === 'seller' ? 'Fashion+Hub' : message.buyer}&background=${msg.sender === 'seller' ? 'd4af37' : 'a8a196'}&color=${msg.sender === 'seller' ? '1a1a1a' : 'ffffff'}" 
                                alt="${msg.sender}" 
                                class="w-8 h-8 rounded-full">
                            <div class="${msg.sender === 'seller' ? 'bg-gold text-charcoal' : 'bg-white'} px-4 py-3 rounded-lg ${msg.sender === 'seller' ? 'rounded-br-none' : 'rounded-bl-none'} shadow-sm">
                                <p class="text-sm">${msg.content}</p>
                                ${msg.attachments ? `
                                    <div class="mt-2 space-y-1">
                                        ${msg.attachments.map(att => `
                                            <div class="flex items-center gap-2 text-xs ${msg.sender === 'seller' ? 'text-charcoal/70' : 'text-gray-700'}">
                                                <i class="fas fa-paperclip"></i>
                                                <span>${att}</span>
                                            </div>
                                        `).join('')}
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                        <p class="text-xs text-gray-700 mt-1 ${msg.sender === 'seller' ? 'text-right' : ''}">${formatTime(msg.timestamp)}</p>
                    </div>
                </div>
            `).join('');
            
            // Scroll to bottom
            container.scrollTop = container.scrollHeight;
        }

        // Send reply functionality
        sendReplyBtn.addEventListener('click', sendReply);
        replyTextarea.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendReply();
            }
        });

        function sendReply() {
            const content = replyTextarea.value.trim();
            if (!content || !selectedMessageId) return;

            const message = messagesData.find(m => m.id === selectedMessageId);
            if (!message) return;

            // Disable send button and show loading
            sendReplyBtn.disabled = true;
            sendReplyBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Sending...';

            // Simulate sending
            setTimeout(() => {
                // Add reply to messages
                message.messages.push({
                    sender: 'seller',
                    content: content,
                    timestamp: new Date()
                });

                // Update status
                if (message.status === 'open') {
                    message.status = 'replied';
                }

                // Clear textarea
                replyTextarea.value = '';

                // Re-render
                renderThreadMessages(message);
                renderMessages();

                // Reset button
                sendReplyBtn.disabled = false;
                sendReplyBtn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i>Send Reply';

                // Show success indicator
                showNotification('Reply sent successfully!');
            }, 1000);
        }

        // Resolve functionality
        resolveBtn.addEventListener('click', () => {
            if (!selectedMessageId) return;

            const message = messagesData.find(m => m.id === selectedMessageId);
            if (!message) return;

            // Update status
            message.status = 'resolved';
            
            // Add system message
            message.messages.push({
                sender: 'system',
                content: 'This conversation has been marked as resolved.',
                timestamp: new Date()
            });

            // Re-render
            renderThreadMessages(message);
            renderMessages();
            resolveBtn.style.display = 'none';

            showNotification('Conversation marked as resolved');
        });

        // Mark all as read
        document.getElementById('markAllReadBtn').addEventListener('click', () => {
            messagesData.forEach(msg => msg.unread = false);
            renderMessages();
            showNotification('All messages marked as read');
        });

        // Utility functions
        function formatTime(date) {
            const now = new Date();
            const diff = now - date;
            const minutes = Math.floor(diff / 60000);
            const hours = Math.floor(diff / 3600000);
            const days = Math.floor(diff / 86400000);

            if (minutes < 60) return `${minutes}m ago`;
            if (hours < 24) return `${hours}h ago`;
            if (days < 7) return `${days}d ago`;
            return date.toLocaleDateString();
        }

        function getStatusColor(status) {
            switch (status) {
                case 'open':
                    return 'bg-yellow-100 text-yellow-800';
                case 'replied':
                    return 'bg-blue-100 text-blue-800';
                case 'resolved':
                    return 'bg-green-100 text-green-800';
                default:
                    return 'bg-gray-100 text-gray-800';
            }
        }

        function showNotification(message) {
            const notification = document.createElement('div');
            notification.className = 'fixed bottom-4 right-4 bg-charcoal text-pearl px-6 py-3 rounded-lg shadow-lg z-50 fade-in';
            notification.innerHTML = `
                <div class="flex items-center gap-2">
                    <i class="fas fa-check-circle text-green-400"></i>
                    <span>${message}</span>
                </div>
            `;
            document.body.appendChild(notification);

            setTimeout(() => {
                notification.style.opacity = '0';
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }

        // Simulate loading state
        function simulateLoading() {
            loadingState.classList.remove('hidden');
            messagesList.classList.add('hidden');
            
            setTimeout(() => {
                loadingState.classList.add('hidden');
                renderMessages();
            }, 1000);
        }

        // Initialize
        renderMessages();

        // Simulate new message arrival
        setTimeout(() => {
            const newMessage = {
                id: 6,
                buyer: "Alex Thompson",
                subject: "Bulk order inquiry",
                preview: "Hi, I'm interested in placing a bulk order for my boutique...",
                status: "open",
                date: new Date(),
                orderId: null,
                product: null,
                unread: true,
                messages: [
                    {
                        sender: "buyer",
                        content: "Hi, I'm interested in placing a bulk order for my boutique. Do you offer wholesale prices?",
                        timestamp: new Date()
                    }
                ]
            };
            
            messagesData.unshift(newMessage);
            renderMessages();
            
            // Update notification badge
            const badge = document.querySelector('.bg-red-500');
            if (badge) {
                const count = messagesData.filter(m => m.unread).length;
                badge.textContent = count;
            }
            
            showNotification('New message received!');
        }, 5000);

        // Error simulation
        window.addEventListener('error', (e) => {
            console.error('Error occurred:', e);
            showNotification('An error occurred. Please try again.');
        });