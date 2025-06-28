// Mock data for conversations and messages
const mockConversations = [
    {
        id: 1,
        name: "Luxury Boutique",
        avatar: "https://ui-avatars.com/api/?name=Luxury+Boutique&background=B8941F&color=fff",
        lastMessage: "Your order has been shipped! Track it here...",
        timestamp: "2 min ago",
        unread: true,
        online: true,
        messages: [
            {
                id: 1,
                sender: "them",
                text: "Hello! Thank you for your purchase of the Cashmere Sweater.",
                timestamp: "10:30 AM",
                status: "read"
            },
            {
                id: 2,
                sender: "me",
                text: "Hi! When will it be shipped?",
                timestamp: "10:32 AM",
                status: "read"
            },
            {
                id: 3,
                sender: "them",
                text: "Great news! We're preparing your order now. It should ship within 24 hours.",
                timestamp: "10:35 AM",
                status: "read"
            },
            {
                id: 4,
                sender: "them",
                text: "Your order has been shipped! Track it here: VLV-TRACK-12345",
                timestamp: "2:15 PM",
                status: "read"
            }
        ]
    },
    {
        id: 2,
        name: "Sophia Chen",
        avatar: "https://ui-avatars.com/api/?name=Sophia+Chen&background=E5C547&color=1a1a1a",
        lastMessage: "The silk scarf you asked about is back in stock!",
        timestamp: "1 hour ago",
        unread: true,
        online: false,
        messages: [
            {
                id: 1,
                sender: "me",
                text: "Hi Sophia, do you have the limited edition silk scarf in navy?",
                timestamp: "Yesterday 3:00 PM",
                status: "read"
            },
            {
                id: 2,
                sender: "them",
                text: "Hello! Let me check our inventory for you.",
                timestamp: "Yesterday 3:05 PM",
                status: "read"
            },
            {
                id: 3,
                sender: "them",
                text: "I'm sorry, we're currently out of stock in navy. Would you like me to notify you when it's available?",
                timestamp: "Yesterday 3:10 PM",
                status: "read"
            },
            {
                id: 4,
                sender: "me",
                text: "Yes please! That would be great.",
                timestamp: "Yesterday 3:12 PM",
                status: "read"
            },
            {
                id: 5,
                sender: "them",
                text: "The silk scarf you asked about is back in stock!",
                timestamp: "1 hour ago",
                status: "delivered"
            }
        ]
    },
    {
        id: 3,
        name: "Customer Support",
        avatar: "https://ui-avatars.com/api/?name=Customer+Support&background=d4af37&color=1a1a1a",
        lastMessage: "We've processed your return request. The refund will...",
        timestamp: "Yesterday",
        unread: false,
        online: true,
        messages: [
            {
                id: 1,
                sender: "me",
                text: "I need to return an item I purchased last week.",
                timestamp: "Yesterday 10:00 AM",
                status: "read"
            },
            {
                id: 2,
                sender: "them",
                text: "I'm sorry to hear that. Could you please provide your order number?",
                timestamp: "Yesterday 10:05 AM",
                status: "read"
            },
            {
                id: 3,
                sender: "me",
                text: "Order #VLV-2024-8912",
                timestamp: "Yesterday 10:07 AM",
                status: "read"
            },
            {
                id: 4,
                sender: "them",
                text: "Thank you. I see your order for the Designer Handbag. May I ask the reason for the return?",
                timestamp: "Yesterday 10:10 AM",
                status: "read"
            },
            {
                id: 5,
                sender: "me",
                text: "The color doesn't match what was shown on the website.",
                timestamp: "Yesterday 10:12 AM",
                status: "read"
            },
            {
                id: 6,
                sender: "them",
                text: "We've processed your return request. The refund will be issued within 5-7 business days.",
                timestamp: "Yesterday 10:20 AM",
                status: "read"
            }
        ]
    }
];

// Global variables
let currentConversation = null;
let isTyping = false;
let isMobile = window.innerWidth < 768;

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

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    loadConversations();
    setupEventListeners();
    checkMobileView();
});

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

