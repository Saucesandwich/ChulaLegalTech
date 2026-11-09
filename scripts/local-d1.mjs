import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';

export function openLocalD1() {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(new URL('../drizzle/0000_hiring.sql', import.meta.url), 'utf8'));
  db.exec(readFileSync(new URL('../drizzle/0001_demo_privacy.sql', import.meta.url), 'utf8'));
  return {
    prepare(sql) {
      const query = db.prepare(sql);
      const bind = (...params) => ({
        first: () => query.get(...params) ?? null,
        run: () => ({ meta: query.run(...params) }),
        execute: () => {
          if (query.columns().length) return { results: query.all(...params) };
          return { meta: query.run(...params) };
        }
      });
      return { ...bind(), bind };
    },
    batch(statements) {
      db.exec('BEGIN');
      try {
        const results = statements.map(statement => statement.execute());
        db.exec('COMMIT');
        return results;
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    }
  };
}
