const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN;

const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const NOW_PLAYING_ENDPOINT = 'https://api.spotify.com/v1/me/player/currently-playing';
const RECENTLY_PLAYED_ENDPOINT = 'https://api.spotify.com/v1/me/player/recently-played?limit=1';

async function getAccessToken() {
    const basic = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');

    const response = await fetch(TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${basic}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: SPOTIFY_REFRESH_TOKEN,
        }),
    });

    return response.json();
}

async function getNowPlaying(accessToken) {
    const response = await fetch(NOW_PLAYING_ENDPOINT, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (response.status === 204 || response.status > 400) return null;
    return response.json();
}

async function getRecentlyPlayed(accessToken) {
    const response = await fetch(RECENTLY_PLAYED_ENDPOINT, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (response.status !== 200) return null;
    const data = await response.json();
    return data.items?.[0]?.track || null;
}

function truncate(str, len) {
    return str.length > len ? str.slice(0, len) + '...' : str;
}

function generateSVG(track, isPlaying) {
    const title = truncate(track?.name || 'Not Playing', 30);
    const artist = truncate(track?.artists?.map(a => a.name).join(', ') || 'Spotify', 35);
    const albumArt = track?.album?.images?.[0]?.url || '';

    return `<svg width="400" height="130" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <defs>
        <clipPath id="albumClip"><rect x="15" y="15" width="100" height="100" rx="10"/></clipPath>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#1a1a2e"/><stop offset="100%" style="stop-color:#16213e"/>
        </linearGradient>
    </defs>
    <rect width="400" height="130" rx="15" fill="url(#bg)"/>
    <rect x="1" y="1" width="398" height="128" rx="14" fill="none" stroke="#1DB954" stroke-opacity="0.3"/>
    ${albumArt ? `<image x="15" y="15" width="100" height="100" xlink:href="${albumArt}" clip-path="url(#albumClip)" preserveAspectRatio="xMidYMid slice"/>` :
            `<rect x="15" y="15" width="100" height="100" rx="10" fill="#282828"/><text x="65" y="70" text-anchor="middle" fill="#1DB954" font-size="40">♪</text>`}
    <text x="130" y="40" fill="#fff" font-family="Arial" font-size="16" font-weight="600">${title}</text>
    <text x="130" y="62" fill="#b3b3b3" font-family="Arial" font-size="13">${artist}</text>
    <g transform="translate(130, 80)">
        ${isPlaying ?
            `<circle cx="6" cy="6" r="4" fill="#1DB954"><animate attributeName="opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite"/></circle>
        <text x="16" y="10" fill="#1DB954" font-family="Arial" font-size="11">Now Playing</text>` :
            `<circle cx="6" cy="6" r="4" fill="#b3b3b3"/><text x="16" y="10" fill="#b3b3b3" font-family="Arial" font-size="11">Recently Played</text>`}
    </g>
    <path transform="translate(360, 95)" d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" fill="#1DB954"/>
</svg>`;
}

module.exports = async function handler(req, res) {
    try {
        const { access_token } = await getAccessToken();

        let track = null;
        let isPlaying = false;

        const nowPlaying = await getNowPlaying(access_token);

        if (nowPlaying && nowPlaying.is_playing) {
            track = nowPlaying.item;
            isPlaying = true;
        } else {
            track = await getRecentlyPlayed(access_token);
        }

        const svg = generateSVG(track, isPlaying);

        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');
        res.status(200).send(svg);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
};
