const posterReplacements = new Map([
    [
        'https://media.kitsu.app/anime/50016/poster_image/large-c00e4abb4e356c1259a940b3bcf99894.jpeg',
        'covers/cyberpunk-edgerunners-2.jpg',
    ],
]);

function catalogImageUrl(url) {
    return posterReplacements.get(url) || url;
}

module.exports = { catalogImageUrl };
