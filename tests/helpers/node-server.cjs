const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const root = path.resolve(__dirname, '../..');
async function startNodeServer(t) {
    const directory = await fs.mkdtemp(
        path.join(os.tmpdir(), 'anivoid-security-')
    );
    const stateFile = path.join(directory, 'state.json');
    await fs.writeFile(
        stateFile,
        JSON.stringify({
            revision: 0,
            friends: [],
            activities: [],
            studioLogos: {},
            registeredUsers: [
                {
                    username: 'Felipe!',
                    email: 'owner@example.invalid',
                    password: 'LocalFixtureOnly123',
                    friends: [],
                    friendRequests: [],
                    notifications: []
                },
                {
                    username: 'Ana',
                    email: 'ana@example.invalid',
                    password: 'LocalFixtureOnly123',
                    friends: [],
                    friendRequests: [],
                    notifications: []
                }
            ],
            animes: [
                {
                    id: 'a1',
                    title: 'Fixture',
                    ratings: { ana: { overall: 9 } },
                    comments: [
                        {
                            id: 'c1',
                            friendId: 'ana',
                            comment: 'Original',
                            replies: []
                        }
                    ]
                }
            ]
        })
    );
    const child = spawn(process.execPath, ['server.js'], {
        cwd: root,
        windowsHide: true,
        env: {
            ...process.env,
            PORT: '0',
            DATABASE_URL: '',
            STATE_FILE: stateFile,
            DATA_DIR: directory,
            ADMIN_USERS: 'felipe',
            ALLOWED_ORIGINS: 'https://anime-ratings.pages.dev',
            EMAIL_VERIFICATION_API_KEY: '',
            EMAIL_FROM: '',
            PASSWORD_ITERATIONS: '100000'
        }
    });
    let logs = '';
    child.stderr.on('data', (chunk) => {
        logs += chunk;
    });
    t.after(async () => {
        if (child.exitCode === null) {
            child.kill();
            await once(child, 'exit');
        }
        if (
            path.dirname(directory) === os.tmpdir() &&
            path.basename(directory).startsWith('anivoid-security-')
        )
            await fs.rm(directory, { recursive: true, force: true });
    });
    const origin = await new Promise((resolve, reject) => {
        let output = '';
        const timeout = setTimeout(
            () => reject(new Error('Node fixture startup timed out')),
            10000
        );
        child.stdout.on('data', (chunk) => {
            output += chunk;
            const match = output.match(
                /Server running at http:\/\/localhost:(\d+)/
            );
            if (match) {
                clearTimeout(timeout);
                resolve('http://127.0.0.1:' + match[1]);
            }
        });
        child.once('error', (error) => {
            clearTimeout(timeout);
            reject(error);
        });
        child.once('exit', (code) => {
            clearTimeout(timeout);
            reject(new Error('Node fixture exited ' + code + ': ' + logs));
        });
    });
    const send = (url, body, cookie = '', extra = {}) =>
        fetch(origin + url, {
            method: body === undefined ? 'GET' : 'POST',
            headers: {
                ...(body === undefined
                    ? {}
                    : {
                          Origin: 'https://anime-ratings.pages.dev',
                          'Content-Type': 'application/json'
                      }),
                ...(cookie ? { Cookie: cookie } : {}),
                ...extra
            },
            ...(body === undefined ? {} : { body: JSON.stringify(body) })
        });
    return { origin, send, stateFile };
}
module.exports = { startNodeServer };
