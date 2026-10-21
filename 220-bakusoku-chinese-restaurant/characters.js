const CUSTOMER_AVATARS = [
    { id: 'salary', name: 'サラリーマン', hair: '#2c2118', skin: '#e8b48a', cloth: '#2a4668', accent: '#c9b27a', lip: '#b56a52' },
    { id: 'gal', name: 'ギャル', hair: '#4a1f63', skin: '#f0c2a4', cloth: '#c4336a', accent: '#f2d36b', lip: '#d24b6a' },
    { id: 'oyaji', name: '頑固オヤジ', hair: '#6a6560', skin: '#d3a07a', cloth: '#3f4f2e', accent: '#8b4a24', lip: '#9a5a44' },
    { id: 'okami', name: '女将さん', hair: '#1b1410', skin: '#e3b089', cloth: '#8a1c28', accent: '#e6d094', lip: '#b85a58' },
    { id: 'student', name: '学生', hair: '#3a271c', skin: '#ebc09a', cloth: '#2d5d86', accent: '#f3f1ec', lip: '#c07868' },
    { id: 'tourist', name: '観光客', hair: '#b56b2a', skin: '#f3ccae', cloth: '#e25a2e', accent: '#2aa9a0', lip: '#c86a58' }
];

let dinerUid = 0;

function dinerSvg(avatar, mood) {
    const uid = `p${++dinerUid}`;
    const skin = avatar.skin;
    const hair = avatar.hair;
        const mouth = mood === 'angry'
        ? `<path d="M41 56 Q50 52 59 56" fill="none" stroke="${avatar.lip}" stroke-width="1.6" stroke-linecap="round"/>`
        : mood === 'worry'
            ? `<path d="M42 55 Q50 54 58 55" fill="none" stroke="${avatar.lip}" stroke-width="1.5" stroke-linecap="round"/>`
            : `<path d="M42 54 Q50 58 58 54" fill="none" stroke="${avatar.lip}" stroke-width="1.6" stroke-linecap="round"/>`;
    const brows = mood === 'angry'
        ? '<path d="M38 40 L46 43M62 40 L54 43" stroke="#3a2418" stroke-width="1.7" stroke-linecap="round"/>'
        : mood === 'worry'
            ? '<path d="M38 41 Q43 39 47 42M62 41 Q57 39 53 42" fill="none" stroke="#3a2418" stroke-width="1.4" stroke-linecap="round"/>'
            : '<path d="M38 42 Q43 40 47 42M62 42 Q57 40 53 42" fill="none" stroke="#3a2418" stroke-width="1.4" stroke-linecap="round"/>';
    const extras = dinerExtras(avatar, uid);
    return `<svg class="diner-svg" viewBox="0 0 100 148" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
            <linearGradient id="${uid}-skin" x1="30" y1="22" x2="68" y2="60">
                <stop offset="0" stop-color="${skin}"/><stop offset=".55" stop-color="${skin}"/><stop offset="1" stop-color="${skin}"/>
            </linearGradient>
            <linearGradient id="${uid}-cloth" x1="20" y1="70" x2="80" y2="130">
                <stop offset="0" stop-color="${avatar.accent}" stop-opacity=".35"/><stop offset=".2" stop-color="${avatar.cloth}"/><stop offset="1" stop-color="${avatar.cloth}"/>
            </linearGradient>
        </defs>
        <ellipse cx="50" cy="142" rx="22" ry="4" fill="#000" opacity=".22"/>
        <path d="M22 78 Q16 100 22 128 L78 128 Q84 100 78 78 Q50 88 22 78Z" fill="url(#${uid}-cloth)"/>
        <path d="M40 80 L50 112 L60 80" fill="${avatar.accent}" opacity=".45"/>
        <path d="M16 96 Q8 106 16 116 Q30 108 36 98 Z" fill="url(#${uid}-cloth)"/>
        <path d="M84 96 Q92 106 84 116 Q70 108 64 98 Z" fill="url(#${uid}-cloth)"/>
        <ellipse cx="24" cy="114" rx="8" ry="4" fill="${skin}"/>
        <ellipse cx="76" cy="114" rx="8" ry="4" fill="${skin}"/>
        <path d="M44 62 Q50 66 56 62 L54 78 Q50 81 46 78 Z" fill="${skin}"/>
        <ellipse cx="34" cy="48" rx="3" ry="4.4" fill="${skin}"/>
        <ellipse cx="66" cy="48" rx="3" ry="4.4" fill="${skin}"/>
        <ellipse cx="50" cy="46" rx="18" ry="20" fill="url(#${uid}-skin)"/>
        <path d="${hairBack(avatar)}" fill="${hair}"/>
        <ellipse cx="43" cy="47" rx="2.8" ry="3.1" fill="#fff"/>
        <ellipse cx="57" cy="47" rx="2.8" ry="3.1" fill="#fff"/>
        <ellipse cx="43.3" cy="47.3" rx="1.5" ry="1.8" fill="#2a1a14"/>
        <ellipse cx="57.3" cy="47.3" rx="1.5" ry="1.8" fill="#2a1a14"/>
        <circle cx="44" cy="46.6" r="0.5" fill="#fff"/>
        <circle cx="58" cy="46.6" r="0.5" fill="#fff"/>
        <path d="M49 50 Q50 53 51.2 50.2" fill="none" stroke="#b47a62" stroke-width="1.1" stroke-linecap="round"/>
        ${brows}${mouth}
        <ellipse cx="41" cy="53" rx="3.6" ry="1.8" fill="#d98978" opacity=".22"/>
        <ellipse cx="59" cy="53" rx="3.6" ry="1.8" fill="#d98978" opacity=".22"/>
        <path d="${hairFront(avatar)}" fill="${hair}"/>
        ${extras}
    </svg>`;
}

