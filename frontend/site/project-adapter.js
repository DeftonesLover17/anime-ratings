const { scoreMarkup } = require('../shared/dom');
const { studioForAnime } = require('../../shared/studio-metadata');

function createProjectAdapter(project, site) {
    const { state, statuses } = project;
    const animeById = (id) => state.animes.find((anime) => anime.id === id);
    const viewer = () => project.viewerId();
    const userName = (id) =>
        project
            .users()
            .find((user) => project.normalizeId(user.username) === id)
            ?.username ||
        state.friends
            .find((friend) => friend.id === id)
            ?.name?.replace(' (Você)', '') ||
        id ||
        'Você';
    const ratingFor = (anime, id = state.currentFriendId) =>
        anime.ratings?.[id] || {};
    const actions = {
        open: project.open,
        studio: project.studio,
        catalog: project.catalog,
        back: project.catalog,
        allStudios: project.allStudios,
    };

    async function persist() {
        await state.syncWithServer();
        if (state.activeDetailAnimeId)
            refreshNumbers(state.activeDetailAnimeId);
        return { synced: !state.lastSyncError };
    }

    function cardModel(anime) {
        const rating = ratingFor(anime);
        const isMe = state.currentFriendId === viewer();
        return {
            anime,
            rating,
            groupScore: state.calculateAverageScore(anime.id),
            statusKey: rating.status || 'Plan to Watch',
            statusLabel:
                statuses[rating.status || 'Plan to Watch']?.label ||
                'Planejo assistir',
            ratingLabel: isMe
                ? 'Sua nota'
                : 'Nota de ' + userName(state.currentFriendId),
            ownRating:
                !isMe && viewer() && state.currentFriendId
                    ? ratingFor(anime, viewer())
                    : null,
            friendName: userName(state.currentFriendId),
        };
    }

    function renderFeatured(container) {
        if (!state.animes.length) return;
        const viewed = project
            .users()
            .find(
                (user) =>
                    project.normalizeId(user.username) ===
                    state.currentFriendId,
            );
        const featuredId =
            viewed?.featuredAnimeId ||
            (state.currentFriendId === viewer() ? state.featuredAnimeId : null);
        const anime =
            animeById(featuredId) ||
            state.animes.reduce(
                (best, item) =>
                    state.calculateAverageScore(item.id) >
                    state.calculateAverageScore(best.id)
                        ? item
                        : best,
                state.animes[0],
            );
        site.renderFeatured(
            container,
            {
                ...cardModel(anime),
                collectionSize: state.animes.length,
                nextAnime: state.animes.find((item) => item.id !== anime.id),
            },
            actions,
        );
        const count = document.getElementById('av-catalog-count');
        if (count)
            count.textContent = String(state.animes.length).padStart(2, '0');
    }

    function renderRecommendations(container, recommendations) {
        site.renderRecommendations(container, recommendations, actions);
    }
    function createCard(anime, index) {
        return site.createCatalogCard(cardModel(anime), actions, index);
    }

    function studioModels() {
        const unique = new Map();
        state.animes.forEach((anime) => {
            const key = (anime.title || '').trim().toLowerCase();
            if (!unique.has(key)) unique.set(key, anime);
        });
        const groups = new Map();
        unique.forEach((anime) => {
            if (!anime.studio || anime.studio.toLowerCase() === 'desconhecido')
                return;
            const name = project.standardStudio(anime.studio.trim());
            if (!groups.has(name)) groups.set(name, []);
            groups.get(name).push(anime);
        });
        return [...groups]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([name, animes]) => {
                const scores = animes
                    .map((anime) => state.calculateAverageScore(anime.id))
                    .filter((score) => score > 0);
                return {
                    name,
                    animes,
                    logo: project.studioLogo(name),
                    description: project.studioDescription(name, animes),
                    average: scores.length
                        ? scores.reduce((sum, score) => sum + score, 0) /
                          scores.length
                        : 0,
                };
            });
    }

    function renderStudios(container, name) {
        document.body.dataset.avView = 'studios';
        const studios = studioModels();
        const model = studios.find((studio) => studio.name === name);
        if (!model) {
            site.renderDirectory(container, studios, actions);
            return;
        }
        site.renderStudioProfile(
            container,
            {
                ...model,
                rating: ratingFor,
                averageFor: (anime) => state.calculateAverageScore(anime.id),
                status: (anime) => cardModel(anime).statusLabel,
            },
            actions,
        );
    }

    function renderCredit(button, anime) {
        site.renderCredit(
            button,
            {
                name: studioForAnime(anime),
                logo: project.studioLogo(
                    project.standardStudio(studioForAnime(anime)),
                ),
            },
            project.studio,
        );
    }

    function refreshNumbers(animeId) {
        if (state.activeDetailAnimeId !== animeId) return;
        const anime = animeById(animeId);
        if (!anime) return;
        project.status?.(anime);
        const rating = ratingFor(anime);
        const own = document.getElementById('my-rating-overall-container');
        const group = document.getElementById('group-rating-avg-container');
        if (own) own.innerHTML = scoreMarkup(rating.overall, 'av-total-score');
        if (group)
            group.innerHTML = scoreMarkup(
                state.calculateAverageScore(animeId),
                'av-total-score',
            );
        const watched = document.getElementById('detail-ep-watched-label');
        if (watched) watched.textContent = rating.episodesWatched || 0;
        const total = document.getElementById('detail-ep-total-label');
        if (total) total.textContent = anime.episodes || '?';
        const progress = document.getElementById('detail-progress-bar');
        if (progress)
            progress.style.width = `${Math.min(100, ((Number(rating.episodesWatched) || 0) / (Number(anime.episodes) || 1)) * 100)}%`;
        const stats = state.getGroupStatusStats(animeId);
        Object.entries({
            Watching: 'watching',
            Completed: 'completed',
            'On Hold': 'onhold',
            Dropped: 'dropped',
            'Plan to Watch': 'plantowatch',
        }).forEach(([key, suffix]) => {
            const node = document.getElementById('group-stat-' + suffix);
            if (node) node.textContent = stats[key] || 0;
        });
    }

    function renderWorkbench(host, anime, readOnly) {
        const id = anime.id,
            profileId = state.currentFriendId;
        const canEdit = () => profileId === viewer();
        site.renderWorkbench(host, {
            anime,
            profileId,
            profileName: userName(profileId),
            readOnly,
            getRating: () => ratingFor(animeById(id) || anime, profileId),
            async rate(episode, value) {
                if (!canEdit()) throw Error('Apenas leitura');
                state.setEpisodeRating(
                    id,
                    profileId,
                    episode,
                    value === null ? '' : value,
                );
                refreshNumbers(id);
                project.history(animeById(id));
                return persist();
            },
            async watch(episode, watched) {
                if (!canEdit()) throw Error('Apenas leitura');
                state.toggleEpisodeWatched(id, profileId, episode, watched);
                refreshNumbers(id);
                return persist();
            },
            async general(value, applyToAll = false) {
                if (!canEdit()) throw Error('Apenas leitura');
                state.setGeneralRating(id, profileId, value, applyToAll);
                refreshNumbers(id);
                return persist();
            },
            retry: persist,
        });
    }

    function renderConversation(host, anime) {
        const id = anime.id,
            authorId = viewer();
        const ownPost = (postId) => {
            const post = animeById(id)?.comments?.find(
                (item) => item.id === postId,
            );
            if (!post || post.friendId !== authorId)
                throw Error('Esta publicação pertence a outro membro');
            return post;
        };
        site.renderConversation(host, {
            animeId: id,
            authorId,
            authorName: userName(authorId),
            episodeCount: Number(anime.episodes) || 0,
            getComments: () => animeById(id)?.comments || [],
            author(profileId, fallback) {
                const user = project
                    .users()
                    .find(
                        (item) =>
                            project.normalizeId(item.username) === profileId,
                    );
                const friend = state.friends.find(
                    (item) => item.id === profileId,
                );
                return {
                    name:
                        user?.username ||
                        friend?.name?.replace(' (Você)', '') ||
                        fallback ||
                        profileId ||
                        'Membro',
                    avatar: user?.avatar || friend?.avatar || '',
                    score: ratingFor(animeById(id) || anime, profileId).overall,
                };
            },
            async publish(payload) {
                if (!authorId) throw Error('Entre na sua conta');
                state.addComment(id, authorId, payload.comment, payload);
                return persist();
            },
            async edit(postId, payload) {
                const post = ownPost(postId);
                Object.assign(post, {
                    comment: payload.comment,
                    ...project.metadata(payload),
                });
                state.save();
                return persist();
            },
            async remove(postId) {
                ownPost(postId);
                const current = animeById(id);
                current.comments = current.comments.filter(
                    (post) => post.id !== postId,
                );
                state.save();
                return persist();
            },
            like: (postId) => project.like(id, postId),
            async reply(postId, text) {
                if (!authorId) throw Error('Entre na sua conta');
                state.addReply(id, postId, authorId, text);
                return persist();
            },
            retry: persist,
        });
    }

    return {
        renderFeatured,
        renderRecommendations,
        createCard,
        renderStudios,
        renderCredit,
        refreshNumbers,
        renderWorkbench,
        renderConversation,
    };
}

module.exports = { createProjectAdapter };
