// Global variables
let currentConversation = null;
let isTyping = false;
let isMobile = window.innerWidth < 768;
let socket = null;

// DOM elements
const conversationsContainer = document.getElementById('conversationsContainer');
const emptyState = document.getElementById('emptyState');
const chatWindow = document.getElementById('chatWindow');
const noChatSelected = document.getElementById('noChatSelected');
const activeChat = document.getElementById('activeChat');
const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const typingIndicator = document.getElementById('typingIndicator');
const mobileChatWindow = document.getElementById('mobileChatWindow');
const conversationsList = document.getElementById('conversationsList');
const backToList = document.getElementById('backToList');
const searchInput = document.getElementById('searchConversations');

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    initializeSocket();
    loadConversations();
    setupEventListeners();
    checkMobileView();
    
    // If there's a current conversation from backend, load it
    if (window.backendData && window.backendData.currentConversation) {
        currentConversation = window.backendData.currentConversation;
        selectConversation(currentConversation._id);
    } else if (window.backendData && window.backendData.currentConversationId) {
        // If we have a conversation ID but no conversation data, select it
        selectConversation(window.backendData.currentConversationId);
    }
});

// Initialize Socket.IO
function initializeSocket() {
    console.log('Initializing socket connection...');
    socket = io();
    
    socket.on('connect', () => {
        console.log('Socket connected with ID:', socket.id);
    });
    
    socket.on('disconnect', () => {
        console.log('Socket disconnected');
    });
    
    // Join conversation if one is selected
    if (window.backendData && window.backendData.currentConversationId) {
        console.log('Joining conversation on page load:', window.backendData.currentConversationId);
        socket.emit('joinConversation', window.backendData.currentConversationId);
    }
    
    // Listen for new messages
    socket.on('receiveMessage', async (message) => {
        console.log('🔔 User received message via socket. Refreshing conversation list.', message);
        let conv = window.backendData.conversations.find(c => c._id === message.conversationId);
        if (!conv) {
            // Poll the backend for up to 3 seconds to fetch the new conversation
            let found = false;
            for (let i = 0; i < 6; i++) {
                try {
                    const res = await fetch('/dashboard/api/messages');
                    const data = await res.json();
                    if (data.success && data.conversations) {
                        const newConv = data.conversations.find(c => c._id === message.conversationId);
                        if (newConv) {
                            newConv.unreadCount = 1;
                            newConv.lastMessage = message.content;
                            newConv.updatedAt = message.createdAt;
                            window.backendData.conversations.unshift(newConv);
                            conv = newConv;
                            joinAllConversationRooms();
                            console.log('DEBUG: Added new conversation in real time after polling:', newConv);
                            break;
                        }
                    }
                } catch (err) {
                    console.error('Failed to fetch new conversation:', err);
                }
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            if (!conv) {
                console.warn('DEBUG: New conversation not found after polling:', message.conversationId);
            }
        }
        if (currentConversation && message.conversationId === currentConversation._id) {
            addMessageToUI(message, false);
            scrollToBottom();
            markMessagesAsRead(message.conversationId);
            if (conv) conv.unreadCount = 0;
        } else {
            if (conv) conv.unreadCount = (conv.unreadCount || 0) + 1;
        }
        if (conv) {
            conv.lastMessage = message.content;
            conv.updatedAt = message.createdAt;
        }
        renderConversations();
    });
    
    // Listen for typing indicators
    socket.on('typing', (data) => {
        if (data.conversationId === currentConversation?._id && data.sender !== window.backendData.user._id) {
            showTyping();
        }
    });
    
    socket.on('stopTyping', (data) => {
        if (data.conversationId === currentConversation?._id) {
            hideTyping();
        }
    });
}

// Check if mobile view
window.addEventListener('resize', () => {
    isMobile = window.innerWidth < 768;
    checkMobileView();
});

function checkMobileView() {
    if (isMobile) {
        chatWindow.classList.add('hidden');
        if (currentConversation) {
            showMobileChat();
        }
    } else {
        mobileChatWindow.classList.add('hidden');
        chatWindow.classList.remove('hidden');
    }
}

// Load conversations with real backend data
function loadConversations() {
    // Show skeleton loader
    showConversationsSkeleton();
    
    // Use backend data if available
    if (window.backendData && window.backendData.conversations) {
        setTimeout(() => {
            if (window.backendData.conversations.length === 0) {
                conversationsContainer.innerHTML = '';
                emptyState.classList.remove('hidden');
            } else {
                renderConversations();
                emptyState.classList.add('hidden');
                joinAllConversationRooms();
            }
        }, 300);
    } else {
        // Fallback: fetch conversations from API
        fetch('/dashboard/api/messages')
            .then(response => response.json())
            .then(data => {
                if (data.conversations.length === 0) {
                    conversationsContainer.innerHTML = '';
                    emptyState.classList.remove('hidden');
                } else {
                    window.backendData.conversations = data.conversations;
                    renderConversations();
                    emptyState.classList.add('hidden');
                    joinAllConversationRooms();
                }
            })
            .catch(error => {
                console.error('Error loading conversations:', error);
                emptyState.classList.remove('hidden');
            });
    }
}

// Show skeleton loader for conversations
function showConversationsSkeleton() {
    const skeletonHTML = Array(3).fill('').map(() => `
        <div class="p-4 border-b border-beige">
            <div class="flex items-center space-x-3">
                <div class="skeleton w-12 h-12 rounded-full"></div>
                <div class="flex-1">
                    <div class="skeleton h-4 w-32 mb-2 rounded"></div>
                    <div class="skeleton h-3 w-48 rounded"></div>
                </div>
            </div>
        </div>
    `).join('');
    
    conversationsContainer.innerHTML = skeletonHTML;
}

// Render conversations list with real data
function renderConversations() {
    if (!window.backendData || !window.backendData.conversations) return;
    
    conversationsContainer.innerHTML = window.backendData.conversations.map(conv => {
        const seller = conv.seller;
        const avatar = seller?.brandName ? 
            `https://ui-avatars.com/api/?name=${encodeURIComponent(seller.brandName)}&background=B8941F&color=fff` :
            'https://ui-avatars.com/api/?name=Seller&background=E5C547&color=1a1a1a';
        
        const lastMessage = conv.lastMessage || 'No messages yet';
        const timestamp = formatTimestamp(conv.updatedAt);
        const isActive = currentConversation?._id === conv._id;
        
        return `
            <div class="conversation-item p-4 border-b border-beige hover:bg-gold/5 transition-all cursor-pointer ${isActive ? 'active' : ''}" 
                 data-conversation-id="${conv._id}">
                <div class="flex items-center space-x-3">
                    <div class="relative">
                        <img src="${avatar}" alt="${seller?.brandName || 'Seller'}" class="w-12 h-12 rounded-full">
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between mb-1">
                            <h4 class="font-semibold text-charcoal truncate">${seller?.brandName || 'Seller'}</h4>
                            <span class="text-xs text-charcoal whitespace-nowrap ml-2">${timestamp}</span>
                        </div>
                        <p class="text-sm text-charcoal truncate ${conv.unreadCount > 0 ? 'font-medium' : ''}">${lastMessage}</p>
                    </div>
                    ${conv.unreadCount > 0 ? `<div class="w-2 h-2 bg-gold rounded-full flex-shrink-0"></div>` : ''}
                </div>
            </div>
        `;
    }).join('');
    
    // Add click listeners
    document.querySelectorAll('.conversation-item').forEach(item => {
        item.addEventListener('click', () => {
            const convId = item.dataset.conversationId;
            selectConversation(convId);
        });
    });
}

// Format timestamp
function formatTimestamp(dateString) {
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

// Select a conversation
async function selectConversation(conversationId) {
    try {
        // Find conversation in backend data
        const conversation = window.backendData.conversations.find(c => c._id === conversationId);
        if (!conversation) return;
        
        currentConversation = conversation;
        
        // Update active state
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.conversationId === conversationId) {
                item.classList.add('active');
            }
        });
        
        // Join socket room
        console.log('🏠 Joining conversation room:', conversationId);
        socket.emit('joinConversation', conversationId);
        
        // Mark messages as read
        await markMessagesAsRead(conversationId);
        
        if (isMobile) {
            showMobileChat();
        } else {
            showDesktopChat();
        }
        
        loadMessages();
    } catch (error) {
        console.error('Error selecting conversation:', error);
    }
}