function hairBack(avatar) {
    if (avatar.id === 'oyaji') return 'M32 42 Q36 24 50 22 Q64 24 68 42 L66 34 Q50 26 34 34 Z';
    if (avatar.id === 'okami') return 'M31 46 Q30 20 50 18 Q70 20 69 46 L67 30 Q50 16 33 30 Z';
    if (avatar.id === 'gal') return 'M29 48 Q28 18 50 16 Q72 18 71 48 L69 28 Q50 14 31 28 Z';
    return 'M31 46 Q30 20 50 19 Q70 20 69 46 L66 30 Q50 18 34 30 Z';
}

function hairFront(avatar) {
    if (avatar.id === 'oyaji') return 'M35 36 Q50 30 65 36 Q58 35 50 35 Q42 35 35 36 Z';
    if (avatar.id === 'okami') return 'M33 34 Q50 24 67 34 Q59 32 50 26 Q41 32 33 34 Z';
    if (avatar.id === 'gal') return 'M32 33 Q41 28 50 32 Q59 28 68 33 Q61 30 50 24 Q39 30 32 33 Z';
    if (avatar.id === 'tourist') return 'M33 34 Q50 24 67 34 Q58 31 50 30 Q42 31 33 34 Z';
    return 'M34 34 Q43 28 50 31 Q57 28 66 34 Q58 30 50 29 Q42 30 34 34 Z';
}

function dinerExtras(avatar, uid) {
    if (avatar.id === 'salary') {
        return `<path d="M36 46 Q43 44 47 48" fill="none" stroke="#2b2418" stroke-width="1.2"/>
            <path d="M53 48 Q57 44 64 46" fill="none" stroke="#2b2418" stroke-width="1.2"/>
            <rect x="46" y="82" width="8" height="16" fill="${avatar.accent}" opacity=".8"/>`;
    }
    if (avatar.id === 'gal') {
        return `<circle cx="32" cy="54" r="1.6" fill="${avatar.accent}"/><circle cx="68" cy="54" r="1.6" fill="${avatar.accent}"/>`;
    }
    if (avatar.id === 'oyaji') {
        return `<path d="M44 57 Q50 60 56 57" fill="none" stroke="#5c534c" stroke-width="1.6" stroke-linecap="round"/>`;
    }
    if (avatar.id === 'okami') {
        return `<circle cx="50" cy="14" r="3.2" fill="${avatar.accent}"/><circle cx="50" cy="14" r="1.4" fill="#8a1c28"/>`;
    }
    if (avatar.id === 'student') {
        return `<rect x="44" y="88" width="12" height="7" rx="1" fill="${avatar.accent}"/>`;
    }
    return `<circle cx="72" cy="78" r="4" fill="${avatar.accent}" opacity=".7"/>`;
}

function faceMark(avatar) {
    return `<svg viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="18" cy="20" r="12" fill="${avatar.skin}"/>
        <path d="M8 18 Q10 8 18 7 Q26 8 28 18" fill="${avatar.hair}"/>
        <ellipse cx="14" cy="20" rx="1.5" ry="1.8" fill="#2a1a14"/>
        <ellipse cx="22" cy="20" rx="1.5" ry="1.8" fill="#2a1a14"/>
    </svg>`;
}
