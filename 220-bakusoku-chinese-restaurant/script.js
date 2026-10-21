(function () {
    'use strict';

    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) e.preventDefault();
        lastTouchEnd = now;
    }, { passive: false });
    document.addEventListener('dblclick', (e) => e.preventDefault());
    document.addEventListener('contextmenu', (e) => e.preventDefault());

    function tapFeedback(el) {
        if (!el) return;
        el.classList.add('is-pressed');
        if (navigator.vibrate) navigator.vibrate(14);
        setTimeout(() => el.classList.remove('is-pressed'), 90);
    }

    const SoundEngine = {
        enabled: true,
        synths: {},

        init() {
            try {
                this.synths.synth = new Tone.Synth().toDestination();
                this.synths.poly = new Tone.PolySynth().toDestination();
                this.synths.metal = new Tone.MetalSynth({
                    frequency: 200,
                    envelope: { attack: 0.001, decay: 0.1, release: 0.01 },
                    harmonicity: 5.1,
                    modulationIndex: 32,
                    resonance: 4000,
                    octaves: 1.5
                }).toDestination();
                this.synths.metal.volume.value = -12;
                this.synths.noise = new Tone.NoiseSynth({
                    noise: { type: 'pink' },
                    envelope: { attack: 0.01, decay: 0.15, release: 0.1 }
                }).toDestination();
                this.synths.noise.volume.value = -10;
            } catch (e) { /* audio optional */ }
        },

        playCook() {
            if (!this.enabled) return;
            try { this.synths.noise.triggerAttackRelease('8n'); } catch (e) { /* ignore */ }
        },
        playDone() {
            if (!this.enabled) return;
            try {
                const now = Tone.now();
                this.synths.synth.triggerAttackRelease('G5', '16n', now);
                this.synths.synth.triggerAttackRelease('C6', '16n', now + 0.08);
            } catch (e) { /* ignore */ }
        },
        playServe() {
            if (!this.enabled) return;
            try { this.synths.poly.triggerAttackRelease(['C5', 'E5', 'G5'], '8n', Tone.now()); } catch (e) { /* ignore */ }
        },
        playAngry() {
            if (!this.enabled) return;
            try {
                const now = Tone.now();
                this.synths.synth.triggerAttackRelease('C3', '8n', now);
                this.synths.synth.triggerAttackRelease('F2', '8n', now + 0.1);
            } catch (e) { /* ignore */ }
        },
        playBurnt() {
            if (!this.enabled) return;
            try { this.synths.metal.triggerAttackRelease('16n'); } catch (e) { /* ignore */ }
        },
        playCoin() {
            if (!this.enabled) return;
            try {
                const now = Tone.now();
                this.synths.synth.triggerAttackRelease('E6', '16n', now);
                this.synths.synth.triggerAttackRelease('B6', '16n', now + 0.06);
            } catch (e) { /* ignore */ }
        },
        playWokChime() {
            if (!this.enabled || !this.synths.metal) return;
            try {
                const now = Tone.now();
                this.synths.metal.triggerAttackRelease('32n', now);
                this.synths.synth.triggerAttackRelease('B6', '32n', now + 0.025);
            } catch (e) { /* ignore */ }
        },
        playFlare() {
            if (!this.enabled) return;
            try {
                const now = Tone.now();
                this.synths.noise.triggerAttackRelease('8n', now);
                this.synths.metal.triggerAttackRelease('16n', now + 0.02);
                this.synths.synth.triggerAttackRelease('G4', '16n', now + 0.04);
            } catch (e) { /* ignore */ }
        }
    };
    window.SoundEngine = SoundEngine;

    function escapeText(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    const SNSReviews = {
        queue: [],
        add(text, rating = 5, avatar = CUSTOMER_AVATARS[0], name) {
            const post = {
                text,
                rating,
                avatar,
                name: name || ReviewPicker.handle()
            };
            this.queue.push(post);
            if (this.queue.length > 6) this.queue.shift();
            this.render();
        },
        render() {
            const host = document.getElementById('sns-posts');
            if (!host) return;
            host.replaceChildren();
            this.queue.slice(-3).reverse().forEach((post) => {
                const el = document.createElement('div');
                el.className = 'sns-post is-visible';
                el.innerHTML = `<span class="sns-avatar">${faceMark(post.avatar)}</span><span class="sns-copy"><b>@${escapeText(post.name)}</b><span class="sns-stars">${'★'.repeat(post.rating)}${'☆'.repeat(5 - post.rating)}</span><br>${escapeText(post.text)}</span>`;
                host.appendChild(el);
            });
        },
        renderResult(targetId) {
            const host = document.getElementById(targetId);
            if (!host) return;
            host.replaceChildren();
            const posts = this.queue.filter((p, i) => i > 0 || this.queue.length === 1);
            if (!posts.length) {
                host.textContent = 'まだ口コミはありません';
                return;
            }
            posts.slice(-4).reverse().forEach((post) => {
                const row = document.createElement('p');
                row.textContent = `@${post.name} ${'★'.repeat(post.rating)} ${post.text}`;
                host.appendChild(row);
            });
        },
        welcome() {
            this.add('厨房の火がもう立ってる。今日は強火の日。 #町中華', 5, CUSTOMER_AVATARS[4]);
        },
        fromServe(cust, recipe, seared) {
            const tier = ReviewPicker.tierFromPatience(cust.patience / cust.maxPatience);
            const row = ReviewPicker.pick(tier, recipe.name, seared);
            this.add(row.text, row.stars, cust.avatar);
        },
        fromAngry(cust) {
            const row = ReviewPicker.pick('angry', cust.order.name, false);
            this.add(row.text, row.stars, cust.avatar);
        }
    };

    const MENU_DATA = {
        fried_rice: { id: 'fried_rice', name: 'チャーハン', price: 700, cost: 200, cookTime: 2.6, burnTime: 8.0, icon: 'fa-bowl-rice', color: 'text-amber-400', bgColor: 'bg-amber-950/60' },
        ramen: { id: 'ramen', name: 'ラーメン', price: 800, cost: 220, cookTime: 3.0, burnTime: 8.0, icon: 'fa-bowl-food', color: 'text-yellow-500', bgColor: 'bg-yellow-950/60' },
        gyoza: { id: 'gyoza', name: 'ギョーザ', price: 500, cost: 160, cookTime: 2.2, burnTime: 8.0, icon: 'fa-box-archive', color: 'text-orange-400', bgColor: 'bg-orange-950/60' },
        mabo: { id: 'mabo', name: 'マーボー', price: 900, cost: 240, cookTime: 3.2, burnTime: 8.0, icon: 'fa-fire-burner', color: 'text-red-500', bgColor: 'bg-red-950/60' }
    };

    const GameState = {
        day: 1,
        money: 0,
        targetMoney: 1600,
        reputation: 5,
        maxReputation: 5,
        daySales: 0,
        dayIngredientLoss: 0,
        dayBurntLoss: 0,
        servedCount: 0,
        angryCount: 0,
        cookerSlotsCount: 3,
        seatSlotsCount: 3,
        cookSpeedMultiplier: 1.0,
        dayTimeLeft: 45,
        isPlaying: false,
        customers: [],
        cookers: [],
        heldDish: null,
        lastCustomerKey: '',
        lastCookerKey: '',
        searPulse: 0,
        searReadyAt: 0,
        daySearCount: 0,
        spawnCooldown: 5
    };
    window.GameState = GameState;

    let kitchen = null;

    function initCookers() {
        GameState.cookers = [];
        for (let i = 0; i < GameState.cookerSlotsCount; i++) {
            GameState.cookers.push({ id: i, status: 'empty', recipe: null, progress: 0, cookTimer: 0, burnTimer: 0 });
        }
        GameState.lastCookerKey = '';
    }

    function initCustomers() {
        GameState.customers = [];
        for (let i = 0; i < GameState.seatSlotsCount; i++) GameState.customers.push(null);
        GameState.lastCustomerKey = '';
    }

    function wantedRecipeIds() {
        const ids = new Set();
        GameState.customers.forEach((c) => { if (c) ids.add(c.order.id); });
        return ids;
    }

    function cookerKey() {
        return GameState.cookers.map((c) => `${c.status}:${c.recipe ? c.recipe.id : '-'}`).join('|') + `:${GameState.heldDish ? GameState.heldDish.id : '-'}`;
    }

    function customerKey() {
        return GameState.customers.map((c) => (c ? `${c.avatar.id}:${c.order.id}` : 'empty')).join('|') + `:${GameState.heldDish ? GameState.heldDish.id : '-'}`;
    }

    function updateHeaderUI() {
        document.getElementById('day-display').textContent = `Day ${GameState.day}`;
        document.getElementById('reputation-display').textContent = `評判: ${GameState.reputation}/${GameState.maxReputation}`;
        document.getElementById('money-display').textContent = `¥${GameState.money.toLocaleString()}`;
        document.getElementById('target-display').textContent = `日商目標 ¥${GameState.targetMoney.toLocaleString()}`;
        document.getElementById('timer-display').textContent = `残り ${GameState.dayTimeLeft}秒`;
        document.getElementById('goal-fill').style.width = `${Math.min(100, GameState.daySales / GameState.targetMoney * 100)}%`;
        renderHeldDish();
        syncServeHighlight();
    }

    function renderHeldDish() {
        const tray = document.getElementById('held-dish');
        const box = document.getElementById('service-tray');
        if (!GameState.heldDish) {
            tray.className = 'text-xs text-neutral-400';
            tray.textContent = '完成した料理をコンロからここへ移します';
            box.classList.remove('has-dish');
            return;
        }
        const dish = GameState.heldDish;
        tray.className = 'text-sm text-white font-black flex items-center gap-2';
        tray.innerHTML = `<span class="text-2xl ${dish.color}"><i class="fa-solid ${dish.icon}"></i></span><span>${escapeText(dish.name)}<small class="block text-amber-300 font-normal">同じ注文の客が光ります。提供ボタンを押してください</small></span>`;
        box.classList.add('has-dish');
    }

    function getCookerBgClass(cooker) {
        if (cooker.status === 'empty') return 'bg-neutral-800 border-neutral-700';
        if (cooker.status === 'cooking') return 'bg-neutral-800/90 border-amber-500/80 shadow-[0_0_10px_rgba(245,158,11,0.2)]';
        if (cooker.status === 'ready') return 'bg-emerald-950/60 border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)] cooker-card is-ready';
        if (cooker.status === 'burnt') return 'bg-red-950/80 border-red-600 animate-pulse';
        return '';
    }

    function renderCookers() {
        const container = document.getElementById('cookers-container');
        const key = cookerKey();
        if (key === GameState.lastCookerKey && container.children.length) {
            updateCookerMeters();
            return;
        }
        GameState.lastCookerKey = key;
        container.replaceChildren();

        GameState.cookers.forEach((cooker) => {
            const el = document.createElement('div');
            el.className = `relative rounded-xl p-3 border-2 flex flex-col items-center justify-between min-h-[110px] sm:min-h-[125px] ${getCookerBgClass(cooker)}`;
            el.dataset.cooker = String(cooker.id);
            let content = '';
            if (cooker.status === 'empty') {
                content = `<div class="my-auto text-center text-neutral-500"><i class="fa-solid fa-circle-minus text-2xl mb-1 opacity-40"></i><div class="text-xs font-bold">空きコンロ</div></div>`;
            } else if (cooker.status === 'cooking') {
                const recipe = cooker.recipe;
                content = `<div class="text-xs font-bold text-amber-300 self-start truncate w-full"><i class="fa-solid fa-fire text-orange-500 animate-pulse"></i> ${escapeText(recipe.name)}</div>
                    <div class="text-3xl my-1 cooking-sizzle ${recipe.color}"><i class="fa-solid ${recipe.icon}"></i></div>
                    <div class="w-full bg-neutral-900 rounded-full h-2.5 overflow-hidden border border-neutral-700"><div data-cook-bar class="bg-amber-400 h-full progress-bar-fill" style="width:${cooker.progress}%"></div></div>
                    <div class="text-[10px] text-amber-200 mt-1">強火でシュッ！炒め中...</div>`;
            } else if (cooker.status === 'ready') {
                const recipe = cooker.recipe;
                const burnPercent = Math.min(100, (cooker.burnTimer / recipe.burnTime) * 100);
                content = `<div class="text-xs font-bold text-emerald-400 self-start truncate w-full flex justify-between"><span><i class="fa-solid fa-circle-check"></i> 完成！</span><span class="text-red-400 animate-pulse text-[10px]">焦げ注意!</span></div>
                    <div class="text-4xl my-1 ${recipe.color} relative"><i class="fa-solid ${recipe.icon}"></i><span class="absolute -top-3 -right-2 text-xs steam-effect">湯気</span></div>
                    <div class="w-full bg-neutral-900 rounded-full h-2 overflow-hidden"><div data-burn-bar class="bg-red-500 h-full progress-bar-fill" style="width:${burnPercent}%"></div></div>
                    <button type="button" data-pickup="${cooker.id}" class="game-btn mt-1 w-full py-2 bg-emerald-600 text-white font-bold text-xs rounded shadow">② 提供台へ盛る</button>`;
            } else if (cooker.status === 'burnt') {
                content = `<div class="text-xs font-bold text-red-500 self-start"><i class="fa-solid fa-triangle-exclamation"></i> 焦げた！</div>
                    <div class="text-3xl my-1 text-gray-600"><i class="fa-solid fa-dumpster-fire"></i></div>
                    <button type="button" data-discard="${cooker.id}" class="game-btn w-full py-2 bg-red-800 text-red-100 font-bold text-xs rounded shadow mt-auto">破棄 (損失¥${cooker.recipe.cost})</button>`;
            }
            el.innerHTML = content;
            container.appendChild(el);
        });
        syncSearButton();
    }

    function syncSearButton() {
        const on = GameState.isPlaying && GameState.cookers.some((c) => c.status === 'cooking');
        document.getElementById('sear-btn')?.classList.toggle('is-on', on);
    }

    function applySear() {
        if (!GameState.isPlaying) return;
        if (!GameState.cookers.some((c) => c.status === 'cooking')) {
            showFloatingText('先に鍋をかけてから炙ってください', 'text-amber-200');
            return;
        }
        if (Date.now() < GameState.searReadyAt) return;
        GameState.searReadyAt = Date.now() + 620;
        GameState.searPulse = 0.4;
        GameState.daySearCount++;
        if (kitchen) kitchen.ignite();
        SoundEngine.playFlare();
        showFloatingText('シュッ！強火炙り', 'text-orange-300');
    }

    function updateCookerMeters() {
        GameState.cookers.forEach((cooker) => {
            const card = document.querySelector(`[data-cooker="${cooker.id}"]`);
            if (!card) return;
            const cookBar = card.querySelector('[data-cook-bar]');
            if (cookBar) cookBar.style.width = `${cooker.progress}%`;
            const burnBar = card.querySelector('[data-burn-bar]');
            if (burnBar && cooker.recipe) {
                burnBar.style.width = `${Math.min(100, (cooker.burnTimer / cooker.recipe.burnTime) * 100)}%`;
            }
        });
    }

    function moodOf(cust) {
        const ratio = cust.patience / cust.maxPatience;
        if (ratio < 0.3) return 'angry';
        if (ratio < 0.6) return 'worry';
        return 'happy';
    }

    function renderCustomers() {
        const container = document.getElementById('seats-container');
        const key = customerKey();
        if (key === GameState.lastCustomerKey && container.children.length) {
            updateCustomerMeters();
            syncServeHighlight();
            return;
        }
        GameState.lastCustomerKey = key;
        container.replaceChildren();

        GameState.customers.forEach((cust, index) => {
            const seat = document.createElement('div');
            seat.className = 'customer-slot';
            seat.dataset.seat = String(index);
            if (!cust) {
                seat.innerHTML = '<div class="empty-stool"><i class="fa-solid fa-chair"></i></div>';
            } else {
                const ratio = cust.patience / cust.maxPatience;
                const mood = moodOf(cust);
                const barColor = mood === 'angry' ? 'bg-red-600' : mood === 'worry' ? 'bg-yellow-500' : 'bg-emerald-500';
                const shakeClass = mood === 'angry' ? 'shake-angry' : '';
                const recipe = cust.order;
                seat.innerHTML = `
                    <button type="button" class="order-bubble game-btn" data-order-cook="${recipe.id}">① これを作る<br><i class="fa-solid ${recipe.icon} ${recipe.color}"></i> ${escapeText(recipe.name)}<span class="block text-[9px] text-red-700" data-wait>待てる時間 あと${Math.ceil(cust.patience)}秒</span></button>
                    <div class="customer-arrive diner-figure ${shakeClass}">${dinerSvg(cust.avatar, mood)}</div>
                    <div class="patience"><div data-patience class="${barColor} h-full progress-bar-fill" style="width:${ratio * 100}%"></div></div>
                    <button type="button" data-serve="${index}" class="serve-btn">③ わたす ¥${recipe.price}</button>`;
            }
            container.appendChild(seat);
        });
        syncServeHighlight();
    }

    function updateCustomerMeters() {
        GameState.customers.forEach((cust, index) => {
            if (!cust) return;
            const seat = document.querySelector(`[data-seat="${index}"]`);
            if (!seat) return;
            const ratio = cust.patience / cust.maxPatience;
            const wait = seat.querySelector('[data-wait]');
            const bar = seat.querySelector('[data-patience]');
            if (wait) wait.textContent = `待てる時間 あと${Math.ceil(Math.max(0, cust.patience))}秒`;
            if (bar) {
                bar.style.width = `${Math.max(0, ratio) * 100}%`;
                bar.className = `h-full progress-bar-fill ${ratio < 0.3 ? 'bg-red-600' : ratio < 0.6 ? 'bg-yellow-500' : 'bg-emerald-500'}`;
            }
        });
    }

    function syncServeHighlight() {
        const held = GameState.heldDish;
        GameState.customers.forEach((cust, index) => {
            const seat = document.querySelector(`[data-seat="${index}"]`);
            if (!seat || !cust) return;
            const match = !!(held && held.id === cust.order.id);
            seat.classList.toggle('is-match', match);
            const btn = seat.querySelector('[data-serve]');
            if (btn) {
                btn.classList.toggle('is-disabled', !match);
                btn.disabled = !match;
                btn.textContent = match ? `③ わたす ¥${cust.order.price}` : (held ? 'これは別の料理です' : '② 先に提供台へ盛る');
            }
        });
        const wanted = wantedRecipeIds();
        document.querySelectorAll('[data-recipe]').forEach((btn) => {
            btn.classList.toggle('is-wanted', wanted.has(btn.dataset.recipe));
        });
        const flow = document.getElementById('flow-step');
        if (flow) flow.textContent = coachText();
    }

    function coachText() {
        if (GameState.heldDish) return `③ 光っているお客に「${GameState.heldDish.name}」をわたす`;
        if (GameState.cookers.some((c) => c.status === 'ready')) return '② できた料理を押して提供台へ';
        if (GameState.cookers.some((c) => c.status === 'cooking')) return '炒め中。下の鉄鍋を押すと火柱！ できたら②へ';
        return '① お客の「これを作る」を押す';
    }

    function renderMenuButtons() {
        const container = document.getElementById('menu-buttons-container');
        container.replaceChildren();
        Object.values(MENU_DATA).forEach((recipe) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.dataset.recipe = recipe.id;
            btn.className = `game-btn menu-btn ${recipe.bgColor} border-2 border-amber-600/50 rounded-xl p-2 flex flex-col items-center justify-between shadow-md`;
            btn.innerHTML = `<div class="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-white w-full justify-center"><i class="fa-solid ${recipe.icon} ${recipe.color}"></i><span>${escapeText(recipe.name)}</span></div>
                <div class="flex justify-between w-full mt-2 text-[10px] text-amber-200"><span><i class="fa-solid fa-clock"></i> ${recipe.cookTime}s</span><span class="font-bold text-emerald-400">¥${recipe.price}</span></div>`;
            container.appendChild(btn);
        });
        syncServeHighlight();
    }

    function startCooking(recipeId) {
        if (!GameState.isPlaying) return;
        const cooker = GameState.cookers.find((c) => c.status === 'empty');
        if (!cooker) {
            showFloatingText('コンロがいっぱいです！', 'text-red-400');
            return;
        }
        cooker.status = 'cooking';
        cooker.recipe = MENU_DATA[recipeId];
        cooker.progress = 0;
        cooker.cookTimer = 0;
        SoundEngine.playCook();
        renderCookers();
    }

    function pickupDish(cookerId) {
        const cooker = GameState.cookers.find((c) => c.id === cookerId);
        if (!cooker || cooker.status !== 'ready') return;
        if (GameState.heldDish) {
            showFloatingText('提供台は1皿でいっぱいです！', 'text-amber-300');
            return;
        }
        GameState.heldDish = cooker.recipe;
        cooker.status = 'empty';
        cooker.recipe = null;
        renderCookers();
        updateHeaderUI();
        renderCustomers();
        showFloatingText(`${GameState.heldDish.name} を提供台へ`, 'text-emerald-300');
    }

    function discardBurnt(cookerId) {
        const cooker = GameState.cookers.find((c) => c.id === cookerId);
        if (!cooker || cooker.status !== 'burnt') return;
        const cost = cooker.recipe.cost;
        GameState.money = Math.max(0, GameState.money - cost);
        GameState.dayBurntLoss += cost;
        SoundEngine.playBurnt();
        showFloatingText(`焦げ破棄 -¥${cost}`, 'text-red-500');
        cooker.status = 'empty';
        cooker.recipe = null;
        updateHeaderUI();
        renderCookers();
    }

    function serveCustomer(seatIndex) {
        const cust = GameState.customers[seatIndex];
        if (!cust) return;
        if (GameState.heldDish && GameState.heldDish.id === cust.order.id) {
            flyPlate();
            serveCustomerWithDish(seatIndex, GameState.heldDish);
            GameState.heldDish = null;
            renderHeldDish();
            renderCustomers();
        } else {
            showFloatingText(`提供台に ${cust.order.name} がありません！`, 'text-red-400');
        }
    }

    function flyPlate() {
        const tray = document.getElementById('held-dish');
        if (!tray || !GameState.heldDish) return;
        const rect = tray.getBoundingClientRect();
        const el = document.createElement('div');
        el.className = `fly-plate ${GameState.heldDish.color}`;
        el.style.left = `${rect.left + rect.width / 2}px`;
        el.style.top = `${rect.top}px`;
        el.innerHTML = `<i class="fa-solid ${GameState.heldDish.icon}"></i>`;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 450);
    }

    function serveCustomerWithDish(seatIndex, recipe) {
        const cust = GameState.customers[seatIndex];
        if (!cust) return;
        GameState.money += recipe.price;
        GameState.daySales += recipe.price;
        GameState.servedCount++;
        SoundEngine.playServe();
        SoundEngine.playCoin();
        SNSReviews.fromServe(cust, recipe, GameState.daySearCount > 0);
        showFloatingText(`+¥${recipe.price.toLocaleString()} 満足！`, 'text-emerald-400');
        GameState.customers[seatIndex] = null;
        updateHeaderUI();
        renderCustomers();
    }

    function spawnCustomer() {
        const emptyIndices = GameState.customers.map((c, idx) => (c === null ? idx : null)).filter((idx) => idx !== null);
        if (emptyIndices.length === 0) return;
        const seated = GameState.customers.filter(Boolean).length;
        const maxSeats = GameState.day === 1 ? 2 : 3;
        if (seated >= maxSeats) return;
        const randomIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
        const recipes = Object.values(MENU_DATA);
        const basePatience = GameState.day === 1 ? 36 : GameState.day === 2 ? 30 : 26;
        GameState.customers[randomIndex] = {
            order: recipes[Math.floor(Math.random() * recipes.length)],
            avatar: CUSTOMER_AVATARS[Math.floor(Math.random() * CUSTOMER_AVATARS.length)],
            patience: basePatience,
            maxPatience: basePatience,
            lastMood: 'happy'
        };
        renderCustomers();
        syncServeHighlight();
    }

    let lastTickTime = Date.now();
    let loopId = 0;

    function gameLoop() {
        if (!GameState.isPlaying) return;
        const now = Date.now();
        const delta = (now - lastTickTime) / 1000;
        lastTickTime = now;

        let cookerDirty = false;
        GameState.cookers.forEach((cooker) => {
            if (cooker.status === 'cooking') {
                const searMul = GameState.searPulse > 0 ? 1.85 : 1;
                cooker.cookTimer += delta * GameState.cookSpeedMultiplier * searMul;
                cooker.progress = Math.min(100, (cooker.cookTimer / cooker.recipe.cookTime) * 100);
                if (cooker.cookTimer >= cooker.recipe.cookTime) {
                    cooker.status = 'ready';
                    cooker.burnTimer = 0;
                    cookerDirty = true;
                    SoundEngine.playDone();
                }
            } else if (cooker.status === 'ready') {
                cooker.burnTimer += delta;
                if (cooker.burnTimer >= cooker.recipe.burnTime) {
                    cooker.status = 'burnt';
                    cookerDirty = true;
                    SoundEngine.playBurnt();
                }
            }
        });

        GameState.customers.forEach((cust, index) => {
            if (!cust) return;
            cust.patience -= delta;
            const mood = moodOf(cust);
            if (cust.lastMood !== mood) {
                cust.lastMood = mood;
                GameState.lastCustomerKey = '';
            }
            if (cust.patience <= 0) customerLeavesAngry(index);
        });

        GameState.spawnCooldown -= delta;
        if (GameState.spawnCooldown <= 0) {
            spawnCustomer();
            GameState.spawnCooldown = GameState.day === 1 ? 8 : GameState.day === 2 ? 6.5 : 5.5;
        }

        GameState.searPulse = Math.max(0, GameState.searPulse - delta);
        if (cookerDirty) renderCookers();
        else updateCookerMeters();
        updateCustomerMeters();
        syncSearButton();
        loopId = requestAnimationFrame(gameLoop);
    }

    function customerLeavesAngry(seatIndex) {
        const cust = GameState.customers[seatIndex];
        if (!cust) return;
        const lossCost = cust.order.cost;
        GameState.money = Math.max(0, GameState.money - lossCost);
        GameState.dayIngredientLoss += lossCost;
        GameState.reputation--;
        GameState.angryCount++;
        SoundEngine.playAngry();
        SNSReviews.fromAngry(cust);
        showFloatingText(`怒破棄！材料費損失 -¥${lossCost}`, 'text-red-500 font-black');
        GameState.customers[seatIndex] = null;
        updateHeaderUI();
        renderCustomers();
        renderMenuButtons();
        if (GameState.reputation <= 0) gameOver();
    }

    function showFloatingText(text, colorClass) {
        const container = document.getElementById('floating-container');
        const el = document.createElement('div');
        el.className = `absolute floating-text font-black text-sm sm:text-lg ${colorClass} bg-black/80 px-3 py-1 rounded-full border border-white/20 shadow-xl pointer-events-none`;
        el.style.left = '50%';
        el.style.top = '28%';
        el.style.transform = 'translateX(-50%)';
        el.textContent = text;
        container.appendChild(el);
        setTimeout(() => el.remove(), 1000);
    }

    let dayTimerInterval = null;

    function startDay() {
        GameState.isPlaying = true;
        GameState.dayTimeLeft = 70;
        GameState.spawnCooldown = 7;
        GameState.daySales = 0;
        GameState.dayIngredientLoss = 0;
        GameState.dayBurntLoss = 0;
        GameState.heldDish = null;
        GameState.searPulse = 0;
        GameState.searReadyAt = 0;
        GameState.daySearCount = 0;
        initCookers();
        initCustomers();
        updateHeaderUI();
        renderCookers();
        renderCustomers();
        renderMenuButtons();
        document.getElementById('modal-overlay').classList.add('hidden');
        SNSReviews.queue = [];
        SNSReviews.welcome();
        if (kitchen) kitchen.resize();
        spawnCustomer();
        lastTickTime = Date.now();
        cancelAnimationFrame(loopId);
        loopId = requestAnimationFrame(gameLoop);
        if (dayTimerInterval) clearInterval(dayTimerInterval);
        dayTimerInterval = setInterval(() => {
            if (!GameState.isPlaying) return;
            GameState.dayTimeLeft--;
            updateHeaderUI();
            if (GameState.dayTimeLeft <= 0) {
                clearInterval(dayTimerInterval);
                finishDay();
            }
        }, 1000);
    }

    function finishDay() {
        GameState.isPlaying = false;
        if (GameState.daySales < GameState.targetMoney) {
            gameOver('売上未達', `日商 ¥${GameState.daySales.toLocaleString()}。目標の ¥${GameState.targetMoney.toLocaleString()} に届きませんでした。`);
            return;
        }
        document.getElementById('modal-overlay').classList.remove('hidden');
        document.getElementById('start-modal').classList.add('hidden');
        document.getElementById('gameover-modal').classList.add('hidden');
        document.getElementById('day-clear-modal').classList.remove('hidden');
        const netProfit = GameState.daySales - GameState.dayIngredientLoss - GameState.dayBurntLoss;
        const campaignClear = GameState.day >= 3;
        document.getElementById('day-clear-title').textContent = campaignClear ? '三ツ星飯店、誕生！' : `Day ${GameState.day} 目標達成！`;
        document.getElementById('day-clear-sub').textContent = campaignClear ? '3日連続で日商目標を達成。街一番の中華飯店になりました！' : `日商目標 ¥${GameState.targetMoney.toLocaleString()} を突破しました。`;
        document.getElementById('next-day-btn').textContent = campaignClear ? '三ツ星の営業をもう一度！' : '設備を整えて次の営業日へ！';
        document.getElementById('stat-sales').textContent = `¥${GameState.daySales.toLocaleString()}`;
        document.getElementById('stat-loss').textContent = `-¥${GameState.dayIngredientLoss.toLocaleString()}`;
        document.getElementById('stat-burnt-loss').textContent = `-¥${GameState.dayBurntLoss.toLocaleString()}`;
        document.getElementById('stat-profit').textContent = `¥${netProfit.toLocaleString()}`;
        renderShopItems();
    }

    function renderShopItems() {
        const container = document.getElementById('shop-items');
        container.replaceChildren();
        const items = [
            {
                name: 'コンロ増設 (+1)',
                cost: 3000,
                bought: GameState.cookerSlotsCount >= 4,
                action: () => {
                    if (GameState.money >= 3000 && GameState.cookerSlotsCount < 4) {
                        GameState.money -= 3000;
                        GameState.cookerSlotsCount++;
                        renderShopItems();
                        updateHeaderUI();
                    }
                }
            },
            {
                name: '火炎バーナー (調理速度+30%)',
                cost: 2500,
                bought: GameState.cookSpeedMultiplier > 1.0,
                action: () => {
                    if (GameState.money >= 2500 && GameState.cookSpeedMultiplier === 1.0) {
                        GameState.money -= 2500;
                        GameState.cookSpeedMultiplier = 1.3;
                        renderShopItems();
                        updateHeaderUI();
                    }
                }
            }
        ];
        items.forEach((item) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `game-btn p-2 rounded-xl border text-xs font-bold flex flex-col justify-between ${item.bought ? 'bg-gray-800 border-gray-600 text-gray-500 cursor-not-allowed' : 'bg-amber-900/50 border-chinaGold text-amber-200'}`;
            btn.disabled = item.bought || GameState.money < item.cost;
            btn.innerHTML = `<span>${escapeText(item.name)}</span><span class="mt-1 font-bold ${item.bought ? 'text-gray-500' : 'text-emerald-400'}">${item.bought ? '導入済み' : `¥${item.cost.toLocaleString()}`}</span>`;
            if (!btn.disabled) {
                btn.addEventListener('pointerdown', (e) => {
                    e.preventDefault();
                    tapFeedback(btn);
                    item.action();
                });
            }
            container.appendChild(btn);
        });
    }

    function gameOver(title = '経営破綻・閉店...', reason = '客の怒りが頂点に達し、評判がゼロになりました...') {
        GameState.isPlaying = false;
        if (dayTimerInterval) clearInterval(dayTimerInterval);
        document.getElementById('modal-overlay').classList.remove('hidden');
        document.getElementById('start-modal').classList.add('hidden');
        document.getElementById('day-clear-modal').classList.add('hidden');
        document.getElementById('gameover-modal').classList.remove('hidden');
        document.getElementById('gameover-title').textContent = title;
        document.getElementById('gameover-reason').textContent = reason;
        document.getElementById('go-days').textContent = `${GameState.day}日目`;
        document.getElementById('go-served').textContent = `${GameState.servedCount}人`;
        document.getElementById('go-left').textContent = `${GameState.angryCount}人`;
        SNSReviews.renderResult('go-reviews');
    }

    function resetCampaign() {
        GameState.day = 1;
        GameState.money = 0;
        GameState.targetMoney = 1600;
        GameState.reputation = 5;
        GameState.cookerSlotsCount = 3;
        GameState.cookSpeedMultiplier = 1.0;
        GameState.servedCount = 0;
        GameState.angryCount = 0;
    }

    function bindUi() {
        document.getElementById('cookers-container').addEventListener('pointerdown', (e) => {
            const pickup = e.target.closest('[data-pickup]');
            const discard = e.target.closest('[data-discard]');
            const card = e.target.closest('[data-cooker]');
            if (pickup) {
                e.preventDefault();
                tapFeedback(pickup);
                pickupDish(Number(pickup.dataset.pickup));
                return;
            }
            if (discard) {
                e.preventDefault();
                tapFeedback(discard);
                discardBurnt(Number(discard.dataset.discard));
                return;
            }
            if (card) {
                const cooker = GameState.cookers.find((c) => c.id === Number(card.dataset.cooker));
                if (cooker && cooker.status === 'ready') {
                    e.preventDefault();
                    tapFeedback(card);
                    pickupDish(cooker.id);
                }
            }
        });

        document.getElementById('seats-container').addEventListener('pointerdown', (e) => {
            const cookBtn = e.target.closest('[data-order-cook]');
            if (cookBtn) {
                e.preventDefault();
                tapFeedback(cookBtn);
                startCooking(cookBtn.dataset.orderCook);
                return;
            }
            const btn = e.target.closest('[data-serve]');
            if (!btn) return;
            e.preventDefault();
            tapFeedback(btn);
            serveCustomer(Number(btn.dataset.serve));
        });

        document.getElementById('menu-buttons-container').addEventListener('pointerdown', (e) => {
            const btn = e.target.closest('[data-recipe]');
            if (!btn) return;
            e.preventDefault();
            tapFeedback(btn);
            startCooking(btn.dataset.recipe);
        });

        document.getElementById('start-game-btn').addEventListener('pointerdown', (e) => {
            e.preventDefault();
            tapFeedback(e.currentTarget);
            Tone.start();
            startDay();
        });

        document.getElementById('next-day-btn').addEventListener('pointerdown', (e) => {
            e.preventDefault();
            tapFeedback(e.currentTarget);
            if (GameState.day >= 3) resetCampaign();
            else {
                GameState.day++;
                GameState.targetMoney += 700;
            }
            startDay();
        });

        document.getElementById('restart-game-btn').addEventListener('pointerdown', (e) => {
            e.preventDefault();
            tapFeedback(e.currentTarget);
            resetCampaign();
            startDay();
        });

        document.getElementById('sound-toggle').addEventListener('pointerdown', (e) => {
            e.preventDefault();
            tapFeedback(e.currentTarget);
            SoundEngine.enabled = !SoundEngine.enabled;
            document.getElementById('sound-icon').className = SoundEngine.enabled ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
        });

        const searBtn = document.getElementById('sear-btn');
        const sear = (e) => {
            e.preventDefault();
            tapFeedback(searBtn);
            applySear();
        };
        searBtn.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            sear(e);
        });
        document.getElementById('wok-bay').addEventListener('pointerdown', sear);
    }

    window.addEventListener('DOMContentLoaded', () => {
        SoundEngine.init();
        kitchen = new HighHeatKitchen(document.getElementById('flame-stage'));
        bindUi();
    });
})();
