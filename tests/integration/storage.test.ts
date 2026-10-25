import { afterEach, describe, expect, it } from 'vitest';
import { openDB } from 'idb';
import { IndexedDbStorage, MemoryStorage } from '../../src/storage/db';
import { emptyData, type Profile } from '../../src/storage/schema';
import { parseImport, serializeExport } from '../../src/storage/exportImport';

const NOW = '2026-03-01T10:00:00.000Z';
const profile: Profile = {
  instrument: 'classical',
  experience: 'none',
  goal: 'chords-songs',
  genres: ['pop', 'fado-tradicional'],
  sessionMinutes: 20,
  daysPerWeek: 4,
  a4: 440,
  createdAt: NOW,
  updatedAt: NOW,
};

let n = 0;
const dbName = () => `test-db-${++n}-${Math.random()}`;
const opened: IndexedDbStorage[] = [];
afterEach(() => {
  opened.splice(0).forEach((s) => s.close());
});
async function open(name: string) {
  const s = await IndexedDbStorage.open(name);
  opened.push(s);
  return s;
}

describe('persistência IndexedDB', () => {
  it('guarda e recupera os dados depois de fechar e reabrir', async () => {
    const name = dbName();
    const a = await open(name);
    await a.saveProfile(profile);
    await a.putLesson({ lessonId: 'l1-1', completedAt: NOW });
    await a.addAttempt({ id: 'a1', skillId: 'strings', at: NOW, correct: 7, total: 8, durationSec: 60 });
    await a.addPractice({ id: 'p1', day: '2026-03-01', seconds: 600, source: 'exercise', label: 'Cordas' });
    a.close();

    const b = await open(name);
    const { data, invalidRecords } = await b.loadAll();
    expect(invalidRecords).toBe(0);
    expect(data.profile).toEqual(profile);
    expect(data.lessons).toEqual([{ lessonId: 'l1-1', completedAt: NOW }]);
    expect(data.attempts).toHaveLength(1);
    expect(data.practice[0]!.seconds).toBe(600);
  });

  it('recusa gravar dados inválidos', async () => {
    const s = await open(dbName());
    await expect(s.saveProfile({ ...profile, sessionMinutes: 9999 })).rejects.toThrow();
    await expect(s.addAttempt({ id: 'x', skillId: 'strings', at: NOW, correct: 9, total: 8, durationSec: 1 })).rejects.toThrow();
  });

  it('ignora (sem apagar) registos corrompidos e reporta quantos são', async () => {
    const name = dbName();
    const s = await open(name);
    await s.putLesson({ lessonId: 'l1-1', completedAt: NOW });
    s.close();
    const raw = await openDB(name);
    await raw.put('lessons', { lessonId: 'l1-2', completedAt: 'ontem' });
    await raw.put('meta', { instrument: 'banjo' }, 'profile');
    raw.close();
    const again = await open(name);
    const { data, invalidRecords } = await again.loadAll();
    expect(invalidRecords).toBe(2);
    expect(data.lessons.map((l) => l.lessonId)).toEqual(['l1-1']);
    expect(data.profile).toBeNull();
    again.close();
    const check = await openDB(name);
    expect(await check.count('lessons')).toBe(2);
    check.close();
  });

  it('substitui tudo numa só transação e apaga tudo quando pedido', async () => {
    const s = await open(dbName());
    await s.putLesson({ lessonId: 'l1-1', completedAt: NOW });
    const replacement = { ...emptyData(), profile, lessons: [{ lessonId: 'l2-1', completedAt: NOW }] };
    await s.replaceAll(replacement);
    let { data } = await s.loadAll();
    expect(data.lessons.map((l) => l.lessonId)).toEqual(['l2-1']);
    expect(data.profile?.instrument).toBe('classical');
    await s.clearAll();
    ({ data } = await s.loadAll());
    expect(data).toEqual(emptyData());
  });

  it('o armazenamento em memória tem o mesmo comportamento', async () => {
    const m = new MemoryStorage();
    await m.saveProfile(profile);
    await m.putLesson({ lessonId: 'l1-1', completedAt: NOW });
    await m.putLesson({ lessonId: 'l1-1', completedAt: NOW });
    const { data } = await m.loadAll();
    expect(data.lessons).toHaveLength(1);
    await m.clearAll();
    expect((await m.loadAll()).data.profile).toBeNull();
  });
});