// Mark messages as read
async function markMessagesAsRead(conversationId) {
    try {
        await fetch(`/dashboard/messages/${conversationId}/read`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        // Update unread count in backend data
        const conversation = window.backendData.conversations.find(c => c._id === conversationId);
        if (conversation) {
            conversation.unreadCount = 0;
        }
    } catch (error) {
        console.error('Error marking messages as read:', error);
    }
}

// Show desktop chat
function showDesktopChat() {
    noChatSelected.classList.add('hidden');
    activeChat.classList.remove('hidden');
    
    if (!currentConversation) return;
    
    const seller = currentConversation.seller;
    const avatar = seller?.brandName ? 
        `https://ui-avatars.com/api/?name=${encodeURIComponent(seller.brandName)}&background=B8941F&color=fff` :
        'https://ui-avatars.com/api/?name=Seller&background=E5C547&color=1a1a1a';
    
    // Update chat header
    document.getElementById('chatAvatar').src = avatar;
    document.getElementById('chatName').textContent = seller?.brandName || 'Seller';
    document.getElementById('chatStatus').textContent = 'Online';
}

// Show mobile chat
function showMobileChat() {
    if (!currentConversation) return;
    
    const seller = currentConversation.seller;
    const avatar = seller?.brandName ? 
        `https://ui-avatars.com/api/?name=${encodeURIComponent(seller.brandName)}&background=B8941F&color=fff` :
        'https://ui-avatars.com/api/?name=Seller&background=E5C547&color=1a1a1a';
    
    mobileChatWindow.innerHTML = `
        <div class="flex flex-col h-full relative">
            <!-- Chat Header - Fixed at top -->
            <div class="absolute top-0 left-0 right-0 bg-cream p-4 border-b border-beige flex items-center justify-between z-10">
                <div class="flex items-center space-x-3">
                    <button id="mobileBackBtn" class="mr-2 text-charcoal">
                        <i class="fas fa-arrow-left text-xl"></i>
                    </button>
                    <img src="${avatar}" alt="${seller?.brandName || 'Seller'}" class="w-10 h-10 rounded-full">
                    <div>
                        <h3 class="font-semibold text-charcoal">${seller?.brandName || 'Seller'}</h3>
                        <p class="text-xs text-charcoal">Online</p>
                    </div>
                </div>
            </div>
            
            <!-- Messages Container - Scrollable middle section -->
            <div class="flex-1 overflow-y-auto pt-20 pb-20 bg-pearl">
                <div id="mobileMessagesContainer" class="p-4 space-y-4">
                    <!-- Messages will be loaded here -->
                </div>
                
                <!-- Typing Indicator -->
                <div id="mobileTypingIndicator" class="hidden px-4 pb-2">
                    <div class="flex items-center space-x-2">
                        <div class="flex space-x-1">
                            <div class="w-2 h-2 bg-stone rounded-full animate-bounce" style="animation-delay: 0ms"></div>
                            <div class="w-2 h-2 bg-stone rounded-full animate-bounce" style="animation-delay: 150ms"></div>
                            <div class="w-2 h-2 bg-stone rounded-full animate-bounce" style="animation-delay: 300ms"></div>
                        </div>
                        <span class="text-xs text-charcoal">typing...</span>
                    </div>
                </div>
            </div>
            
            <!-- Message Input - Fixed at bottom -->
            <div class="absolute bottom-0 left-0 right-0 bg-cream p-4 border-t border-beige msgInoutButtom">
                <div class="flex items-center space-x-2">
                    <button class="p-2 text-charcoal hover:text-charcoal transition-colors">
                        <i class="fas fa-paperclip text-lg"></i>
                    </button>
                    <div class="flex-1 relative">
                        <input id="mobileMessageInput" 
                               type="text" 
                               placeholder="Type a message..." 
                               class="w-full px-4 py-2 pr-10 bg-pearl rounded-full border border-beige focus:outline-none focus:border-gold text-sm">
                        <button class="absolute right-2 top-1/2 -translate-y-1/2 text-charcoal hover:text-charcoal transition-colors">
                            <i class="fas fa-smile text-lg"></i>
                        </button>
                    </div>
                    <button id="mobileSendButton" class="p-2 bg-gold text-charcoal rounded-full hover:bg-velvra-gold-dark transition-colors">
                        <i class="fas fa-paper-plane text-lg"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    mobileChatWindow.classList.remove('hidden');
    mobileChatWindow.classList.add('slide-in-right');
    // Hide mobile bottom nav when chat is open
    const mobileBottomNav = document.getElementById('mobileBottomNav');
    if (mobileBottomNav) mobileBottomNav.style.display = 'none';
    // Add event listeners for mobile
    document.getElementById('mobileBackBtn').addEventListener('click', hideMobileChat);
    document.getElementById('mobileMessageInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage(true);
    });
    document.getElementById('mobileSendButton').addEventListener('click', () => sendMessage(true));
    
    // Load messages in mobile container
    loadMessages(true);
}

// Hide mobile chat
function hideMobileChat() {
    mobileChatWindow.classList.add('slide-out-right');
    setTimeout(() => {
        mobileChatWindow.classList.add('hidden');
        mobileChatWindow.classList.remove('slide-in-right', 'slide-out-right');
        currentConversation = null;
        renderConversations();
        // Show mobile bottom nav when chat is closed
        const mobileBottomNav = document.getElementById('mobileBottomNav');
        if (mobileBottomNav) mobileBottomNav.style.display = '';
    }, 300);
}

// Load messages for current conversation
async function loadMessages(isMobileView = false) {
    if (!currentConversation) return;
    
    const container = isMobileView ? document.getElementById('mobileMessagesContainer') : messagesContainer;
    
    // Show skeleton loader
    showMessagesSkeleton(container);
    
    try {
        // Fetch messages from API
        const response = await fetch(`/dashboard/messages/${currentConversation._id}/messages`);
        const data = await response.json();
        
        if (data.success) {
            renderMessages(container, data.messages);
            scrollToBottom(container);
        }
    } catch (error) {
        console.error('Error loading messages:', error);
        // Fallback to conversation messages if available
        if (currentConversation.messages) {
            renderMessages(container, currentConversation.messages);
            scrollToBottom(container);
        }
    }
}

// Show messages skeleton
function showMessagesSkeleton(container) {
    const skeletonHTML = Array(3).fill('').map((_, i) => `
        <div class="flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}">
            <div class="skeleton h-12 ${i % 2 === 0 ? 'w-48' : 'w-56'} rounded-2xl"></div>
        </div>
    `).join('');
    
    container.innerHTML = skeletonHTML;
}

// Render messages
function renderMessages(container, messages) {
    if (!messages || messages.length === 0) {
        container.innerHTML = `
            <div class="text-center text-stone py-8">
                <p>No messages yet. Start the conversation!</p>
            </div>
        `;
        return;
    }
    container.innerHTML = messages.map(msg => {
        // Normalize sender ID, which might be a populated object or a string
        const messageSenderId = (typeof msg.sender === 'object' && msg.sender !== null) 
            ? msg.sender._id.toString() 
            : msg.sender.toString();
        
        const currentUserId = window.backendData.user._id.toString();
        const isOwn = msg.senderModel === 'User' && messageSenderId === currentUserId;
        const timestamp = new Date(msg.createdAt).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit', 
            hour12: true 
        });
        return `
            <div class="flex ${isOwn ? 'justify-end' : 'justify-start'} message-appear">
                <div class="max-w-[70%] md:max-w-[60%]">
                    <div class="message-bubble ${isOwn ? 'message-bubble-sent' : 'message-bubble-received'} 
                               px-4 py-2 rounded-2xl mb-1">
                        <p class="text-sm">${msg.content}</p>
                    </div>
                    <div class="flex items-center ${isOwn ? 'justify-end' : 'justify-start'} space-x-2 px-2">
                        <span class="text-xs text-charcoal">${timestamp}</span>
                        ${isOwn ? `
                            <span class="message-status ${msg.isRead ? 'read' : ''}">
                                ${msg.isRead ? '<i class="fas fa-check-double"></i>' : '<i class="fas fa-check"></i>'}
                            </span>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Add message to UI (for real-time updates)
function addMessageToUI(message, isOwn) {
    const container = isMobile ? document.getElementById('mobileMessagesContainer') : messagesContainer;
    const timestamp = new Date(message.createdAt).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
    });
    // Normalize sender ID, which might be a populated object or a string
    const messageSenderId = (typeof message.sender === 'object' && message.sender !== null) 
        ? message.sender._id.toString() 
        : message.sender.toString();

    const currentUserId = window.backendData.user._id.toString();
    const isSender = message.senderModel === 'User' && messageSenderId === currentUserId;
    const messageHTML = `
        <div class="flex ${isSender ? 'justify-end' : 'justify-start'} message-appear">
            <div class="max-w-[70%] md:max-w-[60%]">
                <div class="message-bubble ${isSender ? 'message-bubble-sent' : 'message-bubble-received'} 
                           px-4 py-2 rounded-2xl mb-1">
                    <p class="text-sm">${message.content}</p>
                </div>
                <div class="flex items-center ${isSender ? 'justify-end' : 'justify-start'} space-x-2 px-2">
                    <span class="text-xs text-charcoal">${timestamp}</span>
                    ${isSender ? `
                        <span class="message-status">
                            <i class="fas fa-check"></i>
                        </span>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', messageHTML);
    scrollToBottom(container);
}

// Send message
async function sendMessage(isMobileView = false) {
    const input = isMobileView ? document.getElementById('mobileMessageInput') : messageInput;
    const message = input.value.trim();
    if (!message || !currentConversation) return;
    input.value = '';
    try {
        const response = await fetch(`/dashboard/messages/${currentConversation._id}/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content: message })
        });
        const data = await response.json();
        if (data.success) {
            addMessageToUI(data.message, true);
            // Emit to socket for real-time
            console.log('📤 Emitting message via socket:', {
                conversationId: currentConversation._id,
                sender: window.backendData.user._id,
                senderModel: 'User'
            });
            socket.emit('sendMessage', {
                conversationId: currentConversation._id,
                message: {
                    conversationId: currentConversation._id,
                    sender: window.backendData.user._id,
                    senderModel: 'User',
                    recipient: currentConversation.seller._id,
                    recipientModel: 'Seller',
                    order: currentConversation.order?._id,
                    content: data.message.content,
                    createdAt: data.message.createdAt,
                    _id: data.message._id
                }
            });
        }
    } catch (error) {
        console.error('Error sending message:', error);
        alert('Failed to send message. Please try again.');
    }
}

