document.addEventListener('DOMContentLoaded', () => {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const sidebar = document.getElementById('sidebar');
    
    hamburgerBtn.addEventListener('click', () => {
        sidebar.classList.toggle('active');
        hamburgerBtn.classList.toggle('active');
    });

    // close sidebar with click
    document.addEventListener('click', (e) => {
        if (!sidebar.contains(e.target) && !hamburgerBtn.contains(e.target)) {
            sidebar.classList.remove('active');
            hamburgerBtn.classList.remove('active');
        }
    });

    // Toggle of submenus
    const menuItems = document.querySelectorAll('.has-submenu > a');
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const parent = item.parentElement;
            parent.classList.toggle('open');
        });
    });

    // example of graphics
    const canvas = document.getElementById('statsChart');
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = 300;

    // Example data
    const bars = [
        { label: 'Ene', value: 65, color: '#4A90E2' },
        { label: 'Feb', value: 78, color: '#4A90E2' },
        { label: 'Mar', value: 82, color: '#4A90E2' },
        { label: 'Abr', value: 90, color: '#4A90E2' },
        { label: 'May', value: 75, color: '#4A90E2' },
        { label: 'Jun', value: 88, color: '#4A90E2' }
    ];

    const barWidth = canvas.width / bars.length - 20;
    const maxValue = Math.max(...bars.map(b => b.value));

    bars.forEach((bar, index) => {
        const barHeight = (bar.value / maxValue) * (canvas.height - 50);
        const x = index * (barWidth + 20) + 10;
        const y = canvas.height - barHeight - 30;

        ctx.fillStyle = bar.color;
        ctx.fillRect(x, y, barWidth, barHeight);

        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(bar.label, x + barWidth / 2, canvas.height - 10);
        ctx.fillText(bar.value, x + barWidth / 2, y - 5);
    });
});