describe('exportação e importação', () => {
  const data = {
    ...emptyData(),
    profile,
    lessons: [{ lessonId: 'l1-1', completedAt: NOW }],
    attempts: [{ id: 'a1', skillId: 'strings', at: NOW, correct: 7, total: 8, durationSec: 60 }],
    practice: [{ id: 'p1', day: '2026-03-01', seconds: 900, source: 'exercise' as const, label: 'x' }],
  };

  it('ida e volta preserva os dados', async () => {
    const text = serializeExport(data, new Date(NOW));
    const r = parseImport(text);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.file.data).toEqual(data);
    expect(r.summary).toEqual({ exportedAt: NOW, hasProfile: true, lessons: 1, attempts: 1, practiceMinutes: 15, songs: 0 });

    const s = await open(dbName());
    await s.replaceAll(r.file.data);
    expect((await s.loadAll()).data).toEqual(data);
  });

  it.each([
    ['não JSON', 'isto não é json', /JSON válido/],
    ['array', '[]', /objeto JSON/],
    ['outra aplicação', JSON.stringify({ app: 'outra', schemaVersion: 1 }), /não foi exportado/],
    ['versão futura', JSON.stringify({ app: 'braco-guitarra', schemaVersion: 99, exportedAt: NOW, data: {} }), /versão mais recente/],
    ['sem versão', JSON.stringify({ app: 'braco-guitarra' }), /Versão/],
    ['campos extra', JSON.stringify({ app: 'braco-guitarra', schemaVersion: 1, exportedAt: NOW, data: { ...emptyData(), hack: '<script>' } }), /inválidos/],
    ['tipos errados', JSON.stringify({ app: 'braco-guitarra', schemaVersion: 1, exportedAt: NOW, data: { ...emptyData(), lessons: [{ lessonId: '<img onerror=x>', completedAt: NOW }] } }), /inválidos/],
  ])('rejeita ficheiro com %s', (_label, text, msg) => {
    const r = parseImport(text);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(msg);
  });

  it('rejeita ficheiros demasiado grandes', () => {
    const r = parseImport('x'.repeat(6 * 1024 * 1024));
    expect(r.ok).toBe(false);
  });

  it('rejeita registos duplicados', () => {
    const dup = { ...data, attempts: [data.attempts[0]!, data.attempts[0]!] };
    const r = parseImport(serializeExport(dup));
    expect(r.ok).toBe(false);
  });

  it('não é afetado por __proto__ no JSON', () => {
    const text = `{"app":"braco-guitarra","schemaVersion":1,"exportedAt":"${NOW}","__proto__":{"polluted":true},"data":${JSON.stringify(emptyData())}}`;
    const r = parseImport(text);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(r.ok).toBe(false);
  });
});

describe('músicas importadas (esquema v2)', () => {
  const song = {
    id: 'song-1',
    title: 'Canção',
    artist: 'Eu',
    genre: 'pop' as const,
    year: null,
    chordpro: '{title: Canção}\n[C]Olá [G]mundo\n',
    createdAt: NOW,
    updatedAt: NOW,
  };

  it('guarda, lista e apaga músicas', async () => {
    const name = dbName();
    const a = await open(name);
    await a.putSong(song);
    a.close();
    const b = await open(name);
    expect((await b.loadAll()).data.songs).toEqual([song]);
    await b.deleteSong('song-1');
    expect((await b.loadAll()).data.songs).toEqual([]);
    await expect(b.putSong({ ...song, chordpro: '' })).rejects.toThrow();
  });

  it('migra uma base de dados v1 sem perder dados', async () => {
    const name = dbName();
    const v1 = await openDB(name, 1, {
      upgrade(db) {
        db.createObjectStore('meta');
        db.createObjectStore('lessons', { keyPath: 'lessonId' });
        db.createObjectStore('skills', { keyPath: 'skillId' });
        db.createObjectStore('attempts', { keyPath: 'id' });
        db.createObjectStore('practice', { keyPath: 'id' });
        db.createObjectStore('chordChanges', { keyPath: 'id' });
        db.createObjectStore('planDays', { keyPath: 'day' });
      },
    });
    await v1.put('meta', profile, 'profile');
    await v1.put('meta', { metronomeBpm: 90, metronomeSignature: '4/4', metronomeAccent: true, metronomeVolume: 0.5 }, 'settings');
    await v1.put('lessons', { lessonId: 'l1-1', completedAt: NOW });
    v1.close();

    const s = await open(name);
    const { data, invalidRecords } = await s.loadAll();
    expect(invalidRecords).toBe(0);
    expect(data.profile).toEqual(profile);
    expect(data.settings?.metronomeBpm).toBe(90);
    expect(data.lessons).toHaveLength(1);
    expect(data.songs).toEqual([]);
    await s.putSong(song);
    expect((await s.loadAll()).data.songs).toHaveLength(1);
  });

  it('importa ficheiros v1 (sem músicas)', () => {
    const { songs: _omit, ...v1data } = emptyData();
    void _omit;
    const r = parseImport(JSON.stringify({ app: 'braco-guitarra', schemaVersion: 1, exportedAt: NOW, data: { ...v1data, profile } }));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.file.schemaVersion).toBe(2);
      expect(r.file.data.songs).toEqual([]);
    }
  });

  it('exporta e importa músicas; rejeita duplicadas', () => {
    const data = { ...emptyData(), profile, songs: [song] };
    const r = parseImport(serializeExport(data));
    expect(r.ok && r.file.data.songs).toEqual([song]);
    expect(r.ok && r.summary.songs).toBe(1);
    expect(parseImport(serializeExport({ ...data, songs: [song, song] })).ok).toBe(false);
  });
});
