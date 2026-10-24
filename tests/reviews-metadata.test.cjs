const test = require('node:test');
const assert = require('node:assert/strict');
const {
    clientSnapshot,
    mergeClientState,
    commentMetadata,
} = require('../shared/sync-state');
const state = () => ({
    registeredUsers: [{ username: 'alice' }, { username: 'bob' }],
    animes: [{ id: 'a', ratings: {}, comments: [] }],
    activities: [],
});
const copy = (value) => JSON.parse(JSON.stringify(value));

test('adding a reply does not mutate the sync baseline and survives the next merge', () => {
    const current = state();
    current.animes[0].comments = [
        {
            id: 'parent',
            friendId: 'alice',
            comment: 'Review',
            likes: [],
            replies: [],
        },
    ];
    const baseline = clientSnapshot(current, 'alice');
    current.animes[0].comments[0].replies.push({
        id: 'reply',
        friendId: 'alice',
        reply: 'Resposta',
        timestamp: '2026-10-24T00:00:00Z',
    });
    current.animes[0].comments[0].likes.push('alice');
    assert.deepEqual(baseline.animes[0].comments[0].replies, []);
    assert.deepEqual(baseline.animes[0].comments[0].likes, []);
    const server = state();
    server.animes[0].comments = [
        {
            id: 'parent',
            friendId: 'alice',
            comment: 'Review',
            likes: [],
            replies: [],
        },
    ];
    const result = mergeClientState(current, baseline, server, 'alice')
        .animes[0].comments[0];
    assert.equal(result.replies[0].reply, 'Resposta');
    assert.deepEqual(result.likes, ['alice']);
});

test('review metadata survives snapshots and is merged with its owner’s publication', () => {
    const base = state(),
        local = copy(base),
        server = copy(base);
    local.animes[0].comments.push({
        id: 'new',
        friendId: 'alice',
        friendName: 'Alice',
        comment: 'A leitura.',
        kind: 'review',
        title: 'O último plano',
        episode: 3,
        spoiler: true,
        likes: [],
        replies: [],
    });
    const result = mergeClientState(local, base, server, 'alice');
    const post = result.animes[0].comments[0];
    assert.equal(post.kind, 'review');
    assert.equal(post.episode, 3);
    assert.equal(post.spoiler, true);
    assert.equal(post.title, 'O último plano');
    assert.equal(
        clientSnapshot(result, 'alice').animes[0].comments[0].title,
        post.title,
    );
});

test('a foreign member can like a review without changing its metadata or text', () => {
    const base = state();
    base.animes[0].comments = [
        {
            id: 'owned',
            friendId: 'alice',
            comment: 'Original',
            kind: 'review',
            title: 'Original',
            episode: 2,
            spoiler: true,
            likes: [],
            replies: [],
        },
    ];
    const local = copy(base);
    Object.assign(local.animes[0].comments[0], {
        title: 'Alterado',
        spoiler: false,
        comment: 'Alterado',
        likes: ['bob'],
    });
    const result = mergeClientState(local, base, base, 'bob').animes[0]
        .comments[0];
    assert.equal(result.title, 'Original');
    assert.equal(result.spoiler, true);
    assert.equal(result.comment, 'Original');
    assert.deepEqual(result.likes, ['bob']);
});

test('old clients do not remove metadata added on another device', () => {
    const base = state();
    base.animes[0].comments = [
        {
            id: 'old',
            friendId: 'alice',
            comment: 'Texto',
            likes: [],
            replies: [],
        },
    ];
    const local = copy(base);
    local.animes[0].comments[0].comment = 'Texto editado';
    const server = copy(base);
    Object.assign(server.animes[0].comments[0], {
        kind: 'comment',
        episode: 4,
        spoiler: true,
    });
    const result = mergeClientState(local, base, server, 'alice').animes[0]
        .comments[0];
    assert.equal(result.comment, 'Texto editado');
    assert.equal(result.kind, 'comment');
    assert.equal(result.episode, 4);
    assert.equal(result.spoiler, true);
});

test('legacy publications stay unclassified, and malformed metadata is normalized', () => {
    assert.deepEqual(commentMetadata({ comment: 'Antigo' }), {});
    assert.deepEqual(
        commentMetadata({
            kind: 'admin',
            episode: -2,
            spoiler: 'false',
            title: ' x ',
        }),
        { episode: null, spoiler: false, title: 'x' },
    );
    assert.equal(commentMetadata({ title: 'x'.repeat(200) }).title.length, 160);
});
