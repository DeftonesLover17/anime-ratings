const discovery = require('./discovery');
const studios = require('./studios');
const { createScenes } = require('./scenes');
const { createNavigation } = require('./navigation');
const { createWorkbench } = require('../ratings/workbench');
const { createConversation } = require('../community/conversation');
const { createProjectAdapter } = require('./project-adapter');
const { mountDetailShell } = require('./detail-shell');
const { scoreMarkup } = require('../shared/dom');

function createSite(browser, animate) {
    const scenes = createScenes(browser, animate);
    const navigation = createNavigation(browser, scenes);
    const revealCleanups = new WeakMap();
    const ratingState = { drafts: new Map(), selections: new Map(), animate };
    const textDrafts = new Map();
    let workbench;
    let conversation;
    let conversationModel;
    let selectedEpisode = 1;
    let viewerId = () => '';

    function reveal(root) {
        if (!root) return;
        revealCleanups.get(root)?.();
        revealCleanups.set(root, scenes.reveal(root));
    }

    function mount() {
        browser.document.body.classList.add('av-app');
        browser.addEventListener('beforeunload', (event) => {
            if (!viewerId() || (!ratingState.drafts.size && !textDrafts.size))
                return;
            event.preventDefault();
            event.returnValue = '';
        });
        mountDetailShell(
            browser.document.getElementById('anime-detail-page'),
            scenes.finish,
        );
        const nav = browser.document.getElementById('main-nav');
        nav?.querySelectorAll('[data-av-nav]').forEach((link) =>
            link.addEventListener('click', (event) => {
                if (event.ctrlKey || event.metaKey || event.shiftKey) return;
                event.preventDefault();
                const disclosure = link.closest('details');
                if (disclosure) disclosure.open = false;
                if (link.dataset.avNav === 'studios')
                    browser.switchTabToStudio(null, event.detail > 0);
                else if (link.dataset.avNav === 'featured')
                    browser.switchTabToFeatured();
                else browser.switchTabToAll('#anime-grid-section', true);
            }),
        );
        const splash = browser.document.getElementById('splash-screen');
        const gate = browser.document.getElementById('registration-gate');
        let entered = false;
        const enter = () => {
            if (
                entered ||
                !splash ||
                browser.getComputedStyle(splash).display !== 'none' ||
                (gate && browser.getComputedStyle(gate).display !== 'none')
            )
                return;
            entered = true;
            observer.disconnect();
            reveal(browser.document.getElementById('featured-banner-wrapper'));
            reveal(browser.document.getElementById('anime-grid-section'));
            navigation.applyRoute(true);
            if (!browser.location.hash || browser.location.hash === '#featured-banner-wrapper' || browser.location.hash === '#anime-grid-section') {
                if (typeof browser.scrollTo === 'function') {
                    browser.scrollTo({ top: 0, behavior: 'instant' });
                }
            }
        };
        const observer = new browser.MutationObserver(enter);
        if (splash)
            observer.observe(splash, {
                attributes: true,
                attributeFilter: ['class', 'style'],
            });
        if (gate)
            observer.observe(gate, {
                attributes: true,
                attributeFilter: ['class', 'style'],
            });
        enter();
    }

    function renderWorkbench(host, model) {
        const identity = model.anime.id + ':' + model.profileId;
        const augmented = {
            ...model,
            selected(episode) {
                selectedEpisode = episode;
                if (
                    conversation &&
                    conversationModel?.animeId === model.anime.id
                ) {
                    conversationModel = {
                        ...conversationModel,
                        selectedEpisode,
                    };
                    conversation.update(conversationModel);
                }
            },
        };
        if (workbench?.identity === identity) {
            workbench.update(augmented);
            return;
        }
        workbench?.destroy();
        workbench = createWorkbench(host, augmented, ratingState);
    }

    function renderConversation(host, model) {
        conversationModel = { ...model, selectedEpisode };
        const identity = model.animeId + ':' + model.authorId;
        if (conversation?.identity === identity) {
            conversation.update(conversationModel);
            return;
        }
        conversation?.destroy();
        conversation = createConversation(host, conversationModel, textDrafts);
    }

    const api = {
        mount,
        navigation,
        reveal,
        release(root) {
            revealCleanups.get(root)?.();
        },
        renderFeatured(container, model, actions) {
            revealCleanups.get(container)?.();
            discovery.renderFeatured(container, model, actions);
            if (
                browser.getComputedStyle(
                    browser.document.getElementById('splash-screen'),
                ).display === 'none'
            )
                reveal(container);
        },
        createCatalogCard: discovery.createCatalogCard,
        renderRecommendations: discovery.renderRecommendations,
        renderDirectory(container, models, actions) {
            revealCleanups.get(container)?.();
            studios.renderDirectory(container, models, actions);
            reveal(container);
        },
        renderStudioProfile(container, model, actions) {
            revealCleanups.get(container)?.();
            studios.renderProfile(container, model, actions);
            reveal(container);
        },
        renderCredit: studios.renderCredit,
        renderWorkbench,
        renderConversation,
        connect(project) {
            viewerId = project.viewerId;
            return createProjectAdapter(project, api);
        },
    };
    api.scoreMarkup = (value) => scoreMarkup(value, 'av-total-score');
    return api;
}

module.exports = { createSite };
