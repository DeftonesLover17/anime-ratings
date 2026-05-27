const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'index.html');
let htmlContent = fs.readFileSync(htmlPath, 'utf8');

const startToken = '<!-- REGISTRATION GATE OVERLAY -->';
const endToken = '<!-- 2. MAIN NAV NAVIGATION -->';

const startIndex = htmlContent.indexOf(startToken);
const endIndex = htmlContent.indexOf(endToken);

if (startIndex === -1 || endIndex === -1) {
    console.error('Could not find registration gate start or end markers in index.html');
    process.exit(1);
}

const newRegGateHtml = `<!-- REGISTRATION GATE OVERLAY -->
    <div id="registration-gate" class="fixed inset-0 bg-bgDark/98 backdrop-blur-xl z-[9998] hidden items-start justify-center p-4 md:p-10 overflow-y-auto">
        <div class="glass-panel border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl p-6 md:p-10 space-y-6 my-auto relative animate-[fadeIn_0.3s_ease-out]">
            <!-- Ambient glow decorative circles -->
            <div class="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-brand/10 blur-[80px] pointer-events-none"></div>
            <div class="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-brand/10 blur-[80px] pointer-events-none"></div>
            
            <div class="text-center space-y-2">
                <p id="reg-header-tag" class="text-xs font-mono uppercase tracking-[0.3em] text-brand">Bem-vindo ao Anivoid</p>
                <h2 id="reg-header-title" class="text-3xl md:text-4xl font-serif text-white/95">Crie seu <span class="italic text-brand font-light">Perfil de Otaku</span></h2>
                <p id="reg-header-desc" class="text-xs text-gray-400 font-mono font-light leading-relaxed">Antes de entrar, precisamos de algumas informações para personalizar sua experiência.</p>
            </div>

            <!-- Tab Switcher -->
            <div class="flex bg-white/5 border border-white/10 rounded-full p-1 select-none font-mono text-[9px] w-full max-w-xs mx-auto mb-4">
                <button type="button" id="tab-register" class="flex-grow py-1.5 rounded-full text-white bg-brand font-bold transition-all uppercase tracking-wider text-center">Criar Conta</button>
                <button type="button" id="tab-login" class="flex-grow py-1.5 rounded-full text-white/50 hover:text-white transition-all uppercase tracking-wider text-center">Entrar</button>
            </div>

            <!-- Step Indicators -->
            <div id="reg-indicators" class="flex items-center justify-between text-[9px] font-mono uppercase tracking-widest text-gray-500 border-b border-white/5 pb-4 mb-4 select-none">
                <div class="step-indicator active flex items-center gap-1.5" data-step="1">
                    <span class="w-5 h-5 rounded-full bg-brand text-white flex items-center justify-center font-bold text-[10px]">1</span>
                    <span class="hidden sm:inline text-white/90">Conta</span>
                </div>
                <div class="w-8 h-px bg-white/10"></div>
                <div class="step-indicator flex items-center gap-1.5" data-step="2">
                    <span class="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-[10px]">2</span>
                    <span class="hidden sm:inline">Gêneros</span>
                </div>
                <div class="w-8 h-px bg-white/10"></div>
                <div class="step-indicator flex items-center gap-1.5" data-step="3">
                    <span class="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-[10px]">3</span>
                    <span class="hidden sm:inline">Estúdios</span>
                </div>
                <div class="w-8 h-px bg-white/10"></div>
                <div class="step-indicator flex items-center gap-1.5" data-step="4">
                    <span class="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-[10px]">4</span>
                    <span class="hidden sm:inline">Animes</span>
                </div>
            </div>
            
            <form id="registration-form" class="space-y-6 text-xs font-mono">
                <!-- Step 1: Conta -->
                <div class="reg-step space-y-6" data-step="1">
                    <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
                        <div class="md:col-span-12 space-y-2">
                            <label class="text-gray-400 uppercase tracking-wider block font-semibold">Nome de Usuário / Apelido</label>
                            <input type="text" id="reg-name" required placeholder="Ex: Otaku Supremo" class="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-brand/50 transition-colors">
                        </div>
                        
                        <div class="md:col-span-6 space-y-2">
                            <label class="text-gray-400 uppercase tracking-wider block font-semibold">E-mail</label>
                            <input type="email" id="reg-email" required placeholder="exemplo@email.com" class="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-brand/50 transition-colors">
                        </div>
                        
                        <div class="md:col-span-6 space-y-2">
                            <label class="text-gray-400 uppercase tracking-wider block font-semibold">Senha</label>
                            <input type="password" id="reg-password" required placeholder="••••••••" class="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-brand/50 transition-colors">
                        </div>
                        
                        <div class="md:col-span-6 space-y-2">
                            <label class="text-gray-400 uppercase tracking-wider block font-semibold">Cor do Tema</label>
                            <div class="relative h-12 w-full">
                                <input type="color" id="reg-color" value="#FF4500" class="absolute inset-0 w-full h-full border-0 bg-transparent cursor-pointer rounded-xl p-0.5">
                            </div>
                        </div>
    
                        <div class="md:col-span-6 space-y-2">
                            <label class="text-gray-400 uppercase tracking-wider block font-semibold text-center md:text-left">Avatar (Emoji)</label>
                            <input type="hidden" id="reg-avatar" value="😎">
                            <div class="relative">
                                <button type="button" id="reg-avatar-trigger" class="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-center text-lg focus:outline-none hover:bg-white/10 transition-colors">
                                    😎
                                </button>
                                <div id="reg-avatar-dropdown" class="absolute left-1/2 -translate-x-1/2 mt-2 w-44 bg-[#0f0f0f] border border-white/10 rounded-xl p-2 hidden grid grid-cols-4 gap-1 shadow-2xl z-[10000]">
                                    <!-- Clickable emoji list populated in JS -->
                                </div>
                            </div>
                        </div>
                    </div>
                    <p class="text-[10px] text-gray-500 font-mono mt-4 text-center">Já tem uma conta? <button type="button" id="toggle-to-login" class="text-brand hover:underline font-bold">Entrar</button></p>
                </div>

                <!-- Step 2: Gêneros -->
                <div class="reg-step hidden space-y-4" data-step="2">
                    <div class="flex justify-between items-center">
                        <label class="text-gray-400 uppercase tracking-wider block font-semibold">Selecione seus Gêneros Favoritos</label>
                        <span class="text-[9px] text-gray-500 font-mono">SELECIONE MÚLTIPLOS</span>
                    </div>
                    <p class="text-[11px] text-gray-400 font-light italic">Passe o mouse sobre um gênero para espiar alguns animes do catálogo.</p>
                    <div id="reg-genres-list" class="flex flex-wrap gap-2 pt-2">
                        <!-- Populated in JS -->
                    </div>
                </div>

                <!-- Step 3: Estúdios -->
                <div class="reg-step hidden space-y-4" data-step="3">
                    <div class="flex justify-between items-center">
                        <label class="text-gray-400 uppercase tracking-wider block font-semibold">Selecione seus Estúdios Favoritos</label>
                        <span class="text-[9px] text-gray-500 font-mono">SELECIONE MÚLTIPLOS</span>
                    </div>
                    <p class="text-[11px] text-gray-400 font-light italic">Passe o mouse sobre um estúdio para espiar as suas produções no catálogo.</p>
                    <div id="reg-studios-list" class="flex flex-wrap gap-2 pt-2">
                        <!-- Populated in JS -->
                    </div>
                </div>

                <!-- Step 4: Animes -->
                <div class="reg-step hidden space-y-4" data-step="4">
                    <div class="flex justify-between items-center">
                        <label class="text-gray-400 uppercase tracking-wider block font-semibold">Escolha seus Animes Favoritos</label>
                        <span class="text-[9px] text-gray-500 font-mono">SELECIONE MÚLTIPLOS</span>
                    </div>
                    
                    <!-- Search inside modal -->
                    <div class="relative">
                        <iconify-icon icon="lucide:search" class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></iconify-icon>
                        <input type="text" id="reg-anime-search" placeholder="Pesquise para adicionar aos seus favoritos..." class="w-full bg-white/5 border border-white/10 rounded-full py-2.5 pl-11 pr-4 text-xs font-light tracking-wide focus:outline-none focus:border-brand/40 transition-colors">
                    </div>
                    
                    <!-- Selection and search results container -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                        <!-- Selected list -->
                        <div class="space-y-2">
                            <span class="text-[10px] text-gray-500 uppercase tracking-wider font-mono">Selecionados:</span>
                            <div id="reg-selected-animes" class="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                                <!-- JS Populated -->
                                <p class="text-[11px] text-gray-500 italic py-2">Nenhum anime selecionado.</p>
                            </div>
                        </div>
                        
                        <!-- Search results/recommendations list -->
                        <div class="space-y-2">
                            <span id="reg-recommend-label" class="text-[10px] text-gray-500 uppercase tracking-wider font-mono">Sugestões Populares:</span>
                            <div id="reg-anime-results" class="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                                <!-- JS Populated -->
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Step Navigation Controls -->
                <div class="flex items-center justify-between pt-4 border-t border-white/5 gap-4 select-none">
                    <button type="button" id="reg-prev-btn" class="px-6 py-3 rounded-full border border-white/10 text-white/70 hover:text-white hover:bg-white/5 transition-all uppercase tracking-widest font-semibold text-[10px] hidden">
                        Anterior
                    </button>
                    <button type="button" id="reg-next-btn" class="ml-auto px-8 py-3 rounded-full bg-brand text-white hover:bg-brand/80 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest font-semibold text-[10px] border border-brand/40 shadow-[0_4px_20px_rgba(255,69,0,0.3)]">
                        Próximo
                    </button>
                </div>
            </form>

            <!-- Login Form (Toggled via JS) -->
            <form id="login-form" class="space-y-6 text-xs font-mono hidden animate-[fadeIn_0.3s_ease-out]">
                <div class="space-y-4">
                    <div class="space-y-2">
                        <label class="text-gray-400 uppercase tracking-wider block font-semibold">E-mail</label>
                        <input type="email" id="login-email" required placeholder="exemplo@email.com" class="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-brand/50 transition-colors">
                    </div>
                    <div class="space-y-2">
                        <label class="text-gray-400 uppercase tracking-wider block font-semibold">Senha</label>
                        <input type="password" id="login-password" required placeholder="••••••••" class="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-brand/50 transition-colors">
                    </div>
                </div>
                
                <div class="pt-4 border-t border-white/5 flex items-center justify-between gap-4 select-none">
                    <p class="text-[10px] text-gray-500 font-mono">Não tem conta? <button type="button" id="toggle-to-register" class="text-brand hover:underline font-bold">Criar conta</button></p>
                    <button type="submit" class="ml-auto px-8 py-3 rounded-full bg-brand text-white hover:bg-brand/80 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest font-semibold text-[10px] border border-brand/40 shadow-[0_4px_20px_rgba(255,69,0,0.3)]">
                        Entrar
                    </button>
                </div>
            </form>
        </div>
    </div>

    <!-- HOVER TOOLTIP FOR GENRES/STUDIOS -->
    <div id="reg-hover-tooltip" class="fixed bg-[#0c0c0c]/98 backdrop-blur-md border border-brand/35 rounded-2xl p-4 shadow-2xl z-[9999] pointer-events-none hidden max-w-xs transition-opacity duration-200 opacity-0 text-[10px] font-mono text-white/90">
        <div class="space-y-2.5">
            <p id="tooltip-title" class="font-bold text-brand uppercase tracking-widest text-[9px] border-b border-white/5 pb-1.5"></p>
            <div id="tooltip-animes-list" class="space-y-2">
                <!-- Filled in JS on hover -->
            </div>
        </div>
    </div>`;

const updatedHtml = htmlContent.substring(0, startIndex) + newRegGateHtml + htmlContent.substring(endIndex);
fs.writeFileSync(htmlPath, updatedHtml, 'utf8');
console.log('HTML restructured successfully!');
