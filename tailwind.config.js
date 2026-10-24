module.exports = {
    content: ['./index.html', './app.js'],
    theme: {
        extend: {
            colors: {
                brand: 'rgb(var(--brand-rgb, 255 69 0) / <alpha-value>)',
                bgDark: '#050505',
                cardDark: '#111111'
            }
        }
    }
};
