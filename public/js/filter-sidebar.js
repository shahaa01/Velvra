function toggleFilterSection(header) {
    const content = header.nextElementSibling;
    const arrow = header.querySelector('svg');
    
    content.classList.toggle('hidden');
    arrow.classList.toggle('rotate-180');
}