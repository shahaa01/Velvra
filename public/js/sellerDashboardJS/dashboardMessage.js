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
        let conversations = [];
        let currentConversation = null;
        let currentMessages = [];
        let socket = null;
        let isLoading = false;
        let selectedConversationId = null;
        let currentFilter = 'all';
        let sellerId = null;

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

        // Initialize
        window.addEventListener('DOMContentLoaded', () => {
            initializeSocket();
            loadConversations();
            setupUIEvents();
            fetch('/seller-dashboard/profile').then(res => res.json()).then(data => { sellerId = data.sellerId; });
        });

        function initializeSocket() {
            socket = io();
            // Listen for real-time messages
            socket.on('receiveMessage', async (message) => {
                console.log('🔔 Seller received message via socket. Refreshing conversation list.', message);
                let conv = conversations.find(c => c._id === message.conversationId);
                if (currentConversation && message.conversationId === currentConversation._id) {
                    currentMessages.push(message);
                    renderThreadMessages();
                    scrollToBottom();
                    // Mark as read on the server
                    fetch(`/seller-dashboard/api/messages/${message.conversationId}/read`, { method: 'POST' });
                    if (conv) conv.unreadCount = 0;
                } else {
                    if (conv) {
                        conv.unreadCount = (conv.unreadCount || 0) + 1;
                        conv.lastMessage = message.content;
                        conv.updatedAt = message.createdAt;
                        upsertConversation(conv);
                        console.log('DEBUG: Updated existing conversation in real time:', conv);
                        renderMessagesList();
                    } else {
                        // Fetch the new conversation from the server and add it
                        try {
                            const res = await fetch(`/seller-dashboard/api/messages`);
                            const data = await res.json();
                            if (data.success && data.conversations) {
                                const newConv = data.conversations.find(c => c._id === message.conversationId);
                                if (newConv) {
                                    newConv.unreadCount = 1;
                                    newConv.lastMessage = message.content;
                                    newConv.updatedAt = message.createdAt;
                                    upsertConversation(newConv);
                                    console.log('DEBUG: Added new conversation in real time:', newConv);
                                    renderMessagesList();
                                    // Join the new conversation room
                                    socket.emit('joinConversation', newConv._id);
                                } else {
                                    console.warn('DEBUG: New conversation not found in API response:', message.conversationId);
                                }
                            } else {
                                console.warn('DEBUG: API did not return conversations:', data);
                            }
                        } catch (err) {
                            console.error('Failed to fetch new conversation:', err);
                        }
                    }
                }
                // Debug: log conversations and check DOM
                console.log('Sidebar conversations:', conversations.map(c => ({id: c._id, unread: c.unreadCount, last: c.lastMessage})));
                setTimeout(() => {
                    document.querySelectorAll('.message-row.unread-debug').forEach(row => {
                        const style = window.getComputedStyle(row);
                        console.log('DEBUG: Row', row.dataset.conversationId, 'borderLeftWidth:', style.borderLeftWidth, 'borderLeftColor:', style.borderLeftColor, 'background:', style.backgroundColor);
                    });
                }, 100);
            });
        }

        function loadConversations() {
            isLoading = true;
            showLoadingState();
            fetch('/seller-dashboard/api/messages')
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        conversations = data.conversations;
                        renderMessagesList();
                        joinAllConversationRooms();
                    } else {
                        conversations = [];
                        renderMessagesList();
                    }
                })
                .catch(() => {
                    conversations = [];
                    renderMessagesList();
                })
                .finally(() => {
                    isLoading = false;
                });
        }

        function showLoadingState() {
            loadingState.classList.remove('hidden');
            messagesList.classList.add('hidden');
            emptyState.classList.add('hidden');
        }

        function renderMessagesList() {
            loadingState.classList.add('hidden');
            let filtered = conversations;

            if (!filtered || !filtered.length) {
                messagesList.classList.add('hidden');
                emptyState.classList.remove('hidden');
                return;
            }

            messagesList.classList.remove('hidden');
            emptyState.classList.add('hidden');
            messagesList.innerHTML = filtered.map(conv => {
                // Safeguard against null user
                const user = conv.user || {}; 
                const avatar = user.firstName ?
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(user.firstName + ' ' + (user.lastName || ''))}&background=a8a196&color=fff` :
                    'https://ui-avatars.com/api/?name=User&background=a8a196&color=fff';
                const lastMessage = conv.lastMessage || 'No messages yet';
                const timestamp = formatTime(conv.updatedAt);
                const isUnread = conv.unreadCount > 0;
                return `
                    <div class="message-row bg-cream rounded-lg p-4 border border-beige cursor-pointer hover:border-gold transition-all ${isUnread ? 'border-l-4 border-l-gold unread-debug' : ''}" data-conversation-id="${conv._id}" style="${isUnread ? 'background:#fffbe6;' : ''}">
                        <div class="flex items-start justify-between mb-2">
                            <h4 class="font-medium text-charcoal ${isUnread ? 'font-semibold' : ''}">${user.firstName} ${user.lastName || ''}</h4>
                            <span class="text-xs text-gray-700">${timestamp}</span>
                        </div>
                        <p class="text-sm text-charcoal font-medium mb-1">${lastMessage}</p>
                        <div class="flex items-center justify-between mt-3">
                            <span class="status-badge text-xs px-2 py-1 rounded-full font-medium bg-beige text-charcoal">Chat</span>
                            ${conv.order ? `<span class="text-xs text-gray-700">Order: ${conv.order.orderNumber || conv.order._id}</span>` : ''}
                        </div>
                    </div>
                `;
            }).join('');
            // Add click handlers
            document.querySelectorAll('.message-row').forEach(row => {
                row.addEventListener('click', () => {
                    const conversationId = row.dataset.conversationId;
                    selectConversation(conversationId);
                });
            });
            // Debug: force repaint and log computed style
            requestAnimationFrame(() => {
                document.querySelectorAll('.message-row.unread-debug').forEach(row => {
                    row.classList.add('force-repaint');
                    const style = window.getComputedStyle(row);
                    console.log('DEBUG: Row', row.dataset.conversationId, 'borderLeftWidth:', style.borderLeftWidth, 'borderLeftColor:', style.borderLeftColor, 'background:', style.backgroundColor);
                });
            });
        }

        function selectConversation(conversationId) {
            selectedConversationId = conversationId;
            currentConversation = conversations.find(c => c._id === conversationId);
            if (!currentConversation) return;
            // Join socket room
            socket.emit('joinConversation', conversationId);
            // Mark as read
            fetch(`/seller-dashboard/api/messages/${conversationId}/read`, { method: 'POST' });
            // Show thread
            threadDefaultState.classList.add('hidden');
            threadContent.classList.remove('hidden');
            // Load messages
            loadMessages(conversationId);
            // Update thread header
            const user = currentConversation.user;
            document.getElementById('threadTitle').textContent = user.firstName + ' ' + (user.lastName || '');
            document.getElementById('threadSubject').textContent = currentConversation.lastMessage || '';
            document.getElementById('threadOrderInfo').textContent = currentConversation.order ? `Order: ${currentConversation.order.orderNumber || currentConversation.order._id}` : 'General Inquiry';
            document.getElementById('threadStatus').textContent = 'Active';
            document.getElementById('threadStatus').className = 'text-xs px-2 py-1 rounded-full font-medium bg-gold text-charcoal';
            resolveBtn.style.display = 'block';
        }

        function loadMessages(conversationId) {
            messagesScrollContainer().innerHTML = '';
            fetch(`/seller-dashboard/api/messages/${conversationId}/messages`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        currentMessages = data.messages;
                        renderThreadMessages();
                        scrollToBottom();
                    } else {
                        currentMessages = [];
                        renderThreadMessages();
                    }
                })
                .catch(() => {
                    currentMessages = [];
                    renderThreadMessages();
                });
        }

        function renderThreadMessages() {
            const container = messagesScrollContainer();
            if (!currentMessages.length) {
                container.innerHTML = `<div class="text-center text-gray-700 py-8">No messages yet. Start the conversation!</div>`;
                return;
            }
            container.innerHTML = currentMessages.map(msg => {
                const messageSenderId = (typeof msg.sender === 'object' && msg.sender !== null) 
                    ? msg.sender._id.toString() 
                    : msg.sender.toString();

                const currentSellerId = sellerId?.toString();
                const isOwn = msg.senderModel === 'Seller' && messageSenderId === currentSellerId;
                const user = currentConversation.user || {};
                const avatar = isOwn
                    ? `https://ui-avatars.com/api/?name=Seller&background=d4af37&color=1a1a1a`
                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.firstName + ' ' + (user.lastName || ''))}&background=a8a196&color=fff`;
                const timestamp = formatTime(msg.createdAt);
                return `
                    <div class="flex ${isOwn ? 'justify-end' : 'justify-start'} fade-in">
                        <div class="max-w-lg">
                            <div class="flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : ''}">
                                <img src="${avatar}" alt="${isOwn ? 'Seller' : (user.firstName || 'User')}" class="w-8 h-8 rounded-full">
                                <div class="${isOwn ? 'bg-gold text-charcoal' : 'bg-white'} px-4 py-3 rounded-lg ${isOwn ? 'rounded-br-none' : 'rounded-bl-none'} shadow-sm">
                                    <p class="text-sm">${msg.content}</p>
                                </div>
                            </div>
                            <p class="text-xs text-gray-700 mt-1 ${isOwn ? 'text-right' : ''}">${timestamp}</p>
                        </div>
                    </div>
                `;
            }).join('');
        }

        function messagesScrollContainer() {
            return document.getElementById('messagesScrollContainer');
        }

        function sendReply() {
            const content = replyTextarea.value.trim();
            if (!content || !selectedConversationId) return;
            sendReplyBtn.disabled = true;
            sendReplyBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Sending...';
            fetch(`/seller-dashboard/api/messages/${selectedConversationId}/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        // Optimistically add to UI
                        currentMessages.push(data.message);
                        renderThreadMessages();
                        scrollToBottom();
                        // Emit to socket for real-time delivery to user
                        console.log('📤 Seller emitting message via socket:', {
                            conversationId: selectedConversationId,
                            sender: sellerId,
                            senderModel: 'Seller',
                            content: data.message.content
                        });
                        socket.emit('sendMessage', {
                            conversationId: selectedConversationId,
                            message: {
                                conversationId: selectedConversationId,
                                sender: sellerId,
                                senderModel: 'Seller',
                                content: data.message.content,
                                createdAt: data.message.createdAt,
                                _id: data.message._id
                            }
                        });
                        replyTextarea.value = '';
                        // Refresh conversations list to update last message
                        loadConversations();
                    } else {
                        showNotification('Failed to send message');
                    }
                })
                .catch(() => {
                    showNotification('Failed to send message');
                })
                .finally(() => {
                    sendReplyBtn.disabled = false;
                    sendReplyBtn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i>Send Reply';
                });
        }

        function scrollToBottom() {
            const container = messagesScrollContainer();
            setTimeout(() => {
                container.scrollTop = container.scrollHeight;
            }, 100);
        }

        function formatTime(dateString) {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);
            if (diffMins < 1) return 'Just now';
            if (diffMins < 60) return `${diffMins}m ago`;
            if (diffHours < 24) return `${diffHours}h ago`;
            if (diffDays < 7) return `${diffDays}d ago`;
            return date.toLocaleDateString();
        }

        function showNotification(message) {
            // Simple notification (replace with your own if needed)
            alert(message);
        }

        function setupUIEvents() {
            // Mobile menu functionality
            if (mobileMenuBtn) {
                mobileMenuBtn.addEventListener('click', () => {
                    sidebar.classList.toggle('-translate-x-full');
                    mobileMenuOverlay.classList.toggle('hidden');
                });
            }
            if (mobileMenuOverlay) {
                mobileMenuOverlay.addEventListener('click', () => {
                    sidebar.classList.add('-translate-x-full');
                    mobileMenuOverlay.classList.add('hidden');
                });
            }
            // Filter functionality (if you want to implement status filtering)
            document.querySelectorAll('.filter-tab').forEach(tab => {
                tab.addEventListener('click', () => {
                    currentFilter = tab.dataset.filter;
                    renderMessagesList();
                });
            });
            // Send reply
            if (sendReplyBtn) {
                sendReplyBtn.addEventListener('click', sendReply);
            }
            if (replyTextarea) {
                replyTextarea.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendReply();
                    }
                });
            }
            // Mark all as read
            const markAllReadBtn = document.getElementById('markAllReadBtn');
            if (markAllReadBtn) {
                markAllReadBtn.addEventListener('click', () => {
                    Promise.all(conversations.map(conv =>
                        fetch(`/seller-dashboard/api/messages/${conv._id}/read`, { method: 'POST' })
                    )).then(() => {
                        loadConversations();
                        showNotification('All messages marked as read');
                    });
                });
            }
        }

        // Utility: update or insert conversation by _id
        function upsertConversation(convObj) {
            const idx = conversations.findIndex(c => c._id === convObj._id);
            if (idx !== -1) {
                conversations[idx] = { ...conversations[idx], ...convObj };
            } else {
                conversations.unshift(convObj);
            }
        }

        function joinAllConversationRooms() {
            if (socket && Array.isArray(conversations)) {
                conversations.forEach(conv => {
                    socket.emit('joinConversation', conv._id);
                });
                console.log('DEBUG: Joined all conversation rooms:', conversations.map(c => c._id));
            }
        }