// Load conversations with skeleton loader
function loadConversations() {
    // Show skeleton loader
    showConversationsSkeleton();
    
    // Simulate loading delay
    setTimeout(() => {
        if (mockConversations.length === 0) {
            conversationsContainer.innerHTML = '';
            emptyState.classList.remove('hidden');
        } else {
            renderConversations();
            emptyState.classList.add('hidden');
        }
    }, 800);
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

// Render conversations list
function renderConversations() {
    conversationsContainer.innerHTML = mockConversations.map(conv => `
        <div class="conversation-item p-4 border-b border-beige hover:bg-gold/5 transition-all cursor-pointer ${currentConversation?.id === conv.id ? 'active' : ''}" 
             data-conversation-id="${conv.id}">
            <div class="flex items-center space-x-3">
                <div class="relative">
                    <img src="${conv.avatar}" alt="${conv.name}" class="w-12 h-12 rounded-full">
                    ${conv.online ? '<div class="online-indicator"></div>' : ''}
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between mb-1">
                        <h4 class="font-semibold text-charcoal truncate">${conv.name}</h4>
                        <span class="text-xs text-charcoal whitespace-nowrap ml-2">${conv.timestamp}</span>
                    </div>
                    <p class="text-sm text-charcoal truncate ${conv.unread ? 'font-medium' : ''}">${conv.lastMessage}</p>
                </div>
                ${conv.unread ? '<div class="w-2 h-2 bg-gold rounded-full flex-shrink-0"></div>' : ''}
            </div>
        </div>
    `).join('');
    
    // Add click listeners
    document.querySelectorAll('.conversation-item').forEach(item => {
        item.addEventListener('click', () => {
            const convId = parseInt(item.dataset.conversationId);
            selectConversation(convId);
        });
    });
}

// Select a conversation
function selectConversation(conversationId) {
    currentConversation = mockConversations.find(c => c.id === conversationId);
    
    if (!currentConversation) return;
    
    // Update active state
    document.querySelectorAll('.conversation-item').forEach(item => {
        item.classList.remove('active');
        if (parseInt(item.dataset.conversationId) === conversationId) {
            item.classList.add('active');
        }
    });
    
    // Mark as read
    currentConversation.unread = false;
    renderConversations();
    
    if (isMobile) {
        showMobileChat();
    } else {
        showDesktopChat();
    }
    
    loadMessages();
}

// Show desktop chat
function showDesktopChat() {
    noChatSelected.classList.add('hidden');
    activeChat.classList.remove('hidden');
    
    // Update chat header
    document.getElementById('chatAvatar').src = currentConversation.avatar;
    document.getElementById('chatName').textContent = currentConversation.name;
    document.getElementById('chatStatus').textContent = currentConversation.online ? 'Active now' : 'Offline';
}

// Show mobile chat
function showMobileChat() {
    mobileChatWindow.innerHTML = `
        <div class="flex flex-col h-full relative">
            <!-- Chat Header - Fixed at top -->
            <div class="absolute top-0 left-0 right-0 bg-cream p-4 border-b border-beige flex items-center justify-between z-10">
                <div class="flex items-center space-x-3">
                    <button id="mobileBackBtn" class="mr-2 text-charcoal">
                        <i class="fas fa-arrow-left text-xl"></i>
                    </button>
                    <img src="${currentConversation.avatar}" alt="${currentConversation.name}" class="w-10 h-10 rounded-full">
                    <div>
                        <h3 class="font-semibold text-charcoal">${currentConversation.name}</h3>
                        <p class="text-xs text-charcoal">${currentConversation.online ? 'Active now' : 'Offline'}</p>
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
            <div class="absolute bottom-0 left-0 right-0 bg-cream p-4 border-t border-beige z-10">
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
    }, 300);
}

// Load messages for current conversation
function loadMessages(isMobileView = false) {
    const container = isMobileView ? document.getElementById('mobileMessagesContainer') : messagesContainer;
    
    // Show skeleton loader
    showMessagesSkeleton(container);
    
    // Simulate loading delay
    setTimeout(() => {
        renderMessages(container);
        scrollToBottom(container);
    }, 500);
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
function renderMessages(container) {
    const messages = currentConversation.messages;
    
    container.innerHTML = messages.map(msg => `
        <div class="flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'} message-appear">
            <div class="max-w-[70%] md:max-w-[60%]">
                <div class="message-bubble ${msg.sender === 'me' ? 'message-bubble-sent' : 'message-bubble-received'} 
                           px-4 py-2 rounded-2xl mb-1">
                    <p class="text-sm">${msg.text}</p>
                </div>
                <div class="flex items-center ${msg.sender === 'me' ? 'justify-end' : 'justify-start'} space-x-2 px-2">
                    <span class="text-xs text-charcoal">${msg.timestamp}</span>
                    ${msg.sender === 'me' ? `
                        <span class="message-status ${msg.status === 'read' ? 'read' : ''}">
                            ${msg.status === 'read' ? '<i class="fas fa-check-double"></i>' : 
                              msg.status === 'delivered' ? '<i class="fas fa-check-double"></i>' : 
                              '<i class="fas fa-check"></i>'}
                        </span>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

// Send message
function sendMessage(isMobileView = false) {
    const input = isMobileView ? document.getElementById('mobileMessageInput') : messageInput;
    const container = isMobileView ? document.getElementById('mobileMessagesContainer') : messagesContainer;
    const message = input.value.trim();
    
    if (!message || !currentConversation) return;
    
    // Add message to conversation
    const newMessage = {
        id: currentConversation.messages.length + 1,
        sender: 'me',
        text: message,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
        status: 'sent'
    };
    
    currentConversation.messages.push(newMessage);
    currentConversation.lastMessage = message;
    currentConversation.timestamp = 'Just now';
    
    // Clear input and re-render
    input.value = '';
    renderMessages(container);
    renderConversations();
    scrollToBottom(container);
    
    // Simulate typing and response
    setTimeout(() => showTyping(isMobileView), 1000);
    setTimeout(() => {
        hideTyping(isMobileView);
        receiveMessage(isMobileView);
    }, 3000);
    
    // Update message status
    setTimeout(() => {
        newMessage.status = 'delivered';
        renderMessages(container);
    }, 1500);
    
    setTimeout(() => {
        newMessage.status = 'read';
        renderMessages(container);
    }, 2500);
}

// Receive message simulation
function receiveMessage(isMobileView = false) {
    const container = isMobileView ? document.getElementById('mobileMessagesContainer') : messagesContainer;
    
    const responses = [
        "Thank you for your message! I'll get back to you shortly.",
        "I understand. Let me check that for you.",
        "Great choice! This item is one of our bestsellers.",
        "I'll look into this right away.",
        "Is there anything else I can help you with?"
    ];
    
    const response = responses[Math.floor(Math.random() * responses.length)];
    
    const newMessage = {
        id: currentConversation.messages.length + 1,
        sender: 'them',
        text: response,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
        status: 'sent'
    };
    
    currentConversation.messages.push(newMessage);
    currentConversation.lastMessage = response;
    currentConversation.timestamp = 'Just now';
    
    renderMessages(container);
    renderConversations();
    scrollToBottom(container);
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
    // For the new layout, we need to scroll the parent container that has overflow-y-auto
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
    
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('-translate-x-full');
        sidebarOverlay.classList.toggle('hidden');
    });

    sidebarOverlay.addEventListener('click', () => {
        sidebar.classList.add('-translate-x-full');
        sidebarOverlay.classList.add('hidden');
    });

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
    
    logoutBtn.addEventListener('click', () => {
        logoutModal.classList.remove('hidden');
    });
    
    cancelLogout.addEventListener('click', () => {
        logoutModal.classList.add('hidden');
    });
    
    confirmLogout.addEventListener('click', () => {
        window.location.href = '#logged-out';
    });
    
    // Search functionality
    const searchInput = document.querySelector('input[placeholder="Search conversations..."]');
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = mockConversations.filter(conv => 
            conv.name.toLowerCase().includes(query) || 
            conv.lastMessage.toLowerCase().includes(query)
        );
        
        if (filtered.length === 0) {
            conversationsContainer.innerHTML = '<p class="text-center text-charcoal p-8">No conversations found</p>';
        } else {
            mockConversations.forEach(conv => {
                conv.hidden = !filtered.includes(conv);
            });
            renderConversations();
        }
    });

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
} 