// Show typing indicator
function showTyping(isMobileView = false) {
    if (isMobileView) {
        document.getElementById('mobileTypingIndicator').classList.remove('hidden');
    } else {
        typingIndicator.classList.remove('hidden');
    }
    isTyping = true;
}

// Hide typing indicator
function hideTyping(isMobileView = false) {
    if (isMobileView) {
        document.getElementById('mobileTypingIndicator').classList.add('hidden');
    } else {
        typingIndicator.classList.add('hidden');
    }
    isTyping = false;
}

// Scroll to bottom of messages
function scrollToBottom(container) {
    const scrollContainer = container.closest('.overflow-y-auto');
    if (scrollContainer) {
        setTimeout(() => {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }, 100);
    }
}

// Setup event listeners
function setupEventListeners() {
    // Desktop message input
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    
    sendButton.addEventListener('click', () => sendMessage());
    
    // Mobile menu toggle
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const closeSidebar = document.getElementById('closeSidebar');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('-translate-x-full');
            sidebarOverlay.classList.toggle('hidden');
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.add('-translate-x-full');
            sidebarOverlay.classList.add('hidden');
        });
    }

    if (closeSidebar) {
        closeSidebar.addEventListener('click', () => {
            sidebar.classList.add('-translate-x-full');
            sidebarOverlay.classList.add('hidden');
        });
    }
    
    // Logout modal
    const logoutBtn = document.getElementById('logoutBtn');
    const logoutModal = document.getElementById('logoutModal');
    const cancelLogout = document.getElementById('cancelLogout');
    const confirmLogout = document.getElementById('confirmLogout');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            logoutModal.classList.remove('hidden');
        });
    }
    
    if (cancelLogout) {
        cancelLogout.addEventListener('click', () => {
            logoutModal.classList.add('hidden');
        });
    }
    
    if (confirmLogout) {
        confirmLogout.addEventListener('click', () => {
            window.location.href = '/logout';
        });
    }
    
    // Search functionality
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const conversations = window.backendData.conversations || [];
            const filtered = conversations.filter(conv => 
                conv.seller?.brandName?.toLowerCase().includes(query) || 
                conv.lastMessage?.toLowerCase().includes(query)
            );
            
            if (filtered.length === 0) {
                conversationsContainer.innerHTML = '<p class="text-center text-charcoal p-8">No conversations found</p>';
            } else {
                // Temporarily update conversations for rendering
                const originalConversations = window.backendData.conversations;
                window.backendData.conversations = filtered;
                renderConversations();
                window.backendData.conversations = originalConversations;
            }
        });
    }

    // Close sidebar when clicking on conversations list area on mobile
    if (conversationsList) {
        conversationsList.addEventListener('click', (e) => {
            // Only close sidebar on mobile and if sidebar is open
            if (window.innerWidth < 1024 && !sidebar.classList.contains('-translate-x-full')) {
                sidebar.classList.add('-translate-x-full');
                sidebarOverlay.classList.add('hidden');
            }
        });
    }
    
    // Typing indicators
    if (messageInput) {
        let typingTimer;
        messageInput.addEventListener('input', () => {
            if (currentConversation) {
                socket.emit('typing', {
                    conversationId: currentConversation._id,
                    sender: window.backendData.user._id
                });
                
                clearTimeout(typingTimer);
                typingTimer = setTimeout(() => {
                    socket.emit('stopTyping', {
                        conversationId: currentConversation._id,
                        sender: window.backendData.user._id
                    });
                }, 1000);
            }
        });
    }
}

function joinAllConversationRooms() {
    if (socket && Array.isArray(window.backendData.conversations)) {
        window.backendData.conversations.forEach(conv => {
            socket.emit('joinConversation', conv._id);
        });
        console.log('DEBUG: Joined all conversation rooms:', window.backendData.conversations.map(c => c._id));
    }
}
