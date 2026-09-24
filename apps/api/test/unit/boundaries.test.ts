import { readdirSync, readFileSync, statSync } from 'fs';
import { dirname, join, normalize, relative } from 'path';
import { describe, expect, it } from 'vitest';

const root = join(__dirname, '../../src/modules');

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return files(path);
    return path.endsWith('.ts') ? [path] : [];
  });
}

describe('module boundaries', () => {
  const sources = files(root);

  it('keeps domain code free of frameworks and other modules', () => {
    const domainFiles = sources.filter((file) => file.includes('/domain/'));
    for (const file of domainFiles) {
      const text = readFileSync(file, 'utf8');
      expect(text, relative(root, file)).not.toMatch(/@nestjs|@prisma|prisma|razorpay|nodemailer/);
      const relativeImports = [...text.matchAll(/from '(\.[^']+)'/g)].map((match) => match[1]);
      for (const specifier of relativeImports) {
        const allowed = specifier.startsWith('./') || specifier.endsWith('/shared/domain-error');
        expect(allowed, `${relative(root, file)} imports ${specifier}`).toBe(true);
      }
    }
  });

  it('stops a context from importing another context infrastructure', () => {
    for (const file of sources) {
      const text = readFileSync(file, 'utf8');
      const moduleName = relative(root, file).split('/')[0];
      const imports = [...text.matchAll(/from '([^']+)'/g)].map((match) => match[1]);
      for (const specifier of imports) {
        if (!specifier.includes('/modules/') && !specifier.startsWith('../')) continue;
        const normalized = specifier.replace(/\\/g, '/');
        const cross = normalized.match(/(?:modules\/|\.\.\/\.\.\/)([a-z-]+)\/(infrastructure|interface)/);
        if (!cross) continue;
        expect(cross[1], `${relative(root, file)} -> ${specifier}`).toBe(moduleName);
      }
    }
  });

  it('allows cross-context calls only through checkout ports or Nest module wiring', () => {
    for (const file of sources) {
      const rel = relative(root, file);
      const moduleName = rel.split('/')[0];
      const text = readFileSync(file, 'utf8');
      const specifiers = [...text.matchAll(/from '(\.[^']+)'/g)].map((match) => match[1]);
      for (const specifier of specifiers) {
        const resolved = normalize(join(dirname(file), specifier));
        const other = relative(root, resolved).split('/')[0];
        if (!other || other === moduleName || other.startsWith('..')) continue;
        const intoInfrastructure = resolved.includes(`${other}/infrastructure`) || resolved.includes(`${other}/interface`);
        expect(intoInfrastructure, `${rel} -> ${specifier}`).toBe(false);
        const allowed = rel.startsWith('checkout/application/') || rel.endsWith('.module.ts');
        expect(allowed, `${rel} -> ${specifier}`).toBe(true);
      }
    }
  });
});
