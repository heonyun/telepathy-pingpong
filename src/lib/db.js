import { kv } from '@vercel/kv';
import { createClient } from '@vercel/kv';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'local-db.json');

// Helper to simulate KV locally with JSON file
const localDb = {
    async hset(key, field, value) {
        let data = {};
        if (fs.existsSync(DATA_FILE)) {
            try {
                data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
            } catch (e) {
                console.error('Local DB read error', e);
            }
        }
        if (!data[key]) data[key] = {};

        // Support hset(key, { field: value }) signature
        const obj = (typeof field === 'object' && value === undefined) ? field : { [field]: value };

        data[key] = { ...data[key], ...obj };
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return Object.keys(obj).length;
    },
    async hgetall(key) {
        if (fs.existsSync(DATA_FILE)) {
            try {
                const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
                return data[key] || null;
            } catch (e) {
                return null;
            }
        }
        return null;
    },
    async expire(key, seconds) {
        return 1;
    },
    async exists(key) {
        if (fs.existsSync(DATA_FILE)) {
            const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
            return data[key] ? 1 : 0;
        }
        return 0;
    }
};

// Create client specifically for Upstash URL/Token if present
let client = localDb;

if (process.env.KV_REST_API_URL) {
    client = kv;
} else if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.log('Using Upstash Redis');
    client = createClient({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
}

export const db = client;
